"""
Hyperparameter Optimization & Model Selection for Model 1 (Expense Classifier)
Evaluates and compares:
1. Baseline Single Model (Default Logistic Regression + TF-IDF)
2. Tuned Single Model (Grid-searched Logistic Regression + TF-IDF)
3. Soft-Voting Ensemble (Logistic Regression + Calibrated LinearSVC + ComplementNB)
4. Stacking Classifier Ensemble (Meta-Learner on LR + Calibrated LinearSVC + ComplementNB)
"""

import json
from pathlib import Path
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import ComplementNB
from sklearn.ensemble import VotingClassifier, StackingClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from config import RAW_DATA_PATH, TARGET_COLUMN, EVALUATION_DIR
from preprocessing import clean_dataset


def run_optimization():
    print("=" * 70)
    print("🚀 MODEL 1: EXPENSE CLASSIFICATION HYPERPARAMETER OPTIMIZATION & SELECTION")
    print("=" * 70 + "\n")

    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_DATA_PATH}")

    df = pd.read_csv(RAW_DATA_PATH)
    X, y = clean_dataset(df, TARGET_COLUMN)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # -------------------------------------------------------------------------
    # 1. BASELINE SINGLE MODEL
    # -------------------------------------------------------------------------
    print("Evaluating 1. Baseline Single Model (Default Logistic Regression)...")
    baseline_pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=30000, sublinear_tf=True)),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
    ])
    baseline_cv_f1 = cross_val_score(baseline_pipe, X_train, y_train, cv=skf, scoring="f1_weighted").mean()
    baseline_pipe.fit(X_train, y_train)
    baseline_preds = baseline_pipe.predict(X_test)
    base_prec, base_rec, base_f1, _ = precision_recall_fscore_support(y_test, baseline_preds, average="weighted", zero_division=0)
    base_acc = accuracy_score(y_test, baseline_preds)

    print(f"   -> 5-Fold CV F1: {baseline_cv_f1:.4f} | Holdout Acc: {base_acc:.4f} | Holdout F1: {base_f1:.4f}\n")

    # -------------------------------------------------------------------------
    # 2. HYPERPARAMETER GRID SEARCH ON VECTORIZER & REGULARIZATION
    # -------------------------------------------------------------------------
    print("Running 2. Hyperparameter Grid Search (TF-IDF N-grams & C Regularization)...")
    param_grid = {
        "tfidf__ngram_range": [(1, 1), (1, 2)],
        "tfidf__sublinear_tf": [True, False],
        "classifier__C": [0.5, 1.0, 2.0, 5.0]
    }
    grid_search = GridSearchCV(
        Pipeline([
            ("tfidf", TfidfVectorizer(lowercase=True)),
            ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
        ]),
        param_grid,
        cv=skf,
        scoring="f1_weighted",
        n_jobs=-1
    )
    grid_search.fit(X_train, y_train)
    best_tuned_single = grid_search.best_estimator_
    tuned_cv_f1 = grid_search.best_score_
    tuned_preds = best_tuned_single.predict(X_test)
    tuned_prec, tuned_rec, tuned_f1, _ = precision_recall_fscore_support(y_test, tuned_preds, average="weighted", zero_division=0)
    tuned_acc = accuracy_score(y_test, tuned_preds)

    print(f"   -> Best Params: {grid_search.best_params_}")
    print(f"   -> 5-Fold CV F1: {tuned_cv_f1:.4f} | Holdout Acc: {tuned_acc:.4f} | Holdout F1: {tuned_f1:.4f}\n")

    # -------------------------------------------------------------------------
    # 3. SOFT-VOTING ENSEMBLE
    # -------------------------------------------------------------------------
    print("Evaluating 3. Tri-Model Soft-Voting Ensemble (LR + LinearSVC + ComplementNB)...")
    voting_pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 1), sublinear_tf=True, lowercase=True)),
        ("ensemble", VotingClassifier(
            estimators=[
                ("lr", LogisticRegression(C=1.2, class_weight="balanced", max_iter=1000, random_state=42)),
                ("svc", CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42))),
                ("cnb", ComplementNB(alpha=0.3))
            ],
            voting="soft",
            weights=[1.5, 1.5, 1.0]
        ))
    ])
    voting_cv_f1 = cross_val_score(voting_pipe, X_train, y_train, cv=skf, scoring="f1_weighted").mean()
    voting_cv_acc = cross_val_score(voting_pipe, X_train, y_train, cv=skf, scoring="accuracy").mean()
    voting_pipe.fit(X_train, y_train)
    voting_preds = voting_pipe.predict(X_test)
    vote_prec, vote_rec, vote_f1, _ = precision_recall_fscore_support(y_test, voting_preds, average="weighted", zero_division=0)
    vote_acc = accuracy_score(y_test, voting_preds)

    print(f"   -> 5-Fold CV F1: {voting_cv_f1:.4f} | Holdout Acc: {vote_acc:.4f} | Holdout F1: {vote_f1:.4f}\n")

    # -------------------------------------------------------------------------
    # 4. STACKING CLASSIFIER ENSEMBLE (META-LEARNER)
    # -------------------------------------------------------------------------
    print("Evaluating 4. Tri-Model Stacking Ensemble (Meta-Learner on Base Probability Distributions)...")
    stacking_pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 1), sublinear_tf=True, lowercase=True)),
        ("ensemble", StackingClassifier(
            estimators=[
                ("lr", LogisticRegression(C=1.2, class_weight="balanced", max_iter=1000, random_state=42)),
                ("svc", CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42))),
                ("cnb", ComplementNB(alpha=0.3))
            ],
            final_estimator=LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
            cv=5
        ))
    ])
    stacking_cv_f1 = cross_val_score(stacking_pipe, X_train, y_train, cv=skf, scoring="f1_weighted").mean()
    stacking_cv_acc = cross_val_score(stacking_pipe, X_train, y_train, cv=skf, scoring="accuracy").mean()
    stacking_pipe.fit(X_train, y_train)
    stacking_preds = stacking_pipe.predict(X_test)
    stack_prec, stack_rec, stack_f1, _ = precision_recall_fscore_support(y_test, stacking_preds, average="weighted", zero_division=0)
    stack_acc = accuracy_score(y_test, stacking_preds)

    print(f"   -> 5-Fold CV F1: {stacking_cv_f1:.4f} | Holdout Acc: {stack_acc:.4f} | Holdout F1: {stack_f1:.4f}\n")

    # -------------------------------------------------------------------------
    # COMPARATIVE SUMMARY
    # -------------------------------------------------------------------------
    results = {
        "baseline_single_model": {
            "name": "Default Logistic Regression (Baseline)",
            "cv_5fold_f1": round(float(baseline_cv_f1), 4),
            "holdout_accuracy": round(float(base_acc), 4),
            "holdout_weighted_f1": round(float(base_f1), 4),
            "holdout_weighted_precision": round(float(base_prec), 4),
            "holdout_weighted_recall": round(float(base_rec), 4)
        },
        "tuned_single_model": {
            "name": "Grid-Searched Tuned Logistic Regression",
            "best_params": grid_search.best_params_,
            "cv_5fold_f1": round(float(tuned_cv_f1), 4),
            "holdout_accuracy": round(float(tuned_acc), 4),
            "holdout_weighted_f1": round(float(tuned_f1), 4)
        },
        "soft_voting_ensemble": {
            "name": "Tri-Model Soft-Voting Ensemble (LR + LinearSVC + CNB)",
            "cv_5fold_f1": round(float(voting_cv_f1), 4),
            "cv_5fold_accuracy": round(float(voting_cv_acc), 4),
            "holdout_accuracy": round(float(vote_acc), 4),
            "holdout_weighted_f1": round(float(vote_f1), 4)
        },
        "stacking_ensemble": {
            "name": "Tri-Model Stacking Classifier (Meta-Learner)",
            "cv_5fold_f1": round(float(stacking_cv_f1), 4),
            "cv_5fold_accuracy": round(float(stacking_cv_acc), 4),
            "holdout_accuracy": round(float(stack_acc), 4),
            "holdout_weighted_f1": round(float(stack_f1), 4),
            "relative_f1_improvement": f"+{((stack_f1 - base_f1) / base_f1) * 100:.2f}%",
            "relative_accuracy_improvement": f"+{((stack_acc - base_acc) / base_acc) * 100:.2f}%"
        }
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    out_file = EVALUATION_DIR / "optimization_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("=" * 70)
    print(f"🎉 Optimization Complete! Results saved to: {out_file}")
    print(f"Accuracy Improvement: {base_acc*100:.1f}% -> {stack_acc*100:.1f}% (+{((stack_acc - base_acc)/base_acc)*100:.1f}%)")
    print(f"F1-Score Improvement: {base_f1:.4f} -> {stack_f1:.4f} (+{((stack_f1 - base_f1)/base_f1)*100:.1f}%)")
    print("=" * 70)


if __name__ == "__main__":
    run_optimization()
