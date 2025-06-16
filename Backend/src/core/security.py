# TestWise/Backend/src/core/security.py
# -*- coding: utf-8 -*-
"""
This module handles JWT authentication and role-based access control for the TestWise application.
It provides functions for creating and verifying JWT tokens and checking user roles.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status
from src.core.config import settings
from src.database.models import Role

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token for a user.

    Args:
        data (dict): Data to encode in the token (e.g., user ID, role).
        expires_delta (timedelta, optional): Token expiration time. Defaults to settings.access_token_expire_minutes.

    Returns:
        str: Encoded JWT token.

    Exceptions:
        - JWTError: If token creation fails.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """
    Verifies a JWT token and returns its payload.

    Args:
        token (str): JWT token to verify.

    Returns:
        dict: Decoded token payload.

    Exceptions:
        - HTTPException: If token is invalid or expired (401).
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

def restrict_to_roles(allowed_roles: list[Role]) -> callable:
    """
    Decorator to restrict access to specific roles.

    Args:
        allowed_roles (list[Role]): List of allowed roles for the endpoint.

    Returns:
        callable: FastAPI dependency function.

    Exceptions:
        - HTTPException: If user role is not in allowed_roles (403).
    """
    def check_role(token: str) -> dict:
        payload = verify_token(token)
        if Role(payload.get("role")) not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return payload
    return check_role