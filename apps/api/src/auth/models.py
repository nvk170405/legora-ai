"""
Legora AI — Auth Models.

User model with roles for RBAC.
"""

import enum
import uuid

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import BaseModel, TenantMixin


class Role(str, enum.Enum):
    """User roles for RBAC."""

    ADMIN = "admin"
    REVIEWER = "reviewer"
    AUDITOR = "auditor"
    VIEWER = "viewer"


class User(BaseModel, TenantMixin):
    """Application user with role-based access."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.VIEWER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
