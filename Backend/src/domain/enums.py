# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/domain/enums.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Defining enumeration classes for the TestWise domain.

This module contains all enum definitions used across the application, such as
roles, question types, test types, and progress statuses.
"""

import enum


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
    HINTED = "hinted"  # Tests with hints enabled
    SECTION_FINAL = "section_final"  # Final test for a single section
    GLOBAL_FINAL = "global_final"  # Cumulative test for an entire topic


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
