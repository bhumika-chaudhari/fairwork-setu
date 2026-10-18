from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "income.csv"
DATE_COLUMN = "date"
TARGET_COLUMN = "income"
FREQUENCY = "D"
TEST_SIZE = 0.2
FORECAST_PERIODS = 7

ARTIFACTS_DIR = BASE_DIR / "artifacts"
EVALUATION_DIR = BASE_DIR / "evaluation"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODEL_PATH = ARTIFACTS_DIR / "income_forecaster.joblib"
HISTORY_PATH = ARTIFACTS_DIR / "income_history.csv"
TEST_DATA_PATH = PROCESSED_DIR / "test_data.csv"
METRICS_PATH = EVALUATION_DIR / "metrics.json"
