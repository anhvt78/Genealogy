// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/presets/LSP7Mintable.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/extensions/LSP7Burnable.sol";
import {_LSP4_TOKEN_TYPE_TOKEN, _LSP4_METADATA_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
// import {LSP4DigitalAssetMetadata} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4DigitalAssetMetadata.sol";

contract M2C is LSP7Mintable, LSP7Burnable {
    address private daoAddress; //DAO smct address
    uint256 private maxSupply = 100000000;
    address private _operator;

    constructor(address operator) LSP7Mintable("M2C Token", "M2C", msg.sender, _LSP4_TOKEN_TYPE_TOKEN, true) 
    // ERC20("M2C Token", "M2C") 
    {
        daoAddress = msg.sender;
        _operator = operator;
        // _mint(operator, 1000000); // 1000.000 token đầu tiên được sử dụng để xây dựng phát triển dự án và các thương hiệu
        _mint(operator, 1000000 * 10**decimals(), true, "");
    }

    // Override mint từ LSP7Mintable để thêm logic onlyDAO và maxSupply
    function mint(
        address to,
        uint256 amount,
        bool allowNonLSP1Recipient,
        bytes memory data
    ) public override onlyDAO {
        require(totalSupply() + amount <= maxSupply, "Exceed supply limit");
        // Luôn mint vào daoAddress thay vì 'to' arbitrary
        _mint(to, amount * 10**decimals(), allowNonLSP1Recipient, data);
    }

    function setMetaData(bytes memory lsp4MetadataURI_) public {
        require(msg.sender == _operator, "Only Operator");
        _setData(_LSP4_METADATA_KEY, lsp4MetadataURI_);
    }

    function getLimitSupply() public view returns (uint256) {
        return maxSupply;
    }

    modifier onlyDAO() {
        require(msg.sender == daoAddress, "Caller is not DAO");
        _;
    }
}
