from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Convert database URL to async version if needed
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("sqlite://") and not database_url.startswith("sqlite+aiosqlite://"):
    database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def init_db():
    # This is for sync metadata creation, but we'll use async in practice
    # For now, we can keep it as is or create a separate async init
    Base.metadata.create_all(bind=engine.sync_engine)