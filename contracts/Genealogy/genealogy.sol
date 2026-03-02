// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Counters.sol";

import {FamilyNFT} from "./familyNFT.sol";
import {FamilyTypes} from "./FamilyTypes.sol";

contract Genealogy {
    using Counters for Counters.Counter;
    mapping(address => address) private _clanIds;
    mapping(address => address) private _owners;
    Counters.Counter public clanCounter;
    event ClanCreated(
        address indexed creatorAddress,
        address indexed nftAddress
    );
    event ClanRemovedFromOwned(address sender, address indexed clanId);
    event ChangeClanOwner(address newOwner, address clanId);

    function createClan(
        string memory clanName,
        string memory clanShortDesc,
        string memory ancestorName,
        string memory ancestorShortDesc,
        FamilyTypes.DateInfo memory birthDate, 
        FamilyTypes.DateInfo memory deathDate
    ) external {
        require(_clanIds[msg.sender] == address(0), "Clan existed");
        FamilyNFT familyNFT = new FamilyNFT(
            clanName,
            clanShortDesc,
            ancestorName,
            ancestorShortDesc,
            birthDate,
            deathDate,
            msg.sender
        );
        address clanId = address(familyNFT);
        _clanIds[msg.sender] = clanId;
        _owners[clanId] = msg.sender;
        clanCounter.increment();
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
        clanCounter.decrement();
        emit ClanRemovedFromOwned(msg.sender, clanId);
    }

    function getClanId(address owner) external view returns (address) {
        return _clanIds[owner];
    }

    function getClanOwner(address clanId) external view returns (address) {
        return _owners[clanId];
    }
}
