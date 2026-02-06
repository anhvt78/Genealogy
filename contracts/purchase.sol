// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/Counters.sol";
import "./structs/marketStruct.sol";
import "./constants/marketConstant.sol";

contract Purchase {
    using Counters for Counters.Counter;

    mapping (uint256 => PurchaseInfo) internal _purchaseItems;
    Counters.Counter public purchaseCount;

    mapping (address => mapping (uint256 => uint256)) private _pendingItems; //account -> index -> purchaseId
    mapping (address => mapping (uint256 => uint256)) private _pendingIndex; //account -> purchaseId -> index
    mapping (address => Counters.Counter) private _purchasePendingCount;

    mapping (address => mapping (uint256 => uint256)) private _completeItems;
    mapping (address => mapping (uint256 => uint256)) private _completeIndex;
    mapping (address => Counters.Counter) private _purchaseCompleteCount;

    mapping (address => mapping (uint256 => uint256)) internal _disputes;  //account -> index -> purchaseId
    mapping (address => Counters.Counter) internal _disputeCount;

    mapping (uint256 => mapping (bytes32 => bytes)) private _refData;

    function _createPurchaseItem (
        address seller,
        address buyer,
        bytes32[] memory saleIds,
        bytes32[] memory productItemIds,
        uint256[] memory amounts,
        uint256 totalPrice,
        // Fees memory fees,
        // ShipInfo memory shipInfo,
        
        // address shipper,
        // uint256 shippingTime,
        // uint256 shipFee,
        address shipperAssigner,
        address arbitrator,
        bool isPrepaid 
    ) internal {
       
        purchaseCount.increment();
        uint256 purchaseId = purchaseCount.current();
            
        _purchaseItems[purchaseId].seller= seller;
        _purchaseItems[purchaseId].buyer = buyer;
        
        _purchaseItems[purchaseId].saleIds = saleIds;
        _purchaseItems[purchaseId].productItemIds = productItemIds;
        _purchaseItems[purchaseId].amounts = amounts;
        // _purchaseItems[purchaseId].shipInfo = shipInfo;
        _purchaseItems[purchaseId].totalPrice = totalPrice;
        _purchaseItems[purchaseId].shipperAssigner = shipperAssigner;
        _purchaseItems[purchaseId].arbitrator = arbitrator;

        // _purchaseItems[purchaseId].fees = fees;
        _purchaseItems[purchaseId].isPrepaid = isPrepaid;
        _purchaseItems[purchaseId].status = BUYER_CREATED; 

        _setPendingCounter (seller, purchaseId);
        _setPendingCounter (buyer, purchaseId);  
    }

    function _updateShipInfo(uint256 purchaseId, uint256 shipFee, uint256 shippingTime, address shipper) internal {
        ShipInfo memory shipInfo;
        shipInfo.shipFee = shipFee;
        shipInfo.shipper = shipper;
        shipInfo.shippingTime = shippingTime;
        _purchaseItems[purchaseId].shipInfo = shipInfo;
    }

    function _setPendingCounter (address accountAddres, uint256 purchaseId) private {
        _purchasePendingCount[accountAddres].increment();
        _pendingItems[accountAddres][_purchasePendingCount[accountAddres].current()] = purchaseId;
        _pendingIndex[accountAddres][purchaseId] = _purchasePendingCount[accountAddres].current(); 
    }

    function _setPurchaseCompleted (address accountAddres, uint256 purchaseId) internal {
        _purchaseCompleteCount[accountAddres].increment();
        uint256 pendingId = _pendingIndex[accountAddres][purchaseId];
        _completeItems[accountAddres][_purchaseCompleteCount[accountAddres].current()] = _pendingItems[accountAddres][pendingId];
        _completeIndex[accountAddres][purchaseId] = _purchaseCompleteCount[accountAddres].current();
        if (pendingId != _purchasePendingCount[accountAddres].current()) {
            uint256 lastPendingIdInList = _pendingItems[accountAddres][_purchasePendingCount[accountAddres].current()];
            _pendingItems[accountAddres][pendingId] = lastPendingIdInList;
            _pendingIndex[accountAddres][lastPendingIdInList] = pendingId;
        }
        delete _pendingItems[accountAddres][_purchasePendingCount[accountAddres].current()]; // Xóa phần tử cuối cùng
        delete _pendingIndex[accountAddres][purchaseId]; // Xóa index của purchaseId_ đã di chuyển
        _purchasePendingCount[accountAddres].decrement();
    }

    function getPurchaseInfo(uint256 purchaseId)  public view returns(PurchaseInfo memory purchaseInfo) {
        purchaseInfo = _purchaseItems[purchaseId];
    }

    function getPurchaseBatch(uint256[] calldata purchaseIds) public view returns (PurchaseInfo[] memory purchaseInfos) 
    {
        uint256 length = purchaseIds.length;
        purchaseInfos = new PurchaseInfo[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 purchaseId = purchaseIds[i];
            // require(purchaseId > 0 && purchaseId <= purchaseCount.current(), "Invalid purchase ID");
            purchaseInfos[i] = _purchaseItems[purchaseId];
        }
    }

    function _setRefData (uint256 purchaseId, bytes32 refDataId, bytes memory data) internal {
        _refData[purchaseId][refDataId] = data;
    }

    function getRefData (uint256 purchaseId, bytes32 refDataId) public view returns (bytes memory) {
        return _refData[purchaseId][refDataId];
    }

    function getPurchasePendingCount(address userAddress) public view returns (uint256) {
        return _purchasePendingCount[userAddress].current();
    }

    function getPurchasePendingIndex(address accountAddress, uint256 purchaseId) public view returns (uint256) {
        return _pendingIndex[accountAddress][purchaseId];
    }

    function getPurchaseIdPending(address accountAddress, uint256 index) public view returns (uint256) {
        return _pendingItems[accountAddress][index];
    }

    function getPurchaseCompletedCount(address userAddress) public view returns (uint256) {
        return _purchaseCompleteCount[userAddress].current();
    }

    function getPurchaseCompletedIndex(address accountAddress, uint256 purchaseId) public view returns (uint256) {
        return _completeIndex[accountAddress][purchaseId];
    }

    function getPurchaseIdCompleted(address accountAddress, uint256 index) public view returns (uint256) {
        return _completeItems[accountAddress][index];
    }

    function getDisputePurchaseBatch(address arbitrator, uint256[] calldata ids) public view returns (uint256[] memory purchaseIds) 
    {
        uint256 length = ids.length;
        purchaseIds = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 id = ids[i];
            purchaseIds[i] = _disputes[arbitrator][id];
        }
    }
}