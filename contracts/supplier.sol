// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface DaoInterface {
    function getStackInfo() external view returns (uint256, uint256);
    function getFeeInfo()
        external
        view
        returns (uint256, uint256, uint256, uint256);
    function isReviewer(address reviewer) external view returns (bool);
    function stacking() external view returns (address);
    function operator() external view returns (address);
}

interface StackInterface {
    function getStackOf(address memberAddress) external view returns (uint256);
}

contract Supplier is ReentrancyGuard {
    using Counters for Counters.Counter;

    enum PartnerStatus {
        None,
        Pending,
        Approved,
        Rejected
    }

    address public daoAddress;
    DaoInterface private daoInterface;
    StackInterface private stackInterface;

    // --- BRAND MANAGEMENT ---
    mapping(uint256 => address) private _brands;
    mapping(address => uint256) private _brandIds;
    Counters.Counter public brandCounter;
    mapping(address => bool) private _isVerified;
    mapping(address => address) private _verifier;

    // --- BRAND LISTS ---
    mapping(address => mapping(uint256 => address)) private _partners;
    mapping(address => mapping(address => uint256)) private _partnerIds;
    mapping(address => Counters.Counter) private _partnerCounters;

    mapping(address => mapping(uint256 => address)) private _requestList;
    mapping(address => mapping(address => uint256)) private _requestIds;
    mapping(address => Counters.Counter) private _requestCounters;

    mapping(address => mapping(uint256 => address)) private _rejectList;
    mapping(address => mapping(address => uint256)) private _rejectIds;
    mapping(address => Counters.Counter) private _rejectCounters;

    // --- SELLER TRACKING LIST ---
    mapping(address => mapping(uint256 => address)) private _sellerBrandList;
    mapping(address => mapping(address => uint256)) private _sellerBrandIds;
    mapping(address => Counters.Counter) private _sellerBrandCounters;

    mapping(address => mapping(address => PartnerStatus))
        private _partnerStatus;

    event BrandRegistered(address brandAddress);
    event BrandVerified(address indexed brandAddress);
    event BrandUnVerified(address indexed supplierAddress);
    event PartnerRequested(
        address indexed brandAddress,
        address indexed agentAddress,
        uint256 feePaid
    );
    event PartnerEnabled(
        address indexed brandAddress,
        address indexed agentAddress
    );
    event PartnerRejected(
        address indexed brandAddress,
        address indexed agentAddress
    );
    event PartnerDisabled(
        address indexed brandAddress,
        address indexed agentAddress
    );

    constructor(address _daoAddress) {
        daoAddress = _daoAddress;
        daoInterface = DaoInterface(daoAddress);
        stackInterface = StackInterface(daoInterface.stacking());
    }

    modifier onlyReviewer() {
        require(daoInterface.isReviewer(msg.sender), "Only reviewer allowed");
        _;
    }

    // --- BRAND FUNCTIONS ---

    function brandRegister() public {
        require(_brandIds[msg.sender] == 0, "Already registered");
        (uint256 minBrandStack, ) = daoInterface.getStackInfo();
        require(
            stackInterface.getStackOf(msg.sender) >= minBrandStack,
            "Insufficient stack"
        );

        brandCounter.increment();
        _brands[brandCounter.current()] = msg.sender;
        _brandIds[msg.sender] = brandCounter.current();
        emit BrandRegistered(msg.sender);
    }

    function verifyBrand(address brandAddress) public onlyReviewer {
        require(_brandIds[brandAddress] != 0, "Brand not registered");
        _isVerified[brandAddress] = true;
        _verifier[brandAddress] = msg.sender;
        emit BrandVerified(brandAddress);
    }

    function unVerifyBrand(address brandAddress) public onlyReviewer {
        address operator = daoInterface.operator();
        require(
            _verifier[brandAddress] == msg.sender || operator == msg.sender,
            "Invalid verifier"
        );
        _isVerified[brandAddress] = false;
        delete _verifier[brandAddress];
        emit BrandUnVerified(brandAddress);
    }

    function isBrand(address brandAddress) public view returns (bool) {
        return _brandIds[brandAddress] != 0;
    }

    function isVerifiedBrand(address brandAddress) public view returns (bool) {
        return _isVerified[brandAddress];
    }

    function getBrandAddress(uint256 index) public view returns (address) {
        return _brands[index];
    }

    function getBrandBatch(
        uint256[] calldata indexes
    ) public view returns (address[] memory) {
        uint256 length = indexes.length;
        address[] memory brands = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 index = indexes[i];
            brands[i] = _brands[index];
        }
        return brands;
    }

    // function enablePartner(address agentAddress) public payable nonReentrant {
    //     address brandAddress = msg.sender;
    //     require(_isVerified[brandAddress], "Only verified brand");
    //     require(agentAddress != address(0), "Invalid agent address");
    //     require(!isPartner(brandAddress, agentAddress), "Agent is already a partner");
    //     (, , uint256 brandFee, ) = daoInterface.getFeeInfo();

    //     _partnerCounters[brandAddress].increment();
    //     _partners[brandAddress][_partnerCounters[brandAddress].current()] = agentAddress;
    //     _partnerIds[brandAddress][agentAddress] = _partnerCounters[brandAddress].current();

    //     require(msg.value >= brandFee, "Fee is not enough.");
    //     // if (msg.value > brandFee) {
    //     //     (bool success, ) = msg.sender.call{value: msg.value - brandFee}("");
    //     //     require(success, "Refund failed");
    //     // }
    //     // (bool successDao, ) = _daoAddress.call{value: brandFee}("");
    //     // require(successDao, "Transfer to DAO failed");
    //             // Forward fee to DAO
    //     _forwardFeeToDAO(msg.value);
    //     emit PartnerEnabled(brandAddress, agentAddress);
    // }

    // --- SELLER (AGENT) FUNCTIONS ---

    function requestToJoin(address brandAddress) public payable nonReentrant {
        require(_brandIds[brandAddress] != 0, "Brand does not exist");

        PartnerStatus status = _partnerStatus[brandAddress][msg.sender];
        require(status == PartnerStatus.None, "Invalid");

        (, , , uint256 sellerFee) = daoInterface.getFeeInfo();
        require(msg.value >= sellerFee, "Insufficient fee");

        // Set Status
        _partnerStatus[brandAddress][msg.sender] = PartnerStatus.Pending;

        // Update Brand's Request List
        _requestCounters[brandAddress].increment();
        uint256 reqId = _requestCounters[brandAddress].current();
        _requestList[brandAddress][reqId] = msg.sender;
        _requestIds[brandAddress][msg.sender] = reqId;

        // Update Seller's Tracking List
        _sellerBrandCounters[msg.sender].increment();
        uint256 sId = _sellerBrandCounters[msg.sender].current();
        _sellerBrandList[msg.sender][sId] = brandAddress;
        _sellerBrandIds[msg.sender][brandAddress] = sId;

        // Forward fee to DAO
        _forwardFeeToDAO(msg.value);

        emit PartnerRequested(brandAddress, msg.sender, msg.value);
    }

    // --- BRAND APPROVAL PROCESS ---

    function approvePartner(address agentAddress) public payable nonReentrant {
        address brandAddress = msg.sender;
        require(_isVerified[brandAddress], "Only verified brands");

        PartnerStatus status = _partnerStatus[brandAddress][agentAddress];
        require(
            status == PartnerStatus.Pending || status == PartnerStatus.Rejected,
            "Invalid valid request"
        );

        (, , uint256 brandFee, ) = daoInterface.getFeeInfo();
        require(msg.value >= brandFee, "Insufficient fee");

        // Remove from old list based on status
        if (status == PartnerStatus.Pending) {
            _removeFromRequestList(brandAddress, agentAddress);
        } else if (status == PartnerStatus.Rejected) {
            _removeFromRejectList(brandAddress, agentAddress);
        }

        // Add to Partner List
        _partnerCounters[brandAddress].increment();
        uint256 newPId = _partnerCounters[brandAddress].current();
        _partners[brandAddress][newPId] = agentAddress;
        _partnerIds[brandAddress][agentAddress] = newPId;

        _partnerStatus[brandAddress][agentAddress] = PartnerStatus.Approved;

        // Forward fee to DAO
        _forwardFeeToDAO(msg.value);
        emit PartnerEnabled(brandAddress, agentAddress);
    }

    function rejectPartner(address agentAddress) public payable {
        address brandAddress = msg.sender;
        PartnerStatus status = _partnerStatus[brandAddress][agentAddress];
        require(
            status == PartnerStatus.Pending || status == PartnerStatus.Approved,
            "Only pending requests"
        );
        (, , uint256 brandFee, ) = daoInterface.getFeeInfo();
        require(msg.value >= brandFee, "Insufficient fee");
        // _removeFromRequestList(brandAddress, agentAddress);

        if (status == PartnerStatus.Pending) {
            _removeFromRequestList(brandAddress, agentAddress);
        } else if (status == PartnerStatus.Approved) {
            _removeFromPartnerList(brandAddress, agentAddress);
            _removeFromSellerBrandList(agentAddress, brandAddress);
        } else {
            revert("Invalid status");
        }

        // Add to Reject List
        _rejectCounters[brandAddress].increment();
        uint256 newRId = _rejectCounters[brandAddress].current();
        _rejectList[brandAddress][newRId] = agentAddress;
        _rejectIds[brandAddress][agentAddress] = newRId;

        _partnerStatus[brandAddress][agentAddress] = PartnerStatus.Rejected;

        // Forward fee to DAO
        // (bool successDao, ) = daoAddress.call{value: msg.value}("");
        // require(successDao, "Failed to transfer fee");
        _forwardFeeToDAO(msg.value);

        emit PartnerRejected(brandAddress, agentAddress);
    }

    // function disablePartner(address agentAddress) public payable nonReentrant {
    //     address brandAddress = msg.sender;
    //     require(_partnerStatus[brandAddress][agentAddress] == PartnerStatus.Approved, "Only approved partner");

    //     (, , uint256 brandFee, ) = daoInterface.getFeeInfo();
    //     require(msg.value >= brandFee, "Insufficient fee");

    //     // Cleanup Brand and Seller lists
    //     _removeFromPartnerList(brandAddress, agentAddress);
    //     _removeFromSellerBrandList(agentAddress, brandAddress);

    //     _partnerStatus[brandAddress][agentAddress] = PartnerStatus.None;

    //     // Forward fee to DAO
    //     _forwardFeeToDAO(msg.value);

    //     emit PartnerDisabled(brandAddress, agentAddress);
    // }

    // function getVerifier(address brandAddress) public view returns (address) {
    //     return _verifier[brandAddress];
    // }

    // function getDaoAddress() public view returns (address) {
    //     return _daoAddress;
    // }

    function getPartnerIndex(
        address brandAddress,
        address sellerAddress
    ) public view returns (uint256) {
        return _partnerIds[brandAddress][sellerAddress];
    }

    function getPartnerCount(
        address brandAddress
    ) public view returns (uint256) {
        return _partnerCounters[brandAddress].current();
    }

    // --- BỔ SUNG CÁC HÀM LẤY SỐ LƯỢNG (GET COUNTS) ---

    function getRequestCount(
        address brandAddress
    ) public view returns (uint256) {
        return _requestCounters[brandAddress].current();
    }

    function getRejectCount(
        address brandAddress
    ) public view returns (uint256) {
        return _rejectCounters[brandAddress].current();
    }

    function getSellerBrandCount(
        address sellerAddress
    ) public view returns (uint256) {
        return _sellerBrandCounters[sellerAddress].current();
    }

    // --- VIEW FUNCTIONS ---

    function isPartner(
        address brandAddress,
        address agentAddress
    ) public view returns (bool) {
        // if (brandAddress == agentAddress) return true;
        return
            brandAddress == agentAddress ||
            _partnerStatus[brandAddress][agentAddress] ==
            PartnerStatus.Approved;
    }

    function getPartnerStatus(
        address brandAddress,
        address agentAddress
    ) public view returns (PartnerStatus) {
        return _partnerStatus[brandAddress][agentAddress];
    }

    function getPartnerBatch(
        address brandAddress,
        uint256[] calldata indexes
    ) public view returns (address[] memory) {
        address[] memory list = new address[](indexes.length);
        for (uint i = 0; i < indexes.length; i++) {
            list[i] =_partners[brandAddress][indexes[i]];
        }
        return list;
    }

    function getPartnerRequestBatch(
        address brandAddress,
        uint256[] calldata indexes
    ) public view returns (address[] memory) {
        address[] memory list = new address[](indexes.length);
        for (uint i = 0; i < indexes.length; i++) {
            list[i] = _requestList[brandAddress][indexes[i]];
        }
        return list;
    }

    function getRejectBatch(
        address brandAddress,
        uint256[] calldata indexes
    ) public view returns (address[] memory) {
        address[] memory list = new address[](indexes.length);
        for (uint i = 0; i < indexes.length; i++) {
            list[i] = _rejectList[brandAddress][indexes[i]];
        }
        return list;
    }

    function getSellerBrandBatch(
        address sellerAddress,
        uint256[] calldata indexes
    ) public view returns (address[] memory) {
        address[] memory list = new address[](indexes.length);
        for (uint i = 0; i < indexes.length; i++) {
            list[i] = _sellerBrandList[sellerAddress][indexes[i]];
        }
        return list;
    }

    // --- INTERNAL HELPERS (Swap and Pop) ---

    function _removeFromRequestList(address brand, address agent) internal {
        uint256 id = _requestIds[brand][agent];
        uint256 lastId = _requestCounters[brand].current();
        address lastAddr = _requestList[brand][lastId];
        if (id != lastId) {
            _requestList[brand][id] = lastAddr;
            _requestIds[brand][lastAddr] = id;
        }
        delete _requestList[brand][lastId];
        delete _requestIds[brand][agent];
        _requestCounters[brand].decrement();
    }

    function _removeFromRejectList(address brand, address agent) internal {
        uint256 id = _rejectIds[brand][agent];
        uint256 lastId = _rejectCounters[brand].current();
        address lastAddr = _rejectList[brand][lastId];
        if (id != lastId) {
            _rejectList[brand][id] = lastAddr;
            _rejectIds[brand][lastAddr] = id;
        }
        delete _rejectList[brand][lastId];
        delete _rejectIds[brand][agent];
        _rejectCounters[brand].decrement();
    }

    function _removeFromPartnerList(address brand, address agent) internal {
        uint256 pId = _partnerIds[brand][agent];
        uint256 lastPId = _partnerCounters[brand].current();
        address lastAgent = _partners[brand][lastPId];
        if (pId != lastPId) {
            _partners[brand][pId] = lastAgent;
            _partnerIds[brand][lastAgent] = pId;
        }
        delete _partners[brand][lastPId];
        delete _partnerIds[brand][agent];
        _partnerCounters[brand].decrement();
    }

    function _removeFromSellerBrandList(
        address seller,
        address brand
    ) internal {
        uint256 id = _sellerBrandIds[seller][brand];
        uint256 lastId = _sellerBrandCounters[seller].current();
        address lastBrand = _sellerBrandList[seller][lastId];
        if (id != lastId) {
            _sellerBrandList[seller][id] = lastBrand;
            _sellerBrandIds[seller][lastBrand] = id;
        }
        delete _sellerBrandList[seller][lastId];
        delete _sellerBrandIds[seller][brand];
        _sellerBrandCounters[seller].decrement();
    }

    // --- INTERNAL FEE FORWARDER ---

    function _forwardFeeToDAO(uint256 amount) internal {
        (bool successDao, ) = daoAddress.call{value: amount}("");
        require(successDao, "Failed to transfer fee");
    }
}
