"""
Database Connection and Session Engine for FairWork Setu.
Supports:
- Remote Supabase / PostgreSQL (via DATABASE_URL with psycopg or psycopg2)
- Fallback Local SQLite for development and offline testing (when DATABASE_URL is unset or unreachable)
- Safe fallback when SQLAlchemy is not installed in local environments
"""

import sys
import os
import logging

# Ensure ml_service directory is on sys.path for direct module resolution
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if _CURRENT_DIR not in sys.path:
    sys.path.insert(0, _CURRENT_DIR)

logger = logging.getLogger("setu.database")

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import declarative_base, sessionmaker
    HAS_SQLALCHEMY = True
except ImportError:
    create_engine = None
    declarative_base = None
    sessionmaker = None
    HAS_SQLALCHEMY = False
    logger.warning("SQLAlchemy is not installed in current Python environment. Running in lightweight mock DB mode.")

# Read DATABASE_URL from environment
RAW_DB_URL = os.getenv("DATABASE_URL", "").strip()

engine = None

if HAS_SQLALCHEMY and create_engine is not None:
    if RAW_DB_URL:
        # Handle Render / Supabase 'postgres://' -> 'postgresql://' compatibility
        if RAW_DB_URL.startswith("postgres://"):
            DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)
        else:
            DB_URL = RAW_DB_URL

        try:
            # Attempt primary engine creation (supports psycopg v3 or explicit driver)
            engine = create_engine(
                DB_URL,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
            logger.info("Database engine initialized with PostgreSQL (Supabase/Remote).")
        except Exception as e:
            logger.warning(f"Failed to initialize PostgreSQL engine with primary URL: {e}. Attempting fallback driver...")
            # If no explicit driver was specified in URL, try explicit psycopg2 driver
            if DB_URL.startswith("postgresql://") and "+" not in DB_URL.split("://")[0]:
                try:
                    alt_url = DB_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
                    engine = create_engine(
                        alt_url,
                        pool_pre_ping=True,
                        pool_size=10,
                        max_overflow=20
                    )
                    logger.info("Database engine initialized with postgresql+psycopg2 driver.")
                except Exception as e2:
                    logger.warning(f"Alternative driver also failed: {e2}. Falling back to SQLite.")

    if engine is None:
        # Local SQLite fallback so the service never crashes during dev or when DB is not yet provisioned
        DB_PATH = os.path.join(os.path.dirname(__file__), "setu_dev.db")
        DB_URL = f"sqlite:///{DB_PATH}"
        try:
            engine = create_engine(
                DB_URL,
                connect_args={"check_same_thread": False}
            )
            logger.info(f"DATABASE_URL not active. Using local SQLite fallback at: {DB_PATH}")
        except Exception as e:
            logger.warning(f"Could not initialize SQLite engine: {e}")

if HAS_SQLALCHEMY and sessionmaker is not None and engine is not None:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    SessionLocal = None

if HAS_SQLALCHEMY and declarative_base is not None:
    Base = declarative_base()
else:
    class Base:
        metadata = None
        def __init__(self, *args, **kwargs):
            pass


def get_db():
    """FastAPI Dependency for database session management."""
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all tables defined in Base metadata."""
    if not HAS_SQLALCHEMY or engine is None or Base is None or getattr(Base, "metadata", None) is None:
        logger.info("Database engine not active or SQLAlchemy not installed. Skipping init_db.")
        return

    try:
        try:
            import db_models
        except ImportError:
            from ml_service import db_models
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
