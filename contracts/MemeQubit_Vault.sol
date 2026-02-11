// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MemeQubit_Vault
 * @notice Optional stablecoin vault for hedging: users deposit stables; backend recommends hedge allocation via Quantum Hedge Finder
 * @dev Simplified vault: deposit/withdraw; allocation suggestions are off-chain (Hedge Finder API)
 */
contract MemeQubit_Vault {

    address public owner;
    address public trustedBackend;
    bool public paused;

    mapping(address => uint256) public balanceOf;
    uint256 public totalDeposited;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
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
     * @notice Deposit ETH (or native) into vault; in production would be ERC20 stable
     */
    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Zero deposit");
        balanceOf[msg.sender] += msg.value;
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw from vault
     */
    function withdraw(uint256 amount) external whenNotPaused {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalDeposited -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Backend can suggest hedge allocation (read-only from chain; actual allocation logic off-chain via Hedge Finder)
     * @dev This is a placeholder; real implementation would integrate with DEX or lending for hedge execution
     */
    function getHedgeSuggestion(address user) external view returns (uint256 availableBalance) {
        return balanceOf[user];
    }

    function updateTrustedBackend(address newBackend) external onlyOwner {
        trustedBackend = newBackend;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PausedStatusChanged(paused);
    }

    function recoverEth() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(owner).call{value: bal}("");
        require(ok, "Recover failed");
    }

    receive() external payable {}
}
