from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field

from app.config import settings
from app.models import Role, WarrantyStatus


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# An Ethereum-style address as wallet apps show it: 0x plus 40 hex characters.
WALLET_PATTERN = r"^0x[0-9a-fA-F]{40}$"


# ---------------------------------------------------------------- auth


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: Role = Role.CUSTOMER
    # Only read when role is retailer.
    business_name: str | None = None
    registration_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: int
    email: EmailStr
    full_name: str
    role: Role
    wallet_address: str | None = None
    created_at: datetime


class UserBrief(ORMModel):
    id: int
    full_name: str
    email: EmailStr


class WalletUpdate(BaseModel):
    """A user saves (or clears, with null) the wallet their warranties should go to."""

    wallet_address: str | None = Field(default=None, pattern=WALLET_PATTERN)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------- products


class ProductCreate(BaseModel):
    name: str
    serial_number: str
    brand: str | None = None
    model: str | None = None
    warranty_months: int = 12


class ProductOut(ORMModel):
    id: int
    name: str
    brand: str | None
    model: str | None
    serial_number: str
    warranty_months: int
    created_at: datetime


# ---------------------------------------------------------------- warranties


class WarrantyIssue(BaseModel):
    """A retailer issues a warranty to a customer identified by email."""

    product_id: int
    customer_email: EmailStr
    purchase_date: date
    price_paid: float | None = None
    terms: str | None = None


class TransferOut(ORMModel):
    id: int
    from_user_id: int | None
    to_user_id: int
    from_user: UserBrief | None = None
    to_user: UserBrief
    tx_hash: str | None
    transferred_at: datetime

    @computed_field
    @property
    def explorer_tx_url(self) -> str | None:
        if not self.tx_hash or not settings.chain_explorer_tx_base_url:
            return None
        return f"{settings.chain_explorer_tx_base_url}{self.tx_hash}"


class WarrantyOut(ORMModel):
    id: int
    status: WarrantyStatus
    purchase_date: date
    expires_on: date
    price_paid: float | None
    terms: str | None
    token_id: str | None
    tx_hash: str | None
    metadata_uri: str | None
    gas_used: int | None
    gas_price_wei: int | None
    block_number: int | None
    created_at: datetime
    product: ProductOut
    owner: UserOut

    @computed_field
    @property
    def gas_fee_eth(self) -> float | None:
        """Total mint cost in native currency (ETH on Sepolia): gas_used * gas_price."""
        if self.gas_used is None or self.gas_price_wei is None:
            return None
        return (self.gas_used * self.gas_price_wei) / 1_000_000_000_000_000_000

    @computed_field
    @property
    def explorer_tx_url(self) -> str | None:
        if not self.tx_hash or not settings.chain_explorer_tx_base_url:
            return None
        return f"{settings.chain_explorer_tx_base_url}{self.tx_hash}"


class WarrantyDetail(WarrantyOut):
    transfers: list[TransferOut] = []


class TransferRequest(BaseModel):
    new_owner_email: EmailStr
    # The new owner's own wallet. Left out, the wallet saved on their account
    # is used, and failing that the token stays in DigiProof custody.
    new_owner_wallet: str | None = Field(default=None, pattern=WALLET_PATTERN)
