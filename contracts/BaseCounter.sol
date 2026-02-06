// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract BaseCounter {
    using Counters for Counters.Counter;
    // Mapping từ khóa bytes32 đến bộ đếm
    mapping(bytes32 => Counters.Counter) private _counters; 

    // Hàm tăng bộ đếm
    function _incrementCounter(address addr, bytes32 dataType) internal {
        // bytes32 key = _generateKey(addr, dataType);
        bytes32 key = _generateKey(addr, dataType);
        _counters[key].increment();
    }

    // Hàm lấy giá trị bộ đếm
    function getPurchaseCounterData(address addr, bytes32 dataType) public view returns (uint256) {
        bytes32 key = _generateKey(addr, dataType);
        return _counters[key].current();
    }

    function _generateKey(address addr, bytes32 dataType) internal pure returns (bytes32) {
        return keccak256(abi.encode(addr, dataType));
    }

}