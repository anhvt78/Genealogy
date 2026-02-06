// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {
    LSP8IdentifiableDigitalAsset as LSP8
} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Product} from "./Product.sol";

interface DaoInterface {
    // function getFeeInfo() external view returns (uint256, uint256, uint256, uint256);
    function getStackInfo() external view returns (uint256, uint256);
    function stacking() external view returns (address);
}

interface StackInterface {
    function getStackOf(address memberAddress) external view returns (uint256);
}

interface SupplierInterface {
    function isBrand(address brandAddress) external view returns (bool);
    function isPartner(
        address brandAddress,
        address agentAddress
    ) external view returns (bool);
}

// interface ProductInterface {
//     function getOwnerOfProduct(address collectionId) external view returns(address);
//     function isProductItemExists(address owner, address product, bytes32 productItemId) external view returns(bool);
// }

contract Sale is ReentrancyGuard {
    using Counters for Counters.Counter;

    DaoInterface public daoInterface;
    StackInterface private stackInterface;
    SupplierInterface public supplierInterface;
    // ProductInterface public productInterface;

    //saleId => productId, productItemId
    mapping(bytes32 => SaleInfo) private _saleInfo;
    //index => saleId
    mapping(uint256 => bytes32) private _saleIds;
    //saleId => index
    mapping(bytes32 => uint256) private _saleIndex;
    Counters.Counter private saleCount;

    //seller => index => saleId
    mapping(address => mapping(uint256 => bytes32)) private _saleOfSeller;
    //seller => saleId => index
    mapping(address => mapping(bytes32 => uint256)) private _saleOfSellerIndex;

    mapping(address => Counters.Counter) private saleOfSellerCount;

    //saleId -> prodItemId -> amount | price | solded
    mapping(bytes32 => mapping(bytes32 => uint256)) private _amount;
    mapping(bytes32 => mapping(bytes32 => uint256)) private _price;
    mapping(bytes32 => mapping(bytes32 => uint256)) private _sold;

    mapping(bytes32 => mapping(bytes32 => uint256)) private _allowances;

    //saleId => productItemId => index
    mapping(bytes32 => mapping(bytes32 => uint256)) private _productItemIndex;
    //saleId => index => productItemId
    mapping(bytes32 => mapping(uint256 => bytes32)) private _productItemIds;

    //saleId => count
    mapping(bytes32 => Counters.Counter) private productItemCount;

    struct SaleInfo {
        address seller;
        address productId;
    }

    address private _marketAddress;
    address public productAddress;

    constructor(address daoAddress, address supplierAddress) {
        _marketAddress = msg.sender;
        daoInterface = DaoInterface(daoAddress);
        stackInterface = StackInterface(daoInterface.stacking());
        supplierInterface = SupplierInterface(supplierAddress);
        Product productContract = new Product();
        productAddress = address(productContract);
    }

    // //only for test
    // function setMarketAddress (address marketAddress) public {
    //      _marketAddress = marketAddress;
    // }

    event SaleCreated(address indexed seller, address indexed productId);
    function createSaleItem(
        address productId,
        bytes32[] memory productItemIds,
        uint256[] memory amounts,
        uint256[] memory prices
    ) public nonReentrant {
        address brand = Product(productAddress).getOwnerOfProduct(productId);
        address seller = msg.sender;
        require(supplierInterface.isBrand(brand), "Invalid collection"); //Kiểm tra xem seller đã đăng ký chưa?
        require(supplierInterface.isPartner(brand, seller));
        (, uint256 minSellerStack) = daoInterface.getStackInfo();
        require(
            stackInterface.getStackOf(msg.sender) >= minSellerStack,
            "Insufficient tokens"
        );
        require(
            productItemIds.length == amounts.length &&
                amounts.length == prices.length,
            "Array length mismatch"
        );

        // _createSaleItem (msg.sender, productId, productItemIds, amounts, prices);
        bytes32 saleId_ = keccak256(abi.encodePacked(seller, productId));
        require(_saleIndex[saleId_] == 0, "Sale item existed");

        saleCount.increment();
        uint256 newIndex_ = saleCount.current();
        _saleInfo[saleId_] = SaleInfo(seller, productId);

        _saleIndex[saleId_] = newIndex_;
        _saleIds[newIndex_] = saleId_;

        saleOfSellerCount[seller].increment();
        uint256 newSubId_ = saleOfSellerCount[seller].current();

        _saleOfSeller[seller][newSubId_] = saleId_;
        _saleOfSellerIndex[seller][saleId_] = newSubId_;

        for (uint256 i = 0; i < productItemIds.length; i++) {
            require(
                _productItemIndex[saleId_][productItemIds[i]] == 0,
                "Duplicate product item ID"
            );

            if (brand != seller) {
                require(
                    amounts[i] <= _allowances[saleId_][productItemIds[i]],
                    "Insufficient allowance"
                );
                _allowances[saleId_][productItemIds[i]] -= amounts[i];
            }

            productItemCount[saleId_].increment();
            uint256 newId = productItemCount[saleId_].current();
            _amount[saleId_][productItemIds[i]] = amounts[i];
            _price[saleId_][productItemIds[i]] = prices[i];
            _productItemIndex[saleId_][productItemIds[i]] = newId;
            _productItemIds[saleId_][newId] = productItemIds[i];
        }

        emit SaleCreated(msg.sender, productId);
    }

    event ApproveProduct(
        address indexed brand,
        address indexed seller,
        address indexed productId
    );
    function approveProduct(
        address seller,
        address productId,
        bytes32[] memory productItemIds,
        uint256[] memory amounts
    ) public {
        require(
            productItemIds.length == amounts.length,
            "Array length mismatch"
        );
        // address brand = productInterface.getOwnerOfProduct(productId);
        require(
            msg.sender == Product(productAddress).getOwnerOfProduct(productId),
            "Only Brand"
        );
        for (uint256 i = 0; i < productItemIds.length; i++) {
            require(
                Product(productAddress).isProductItemExists(
                    msg.sender,
                    productId,
                    productItemIds[i]
                ),
                "Product item invalid"
            );
            bytes32 saleId_ = keccak256(abi.encodePacked(seller, productId));
            _allowances[saleId_][productItemIds[i]] = amounts[i];
        }
        emit ApproveProduct(msg.sender, seller, productId);
    }

    event UpdateSaleItem(bytes32 saleId);
    function updateSaleItem(
        bytes32 saleId,
        bytes32[] memory productItemIds,
        uint256[] memory amounts,
        uint256[] memory prices
    ) public {
        require(_saleIndex[saleId] != 0, "Sale item not existed");
        require(
            productItemIds.length == amounts.length &&
                productItemIds.length == prices.length,
            "Input length not match"
        );
        for (uint256 i = 0; i < productItemIds.length; i++) {
            require(
                msg.sender == _saleInfo[saleId].seller ||
                    msg.sender == _marketAddress,
                "Only seller"
            );
            require(
                _productItemIndex[saleId][productItemIds[i]] != 0,
                "Product item not existed"
            );

            require(
                amounts[i] <= _amount[saleId][productItemIds[i]],
                "Not exceed existing products"
            );

            _amount[saleId][productItemIds[i]] = amounts[i];
            _price[saleId][productItemIds[i]] = prices[i];
        }
        emit UpdateSaleItem(saleId);
    }

    event AddProductItems(bytes32 saleId);
    function addProductItems(
        bytes32 saleId,
        bytes32[] memory productItemIds,
        uint256[] memory amounts
    ) public {
        require(_saleIndex[saleId] != 0, "Sale item not existed");
        require(msg.sender == _saleInfo[saleId].seller, "Only seller");
        require(
            productItemIds.length == amounts.length,
            "Input length not match"
        );

        for (uint256 i = 0; i < productItemIds.length; i++) {
            require(
                _productItemIndex[saleId][productItemIds[i]] != 0,
                "Product item not existed"
            );

            require(
                _allowances[saleId][productItemIds[i]] >= amounts[i],
                "Product item insufficient allowance"
            );

            _amount[saleId][productItemIds[i]] += amounts[i];
            _allowances[saleId][productItemIds[i]] -= amounts[i];
        }
        emit AddProductItems(saleId);
    }

    event RemoveSaleItem(bytes32 saleId);
    function removeSaleItem(bytes32 saleId) public {
        require(
            msg.sender == _saleInfo[saleId].seller,
            "Only seller can remove item"
        );
        require(_saleIndex[saleId] != 0, "Item is not exist");
        uint256 indexToRemove = _saleIndex[saleId]; // Lấy index của item cần xóa
        uint256 lastIndex = saleCount.current(); // Lấy index của phần tử cuối cùng
        bytes32 lastItemId = _saleIds[lastIndex]; // Lấy itemId_ của phần tử cuối cùng

        // Nếu phần tử cần xóa không phải là phần tử cuối cùng
        if (indexToRemove != lastIndex) {
            // Di chuyển phần tử cuối cùng đến vị trí của phần tử cần xóa
            _saleIds[indexToRemove] = lastItemId;
            // Cập nhật index của phần tử đã di chuyển
            _saleIndex[lastItemId] = indexToRemove;
        }

        // Xóa dữ liệu trong _saleInfo
        delete _saleInfo[saleId];

        // Xóa phần tử cuối cùng (sau khi đã di chuyển hoặc nếu đó là phần tử duy nhất)
        delete _saleIds[lastIndex];
        // Xóa index của itemId_ đã bị ẩn
        delete _saleIndex[saleId];
        // Giảm số lượng mặt hàng đang hiển thị
        saleCount.decrement();

        //Cập nhật thông tin sale item cho từng seller
        uint256 sellerIndex = _saleOfSellerIndex[msg.sender][saleId];
        uint256 lastSellerIndex = saleOfSellerCount[msg.sender].current();
        if (sellerIndex != lastSellerIndex) {
            bytes32 lastSaleId = _saleOfSeller[msg.sender][lastSellerIndex];
            _saleOfSeller[msg.sender][sellerIndex] = lastSaleId;
            _saleOfSellerIndex[msg.sender][lastSaleId] = sellerIndex;
        }
        delete _saleOfSeller[msg.sender][lastSellerIndex];
        delete _saleOfSellerIndex[msg.sender][saleId];
        saleOfSellerCount[msg.sender].decrement();
        //Xoá các product items
        uint256 count = productItemCount[saleId].current();
        for (uint256 i = 1; i <= count; i++) {
            bytes32 productItemId = _productItemIds[saleId][i];
            delete _productItemIds[saleId][i];
            delete _productItemIndex[saleId][productItemId];
            delete _amount[saleId][productItemId];
            delete _price[saleId][productItemId];
            delete _sold[saleId][productItemId];
        }
        productItemCount[saleId].reset();
        emit RemoveSaleItem(saleId);
    }

    // Lấy thông tin chi tiết từ sale Id
    function getSaleInfo(
        bytes32 saleId
    ) public view returns (address seller, address productId) {
        seller = _saleInfo[saleId].seller;
        productId = _saleInfo[saleId].productId;
    }

    // Lấy thông tin chi tiết của một sale item
    function getProductItemInfo(
        bytes32 saleId,
        bytes32 productItemId
    ) public view returns (uint256 amount, uint256 price, uint256 sold) {
        amount = _amount[saleId][productItemId];
        price = _price[saleId][productItemId];
        sold = _sold[saleId][productItemId];
    }

    function updateSoldItem(
        bytes32[] memory saleIds,
        bytes32[] memory productItemIds,
        uint256[] memory solds
    ) public onlyMarket {
        for (uint256 i = 0; i < productItemIds.length; i++) {
            _sold[saleIds[i]][productItemIds[i]] += solds[i];
        }
    }

    function updateAmount(
        bytes32[] memory saleIds,
        bytes32[] memory productItemIds,
        uint256[] memory amounts,
        bool isAdded
    ) public onlyMarket {
        if (isAdded) {
            for (uint256 i = 0; i < productItemIds.length; i++) {
                _amount[saleIds[i]][productItemIds[i]] += amounts[i];
            }
        } else {
            for (uint256 i = 0; i < productItemIds.length; i++) {
                require(
                    _amount[saleIds[i]][productItemIds[i]] >= amounts[i],
                    "Insufficient product"
                );
                _amount[saleIds[i]][productItemIds[i]] -= amounts[i];
            }
        }
    }

    // Lấy itemId của một mặt hàng đang hiển thị theo index
    function getSaleId(uint256 index) public view returns (bytes32) {
        // require(index <= saleCount.current(), "Index out of bounds");
        return _saleIds[index];
    }

    // Lấy itemId của một mặt hàng của người bán theo index
    function getSaleIdOfSeller(
        address seller,
        uint256 index
    ) public view returns (bytes32 saleId) {
        saleId = _saleOfSeller[seller][index];
    }

    function getProductItemId(
        bytes32 saleId,
        uint256 index
    ) public view returns (bytes32) {
        return _productItemIds[saleId][index];
    }

    function getProductItemIndex(
        bytes32 saleId,
        bytes32 productItemId
    ) public view returns (uint256) {
        return _productItemIndex[saleId][productItemId];
    }

    function getProductItemIds(
        bytes32 saleId
    ) public view returns (bytes32[] memory productItemIds) {
        uint256 count_ = productItemCount[saleId].current();
        productItemIds = new bytes32[](count_);
        for (uint256 i = 0; i < count_; i++) {
            productItemIds[i] = _productItemIds[saleId][i + 1];
        }
    }

    function getSaleIdBatch(
        uint256[] memory index
    ) public view returns (bytes32[] memory) {
        uint256 length = index.length;
        bytes32[] memory saleIds = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            saleIds[i] = _saleIds[index[i]];
        }
        return saleIds;
    }

    function getProductItemCount(bytes32 saleId) public view returns (uint256) {
        return productItemCount[saleId].current();
    }

    function getSaleIndex(bytes32 saleId) public view returns (uint256) {
        return _saleIndex[saleId];
    }

    function getSaleOfSellerCount(
        address seller
    ) public view returns (uint256) {
        return saleOfSellerCount[seller].current();
    }

    function getSaleCount() public view returns (uint256) {
        return saleCount.current();
    }

    function getProductAllowance(
        bytes32 saleId,
        bytes32 productItemId
    ) public view returns (uint256) {
        return _allowances[saleId][productItemId];
    }

    modifier onlyMarket() {
        require(msg.sender == _marketAddress, "Only market contract address");
        _;
    }
}
