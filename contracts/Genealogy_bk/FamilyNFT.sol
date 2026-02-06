// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";
import {_LSP4_METADATA_KEY, _LSP4_TOKEN_TYPE_COLLECTION} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {FamilyTypes} from "./types/FamilyTypes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title FamilyNFT
/// @notice LSP8 collection đại diện cho một gia tộc, mỗi thành viên là một token (person)
contract FamilyNFT is LSP8IdentifiableDigitalAsset {
    using Counters for Counters.Counter;

    Counters.Counter public personCount;
    mapping(bytes32 => FamilyTypes.Person) public persons;
    address public immutable creator;

    event PersonCreated(bytes32 indexed personId, string name, address ownership);
    event SpouseAdded(bytes32 indexed personId, bytes32 indexed spouseId, uint256 marriedAt);
    event ChildAdded(bytes32 indexed childId, bytes32 indexed fatherId, bytes32 indexed motherId, FamilyTypes.ChildType childType);
    event ClanLinked(bytes32 indexed personId, address clanAddress, FamilyTypes.LinkType linkType);

    modifier onlyAuthorized(bytes32 personId) {
        FamilyTypes.Person storage p = persons[personId];
        require(p.ownership != address(0), "Person does not exist");
        require(msg.sender == creator || msg.sender == p.ownership, "Not authorized");
        _;
    }

    constructor(string memory clanName, string memory clanSymbol, address owner)
        LSP8IdentifiableDigitalAsset(
            clanName,
            clanSymbol,
            owner,
            _LSP4_TOKEN_TYPE_COLLECTION,
            _LSP8_TOKENID_FORMAT_NUMBER
        )
    {
        creator = owner;
        _createRootPerson(owner);
    }

    function _createRootPerson(address owner) private {
        _createNewPerson("", owner, FamilyTypes.Sex.UNDEFINE, 0);
    }

    function addSpouse(
        bytes32 personId,
        string calldata name,
        uint256 birthTimestamp,
        uint256 marriedAt,
        address spouseWallet,
        FamilyTypes.Sex sex
    ) external onlyAuthorized(personId) {
        bytes32 spouseId = _createNewPerson(name, spouseWallet, sex, birthTimestamp);

        persons[personId].spouses.push(FamilyTypes.Spouse({
            spouseId: spouseId,
            marriedAt: marriedAt,
            divorcedAt: 0
        }));
        persons[spouseId].spouses.push(FamilyTypes.Spouse({
            spouseId: personId,
            marriedAt: marriedAt,
            divorcedAt: 0
        }));

        emit SpouseAdded(personId, spouseId, marriedAt);
    }

    function addChild(
        string calldata name,
        FamilyTypes.Sex sex,
        uint256 birthTimestamp,
        bytes32 fatherId,
        bytes32 motherId,
        address childWallet,
        FamilyTypes.ChildType childType
    ) external {
        FamilyTypes.Person storage father = persons[fatherId];
        FamilyTypes.Person storage mother = persons[motherId];
        require(father.ownership != address(0), "Father does not exist");
        require(mother.ownership != address(0), "Mother does not exist");

        bool authorized = msg.sender == creator ||
            msg.sender == father.ownership ||
            msg.sender == mother.ownership;
        require(authorized, "Not authorized");

        bytes32 childId = _createNewPerson(name, childWallet, sex, birthTimestamp);

        father.children.push(FamilyTypes.Child({childType: childType, childId: childId}));
        mother.children.push(FamilyTypes.Child({childType: childType, childId: childId}));
        persons[childId].fatherId = fatherId;
        persons[childId].motherId = motherId;

        emit ChildAdded(childId, fatherId, motherId, childType);
    }

    function addClanLink(
        bytes32 personId,
        address clanAddress,
        bytes32 clanId,
        FamilyTypes.LinkType linkType
    ) external onlyAuthorized(personId) {
        FamilyTypes.Person storage p = persons[personId];
        p.clanLink = FamilyTypes.ClanLink({
            clanAddress: clanAddress,
            clanId: clanId,
            linkType: linkType
        });
        p.isLinked = true;

        emit ClanLinked(personId, clanAddress, linkType);
    }

    function updateProfileData(bytes32 personId) external onlyAuthorized(personId) {
        persons[personId].profileCID = _getDataForTokenId(personId, _LSP4_METADATA_KEY);
    }

    function _createNewPerson(
        string memory name,
        address ownership,
        FamilyTypes.Sex sex,
        uint256 birthTimestamp
    ) private returns (bytes32 personId) {
        personCount.increment();
        personId = bytes32(personCount.current());

        _mint(ownership, personId, true, "");

        FamilyTypes.Person storage p = persons[personId];
        p.name = name;
        p.ownership = ownership;
        p.sex = sex;
        p.birthTimestamp = birthTimestamp;

        emit PersonCreated(personId, name, ownership);
    }
}