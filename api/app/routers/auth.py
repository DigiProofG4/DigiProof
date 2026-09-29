from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Retailer, Role, Transfer, User
from app.schemas import (
    LoginRequest,
    PasswordChange,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
    TransactionOut,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "That email is already registered")

    if payload.role is Role.RETAILER and not payload.business_name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Retailers need a business name")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role is Role.RETAILER:
        db.add(
            Retailer(
                user_id=user.id,
                business_name=payload.business_name,
                registration_number=payload.registration_number,
            )
        )

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """One login for both sides. The role on the account decides what the UI shows."""
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong email or password")

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    """Update profile, wallet or settings. Fields left out of the request stay as they are."""
    changes = payload.model_dump(exclude_unset=True)

    # null is how the wallet card disconnects a wallet; for everything else it means "no change".
    for field, value in list(changes.items()):
        if value is None and field != "wallet_address":
            del changes[field]

    new_email = changes.get("email")
    if new_email and new_email != user.email:
        taken = db.query(User).filter(User.email == new_email, User.id != user.id).first()
        if taken is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "That email is already registered")

    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """Needs the current password, so a session left open can't be used to take the account over."""
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your current password is not correct")
    user.password_hash = hash_password(payload.new_password)
    db.commit()


@router.get("/me/transactions", response_model=list[TransactionOut])
def my_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TransactionOut]:
    """Mints and transfers on warranties this user received or passed on, newest first."""
    transfers = (
        db.query(Transfer)
        .filter(or_(Transfer.to_user_id == user.id, Transfer.from_user_id == user.id))
        .order_by(Transfer.transferred_at.desc())
        .all()
    )
    history = []
    for transfer in transfers:
        if transfer.from_user_id is None:
            kind, other = "minted", None
        elif transfer.to_user_id == user.id:
            kind, other = "received", transfer.from_user
        else:
            kind, other = "sent", transfer.to_user
        explorer = (
            f"{settings.chain_explorer_tx_base_url}{transfer.tx_hash}"
            if transfer.tx_hash and settings.chain_explorer_tx_base_url
            else None
        )
        history.append(
            TransactionOut(
                kind=kind,
                warranty_id=transfer.warranty_id,
                product_name=transfer.warranty.product.name,
                counterparty=other.full_name if other else None,
                tx_hash=transfer.tx_hash,
                explorer_tx_url=explorer,
                at=transfer.transferred_at,
            )
        )
    return history
