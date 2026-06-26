"""
Legora AI — Auth Schemas.

Pydantic models for auth request/response validation.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from src.auth.models import Role


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role: Role = Role.VIEWER


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user in API responses."""

    id: uuid.UUID
    email: str
    full_name: str
    role: Role
    is_active: bool
    avatar_url: str | None = None
    tenant_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
