from __future__ import annotations

import calendar
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import current_retailer_profile, get_current_user
from app.models import Product, Retailer, Role, Transfer, User, Warranty, WarrantyStatus
from app.schemas import TransferRequest, WarrantyDetail, WarrantyIssue, WarrantyOut
from app.services.blockchain import blockchain
from app.services.notification import notification
from app.services.storage import storage

router = APIRouter(prefix="/warranties", tags=["warranties"])


def add_months(start: date, months: int) -> date:
    """Month arithmetic without pulling in another dependency."""
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


@router.post("", response_model=WarrantyDetail, status_code=status.HTTP_201_CREATED)
def issue_warranty(
    payload: WarrantyIssue,
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Warranty:
    """A retailer records a sale. This is the moment the NFT gets minted."""
    product = (
        db.query(Product)
        .filter(Product.id == payload.product_id, Product.retailer_id == retailer.id)
        .first()
    )
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    if product.warranty is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This product already has a warranty")

    customer = db.query(User).filter(User.email == payload.customer_email).first()
    if customer is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No customer account with that email. Ask them to register first.",
        )
    if customer.role is not Role.CUSTOMER:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That account is not a customer account")

    warranty = Warranty(
        product_id=product.id,
        owner_id=customer.id,
        issued_by_retailer_id=retailer.id,
        purchase_date=payload.purchase_date,
        expires_on=add_months(payload.purchase_date, product.warranty_months),
        price_paid=payload.price_paid,
        terms=payload.terms,
        status=WarrantyStatus.PENDING,
    )
    db.add(warranty)
    db.flush()

    # Steps 4-5 in the architecture diagram: pin the warranty metadata to
    # IPFS first and get back a CID, then mint pointing at that CID.
    pinned = storage.upload_metadata(
        {
            "name": product.name,
            "brand": product.brand,
            "model": product.model,
            "serial_number": product.serial_number,
            "retailer": retailer.business_name,
            "purchase_date": payload.purchase_date.isoformat(),
            "expires_on": warranty.expires_on.isoformat(),
            "terms": payload.terms,
        }
    )

    # Steps 6-9: the retailer's wallet service signs and submits the mint,
    # the contract records it on Polygon, the chain confirms.
    minted = blockchain.mint_warranty(
        serial_number=product.serial_number,
        owner_email=customer.email,
        metadata={"cid": pinned.cid, "uri": pinned.uri},
    )
    warranty.token_id = minted.token_id
    warranty.tx_hash = minted.tx_hash
    warranty.metadata_uri = pinned.uri
    warranty.gas_used = minted.gas_used
    warranty.gas_price_wei = minted.gas_price_wei
    warranty.block_number = minted.block_number
    warranty.status = WarrantyStatus.ACTIVE

    db.add(
        Transfer(
            warranty_id=warranty.id,
            from_user_id=None,  # minted straight to the buyer
            to_user_id=customer.id,
            tx_hash=minted.tx_hash,
        )
    )
    db.commit()
    db.refresh(warranty)

    # Step 10-11: token id comes back, warranty is now in the customer's
    # account -- let them know.
    notification.warranty_issued(
        to_email=customer.email,
        product_name=product.name,
        expires_on=warranty.expires_on.isoformat(),
    )
    return warranty


@router.get("", response_model=list[WarrantyOut])
def list_warranties(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Warranty]:
    """Customers see what they own. Retailers see what they issued."""
    query = db.query(Warranty)
    if user.role is Role.RETAILER:
        retailer = db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if retailer is None:
            return []
        query = query.filter(Warranty.issued_by_retailer_id == retailer.id)
    else:
        query = query.filter(Warranty.owner_id == user.id)
    return query.order_by(Warranty.created_at.desc()).all()


@router.get("/{warranty_id}", response_model=WarrantyDetail)
def get_warranty(
    warranty_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Warranty:
    warranty = db.query(Warranty).filter(Warranty.id == warranty_id).first()
    if warranty is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Warranty not found")

    allowed = warranty.owner_id == user.id
    if not allowed and user.role is Role.RETAILER:
        retailer = db.query(Retailer).filter(Retailer.user_id == user.id).first()
        allowed = retailer is not None and warranty.issued_by_retailer_id == retailer.id
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your warranty")
    return warranty


@router.post("/{warranty_id}/transfer", response_model=WarrantyDetail)
def transfer_warranty(
    warranty_id: int,
    payload: TransferRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Warranty:
    """Resale: the current owner hands the proof of purchase to someone else."""
    warranty = db.query(Warranty).filter(Warranty.id == warranty_id).first()
    if warranty is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Warranty not found")
    if warranty.owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the current owner can transfer this")

    new_owner = db.query(User).filter(User.email == payload.new_owner_email).first()
    if new_owner is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account with that email")
    if new_owner.id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That is already the owner")

    tx_hash = blockchain.transfer_warranty(
        token_id=warranty.token_id or "", to_email=new_owner.email
    )
    db.add(
        Transfer(
            warranty_id=warranty.id,
            from_user_id=user.id,
            to_user_id=new_owner.id,
            tx_hash=tx_hash,
        )
    )
    warranty.owner_id = new_owner.id
    db.commit()
    db.refresh(warranty)

    notification.ownership_transferred(to_email=new_owner.email, product_name=warranty.product.name)
    return warranty


@router.get("/verify/{serial_number}", response_model=WarrantyOut)
def verify_by_serial(serial_number: str, db: Session = Depends(get_db)) -> Warranty:
    """Open check by serial number, for a service centre or a second-hand buyer."""
    warranty = (
        db.query(Warranty)
        .join(Product, Product.id == Warranty.product_id)
        .filter(Product.serial_number == serial_number)
        .first()
    )
    if warranty is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No warranty for that serial number")
    return warranty
