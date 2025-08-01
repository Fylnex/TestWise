# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/repository/base.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Base repository operations for generic CRUD functionality.

This module provides reusable asynchronous CRUD helpers using SQLAlchemy 2.0
async ORM, with logging and basic validation. It is designed to be stateless
for unit testing simplicity.
"""

from __future__ import annotations

from typing import Any, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import Base
from src.utils.exceptions import ConflictError, NotFoundError

T = TypeVar("T", bound=Base)

logger = configure_logger()

# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

async def get_item(session: AsyncSession, model: Type[T], item_id: Any, is_archived: bool = False) -> T:
    """Retrieve a single item by ID, optionally filtered by archive status."""
    stmt = select(model).where(model.id == item_id, model.is_archived == is_archived)
    result = await session.execute(stmt)
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError(resource_type=model.__name__, resource_id=item_id)
    return item

async def create_item(session: AsyncSession, model: Type[T], **kwargs) -> T:
    """Create a new item with the given attributes."""
    item = model(**kwargs)
    session.add(item)
    try:
        await session.commit()
        await session.refresh(item)
        logger.info("Created %s with ID %s", model.__name__, item.id)
    except IntegrityError as exc:
        await session.rollback()
        logger.error("Failed to create %s: %s", model.__name__, exc.orig)
        raise ConflictError(detail=str(exc.orig))
    return item

async def update_item(session: AsyncSession, model: Type[T], item_id: Any, **kwargs) -> T:
    """Update an existing item with the given attributes."""
    item = await get_item(session, model, item_id)
    for key, value in kwargs.items():
        if hasattr(item, key):
            setattr(item, key, value)  # Corrected to use key and value
    try:
        await session.commit()
        await session.refresh(item)
        logger.info("Updated %s with ID %s", model.__name__, item_id)
    except IntegrityError as exc:
        await session.rollback()
        logger.error("Failed to update %s: %s", model.__name__, exc.orig)
        raise ConflictError(detail=str(exc.orig))
    return item

async def delete_item(session: AsyncSession, model: Type[T], item_id: Any) -> None:
    """Delete an item by ID."""
    item = await get_item(session, model, item_id)
    await session.delete(item)
    await session.commit()
    logger.info("Deleted %s with ID %s", model.__name__, item_id)

async def archive_item(session: AsyncSession, model: Type[T], item_id: Any) -> None:
    """Archive an item by setting its is_archived flag to True."""
    item = await get_item(session, model, item_id)
    item.is_archived = True
    await session.commit()
    logger.info("Archived %s with ID %s", model.__name__, item_id)

async def delete_item_permanently(session: AsyncSession, model: Type[T], item_id: Any) -> None:
    """Permanently delete an archived item."""
    item = await get_item(session, model, item_id, is_archived=True)
    await session.delete(item)
    await session.commit()
    logger.info("Permanently deleted %s with ID %s", model.__name__, item_id)

async def list_items(session: AsyncSession, model: Type[T], **filters) -> list[T]:
    """Retrieve a list of items filtered by the given criteria."""
    stmt = select(model).filter_by(**filters)
    result = await session.execute(stmt)
    items = result.scalars().all()
    logger.debug("Retrieved %d %s items", len(items), model.__name__)
    return list(items)