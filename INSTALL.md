# DigiProof Installation Guide

This project is a FastAPI backend + React frontend for a warranty and proof-of-purchase app.

It currently works in local demo mode without a live blockchain connection.

## Requirements

- Python 3.13
- Node.js LTS
- npm
- Git

## 1) Clone the project

```bash
git clone <repo-url>
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

Copy the example environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Optional: seed demo users:

```bash
python -m app.seed
```

## 3) Start the backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check it with:

```bash
http://localhost:8000/health
```

Or open the docs:

```bash
http://localhost:8000/docs
```

## 4) Install frontend dependencies

Open a second terminal:

```bash
cd ui
npm install
```

## 5) Start the frontend

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Open:

```bash
http://localhost:5173/login
```

If port 5173 is already in use, Vite may automatically switch to 5174.

## 6) Demo login

Use either of these seeded accounts:

- Email: store@digiproof.example
- Password: password123

or

- Email: buyer@digiproof.example
- Password: password123

## Notes

- The app is designed to run with the backend and frontend active at the same time.
- The current version uses a stub blockchain layer so the app works without a live chain connection.
- Real blockchain/testnet setup is a separate advanced step and is not required for the current local demo version.
