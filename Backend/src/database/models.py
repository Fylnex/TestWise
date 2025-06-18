# TestWise/Backend/src/database/models.py
# -*- coding: utf-8 -*-
"""
SQLAlchemy models for the refactored TestWise backend.

This version introduces a richer learning hierarchy with explicit progress
tracking and flexible assessment definitions. New entities include
Subsection, Test, GroupStudents, TopicProgress, SectionProgress,
SubsectionProgress, and TestAttempt. Legacy fields related to the old test
workflow have been removed or renamed for clarity.
"""

import enum
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

Base = declarative_base()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class Role(str, enum.Enum):
    """Roles available in the system."""

    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class QuestionType(str, enum.Enum):
    """Supported types of questions."""

    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    OPEN_TEXT = "open_text"


class TestType(str, enum.Enum):
    """Types of tests delivered to students."""

    HINTED = "hinted"  # tests with hints enabled
    SECTION_FINAL = "section_final"  # final test for a single section
    GLOBAL_FINAL = "global_final"  # cumulative test for an entire topic


class SubsectionType(str, enum.Enum):
    """Content delivery formats for subsections."""

    TEXT = "text"
    VIDEO = "video"
    PDF = "pdf"


class ProgressStatus(str, enum.Enum):
    """Lifecycle states for topic/section progression."""

    STARTED = "started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class GroupStudentStatus(str, enum.Enum):
    """Membership states within a group."""

    ACTIVE = "active"
    INACTIVE = "inactive"


# ---------------------------------------------------------------------------
# Core domain models
# ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)
    refresh_token = Column(String, nullable=True)

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

    # Relationships
    students = relationship("GroupStudents", back_populates="group", cascade="all, delete-orphan")

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

    # Relationships
    user = relationship("User", back_populates="group_students")
    group = relationship("Group", back_populates="students")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)

    # Relationships
    sections = relationship("Section", back_populates="topic", cascade="all, delete-orphan")
    global_tests = relationship("Test", back_populates="topic", cascade="all, delete-orphan")
    progress = relationship("TopicProgress", back_populates="topic", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Topic(title={self.title!r})>"


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

    # Relationships
    section = relationship("Section", back_populates="tests")
    topic = relationship("Topic", back_populates="global_tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Test(title={self.title!r}, type={self.type})>"


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
