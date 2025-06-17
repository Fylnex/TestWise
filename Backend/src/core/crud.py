# TestWise/Backend/src/core/crud.py
# -*- coding: utf-8 -*-
"""core.crud
~~~~~~~~~~~~~~~~
High‑level asynchronous CRUD helpers for TestWise.

All functions are thin wrappers around SQLAlchemy 2.0 async ORM calls with
consistent logging and domain‑specific validation.  Where additional business
logic is required (e.g., test attempts, progress tracking, group membership
rules) it is kept *minimal*—full, opinionated workflows live in their own
modules (``core.progress``, ``core.tests``).  This layer is deliberately kept
stateless to make writing unit tests trivial.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Type, TypeVar

from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.database.models import (
    Group,
    GroupStudents,
    GroupStudentStatus,
    Question,
    QuestionType,
    Role,
    Section,
    Subsection,
    SubsectionType,
    Test,
    TestAttempt,
    TestType,
    Topic,
    TopicProgress,
    SectionProgress,
    SubsectionProgress,
    User,
)
from src.utils.exceptions import ConflictError, NotFoundError, ValidationError

T = TypeVar("T")


logger = configure_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------


async def get_item(session: AsyncSession, model: Type[T], item_id: Any) -> T:  # noqa: ANN401
    stmt = select(model).where(model.id == item_id)
    result = await session.execute(stmt)
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError(resource_type=model.__name__, resource_id=item_id)
    return item


async def create_item(session: AsyncSession, model: Type[T], **kwargs) -> T:  # noqa: ANN401
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


async def update_item(session: AsyncSession, model: Type[T], item_id: Any, **kwargs) -> T:  # noqa: ANN401
    item = await get_item(session, model, item_id)
    for key, value in kwargs.items():
        if hasattr(item, key):
            setattr(item, key, value)
    try:
        await session.commit()
        await session.refresh(item)
        logger.info("Updated %s with ID %s", model.__name__, item_id)
    except IntegrityError as exc:
        await session.rollback()
        logger.error("Failed to update %s: %s", model.__name__, exc.orig)
        raise ConflictError(detail=str(exc.orig))
    return item


async def delete_item(session: AsyncSession, model: Type[T], item_id: Any) -> None:  # noqa: ANN401
    item = await get_item(session, model, item_id)
    await session.delete(item)
    await session.commit()
    logger.info("Deleted %s with ID %s", model.__name__, item_id)


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------


async def create_user(
        session: AsyncSession,
        username: str,
        email: str,
        password: str,
        role: Role = Role.STUDENT,
) -> User:
    hashed_password = pwd_context.hash(password)
    return await create_item(
        session,
        User,
        username=username,
        email=email,
        password=hashed_password,
        role=role,
    )


async def get_user_by_username(session: AsyncSession, username: str) -> User:
    stmt = select(User).where(User.username == username)
    res = await session.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise NotFoundError(resource_type="User", resource_id=username)
    return user


# ---------------------------------------------------------------------------
# Group & membership helpers
# ---------------------------------------------------------------------------


async def create_group(
        session: AsyncSession,
        name: str,
        start_year: int,
        end_year: int,
        description: str | None = None,
) -> Group:
    return await create_item(
        session,
        Group,
        name=name,
        start_year=start_year,
        end_year=end_year,
        description=description,
    )


async def add_student_to_group(session: AsyncSession, user_id: int, group_id: int) -> GroupStudents:
    await get_item(session, User, user_id)
    await get_item(session, Group, group_id)
    return await create_item(
        session,
        GroupStudents,
        user_id=user_id,
        group_id=group_id,
        status=GroupStudentStatus.ACTIVE,
    )


async def remove_student_from_group(session: AsyncSession, user_id: int, group_id: int) -> None:
    stmt = select(GroupStudents).where(
        GroupStudents.user_id == user_id, GroupStudents.group_id == group_id
    )
    res = await session.execute(stmt)
    link = res.scalar_one_or_none()
    if not link:
        raise NotFoundError(resource_type="GroupStudents", resource_id=f"{user_id}-{group_id}")
    await session.delete(link)
    await session.commit()
    logger.info("Removed user %s from group %s", user_id, group_id)


async def update_student_status(
        session: AsyncSession, user_id: int, group_id: int, status: GroupStudentStatus
) -> GroupStudents:
    stmt = select(GroupStudents).where(
        GroupStudents.user_id == user_id, GroupStudents.group_id == group_id
    )
    res = await session.execute(stmt)
    link = res.scalar_one_or_none()
    if not link:
        raise NotFoundError(resource_type="GroupStudents", resource_id=f"{user_id}-{group_id}")
    link.status = status
    link.updated_at = datetime.now()
    await session.commit()
    await session.refresh(link)
    return link


# ---------------------------------------------------------------------------
# Topic / Section / Subsection
# ---------------------------------------------------------------------------


async def create_topic(
        session: AsyncSession,
        title: str,
        description: str | None = None,
        category: str | None = None,
        image: str | None = None,
) -> Topic:
    return await create_item(
        session,
        Topic,
        title=title,
        description=description,
        category=category,
        image=image,
    )


async def create_section(
        session: AsyncSession,
        topic_id: int,
        title: str,
        content: str | None = None,
        description: str | None = None,
        order: int = 0,
) -> Section:
    await get_item(session, Topic, topic_id)
    return await create_item(
        session,
        Section,
        topic_id=topic_id,
        title=title,
        content=content,
        description=description,
        order=order,
    )


async def update_section(
        session: AsyncSession,
        section_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> Section:
    # Prevent updating immutable fields
    kwargs.pop("id", None)
    return await update_item(session, Section, section_id, **kwargs)


# ----------------------------- Subsection helpers ---------------------------


async def create_subsection(
        session: AsyncSession,
        section_id: int,
        title: str,
        content: str | None = None,
        type: SubsectionType = SubsectionType.TEXT,
        order: int = 0,
) -> Subsection:
    await get_item(session, Section, section_id)
    return await create_item(
        session,
        Subsection,
        section_id=section_id,
        title=title,
        content=content,
        type=type,
        order=order,
    )


async def get_subsection(session: AsyncSession, subsection_id: int) -> Subsection:
    return await get_item(session, Subsection, subsection_id)


async def update_subsection(
        session: AsyncSession,
        subsection_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> Subsection:
    kwargs.pop("id", None)
    return await update_item(session, Subsection, subsection_id, **kwargs)


async def delete_subsection(session: AsyncSession, subsection_id: int) -> None:
    await delete_item(session, Subsection, subsection_id)


async def mark_subsection_viewed(
        session: AsyncSession,
        user_id: int,
        subsection_id: int,
) -> SubsectionProgress:
    """
    Idempotently mark a subsection as viewed and persist the timestamp.

    If a SubsectionProgress row doesn't exist it will be created; otherwise,
    it is updated only when transitioning from not viewed → viewed.
    """
    # Ensure referenced objects exist
    await get_item(session, User, user_id)
    subsection = await get_item(session, Subsection, subsection_id)

    stmt = select(SubsectionProgress).where(
        SubsectionProgress.user_id == user_id,
        SubsectionProgress.subsection_id == subsection_id,
    )
    res = await session.execute(stmt)
    progress = res.scalar_one_or_none()

    if progress is None:
        # Create on first view
        progress = SubsectionProgress(
            user_id=user_id,
            subsection_id=subsection_id,
            is_viewed=True,
            viewed_at=datetime.utcnow(),
        )
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
        logger.info(
            "Created progress row for viewed subsection %s by user %s",
            subsection_id,
            user_id,
        )
    elif not progress.is_viewed:
        # Update existing row
        progress.is_viewed = True
        progress.viewed_at = datetime.utcnow()
        await session.commit()
        await session.refresh(progress)
        logger.info(
            "Marked subsection %s viewed for user %s",
            subsection_id,
            user_id,
        )
    # else already viewed — nothing to change

    return progress


# ---------------------------------------------------------------------------
# Questions & Tests
# ---------------------------------------------------------------------------


async def create_question(
        session: AsyncSession,
        section_id: int,
        question: str,
        question_type: QuestionType,
        options: list[str] | None = None,
        correct_answer: Any | None = None,  # noqa: ANN401
        hint: str | None = None,
        is_final: bool = False,
        image: str | None = None,
        test_id: int | None = None,
) -> Question:
    await get_item(session, Section, section_id)
    if test_id is not None:
        await get_item(session, Test, test_id)
    if question_type in {QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE} and (
            not options or len(options) < 2):
        raise ValidationError(detail="Choice questions must include at least two options")
    return await create_item(
        session,
        Question,
        section_id=section_id,
        question=question,
        question_type=question_type,
        options=options,
        correct_answer=correct_answer,
        hint=hint,
        is_final=is_final,
        image=image,
        test_id=test_id,
    )


async def update_question(
        session: AsyncSession,
        question_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> Question:
    kwargs.pop("id", None)
    return await update_item(session, Question, question_id, **kwargs)


# ----------------------------- Test helpers ---------------------------------


async def create_test(
        session: AsyncSession,
        title: str,
        type: TestType,
        section_id: int | None = None,
        topic_id: int | None = None,
        duration: int | None = None,
        question_ids: list[int] | None = None,
) -> Test:
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
        question_ids=question_ids,
    )


async def get_test(session: AsyncSession, test_id: int) -> Test:
    return await get_item(session, Test, test_id)


async def update_test(
        session: AsyncSession,
        test_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> Test:
    kwargs.pop("id", None)
    return await update_item(session, Test, test_id, **kwargs)


async def delete_test(session: AsyncSession, test_id: int) -> None:
    await delete_item(session, Test, test_id)


# ----------------------------- Test attempts --------------------------------


async def _next_attempt_number(session: AsyncSession, user_id: int, test_id: int) -> int:
    stmt = select(func.count(TestAttempt.id)).where(
        TestAttempt.user_id == user_id, TestAttempt.test_id == test_id
    )
    res = await session.execute(stmt)
    (count,) = res.first()
    return count + 1


async def create_test_attempt(
        session: AsyncSession,
        user_id: int,
        test_id: int,
) -> TestAttempt:
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
    return await get_item(session, TestAttempt, attempt_id)


async def get_test_attempts(session: AsyncSession, user_id: int, test_id: int | None = None) -> list[TestAttempt]:
    stmt = select(TestAttempt).where(TestAttempt.user_id == user_id)
    if test_id is not None:
        stmt = stmt.where(TestAttempt.test_id == test_id)
    res = await session.execute(stmt)
    return list(res.scalars().all())


# ----------------------------- Start & Submit -------------------------------


async def start_test(session: AsyncSession, user_id: int, test_id: int) -> TestAttempt:
    return await create_test_attempt(session, user_id, test_id)


async def submit_test(
        session: AsyncSession,
        attempt_id: int,
        score: float,
        time_spent: int,
        answers: dict[str, Any],  # noqa: ANN401
) -> TestAttempt:
    attempt = await get_item(session, TestAttempt, attempt_id)
    if attempt.completed_at is not None:
        raise ValidationError(detail="Attempt already submitted")
    attempt.score = score
    attempt.time_spent = time_spent
    attempt.answers = answers
    attempt.completed_at = datetime.now()
    await session.commit()
    await session.refresh(attempt)
    return attempt


# ---------------------------------------------------------------------------
# Progress tracking helpers
# ---------------------------------------------------------------------------


async def create_topic_progress(
        session: AsyncSession,
        user_id: int,
        topic_id: int,
        status: str = "started",
        completion_percentage: float = 0.0,
) -> TopicProgress:
    await get_item(session, User, user_id)
    await get_item(session, Topic, topic_id)
    return await create_item(
        session,
        TopicProgress,
        user_id=user_id,
        topic_id=topic_id,
        status=status,
        completion_percentage=completion_percentage,
    )


async def get_topic_progress(session: AsyncSession, progress_id: int) -> TopicProgress:
    return await get_item(session, TopicProgress, progress_id)


async def update_topic_progress(
        session: AsyncSession,
        progress_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> TopicProgress:
    kwargs.pop("id", None)
    return await update_item(session, TopicProgress, progress_id, **kwargs)


async def create_section_progress(
        session: AsyncSession,
        user_id: int,
        section_id: int,
        status: str = "started",
        completion_percentage: float = 0.0,
) -> SectionProgress:
    await get_item(session, User, user_id)
    await get_item(session, Section, section_id)
    return await create_item(
        session,
        SectionProgress,
        user_id=user_id,
        section_id=section_id,
        status=status,
        completion_percentage=completion_percentage,
    )


async def get_section_progress(session: AsyncSession, progress_id: int) -> SectionProgress:
    return await get_item(session, SectionProgress, progress_id)


async def update_section_progress(
        session: AsyncSession,
        progress_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> SectionProgress:
    kwargs.pop("id", None)
    return await update_item(session, SectionProgress, progress_id, **kwargs)


async def create_subsection_progress(
        session: AsyncSession,
        user_id: int,
        subsection_id: int,
        is_viewed: bool = False,
) -> SubsectionProgress:
    await get_item(session, User, user_id)
    await get_item(session, Subsection, subsection_id)
    return await create_item(
        session,
        SubsectionProgress,
        user_id=user_id,
        subsection_id=subsection_id,
        is_viewed=is_viewed,
        viewed_at=datetime.now() if is_viewed else None,
    )


async def get_subsection_progress(session: AsyncSession, progress_id: int) -> SubsectionProgress:
    return await get_item(session, SubsectionProgress, progress_id)


async def update_subsection_progress(
        session: AsyncSession,
        progress_id: int,
        **kwargs: Any,  # noqa: ANN401
) -> SubsectionProgress:
    kwargs.pop("id", None)
    return await update_item(session, SubsectionProgress, progress_id, **kwargs)
