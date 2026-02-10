// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FamilyNFT} from "./familyNFT.sol";
import {FamilyTypes} from "./types/FamilyTypes.sol";

contract Genealogy {

    mapping(address => address) private _clanIds;
    mapping(address => address) private _owners;

    event ClanCreated(address indexed nftAddress, string name);
    event ClanRemovedFromOwned(address indexed clanId);
    event ClanReconnected(address indexed subCollection, address indexed upperCollection, bytes32 upperId);

    function createClan(string calldata clanName, string calldata ancestorName, string calldata ancestorDesc, uint256 birthTimestamp, uint256 deathTimestamp) external {
        require(_clanIds[msg.sender] == address(0), "Clan existed");
        FamilyNFT familyNFT = new FamilyNFT(clanName, ancestorName, ancestorDesc, birthTimestamp, deathTimestamp, msg.sender);
        address clanId = address(familyNFT);
        _clanIds[msg.sender] = clanId;
        _owners[clanId] = msg.sender;
        emit ClanCreated(clanId, clanName);
    }

    event ChangeClanOwner(address newOwner, address clanId);
    function changeClanOwner(address newOwner, address clanId) external {
        require(_clanIds[msg.sender] == clanId, "Only owner");
        _clanIds[newOwner] = clanId;
        _owners[clanId] = newOwner;
        _clanIds[msg.sender] = address(0);
        FamilyNFT(payable(clanId)).transferGenealogyOwner(newOwner);
        emit ChangeClanOwner(newOwner, clanId);
    }

    function removeClanFromOwned(address clanId) external {
        require(_clanIds[msg.sender] == clanId, "Not the owner");
        _clanIds[msg.sender] = address(0);
        emit ClanRemovedFromOwned(clanId);
    }

    function getClanId(address owner) external view returns (address) {
        return _clanIds[owner];
    }

    function getClanOwner(address clanId) external view returns (address) {
        return _owners[clanId];
    }

}