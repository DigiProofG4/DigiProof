from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

if settings.database_url.startswith("sqlite"):
    # check_same_thread is a SQLite quirk.
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
else:
    # The shared Clever Cloud Dev database allows only 5 connections across the
    # whole team, so each backend holds at most one. pre_ping replaces
    # connections the server dropped while idle instead of failing a request.
    engine = create_engine(
        settings.database_url,
        pool_size=1,
        max_overflow=0,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
