# MemeQubit — Quantum-AI Copilot for Pump.fun

**Short summary (&lt;150 chars):**  
*MemeQubit: DeFi copilot using quantum-classical AI to snipe, hedge, and exit meme coins on Pump.fun / RobinPump.fun with optimal timing and minimal loss.*

---

## Demo video and presentation

- **Demo video (with audio):** [Add your Loom or similar link here] — explains how the project works, repo structure, and a full demo. *(Required for judges.)*
- **Canva presentation:** [Add your Canva slides link here] — team, problem, solution, architecture, live demo.

---

## The problem

Trading meme coins on Pump.fun is a high-frequency, chaotic environment with strong information asymmetry:

1. **Speed vs accuracy** — Sniper bots win on latency but often buy at peaks or on scams. Humans cannot analyse funding velocity, wallet distribution, and dev activity fast enough.
2. **NP-hard dynamics** — You need to consider price, volume, holder growth, gas, time to Raydium listing, and sentiment at once. Classical scripts use sequential rules (IF … AND …) and miss optimal combinations.
3. **Illusion of liquidity** — A position looks profitable until you try to sell: one large order causes huge slippage. Selling in one tx is simple but costly.

---

## The solution

We do **not** build a new DEX. We build a **smart contract layer + quantum-classical copilot** that solves three concrete problems for Pump.fun traders:

| Module | Problem | Approach |
|--------|--------|----------|
| **Quantum Sniper** | When to enter a new pool? | QUBO ranks pools by funding velocity, wallet uniqueness, freshness, dev activity. Classical = rule-based; quantum = weighted sum over all factors. |
| **Quantum Batching** | How to exit a large position without killing the price? | Split the sell into N batches across blocks. Classical = 1 tx (high slippage); quantum = QUBO scheduling for batch sizes and slots. |
| **Quantum Hedge Finder** | You are long a meme; market dumps — what to short/buy? | Best path from your token to a stable (or hedge asset). Classical = greedy 2-hop; quantum = full path search on the graph of meme + stable pools. |

All three are implemented in the **Demos** section of the site with **side-by-side classical vs quantum results on fixed test data**, so you can compare scores, paths, slippage, and gas directly in the UI.

---

## Technical architecture

### Blockchain and smart contracts

- **Network:** EVM-compatible (e.g. Base, Arbitrum) for low gas. Testnet deployment supported.
- **Contracts (Solidity):**
  - **`MemeQubit_Sniper.sol`** — Holds “fly / don’t fly” logic; user delegates execution to the contract when backend-signalled conditions are met.
  - **`MemeQubit_BatchExit.sol`** — Accepts a user limit order, splits it into N parts, and executes them at optimised intervals (or via a trusted executor).
  - **`MemeQubit_Vault.sol`** — (Optional) Stablecoin vault for hedging and collateral.

Contracts live in `contracts/` and are designed to work with a **trusted backend** that runs the QUBO/simulation and signs or triggers execution (similar to a POAP-style router).

### Backend (FastAPI)

- **MemeQubit gateway** — Pool and network stats (e.g. from chain RPC or Pump.fun API).
- **Quantum simulator** — dimod + neal (simulated annealing) for QUBO: sniper ranking, batch-exit scheduling, hedge pathfinding. All “quantum” results in the demos are produced by this classical simulator to demonstrate the algorithms.
- **Endpoints:**
  - `POST /api/quantum/sniper` — Rank pool candidates (classical + quantum ranking, Fly recommendation).
  - `POST /api/quantum/batch-exit` — Return recommended batches and classical vs quantum slippage/gas comparison.
  - `POST /api/quantum/hedge-finder` — Best path from a token to a stable; classical 2-hop vs quantum full path.

### Frontend (Next.js)

