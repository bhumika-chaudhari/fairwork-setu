from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
EVALUATION_DIR = BASE_DIR / "evaluation"

WORKER_DATA_PATH = RAW_DATA_DIR / "workers.csv"
COURSE_DATA_PATH = RAW_DATA_DIR / "courses.csv"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 5

SKILL_COLUMN = "skills"
