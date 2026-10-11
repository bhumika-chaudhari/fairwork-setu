"""
Model 3: LSTM Deep Learning Cash Flow Sequential Forecaster
Uses PyTorch LSTM neural network with chronological sequence dataset and MinMaxScaler.
Supports real data training (if >= 14 days) and reproducible Synthetic Demo Mode.
"""

from datetime import datetime, timedelta
import os
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import mean_absolute_error, mean_squared_error

from synthetic_data import generate_synthetic_daily_data, process_user_transactions

ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "artifacts", "lstm_model.pt"
)
SCALER_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "artifacts", "lstm_scaler.pt"
)


class PyTorchLSTM(nn.Module):
    def __init__(self, input_size: int = 3, hidden_size: int = 32, num_layers: int = 1):
        super(PyTorchLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
        )
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        last_out = out[:, -1, :]
        pred = self.fc(last_out)
        return pred


class LSTMCashFlowForecaster:
    def __init__(self, seq_length: int = 7):
        self.seq_length = seq_length
        self.model: Optional[PyTorchLSTM] = None
        self.min_val: float = 0.0
        self.max_val: float = 1.0
        self.last_trained: Optional[str] = None
        self.metrics: Dict[str, Any] = {}
        self.is_demo_mode: bool = False
        self._load_if_exists()

    def _load_if_exists(self):
        if os.path.exists(ARTIFACT_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model = PyTorchLSTM(input_size=3, hidden_size=32, num_layers=1)
                self.model.load_state_dict(
                    torch.load(ARTIFACT_PATH, weights_only=True)
                )
                self.model.eval()

                meta = torch.load(SCALER_PATH, weights_only=True)
                self.min_val = meta.get("min_val", 0.0)
                self.max_val = meta.get("max_val", 1.0)
                self.last_trained = meta.get("last_trained")
                self.metrics = meta.get("metrics", {})
                self.is_demo_mode = meta.get("is_demo_mode", False)
            except Exception as e:
                print(f"[LSTM] Failed to load checkpoint: {e}")

    def _save_artifact(self):
        os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
        if self.model:
            torch.save(self.model.state_dict(), ARTIFACT_PATH)
            torch.save(
                {
                    "min_val": self.min_val,
                    "max_val": self.max_val,
                    "last_trained": self.last_trained,
                    "metrics": self.metrics,
                    "is_demo_mode": self.is_demo_mode,
                },
                SCALER_PATH,
            )

    def _create_sequences(
        self, data_array: np.ndarray
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Creates rolling sequences: input is window of seq_length days of [inc, exp, net].
        Target is next day's net cash flow.
        """
        X, y = [], []
        for i in range(len(data_array) - self.seq_length):
            X.append(data_array[i : i + self.seq_length])
            y.append(data_array[i + self.seq_length, 2])  # Index 2 is net cash flow
        return torch.tensor(np.array(X), dtype=torch.float32), torch.tensor(
            np.array(y), dtype=torch.float32
        ).unsqueeze(1)

    def train(
        self,
        raw_transactions: Optional[List[Dict[str, Any]]] = None,
        force_demo: bool = False,
        epochs: int = 35,
    ) -> Dict[str, Any]:
        """
        Trains PyTorch LSTM neural network with chronological sequence splits.
        If user data is insufficient (< 14 days) and force_demo is False, returns insufficient_data status.
        If force_demo is True, runs reproducible synthetic demonstration.
        """
        daily_records = process_user_transactions(raw_transactions or [])
        is_demo = False

        if force_demo or len(daily_records) < 14:
            if not force_demo:
                return {
                    "status": "insufficient_data",
                    "available_days": len(daily_records),
                    "required_days": 14,
                    "message": f"Real transaction history has {len(daily_records)} days. A minimum of 14 continuous days is required to construct recurrent sequence windows for LSTM training. You can switch to Synthetic Demo Mode for full demonstration.",
                }
            daily_records = generate_synthetic_daily_data(num_days=90, seed=42)
            is_demo = True

        # Extract features: [income, expense, net]
        raw_matrix = np.array(
            [[r["income"], r["expense"], r["net"]] for r in daily_records],
            dtype=np.float32,
        )

        n = len(raw_matrix)
        split_idx = int(n * 0.8)

        # Scale based ONLY on training data to prevent future leakage
        train_slice = raw_matrix[:split_idx]
        self.min_val = float(np.min(train_slice))
        self.max_val = float(np.max(train_slice))
        denom = max(1.0, self.max_val - self.min_val)

        scaled_all = (raw_matrix - self.min_val) / denom

        scaled_train = scaled_all[:split_idx]
        scaled_test = scaled_all[split_idx - self.seq_length :]

        X_train, y_train = self._create_sequences(scaled_train)
        X_test, y_test = self._create_sequences(scaled_test)

        if len(X_train) == 0:
            return {"status": "error", "message": "Not enough sequence windows."}

        # Initialize and train PyTorch LSTM
        torch.manual_seed(42)
        model = PyTorchLSTM(input_size=3, hidden_size=32, num_layers=1)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

        model.train()
        loss_history = []
        for ep in range(epochs):
            optimizer.zero_grad()
            pred = model(X_train)
            loss = criterion(pred, y_train)
            loss.backward()
            optimizer.step()
            loss_history.append(float(loss.item()))

        # Chronological test evaluation
        model.eval()
        with torch.no_grad():
            test_preds_scaled = model(X_test).numpy()
            y_test_numpy = y_test.numpy()

        # Invert scale back to INR
        pred_unscaled = test_preds_scaled * denom + self.min_val
        actual_unscaled = y_test_numpy * denom + self.min_val

        mae = float(mean_absolute_error(actual_unscaled, pred_unscaled))
        rmse = float(np.sqrt(mean_squared_error(actual_unscaled, pred_unscaled)))

        self.model = model
        self.last_trained = datetime.now().isoformat()
        self.is_demo_mode = is_demo
        self.metrics = {
            "epochs": epochs,
            "final_train_loss": round(float(loss_history[-1]), 5),
            "test_mae": round(mae, 2),
            "test_rmse": round(rmse, 2),
            "train_sequences": len(X_train),
            "test_sequences": len(X_test),
            "sequence_window": self.seq_length,
            "horizon_days": 7,
            "parameters": sum(p.numel() for p in model.parameters()),
        }

        self._save_artifact()

        return {
            "status": "demo_mode" if is_demo else "trained",
            "is_synthetic": is_demo,
            "last_trained": self.last_trained,
            "metrics": self.metrics,
        }

    def predict_next_7_days(
        self,
        raw_transactions: Optional[List[Dict[str, Any]]] = None,
        force_demo: bool = False,
    ) -> Dict[str, Any]:
        """
        Runs multi-step 7-day recurrent forecast using trained LSTM.
        """
        daily_records = process_user_transactions(raw_transactions or [])
        is_demo = False

        if force_demo or len(daily_records) < 14:
            if not force_demo and self.model is not None and not self.is_demo_mode:
                return {
                    "model_name": "LSTM Neural Network (Deep Learning Forecast)",
                    "status": "insufficient_data",
                    "available_days": len(daily_records),
                    "required_days": 14,
                    "message": f"Real user transaction history contains {len(daily_records)} days. A minimum of 14 days is needed for recurrent neural network sequences. Toggle Demo Mode to inspect the fully trained LSTM.",
                }
            daily_records = generate_synthetic_daily_data(num_days=90, seed=42)
            is_demo = True

        if self.model is None or (is_demo and not self.is_demo_mode):
            self.train(force_demo=is_demo)

        denom = max(1.0, self.max_val - self.min_val)
        raw_matrix = np.array(
            [[r["income"], r["expense"], r["net"]] for r in daily_records],
            dtype=np.float32,
        )

        last_window = (raw_matrix[-self.seq_length :] - self.min_val) / denom
        curr_seq = torch.tensor(last_window, dtype=torch.float32).unsqueeze(0)

        self.model.eval()
        forecasts = []
        last_date = datetime.strptime(daily_records[-1]["date"], "%Y-%m-%d")

        with torch.no_grad():
            for step in range(1, 8):
                next_date = last_date + timedelta(days=step)
                pred_scaled = self.model(curr_seq).item()
                pred_net = float(pred_scaled * denom + self.min_val)
                pred_net = round(pred_net, 2)

                forecasts.append(
                    {
                        "date": next_date.strftime("%Y-%m-%d"),
                        "day_label": next_date.strftime("%a"),
                        "predicted_net": pred_net,
                        "lower_bound": round(pred_net - (self.metrics.get("test_rmse", 85.0) * 1.1), 2),
                        "upper_bound": round(pred_net + (self.metrics.get("test_rmse", 85.0) * 1.1), 2),
                    }
                )

                # Roll forward sequence with predicted net and estimated average income/expense
                next_point = np.array(
                    [
                        [
                            (daily_records[-1]["income"] - self.min_val) / denom,
                            (daily_records[-1]["expense"] - self.min_val) / denom,
                            pred_scaled,
                        ]
                    ],
                    dtype=np.float32,
                )
                curr_seq = torch.cat(
                    [curr_seq[:, 1:, :], torch.tensor(next_point).unsqueeze(0)], dim=1
                )

        # Historical comparison points (last 14 days)
        history_points = [
            {
                "date": r["date"],
                "day_label": datetime.strptime(r["date"], "%Y-%m-%d").strftime("%a"),
                "actual_net": r["net"],
                "income": r["income"],
                "expense": r["expense"],
                "is_prediction": False,
            }
            for r in daily_records[-14:]
        ]

        prediction_points = [
            {
                "date": f["date"],
                "day_label": f["day_label"],
                "predicted_net": f["predicted_net"],
                "is_prediction": True,
            }
            for f in forecasts
        ]

        next_day_net = forecasts[0]["predicted_net"]

        return {
            "model_name": "LSTM Neural Network (Deep Learning Forecast)",
            "status": "demo_mode" if is_demo else "trained",
            "is_synthetic": is_demo,
            "next_day_predicted_net": next_day_net,
            "forecast_7_days": forecasts,
            "history_points": history_points,
            "prediction_points": prediction_points,
            "metrics": self.metrics,
            "last_trained": self.last_trained,
        }


# Global singleton instance
lstm_model = LSTMCashFlowForecaster()
