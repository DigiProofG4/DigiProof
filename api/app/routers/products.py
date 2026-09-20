from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import current_retailer_profile
from app.models import Product, Retailer
from app.schemas import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Product:
    clash = db.query(Product).filter(Product.serial_number == payload.serial_number).first()
    if clash is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "That serial number is already registered")

    product = Product(retailer_id=retailer.id, **payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> list[Product]:
    return (
        db.query(Product)
        .filter(Product.retailer_id == retailer.id)
        .order_by(Product.created_at.desc())
        .all()
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Product:
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.retailer_id == retailer.id)
        .first()
    )
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product
