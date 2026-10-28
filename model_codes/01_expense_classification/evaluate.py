import json
import joblib
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    classification_report, confusion_matrix
)

from config import MODEL_PATH, TEST_DATA_PATH, METRICS_PATH, EVALUATION_DIR, RAW_DATA_PATH, TARGET_COLUMN
from preprocessing import clean_dataset


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
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(
        y_test, predictions, average="macro", zero_division=0
    )

    acc = float(accuracy_score(y_test, predictions))

    # Compute 5-Fold Stratified Cross-Validation on Full Dataset
    df_raw = pd.read_csv(RAW_DATA_PATH)
    X_full, y_full = clean_dataset(df_raw, TARGET_COLUMN)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_f1_scores = cross_val_score(model, X_full, y_full, cv=skf, scoring="f1_weighted")
    cv_acc_scores = cross_val_score(model, X_full, y_full, cv=skf, scoring="accuracy")

    # Historical Baseline Reference (Single Logistic Regression)
    baseline_acc = 0.7500
    baseline_f1 = 0.7361

    results = {
        "model_architecture": "Tri-Model Stacking Classifier (Model 1)",
        "base_models": ["LogisticRegression (Linear Margin)", "CalibratedLinearSVC (Support Vector)", "ComplementNB (Imbalance Specialist)"],
        "meta_learner": "LogisticRegression (Probability Distribution Blender)",
        "accuracy": acc,
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1": float(f1),
        "macro_f1": float(macro_f1),
        "cv_5fold_f1_mean": round(float(cv_f1_scores.mean()), 4),
        "cv_5fold_f1_std": round(float(cv_f1_scores.std()), 4),
        "cv_5fold_accuracy_mean": round(float(cv_acc_scores.mean()), 4),
        "baseline_comparison": {
            "baseline_accuracy": baseline_acc,
            "baseline_weighted_f1": baseline_f1,
            "absolute_accuracy_gain": round(acc - baseline_acc, 4),
            "relative_accuracy_gain_pct": f"+{((acc - baseline_acc) / baseline_acc) * 100:.2f}%",
            "absolute_f1_gain": round(f1 - baseline_f1, 4),
            "relative_f1_gain_pct": f"+{((f1 - baseline_f1) / baseline_f1) * 100:.2f}%"
        },
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

    print("\n" + "=" * 65)
    print("       MODEL 1 STACKING ENSEMBLE EVALUATION REPORT")
    print("=" * 65)
    print(f"Holdout Test Accuracy: {results['accuracy'] * 100:.2f}%  (Baseline: 75.00% -> {results['baseline_comparison']['relative_accuracy_gain_pct']})")
    print(f"Holdout Weighted F1:   {results['weighted_f1']:.4f}  (Baseline: 0.7361 -> {results['baseline_comparison']['relative_f1_gain_pct']})")
    print(f"5-Fold CV Accuracy:    {results['cv_5fold_accuracy_mean'] * 100:.2f}% (±{results['cv_5fold_f1_std']:.4f})")
    print(f"5-Fold CV Weighted F1: {results['cv_5fold_f1_mean']:.4f}")
    print("-" * 65)
    print(classification_report(y_test, predictions, zero_division=0))
    print(f"Metrics saved to: {METRICS_PATH}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
