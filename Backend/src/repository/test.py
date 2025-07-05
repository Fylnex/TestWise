# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/repository/test.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Repository for Test and TestAttempt management.

This module provides data access operations for Test entities and their
attempts, including creation, retrieval, and submission handling.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import Test, TestAttempt, TestType, User, Topic, Section
from src.repository.base import create_item, delete_item, get_item, update_item
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()

# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------

async def create_test(
    session: AsyncSession,
    title: str,
    type: TestType,
    section_id: int | None = None,
    topic_id: int | None = None,
    duration: int | None = None,
) -> Test:
    """Create a new test with validation for section or topic ID."""
    if (section_id is None) == (topic_id is None):
        raise ValidationError(detail="Either section_id or topic_id must be provided (but not both)")
    if section_id is not None:
        await get_item(session, Section, section_id)
    if topic_id is not None:
        await get_item(session, Topic, topic_id)
    return await create_item(
        session,
        Test,
        title=title,
        type=type,
        section_id=section_id,
        topic_id=topic_id,
        duration=duration,
    )

async def get_test(session: AsyncSession, test_id: int) -> Test:
    """Retrieve a test by ID."""
    return await get_item(session, Test, test_id)

async def update_test(
    session: AsyncSession,
    test_id: int,
    **kwargs: Any,  # noqa: ANN401
) -> Test:
    """Update an existing test, excluding immutable fields."""
    kwargs.pop("id", None)
    return await update_item(session, Test, test_id, **kwargs)

async def delete_test(session: AsyncSession, test_id: int) -> None:
    """Archive a test by setting is_archived=True."""
    test = await get_item(session, Test, test_id)
    if test.is_archived:
        raise NotFoundError(resource_type="Test", resource_id=test_id, details="Already archived")
    test.is_archived = True
    await session.commit()
    logger.info(f"Archived test {test_id}")

async def archive_test(session: AsyncSession, test_id: int) -> None:
    """Explicitly archive a test by setting is_archived=True."""
    test = await get_item(session, Test, test_id)
    if test.is_archived:
        raise NotFoundError(resource_type="Test", resource_id=test_id, details="Already archived")
    test.is_archived = True
    await session.commit()
    logger.info(f"Archived test {test_id}")

async def restore_test(session: AsyncSession, test_id: int) -> None:
    """Restore an archived test by setting is_archived=False."""
    test = await get_item(session, Test, test_id)
    if not test.is_archived:
        raise NotFoundError(resource_type="Test", resource_id=test_id, details="Not archived")
    test.is_archived = False
    await session.commit()
    logger.info(f"Restored test {test_id}")

async def delete_test_permanently(session: AsyncSession, test_id: int) -> None:
    """Permanently delete an archived test."""
    test = await get_item(session, Test, test_id)
    if not test.is_archived:
        raise NotFoundError(resource_type="Test", resource_id=test_id, details="Cannot delete non-archived test")
    await delete_item(session, Test, test_id)
    logger.info(f"Permanently deleted test {test_id}")


# ----------------------------- Test listing --------------------------------

async def list_tests(session: AsyncSession, model: type[Test], **filters: Any) -> list[Test]:
    """Retrieve a list of tests with applied filters."""
    stmt = select(model).where(model.is_archived == False)
    for key, value in filters.items():
        stmt = stmt.where(getattr(model, key) == value)
    result = await session.execute(stmt)
    return list(result.scalars().all())

# ----------------------------- Test attempts --------------------------------

async def _next_attempt_number(session: AsyncSession, user_id: int, test_id: int) -> int:
    """Calculate the next attempt number for a user and test."""
    stmt = select(func.count(TestAttempt.id)).where(
        TestAttempt.user_id == user_id, TestAttempt.test_id == test_id
    )
    result = await session.execute(stmt)
    (count,) = result.first()
    return count + 1

async def create_test_attempt(
    session: AsyncSession,
    user_id: int,
    test_id: int,
) -> TestAttempt:
    """Create a new test attempt with the next attempt number."""
    await get_item(session, User, user_id)
    await get_item(session, Test, test_id)
    attempt_number = await _next_attempt_number(session, user_id, test_id)
    return await create_item(
        session,
        TestAttempt,
        user_id=user_id,
        test_id=test_id,
        attempt_number=attempt_number,
        started_at=datetime.now(),
    )

async def get_test_attempt(session: AsyncSession, attempt_id: int) -> TestAttempt:
    """Retrieve a test attempt by ID."""
    return await get_item(session, TestAttempt, attempt_id)

async def get_test_attempts(session: AsyncSession, user_id: int, test_id: int | None = None) -> list[TestAttempt]:
    """Retrieve a list of test attempts for a user, optionally filtered by test ID."""
    stmt = select(TestAttempt).where(TestAttempt.user_id == user_id)
    if test_id is not None:
        stmt = stmt.where(TestAttempt.test_id == test_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())

# ----------------------------- Submit -------------------------------

async def submit_test(
    session: AsyncSession,
    attempt_id: int,
    score: float,
    time_spent: int,
    answers: dict[str, Any],  # noqa: ANN401
) -> TestAttempt:
    """Submit a test attempt with score and answers."""
    attempt = await get_item(session, TestAttempt, attempt_id)
    if attempt.completed_at is not None:
        raise ValidationError(detail="Attempt already submitted")
    attempt.score = score
    attempt.time_spent = time_spent
    attempt.answers = answers
    attempt.completed_at = datetime.now()
    await update_item(session, TestAttempt, attempt_id)
    return attempt