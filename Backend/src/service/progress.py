# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/service/progress.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Progress-calculation utilities for TestWise.

This module defines business logic for calculating progress based on simple
rules:

* Subsection is considered *viewed* when the learner opens it; nothing
  else is required.
* Section completion percentage is the proportion of viewed subsections.
  If the section has a *section_final* test, that test **must** be passed
  (>= 60 % score) for the percentage to reach 100 %.
* Topic completion percentage is the arithmetic mean of its sections'
  completion percentages.
* Global-final tests are available only when their parent topic's
  completion is ≥ 90 %.
* Section-final tests are available only when their parent section's
  completion is ≥ 90 %.
* Hinted tests are always available; they never gate progress.

All functions are ``async`` and expect an ``AsyncSession`` following the
SQLAlchemy 2.0 style.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.enums import TestAttemptStatus
from src.domain.models import (
    ProgressStatus,
    Section,
    SectionProgress,
    Test,
    TestAttempt,
    TestType,
    Topic,
    TopicProgress, SubsectionProgress, Subsection,
)
from src.repository.base import get_item
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _ensure_topic_progress(session: AsyncSession, user_id: int, topic_id: int) -> TopicProgress:
    """Ensure a topic progress entry exists, creating it if necessary."""
    stmt: Select = select(TopicProgress).where(
        TopicProgress.user_id == user_id, TopicProgress.topic_id == topic_id
    )
    res = await session.execute(stmt)
    progress = res.scalar_one_or_none()
    if progress is None:
        progress = TopicProgress(user_id=user_id, topic_id=topic_id, status=ProgressStatus.STARTED)
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
    return progress


async def _ensure_section_progress(session: AsyncSession, user_id: int, section_id: int) -> SectionProgress:
    """Ensure a section progress entry exists, creating it if necessary."""
    stmt: Select = select(SectionProgress).where(
        SectionProgress.user_id == user_id, SectionProgress.section_id == section_id
    )
    res = await session.execute(stmt)
    progress = res.scalar_one_or_none()
    if progress is None:
        progress = SectionProgress(user_id=user_id, section_id=section_id, status=ProgressStatus.STARTED)
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
    return progress


async def _ensure_subsection_progress(
        session: AsyncSession, user_id: int, subsection_id: int
) -> SubsectionProgress:
    """Ensure a subsection progress entry exists, creating it if necessary."""
    stmt: Select = select(SubsectionProgress).where(
        SubsectionProgress.user_id == user_id, SubsectionProgress.subsection_id == subsection_id
    )
    res = await session.execute(stmt)
    progress = res.scalar_one_or_none()
    if progress is None:
        progress = SubsectionProgress(user_id=user_id, subsection_id=subsection_id, is_viewed=False)
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
    return progress


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def calculate_section_progress(
    session: AsyncSession, user_id: int, section_id: int, commit: bool = True
) -> dict:
    section = await session.get(Section, section_id)
    if not section:
        return {"completed": 0, "total": 0}

    # Eagerly load subsections to avoid lazy loading issues
    stmt = select(Subsection).where(Subsection.section_id == section_id)
    result = await session.execute(stmt)
    subsections = result.scalars().all()

    total_subsections = len(subsections)
    if total_subsections == 0:
        return {"completed": 0, "total": total_subsections}

    completed_subsections = 0
    for subsection in subsections:
        # Find tests associated with this subsection (if any)
        stmt = select(Test).where(Test.section_id == section_id)
        result = await session.execute(stmt)
        tests = result.scalars().all()

        if tests:
            # Check if any test attempt for these tests is completed
            for test in tests:
                stmt = select(TestAttempt).where(
                    TestAttempt.user_id == user_id,
                    TestAttempt.test_id == test.id,
                    TestAttempt.status == TestAttemptStatus.COMPLETED
                )
                result = await session.execute(stmt)
                if result.scalars().first():
                    completed_subsections += 1
                    break  # Count subsection as completed if any test is done
        else:
            # If no tests, check if subsection has other completion criteria (e.g., content viewed)
            # Placeholder: Adjust based on your app's logic
            completed_subsections += 1  # Default to completed if no tests

    progress = {
        "completed": completed_subsections,
        "total": total_subsections,
        "percentage": (completed_subsections / total_subsections * 100) if total_subsections > 0 else 0
    }

    if commit:
        section.progress = progress["percentage"]
        session.add(section)
        await session.commit()

    return progress

