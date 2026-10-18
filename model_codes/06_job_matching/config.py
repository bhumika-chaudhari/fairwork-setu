from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "jobs.csv"
WORKER_DATA_PATH = BASE_DIR / "data" / "raw" / "workers.csv"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 5

ARTIFACTS_DIR = BASE_DIR / "artifacts"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
EVALUATION_DIR = BASE_DIR / "evaluation"

MODEL_PATH = ARTIFACTS_DIR / "job_matcher"
METRICS_PATH = EVALUATION_DIR / "metrics.json"
