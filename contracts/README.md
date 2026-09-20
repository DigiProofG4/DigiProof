# DigiProof contracts — later phase

Not wired up yet. `api/app/services/blockchain.py` is the seam: it returns
realistic fake data today so the API and UI can be built and demoed, and it's
the only file that needs to change once this phase starts.

## Plan

- **Chain**: Polygon (low gas, EVM-compatible, easy testnet).
- **Standard**: ERC-721 — one token per warranty, not fungible.
- **Custody**: customers never hold a wallet or see gas fees. The retailer's
  backend owns a custodial wallet per retailer and mints/transfers on the
  customer's behalf. `owner_id` in Postgres/SQLite is the source of truth for
  "who has the warranty right now"; the token id just needs to trace back to
  that.
- **Metadata**: JSON per warranty (product, serial number, retailer, purchase
  date, expiry, terms) pinned to IPFS; the contract stores the URI, not the
  data itself.

## Suggested toolchain

Hardhat, since the API is already Python/JS-adjacent on the frontend and it
has the most coursework documentation for Ethereum/Polygon:

```
npm install --save-dev hardhat
npx hardhat init
```

## Contract skeleton

`DigiProofWarranty.sol` below is unfinished on purpose — it shows the shape
(mint, transfer, read) that `blockchain.py`'s stub methods already assume, so
swapping the stub for web3.py calls should be close to a 1:1 mapping:

| `blockchain.py` method | contract function |
|---|---|
| `mint_warranty()` | `mintWarranty(address to, string tokenURI)` |
| `transfer_warranty()` | `safeTransferFrom(from, to, tokenId)` |
| `verify_token()` | `tokenURI(tokenId)` / `ownerOf(tokenId)` |

## Wiring it up later

1. Deploy to Polygon Amoy (testnet), note the address.
2. Fill in `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `CUSTODIAL_WALLET_KEY` in
   `api/.env`.
3. Add `web3.py` to `api/requirements.txt`.
4. Replace the bodies of `BlockchainService`'s three methods with real calls;
   the method signatures and return shapes are designed not to change.
