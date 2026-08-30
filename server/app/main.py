from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, clients, drafts
from app.core.database import Base, engine
from app import models  # Import models to register tables with Base.metadata

# Create tables on startup (for SQLite/dev) - use sync engine for metadata creation
Base.metadata.create_all(bind=engine.sync_engine)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(clients.router, prefix=f"{settings.API_V1_PREFIX}/clients", tags=["clients"])
app.include_router(drafts.router, prefix=f"{settings.API_V1_PREFIX}", tags=["drafts"])


@app.get("/health")
def health_check():
    """Health check endpoint for Render/load balancer."""
    return {
        "status": "healthy",
        "service": "pulse-api",
        "version": "1.0.0"
    }


@app.get("/")
def root():
    return {
        "service": "Pulse API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }