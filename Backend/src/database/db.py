# TestWise/Backend/src/database/db.py
# -*- coding: utf-8 -*-
"""
This module configures the database connection for the TestWise application using SQLAlchemy with an asynchronous SQLite driver.
It provides an async engine, session factory, and dependency for FastAPI to manage database sessions.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from src.core.config import settings
from src.database.models import Base

# Create async engine for SQLite
engine = create_async_engine(settings.database_url, echo=False)

# Create async session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an async database session for dependency injection in FastAPI.

    Yields:
        AsyncSession: An active database session.
    """
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """
    Initializes the database by creating all defined tables.

    Exceptions:
        - Any SQLAlchemy-related exceptions if table creation fails.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
