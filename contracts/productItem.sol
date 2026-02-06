// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import { _LSP8_TOKENID_FORMAT_NUMBER } from '@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol';
import {_LSP4_METADATA_KEY, _LSP4_TOKEN_TYPE_COLLECTION} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";

contract ProductItem is LSP8IdentifiableDigitalAsset {
    uint8 private _count;
    address private _brandAddress;
    constructor(
        string memory collectionName_,
        string memory collectionSymbol_,
        address newOwner_,
        bytes memory lsp4MetadataURIOfCollection_,
        bytes [] memory lsp4MetadataURIOfItems_
    )
        LSP8IdentifiableDigitalAsset(
            collectionName_,
            collectionSymbol_,
            newOwner_,
            _LSP4_TOKEN_TYPE_COLLECTION,
            _LSP8_TOKENID_FORMAT_NUMBER
        )
    {
        _brandAddress = newOwner_;
        // set the lsp4MetadataURI
        _setData(_LSP4_METADATA_KEY, lsp4MetadataURIOfCollection_);
        _createProdItem(lsp4MetadataURIOfItems_);
    }

    // create a list new product item
    // event CreateProdItem (address owner, bytes32[] tokenIds);
    function _createProdItem(bytes[] memory lsp4MetadataURIs) private {
        uint256 length = lsp4MetadataURIs.length;
        bytes32[] memory tokenIds_ = new bytes32[](length);
        for (uint256 i = 0; i < length; i++)
        {
            _count++;
            tokenIds_[i] = bytes32(uint256(uint160(_count)));
            _mint(_brandAddress, tokenIds_[i], true, "");
            _setDataForTokenId(tokenIds_[i], _LSP4_METADATA_KEY, lsp4MetadataURIs[i]);
        }
        // emit CreateProdItem (msg.sender, tokenIds_);
    }
}