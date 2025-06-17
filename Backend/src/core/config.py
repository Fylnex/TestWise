# TestWise/Backend/src/core/config.py
# -*- coding: utf-8 -*-
"""
This module defines the application settings using Pydantic.
It loads configuration from the .env.dev file for database, JWT, logging, and backup settings.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Base directory for the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env.dev")

class Settings(BaseSettings):
    """Application settings loaded from .env.dev."""
    database_url: str
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    backup_dir: str
    log_dir: str
    log_file: str
    app_host: str
    app_port: int

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env.dev",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()