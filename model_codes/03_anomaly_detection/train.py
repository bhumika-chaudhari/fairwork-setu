import json
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from config import (
    RAW_DATA_PATH, ARTIFACTS_DIR, PROCESSED_DIR,
    MODEL_PATH, PREPROCESSOR_PATH, FEATURES_PATH,
    TEST_DATA_PATH, CONTAMINATION, TEST_SIZE, RANDOM_STATE
)
from preprocessing import select_features, fit_preprocessor

def main():
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {RAW_DATA_PATH}"
        )

    df = pd.read_csv(RAW_DATA_PATH)
    X = select_features(df)

    if len(X) < 20:
        raise ValueError(
            "Too few transactions for a useful initial split. "
            "Review dataset size before training."
        )

    # Split first to prevent fitting preprocessing on held-out rows.
    train_raw, test_raw = train_test_split(
        X, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    imputer, train_values = fit_preprocessor(train_raw)
    test_values = imputer.transform(
        test_raw.replace([float("inf"), float("-inf")], float("nan"))
    )

    model = IsolationForest(
        n_estimators=200,
        contamination=CONTAMINATION,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )
    model.fit(train_values)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(imputer, PREPROCESSOR_PATH)
    FEATURES_PATH.write_text(
        json.dumps(train_raw.columns.tolist(), indent=2),
        encoding="utf-8"
    )

    test_output = test_raw.copy()
    test_output["anomaly_label"] = model.predict(test_values)
    test_output["anomaly_score"] = -model.decision_function(test_values)
    test_output.to_csv(TEST_DATA_PATH, index=False)

    print("Model saved:", MODEL_PATH)
    print("Preprocessor saved:", PREPROCESSOR_PATH)
    print("Training rows:", len(train_raw))
    print("Test rows:", len(test_raw))
    print("Predicted test anomalies:",
          int((test_output["anomaly_label"] == -1).sum()))

if __name__ == "__main__":
    main()
