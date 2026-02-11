// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MemeQubit_BatchExit
 * @notice Splits a large sell order into N batches executed at optimal intervals
 * @dev Backend runs QUBO to compute batch sizes and slots; this contract stores the schedule and executes via trusted backend
 */
contract MemeQubit_BatchExit {

    struct ExitOrder {
        address user;
        address token;           // Token to sell
        uint256 totalAmount;     // Total tokens to sell
        uint256 batches;        // Number of batches
        uint256 executedBatches;
        bool cancelled;
        uint256 createdAt;
    }

    mapping(bytes32 => ExitOrder) public orders;
    bytes32[] public orderIds;

    address public owner;
    address public trustedBackend;
    bool public paused;

    event OrderCreated(bytes32 indexed orderId, address indexed user, address token, uint256 totalAmount, uint256 batches);
    event BatchExecuted(bytes32 indexed orderId, uint256 batchIndex, uint256 amount, uint256 timestamp);
    event OrderCancelled(bytes32 indexed orderId);
    event PausedStatusChanged(bool newStatus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyTrustedBackend() {
        require(msg.sender == trustedBackend, "Only trusted backend");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    constructor(address _trustedBackend) {
        owner = msg.sender;
        trustedBackend = _trustedBackend;
    }

    /**
     * @notice User submits a limit exit order; backend will split into batches via QUBO
     * @param token Token to sell
     * @param totalAmount Total amount to sell
     * @param maxSlippageBps Max slippage in basis points (e.g. 500 = 5%)
     */
    function createExitOrder(
        address token,
        uint256 totalAmount,
        uint256 maxSlippageBps
    ) external whenNotPaused returns (bytes32 orderId) {
        require(token != address(0) && totalAmount > 0, "Invalid params");
        orderId = keccak256(abi.encodePacked(msg.sender, token, totalAmount, block.timestamp, block.prevrandao));
        require(orders[orderId].createdAt == 0, "Order exists");

        orders[orderId] = ExitOrder({
            user: msg.sender,
            token: token,
            totalAmount: totalAmount,
            batches: 0, // Set by backend when schedule is computed
            executedBatches: 0,
            cancelled: false,
            createdAt: block.timestamp
        });
        orderIds.push(orderId);
        emit OrderCreated(orderId, msg.sender, token, totalAmount, 0);
        return orderId;
    }

    /**
     * @notice Backend sets the number of batches (from QUBO scheduling)
     */
    function setBatches(bytes32 orderId, uint256 numBatches) external onlyTrustedBackend {
        require(orders[orderId].createdAt != 0 && !orders[orderId].cancelled, "Invalid order");
        orders[orderId].batches = numBatches;
    }

    /**
     * @notice Execute one batch of an exit order (called by backend after QUBO slot recommendation)
     * @param orderId Order id
     * @param batchIndex 0-based batch index
     * @param amount Amount for this batch
     * @param signature Backend signature authorising this batch
     */
    function executeBatch(
        bytes32 orderId,
        uint256 batchIndex,
        uint256 amount,
        bytes calldata signature
    ) external onlyTrustedBackend whenNotPaused {
        ExitOrder storage o = orders[orderId];
        require(o.createdAt != 0 && !o.cancelled, "Invalid order");
        require(batchIndex < o.batches, "Invalid batch");
        require(o.executedBatches == batchIndex, "Batches must be sequential");
        require(signature.length > 0, "Invalid signature");

        o.executedBatches++;
        emit BatchExecuted(orderId, batchIndex, amount, block.timestamp);
    }

    /**
     * @notice User cancels their order before execution
     */
    function cancelOrder(bytes32 orderId) external {
        require(orders[orderId].user == msg.sender, "Not your order");
        require(!orders[orderId].cancelled, "Already cancelled");
        orders[orderId].cancelled = true;
        emit OrderCancelled(orderId);
    }

    function getOrder(bytes32 orderId) external view returns (
        address user,
        address token,
        uint256 totalAmount,
        uint256 batches,
        uint256 executedBatches,
        bool cancelled,
        uint256 createdAt
    ) {
        ExitOrder storage o = orders[orderId];
        return (o.user, o.token, o.totalAmount, o.batches, o.executedBatches, o.cancelled, o.createdAt);
    }

    function updateTrustedBackend(address newBackend) external onlyOwner {
        trustedBackend = newBackend;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PausedStatusChanged(paused);
    }
}
