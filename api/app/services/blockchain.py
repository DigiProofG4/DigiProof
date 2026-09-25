"""Single place where the API meets the chain.

This layer starts in stub mode so the rest of the app can be built and demoed.
When a real contract is deployed, it can switch into live mode without changing
call sites in the API or UI.
"""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass

from app.config import settings

CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "string", "name": "uri", "type": "string"}],
        "name": "mintWarranty",
        "outputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "adminTransfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]


@dataclass
class MintResult:
    token_id: str
    tx_hash: str
    metadata_uri: str
    gas_used: int | None = None
    gas_price_wei: int | None = None
    block_number: int | None = None


class BlockchainService:
    def __init__(self) -> None:
        self.rpc_url = settings.chain_rpc_url
        self.contract_address = settings.contract_address
        self.custodial_wallet_key = settings.custodial_wallet_key

    @property
    def wallet_address(self) -> str | None:
        if not self.custodial_wallet_key:
            return None
        try:
            from eth_account import Account

            return Account.from_key(self.custodial_wallet_key).address
        except Exception:
            return None

    @property
    def is_live(self) -> bool:
        """Live mode requires RPC, deployed contract, and a private key for the custodial wallet."""
        return bool(self.rpc_url and self.contract_address and self.custodial_wallet_key)

    def _get_live_contract(self):
        if not self.is_live:
            raise ValueError("Blockchain is not configured for live mode")

        try:
            from web3 import Web3
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "Live blockchain mode requires the optional web3 package. Install it in a Linux/WSL environment for testnet integration."
            ) from exc

        provider = Web3(Web3.HTTPProvider(self.rpc_url))
        if not provider.is_connected():
            raise ConnectionError(f"Unable to connect to blockchain RPC: {self.rpc_url}")

        contract = provider.eth.contract(address=self.contract_address, abi=CONTRACT_ABI)
        return provider, contract

    def mint_warranty(
        self, *, serial_number: str, owner_email: str, metadata: dict, owner_address: str | None = None
    ) -> MintResult:
        """Mint the proof-of-purchase NFT for a newly issued warranty.

        Mints straight to the customer's own wallet when they already have one
        connected, so it shows up in their MetaMask immediately. Falls back to
        the custodial wallet (the old behavior) when they don't have one yet —
        a later transfer can still move it to them once they connect.
        """
        if self.is_live:
            metadata_uri = metadata.get("uri") or f"ipfs://{metadata.get('cid', uuid.uuid4().hex)}"
            try:
                from web3 import Web3

                provider, contract = self._get_live_contract()
                from_address = self.wallet_address
                if not from_address:
                    raise ValueError("Could not derive the custodial wallet address from the configured private key")
                mint_to = Web3.to_checksum_address(owner_address) if owner_address else from_address

                gas_estimate = contract.functions.mintWarranty(mint_to, metadata_uri).estimate_gas({
                    "from": from_address,
                })
                tx = contract.functions.mintWarranty(mint_to, metadata_uri).build_transaction({
                    "from": from_address,
                    "nonce": provider.eth.get_transaction_count(from_address),
                    "gas": gas_estimate,
                })
                signed = provider.eth.account.sign_transaction(tx, private_key=self.custodial_wallet_key)
                tx_hash = provider.eth.send_raw_transaction(signed.raw_transaction)
                receipt = provider.eth.wait_for_transaction_receipt(tx_hash)
                token_id = contract.functions.totalSupply().call() - 1
                return MintResult(
                    token_id=str(token_id),
                    tx_hash=tx_hash.to_0x_hex(),
                    metadata_uri=metadata_uri,
                    gas_used=receipt["gasUsed"],
                    gas_price_wei=receipt.get("effectiveGasPrice"),
                    block_number=receipt["blockNumber"],
                )
            except Exception as exc:
                raise RuntimeError(
                    "Live blockchain mint failed. Check RPC URL, contract address, and custodial wallet private key."
                ) from exc

        seed = f"{serial_number}:{owner_email}".encode()
        digest = hashlib.sha256(seed).hexdigest()
        return MintResult(
            token_id=str(int(digest[:8], 16)),
            tx_hash="0x" + digest,
            metadata_uri=f"ipfs://placeholder/{uuid.uuid4().hex}",
        )

    def transfer_warranty(self, *, token_id: str, to_email: str, to_address: str | None = None) -> str:
        """Move a token to its new owner and return the transaction hash."""
        if self.is_live:
            if not to_address:
                raise ValueError(
                    "Live transfers need the recipient wallet address. Store it on the user record as wallet_address."
                )
            try:
                from web3 import Web3

                provider, contract = self._get_live_contract()
                from_address = self.wallet_address
                if not from_address:
                    raise ValueError("Could not derive the custodial wallet address from the configured private key")
                to_address = Web3.to_checksum_address(to_address)
                # Custodial move: the backend is the authorized minter, not
                # necessarily the current holder, so use adminTransfer with
                # whoever the contract says actually owns it right now.
                current_owner = contract.functions.ownerOf(int(token_id)).call()
                tx = contract.functions.adminTransfer(
                    current_owner,
                    to_address,
                    int(token_id),
                ).build_transaction({
                    "from": from_address,
                    "nonce": provider.eth.get_transaction_count(from_address),
                })
                signed = provider.eth.account.sign_transaction(tx, private_key=self.custodial_wallet_key)
                tx_hash = provider.eth.send_raw_transaction(signed.raw_transaction)
                provider.eth.wait_for_transaction_receipt(tx_hash)
                return tx_hash.to_0x_hex()
            except Exception as exc:
                raise RuntimeError(
                    "Live blockchain transfer failed. Check the recipient wallet address and contract configuration."
                ) from exc

        digest = hashlib.sha256(f"transfer:{token_id}:{to_email}".encode()).hexdigest()
        return "0x" + digest

    def verify_token(self, token_id: str) -> dict:
        """Read a token back from the chain so a claim can be checked independently."""
        if self.is_live:
            try:
                _, contract = self._get_live_contract()
                token_uri = contract.functions.tokenURI(int(token_id)).call()
                owner = contract.functions.ownerOf(int(token_id)).call()
                return {
                    "token_id": token_id,
                    "exists": True,
                    "owner": owner,
                    "metadata_uri": token_uri,
                    "source": "chain",
                }
            except Exception as exc:
                raise RuntimeError("Live blockchain verification failed.") from exc

        return {"token_id": token_id, "exists": True, "source": "stub"}


blockchain = BlockchainService()
