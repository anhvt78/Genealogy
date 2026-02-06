// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

    // // From marketPlaceConstants.sol
    bytes32 constant MKP_COMPLETED_FORMAT_KEY = 0x69fb0b3d366a2e9342fe926fcc460c73a465da3b9925c6953c98f308a3c8f3a3;
    bytes32 constant MKP_CANCEL_FORMAT_KEY = 0x99859bd454e72cbf07d343d772554a68fa2eeb6bc47311f949cf625085f55b32;
    bytes32 constant MKP_SHIP_FAILURE_FORMAT_KEY = 0x9f87a92427041a3c00e6be4d2e97287e4aae67cf5d34a654ca00203544b45b61;
    bytes32 constant MKP_NOT_RECV_FORMAT_KEY = 0x2a1a36e8cf88eed8319f6fed0b1fa498ca58a6f084b64f299f4ac7c46832f454;
    bytes32 constant MKP_DISPUTE_FORMAT_KEY = 0xb76664828d87801e3809f393d45b30e3115a889ea972ce64e971585a04a58162;
    bytes32 constant MKP_DISPUTE_FAILURE_FORMAT_KEY = 0x047256f6d73fc29d8992528bc0af8d012448c94b77eb3e356b82a85f251b13d9;
    bytes32 constant MKP_RELEASE_FUNDS_FORMAT_KEY = 0x4b14f3aa56743de1b05548935b32a8317469768c7e89756654d6c95941258323;

    // From purchaseConstant.sol and purchaseExt.sol
    uint8 constant BUYER_CREATED = 1;
    uint8 constant SELLER_ACCEPTED = 2;
    uint8 constant BUYER_PAID = 3;
    uint8 constant SELLER_SHIPPED = 4;
    uint8 constant BUYER_CANCELED = 5;
    uint8 constant SELLER_CANCELED = 6;
    uint8 constant BUYER_RECEIVED = 7;
    uint8 constant BUYER_NOT_RECEIVED = 8;
    uint8 constant SHIPPER_DELIVERY_FAILURE = 9;
    uint8 constant SHIPPER_DELIVERED = 10;
    uint8 constant BUYER_CONFIRM_DELIVERY_FAILURE = 11;
    uint8 constant SELLER_CONFIRM_NOT_RECEIVED = 12;
    uint8 constant DISPUTED_NOT_RECEIVED = 13;
    uint8 constant DISPUTED_DELIVERY_FAILURE = 14;
    uint8 constant SELLER_RELEASE_FUNDS = 15;

    uint256 constant SHIPPING_DEADLINE = 7 days;
    uint256 constant RECEIPT_DEADLINE = 7 days;
    uint256 constant DISPUTE_DEADLINE = 15 days;

    bytes32 constant PURCHASE_DELIVERED_INFO_FORMAT_KEY = 0xa45e4644b39c85c0a6f90a8bb8c04e8626117d12ffc140a8e75fb10ca685913a;
    bytes32 constant PURCHASE_SHIPPING_INFO_FORMAT_KEY = 0xf1abca2890382a91a6dac188a3098bb627a5e0b5a83539d61bf90e90a7c3e602;
    bytes32 constant PURCHASE_SHIP_FAILURE_INFO_FORMAT_KEY = 0x37cfa705751e428f3c3158cca39d98900da88cf76ae0c6e38dcfe0546f78ba6c;
    bytes32 constant PURCHASE_NOT_RECEIVED_INFO_FORMAT_KEY = 0x5be038d40779e7554c7d845824c510204a4c37f5855379658b94bc0f753a1ce8;
    bytes32 constant PURCHASE_CANCEL_REASON_INFO_FORMAT_KEY = 0xfb6c8ba52619b7ef0e1390a755111a7073424becccf68e55ac0f51ce2a450a60;
