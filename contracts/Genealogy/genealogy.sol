// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FamilyNFT} from "./FamilyNFT.sol";
import {FamilyTypes} from "./types/FamilyTypes.sol";

contract Genealogy {


    mapping(address => address) private _clanIds;

    event ClanCreated(address indexed nftAddress, string name);
    event ClanRemovedFromOwned(address indexed clanId);
    event ClanReconnected(address indexed subCollection, address indexed upperCollection, bytes32 upperId);

    function createClan(string calldata clanName, string calldata ancestorName, uint256 birthTimestamp, uint256 deathTimestamp) external {
        require(_clanIds[msg.sender] == address(0), "Clan existed");
        FamilyNFT familyNFT = new FamilyNFT(clanName, ancestorName,birthTimestamp, deathTimestamp, msg.sender);
        address nftAddr = address(familyNFT);
        _clanIds[msg.sender] = nftAddr;
        
        emit ClanCreated(nftAddr, clanName);
    }

    event ChangeClanOwner(address newOwner, address clanId);
    function changeClanOwner(address newOwner, address clanId) external {
        require(_clanIds[msg.sender] == clanId, "Only owner");
        _clanIds[newOwner] = clanId;
        _clanIds[msg.sender] = address(0);
        FamilyNFT(payable(clanId)).transferGenealogyOwner(newOwner);
        // FamilyNFT(payable(clanId)).transferAncestor(newOwner);
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

}