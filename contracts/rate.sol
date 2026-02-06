// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Rate {

    struct RateInfo {
        uint256 rate;
        uint256 count;
    }

    mapping (address => mapping(address => RateInfo)) private _sellerRateInfo; //caller => seller => rateInfo
    mapping (address => mapping(bytes32 => mapping(bytes32 => RateInfo))) private _productRateInfo; 
    // address private _marketAddress;
    
    // constructor() {
    //     _marketAddress = msg.sender;
    // }

    function rate(address seller, uint256 sellerPoint, bytes32[] memory saleIds, bytes32[] memory productItemIds, uint256[] memory productPoints) public {
        _setRate(_sellerRateInfo[msg.sender][seller], sellerPoint);
        for (uint256 i = 0; i < saleIds.length ; i++) {
            _setRate(_productRateInfo[msg.sender][saleIds[i]][productItemIds[i]],productPoints[i]);
        }
    }

    function _setRate(RateInfo storage rateInfo, uint256 point) private {
        require(point <= 100, "Out of range");
        rateInfo.rate = (rateInfo.rate * rateInfo.count + point) / (rateInfo.count + 1);
        rateInfo.count += 1;
    }

    function getSellerRateInfo(address marketAddress, address seller) public  view returns (RateInfo memory) {
        return _sellerRateInfo[marketAddress][seller];
    }

    function getProductRateInfo(address marketAddress, bytes32 saleId, bytes32 productItemId) public view returns (RateInfo memory) {
        return _productRateInfo[marketAddress][saleId][productItemId];
    }
}