from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import Role, WarrantyStatus


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


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
    tx_hash: str | None
    transferred_at: datetime


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
    created_at: datetime
    product: ProductOut
    owner: UserOut


class WarrantyDetail(WarrantyOut):
    transfers: list[TransferOut] = []


class TransferRequest(BaseModel):
    new_owner_email: EmailStr
