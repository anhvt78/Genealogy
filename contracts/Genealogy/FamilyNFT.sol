// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";
import {_LSP4_TOKEN_TYPE_COLLECTION} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";

import {FamilyTypes} from "./FamilyTypes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FamilyNFT is LSP8IdentifiableDigitalAsset {
    using Counters for Counters.Counter;

    Counters.Counter public personCount;
    mapping(bytes32 => FamilyTypes.Person) public persons;

    address public genealogyAddress;
    string public clanShortDesc;

    event PersonCreated(bytes32 indexed personId, address ownership);
    event SpouseAdded(bytes32 indexed husbanId, bytes32 indexed spouseId);
    event ChildAdded(bytes32 indexed childId, bytes32 indexed fatherId);
    event ClanShortDescChanged(address indexed owner);
    event UpdatePersonData(bytes32 indexed personId);

    constructor(string memory clanName, 
            string memory clanDesc,
            string memory ancestorName,
            string memory ancestorShortDesc,
            FamilyTypes.DateInfo memory birthDate,
            FamilyTypes.DateInfo memory deathDate, 
            address owner)
        LSP8IdentifiableDigitalAsset(clanName, "FAMILY", owner, _LSP4_TOKEN_TYPE_COLLECTION, _LSP8_TOKENID_FORMAT_NUMBER)
    {
        genealogyAddress = msg.sender;
        clanShortDesc = clanDesc;
        _createNewPerson(ancestorName, ancestorShortDesc, owner, FamilyTypes.Sex.MALE, birthDate, deathDate);
    }

    function updatePersonData (bytes32 personId, string memory newName, string memory newDescShort, FamilyTypes.Sex sex, FamilyTypes.DateInfo memory birthDate, FamilyTypes.DateInfo memory deathDate) external onlyAuthorized(personId) {
        FamilyTypes.Person storage p = persons[personId];
        p.name =newName;
        p.birthDate = birthDate;
        p.deathDate = deathDate;
        p.sex = sex;
        p.shortDesc = newDescShort;
        emit UpdatePersonData(personId);
    }

    function setClanShortDesc ( string memory newClanShortDesc ) external onlyOwner {
        clanShortDesc = newClanShortDesc;
        emit ClanShortDescChanged(owner());
    }

    function addSpouse(
        bytes32 husbanId,
        string memory name,
        string memory descShort,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        FamilyTypes.DateInfo memory marriedDate,
        FamilyTypes.DateInfo memory divorcedDate,
        address ownership
    ) external onlyAuthorized(husbanId) {
        bytes32 spouseId = _createNewPerson(name, descShort, ownership, FamilyTypes.Sex.FEMALE, birthDate, deathDate);
        persons[spouseId].spouses.push(FamilyTypes.Spouse({spouseId: spouseId, marriedDate: marriedDate, divorcedDate: divorcedDate}));
        emit SpouseAdded(husbanId, spouseId);
    }

    event SpouseRemoved(bytes32 indexed spouseId, bytes32 indexed husbanId);
    function removeSpouse(
        bytes32 spouseId,
        bytes32 husbanId
    ) external onlyAuthorized(husbanId) {
        FamilyTypes.Person storage husban = persons[husbanId];

        for (uint256 i = 0; i < husban.spouses.length; i++) {
            if (husban.spouses[i].spouseId == spouseId) {
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
        string memory childName,
        string memory shortDesc,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bytes32 fatherId,
        bytes32 motherId,
        address owner,
        FamilyTypes.ChildType childType
    ) external onlyAuthorized(fatherId){
    
        FamilyTypes.Person storage father = persons[fatherId];

        bytes32 childId = _createNewPerson(childName, shortDesc, owner, sex, birthDate, deathDate);

        father.children.push(FamilyTypes.Child({childType: childType, childId: childId}));
        persons[childId].fatherId = fatherId;
        persons[childId].motherId = motherId;
        emit ChildAdded(childId, fatherId);
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
        string memory shortDesc,
        address owner,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate, 
        FamilyTypes.DateInfo memory deathDate
    ) private returns(bytes32 personId) {
        personCount.increment();
        personId = bytes32(personCount.current());
        _mint(owner, personId, true, "");

        FamilyTypes.Person storage p = persons[personId];
        p.name =name;
        p.birthDate = birthDate;
        p.deathDate = deathDate;
        p.sex = sex;
        p.shortDesc = shortDesc;

        emit PersonCreated(personId, owner);
    }

    // event SetDeathDate(bytes32 indexed personId);

    // function setDeathDate(bytes32 personId, FamilyTypes.DateInfo memory newDeathDate) 
    //     external onlyAuthorized(personId) 
    // {
    //     FamilyTypes.Person storage p = persons[personId];
       
    //     p.deathDate = newDeathDate;

    //     emit SetDeathDate(personId);
    // }

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