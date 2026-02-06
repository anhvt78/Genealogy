// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
// uint8 constant BUYER_CREATED = 1; //Buyer payment for purchase
// uint8 constant SELLER_CONFIRMED = 2; //Seller update shipping info
// uint8 constant BUYER_CANCELED = 3; //Purchase cancel            *
// uint8 constant SELLER_CANCELED = 4; //Purchase cancel           *
// uint8 constant BUYER_RECEIVED = 5; //Buyer confirm received     *
// uint8 constant BUYER_NOT_RECEIVED = 6; //Buyer cannot received ~ exception
// uint8 constant SHIPPER_DELIVERY_FAILURE = 7; //Seller cannot ship to buyer ~ exception
// uint8 constant SHIPPER_DELIVERED = 8; //Seller cannot ship to buyer ~ exception
// uint8 constant BUYER_CONFIRM_DELIVERY_FAILURE = 9; //   *
// uint8 constant SELLER_CONFIRM_NOT_RECEIVED = 10; //   *
// uint8 constant DISPUTED_NOT_RECEIVED = 11;              //*
// uint8 constant DISPUTED_DELIVERY_FAILURE = 12;          //*
// uint8 constant SELLER_RELEASE_FUNDS = 13;  //  *


// uint256 constant SHIPPING_DEADLINE = 7 days; //7 days
// uint256 constant RECEIPT_DEADLINE = 7 days; //3 days
// uint256 constant DISPUTE_DEADLINE = 15 days;

// // keccak256('DeliveryInfoIdFormat')
// bytes32 constant _PURCHASE_DELIVERED_INFO_FORMAT_KEY = 0xa45e4644b39c85c0a6f90a8bb8c04e8626117d12ffc140a8e75fb10ca685913a;

// // keccak256('ShippingInfoIdFormat')
// bytes32 constant _PURCHASE_SHIPPING_INFO_FORMAT_KEY = 0xf1abca2890382a91a6dac188a3098bb627a5e0b5a83539d61bf90e90a7c3e602;

// // // keccak256('ShipCodeIdFormat')
// // bytes32 constant _PURCHASE_SHIPCODE_INFO_FORMAT_KEY = 0x324c3a8ebebed9a414bf6ed78ac586f09ba25bc61cec75d1857b1230a99d5842;

// // keccak256('ShipFailureInfoIdFormat')
// bytes32 constant _PURCHASE_SHIP_FAILURE_INFO_FORMAT_KEY = 0x37cfa705751e428f3c3158cca39d98900da88cf76ae0c6e38dcfe0546f78ba6c;

// // keccak256('NotRecvInfoIdFormat')
// bytes32 constant _PURCHASE_NOT_RECEIVED_INFO_FORMAT_KEY = 0x5be038d40779e7554c7d845824c510204a4c37f5855379658b94bc0f753a1ce8;

// // keccak256('CancelReasonInfoIdFormat')
// bytes32 constant _PURCHASE_CANCEL_REASON_INFO_FORMAT_KEY = 0xfb6c8ba52619b7ef0e1390a755111a7073424becccf68e55ac0f51ce2a450a60;

struct Fees {
    // uint256 shipFee;
    uint256 disputeFee;
    uint256 marketFee;
}

struct ShipInfo {
    uint256 shippedAt;
    uint256 shipFee;
    uint256 shippingTime;
    address shipper;
}

struct PurchaseInfo {
    address seller;
    address buyer;
    bytes32[] saleIds;
    bytes32[] productItemIds;
    uint256[] amounts;
    uint256 totalPrice;
    // uint256 startAt;
    // address shipper;
    Fees fees;
    ShipInfo shipInfo;
    // uint256 shippingTime;
    address shipperAssigner;
    address arbitrator;
    uint256 disputedAt;
    bool isDisputed;
    uint8 status;   
    bool isPrepaid;   
}
