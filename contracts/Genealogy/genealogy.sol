// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FamilyNFT} from "./familyNFT.sol";
import {FamilyTypes} from "./FamilyTypes.sol";

contract Genealogy {
    mapping(address => address) private _clanIds;
    mapping(address => address) private _owners;

    event ClanCreated(
        address indexed creatorAddress,
        address indexed nftAddress
    );
    event ClanRemovedFromOwned(address indexed clanId);
    event ChangeClanOwner(address newOwner, address clanId);

    function createClan(
        string memory clanName,
        string memory ancestorName,
        string memory ancestorDesc,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate
    ) external {
        require(_clanIds[msg.sender] == address(0), "Clan existed");
        FamilyNFT familyNFT = new FamilyNFT(
            clanName,
            ancestorName,
            ancestorDesc,
            birthDate,
            deathDate,
            msg.sender
        );
        address clanId = address(familyNFT);
        _clanIds[msg.sender] = clanId;
        _owners[clanId] = msg.sender;
        emit ClanCreated(msg.sender, clanId);
    }


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
