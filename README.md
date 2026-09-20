# DigiProof

Blockchain-backed proof of purchase and warranty tracking. Three pieces:

- **`api/`** — FastAPI backend. Shared login for retailers and customers,
  product registration, warranty issuing and transfer, public verification
  by serial number.
- **`ui/`** — React (Vite) frontend. One login screen; the account's role
  decides whether you land on the retailer dashboard or your own warranties.
- **`contracts/`** — not built yet. `api/app/services/blockchain.py` fakes
  minting/transfers/reads for now so the rest of the app works end to end;
  see `contracts/README.md` for the plan when that phase starts.

## How it fits together

A retailer registers a product by serial number, then records a sale against
a customer's account. That issues a `Warranty` row and calls into the
blockchain service, which (today) fakes a token id, transaction hash and
metadata URI — the same shape a real mint will return later. The customer
sees the warranty under their own login and can transfer it to someone else
if they resell the item; anyone can look a serial number up without logging
in at all.

## Running it locally

**API**

```
cd api
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
python -m app.seed              # optional: creates a demo retailer + customer
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`, interactive docs at `/docs`.

Seeded demo accounts (password `password123`):
- `store@digiproof.example` (retailer)
- `buyer@digiproof.example` (customer)

**UI**

```
cd ui
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies `/api/*` to the FastAPI server,
so both can run side by side with no CORS setup needed.

## Project layout

```
digiproof/
├── api/
│   ├── app/
│   │   ├── main.py           FastAPI app, CORS, startup
│   │   ├── config.py         settings from .env
│   │   ├── database.py       SQLAlchemy session/engine
│   │   ├── models.py         User, Retailer, Product, Warranty, Transfer
│   │   ├── schemas.py        Pydantic request/response shapes
│   │   ├── security.py       password hashing, JWT
│   │   ├── deps.py           auth dependencies (current user, retailer-only)
│   │   ├── seed.py           demo data
│   │   ├── routers/          auth, products, warranties
│   │   └── services/
│   │       └── blockchain.py the seam — stubbed today, real later
│   └── requirements.txt
├── ui/
│   └── src/
│       ├── api/client.js     fetch wrapper + token storage
│       ├── auth/AuthContext.jsx
│       ├── components/       Layout, ProtectedRoute
│       └── pages/            Login, Register, RetailerDashboard,
│                              IssueWarranty, MyWarranties, WarrantyDetail,
│                              Verify
└── contracts/
    ├── README.md              plan for the blockchain phase
    └── DigiProofWarranty.sol  ERC-721 skeleton, not compiled
```

## What's deliberately left for later

- Real chain integration (Polygon testnet), IPFS metadata pinning.
- Password reset / email verification.
- Pagination on the products and warranties lists.
- A proper migrations tool (Alembic) once the schema needs to change without
  wiping the SQLite file.
