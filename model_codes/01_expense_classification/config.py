from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "transactions.csv"
TARGET_COLUMN = "category"  # Change this to your dataset's actual label column

ARTIFACTS_DIR = BASE_DIR / "artifacts"
EVALUATION_DIR = BASE_DIR / "evaluation"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

MODEL_PATH = ARTIFACTS_DIR / "expense_classifier.joblib"
TEST_DATA_PATH = PROCESSED_DIR / "test_data.csv"
METRICS_PATH = EVALUATION_DIR / "metrics.json"
