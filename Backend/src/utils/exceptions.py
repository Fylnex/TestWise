# -*- coding: utf-8 -*-
"""
This module defines custom exceptions for the TestWise API.
These exceptions are used to handle common error scenarios with appropriate HTTP status codes and messages.
"""

from fastapi import HTTPException, status
from enum import Enum

class ErrorCode(str, Enum):
    """Enum for unique error codes."""
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    VALIDATION_ERROR = "VALIDATION_ERROR"

class APIException(HTTPException):
    """Base class for custom API exceptions."""
    def __init__(self,
                 status_code: int,
                 detail: str,
                 error_code: str,
                 headers: dict | None = None):
        """
        Initialize APIException with status code, detail, and error code.

        Args:
            status_code (int): HTTP status code.
            detail (str): Error message.
            error_code (str): Unique error code.
            headers (dict, optional): Optional headers.
        """
        super().__init__(status_code=status_code, headers=headers)
        self.detail = detail
        self.error_code = error_code

class NotFoundError(APIException):
    """Raised when a resource is not found."""
    def __init__(self,
                 resource_type: str,
                 resource_id: str | int = None,
                 details: str | None = None):
        """
        Initialize NotFoundError.

        Args:
            resource_type (str): Type of resource (e.g., "User", "Topic").
            resource_id (str or int, optional): ID of the resource.
            details (str, optional): Additional details about the error.
        """
        detail = f"{resource_type} not found"
        if resource_id:
            detail = f"{resource_type} with ID {resource_id} not found"
        if details:
            detail = f"{detail}: {details}"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code=ErrorCode.NOT_FOUND
        )

class ConflictError(APIException):
    """Raised when a resource already exists or conflicts."""
    def __init__(self,
                 detail: str):
        """
        Initialize ConflictError.

        Args:
            detail (str): Detailed error message.
        """
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code=ErrorCode.CONFLICT
        )

class PermissionDeniedError(APIException):
    """Raised when the user lacks sufficient permissions."""
    def __init__(self,
                 detail: str = "Insufficient permissions"):
        """
        Initialize PermissionDeniedError.

        Args:
            detail (str): Detailed error message (default: "Insufficient permissions").
        """
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code=ErrorCode.PERMISSION_DENIED
        )

class ValidationError(APIException):
    """Raised when input data is invalid."""
    def __init__(self,
                 detail: str):
        """
        Initialize ValidationError.

        Args:
            detail (str): Detailed error message.
        """
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code=ErrorCode.VALIDATION_ERROR
        )