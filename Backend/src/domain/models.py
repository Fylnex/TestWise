# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/domain/models.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Defining SQLAlchemy models for the TestWise backend.

This module introduces a rich learning hierarchy with progress tracking and
assessment definitions, including entities like Subsection, Test, GroupStudents,
and TestAttempt, with legacy fields removed or renamed for clarity.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import declarative_base, relationship

from src.domain.enums import Role, GroupStudentStatus, SubsectionType, TestType, QuestionType, ProgressStatus

Base = declarative_base()


# ---------------------------------------------------------------------------
# Core domain models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)
    refresh_token = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False)

    # Relationships
    group_students = relationship("GroupStudents", back_populates="user", cascade="all, delete-orphan")
    topic_progress = relationship("TopicProgress", back_populates="user", cascade="all, delete-orphan")
    section_progress = relationship("SectionProgress", back_populates="user", cascade="all, delete-orphan")
    subsection_progress = relationship("SubsectionProgress", back_populates="user", cascade="all, delete-orphan")
    test_attempts = relationship("TestAttempt", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User(username={self.username!r}, role={self.role})>"


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    start_year = Column(Integer, nullable=False, index=True)
    end_year = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    students = relationship("GroupStudents", back_populates="group", cascade="all, delete-orphan")
    teachers = relationship("GroupTeachers", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Group(name={self.name!r})>"


class GroupStudents(Base):
    """Join table between groups and users with membership metadata."""
    __tablename__ = "group_students"

    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    status = Column(Enum(GroupStudentStatus), default=GroupStudentStatus.ACTIVE, nullable=False)
    joined_at = Column(DateTime, default=datetime.now)
    left_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="group_students")
    group = relationship("Group", back_populates="students")


class GroupTeachers(Base):
    """Join table between groups and teachers with membership metadata."""
    __tablename__ = "group_teachers"

    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime, default=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="group_teachers")
    group = relationship("Group", back_populates="teachers")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    sections = relationship("Section", back_populates="topic", cascade="all, delete-orphan")
    global_tests = relationship("Test", back_populates="topic", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Topic(title={self.title!r}, is_archived={self.is_archived})>"


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    description = Column(String, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    topic = relationship("Topic", back_populates="sections")
    subsections = relationship("Subsection", back_populates="section", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="section", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="section", cascade="all, delete-orphan")
    progress = relationship("SectionProgress", back_populates="section", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Section(title={self.title!r}, topic_id={self.topic_id})>"


class Subsection(Base):
    __tablename__ = "subsections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    type = Column(Enum(SubsectionType), default=SubsectionType.TEXT, nullable=False)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    section = relationship("Section", back_populates="subsections")
    progress = relationship("SubsectionProgress", back_populates="subsection", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Subsection(title={self.title!r}, section_id={self.section_id})>"


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    duration = Column(Integer, nullable=True)  # duration in minutes
    question_ids = Column(JSON, nullable=True)  # cached list of question IDs for faster retrieval
    type = Column(Enum(TestType), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    section = relationship("Section", back_populates="tests")
    topic = relationship("Topic", back_populates="global_tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Test(title={self.title!r}, type={self.type}, is_archived={self.is_archived})>"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=True, index=True)
    question = Column(String, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(JSON, nullable=True)  # single / multiple choice options
    correct_answer = Column(JSON, nullable=True)  # format depends on question_type
    hint = Column(String, nullable=True)
    is_final = Column(Boolean, default=False)  # marks if question appears in a final test
    image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)

    # Relationships
    section = relationship("Section", back_populates="questions")
    test = relationship("Test", back_populates="questions")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Question(id={self.id}, section_id={self.section_id})>"


# ---------------------------------------------------------------------------
# Progress tracking models
# ---------------------------------------------------------------------------

class TopicProgress(Base):
    __tablename__ = "topic_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    status = Column(Enum(ProgressStatus), default=ProgressStatus.STARTED, nullable=False)
    completion_percentage = Column(Float, default=0.0)
    last_accessed = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="topic_progress")
    topic = relationship("Topic", back_populates="progress")


class SectionProgress(Base):
    __tablename__ = "section_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    status = Column(Enum(ProgressStatus), default=ProgressStatus.STARTED, nullable=False)
    completion_percentage = Column(Float, default=0.0)
    last_accessed = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="section_progress")
    section = relationship("Section", back_populates="progress")


class SubsectionProgress(Base):
    __tablename__ = "subsection_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subsection_id = Column(Integer, ForeignKey("subsections.id"), nullable=False, index=True)
    is_viewed = Column(Boolean, default=False)
    viewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="subsection_progress")
    subsection = relationship("Subsection", back_populates="progress")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    score = Column(Float, nullable=True)
    time_spent = Column(Integer, nullable=True)  # seconds
    answers = Column(JSON, nullable=True)  # raw submitted answers
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="test_attempts")
    test = relationship("Test", back_populates="attempts")
