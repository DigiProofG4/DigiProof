from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Everything the API needs to start, read from .env or the environment."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DigiProof API"
    database_url: str = "sqlite:///./digiproof.db"

    jwt_secret: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 720

    # Comma separated list, e.g. "http://localhost:5173,http://localhost:3000"
    cors_origins: str = "http://localhost:5173"

    # Left empty until the contracts are deployed.
    chain_rpc_url: str = ""
    contract_address: str = ""
    custodial_wallet_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
