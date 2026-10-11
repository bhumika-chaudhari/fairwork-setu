"""
Model 2: Logistic Regression Budget Risk Classifier
Uses scikit-learn LogisticRegression with StandardScaler.
Estimates probability of exceeding budget and classifies into Within Budget / Over Budget.
"""

from datetime import datetime
import os
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from synthetic_data import (
    generate_budget_training_dataset,
    process_user_transactions,
)

ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "artifacts",
    "logistic_regression.joblib",
)


class BudgetRiskClassifier:
    def __init__(self):
        self.model: Optional[LogisticRegression] = None
        self.scaler: Optional[StandardScaler] = None
        self.last_trained: Optional[str] = None
        self.metrics: Dict[str, Any] = {}
        self.feature_names = [
            "daily_expense_mean",
            "expense_volatility",
            "expense_to_income_ratio",
            "max_single_expense_ratio",
            "budget_amount",
            "burn_rate_projected",
        ]
        self._load_if_exists()

    def _load_if_exists(self):
        if os.path.exists(ARTIFACT_PATH):
            try:
                data = joblib.load(ARTIFACT_PATH)
                self.model = data.get("model")
                self.scaler = data.get("scaler")
                self.last_trained = data.get("last_trained")
                self.metrics = data.get("metrics", {})
            except Exception as e:
                print(f"[LogisticRegression] Failed to load artifact: {e}")

    def _save_artifact(self):
        os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "scaler": self.scaler,
                "last_trained": self.last_trained,
                "metrics": self.metrics,
            },
            ARTIFACT_PATH,
        )

    def train(self, seed: int = 42) -> Dict[str, Any]:
        """
        Trains Logistic Regression model on a labeled benchmark budget tracking dataset.
        Evaluates precision, recall, F1-score, and ROC-AUC on a held-out test split.
        """
        X, y = generate_budget_training_dataset(num_samples=250, seed=seed)

        # 80/20 train/test split with stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=seed, stratify=y
        )

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        model = LogisticRegression(random_state=seed, max_iter=1000)
        model.fit(X_train_scaled, y_train)

        # Predictions and probabilities on test set
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_prob))

        self.model = model
        self.scaler = scaler
        self.last_trained = datetime.now().isoformat()
        self.metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "features_used": self.feature_names,
            "coefficients": {
                name: round(float(coef), 4)
                for name, coef in zip(self.feature_names, model.coef_[0])
            },
            "intercept": round(float(model.intercept_[0]), 4),
        }

        self._save_artifact()

        return {
            "status": "trained",
            "last_trained": self.last_trained,
            "metrics": self.metrics,
        }

    def predict_risk(
        self,
        raw_transactions: Optional[List[Dict[str, Any]]] = None,
        budget_amount: float = 5000.0,
        period_days: int = 30,
    ) -> Dict[str, Any]:
        """
        Extracts user's actual spending features and runs through trained Logistic Regression model.
        Returns predicted class (Within Budget / Over Budget) and estimated probability.
        """
        if self.model is None or self.scaler is None:
            self.train()

        daily_records = process_user_transactions(raw_transactions or [])
        budget = max(500.0, float(budget_amount))
        using_synthetic = False

        if len(daily_records) >= 3:
            # Derive features from user transactions
            expenses = [r["expense"] for r in daily_records]
            incomes = [r["income"] for r in daily_records]
            daily_expense_mean = float(np.mean(expenses))
            expense_volatility = float(np.std(expenses)) if len(expenses) > 1 else 30.0
            daily_income_mean = float(np.mean(incomes)) if len(incomes) > 0 else 500.0
            ratio = daily_expense_mean / max(daily_income_mean, 10.0)
            max_single_expense = float(np.max(expenses))
            max_single_ratio = max_single_expense / budget
            projected_total = daily_expense_mean * period_days
            burn_rate = projected_total / budget
        else:
            # Baseline estimation with benchmark parameters
            using_synthetic = True
            daily_expense_mean = 180.0
            expense_volatility = 45.0
            ratio = 0.55
            max_single_ratio = 450.0 / budget
            projected_total = daily_expense_mean * period_days
            burn_rate = projected_total / budget

        features = np.array(
            [
                [
                    daily_expense_mean,
                    expense_volatility,
                    ratio,
                    max_single_ratio,
                    budget,
                    burn_rate,
                ]
            ],
            dtype=np.float32,
        )

        features_scaled = self.scaler.transform(features)
        pred_class = int(self.model.predict(features_scaled)[0])
        prob_over_budget = float(self.model.predict_proba(features_scaled)[0][1])

        # Interpretable risk level
        if prob_over_budget < 0.35:
            risk_level = "Low"
            status_text = "Within Budget"
        elif prob_over_budget < 0.65:
            risk_level = "Moderate"
            status_text = "Borderline Risk"
        else:
            risk_level = "High"
            status_text = "Over Budget"

        return {
            "model_name": "Logistic Regression (Budget Risk)",
            "status": "trained",
            "is_synthetic": using_synthetic,
            "budget_amount": round(budget, 2),
            "projected_spend": round(projected_total, 2),
            "predicted_class": pred_class,
            "predicted_label": "Over Budget" if pred_class == 1 else "Within Budget",
            "over_budget_probability": round(prob_over_budget, 4),
            "probability_percent": round(prob_over_budget * 100, 1),
            "risk_level": risk_level,
            "status_text": status_text,
            "feature_snapshot": {
                "daily_expense_mean": round(daily_expense_mean, 2),
                "expense_volatility": round(expense_volatility, 2),
                "expense_to_income_ratio": round(ratio, 2),
                "burn_rate_projected": round(burn_rate, 2),
            },
            "metrics": self.metrics,
            "last_trained": self.last_trained,
        }


# Global singleton instance
logistic_model = BudgetRiskClassifier()
