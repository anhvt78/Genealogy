// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";
import {_LSP4_TOKEN_TYPE_COLLECTION} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {FamilyTypes} from "./types/FamilyTypes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FamilyNFT is LSP8IdentifiableDigitalAsset {
    using Counters for Counters.Counter;

    Counters.Counter public personCount;
    mapping(bytes32 => FamilyTypes.Person) public persons;

    address public genealogyAddress;

    event PersonCreated(bytes32 indexed personId, string name, address ownership);
    event SpouseAdded(bytes32 indexed husbanId, bytes32 indexed spouseId, uint256 marriedAt);
    event ChildAdded(bytes32 indexed childId, bytes32 indexed fatherId, FamilyTypes.ChildType childType);

    constructor(string memory clanName,  string memory ancestorName, string memory descShort, uint256 birthTimestamp, uint256 deathTimestamp, address owner)
        LSP8IdentifiableDigitalAsset(clanName, "FAMILY", owner, _LSP4_TOKEN_TYPE_COLLECTION, _LSP8_TOKENID_FORMAT_NUMBER)
    {
        genealogyAddress = msg.sender;
        _createNewPerson(ancestorName, descShort, owner, FamilyTypes.Sex.MALE, birthTimestamp, deathTimestamp);
    }


    function addSpouse(
        bytes32 husbanId,
        string calldata name,
        string calldata descShort,
        uint256 birthTimestamp,
        uint256 deathTimestamp,
        uint256 marriedAt,
        uint256 divorcedAt,
        address ownership
    ) external onlyAuthorized(husbanId) {
        bytes32 spouseId = _createNewPerson(name, descShort, ownership, FamilyTypes.Sex.FEMALE, birthTimestamp, deathTimestamp);
        persons[spouseId].spouses.push(FamilyTypes.Spouse({spouseId: spouseId, marriedAt: marriedAt, divorcedAt: divorcedAt}));
        emit SpouseAdded(husbanId, spouseId, marriedAt);
    }

    event SpouseRemoved(bytes32 indexed spouseId, bytes32 indexed husbanId);
    function removeSpouse(
        bytes32 spouseId,
        bytes32 husbanId
    ) external onlyAuthorized(husbanId) {
        FamilyTypes.Person storage husban = persons[husbanId];

        for (uint256 i = 0; i < husban.spouses.length; i++) {
            if (husban.spouses[i].spouseId == spouseId) {
                // Swap với phần tử cuối và pop
                uint256 lastIndex = husban.spouses.length - 1;
                if (i != lastIndex) {
                    husban.spouses[i] = husban.spouses[lastIndex];
                }
                husban.spouses.pop();

                emit SpouseRemoved(spouseId, husbanId);
                return;
            }
        }

        revert("Spouse not found");
    }

    function addChild(
        string calldata childName,
        string calldata descShort,
        FamilyTypes.Sex sex,
        uint256 birthTimestamp,
        uint256 deathTimestamp,
        bytes32 fatherId,
        bytes32 motherId,
        address ownership,
        FamilyTypes.ChildType childType
    ) external onlyAuthorized(fatherId){
        FamilyTypes.Person storage father = persons[fatherId];

        bytes32 childId = _createNewPerson(childName, descShort, ownership, sex, birthTimestamp, deathTimestamp);

        father.children.push(FamilyTypes.Child({childType: childType, childId: childId}));
        persons[childId].fatherId = fatherId;
        persons[childId].motherId = motherId;
        emit ChildAdded(childId, fatherId, childType);
    }

    event ChildRemoved(bytes32 indexed childId, bytes32 indexed parentId);
    function removeChild(
        bytes32 parentId,
        bytes32 childId
    ) external onlyAuthorized(parentId) {
        FamilyTypes.Person storage parent = persons[parentId];
        FamilyTypes.Person storage child = persons[childId];

        require(child.fatherId == parentId, "Not child of this person");
        for (uint256 i = 0; i < parent.children.length; i++) {
            if (parent.children[i].childId == childId) {
                // Swap với phần tử cuối và pop
                uint256 lastIndex = parent.children.length - 1;
                if (i != lastIndex) {
                    parent.children[i] = parent.children[lastIndex];
                }
                parent.children.pop();
                child.fatherId = bytes32(0);

                emit ChildRemoved(childId, parentId);
                return;
            }
        }

        revert("Child not found");
    }

    function _createNewPerson(
        string memory name,
        string memory descShort,
        address ownership,
        FamilyTypes.Sex sex,
        uint256 birthTimestamp, 
        uint256 deathTimestamp
    ) private returns(bytes32 personId) {
        personCount.increment();
        personId = bytes32(personCount.current());
        _mint(ownership, personId, true, "");

        FamilyTypes.Person storage p = persons[personId];
        p.name = name;
        p.ownership = ownership;
        p.sex = sex;
        p.birthTimestamp = birthTimestamp;
        p.deathTimestamp = deathTimestamp;

        _setDataForTokenId(personId, keccak256("ClanName"), bytes(name));
        _setDataForTokenId(personId, keccak256("ClanShortDescription"), bytes(descShort));

        emit PersonCreated(personId, name, ownership);
    }

    event PersonNameUpdated(bytes32 indexed personId, string oldName, string newName);
    event PersonBirthUpdated(bytes32 indexed personId, uint256 oldBirth, uint256 newBirth);
    event PersonDeathUpdated(bytes32 indexed personId, uint256 oldDeath, uint256 newDeath);
    event PersonSexUpdated(bytes32 indexed personId, FamilyTypes.Sex oldSex, FamilyTypes.Sex newSex);
    event PersonOwnershipTransferred(bytes32 indexed personId, address oldOwner, address newOwner);


    function updatePersonName(bytes32 personId, string calldata newName) 
        external onlyAuthorized(personId) 
    {
        FamilyTypes.Person storage p = persons[personId];
        string memory oldName = p.name;
        p.name = newName;
        emit PersonNameUpdated(personId, oldName, newName);
    }

    function updatePersonBirth(bytes32 personId, uint256 newBirthTimestamp) 
        external onlyAuthorized(personId) 
    {
        require(newBirthTimestamp > 0, "Invalid birth timestamp");
        FamilyTypes.Person storage p = persons[personId];
        uint256 old = p.birthTimestamp;
        p.birthTimestamp = newBirthTimestamp;
        emit PersonBirthUpdated(personId, old, newBirthTimestamp);
    }

    function updatePersonDeath(bytes32 personId, uint256 newDeathTimestamp) 
        external onlyAuthorized(personId) 
    {
        FamilyTypes.Person storage p = persons[personId];
        uint256 old = p.deathTimestamp;
        p.deathTimestamp = newDeathTimestamp;
        emit PersonDeathUpdated(personId, old, newDeathTimestamp);
    }

    function transferPersonOwnership(bytes32 personId, address newOwner) 
        external onlyAuthorized(personId) 
    {
        require(newOwner != address(0), "Invalid new owner");
        FamilyTypes.Person storage p = persons[personId];
        address oldOwner = p.ownership;

        _transfer(oldOwner, newOwner, personId, true, "");
        p.ownership = newOwner;

        emit PersonOwnershipTransferred(personId, oldOwner, newOwner);
    }

    function transferGenealogyOwner(
        address newOwner
        ) public  {
            require(msg.sender == genealogyAddress, "Not permit");
            _transferOwnership(newOwner);
    }

    function setDataForTokenId(
        bytes32 tokenId,
        bytes32 dataKey,
        bytes memory dataValue
        ) public virtual override onlyAuthorized(tokenId){
            _setDataForTokenId(tokenId, dataKey, dataValue);
    }


    modifier onlyAuthorized(bytes32 tokenId) { 
        address _tokenOwner = tokenOwnerOf(tokenId);
        require(msg.sender == _tokenOwner || msg.sender == owner() , "Not authorized");
        _;
    }
}