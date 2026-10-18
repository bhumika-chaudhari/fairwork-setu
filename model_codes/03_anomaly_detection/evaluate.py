import json
import joblib
import pandas as pd
from sklearn.metrics import (
    classification_report, confusion_matrix
)
from config import (
    RAW_DATA_PATH, MODEL_PATH, PREPROCESSOR_PATH,
    FEATURES_PATH, TEST_DATA_PATH, METRICS_PATH,
    EVALUATION_DIR
)

def main():
    if not TEST_DATA_PATH.exists() or not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Run train.py after adding the transaction dataset."
        )

    test = pd.read_csv(TEST_DATA_PATH)
    predicted = test["anomaly_label"].astype(int)
    scores = test["anomaly_score"].astype(float)

    metrics = {
        "test_rows": int(len(test)),
        "predicted_anomalies": int((predicted == -1).sum()),
        "predicted_anomaly_rate": float((predicted == -1).mean()),
        "mean_anomaly_score": float(scores.mean()),
        "label_note": (
            "Isolation Forest labels: -1 = flagged anomaly, "
            "1 = not flagged. These are not verified ground-truth labels."
        )
    }

    # Optional supervised evaluation if the dataset has ground-truth labels.
    if RAW_DATA_PATH.exists():
        original = pd.read_csv(RAW_DATA_PATH)
        label_column = next(
            (c for c in ["is_anomaly", "label"] if c in original.columns),
            None
        )
        if label_column and len(original) == len(test):
            truth = original.loc[test.index, label_column]
            truth = pd.to_numeric(truth, errors="coerce")
            valid = truth.notna()
            if valid.any():
                truth_binary = truth[valid].astype(int)
                pred_binary = (predicted[valid] == -1).astype(int)
                metrics["classification_report"] = classification_report(
                    truth_binary, pred_binary,
                    output_dict=True, zero_division=0
                )
                metrics["confusion_matrix"] = confusion_matrix(
                    truth_binary, pred_binary
                ).tolist()

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(
        json.dumps(metrics, indent=2, default=str),
        encoding="utf-8"
    )
    print(json.dumps(metrics, indent=2, default=str))
    print("Metrics saved:", METRICS_PATH)

if __name__ == "__main__":
    main()
