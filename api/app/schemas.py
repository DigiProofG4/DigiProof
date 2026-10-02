from __future__ import annotations

from datetime import date, datetime
from typing import Literal

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
    expiring_soon_days: int = 90
    date_format: str = "long"
    # Retailers only.
    business_name: str | None = None
    registration_number: str | None = None
    created_at: datetime


class UserBrief(ORMModel):
    id: int
    full_name: str
    email: EmailStr


class ProfileUpdate(BaseModel):
    """PATCH /auth/me. Only the fields sent are changed, so the wallet card can send
    just wallet_address (null clears it) and the settings page just its choices."""

    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    wallet_address: str | None = Field(default=None, pattern=WALLET_PATTERN)
    expiring_soon_days: Literal[30, 60, 90, 180] | None = None
    date_format: Literal["long", "iso"] | None = None
    # Retailers only; registration_number may be sent as null to clear it.
    business_name: str | None = Field(default=None, min_length=1, max_length=160)
    registration_number: str | None = Field(default=None, max_length=80)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class TransactionOut(BaseModel):
    """One on-chain event on a warranty the user was part of."""

    kind: Literal["issued", "minted", "received", "sent"]
    warranty_id: int
    product_name: str
    counterparty: str | None
    tx_hash: str | None
    explorer_tx_url: str | None
    at: datetime


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
    # A link to a picture hosted elsewhere. Uploaded photos go through
    # POST /products/{id}/image instead and fill this in themselves.
    image_url: str | None = Field(default=None, max_length=500, pattern=r"^https?://\S+$")


class ProductImageLink(BaseModel):
    image_url: str = Field(max_length=500, pattern=r"^https?://\S+$")


class ProductOut(ORMModel):
    id: int
    name: str
    brand: str | None
    model: str | None
    serial_number: str
    warranty_months: int
    image_url: str | None = None
    created_at: datetime


# ---------------------------------------------------------------- warranties


class WarrantyIssue(BaseModel):
    """A retailer issues a warranty to a customer identified by email."""

    product_id: int
    customer_email: EmailStr
    customer_wallet_address: str | None = Field(default=None, pattern=WALLET_PATTERN)
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
    message: str | None = None
    transferred_at: datetime

    @computed_field
    @property
    def explorer_tx_url(self) -> str | None:
        if not self.tx_hash or not settings.chain_explorer_tx_base_url:
            return None
        return f"{settings.chain_explorer_tx_base_url}{self.tx_hash}"


class RetailerBrief(ORMModel):
    id: int
    business_name: str


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
    # The shop that sold it, shown to the owner on their dashboard.
    issued_by: RetailerBrief | None = None

    @computed_field
    @property
    def contract_address(self) -> str | None:
        return settings.contract_address or None

    @computed_field
    @property
    def contract_explorer_url(self) -> str | None:
        if not settings.contract_address or not settings.chain_explorer_address_base_url:
            return None
        return f"{settings.chain_explorer_address_base_url}{settings.contract_address}"

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
    # A short note passed on to the new owner in the email and the ownership history.
    message: str | None = Field(default=None, max_length=200)
