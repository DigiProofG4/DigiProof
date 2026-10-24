# DigiProof

Blockchain-backed proof of purchase and warranty tracking. Each warranty is
issued as an ERC-721 NFT on the Ethereum Sepolia testnet, so owners can prove,
transfer and verify it without a paper receipt.

The project has three parts:

- **`api/`**: FastAPI backend. Shared login for retailers and customers,
  product registration, warranty issuing and transfer, public verification by
  serial number, and the blockchain service that mints and transfers tokens.
- **`ui/`**: React (Vite) front end. One login screen; the account's role
  decides whether you land on the retailer portal or your own warranties.
- **`contracts/`**: Hardhat project with the `DigiProofWarranty` contract
  (Solidity 0.8.24, OpenZeppelin `ERC721URIStorage` + `Ownable`), deployed on
  Sepolia at
  [`0x20e5F99CEeEaf8394a03592937eEBFee3a1AAdBf`](https://sepolia.etherscan.io/address/0x20e5F99CEeEaf8394a03592937eEBFee3a1AAdBf).

## How it fits together

1. A retailer registers a product by serial number.
2. The retailer records a sale against a customer's account. The API creates a
   `Warranty` row and calls `api/app/services/blockchain.py`, which mints the
   NFT with `mintWarranty()` straight to the buyer's wallet. A wallet address
   is required; the API refuses to mint without one, so the on-chain owner and
   the database owner always match.
3. The platform's minter wallet signs every transaction and pays the gas, so
   customers never need ETH. The token ID, transaction hash, block and gas used
   are stored with the warranty.
4. The owner sees the warranty on their dashboard, can add the NFT to MetaMask,
   and can transfer it on resale. Transfers use the contract's
   `adminTransfer()`, which lets the minter move the token out of the owner's
   wallet to the new owner's wallet.
5. Anyone can check a serial number on the public Verify page without logging
   in. Each warranty links to its record on Sepolia Etherscan.

`blockchain.py` is the only file that talks to the chain. If the chain settings
in `api/.env` are left empty, it falls back to stub mode and returns fake token
IDs and hashes in the same format, so the app still runs end to end without a
blockchain.

## Running it locally

### API

```
cd api
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

The API runs at `http://localhost:8001`, with interactive docs at `/docs`.
Use port 8001: the UI forwards its API requests there (see
`ui/vite.config.js`).

Settings in `api/.env`:

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite by default (`sqlite:///./digiproof.db`). The team uses a shared MySQL database on Clever Cloud (`mysql+pymysql://...`); ask the team for the connection string. |
| `JWT_SECRET` | Secret used to sign login tokens. Change it from the example value. |
| `CHAIN_RPC_URL` | Sepolia RPC endpoint, for example `https://ethereum-sepolia-rpc.publicnode.com`. |
| `CONTRACT_ADDRESS` | Deployed `DigiProofWarranty` address (see above). |
| `CUSTODIAL_WALLET_KEY` | Private key of the minter wallet that signs and pays gas. Never commit it. |

Leave the three chain settings empty to run in stub mode.

The shared MySQL server allows only five connections for the whole team, so
each backend keeps a pool of one connection (see `api/app/database.py`).

For a local database with demo data, leave the chain settings empty (stub
mode) and run `python -m app.seed`. The seed mints its demo warranty without a
wallet address, which live mode refuses. It creates two accounts with the
password `password123`:

- `store@digiproof.example` (retailer)
- `buyer@digiproof.example` (customer)

### UI

```
cd ui
npm install
npm run dev
```

The UI runs at `http://localhost:5173` and proxies `/api/*` to the FastAPI
server, so both can run side by side without any CORS setup.

### Contracts

```
cd contracts
npm install
npx hardhat test
```

On Windows on ARM, install the x64 build of Node.js. Hardhat 2's native
modules have no ARM64 Windows build, so `npx hardhat` fails under ARM64 Node.

To deploy a new copy, put `DEPLOYER_PRIVATE_KEY` and `SEPOLIA_RPC_URL` in
`contracts/.env`, then run:

```
npx hardhat run scripts/deploy.js --network sepolia
```

The script prints the new contract address to copy into `api/.env`.
`npx hardhat run scripts/balance.js --network sepolia` shows the deployer
wallet's balance.

## Tests

- **Backend** (from `api`, with the virtual environment active):
  `python -m pytest -v`. Run it with `python -m` so Python can find the `app`
  package. The tests cover the blockchain service (stub and live settings, and
  minting or transferring without a wallet) and product image uploads.
- **Contract** (from `contracts`): `npx hardhat test`. Covers minting, reading
  the owner and token URI, rejecting non-minters, and `adminTransfer`.

## Project layout

```
DigiProof/
├── api/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, startup
│   │   ├── config.py          settings from .env
│   │   ├── database.py        SQLAlchemy engine and session
│   │   ├── models.py          User, Retailer, Product, Warranty, Transfer
│   │   ├── schemas.py         Pydantic request/response shapes
│   │   ├── security.py        password hashing, JWT
│   │   ├── deps.py            auth dependencies (current user, retailer only)
│   │   ├── seed.py            local demo data
│   │   ├── routers/           auth, products, warranties
│   │   └── services/
│   │       ├── blockchain.py  minting, transfers and reads (live or stub)
│   │       ├── storage.py     token metadata (a data: URI) and certificate image
│   │       ├── images.py      product image uploads
│   │       └── notification.py customer emails (stubbed: logged, not sent)
│   ├── tests/
│   └── requirements.txt
├── ui/
│   └── src/
│       ├── api/client.js      fetch wrapper and token storage
│       ├── auth/AuthContext.jsx
│       ├── components/        Layout, ProtectedRoute, WalletCard,
│       │                      ProductImage, Logo
│       └── pages/             Landing, Login, Register, Verify, Account,
│                              RetailerHome, RetailerProducts, ProductDetail,
│                              RetailerWarranties, IssueWarranty,
│                              MyWarranties, WarrantyDetail
├── contracts/
│   ├── contracts/DigiProofWarranty.sol
│   ├── scripts/               deploy.js, balance.js
│   ├── test/                  DigiProofWarranty.test.js
│   └── hardhat.config.js      Sepolia and Polygon Amoy networks
└── database/
    ├── 01-03_*.sql            original Oracle scripts (user, schema, demo data)
    └── mysql/                 schema, migrations and a full dump
```

## Future work

- Deploy to a lower-cost network such as Polygon, since the platform pays
  every gas fee.
- Keep the minter key in a key management service instead of an environment
  variable.
- Let owners sign transfers in MetaMask instead of relying on
  `adminTransfer()`.
- An integration test suite against a local Hardhat node.
- Password reset, pagination on long lists, and a migrations tool (Alembic).
