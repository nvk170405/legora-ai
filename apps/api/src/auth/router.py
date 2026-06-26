"""
Legora AI — Auth Router.

Endpoints for user registration, login, and profile retrieval.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUser
from src.auth.schemas import TokenResponse, UserCreate, UserLogin, UserResponse
from src.auth.service import authenticate_user, create_access_token, create_user
from src.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new user and return an access token."""
    user = await create_user(db, data)
    token = create_access_token(str(user.id), str(user.tenant_id))
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate a user and return an access token."""
    user = await authenticate_user(db, data.email, data.password)
    token = create_access_token(str(user.id), str(user.tenant_id))
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    """Get the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)
