// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {
    LSP7DigitalAsset
} from "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";
import "./structs/marketStruct.sol";
import "./constants/marketConstant.sol";
import "./libs/RefundLib.sol";
import {Purchase} from "./purchase.sol";
import {BaseCounter} from "./BaseCounter.sol";
import {Sale} from "./sale.sol";
// import {Rate} from "./rate.sol";

interface DaoInterface {
    function getFeeInfo()
        external
        view
        returns (uint256, uint256, uint256, uint256);
    function stacking() external view returns (address);
    function operator() external view returns (address);
    function usdtAddress() external view returns (address);
}

interface ArbitratorInterface {
    function getDisputeFee(address arbitrator) external view returns (uint256);
}

interface RateInterface {
    function rate(address seller, uint256 sellerPoint, bytes32[] memory saleIds, bytes32[] memory productItemIds, uint256[] memory productPoints) external;
}


contract MarketPlace is ReentrancyGuard, BaseCounter, Purchase {
    using Counters for Counters.Counter;

    DaoInterface private daoInterface;
    ArbitratorInterface private arbitratorInterface; //ArbitratorInterface
    RateInterface private rateInterface;
    // SaleInterface private saleInterface;

    address private immutable _usdtAddress;

    address public daoAddress;
    address public supplierAddress;
    address public arbitratorAddress;
    address public saleAddress;
    address public rateAddress;

    // Sự kiện để ghi lại các hành động quan trọng
    event EventPurchaseCreated(
        uint256 indexed purchaseId,
        address indexed seller,
        address indexed buyer,
        uint256 totalPrice
    );
    event EventPurchaseAccepted(uint256 indexed purchaseId);
    event EventPurchasePaid(uint256 indexed purchaseId);
    event EventSellerShipped(uint256 indexed purchaseId);
    event EventPurchaseReceived(uint256 indexed purchaseId);
    event EventBuyerCanceled(uint256 indexed purchaseId);
    event EventSellerCanceled(uint256 indexed purchaseId);
    event EventPurchaseNotReceived(uint256 indexed purchaseId);
    event EventPurchaseShipFailure(uint256 indexed purchaseId);
    event EventPurchaseShipped(uint256 indexed purchaseId);
    event EventConfirmNotReceived(uint256 indexed purchaseId);
    event EventConfirmDeliveryFailure(uint256 indexed purchaseId);
    event EventReleaseFunds(uint256 purchaseId);
    event EventCreateDispute(uint256 purchaseId, address creator);
    event EventResolveDispute(
        uint256 purchaseId
    );
    event RateProduct(uint256 purchaseId);

    mapping(uint256 => bool) internal _ratePermitted;

    constructor(address dao, address supplier, address arbitrator, address rateContract) {
        daoAddress = dao;
        supplierAddress = supplier;
        arbitratorAddress = arbitrator;
        rateAddress = rateContract;

        daoInterface = DaoInterface(daoAddress);

        _usdtAddress = daoInterface.usdtAddress();
        arbitratorInterface = ArbitratorInterface(arbitratorAddress);

        // Rate rateContract = new Rate();
        // rateAddress = address(rateContract);
        rateInterface = RateInterface(rateAddress);

        Sale saleContract = new Sale(daoAddress, supplierAddress);
        saleAddress = address(saleContract);
    }

    function createPurchase(
        address seller,
        bytes32[] memory saleIds,
        bytes32[] memory productItemIds,
        uint256[] memory amounts,
        address shipperAssigner,
        address arbitrator,
        bool isPrepaid
    ) public nonReentrant {
        require(msg.sender != seller, "Not Seller");
        // (, uint256 marketFee, , ) = daoInterface.getFeeInfo();

        uint256 totalPrice;
        for (uint256 i; i < saleIds.length; i++) {
            (address seller_, ) = Sale(saleAddress).getSaleInfo(saleIds[i]);
            require(seller == seller_, "Product Invalid");
            (uint256 amount, uint256 price, ) = Sale(saleAddress)
                .getProductItemInfo(saleIds[i], productItemIds[i]);
            require(amount >= amounts[i], "Amount invalid");
            totalPrice += amounts[i] * price;
        }

        _createPurchaseItem(
            seller,
            msg.sender,
            saleIds,
            productItemIds,
            amounts,
            totalPrice,
            // fees,
            // shipInfo,
            shipperAssigner,
            arbitrator,
            isPrepaid
        );

        // _transfer(msg.sender, address(this), payValue);

        // Sale(saleAddress).updateAmount(saleIds, productItemIds, amounts, false);

        emit EventPurchaseCreated(
            purchaseCount.current(),
            seller,
            msg.sender,
            totalPrice
        );
    }

    function purchaseAccepted(uint256 purchaseId) public onlySeller(purchaseId) {
        require(_purchaseItems[purchaseId].status == BUYER_CREATED, "Status invalid");
        _purchaseItems[purchaseId].status = SELLER_ACCEPTED;
        emit EventPurchaseAccepted(purchaseId);
    }

    function updateShipInfo (uint256 purchaseId, uint256 shipFee, uint256 shippingTime, address shipper) public 
    {
        require (msg.sender == _purchaseItems[purchaseId].shipperAssigner, "Only Assigner");
        require(_purchaseItems[purchaseId].status == BUYER_CREATED || _purchaseItems[purchaseId].status == SELLER_ACCEPTED, "Status invalid");
        _updateShipInfo(purchaseId, shipFee, shippingTime, shipper);
    }

    function paymentPurchase (uint256 purchaseId) public onlyBuyer(purchaseId) {
        
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(purchase.status == SELLER_ACCEPTED, "Status invalid");
        require(purchase.shipInfo.shippingTime > 0, "ShippingTime invalid");
        
        (, uint256 marketFee, , ) = daoInterface.getFeeInfo();

        uint256 payValue = RefundLib.calculatePayValue(
            purchase.totalPrice,
            purchase.shipInfo.shipFee,
            marketFee,
            purchase.isPrepaid
        );
        require(
        LSP7DigitalAsset(payable(_usdtAddress)).balanceOf(msg.sender) >=
                payValue,
            "Insufficient balance"
        );
        require(
            LSP7DigitalAsset(payable(_usdtAddress)).authorizedAmountFor(
                address(this),
                msg.sender
            ) >= payValue,
            "Allowance required"
        );

        _transfer(msg.sender, address(this), payValue);

        Sale(saleAddress).updateAmount(purchase.saleIds, purchase.productItemIds, purchase.amounts, false);

        purchase.fees.marketFee = marketFee;

        purchase.status = BUYER_PAID;

        emit EventPurchasePaid(purchaseId);
    }

    function purchaseShipped (uint256 purchaseId, bytes memory shipValue) public onlySeller(purchaseId) {
         PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(purchase.status == BUYER_PAID, "Not paid");
        purchase.shipInfo.shippedAt = block.timestamp;
        purchase.status = SELLER_SHIPPED;
        _setRefData(purchaseId, PURCHASE_SHIPPING_INFO_FORMAT_KEY, shipValue);
        emit EventSellerShipped(purchaseId);
    }

    function buyerCancel(
        uint256 purchaseId,
        bytes memory cancelReason
    ) public onlyBuyer(purchaseId) {
        require(
            _purchaseItems[purchaseId].status < SELLER_SHIPPED,
            "Not permitted."
        );
        if (_purchaseItems[purchaseId].status == BUYER_PAID)
        {
            _purchaseReturnValue(purchaseId, BUYER_CANCELED);
        }
        _incrementCounter(msg.sender, MKP_CANCEL_FORMAT_KEY);
        _purchaseCancel(purchaseId);
        _setRefData(
            purchaseId,
            PURCHASE_CANCEL_REASON_INFO_FORMAT_KEY,
            cancelReason
        );
        _purchaseItems[purchaseId].status = BUYER_CANCELED;
        emit EventBuyerCanceled(purchaseId);
    }

    function sellerCancel(
        uint256 purchaseId,
        bytes memory cancelReason
    ) public onlySeller(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(
            purchase.status <= SELLER_SHIPPED ||
            purchase.status == SHIPPER_DELIVERY_FAILURE || 
            purchase.status == SHIPPER_DELIVERED,
            "Not permitted."
        );
        require(!purchase.isDisputed, "In disputing.");
        if ( purchase.status >= BUYER_PAID)
        {
            _ratePermitted[purchaseId] = true;
            _purchaseReturnValue(purchaseId, SELLER_CANCELED);
        }
        _incrementCounter(msg.sender, MKP_CANCEL_FORMAT_KEY);
        _purchaseCancel(purchaseId);
        _setRefData(
            purchaseId,
            PURCHASE_CANCEL_REASON_INFO_FORMAT_KEY,
            cancelReason
        );
        purchase.status = SELLER_CANCELED;
        emit EventSellerCanceled(purchaseId);
    }

    function buyerNotReceived(
        uint256 purchaseId,
        bytes memory refData
    ) public onlyBuyer(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        if (purchase.status == SELLER_ACCEPTED) {
            require(
                block.timestamp >
                    purchase.shipInfo.shippedAt +
                        purchase.shipInfo.shippingTime,
                "In shipping time"
            );
        } else if (purchase.status != SELLER_SHIPPED) {
            revert("Status invalid");
        }

        purchase.status = BUYER_NOT_RECEIVED;
        _setRefData(purchaseId, PURCHASE_NOT_RECEIVED_INFO_FORMAT_KEY, refData);

        emit EventPurchaseNotReceived(purchaseId);
    }

    function purchaseDeliveryFailure(
        uint256 purchaseId,
        bytes memory refData
    ) public onlySeller(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(purchase.status == SELLER_ACCEPTED, "Status invalid");
        purchase.status = SHIPPER_DELIVERY_FAILURE;
        _setRefData(purchaseId, PURCHASE_SHIP_FAILURE_INFO_FORMAT_KEY, refData);
        emit EventPurchaseShipFailure(purchaseId);
    }

    function purchaseDelivered(
        uint256 purchaseId,
        bytes memory refData
    ) public {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(msg.sender == purchase.shipInfo.shipper, "OnlyShipper");
        require(purchase.status == SELLER_ACCEPTED, "Status invalid");
        require(
            block.timestamp <
                purchase.shipInfo.shippedAt + purchase.shipInfo.shippingTime,
            "Invalid time"
        );
        purchase.status = SHIPPER_DELIVERED;
        _setRefData(purchaseId, PURCHASE_DELIVERED_INFO_FORMAT_KEY, refData);
        emit EventPurchaseShipped(purchaseId);
    }

    function confirmDeliveryFailure(
        uint256 purchaseId
    ) public onlyBuyer(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(purchase.status == SHIPPER_DELIVERY_FAILURE, "Status invalid");

        _purchaseReturnValue(purchaseId, BUYER_CONFIRM_DELIVERY_FAILURE);
        _purchaseCancel(purchaseId);
        _incrementCounter(purchase.buyer, MKP_SHIP_FAILURE_FORMAT_KEY);
        purchase.status = BUYER_CONFIRM_DELIVERY_FAILURE;
        emit EventConfirmDeliveryFailure(purchaseId);
    }

    function confirmNotReceived(
        uint256 purchaseId
    ) public onlySeller(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(purchase.status == BUYER_NOT_RECEIVED, "Status invalid");

        _purchaseReturnValue(purchaseId, SELLER_CONFIRM_NOT_RECEIVED);
        _purchaseCancel(purchaseId);

        _incrementCounter(purchase.seller, MKP_NOT_RECV_FORMAT_KEY);
        purchase.status = SELLER_CONFIRM_NOT_RECEIVED;
        emit EventConfirmNotReceived(purchaseId);
    }

    function buyerReceived(uint256 purchaseId) public onlyBuyer(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(
            purchase.status == SELLER_SHIPPED ||
                purchase.status == BUYER_NOT_RECEIVED ||
                purchase.status == SHIPPER_DELIVERY_FAILURE ||
                purchase.status == SELLER_SHIPPED,
            "Status invalid"
        );

        _purchaseComplete(purchaseId);

        emit EventPurchaseReceived(purchaseId);
    }

    function releaseFunds(uint256 purchaseId) public onlySeller(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(purchase.status == SELLER_SHIPPED, "Status invalid");
        require(
            block.timestamp >
                purchase.shipInfo.shippedAt +
                    purchase.shipInfo.shippingTime +
                    RECEIPT_DEADLINE,
            "Time not reached"
        );

        _purchaseComplete(purchaseId);

        emit EventReleaseFunds(purchaseId);
    }

    function _purchaseComplete(uint256 purchaseId) private {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(!purchase.isDisputed, "In disputing.");
        _purchaseReturnValue(purchaseId, BUYER_RECEIVED);
        _ratePermitted[purchaseId] = true;
        _setPurchaseCompleted(purchase.buyer, purchaseId);
        _setPurchaseCompleted(purchase.seller, purchaseId);

        uint256[] memory solds_ = new uint256[](purchase.saleIds.length);
        for (uint256 i; i < purchase.saleIds.length; i++) {
            solds_[i] = purchase.amounts[i];
        }

        Sale(saleAddress).updateSoldItem(
            purchase.saleIds,
            purchase.productItemIds,
            solds_
        );

        _incrementCounter(purchase.buyer, MKP_COMPLETED_FORMAT_KEY);
        _incrementCounter(purchase.seller, MKP_COMPLETED_FORMAT_KEY);

        _transfer(address(this), daoAddress, purchase.fees.marketFee);
    }

    function _purchaseReturnValue(uint256 purchaseId, uint8 status) private {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        (uint256 buyerAmount, uint256 sellerAmount) = RefundLib
            .calculateRefundAmounts(
                purchase.totalPrice,
                purchase.shipInfo.shipFee,
                purchase.fees.marketFee,
                status,
                purchase.isPrepaid
            );
        _transfer(address(this), purchase.seller, buyerAmount);
        _transfer(address(this), purchase.buyer, sellerAmount);
    }

    function createDispute(uint256 purchaseId) public {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(!purchase.isDisputed, "In dispute");
        require(
            purchase.status == BUYER_NOT_RECEIVED ||
                purchase.status == SHIPPER_DELIVERY_FAILURE,
            "Status invalid"
        );
        require(
            msg.sender == purchase.buyer || msg.sender == purchase.seller,
            "Only seller or Buyer"
        );

        purchase.disputedAt = block.timestamp;

        uint256 payValue = arbitratorInterface.getDisputeFee(
            purchase.arbitrator
        );


        require(
            LSP7DigitalAsset(payable(_usdtAddress)).balanceOf(msg.sender) >=
                payValue,
            "Insufficient balance"
        );
        require(
            LSP7DigitalAsset(payable(_usdtAddress)).authorizedAmountFor(
                address(this),
                msg.sender
            ) >= payValue,
            "Allowance required"
        );
        _transfer(msg.sender, address(this), payValue);

        purchase.fees.disputeFee = payValue;
        purchase.isDisputed = true;

        emit EventCreateDispute(purchaseId, msg.sender);
    }

    function resolveDispute(
        uint256 purchaseId,
        address winner
    ) public onlyArbitratorOrAdmin(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId]; // chỉ load 1 lần
        require(purchase.isDisputed, "Not in dispute.");
        require(
            winner == purchase.seller || winner == purchase.buyer,
            "Address invalid."
        );
        require(
            purchase.status == BUYER_NOT_RECEIVED ||
                purchase.status == SHIPPER_DELIVERY_FAILURE,
            "Status invalid."
        );

        // Xác định trạng thái tranh chấp
        bool isNotReceived = purchase.status == BUYER_NOT_RECEIVED;
        bool isBuyerWin = purchase.buyer == winner;

        // Tính toán hoàn tiền
        (uint256 winnerAmount, uint256 loserAmount) = RefundLib
            .calculateDisputeRefunds(
                purchase.totalPrice,
                purchase.shipInfo.shipFee,
                purchase.fees.marketFee,
                isNotReceived,
                isBuyerWin,
                purchase.isPrepaid
            );

        // Xác định người thua và số tiền hoàn
        address loser = isBuyerWin ? purchase.seller : purchase.buyer;
        uint256 loserRefund = isBuyerWin ? loserAmount : 0;
        bool cancelPurchase = isNotReceived ? !isBuyerWin : true;

        // Giải quyết tranh chấp
        _resolveDispute(
            purchaseId,
            winner,
            winnerAmount,
            loser,
            loserRefund,
            cancelPurchase
        );

        // Cho phép đánh giá nếu buyer thắng
        if (isBuyerWin) {
            _ratePermitted[purchaseId] = true;
        }

        _transfer(address(this), daoAddress, purchase.fees.marketFee);

        // Cập nhật trạng thái
        purchase.status = isNotReceived
            ? DISPUTED_NOT_RECEIVED
            : DISPUTED_DELIVERY_FAILURE;

        purchase.isDisputed = false;

        _transfer(address(this), msg.sender, purchase.fees.disputeFee);

        _disputeCount[msg.sender].increment();
        _disputes[msg.sender][_disputeCount[msg.sender].current()] = purchaseId;

        emit EventResolveDispute(purchaseId);
    }

    function _resolveDispute(
        uint256 purchaseId,
        address winner,
        uint256 winnerValue,
        address loser,
        uint256 loserValue,
        bool isCancel
    ) private {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        _transfer(address(this), winner, winnerValue);
        _incrementCounter(winner, MKP_DISPUTE_FORMAT_KEY);

        _transfer(address(this), loser, loserValue);
        _incrementCounter(loser, MKP_DISPUTE_FAILURE_FORMAT_KEY);
        if (isCancel) {
            _purchaseCancel(purchaseId);
        } else {
            _setPurchaseCompleted(purchase.buyer, purchaseId);
            _setPurchaseCompleted(purchase.seller, purchaseId);
        }
    }


    function _purchaseCancel(uint256 purchaseId) private {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        Sale(saleAddress).updateAmount(
            purchase.saleIds,
            purchase.productItemIds,
            purchase.amounts,
            true
        );
        _setPurchaseCompleted(purchase.buyer, purchaseId);
        _setPurchaseCompleted(purchase.seller, purchaseId);
    }

    function rate(
        uint256 purchaseId,
        uint256 sellerPoint,
        uint256[] memory productPoints
    ) public onlyBuyer(purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        require(_ratePermitted[purchaseId], "Not permitted.");
        require(
            purchase.saleIds.length == productPoints.length,
            "Length invalid"
        );
        rateInterface.rate(
            purchase.seller,
            sellerPoint,
            purchase.saleIds,
            purchase.productItemIds,
            productPoints
        );

        emit RateProduct(purchaseId);
    }

    function getRatePermit(uint256 purchaseId) public view returns (bool) {
        return _ratePermitted[purchaseId];
    }

    function _transfer(address _from, address _to, uint256 _amount) private {
        if (_amount == 0) return;
        LSP7DigitalAsset(payable(_usdtAddress)).transfer(
            _from,
            _to,
            _amount,
            true,
            "0x"
        );
    }

    modifier onlySeller(uint256 purchaseId) {
        require(
            _purchaseItems[purchaseId].seller == msg.sender,
            "Only seller."
        );
        _;
    }

    modifier onlyBuyer(uint256 purchaseId) {
        require(_purchaseItems[purchaseId].buyer == msg.sender, "Only buyer.");
        _;
    }

    modifier onlyArbitratorOrAdmin(uint256 purchaseId) {
        PurchaseInfo storage purchase = _purchaseItems[purchaseId];
        address addmin = daoInterface.operator();
        if (addmin != purchase.arbitrator) {
            if (msg.sender == addmin) {
                require(
                    block.timestamp > purchase.disputedAt + DISPUTE_DEADLINE
                );
            } else {
                require(purchase.arbitrator == msg.sender, "Only arbitrator.");
            }
        } else {
            require(addmin == msg.sender, "Only arbitrator.");
        }
        _;
    }
}

