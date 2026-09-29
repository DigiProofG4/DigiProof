"""Per-customer wallets, derived from one master seed instead of stored keys.

Every customer gets the BIP-44 account m/44'/60'/0'/0/<user id> under
WALLET_MNEMONIC. Only the address goes into MySQL; the private key is
re-derived whenever the API has to sign for that customer (e.g. a resale).
Changing or losing the mnemonic orphans every NFT held by those addresses,
so back it up and never rotate it casually.
"""

from __future__ import annotations

from eth_account import Account
from eth_account.signers.local import LocalAccount

from app.config import settings
from app.models import Role, User

Account.enable_unaudited_hdwallet_features()

DERIVATION_PATH = "m/44'/60'/0'/0/{index}"


class WalletService:
    def __init__(self) -> None:
        self.mnemonic = settings.wallet_mnemonic

    @property
    def is_configured(self) -> bool:
        return bool(self.mnemonic)

    def account_for(self, user_id: int) -> LocalAccount:
        if not self.is_configured:
            raise ValueError("WALLET_MNEMONIC is not set, so customer wallets cannot be derived")
        return Account.from_mnemonic(self.mnemonic, account_path=DERIVATION_PATH.format(index=user_id))

    def ensure_wallet(self, user: User) -> str | None:
        """Give a customer their derived address if they don't have one yet.

        The user must already have an id (flush first). Returns the address,
        or None for retailers / when no mnemonic is configured.
        """
        if user.wallet_address:
            return user.wallet_address
        if user.role is not Role.CUSTOMER or not self.is_configured:
            return None
        user.wallet_address = self.account_for(user.id).address
        return user.wallet_address

    def derived_account(self, user: User) -> LocalAccount | None:
        """The wallet we generated for a customer, even if they since saved their own.

        Tokens minted before they switched still sit in this one, and only the
        API holds its key.
        """
        if user.role is not Role.CUSTOMER or not self.is_configured:
            return None
        return self.account_for(user.id)


wallets = WalletService()
