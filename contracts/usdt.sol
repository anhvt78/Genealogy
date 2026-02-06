// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";
// import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/extensions/LSP7Burnable.sol";
import {_LSP4_TOKEN_TYPE_TOKEN, _LSP4_METADATA_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
// import {LSP4DigitalAssetMetadata} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4DigitalAssetMetadata.sol";

contract USDT is LSP7DigitalAsset {

// Override hàm decimals từ LSP7 để set 6 (chuẩn USDT)
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    constructor() LSP7DigitalAsset("USDT Token only for test", "USDT", msg.sender, _LSP4_TOKEN_TYPE_TOKEN, true) 
    // ERC20("M2C Token", "M2C") 
    {
    }

    // Override mint từ LSP7Mintable để thêm logic onlyDAO và maxSupply
    function mint(
        uint256 amount
    ) public {
        _mint(msg.sender, amount * 10**decimals(), true, "0x");
    }

    function setMetaData(bytes memory lsp4MetadataURI_) public {
        _setData(_LSP4_METADATA_KEY, lsp4MetadataURI_);
    }
}