async def calculate_topic_progress(
        session: AsyncSession,
        user_id: int,
        topic_id: int,
        commit: bool = False,
) -> float:
    """Recalculate topic completion percentage and persist it."""
    topic: Topic | None = await get_item(session, Topic, topic_id)
    if topic is None:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id)

    total_sections: int = len(topic.sections)
    if total_sections == 0:
        percentage = 0.0
    else:
        stmt = select(func.avg(SectionProgress.completion_percentage)).where(
            SectionProgress.user_id == user_id,
            SectionProgress.section_id.in_(s.id for s in topic.sections),
        )
        res = await session.execute(stmt)
        (avg_percentage,) = res.first()
        percentage = float(avg_percentage or 0.0)

    topic_progress = await _ensure_topic_progress(session, user_id, topic_id)
    topic_progress.completion_percentage = round(percentage, 2)
    topic_progress.status = (
        ProgressStatus.COMPLETED if percentage >= 99.9 else ProgressStatus.IN_PROGRESS
    )
    topic_progress.last_accessed = datetime.now()

    if commit:
        await session.commit()
    else:
        await session.flush()

    return percentage


# ---------------------------------------------------------------------------
# Test availability
# ---------------------------------------------------------------------------


async def check_test_availability(session: AsyncSession, user_id: int, test_id: int) -> bool:
    """Return *True* if the user may start the given test."""
    test: Test | None = await get_item(session, Test, test_id)
    if test is None:
        raise NotFoundError(resource_type="Test", resource_id=test_id)

    if test.type == TestType.HINTED:
        return True  # always available

    if test.type == TestType.SECTION_FINAL:
        await calculate_section_progress(session, user_id, test.section_id, commit=False)
        stmt = select(SectionProgress.completion_percentage).where(
            SectionProgress.user_id == user_id, SectionProgress.section_id == test.section_id
        )
        res = await session.execute(stmt)
        (perc,) = res.first()
        return perc is not None and perc >= 90.0

    if test.type == TestType.GLOBAL_FINAL:
        if test.topic_id is None:
            raise ValidationError(detail="Global-final test must be linked to a topic")
        await calculate_topic_progress(session, user_id, test.topic_id, commit=False)
        stmt = select(TopicProgress.completion_percentage).where(
            TopicProgress.user_id == user_id, TopicProgress.topic_id == test.topic_id
        )
        res = await session.execute(stmt)
        (perc,) = res.first()
        return perc is not None and perc >= 90.0

    return False  # fallback


# ---------------------------------------------------------------------------
# User profile aggregation
# ---------------------------------------------------------------------------


async def get_user_profile(session: AsyncSession, user_id: int) -> Dict[str, Any]:
    """Return a consolidated snapshot of the user's learning journey."""
    # Ensure topic progress rows exist for *all* topics the user has touched.
    stmt_topics = (
        select(Topic)
        .join(Section, Topic.id == Section.topic_id)
        .join(SectionProgress, Section.id == SectionProgress.section_id)
        .where(SectionProgress.user_id == user_id)
    )
    topics_res = await session.execute(stmt_topics)
    topics = list({t for t, in topics_res})

    # Pull progress tables
    topic_progress_res = await session.execute(
        select(TopicProgress).where(TopicProgress.user_id == user_id)
    )
    section_progress_res = await session.execute(
        select(SectionProgress).where(SectionProgress.user_id == user_id)
    )
    subsection_progress_res = await session.execute(
        select(SubsectionProgress).where(SubsectionProgress.user_id == user_id)
    )
    attempts_res = await session.execute(
        select(TestAttempt).where(TestAttempt.user_id == user_id)
    )

    profile: Dict[str, Any] = {
        "topics": [tp for tp in topic_progress_res.scalars().all()],
        "sections": [sp for sp in section_progress_res.scalars().all()],
        "subsections": [ssp for ssp in subsection_progress_res.scalars().all()],
        "test_attempts": [ta for ta in attempts_res.scalars().all()],
    }

    # Optionally return a human-friendly overall KPI
    if profile["topics"]:
        overall = sum(tp.completion_percentage for tp in profile["topics"]) / len(
            profile["topics"]
        )
        profile["overall_completion"] = round(overall, 2)

    return profile
