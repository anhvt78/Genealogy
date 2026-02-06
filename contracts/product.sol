// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Counters.sol";
// import {LSP8IdentifiableDigitalAsset as LSP8} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {ProductItem} from "./productItem.sol";

contract Product {
    using Counters for Counters.Counter;

    mapping (address => mapping (uint256 => address)) private _productIds; //brand -> id -> collectionId
    mapping (address => mapping(address => uint256)) private _productIndex; // brand -> collectionId -> id
    mapping (address => Counters.Counter) private _productCount;

    mapping (address => mapping (address => mapping (uint256 => bytes32))) private _productItemIds; //brand -> collectionId -> id -> itemId
    mapping (address => mapping (address => mapping (bytes32 => uint256))) private _productItemIndex; //brand -> collectionId -> itemId -> id 
    mapping (address => mapping (address => Counters.Counter)) private _productItemIdCount;

    // Events
    event ProductCreated(address indexed brand, address indexed productId);
    event ProductAdded(address indexed brand, address indexed productId);
    event ProductRemoved(address indexed brand, address indexed productId);
    event ProductItemAdded(address indexed brand, address indexed productId, bytes32[] itemIds);
    event ProductItemRemoved(address indexed brand, address indexed productId, bytes32[] itemIds);

    function createProduct(string memory productName, string memory productSymbol, bytes memory lsp4MetadataCollectionURI, bytes [] memory lsp4MetadataItemsURI) public 
    {
        ProductItem productItem = new ProductItem(productName, productSymbol, msg.sender, lsp4MetadataCollectionURI, lsp4MetadataItemsURI);
        address productId = (address(productItem));

        _productCount[msg.sender].increment();
        uint256 newIndex = _productCount[msg.sender].current();
        _productIds[msg.sender][newIndex] = productId;
        _productIndex[msg.sender][productId] = newIndex;

        bytes32[] memory productItemIds = ProductItem(payable(productId)).tokenIdsOf(msg.sender);


        for (uint256 i; i < productItemIds.length; i++) {
            _addProdItemId(msg.sender, productId, productItemIds[i]);
        }

        emit ProductCreated(msg.sender, productId);
    }

    // event ProductAdded(address indexed brand, address product);
    function addProduct(address productId) public {
        require(productId != address(0), "Invalid product address");
        require(ProductItem(payable(productId)).owner() == msg.sender, "Not product owner");
        require(_productIndex[msg.sender][productId] == 0, "Product already exists");

        _addProduct(msg.sender, productId);


        bytes32[] memory productItems = ProductItem(payable(productId)).tokenIdsOf(msg.sender);
        
        for (uint256 i = 0; i < productItems.length; i++) {
            require(_productItemIndex[msg.sender][productId][productItems[i]] == 0, "Product item existed");
            _addProdItemId(msg.sender, productId, productItems[i]);
        }

        emit ProductAdded(msg.sender, productId);

    }

    function addProductItemId(address productId, bytes32[] memory productItemIds) public {
        require(ProductItem(payable(productId)).owner() == msg.sender, "Invalid product item");  

        if (_productIndex[msg.sender][productId] == 0)
        {
            _addProduct(msg.sender, productId);
        }
        for (uint256 i; i < productItemIds.length; i++) {
            require(ProductItem(payable(productId)).tokenOwnerOf(productItemIds[i]) == msg.sender, "Invalid product item");
            require(_productItemIndex[msg.sender][productId][productItemIds[i]] == 0, "Product item existed");
            _addProdItemId(msg.sender, productId, productItemIds[i]);
        }

        emit ProductItemAdded(msg.sender, productId, productItemIds);
    }

    function _addProduct (address brand, address productId) private {
        _productCount[brand].increment();
        uint256 newIndex = _productCount[brand].current();
        _productIds[brand][newIndex] = productId;
        _productIndex[brand][productId] = newIndex;
    }
     
    function _addProdItemId(address brand, address productId, bytes32 productItemId) private {
        _productItemIdCount[brand][productId].increment();
        uint256 newIndex = _productItemIdCount[brand][productId].current();
        _productItemIds[brand][productId][newIndex] = productItemId;
        _productItemIndex[brand][productId][productItemId] = newIndex;
    }

    function removeProductItemId(address productId, bytes32[] memory productItemIds) public {
        for (uint256 i; i < productItemIds.length; i++) 
        {
            require(ProductItem(payable(productId)).tokenOwnerOf(productItemIds[i]) == msg.sender, "Invalid product item");
            require(_productItemIndex[msg.sender][productId][productItemIds[i]] != 0, "Product item not existed");
            _removeProductItemId(msg.sender, productId, productItemIds[i]);
        }
        emit ProductItemRemoved(msg.sender, productId, productItemIds);
    }

    function removeProduct (address productId) public {
        require(_productIndex[msg.sender][productId] != 0, "Product not existed");
        uint256 total = _productItemIdCount[msg.sender][productId].current();
        for (uint256 i = 0; i < total; i++) {
            bytes32 itemId = _productItemIds[msg.sender][productId][total - i]; // lấy từ cuối
            _removeProductItemId(msg.sender, productId, itemId);
        }
        _removeProduct(msg.sender, productId);
        emit ProductRemoved(msg.sender, productId);
    }

    function _removeProductItemId(address brand, address productId, bytes32 productItemId) private {
        uint256 index = _productItemIndex[brand][productId][productItemId];
        require(index != 0, "Product item not existed"); // chỉ cần check != 0
        uint256 lastIndex = _productItemIdCount[brand][productId].current();

        // if (index == 0 || index > lastIndex) revert("Invalid index");

        
        
        if (index != lastIndex) 
        {
            bytes32 lastProductItem = _productItemIds[brand][productId][lastIndex];
            _productItemIds[brand][productId][index] = lastProductItem;
            _productItemIndex[brand][productId][lastProductItem] = index;
        }

        delete _productItemIds[brand][productId][lastIndex];
        delete _productItemIndex[brand][productId][productItemId];
        _productItemIdCount[brand][productId].decrement();
    }

    function _removeProduct(address brand, address productId) private {
        uint256 index = _productIndex[brand][productId];
        uint256 lastIndex = _productCount[brand].current();
        address lastProduct = _productIds[brand][lastIndex];
        if (index != lastIndex) 
        {
            _productIds[brand][index] = lastProduct;
            _productIndex[brand][lastProduct] = index;
        }
        delete _productIds[brand][lastIndex];
        delete _productIndex[brand][productId];
        _productCount[brand].decrement();
    }

    function getOwnerOfProduct(address productId) public view returns(address) {
        return ProductItem(payable (productId)).owner();
    }

    function getProductId(address brand, uint256 index) public view returns (address) {
        return _productIds[brand][index];
    }

    function getProductIndex(address brand, address productId) public view returns(uint256) {
        return _productIndex[brand][productId];
    }

    function getProductCount(address brand) public view returns(uint256) {
        return _productCount[brand].current();
    }

    function getProductIdBatch(address brand, uint256[] calldata indexes) public view returns (address[] memory) 
    {
        uint256 length = indexes.length;
        address[] memory products = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 index = indexes[i];
            products[i] = _productIds[brand][index];
        }
        return products;
    }

    function isProductItemExists(address brand, address productId, bytes32 productItemId) public view returns(bool) {
        return _productItemIndex[brand][productId][productItemId] != 0;
    }
    function getProductItemIdCount(address brand, address productId) public view returns(uint256) {
        return _productItemIdCount[brand][productId].current();
    }

    function getProductItemId(address brand, address productId, uint256 index) public view returns(bytes32) {
        return _productItemIds[brand][productId][index];
    }

    function getProductItemIdBatch(address brand, address productId, uint256[] calldata indexes) public view returns (bytes32[] memory) {
        uint256 length = indexes.length;
        bytes32[] memory productItemIds = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 index = indexes[i];
            productItemIds[i] = _productItemIds[brand][productId][index];
        }
        return productItemIds;
    }
}