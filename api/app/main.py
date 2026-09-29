from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, products, warranties
from app.services.blockchain import blockchain
from app.services.images import UPLOAD_ROOT

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
    }


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(warranties.router)

# Uploaded product photos. The folder is created up front because StaticFiles
# refuses to mount a directory that doesn't exist yet.
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")
