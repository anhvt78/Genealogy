// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface DaoInterface {
    function getStackInfo() external view returns (uint256, uint256);
    function isReviewer(address reviewer) external view returns (bool);
    function stacking() external view returns (address);
}

interface StackInterface {
    function getStackOf (address memberAddress) external view returns (uint256);
}

contract Arbitrator is ReentrancyGuard {
    using Counters for Counters.Counter;

    address private  _daoAddress;

    DaoInterface private daoInterface;
    StackInterface private stackInterface;

    mapping (uint256 => address) private _arbitrators; //id -> arbitratorAddress
    mapping (address => uint256) private _arbitratorIds; //arbitratorAddress -> id)
    Counters.Counter public arbitratorCounter;

    mapping (address => bool) private  _isVerified;

    mapping (address => uint256) private _disputeFee;

    event ArbitratorVerified(address indexed arbitratorAddress);
    event ArbitratorUnVerified(address indexed arbitratorAddress);

    constructor(address daoAddress) {
        _daoAddress = daoAddress;
        daoInterface = DaoInterface(_daoAddress);
        address _stackAddress = daoInterface.stacking();
        stackInterface = StackInterface(_stackAddress);
    }
    
    event ArbitratorRegister(address arbitratorAddress);
    function arbitratorRegister() public {
        require(_arbitratorIds[msg.sender] == 0, "Arbitrator is already registered");
        (uint256 minArbitratorStack, ) = daoInterface.getStackInfo();
        require(
            stackInterface.getStackOf(msg.sender) >= minArbitratorStack,
            "Insufficient tokens"
        );
        
        arbitratorCounter.increment();
        _arbitrators[arbitratorCounter.current()] = msg.sender;
        _arbitratorIds[msg.sender] = arbitratorCounter.current();
        emit ArbitratorRegister(msg.sender);
    }

    event ArbitratorUnRegister(address arbitratorAddress);
    function arbitratorUnRegister() public {
        require(_arbitratorIds[msg.sender] != 0, "Not registered");
        uint256 indexToRemove = _arbitratorIds[msg.sender]; // Lấy index của item cần xóa
        uint256 lastIndex = arbitratorCounter.current(); // Lấy index của phần tử cuối cùng
        address lastItemId = _arbitrators[lastIndex]; // Lấy itemId_ của phần tử cuối cùng

        if (indexToRemove != lastIndex) { 
            _arbitrators[indexToRemove] = lastItemId;
            _arbitratorIds[lastItemId] = indexToRemove; 
        }

        delete _arbitrators[lastIndex]; 
        delete _arbitratorIds[msg.sender]; 
        arbitratorCounter.decrement();
        
        emit ArbitratorUnRegister(msg.sender);
    }

    function verifyArbitrator(address arbitratorAddress) public onlyReviewer {
        require(arbitratorAddress != address(0), "Invalid arbitrator address");
        require(_arbitratorIds[arbitratorAddress] != 0, "Arbitrator not registered");
        _isVerified[arbitratorAddress] = true;
        emit ArbitratorVerified(arbitratorAddress);
    }

    function unVerifyArbitrator(address arbitratorAddress) public onlyReviewer {
        _isVerified[arbitratorAddress] = false;
        emit ArbitratorUnVerified(arbitratorAddress);
    }


    function isArbitrator (address arbitratorAddress) public view returns (bool) {
        return _arbitratorIds[arbitratorAddress] != 0;
    }

    function isVerifiedArbitrator(address arbitratorAddress) public view returns (bool) {
        return _isVerified[arbitratorAddress];
    }

    function getDaoAddress () public view returns (address) {
        return _daoAddress;
    }

    function getArbitratorAddress (uint256 index) public view returns (address) {
        return _arbitrators[index];
    }

    function getArbitratorIndex (address arbitratorAddress) public view returns (uint256) {
        return _arbitratorIds[arbitratorAddress];
    }

    function getArbitratorBatch(uint256[] calldata indexes) public view returns (address[] memory) 
    {
        uint256 length = indexes.length;
        address[] memory arbitrators = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 index = indexes[i];
            arbitrators[i] = _arbitrators[index];
        }
        return arbitrators;
    }

    function setDisputeFee (uint256 disputeFee) public {
        require(isArbitrator(msg.sender), "Not yet registed");
        _disputeFee[msg.sender] = disputeFee;
    }

    function getDisputeFee (address arbitrator) public view returns (uint256) {
        return _disputeFee[arbitrator];
    }

    modifier onlyReviewer() {
        require(daoInterface.isReviewer(msg.sender), "Only reviewer");
        _;
    }
}
