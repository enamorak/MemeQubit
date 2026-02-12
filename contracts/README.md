# MemeQubit Smart Contracts

Solidity contracts for the MemeQubit copilot. Deploy on any EVM chain; **Base** and **Base Sepolia** are configured by default.

## Contracts

| Contract | Purpose |
|----------|---------|
| **MemeQubit_Sniper.sol** | User delegates execution; backend runs QUBO and signals "fly" when confidence exceeds threshold. `executeShot` is called by backend (or user with backend signature). |
| **MemeQubit_BatchExit.sol** | User creates an exit order; backend sets batch count from QUBO and calls `executeBatch` for each slot. |
| **MemeQubit_Vault.sol** | Optional stable vault for hedging; deposit/withdraw; hedge allocation is suggested off-chain by the Hedge Finder API. |

## Deployment on Base

### 1. Установка

```bash
cd contracts
npm install
```

### 2. Переменные окружения

Создайте `.env` в папке `contracts` (или экспортируйте в shell):

| Переменная | Описание |
|------------|----------|
| `DEPLOYER_PRIVATE_KEY` | Приватный ключ кошелька для деплоя (без 0x) |
| `TRUSTED_BACKEND_ADDRESS` | Адрес бэкенда, которому разрешён вызов executeShot/executeBatch (по умолчанию = deployer) |
| `BASE_RPC_URL` | RPC для Base Mainnet (по умолчанию: https://mainnet.base.org) |
| `BASE_SEPOLIA_RPC_URL` | RPC для Base Sepolia (по умолчанию: https://sepolia.base.org) |
| `SNIPER_INITIAL_WEIGHTS` | Опционально: веса QUBO через запятую, 5 чисел (например `20,25,20,20,15`) |

### 3. Сборка и деплой

```bash
# Сборка
npm run compile

# Base Mainnet (chainId 8453)
npm run deploy:base

# Base Sepolia (тестнет)
npm run deploy:base-sepolia
```

После деплоя в консоль выводятся адреса контрактов — сохраните их для фронтенда и бэкенда.

## Общая информация о деплое

- Set `trustedBackend` to your FastAPI backend (or multisig) that runs the quantum simulator and signs execution.
- For Sniper: pass `_initialWeights` (5 values) for the on-chain confidence weighting.
- Сборка: Solidity 0.8.19, Hardhat с оптимизатором (200 runs).

## Security

- Contracts use a **trusted backend** model: only `trustedBackend` can trigger execution (Sniper executeShot, BatchExit executeBatch). In production, replace placeholder signature checks with proper ECDSA (e.g. EIP-712).
- Owner can pause and update `trustedBackend`. No upgradeability in this version.
