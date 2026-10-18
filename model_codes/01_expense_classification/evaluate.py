import json
import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    classification_report, confusion_matrix
)

from config import MODEL_PATH, TEST_DATA_PATH, METRICS_PATH, EVALUATION_DIR

def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model not found. Run train.py first.")
    if not TEST_DATA_PATH.exists():
        raise FileNotFoundError("Test data not found. Run train.py first.")

    model = joblib.load(MODEL_PATH)
    test_df = pd.read_csv(TEST_DATA_PATH)

    X_test = test_df["transaction_text"].fillna("").astype(str)
    y_test = test_df["actual_category"].astype(str)
    predictions = model.predict(X_test)

    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, predictions, average="weighted", zero_division=0
    )

    results = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1": float(f1),
        "classification_report": classification_report(
            y_test, predictions, zero_division=0, output_dict=True
        ),
        "confusion_matrix": confusion_matrix(
            y_test, predictions, labels=model.classes_
        ).tolist(),
        "class_labels": model.classes_.tolist()
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    with METRICS_PATH.open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n--- MODEL EVALUATION ---")
    print(f"Accuracy:  {results['accuracy']:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-score:  {f1:.4f}")
    print("\n", classification_report(y_test, predictions, zero_division=0))
    print(f"Metrics saved to: {METRICS_PATH}")

if __name__ == "__main__":
    main()
