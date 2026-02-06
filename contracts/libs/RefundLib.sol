// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "../constants/marketConstant.sol";

library RefundLib {
    // Case types for refund calculations
    // 1: Cancel (buyer full)
    // 2: Buyer Received
    // 3: Delivery Failure
    // 4: Not Received (buyer full)
    // 5: Release Funds
    // 6: Dispute (tùy isBuyerWin)

    function calculatePayValue(
        uint256 totalPrice,
        uint256 shipFee,
        uint256 marketFee,
        bool isPrepaid
    ) internal pure returns (uint256) {
        return isPrepaid ? (totalPrice + 2 * shipFee + marketFee) : marketFee;
    }

    function calculateRefundAmounts(
        uint256 totalPrice,
        uint256 shipFee,
        uint256 marketFee,
        uint8 status,
        bool isPrepaid
    ) internal pure returns (uint256 buyerAmount, uint256 sellerAmount) {
        // require(status >= 1 && status <= 5, "Invalid refund case");
        if (status == BUYER_CANCELED) {
            buyerAmount = 0;
            sellerAmount = 0;
        } 
        else if (
            status == SELLER_CONFIRM_NOT_RECEIVED
        ) {
            // Cancel or Not Received
            buyerAmount = isPrepaid
                ? (totalPrice + 2 * shipFee + marketFee)
                : marketFee;
            sellerAmount = 0;
            // } else if (status == BUYER_RECEIVED) {  // Buyer Received
            //     buyerAmount = isPrepaid? shipFee : 0;
            //     sellerAmount = isPrepaid? (totalPrice + shipFee) : 0;
        } else if (status == BUYER_CONFIRM_DELIVERY_FAILURE) {
            // Delivery Failure
            buyerAmount = isPrepaid ? (totalPrice + marketFee) : 0;
            sellerAmount = isPrepaid ? (2 * shipFee) : 0;
        } else if (status == BUYER_RECEIVED) {
            // Release Funds
            buyerAmount = isPrepaid ? shipFee : 0;
            sellerAmount = isPrepaid ? (totalPrice + shipFee) : 0;
        }
    }

    function calculateDisputeRefunds(
        uint256 totalPrice,
        uint256 shipFee,
        uint256 marketFee,
        bool isNotReceived,
        bool isBuyerWin,
        bool isPrepaid
    ) internal pure returns (uint256 winnerAmount, uint256 loserAmount) {
        uint256 _totalPrice = isPrepaid ? totalPrice : 0;
        uint256 _shipFee = isPrepaid ? shipFee : 0;

        if (isNotReceived) {
            // Buyer_Not_Receive:
            if (isBuyerWin) {
                //  Buyer Win:
                // W:  total + ship*2 + marketFee, L: 0
                winnerAmount = (_totalPrice + 2 * _shipFee + marketFee);
                loserAmount = 0;
            } else {
                // Seller win:
                // W:  total + ship, L: 0
                winnerAmount = (_totalPrice + _shipFee);
                loserAmount = shipFee;
            }
        } else {
            // Seller_Cannot_Delivery
            if (isBuyerWin) {
                // Buyer win:
                // W:  total + ship, L: 0
                winnerAmount = (_totalPrice + 2 * _shipFee + marketFee);
                loserAmount = 0;
            } else {
                // Seller win:
                // W:  total + ship, L: 0
                winnerAmount = (_totalPrice + _shipFee);
                loserAmount = _shipFee;
            }
        }
    }
}
