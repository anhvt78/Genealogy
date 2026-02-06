// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Library mới để tách các tính toán (calculations) từ MarketPlace.sol
// Thư viện này chứa các hàm pure hoặc view để tính toán giá cả, tổng hợp, và logic liên quan đến phí, không thay đổi trạng thái.
// Các hàm yêu cầu dữ liệu từ storage sẽ được truyền qua tham số để tránh phụ thuộc trực tiếp vào storage của hợp đồng.

library CommLib {

    function generateKey(address addr, bytes32 dataType) internal pure returns (bytes32) {
        return keccak256(abi.encode(addr, dataType));
    }

    function generateSaleId(address seller, address productId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(seller, productId));
    }
}