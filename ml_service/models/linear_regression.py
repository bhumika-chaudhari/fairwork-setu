"""
Model 1: Linear Regression Cash Balance Forecasting
Uses scikit-learn LinearRegression with chronological train/test split.
Predicts upcoming cash balance for the next 7 days.
"""

from datetime import datetime, timedelta
import os
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from synthetic_data import generate_synthetic_daily_data, process_user_transactions

ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "artifacts", "linear_regression.joblib"
)


class CashFlowLinearModel:
    def __init__(self):
        self.model: Optional[LinearRegression] = None
        self.last_trained: Optional[str] = None
        self.metrics: Dict[str, Any] = {}
        self.is_synthetic_training: bool = False
        self.feature_names = [
            "day_index",
            "rolling_income_3d",
            "rolling_expense_3d",
            "net_flow",
            "sin_dow",
            "cos_dow",
        ]
        self._load_if_exists()

    def _load_if_exists(self):
        if os.path.exists(ARTIFACT_PATH):
            try:
                data = joblib.load(ARTIFACT_PATH)
                self.model = data.get("model")
                self.last_trained = data.get("last_trained")
                self.metrics = data.get("metrics", {})
                self.is_synthetic_training = data.get("is_synthetic_training", False)
            except Exception as e:
                print(f"[LinearRegression] Failed to load artifact: {e}")

    def _save_artifact(self):
        os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "last_trained": self.last_trained,
                "metrics": self.metrics,
                "is_synthetic_training": self.is_synthetic_training,
            },
            ARTIFACT_PATH,
        )

    def _extract_features(
        self, daily_records: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extracts feature matrix X and target vector y (cash balance) from chronological records.
        """
        n = len(daily_records)
        X = np.zeros((n, len(self.feature_names)), dtype=np.float32)
        y = np.zeros(n, dtype=np.float32)

        for i, rec in enumerate(daily_records):
            day_idx = float(rec.get("day_index", i))
            dow = float(rec.get("day_of_week", 0))

            # 3-day rolling window features
            start_window = max(0, i - 2)
            inc_window = [r["income"] for r in daily_records[start_window : i + 1]]
            exp_window = [r["expense"] for r in daily_records[start_window : i + 1]]
            roll_inc = float(np.mean(inc_window))
            roll_exp = float(np.mean(exp_window))

            net = float(rec.get("net", rec["income"] - rec["expense"]))
            sin_dow = float(np.sin(2 * np.pi * dow / 7.0))
            cos_dow = float(np.cos(2 * np.pi * dow / 7.0))

            X[i] = [day_idx, roll_inc, roll_exp, net, sin_dow, cos_dow]
            y[i] = float(rec.get("balance", 0.0))

        return X, y

    def train(
        self, raw_transactions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Trains Linear Regression using chronological split (80% train, 20% test).
        Uses user transactions if >= 10 days of records exist, else uses benchmark synthetic data.
        """
        daily_records = process_user_transactions(raw_transactions or [])
        is_synthetic = False

        if len(daily_records) < 10:
            daily_records = generate_synthetic_daily_data(num_days=90, seed=42)
            is_synthetic = True

        X, y = self._extract_features(daily_records)
        n = len(daily_records)

        # Chronological split to prevent data leakage from the future
        split_idx = int(n * 0.8)
        # Ensure at least 3 samples in test
        if n - split_idx < 3:
            split_idx = max(1, n - 3)

        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        model = LinearRegression()
        model.fit(X_train, y_train)

        # Evaluate on held-out test split
        y_pred_test = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred_test))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
        r2 = float(r2_score(y_test, y_pred_test))

        self.model = model
        self.last_trained = datetime.now().isoformat()
        self.is_synthetic_training = is_synthetic
        self.metrics = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(max(-1.0, min(1.0, r2)), 4),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "total_records": n,
            "coefficients": {
                name: round(float(coef), 4)
                for name, coef in zip(self.feature_names, model.coef_)
            },
            "intercept": round(float(model.intercept_), 2),
        }

        self._save_artifact()

        return {
            "status": "trained",
            "is_synthetic": is_synthetic,
            "last_trained": self.last_trained,
            "metrics": self.metrics,
        }

    def predict_next_7_days(
        self, raw_transactions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generates 7-day cash balance forecast. If not trained, auto-trains.
        """
        if self.model is None:
            self.train(raw_transactions)

        daily_records = process_user_transactions(raw_transactions or [])
        using_synthetic = False

        if len(daily_records) < 7:
            daily_records = generate_synthetic_daily_data(num_days=30, seed=42)
            using_synthetic = True

        last_record = daily_records[-1]
        last_date = datetime.strptime(last_record["date"], "%Y-%m-%d")
        current_balance = float(last_record["balance"])
        last_idx = int(last_record["day_index"])

        # Recent 3-day average income and expenses
        recent_3 = daily_records[-3:] if len(daily_records) >= 3 else daily_records
        avg_inc = float(np.mean([r["income"] for r in recent_3]))
        avg_exp = float(np.mean([r["expense"] for r in recent_3]))
        avg_net = float(np.mean([r["net"] for r in recent_3]))

        forecast_days = []
        simulated_records = list(daily_records)

        for step in range(1, 8):
            next_date = last_date + timedelta(days=step)
            dow = next_date.weekday()
            day_idx = last_idx + step

            sin_dow = float(np.sin(2 * np.pi * dow / 7.0))
            cos_dow = float(np.cos(2 * np.pi * dow / 7.0))

            feat = np.array(
                [[day_idx, avg_inc, avg_exp, avg_net, sin_dow, cos_dow]],
                dtype=np.float32,
            )
            pred_balance = float(self.model.predict(feat)[0])
            pred_balance = round(max(0.0, pred_balance), 2)

            forecast_days.append(
                {
                    "date": next_date.strftime("%Y-%m-%d"),
                    "day_label": next_date.strftime("%a"),
                    "predicted_balance": pred_balance,
                    "expected_daily_net": round(avg_net, 2),
                    "confidence_lower": round(max(0.0, pred_balance - (self.metrics.get("rmse", 150.0) * 1.2)), 2),
                    "confidence_upper": round(pred_balance + (self.metrics.get("rmse", 150.0) * 1.2), 2),
                }
            )

        # Historical points for chart (last 14 days)
        history_points = [
            {
                "date": r["date"],
                "day_label": datetime.strptime(r["date"], "%Y-%m-%d").strftime("%a"),
                "actual_balance": r["balance"],
                "income": r["income"],
                "expense": r["expense"],
                "is_prediction": False,
            }
            for r in daily_records[-14:]
        ]

        # Forecast points for chart
        prediction_points = [
            {
                "date": f["date"],
                "day_label": f["day_label"],
                "predicted_balance": f["predicted_balance"],
                "is_prediction": True,
            }
            for f in forecast_days
        ]

        next_day_pred = forecast_days[0]["predicted_balance"]
        delta_amount = round(next_day_pred - current_balance, 2)
        pct_change = (
            round((delta_amount / max(current_balance, 1.0)) * 100, 2)
            if current_balance > 0
            else 0.0
        )

        return {
            "model_name": "Linear Regression (Cash Flow Forecast)",
            "status": "trained",
            "is_synthetic": using_synthetic,
            "current_balance": current_balance,
            "next_day_prediction": next_day_pred,
            "delta_amount": delta_amount,
            "pct_change": pct_change,
            "forecast_7_days": forecast_days,
            "history_points": history_points,
            "prediction_points": prediction_points,
            "metrics": self.metrics,
            "last_trained": self.last_trained,
        }


# Global singleton instance
linear_model = CashFlowLinearModel()
