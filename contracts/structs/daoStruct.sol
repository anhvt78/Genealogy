// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

    struct TokenForSale {
        uint256 amount;
        uint256 price;
    }

    struct Approve {
        string name;
        uint256 id;
        uint256 voteCount;
        uint256 createdAt;
        uint256 totalStacking;
        bool executed;
    }

    struct ProposalDetails {
        address proposer;
        string reason;
        uint256 approveId;
    }

    struct OperatorProposal {
        ProposalDetails details;
        address newOperator;
    }

    struct ParamProposal {
        ProposalDetails details;
        uint256 phaseTime;
        uint256 votingTime;
    }

    struct FeeProposal {
        ProposalDetails details;
        uint256 newProposalFee;
        uint256 newMarketFee;
        uint256 newBrandFee;
        uint256 newSellerFee;
    }

    struct StackProposal {
        ProposalDetails details;
        uint256 newMinBrandStack;
        uint256 newMinSellerStack;
    }

    struct ReleaseProposal {
        ProposalDetails details;
        uint256 amount;
        uint256 price;
    }