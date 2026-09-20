"""Demo data so the UI has something to show. Run with: python -m app.seed"""

from datetime import date

from app.database import Base, SessionLocal, engine
from app.models import Product, Retailer, Role, Transfer, User, Warranty, WarrantyStatus
from app.routers.warranties import add_months
from app.security import hash_password
from app.services.blockchain import blockchain

RETAILER_EMAIL = "store@digiproof.example"
CUSTOMER_EMAIL = "buyer@digiproof.example"
PASSWORD = "password123"


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == RETAILER_EMAIL).first():
            print("Demo data already there, nothing to do.")
            return

        retailer_user = User(
            email=RETAILER_EMAIL,
            password_hash=hash_password(PASSWORD),
            full_name="Sunrise Electronics",
            role=Role.RETAILER,
        )
        customer = User(
            email=CUSTOMER_EMAIL,
            password_hash=hash_password(PASSWORD),
            full_name="Ava Chen",
            role=Role.CUSTOMER,
        )
        db.add_all([retailer_user, customer])
        db.flush()

        retailer = Retailer(
            user_id=retailer_user.id,
            business_name="Sunrise Electronics",
            registration_number="NZBN-9429041234567",
        )
        db.add(retailer)
        db.flush()

        product = Product(
            retailer_id=retailer.id,
            name="Aurora 27\" Monitor",
            brand="Aurora",
            model="A27-QHD",
            serial_number="AUR-27-000451",
            warranty_months=24,
        )
        db.add(product)
        db.flush()

        purchase_date = date(2026, 3, 14)
        minted = blockchain.mint_warranty(
            serial_number=product.serial_number,
            owner_email=customer.email,
            metadata={"name": product.name, "serial_number": product.serial_number},
        )
        warranty = Warranty(
            product_id=product.id,
            owner_id=customer.id,
            issued_by_retailer_id=retailer.id,
            purchase_date=purchase_date,
            expires_on=add_months(purchase_date, product.warranty_months),
            price_paid=649.00,
            terms="Parts and labour. Covers panel defects, excludes accidental damage.",
            status=WarrantyStatus.ACTIVE,
            token_id=minted.token_id,
            tx_hash=minted.tx_hash,
            metadata_uri=minted.metadata_uri,
        )
        db.add(warranty)
        db.flush()
        db.add(
            Transfer(
                warranty_id=warranty.id,
                from_user_id=None,
                to_user_id=customer.id,
                tx_hash=minted.tx_hash,
            )
        )
        db.commit()

        print("Seeded two accounts, password is:", PASSWORD)
        print("  retailer:", RETAILER_EMAIL)
        print("  customer:", CUSTOMER_EMAIL)
    finally:
        db.close()


if __name__ == "__main__":
    run()
