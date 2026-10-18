"""
Database Connection and Session Engine for FairWork Setu.
Supports:
- Remote Supabase PostgreSQL (via DATABASE_URL)
- Fallback Local SQLite for development and offline testing (when DATABASE_URL is unset)
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("setu.database")

# Read DATABASE_URL from environment
RAW_DB_URL = os.getenv("DATABASE_URL", "").strip()

if RAW_DB_URL:
    # Handle Render / Supabase 'postgres://' -> 'postgresql://' compatibility
    if RAW_DB_URL.startswith("postgres://"):
        DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)
    else:
        DB_URL = RAW_DB_URL
    
    # Supabase Transaction pooler or direct connection
    engine = create_engine(
        DB_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    logger.info("Database engine initialized with PostgreSQL (Supabase/Remote).")
else:
    # Local SQLite fallback so the service never crashes during dev or when DB is not yet provisioned
    DB_PATH = os.path.join(os.path.dirname(__file__), "setu_dev.db")
    DB_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        DB_URL,
        connect_args={"check_same_thread": False}
    )
    logger.info(f"DATABASE_URL not set. Using local SQLite fallback at: {DB_PATH}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all tables defined in Base metadata."""
    try:
        import db_models  # Ensure models are registered with Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