- **Dashboard** — Network status, API health, pool cache.
- **Demos (three pages):**
  1. **Quantum Sniper** — Upload or use built-in test pool candidates; run classical vs quantum ranking; see scores, ranks, and “Fly” recommendation.
  2. **Quantum Batching** — Set position size and max slippage; run and compare classical (1 tx) vs quantum (N batches): estimated slippage and gas.
  3. **Quantum Hedge Finder** — Select token to hedge and target stable; run and compare classical path (2-hop) vs quantum path (full graph) and output amount.
- **Documentation** — Short description of each algorithm and how classical vs quantum differ.

---

## Technical description (SDKs and sponsor tech)

- **Backend:** Python 3.11+, FastAPI, Pydantic. Quantum: **dimod**, **dwave-neal** (simulated annealing). Graph/path: **networkx**. Optional: **web3.py**, **redis**, **asyncpg** for chain and cache.
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion. API client: `fetch` to backend.
- **Blockchain:** EVM (e.g. Base Sepolia). Contracts written in **Solidity**; deployment via Hardhat/Foundry (see `contracts/`). Wallet connection (e.g. MetaMask) via `wallet_addEthereumChain` for testnet.
- **What makes this possible:** QUBO formulation for ranking and scheduling; simulated annealing for fast approximate optimisation; reuse of pathfinding (arbitrage-style) for hedge search. The same stack can be swapped to real quantum hardware (e.g. D-Wave, IBM) later by replacing the sampler.

---

## How blockchain is used

- **Smart contracts** enforce “fly / don’t fly” (Sniper), batch execution (Batch Exit), and optional vault logic (Vault). They do not implement the QUBO themselves; they rely on a backend (or oracle) that computes the recommendation and authorises execution.
- **Frontend** can connect to an EVM testnet (e.g. Base Sepolia) to show network stats and add the chain to the user’s wallet. Demo data is used when no live Pump.fun API is connected.
- **Deployment:** Contracts are intended for testnet/mainnet deployment on an EVM chain; the repo includes the Solidity source and deployment instructions in `contracts/`.

---

## Screenshots

*(Add 2–4 screenshots of your UI here: home page, each of the three demos with classical vs quantum results visible.)*

| Screenshot | Description |
|------------|-------------|
| *screenshot-home.png* | Home page: MemeQubit hero, architecture diagram, links to demos. |
| *screenshot-sniper.png* | Quantum Sniper demo: test data table and classical vs quantum ranking + Fly. |
| *screenshot-batch-exit.png* | Quantum Batching demo: parameters and comparison (slippage, gas, batches). |
| *screenshot-hedge-finder.png* | Quantum Hedge Finder demo: path and output comparison. |

---

## Repository structure

```
MemeQubit/
├── backend/                 # FastAPI + quantum simulator
│   ├── api/                 # health, quantum (sniper, batch-exit, hedge-finder), memequbit
│   ├── models/              # Pydantic request/response models
│   ├── services/            # meme_quantum, quantum_simulator, memequbit_fetcher
│   └── main.py
├── frontend/                # Next.js 14
│   ├── app/
│   │   ├── demo/
│   │   │   ├── sniper/      # Quantum Sniper demo
│   │   │   ├── batch-exit/  # Quantum Batching demo
│   │   │   └── hedge-finder/# Quantum Hedge Finder demo
│   │   ├── dashboard/
│   │   └── documentation/
│   ├── components/
│   └── lib/                 # API client (runSniper, runBatchExit, runHedgeFinder)
├── contracts/               # Solidity: MemeQubit_Sniper, BatchExit, Vault
└── README.md
```

---

## Getting started

```bash
# Clone
git clone https://github.com/yourusername/MemeQubit.git
cd MemeQubit

# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Frontend (from repo root)
cd frontend && npm ci && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Demos** to run Quantum Sniper, Quantum Batching, and Quantum Hedge Finder with classical vs quantum results on test data.

---

## Roadmap

1. Deploy smart contracts to Base (or chosen) testnet.
2. Integrate Pump.fun (or RobinPump) API for live pool data.
3. Optional: plug in real quantum hardware (D-Wave/IBM) for QUBO.
4. Record and publish demo video with audio (e.g. Loom) and add link above.

---

## License

MIT
