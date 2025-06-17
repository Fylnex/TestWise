# TestWise/Backend/src/core/crud.py
# -*- coding: utf-8 -*-
"""
This module provides generic CRUD operations for the TestWise application.
It handles database interactions for Users, Groups, Topics, Sections, Questions, and Progress.
"""

from typing import TypeVar, Type, Any

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.database.models import (
    User, Group, UserGroup, Topic, Section, Question, Role, QuestionType, TestType
)
from src.utils.exceptions import NotFoundError, ConflictError, ValidationError

T = TypeVar("T")

logger = configure_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_item(session: AsyncSession, model: Type[T], item_id: int) -> T:
    """
    Retrieves an item by ID from the database.

    Args:
        session (AsyncSession): Database session.
        model (Type[T]): SQLAlchemy model class.
        item_id (int): ID of the item to retrieve.

    Returns:
        T: The retrieved item.

    Exceptions:
        - NotFoundError: If the item is not found.
    """
    result = await session.get(model, item_id)
    if not result:
        raise NotFoundError(resource_type=model.__name__, resource_id=item_id)
    return result


async def create_item(session: AsyncSession, model: Type[T], **kwargs) -> T:
    """
    Creates a new item in the database.

    Args:
        session (AsyncSession): Database session.
        model (Type[T]): SQLAlchemy model class.
        **kwargs: Attributes for the new item.

    Returns:
        T: The created item.

    Exceptions:
        - ConflictError: If the item violates unique constraints.
    """
    try:
        item = model(**kwargs)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        logger.info(f"Created {model.__name__} with ID {item.id}")
        return item
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to create {model.__name__}: {str(e)}")
        raise ConflictError(detail=str(e))


async def update_item(session: AsyncSession, model: Type[T], item_id: int, **kwargs) -> T:
    """
    Updates an existing item in the database.

    Args:
        session (AsyncSession): Database session.
        model (Type[T]): SQLAlchemy model class.
        item_id (int): ID of the item to update.
        **kwargs: Attributes to update.

    Returns:
        T: The updated item.

    Exceptions:
        - NotFoundError: If the item is not found.
    """
    item = await get_item(session, model, item_id)
    for key, value in kwargs.items():
        setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    logger.info(f"Updated {model.__name__} with ID {item_id}")
    return item


async def delete_item(session: AsyncSession, model: Type[T], item_id: int) -> None:
    """
    Deletes an item from the database.

    Args:
        session (AsyncSession): Database session.
        model (Type[T]): SQLAlchemy model class.
        item_id (int): ID of the item to delete.

    Exceptions:
        - NotFoundError: If the item is not found.
    """
    item = await get_item(session, model, item_id)
    await session.delete(item)
    await session.commit()
    logger.info(f"Deleted {model.__name__} with ID {item_id}")


async def create_user(session: AsyncSession, username: str, email: str, password: str, role: Role) -> User:
    """
    Creates a new user with hashed password.

    Args:
        session (AsyncSession): Database session.
        username (str): Unique username.
        email (str): Unique email.
        password (str): Plaintext password to hash.
        role (Role): User role (admin, teacher, student).

    Returns:
        User: The created user.

    Exceptions:
        - ConflictError: If username or email already exists.
    """
    hashed_password = pwd_context.hash(password)
    return await create_item(
        session,
        User,
        username=username,
        email=email,
        password=hashed_password,
        role=role
    )


async def get_user_by_username(session: AsyncSession, username: str) -> User:
    """
    Retrieves a user by username.

    Args:
        session (AsyncSession): Database session.
        username (str): Username to search for.

    Returns:
        User: The retrieved user.

    Exceptions:
        - NotFoundError: If the user is not found.
    """
    stmt = select(User).where(User.username == username)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(resource_type="User", resource_id=username)
    return user


async def add_user_to_group(session: AsyncSession, user_id: int, group_id: int) -> UserGroup:
    """
    Adds a user to a group.

    Args:
        session (AsyncSession): Database session.
        user_id (int): ID of the user.
        group_id (int): ID of the group.

    Returns:
        UserGroup: The created user-group association.

    Exceptions:
        - NotFoundError: If user or group is not found.
        - ConflictError: If user is already in the group.
    """
    await get_item(session, User, user_id)
    await get_item(session, Group, group_id)
    try:
        user_group = UserGroup(user_id=user_id, group_id=group_id)
        session.add(user_group)
        await session.commit()
        logger.info(f"Added user {user_id} to group {group_id}")
        return user_group
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to add user {user_id} to group {group_id}: {str(e)}")
        raise ConflictError(detail="User is already in the group")


