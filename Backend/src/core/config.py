# -*- coding: utf-8 -*-
"""
This module defines the application settings using Pydantic.
It loads configuration from .env.dev for local development or .env.prod for Docker.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the project (TestWise/Backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
print(f"Base DIR: {BASE_DIR}")

# Determine environment file
ENV_FILE = ".env.dev" if os.path.exists(BASE_DIR / ".env.dev") else ".env.prod"
print(f"ENV_FILE: {ENV_FILE}")

class Settings(BaseSettings):
    """Application settings loaded from .env.dev or .env.prod."""
    database_url: str
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    backup_dir: str
    log_dir: str
    log_file: str
    app_host: str
    app_port: int

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print(f"DATABASE_URL before normalization: {self.database_url}")
        # Normalize DATABASE_URL for local environment
        if ENV_FILE == ".env.dev" and self.database_url.startswith("sqlite+aiosqlite:///./"):
            # Convert relative path to absolute
            db_path = BASE_DIR / self.database_url.replace("sqlite+aiosqlite:///./", "")
            self.database_url = f"sqlite+aiosqlite:///{db_path.as_posix()}"
        print(f"DATABASE_URL after normalization: {self.database_url}")

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()