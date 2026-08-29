# Patch SQLAlchemy to prevent psycopg dialect loading before any SQLAlchemy imports
import sys
import sqlalchemy.dialects.postgresql

# Remove psycopg dialect modules from sys.modules before they can be imported
for mod in ['sqlalchemy.dialects.postgresql.psycopg', 'sqlalchemy.dialects.postgresql.psycopg_async']:
    if mod in sys.modules:
        del sys.modules[mod]

# Remove from parent module's __dict__ to prevent lazy loading
for attr in ['psycopg', 'psycopg_async']:
    if hasattr(sqlalchemy.dialects.postgresql, attr):
        delattr(sqlalchemy.dialects.postgresql, attr)

# Patch the dialect registry to remove psycopg entries
try:
    from sqlalchemy.dialects import registry
    if hasattr(registry, '_impls'):
        keys_to_remove = [k for k in registry._impls.keys() if 'psycopg' in k and 'psycopg2' not in k]
        for k in keys_to_remove:
            del registry._impls[k]
except Exception:
    pass

# Patch the registry.load method to handle psycopg -> psycopg2 mapping
from sqlalchemy.dialects import registry
original_load = registry.load

def patched_load(name):
    if name == 'postgresql.psycopg':
        return original_load('postgresql.psycopg2')
    return original_load(name)

registry.load = patched_load

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Handle SQLite-specific connect args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# For compatibility with async code
AsyncSessionLocal = SessionLocal


def init_db():
    Base.metadata.create_all(bind=engine)