from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import current_retailer_profile
from app.models import Product, Retailer
from app.schemas import ProductCreate, ProductImageLink, ProductOut
from app.services.images import MAX_BYTES, ImageError, delete_product_image, save_product_image

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


def _own_product(db: Session, retailer: Retailer, product_id: int) -> Product:
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.retailer_id == retailer.id)
        .first()
    )
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Product:
    return _own_product(db, retailer, product_id)


@router.post("/{product_id}/image", response_model=ProductOut)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Product:
    """Attach a photo (JPG, PNG or WebP, up to 5 MB), replacing any earlier one."""
    product = _own_product(db, retailer, product_id)
    # Read one byte past the limit so an oversized file is caught without loading all of it.
    data = await file.read(MAX_BYTES + 1)
    try:
        new_url = save_product_image(data)
    except ImageError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    old_url = product.image_url
    product.image_url = new_url
    db.commit()
    db.refresh(product)
    delete_product_image(old_url)
    return product


@router.put("/{product_id}/image", response_model=ProductOut)
def link_product_image(
    product_id: int,
    payload: ProductImageLink,
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Product:
    """Point the product at a picture hosted elsewhere instead of an upload."""
    product = _own_product(db, retailer, product_id)
    old_url = product.image_url
    product.image_url = payload.image_url
    db.commit()
    db.refresh(product)
    delete_product_image(old_url)
    return product


@router.delete("/{product_id}/image", response_model=ProductOut)
def remove_product_image(
    product_id: int,
    db: Session = Depends(get_db),
    retailer: Retailer = Depends(current_retailer_profile),
) -> Product:
    product = _own_product(db, retailer, product_id)
    old_url = product.image_url
    product.image_url = None
    db.commit()
    db.refresh(product)
    delete_product_image(old_url)
    return product
