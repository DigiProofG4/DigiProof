# DigiProof Installation Guide

DigiProof is a FastAPI backend, a React front end and an ERC-721 smart
contract on the Ethereum Sepolia testnet. The app can run in two modes:

- **Live mode:** warranties are minted as real NFTs on Sepolia. Needs the chain
  settings in `api/.env`.
- **Stub mode:** the blockchain service returns fake token IDs and hashes, so
  the app works without a chain connection. Used when the chain settings are
  empty.

## Requirements

- Python 3.13
- Node.js LTS and npm
- Git
- For live mode: a Sepolia RPC URL, the contract address and the minter
  wallet's private key (ask the team)
- Optional: MetaMask on the Sepolia network, to view warranty NFTs

## 1) Clone the project

```bash
git clone https://github.com/DigiProofG4/DigiProof.git
cd DigiProof
```

## 2) Install backend dependencies

```bash
cd api
py -3.13 -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Then install the Python packages:

```bash
pip install -r requirements.txt
```

On Windows ARM64, `web3` 7 cannot be installed because its `ckzg` dependency
has no wheel for that platform. Install `web3` 6 instead
(`pip install "web3<7"`); the blockchain service supports both versions.

## 3) Configure the backend

Copy the example environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Edit `api/.env`:

- `DATABASE_URL`: keep the SQLite default for a local database, or use the
  team's shared MySQL connection string (`mysql+pymysql://...`).
- `JWT_SECRET`: change it to a long random string.
- For live mode, fill in `CHAIN_RPC_URL`, `CONTRACT_ADDRESS` and
  `CUSTODIAL_WALLET_KEY`. Leave them empty for stub mode.

Never commit `.env`; it is already in `.gitignore`.

Optional, for a local SQLite database in stub mode (chain settings empty):
seed demo users with

```bash
python -m app.seed
```

The seed mints its demo warranty without a wallet address, which live mode
refuses, so it only works in stub mode.

## 4) Start the backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Use port 8001: the front end forwards its API requests there (see
`ui/vite.config.js`). On any other port, logins fail with "request failed".

Check it at `http://localhost:8001/health`, or open the interactive docs at
`http://localhost:8001/docs`.

## 5) Install and start the front end

Open a second terminal:

```bash
cd ui
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open `http://localhost:5173/login`. If port 5173 is already in use, Vite may
switch to 5174.

## 6) Demo login (local seeded database)

- Retailer: `store@digiproof.example` / `password123`
- Customer: `buyer@digiproof.example` / `password123`

On the shared MySQL database, use the team's demo accounts instead.

To receive warranty NFTs, a customer needs a wallet address. New customers get
one at sign-up, or can connect MetaMask or paste an address on the Account
page.

## 7) Run the tests

Backend (from `api`, with the virtual environment active):

```bash
python -m pytest -v
```

Use `python -m pytest` rather than `pytest`, so Python can find the `app`
package.

Contract (from `contracts`):

```bash
npm install
npx hardhat test
```

On Windows on ARM, install the x64 build of Node.js. Hardhat 2's native
modules have no ARM64 Windows build, so under ARM64 Node `npx hardhat` fails
with `Cannot find module '@nomicfoundation/solidity-analyzer-win32-arm64-msvc'`.
After switching, delete `contracts/node_modules` and run `npm install` again.

## 8) Deploying the contract (optional)

The contract is already deployed on Sepolia. To deploy a new copy, create
`contracts/.env` with `DEPLOYER_PRIVATE_KEY` and `SEPOLIA_RPC_URL`, then run:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed address into `CONTRACT_ADDRESS` in `api/.env`. The deployer
wallet becomes the authorised minter, so its private key goes into
`CUSTODIAL_WALLET_KEY`.
