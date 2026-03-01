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
    mapping(bytes32 => FamilyTypes.Person) private persons;

    address public genealogyAddress;
    string public clanShortDesc;

    event PersonCreated(bytes32 indexed personId, address ownership);
    event SpouseAdded(bytes32 indexed husbandId, bytes32 indexed spouseId);
    event ChildAdded(bytes32 indexed fatherId, bytes32 indexed childId);
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

    function updatePersonData (bytes32 personId, string memory newName, string memory newDescShort, FamilyTypes.DateInfo memory birthDate, FamilyTypes.DateInfo memory deathDate) external onlyAuthorized(personId) {
        FamilyTypes.Person storage p = persons[personId];
        p.name =newName;
        p.birthDate = birthDate;
        p.deathDate = deathDate;
        p.shortDesc = newDescShort;
        emit UpdatePersonData(personId);
    }

    function setClanShortDesc ( string memory newClanShortDesc ) external onlyOwner {
        clanShortDesc = newClanShortDesc;
        emit ClanShortDescChanged(owner());
    }

    function addSpouse(
        bytes32 husbandId,
        string memory name,
        string memory descShort,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate
    ) external onlyAuthorized(husbandId) {
        bytes32 spouseId = _createNewPerson(name, descShort, msg.sender, FamilyTypes.Sex.FEMALE, birthDate, deathDate);

        persons[husbandId].spouses.push(spouseId);
        emit SpouseAdded(husbandId, spouseId);
    }

    event SpouseRemoved(bytes32 indexed husbandId, bytes32 indexed spouseId);
    function removeSpouse(
        bytes32 husbandId, bytes32 spouseId
    ) external onlyAuthorized(husbandId) {
        FamilyTypes.Person storage husband = persons[husbandId];

        for (uint256 i = 0; i < husband.spouses.length; i++) {
            if (husband.spouses[i] == spouseId) {
                uint256 lastIndex = husband.spouses.length - 1;
                if (i != lastIndex) {
                    husband.spouses[i] = husband.spouses[lastIndex];
                }
                husband.spouses.pop();

                emit SpouseRemoved(husbandId, spouseId);
                return;
            }
        }

        revert("Spouse not found");
    }

    function addChild(
        bytes32 fatherId,
        string memory childName,
        string memory shortDesc,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate
        
    ) external onlyAuthorized(fatherId){
    
        FamilyTypes.Person storage father = persons[fatherId];

        bytes32 childId = _createNewPerson(childName, shortDesc, msg.sender, sex, birthDate, deathDate);

        father.children.push(childId);
        persons[childId].fatherId = fatherId;
        emit ChildAdded(fatherId, childId);
    }

    event ChildRemoved(bytes32 indexed parentId, bytes32 indexed childId);
    function removeChild(
        bytes32 parentId,
        bytes32 childId
    ) external onlyAuthorized(parentId) {
        FamilyTypes.Person storage parent = persons[parentId];
        FamilyTypes.Person storage child = persons[childId];

        require(child.fatherId == parentId, "Not child of this person");
        for (uint256 i = 0; i < parent.children.length; i++) {
            if (parent.children[i] == childId) {
                // Swap với phần tử cuối và pop
                uint256 lastIndex = parent.children.length - 1;
                if (i != lastIndex) {
                    parent.children[i] = parent.children[lastIndex];
                }
                parent.children.pop();
                child.fatherId = bytes32(0);

                emit ChildRemoved(parentId, childId);
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


    function getPersonInfo(bytes32 personId) external view returns (FamilyTypes.Person memory) {
    return persons[personId];
    }


    modifier onlyAuthorized(bytes32 tokenId) { 
        address _tokenOwner = tokenOwnerOf(tokenId);
        require(msg.sender == _tokenOwner || msg.sender == owner() , "Not authorized");
        _;
    }
}