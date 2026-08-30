from pydantic import BaseSettings
from typing import List, Optional
import json


class Settings(BaseSettings):
    APP_NAME: str = "Pulse API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: Optional[str] = None  # For token encryption (set in production)

    DATABASE_URL: str = "sqlite:///./pulse.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS_ORIGINS can be set as JSON array string in env: '["https://a.com", "https://b.com"]'
    CORS_ORIGINS_JSON: str = '["http://localhost:3000"]'

    @property
    def CORS_ORIGINS(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS_JSON)
        except json.JSONDecodeError:
            return ["http://localhost:3000"]

    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    LINEAR_CLIENT_ID: Optional[str] = None
    LINEAR_CLIENT_SECRET: Optional[str] = None
    SLACK_CLIENT_ID: Optional[str] = None
    SLACK_CLIENT_SECRET: Optional[str] = None
    TRELLO_API_KEY: Optional[str] = None
    TRELLO_API_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()