async def create_group(session: AsyncSession, name: str, start_year: int, end_year: int,
                       description: str | None = None) -> Group:
    """
    Creates a new group.

    Args:
        session (AsyncSession): Database session.
        name (str): Group name.
        start_year (int): Year the group started.
        end_year (int): Year the group ends.
        description (str, optional): Group description.

    Returns:
        Group: The created group.

    Exceptions:
        - ConflictError: If group name already exists.
    """
    return await create_item(
        session,
        Group,
        name=name,
        start_year=start_year,
        end_year=end_year,
        description=description
    )


async def create_topic(session: AsyncSession, title: str, description: str | None = None, category: str | None = None,
                       image: str | None = None) -> Topic:
    """
    Creates a new topic.

    Args:
        session (AsyncSession): Database session.
        title (str): Topic title.
        description (str, optional): Topic description.
        category (str, optional): Topic category.
        image (str, optional): URL to topic image.

    Returns:
        Topic: The created topic.

    Exceptions:
        - ConflictError: If topic creation fails due to database constraints.
    """
    return await create_item(
        session,
        Topic,
        title=title,
        description=description,
        category=category,
        image=image
    )


async def create_section(session: AsyncSession, topic_id: int, title: str, content: str | None = None,
                         is_test: bool = False, test_type: TestType | None = None,
                         control_questions_percentage: int | None = None) -> Section:
    """
    Creates a new section.

    Args:
        session (AsyncSession): Database session.
        topic_id (int): ID of the parent topic.
        title (str): Section title.
        content (str, optional): Section content.
        is_test (bool): Whether the section is a test.
        test_type (TestType, optional): Type of test (hints or final).
        control_questions_percentage (int, optional): Percentage of control questions for final test.

    Returns:
        Section: The created section.

    Exceptions:
        - NotFoundError: If the topic is not found.
        - ValidationError: If test_type or control_questions_percentage is invalid.
        - ConflictError: If section creation fails due to database constraints.
    """
    await get_item(session, Topic, topic_id)
    if is_test and test_type is None:
        raise ValidationError(detail="Test type must be specified for test sections")
    if test_type == TestType.FINAL and (
            control_questions_percentage is None or control_questions_percentage < 0 or control_questions_percentage > 100):
        raise ValidationError(detail="Control questions percentage must be between 0 and 100 for final tests")
    return await create_item(
        session,
        Section,
        topic_id=topic_id,
        title=title,
        content=content,
        is_test=is_test,
        test_type=test_type,
        control_questions_percentage=control_questions_percentage
    )


async def create_question(
        session: AsyncSession,
        section_id: int,
        question: str,
        question_type: QuestionType,
        options: list | None = None,
        correct_answer: Any = None,
        hint: str | None = None,
        is_control: bool = False,
        image: str | None = None
) -> Question:
    """
    Creates a new question.

    Args:
        session (AsyncSession): Database session.
        section_id (int): ID of the parent section.
        question (str): Question text.
        question_type (QuestionType): Type of question (single_choice, multiple_choice, open_text).
        options (list, optional): List of answer options for choice questions.
        correct_answer (Any, optional): Correct answer (index for single, indices for multiple, text for open_text).
        hint (str, optional): Hint for the question.
        is_control (bool): Whether the question is a control question.
        image (str, optional): URL to question image.

    Returns:
        Question: The created question.

    Exceptions:
        - NotFoundError: If the section is not found.
        - ValidationError: If question_type, options, or correct_answer is invalid.
        - ConflictError: If question creation fails due to database constraints.
    """
    section = await get_item(session, Section, section_id)
    if not section.is_test:
        raise ValidationError(detail="Questions can only be added to test sections")
    if question_type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
        if not options or len(options) < 2:
            raise ValidationError(detail="Choice questions must have at least 2 options")
        if correct_answer is None:
            raise ValidationError(detail="Correct answer must be specified for choice questions")
    if is_control and hint:
        raise ValidationError(detail="Control questions cannot have hints")
    return await create_item(
        session,
        Question,
        section_id=section_id,
        question=question,
        question_type=question_type,
        options=options,
        correct_answer=correct_answer,
        hint=hint,
        is_control=is_control,
        image=image
    )
