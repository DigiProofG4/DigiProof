from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Retailer, Role, User
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    return user


def require_retailer(user: User = Depends(get_current_user)) -> User:
    if user.role is not Role.RETAILER:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Retailer account required")
    return user


def current_retailer_profile(
    user: User = Depends(require_retailer),
    db: Session = Depends(get_db),
) -> Retailer:
    profile = db.query(Retailer).filter(Retailer.user_id == user.id).first()
    if profile is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Retailer profile is missing")
    return profile
