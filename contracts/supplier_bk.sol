// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface DaoInterface {
    function getStackInfo() external view returns (uint256, uint256);
    function getFeeInfo() external view returns (uint256, uint256, uint256, uint256);
    function isReviewer(address reviewer) external view returns (bool);
    function stacking() external view returns (address);
    function operator() external view returns (address);
}

interface StackInterface {
    function getStackOf (address memberAddress) external view returns (uint256);
}

contract Supplier is ReentrancyGuard {
    using Counters for Counters.Counter;

    address private  _daoAddress;

    DaoInterface private daoInterface;
    StackInterface private stackInterface;

    mapping (uint256 => address) private _brands; //id -> brandAddress
    mapping (address => uint256) private _brandIds; //brandAddress -> id)
    Counters.Counter public brandCounter;

    mapping (address => bool) private  _isVerified;
    mapping (address => address) private  _verifier;

    mapping (address => mapping (uint256 => address)) private _partners;
    mapping (address => mapping (address => uint256)) private _partnerIds;
    mapping (address => Counters.Counter) private _partnerCounters;

    event BrandVerified(address indexed supplierAddress);
    event BrandUnVerified(address indexed supplierAddress);
    event PartnerEnabled(
        address indexed supplierAddress,
        address indexed agentAddress
    );
    event PartnerDisabled(
        address indexed supplierAddress,
        address indexed agentAddress
    );

    constructor(address daoAddress) {
        _daoAddress = daoAddress;
        daoInterface = DaoInterface(_daoAddress);
        address _stackAddress = daoInterface.stacking();
        stackInterface = StackInterface(_stackAddress);
    }
    
    event BrandRegister(address brandAddress);
    function brandRegister() public {
        require(_brandIds[msg.sender] == 0, "Brand is already registered");
        (uint256 minBrandStack, ) = daoInterface.getStackInfo();
        require(
            stackInterface.getStackOf(msg.sender) >= minBrandStack,
            "Insufficient tokens"
        );
        
        brandCounter.increment();
        _brands[brandCounter.current()] = msg.sender;
        _brandIds[msg.sender] = brandCounter.current();
        emit BrandRegister(msg.sender);
    }

    event BrandUnRegister(address arbitratorAddress);
    function brandUnRegister() public {
        require(_brandIds[msg.sender] != 0, "Not registered");
        uint256 indexToRemove = _brandIds[msg.sender]; // Lấy index của item cần xóa
        uint256 lastIndex = brandCounter.current(); // Lấy index của phần tử cuối cùng
        address lastItemId = _brands[lastIndex]; // Lấy itemId_ của phần tử cuối cùng

        if (indexToRemove != lastIndex) { 
            _brands[indexToRemove] = lastItemId;
            _brandIds[lastItemId] = indexToRemove; 
        }

        delete _brands[lastIndex]; 
        delete _brandIds[msg.sender]; 
        brandCounter.decrement();
        emit BrandUnRegister(msg.sender);
    }

    function verifyBrand(address brandAddress) public onlyReviewer {
        require(brandAddress != address(0), "Invalid brand address");
        require(_brandIds[brandAddress] != 0, "Brand not registered");
        _isVerified[brandAddress] = true;
        _verifier[brandAddress] = msg.sender;
        emit BrandVerified(brandAddress);
    }

    function unVerifyBrand(address brandAddress) public onlyReviewer {
        address operator = daoInterface.operator();
        require(_verifier[brandAddress] == msg.sender || operator == msg.sender, "Invalid verifier");
        _isVerified[brandAddress] = false;
        delete _verifier[brandAddress]; 
        emit BrandUnVerified(brandAddress);
    }

    function isPartner(
        address brandAddress,
        address agentAddress
    ) public view returns (bool) {
        return _partnerIds[brandAddress][agentAddress] != 0 || brandAddress == agentAddress;
    }

    function enablePartner(address agentAddress) public payable nonReentrant {
        address brandAddress = msg.sender;
        require(_isVerified[brandAddress], "Only verified brand");
        require(agentAddress != address(0), "Invalid agent address");
        require(!isPartner(brandAddress, agentAddress), "Agent is already a partner");
        (, , uint256 brandFee, ) = daoInterface.getFeeInfo();
        

        _partnerCounters[brandAddress].increment();
        _partners[brandAddress][_partnerCounters[brandAddress].current()] = agentAddress;
        _partnerIds[brandAddress][agentAddress] = _partnerCounters[brandAddress].current();
        
        require(msg.value >= brandFee, "Fee is not enough.");
        if (msg.value > brandFee) {
            (bool success, ) = msg.sender.call{value: msg.value - brandFee}("");
            require(success, "Refund failed");
        }
        (bool successDao, ) = _daoAddress.call{value: brandFee}("");
        require(successDao, "Transfer to DAO failed");
        emit PartnerEnabled(brandAddress, agentAddress);
    }

    function disablePartner(address agentAddress) public payable nonReentrant {
        address brandAddress = msg.sender;
        require(isPartner(brandAddress, agentAddress), "Agent is not a partner");
        (, , uint256 brandFee, ) = daoInterface.getFeeInfo();
        require(msg.value >= brandFee, "Fee is not enough.");

        uint256 lastId = _partnerCounters[brandAddress].current();
        
        if (_partnerIds[brandAddress][agentAddress] != lastId) {
            _partners[brandAddress][_partnerIds[brandAddress][agentAddress]] = _partners[brandAddress][lastId];
            _partnerIds[brandAddress][_partners[brandAddress][lastId]] = _partnerIds[brandAddress][agentAddress];
        } 
            
        delete _partners[brandAddress][lastId];
        delete _partnerIds[brandAddress][agentAddress];
        _partnerCounters[brandAddress].decrement();

        (bool success, ) = payable(_daoAddress).call{value: msg.value}("0x");
        require(success, "Payment fee failed");

        emit PartnerDisabled(brandAddress, agentAddress);
    }

    function isBrand (address brandAddress) public view returns (bool) {
        return _brandIds[brandAddress] != 0;
    }

    function isVerifiedBrand(address brandAddress) public view returns (bool) {
        return _isVerified[brandAddress];
    }

    function getVerifier(address brandAddress) public view returns (address) {
        return _verifier[brandAddress];
    }

    function getDaoAddress () public view returns (address) {
        return _daoAddress;
    }

    function getBrandAddress (uint256 index) public view returns (address) {
        return _brands[index];
    }

    function getBrandIndex (address brandAddress) public view returns (uint256) {
        return _brandIds[brandAddress];
    }

    function getPartnerAddress (address brandAddress, uint256 index) public view returns (address) {
        return _partners[brandAddress][index];
    }

    function getPartnerIndex (address brandAddress, address sellerAddress) public view returns (uint256) {
        return _partnerIds[brandAddress][sellerAddress];
    }

    function getPartnerCount (address brandAddress) public view returns (uint256) {
        return _partnerCounters[brandAddress].current();
    }

    function getBrandBatch(uint256[] calldata indexes) public view returns (address[] memory) 
    {
        uint256 length = indexes.length;
        address[] memory brands = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 index = indexes[i];
            brands[i] = _brands[index];
        }
        return brands;
    }

    modifier onlyReviewer() {
        require(daoInterface.isReviewer(msg.sender), "Only reviewer");
        _;
    }


}
