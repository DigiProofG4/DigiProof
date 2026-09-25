from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, products, warranties
from app.services.blockchain import blockchain

app = FastAPI(
    title=settings.app_name,
    description="Blockchain-backed proof of purchase and warranty records.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables() -> None:
    """Fine for coursework. Swap in Alembic migrations if the schema starts moving."""
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {
        "status": "ok",
        "chain_connected": blockchain.is_live,
        "contract_address": blockchain.contract_address or None,
    }


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(warranties.router)
