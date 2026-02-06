// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Stacking} from "./staking.sol";
import {M2C} from "./m2c.sol";
import "./constants/daoConstant.sol";
import "./structs/daoStruct.sol";

contract DAO is ReentrancyGuard {
    using Counters for Counters.Counter;   

    address public operator;

    uint256 private immutable _startAt;
    uint256 private _phaseTime = INITIAL_PHASE_TIME; //1w
    uint256 private _voteTime = INITIAL_VOTE_TIME;

    uint256 private _proposalFee = INITIAL_PROPOSAL_FEE;
    uint256 private _marketFee = INITIAL_MARKET_FEE;
    uint256 private _brandFee = INITIAL_BRAND_FEE;
    uint256 private _sellerFee = INITIAL_SELLER_FEE;
    uint256 private _minBrandStack = INITIAL_MIN_BRAND_STACK;
    uint256 private _minSellerStack = INITIAL_MIN_SELLER_STACK;   

    mapping (uint256 => address) private _reviewers;
    mapping (address => uint256) private _reviewerIds;
    Counters.Counter public reviewerCounter;

    M2C public m2c;
    Stacking public stacking;
    address private immutable _m2cAddress;

    address public usdtAddress = USDT_CONTRACT_ADDRESS;

    constructor() {
        operator = msg.sender;
        m2c = new M2C(operator);
        _m2cAddress = address(m2c);
        stacking = new Stacking(_m2cAddress);
        _startAt = block.timestamp;
    }

    TokenForSale public tokenForSale;

    Counters.Counter public approveCounter;
    mapping(uint256 => Approve) private _approves;
    mapping(address => mapping(uint256 => bool)) private _isVoted;
    mapping(address => mapping(uint256 => uint256)) private _proposalCounter;

    Counters.Counter public operatorCounter;
    Counters.Counter public paramCounter;
    Counters.Counter public feeCounter;
    Counters.Counter public stackCounter;
    Counters.Counter public releaseCounter;

    mapping(uint256 => OperatorProposal) private _operatorProposals;
    mapping(uint256 => ParamProposal) private _paramProposals;
    mapping(uint256 => FeeProposal) private _feeProposals;
    mapping(uint256 => StackProposal) private _stackProposals;
    mapping(uint256 => ReleaseProposal) private _releaseProposals;

    event Vote(
        uint256 indexed approveId,
        address indexed voter,
        uint256 voteCount
    );
    event WithDraw(address indexed account, uint256 amount);
    event BuyToken(address indexed buyer, uint256 amount);

    function getFeeInfo()
        external
        view
        returns (uint256, uint256, uint256, uint256)
    {
        return (_proposalFee, _marketFee, _brandFee, _sellerFee);
    }

    function getStackInfo() external view returns (uint256, uint256) {
        return (_minBrandStack, _minSellerStack);
    }

    function getTimeInfo() external view returns (uint256, uint256, uint256) {
        return (_startAt, _phaseTime, _voteTime);
    }

    function vote(uint256 approveId) public {
        require(stacking.getStackOf(msg.sender) > 0, "Only stacker");
        require(lockedForVoting(), "Not voting time");
        require(!_isVoted[msg.sender][approveId], "Already voted");
        require(
            block.timestamp - _approves[approveId].createdAt < _phaseTime,
            "Voting period over"
        );

        uint256 voterStack = stacking.getStackOf(msg.sender);
        _approves[approveId].voteCount += voterStack;
        _isVoted[msg.sender][approveId] = true;
        emit Vote(approveId, msg.sender, voterStack);
    }

    function withDraw(uint256 amountToken) public nonReentrant {
        require(amountToken > 0, "Amount > 0");
        require(
            M2C(payable(_m2cAddress)).authorizedAmountFor(address(this), msg.sender) >= amountToken,
            "M2C token allowance required"
        );
        uint256 totalSupplyToken = m2c.totalSupply();
        require(totalSupplyToken > 0, "No supply");

        // Tính toán phần LYX và USDT được rút tỷ lệ với amountToken
        uint256 contractLyxBalance = address(this).balance;
        uint256 lyxToWithdraw = contractLyxBalance > 0 ? ((contractLyxBalance * amountToken) / totalSupplyToken) : 0;

        uint256 usdtBalance = M2C(payable(usdtAddress)).balanceOf(address(this));
        uint256 usdtToWithdraw = usdtBalance > 0 ? ((usdtBalance * amountToken) / totalSupplyToken) : 0;

        // Chuyển ETH an toàn
        if (lyxToWithdraw > 0) {
            (bool success, ) = payable(msg.sender).call{value: lyxToWithdraw}("0x");
            require(success, "ETH transfer failed");
        }

        if (usdtToWithdraw > 0) {
            M2C(payable(usdtAddress)).transfer(address(this), msg.sender, usdtToWithdraw, true, "0x");
        }


        M2C(payable(_m2cAddress)).transfer(msg.sender, address(this), amountToken, true, "0x");
        m2c.burn(address(this),amountToken, "");

        emit WithDraw(msg.sender, amountToken);
    }

    function buyToken(uint256 amount) public payable nonReentrant {
        require(amount <= tokenForSale.amount, "Not enough tokens for sale");
        uint256 price = tokenForSale.price * amount;

        require(msg.value >= price, "Not enough value");

        if (msg.value > price) {
            // payable(msg.sender).transfer(msg.value - price);
            (bool success, ) = payable(msg.sender).call{value: msg.value - price}("0x");
            require(success, "Payment failed");
        }

        M2C(payable(_m2cAddress)).transfer(address(this),msg.sender, amount, true , "0x");

        tokenForSale.amount -= amount;

        emit BuyToken(msg.sender, amount);
    }

    function lockedForVoting() public view returns (bool) {
        return (block.timestamp - _startAt) % _phaseTime <= _voteTime;
    }

    event OperatorProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address operator,
        uint256 approveId,
        uint256 createdAt
    );

    function createOperatorProposal(
        address newOperator,
        string memory reason
    ) public payable onlyProposalReady {
        require(newOperator != address(0), "Invalid operator address");
        operatorCounter.increment();
        uint256 newId = operatorCounter.current();
        uint256 approveId = _createApprove("Operator Proposal", newId);

        _operatorProposals[newId] = OperatorProposal({
            details: ProposalDetails(msg.sender, reason, approveId),
            newOperator: newOperator
        });

        emit OperatorProposalCreated(
            newId,
            msg.sender,
            newOperator,
            approveId,
            _approves[approveId].createdAt
        );
    }

    event ParamProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 phaseTime,
        uint256 votingTime,
        uint256 approveId,
        uint256 createdAt
    );
    function createParamProposal(
        uint256 phaseTime,
        uint256 votingTime,
        string memory reason
    ) public payable onlyProposalReady {
        require(phaseTime > 0, "Invalid phase time");
        require(votingTime > 0 && votingTime < phaseTime, "Invalid voting time");
        paramCounter.increment();
        uint256 newId = paramCounter.current();
        uint256 approveId = _createApprove("Parameters proposal", newId);

        _paramProposals[newId] = ParamProposal({
            phaseTime: phaseTime,
            votingTime: votingTime,
            details: ProposalDetails(msg.sender, reason, approveId)
        });


        emit ParamProposalCreated(
            newId,
            msg.sender,
            phaseTime,
            votingTime,
            approveId,
            _approves[approveId].createdAt
        );
    }

    event FeeProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 createProposalFee,
        uint256 marketFee,
        uint256 brandFee,
        uint256 sellerFee,
        uint256 approveId,
        uint256 createdAt
    );
    function createFeeProposal(
        uint256 proposalFee,
        uint256 marketFee,
        uint256 brandFee,
        uint256 sellerFee,
        string memory reason
    ) public payable onlyProposalReady {
        feeCounter.increment();
        uint256 newId = feeCounter.current();
        uint256 approveId = _createApprove("Fees proposal", newId);

        _feeProposals[newId] = FeeProposal({
            details: ProposalDetails(msg.sender, reason, approveId),
            newProposalFee: proposalFee,
            newMarketFee: marketFee,
            newBrandFee: brandFee,
            newSellerFee: sellerFee
        });

        emit FeeProposalCreated(
            newId,
            msg.sender,
            proposalFee,
            marketFee,
            brandFee,
            sellerFee,
            approveId,
            _approves[approveId].createdAt
        );
    }

    event StackProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 minBrandStack,
        uint256 minSellerStack,
        uint256 approveId,
        uint256 createdAt
    );
    function createStackProposal(
        uint256 minBrandStack,
        uint256 minSellerStack,
        string memory reason
    ) public payable onlyProposalReady {
        stackCounter.increment();
        uint256 newId = stackCounter.current();
        uint256 approveId = _createApprove("Stack proposal", newId);

        _stackProposals[newId] = StackProposal({
            details: ProposalDetails(msg.sender, reason, approveId),
            newMinBrandStack: minBrandStack,
            newMinSellerStack: minSellerStack
        });

        emit StackProposalCreated(
            newId,
            msg.sender,
            minBrandStack,
            minSellerStack,
            approveId,
            _approves[approveId].createdAt
        );
    }

    event ReleaseProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount,
        uint256 price,
        uint256 approveId,
        uint256 createdAt
    );
    function createReleaseProposal(
        uint256 amount,
        uint256 price,
        string memory reason
    ) public payable onlyProposalReady {
        require(
            tokenForSale.amount == 0,
            "Previously issued tokens are not yet finished"
        );
        releaseCounter.increment();
        uint256 newId = releaseCounter.current();
        uint256 approveId = _createApprove("Release proposal", newId);

        _releaseProposals[newId] = ReleaseProposal({
            details: ProposalDetails(msg.sender, reason, approveId),
            amount: amount,
            price: price
        });

        emit ReleaseProposalCreated(
            newId,
            msg.sender,
            amount,
            price,
            approveId,
            _approves[approveId].createdAt
        );
    }

    // Execute functions to perform each proposal type
    event ExecuteOperatorProposal(uint256 id);
    function executeOperatorProposal(
        uint256 id
    ) public onlyApproved(_operatorProposals[id].details.approveId) {
        operator = _operatorProposals[id].newOperator;
        _approves[_operatorProposals[id].details.approveId].executed = true;
        emit ExecuteOperatorProposal(id);
    }

    event ExecuteParamProposal(uint256 id);
    function executeParamProposal(
        uint256 id
    ) public onlyApproved(_paramProposals[id].details.approveId) {
        _phaseTime = _paramProposals[id].phaseTime;
        _voteTime = _paramProposals[id].votingTime;

        _approves[_paramProposals[id].details.approveId].executed = true;
        emit ExecuteParamProposal(id);
    }

    event ExecuteFeeProposal(uint256 id);
    function executeFeeProposal(
        uint256 id
    ) public onlyApproved(_feeProposals[id].details.approveId) {
        _proposalFee = _feeProposals[id].newProposalFee;
        _marketFee = _feeProposals[id].newMarketFee;
        _brandFee = _feeProposals[id].newBrandFee;
        _sellerFee = _feeProposals[id].newSellerFee;

        _approves[_feeProposals[id].details.approveId].executed = true;
        emit ExecuteFeeProposal(id);
    }

    event ExecuteStackProposal(uint256 id);
    function executeStackProposal(
        uint256 id
    ) public onlyApproved(_stackProposals[id].details.approveId) {
        _minBrandStack = _stackProposals[id].newMinBrandStack;
        _minSellerStack = _stackProposals[id].newMinSellerStack;

        _approves[_stackProposals[id].details.approveId].executed = true;
        emit ExecuteStackProposal(id);
    }

    event ExecuteReleaseProposal(uint256 id);
    function executeReleaseProposal(
        uint256 id
    ) public onlyApproved(_releaseProposals[id].details.approveId) {
        require(_releaseProposals[id].amount > 0, "Invalid token amount");
        if (tokenForSale.amount > 0) {
            m2c.burn(address(this),tokenForSale.amount, "");
        }
        m2c.mint(address(this), _releaseProposals[id].amount, true, "0x");
        tokenForSale = TokenForSale({
            amount: _releaseProposals[id].amount,
            price: _releaseProposals[id].price
        });
        _approves[_releaseProposals[id].details.approveId].executed = true;
        emit ExecuteReleaseProposal(id);
    }

    function _createApprove(
        string memory name,
        uint256 id
    ) private returns (uint256) {
        approveCounter.increment();
        uint256 newId = approveCounter.current();
        _approves[newId] = Approve({
            name: name,
            id: id,
            voteCount: 0,
            createdAt: block.timestamp,
            totalStacking: stacking.totalStack(),
            executed: false
        });
        return newId;
    }

    modifier onlyProposalReady() {
        require(stacking.getStackOf(msg.sender) > 0, "Not a stacker");
        require(!lockedForVoting(), "In voting time");
        uint counter = (block.timestamp - _startAt) / _phaseTime;

        require(
            _proposalCounter[msg.sender][counter] < 3,
            "Exceeded number of proposals"
        );
        require(_proposalFee > 0 && msg.value >= _proposalFee, "Invalid proposal fee");

        if (msg.value > _proposalFee) {
            // payable(msg.sender).transfer(msg.value - _proposalFee);
            (bool success, ) = payable(msg.sender).call{value: msg.value - _proposalFee}("0x");
            require(success, "Payment failed");
        }

        _proposalCounter[msg.sender][counter]++;
        _;
    }

    modifier onlyApproved(uint256 approveId) {
        Approve storage approve = _approves[approveId];
        require(lockedForVoting(), "Not in approving time");
        require(approve.voteCount * 2 > approve.totalStacking, "Not approved");
        require(!approve.executed, "Already executed");
        require(
            block.timestamp - approve.createdAt < 2 * _phaseTime,
            "Over time"
        );

        require(
            block.timestamp - approve.createdAt > _phaseTime,
            "Not yet reached the effective time"
        );
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Only operator");
        _;
    }
    
    event AddReviewer(address indexed newReviewer);
    function addReviewer(address newReviewer) public onlyOperator {
        require(newReviewer != address(0), "Invalid reviewer address");
        require(_reviewerIds[newReviewer] == 0, "Reviewer is existed");
        reviewerCounter.increment();
        _reviewers[reviewerCounter.current()] = newReviewer;
        _reviewerIds[newReviewer] = reviewerCounter.current();
        emit AddReviewer(newReviewer);
    }

    function removeReviewer(address reviewer) public onlyOperator {
        require(_reviewerIds[reviewer] != 0, "Reviewer is not existed");
        uint256 reviewerId = _reviewerIds[reviewer];
        uint256 lastId = reviewerCounter.current();
        if (reviewerId != lastId)
        {
            address lastReviewer = _reviewers[lastId];
            _reviewers[reviewerId] = lastReviewer;
            _reviewerIds[lastReviewer] = reviewerId;
        }
        delete _reviewers[lastId];
        delete _reviewerIds[reviewer];
        reviewerCounter.decrement();
    }

    function isReviewer(address reviewer) public view returns (bool) {
        return _reviewerIds[reviewer] != 0;
    }

    function getReviewerAddress(uint256 index) public view returns (address) {
        return _reviewers[index];
    }

    function getReviewerIndex(address reviewer) public view returns (uint256) {
        return _reviewerIds[reviewer];
    }   

    function getApproveInfo (uint256 approveId) public view returns (Approve memory) {
        return _approves[approveId];
    }
     
    function checkIsVoted(address voter, uint256 approveId) public view returns (bool) {
        return _isVoted[voter][approveId];
    }

    function getProposalCount(address voter, uint256 approveId) public view returns (uint256) {
        return _proposalCounter[voter][approveId];
    }

    function getOperatorProposal (uint256 id) public view returns (OperatorProposal memory) {
        return _operatorProposals[id];
    }

    function getParamProposal (uint256 id) public view returns (ParamProposal memory) {
        return _paramProposals[id];
    }

    function getFeeProposal (uint256 id) public view returns (FeeProposal memory) {
        return _feeProposals[id];
    }

    function getStackProposal (uint256 id) public view returns (StackProposal memory) {
        return _stackProposals[id];
    }

    function getRealeaseProposal (uint256 id) public view returns (ReleaseProposal memory) {
        return _releaseProposals[id];
    }
    
    receive() external payable {}
}
