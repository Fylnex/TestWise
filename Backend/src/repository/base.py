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

from typing import Any, Type, TypeVar, List, Optional

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

async def get_item(session: AsyncSession, model: Type[Base], item_id: int, is_archived: bool = False) -> Any:
    """Retrieve a single item by ID with archive status filter."""
    stmt = select(model).where(getattr(model, "id") == item_id, model.is_archived == is_archived)
    result = await session.execute(stmt)
    item = result.scalars().first()
    if item is None:
        raise NotFoundError(resource_type=model.__name__, resource_id=item_id)
    return item

async def create_item(session: AsyncSession, model: Type[Base], **kwargs: Any) -> Any:
    """Create a new item in the database."""
    instance = model(**kwargs)
    session.add(instance)
    await session.commit()
    await session.refresh(instance)
    return instance

async def update_item(session: AsyncSession, model: Type[Base], item_id: int, **kwargs: Any) -> Any:
    """Update an existing item in the database."""
    instance = await get_item(session, model, item_id)
    for key, value in kwargs.items():
        setattr(instance, key, value)
    await session.commit()
    await session.refresh(instance)
    return instance

async def delete_item(session: AsyncSession, model: Type[Base], item_id: int) -> None:
    """Delete an item from the database."""
    instance = await get_item(session, model, item_id)
    await session.delete(instance)
    await session.commit()

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

async def list_items(
    session: AsyncSession,
    model: Type[T],
    *args,
    **filters,
) -> List[T]:
    """Retrieve a list of items filtered by the given criteria."""
    stmt = select(model)
    # Обработка кастомных фильтров перед filter_by
    for key, value in filters.items():
        if key.endswith('__not') and value is None:
            attr_name = key[:-5]  # Удаляем '__not'
            stmt = stmt.where(getattr(model, attr_name).is_not(None))
        elif key.endswith('__ne'):
            attr_name = key[:-4]  # Удаляем '__ne'
            stmt = stmt.where(getattr(model, attr_name) != value)
    # Применение оставшихся фильтров
    stmt = stmt.filter_by(**{k: v for k, v in filters.items() if not k.endswith(('__not', '__ne'))})
    result = await session.execute(stmt)
    items = result.scalars().all()
    logger.debug("Retrieved %d %s items", len(items), model.__name__)
    return list(items)