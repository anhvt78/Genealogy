// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {LSP7DigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

interface DaoInterface {
    function getTimeInfo() external view returns (uint256, uint256, uint256);
}

contract Stacking {
    using Counters for Counters.Counter;

    DaoInterface private daoInterface;

    uint256 public totalStack;

    mapping(address => uint256) private _stackOf;

    struct UnStackInfo {
        uint256 amount;
        uint256 startAt;
        address recipient;
        bool completed;
    }

    mapping(uint256 => UnStackInfo) private _pendingUnstack;
    Counters.Counter public pendingUnstackCounter;

    event Stacked(address indexed account, uint256 amount);
    event UnStackRequestCreated(
        uint256 indexed index,
        address indexed account,
        uint256 amount,
        uint256 timestamp
    );
    event UnStackCompleted(
        uint256 indexed index,
        address indexed account,
        uint256 amount
    );

    address private _daoAddress;
    address private _m2cAddress;

    constructor(address m2cAddress) {
        _daoAddress = msg.sender;
        _m2cAddress = m2cAddress;
        
        daoInterface = DaoInterface(_daoAddress);
    }

    function stacking(uint256 amount) public {
        require(
            amount <= LSP7DigitalAsset(payable(_m2cAddress)).balanceOf(msg.sender),
            "Insufficient balance"
        );
        require(
            LSP7DigitalAsset(payable(_m2cAddress)).authorizedAmountFor(address(this), msg.sender) >= amount,
            "Allowance required"
        );

        // ERC20(_m2cAddress).transferFrom(msg.sender, address(this), amount);
        LSP7DigitalAsset(payable(_m2cAddress)).transfer(msg.sender, address(this), amount, true, "0x");
        _stackOf[msg.sender] += amount;
        totalStack += amount;

        emit Stacked(msg.sender, amount);
    }

    function unStackRequest(uint256 amount) public {
        require(amount > 0, "Amount must be greater than zero");
        require(_stackOf[msg.sender] >= amount, "Insufficient balance");

        pendingUnstackCounter.increment();
        uint256 index = pendingUnstackCounter.current();

        _pendingUnstack[index] = UnStackInfo({
            amount: amount,
            startAt: block.timestamp,
            recipient: msg.sender,
            completed: false
        });

        _stackOf[msg.sender] -= amount;

        emit UnStackRequestCreated(
            index,
            msg.sender,
            amount,
            block.timestamp
        );
    }

    function unStackComplete(uint256 index) public {
        require(index <= pendingUnstackCounter.current(), "Invalid request ID");
        (, , uint256 _votingTime) = daoInterface.getTimeInfo();
        UnStackInfo memory request = _pendingUnstack[index];

        require(!request.completed, "Unstack already completed");
        require(
            block.timestamp >= request.startAt + _votingTime,
            "Pending time"
        );

        // M2C(payable(_m2cAddress)).transfer(request.recipient, request.amount);
        LSP7DigitalAsset(payable(_m2cAddress)).transfer(address(this),request.recipient, request.amount, true, "0x");
        totalStack -= request.amount;

        request.completed = true;

        emit UnStackCompleted(index, request.recipient, request.amount);
    }

    modifier onlyDao {
        require(msg.sender == _daoAddress, "Only DAO can call this function");
        _;
    } 

    function getStackOf (address memberAddress) public view returns (uint256) {
        return _stackOf[memberAddress];
    }
        // mapping(uint256 => UnStackInfo) public pendingUnstack;
    
    function getPendingUnstackOf (uint256 index) public view returns (UnStackInfo memory) {
        return _pendingUnstack[index];
    }
}
