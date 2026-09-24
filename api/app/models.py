from __future__ import annotations

import enum
from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def enum_column(enum_cls: type[enum.Enum]) -> Enum:
    """Store the lowercase values ('retailer'), not the member names ('RETAILER').

    The MySQL columns in database/mysql/02_create_schema.sql are declared with the
    values, and the UI compares against them too, so SQLAlchemy has to match.
    """
    return Enum(enum_cls, values_callable=lambda cls: [member.value for member in cls])


class Role(str, enum.Enum):
    """Both sides log in through the same endpoint; this is what separates them."""

    RETAILER = "retailer"
    CUSTOMER = "customer"


class WarrantyStatus(str, enum.Enum):
    PENDING = "pending"      # created off-chain, not minted yet
    ACTIVE = "active"        # minted, warranty still running
    EXPIRED = "expired"
    VOID = "void"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[Role] = mapped_column(enum_column(Role), default=Role.CUSTOMER)
    # Optional: a customer who wants the NFT in their own wallet instead of custody.
    wallet_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    retailer: Mapped[Retailer | None] = relationship(back_populates="user", uselist=False)
    warranties: Mapped[list[Warranty]] = relationship(
        back_populates="owner", foreign_keys="Warranty.owner_id"
    )


class Retailer(Base):
    """Extra business details for an account whose role is retailer."""

    __tablename__ = "retailers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    business_name: Mapped[str] = mapped_column(String(160))
    registration_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="retailer")
    products: Mapped[list[Product]] = relationship(back_populates="retailer")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    retailer_id: Mapped[int] = mapped_column(ForeignKey("retailers.id"))
    name: Mapped[str] = mapped_column(String(160))
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    serial_number: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    warranty_months: Mapped[int] = mapped_column(Integer, default=12)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    retailer: Mapped[Retailer] = relationship(back_populates="products")
    warranty: Mapped[Warranty | None] = relationship(back_populates="product", uselist=False)


class Warranty(Base):
    """One proof of purchase. Mirrors the NFT that will back it on chain."""

    __tablename__ = "warranties"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), unique=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    issued_by_retailer_id: Mapped[int] = mapped_column(ForeignKey("retailers.id"))

    purchase_date: Mapped[date] = mapped_column(Date)
    expires_on: Mapped[date] = mapped_column(Date)
    price_paid: Mapped[float | None] = mapped_column(Float, nullable=True)
    terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[WarrantyStatus] = mapped_column(
        enum_column(WarrantyStatus), default=WarrantyStatus.PENDING
    )

    # Filled in by the blockchain service once minting is wired up.
    token_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(80), nullable=True)
    metadata_uri: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Only set in live-chain mode, from the mint transaction's receipt.
    gas_used: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    gas_price_wei: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    block_number: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    product: Mapped[Product] = relationship(back_populates="warranty")
    owner: Mapped[User] = relationship(back_populates="warranties", foreign_keys=[owner_id])
    transfers: Mapped[list[Transfer]] = relationship(
        back_populates="warranty", order_by="Transfer.transferred_at"
    )


class Transfer(Base):
    """Ownership history. Every row should eventually have a matching on-chain transfer."""

    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True)
    warranty_id: Mapped[int] = mapped_column(ForeignKey("warranties.id"))
    from_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    tx_hash: Mapped[str | None] = mapped_column(String(80), nullable=True)
    transferred_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    warranty: Mapped[Warranty] = relationship(back_populates="transfers")
    from_user: Mapped[User | None] = relationship(foreign_keys=[from_user_id])
    to_user: Mapped[User] = relationship(foreign_keys=[to_user_id])
