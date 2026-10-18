from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "transactions.csv"

EXCLUDED_COLUMNS = [
    "transaction_id", "user_id", "customer_id",
    "label", "is_anomaly", "category"
]

CONTAMINATION = 0.05
TEST_SIZE = 0.2
RANDOM_STATE = 42

ARTIFACTS_DIR = BASE_DIR / "artifacts"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
EVALUATION_DIR = BASE_DIR / "evaluation"

MODEL_PATH = ARTIFACTS_DIR / "anomaly_detector.joblib"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "imputer.joblib"
FEATURES_PATH = ARTIFACTS_DIR / "feature_columns.json"
TEST_DATA_PATH = PROCESSED_DIR / "test_data.csv"
METRICS_PATH = EVALUATION_DIR / "metrics.json"
