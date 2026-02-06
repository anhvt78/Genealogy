// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {_LSP4_METADATA_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {FamilyNFT} from "./FamilyNFT.sol";
import {FamilyTypes} from "./types/FamilyTypes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Genealogy
/// @notice Contract quản lý các Clan (gia tộc), mỗi clan là một bộ sưu tập FamilyNFT riêng biệt
contract Genealogy {
    using Counters for Counters.Counter;

    mapping (address => mapping (uint256 => address)) private _clanIds; //brand -> id -> collectionId
    mapping (address => mapping(address => uint256)) private _clanIndex; // brand -> collectionId -> id
    mapping (address => Counters.Counter) private _clanCount;

    event ClanCreated(uint256 indexed index, address indexed nftAddress, string name);
    event ClanProfileUpdated(uint256 indexed clanId, string name, bytes profileCID);
    event ClanRemovedFromOwned(address indexed clanId);

    /// @notice Tạo một clan mới kèm theo deployment FamilyNFT riêng
    function createClan(string calldata clanName, string calldata clanSymbol) external {
        _clanCount[msg.sender].increment();
        uint256 newIndex = _clanCount[msg.sender].current();

        FamilyNFT familyNFT = new FamilyNFT(clanName, clanSymbol, msg.sender);
        address nftAddr = address(familyNFT);

        _clanIds[msg.sender][newIndex] = nftAddr;
        _clanIndex[msg.sender][nftAddr] = newIndex;
        
        emit ClanCreated(newIndex, nftAddr, clanName);
    }

    function removeClanFromOwned(address clanId) external {
        require(_clanIndex[msg.sender][clanId] != 0, "Invalid clanId");

        uint256 index = _clanIndex[msg.sender][clanId];
        uint256 lastIndex = _clanCount[msg.sender].current();
        address lastClanId = _clanIds[msg.sender][lastIndex];
        if (index != lastIndex) 
        {
            _clanIds[msg.sender][index] = lastClanId;
            _clanIndex[msg.sender][lastClanId] = index;
        }
        delete _clanIds[msg.sender][lastIndex];
        delete _clanIndex[msg.sender][clanId];
        _clanCount[msg.sender].decrement();

        emit ClanRemovedFromOwned(clanId);
    }

}