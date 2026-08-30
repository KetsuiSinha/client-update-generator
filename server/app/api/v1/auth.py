from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import httpx
import secrets

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)
from app.core.encryption import encrypt_token, decrypt_token
from app.models import User, Integration
from app.schemas import UserCreate, UserOut, Token, IntegrationProvider, IntegrationCreate
from app.schemas.user import UserLogin
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    user_in: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == user_in.email))
    user = existing.scalar_one_or_none()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": new_refresh, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
):
    return current_user


# =============================================================================
# GITHUB OAUTH ROUTES
# =============================================================================

GITHUB_OAUTH_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_USER_URL = "https://api.github.com/user"
GITHUB_API_INSTALLATIONS_URL = "https://api.github.com/user/installations"


@router.get("/github")
async def github_oauth_redirect():
    """Redirect user to GitHub OAuth authorization page."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    state = secrets.token_urlsafe(32)
    # Store state in session/redis for CSRF protection (simplified for MVP)
    scopes = "repo read:user read:org user:email"

    auth_url = (
        f"{GITHUB_OAUTH_AUTHORIZE_URL}"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.API_V1_PREFIX}/auth/github/callback"
        f"&scope={scopes}"
        f"&state={state}"
        f"&allow_signup=true"
    )
    return RedirectResponse(url=auth_url)


@router.get("/github/callback")
async def github_oauth_callback(
    request: Request,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle GitHub OAuth callback - exchange code for token and store integration."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_OAUTH_TOKEN_URL,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": f"{settings.API_V1_PREFIX}/auth/github/callback",
            },
            headers={"Accept": "application/json"},
        )

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    token_data = token_response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")  # GitHub doesn't typically return refresh tokens
    token_type = token_data.get("token_type", "bearer")
    scope = token_data.get("scope", "")

    if not access_token:
        raise HTTPException(status_code=400, detail="No access token received from GitHub")

    # Get user info from GitHub
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            GITHUB_API_USER_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )

    if user_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch GitHub user info")

    github_user = user_response.json()
    github_user_id = github_user.get("id")
    github_login = github_user.get("login")

    # Get installations (repos/orgs the token has access to)
    async with httpx.AsyncClient() as client:
        installations_response = await client.get(
            GITHUB_API_INSTALLATIONS_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )

    installations = []
    if installations_response.status_code == 200:
        installations = installations_response.json().get("installations", [])

    # For MVP: create or update user based on GitHub email (simplified)
    # In production, you'd link this to an existing user session
    # For now, we'll create a user if one doesn't exist with this email
    emails_response = await httpx.AsyncClient().get(
        "https://api.github.com/user/emails",
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
    )
    primary_email = None
    if emails_response.status_code == 200:
        for email in emails_response.json():
            if email.get("primary") and email.get("verified"):
                primary_email = email.get("email")
                break

    if not primary_email:
        primary_email = f"{github_login}@github.local"

    # Find or create user
    result = await db.execute(select(User).where(User.email == primary_email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=primary_email,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # random password
            full_name=github_user.get("name") or github_login,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Store/update GitHub integration
    result = await db.execute(
        select(Integration).where(
            Integration.user_id == user.id,
            Integration.provider == "github"
        )
    )
    integration = result.scalar_one_or_none()

    if integration:
        integration.access_token_encrypted = encrypt_token(access_token)
        if refresh_token:
            integration.refresh_token_encrypted = encrypt_token(refresh_token)
        integration.scope_config = scope
        integration.is_active = True
        integration.last_sync = datetime.utcnow()
    else:
        integration = Integration(
            user_id=user.id,
            provider="github",
            access_token_encrypted=encrypt_token(access_token),
            refresh_token_encrypted=encrypt_token(refresh_token) if refresh_token else None,
            scope_config=scope,
            is_active=True,
            last_sync=datetime.utcnow(),
        )
        db.add(integration)

    await db.commit()
    await db.refresh(integration)

    # Redirect to frontend dashboard with success
    frontend_url = "http://localhost:3000"
    return RedirectResponse(url=f"{frontend_url}/dashboard?github_connected=true")


@router.post("/github/disconnect")
async def github_disconnect(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect GitHub integration."""
    result = await db.execute(
        select(Integration).where(
            Integration.user_id == current_user.id,
            Integration.provider == "github"
        )
    )
    integration = result.scalar_one_or_none()
    if integration:
        integration.is_active = False
        integration.access_token_encrypted = ""
        if integration.refresh_token_encrypted:
            integration.refresh_token_encrypted = ""
        await db.commit()
    return {"message": "GitHub integration disconnected"}