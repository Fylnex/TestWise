# TestWise/Backend/src/database/models.py
# -*- coding: utf-8 -*-
"""
This module defines SQLAlchemy models for the TestWise application.
It includes tables for Users, Groups, UserGroups, Topics, Sections, Questions, and Progress.
"""

import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Role(str, enum.Enum):
    """Enum for user roles."""
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class QuestionType(str, enum.Enum):
    """Enum for question types."""
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    OPEN_TEXT = "open_text"


class TestType(str, enum.Enum):
    """Enum for test types."""
    HINTS = "hints"
    FINAL = "final"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    groups = relationship("UserGroup", back_populates="user")
    progress = relationship("Progress", back_populates="user")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    start_year = Column(Integer, nullable=False, index=True)
    end_year = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("UserGroup", back_populates="group")


class UserGroup(Base):
    __tablename__ = "user_groups"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="groups")
    group = relationship("Group", back_populates="users")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)

    sections = relationship("Section", back_populates="topic")
    progress = relationship("Progress", back_populates="topic")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    is_test = Column(Boolean, default=False)
    test_type = Column(Enum(TestType), nullable=True)
    control_questions_percentage = Column(Integer, nullable=True)  # Percentage for final test control questions
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)

    topic = relationship("Topic", back_populates="sections")
    questions = relationship("Question", back_populates="section")
    progress = relationship("Progress", back_populates="section")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    question = Column(String, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(JSON, nullable=True)  # For single/multiple choice
    correct_answer = Column(JSON, nullable=True)  # Index for single, indices for multiple, text for open_text
    hint = Column(String, nullable=True)
    is_control = Column(Boolean, default=False)  # Control question for final tests
    image = Column(String, nullable=True)  # URL to question image
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)

    section = relationship("Section", back_populates="questions")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    completed = Column(Boolean, default=False)
    score = Column(Float, nullable=True)
    attempts = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    time_spent = Column(Integer, nullable=True)  # Seconds spent on section/test

    user = relationship("User", back_populates="progress")
    topic = relationship("Topic", back_populates="progress")
    section = relationship("Section", back_populates="progress")
