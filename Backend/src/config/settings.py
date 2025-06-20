# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/config/settings.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Configuring application settings using Pydantic.

This module loads configuration from .env.dev for local development or .env.prod
for Docker environments, providing a centralized settings management system.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the project (TestWise/Backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Determine environment file
ENV_FILE = ".env.dev" if (BASE_DIR / ".env.dev").exists() else ".env.prod"

class Settings(BaseSettings):
    """Application settings loaded from .env.dev or .env.prod."""
    database_url: str
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    backup_dir: str = str(BASE_DIR / "backups")
    log_dir: str = str(BASE_DIR / "logs")
    log_file: str = "app.log"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Normalize DATABASE_URL for local environment
        if ENV_FILE == ".env.dev" and self.database_url.startswith("sqlite+aiosqlite:///./"):
            db_path = BASE_DIR / self.database_url.replace("sqlite+aiosqlite:///./", "")
            self.database_url = f"sqlite+aiosqlite:///{db_path.as_posix()}"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()