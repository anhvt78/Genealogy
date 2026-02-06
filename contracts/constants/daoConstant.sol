// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

    address constant USDT_CONTRACT_ADDRESS = 0xDf2475315AD5a43acC288a10bf90514a677E210A;

    uint256 constant INITIAL_PHASE_TIME = 604800; //1w
    uint256 constant INITIAL_VOTE_TIME = 86400; //1d

    uint256 constant INITIAL_PROPOSAL_FEE = 0; // in usdt (digit = 6 | 10**6)
    uint256 constant INITIAL_MARKET_FEE = 0;
    uint256 constant INITIAL_BRAND_FEE = 0;
    uint256 constant INITIAL_SELLER_FEE = 0;
    uint256 constant INITIAL_MIN_BRAND_STACK = 420;
    uint256 constant INITIAL_MIN_SELLER_STACK = 42;

    