# MemeQubit Smart Contracts

Solidity contracts for the MemeQubit copilot. Deploy on any EVM chain (e.g. Base Sepolia).

## Contracts

| Contract | Purpose |
|----------|---------|
| **MemeQubit_Sniper.sol** | User delegates execution; backend runs QUBO and signals "fly" when confidence exceeds threshold. `executeShot` is called by backend (or user with backend signature). |
| **MemeQubit_BatchExit.sol** | User creates an exit order; backend sets batch count from QUBO and calls `executeBatch` for each slot. |
| **MemeQubit_Vault.sol** | Optional stable vault for hedging; deposit/withdraw; hedge allocation is suggested off-chain by the Hedge Finder API. |

## Deployment

- Set `trustedBackend` to your FastAPI backend (or multisig) that runs the quantum simulator and signs execution.
- For Sniper: pass `_initialWeights` (5 values) for the on-chain confidence weighting.
- Compile with Solidity 0.8.19+ (e.g. Hardhat or Foundry).

## Security

- Contracts use a **trusted backend** model: only `trustedBackend` can trigger execution (Sniper executeShot, BatchExit executeBatch). In production, replace placeholder signature checks with proper ECDSA (e.g. EIP-712).
- Owner can pause and update `trustedBackend`. No upgradeability in this version.
