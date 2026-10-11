"""
=================================================================================
FairWork Setu - Standalone AI/ML Demonstration
Model 3: LSTM Deep Learning — Time-Series Sequential Financial Forecasting
=================================================================================
Academic Project Demonstration for College Evaluation.
This is a standalone, independent script designed to illustrate the methodology,
data sequencing, recurrent architecture, training, and evaluation of a
Long Short-Term Memory (LSTM) Neural Network for multi-step financial cash-flow
forecasting across chronological gig worker earnings sequences.

NOTE: This model is completely decoupled from the production application.
It utilizes reproducible synthetic time-series benchmark data simulating
180 consecutive days (6 months) of daily income, expense, and net savings.
=================================================================================
"""

import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error


# ---------------------------------------------------------------------------
# Section 1: Synthetic Chronological Time-Series Data Generator
# ---------------------------------------------------------------------------

def generate_synthetic_timeseries_data(num_days: int = 200, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a 200-day sequential time-series reflecting seasonal and cyclical
    patterns characteristic of urban gig platform workers in India.

    Seasonality:
    - Weekend peaks (Friday evening, Saturday, Sunday) from increased food orders and rides.
    - Mid-week dips (Tuesday, Wednesday).
    - Monthly variation (early-month paydays boost demand; end-of-month tight budgets).
    - Random operational anomalies (monsoon rain surges, vehicle breakdown days).
    """
    np.random.seed(random_seed)
    start_date = datetime(2025, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(num_days)]

    incomes = []
    expenses = []

    base_income = 850.0

    for i, d in enumerate(dates):
        dow = d.weekday()  # 0 = Monday, 6 = Sunday

        # Weekly cycle: Fri(4)=+150, Sat(5)=+320, Sun(6)=+280, Tue(1)=-100, Wed(2)=-80
        weekly_factor = {0: -20, 1: -90, 2: -70, 3: 40, 4: 160, 5: 320, 6: 270}[dow]

        # Monthly wave (payday surge around 1st-7th of month)
        day_of_month = d.day
        monthly_factor = 90.0 if day_of_month <= 7 else (-40.0 if day_of_month >= 25 else 0.0)

        # Autoregressive momentum from previous day
        ar_component = (incomes[-1] - base_income) * 0.25 if incomes else 0.0

        # Stochastic shock
        noise = np.random.normal(0, 75.0)

        day_inc = np.round(base_income + weekly_factor + monthly_factor + ar_component + noise, 2)
        day_inc = max(day_inc, 350.0)
        incomes.append(day_inc)

        # Expense generation (fuel correlated with income, baseline food + maintenance)
        fuel_cost = day_inc * np.random.uniform(0.18, 0.28)
        food_living = np.random.uniform(120.0, 220.0)
        occasional_maint = np.random.choice([0.0, 0.0, 0.0, 180.0, 450.0], p=[0.70, 0.15, 0.08, 0.05, 0.02])

        day_exp = np.round(fuel_cost + food_living + occasional_maint, 2)
        expenses.append(day_exp)

    incomes = np.array(incomes)
    expenses = np.array(expenses)
    net_savings = np.round(incomes - expenses, 2)

    df = pd.DataFrame({
        "date": [d.strftime("%Y-%m-%d") for d in dates],
        "day_of_week": [d.strftime("%a") for d in dates],
        "income": incomes,
        "expense": expenses,
        "net_savings": net_savings,
    })

    return df


# ---------------------------------------------------------------------------
# Section 2: PyTorch LSTM Deep Learning Architecture
# ---------------------------------------------------------------------------

class FinancialLSTMPredictor(nn.Module):
    """
    Two-layer LSTM Recurrent Neural Network with Dropout and Fully-Connected Output Head.

    Input shape:  (batch_size, seq_length, input_size=3)
    LSTM layer:   Hidden size = 32, num_layers = 2, dropout = 0.2
    Dense head:   Linear(32 -> 16) -> ReLU -> Linear(16 -> 1)
    Output shape: (batch_size, 1) -> Predicted Net Savings for day t+1
    """
    def __init__(self, input_size: int = 3, hidden_size: int = 32, num_layers: int = 2, dropout: float = 0.2):
        super(FinancialLSTMPredictor, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )

        self.fc_layers = nn.Sequential(
            nn.Linear(hidden_size, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # LSTM output: out shape (batch, seq_len, hidden_size)
        out, _ = self.lstm(x)
        # Extract representation from the final time-step of each sequence
        last_timestep = out[:, -1, :]
        prediction = self.fc_layers(last_timestep)
        return prediction


# ---------------------------------------------------------------------------
# Section 3: Sequence Creation and Dataset Preparation
# ---------------------------------------------------------------------------

def create_sliding_sequences(data_array: np.ndarray, seq_length: int = 7):
    """
    Transforms sequential multi-variate matrix into sliding temporal windows.
    Input window: [day t-6, ..., day t] across features (income, expense, net_savings)
    Target label: net_savings at day t+1 (column index 2)
    """
    X, y = [], []
    for i in range(len(data_array) - seq_length):
        X.append(data_array[i : i + seq_length, :])
        y.append(data_array[i + seq_length, 2])  # Target: next day's net savings
    return np.array(X), np.array(y).reshape(-1, 1)


# ---------------------------------------------------------------------------
# Section 4: Training, Evaluation, and Demonstration Pipeline
# ---------------------------------------------------------------------------

def train_and_evaluate_lstm():
    print("=" * 80)
    print("FAIRWORK SETU — MODEL 3: LSTM DEEP LEARNING (SEQUENTIAL CASH-FLOW FORECASTER)")
    print("Status: Standalone Demonstration Script (Academic Evaluation)")
    print("=" * 80)

    torch.manual_seed(42)
    np.random.seed(42)

    # Step 1: Data Synthesis
    print("\n[Step 1] Synthesizing 200-day chronological sequence data...")
    df = generate_synthetic_timeseries_data(num_days=200, random_seed=42)
    print(f"  -> Generated {len(df)} sequential daily financial logs.")
    print("  -> First 5 days sample:")
    print(df.head(5).to_string(index=False))

    # Step 2: Normalization (MinMaxScaler)
    feature_cols = ["income", "expense", "net_savings"]
    raw_values = df[feature_cols].values

    print("\n[Step 2] Normalizing multi-variate time-series using MinMaxScaler [0, 1]...")
    scaler = MinMaxScaler(feature_range=(0.0, 1.0))
    scaled_values = scaler.fit_transform(raw_values)

    # Step 3: Sliding Window Sequence Construction
    seq_length = 7  # 7-day lookback window (one full week of context)
    print(f"\n[Step 3] Constructing sliding temporal sequences with lookback window = {seq_length} days...")
    X, y = create_sliding_sequences(scaled_values, seq_length=seq_length)
    print(f"  -> Total sequence samples: {X.shape[0]}")
    print(f"  -> Input Tensor Shape (N, Window, Features): {X.shape}")
    print(f"  -> Target Tensor Shape (N, 1):              {y.shape}")

    # Step 4: Chronological Train / Test Split (Strictly temporal to prevent lookahead leakage)
    split_idx = int(len(X) * 0.80)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    print("\n[Step 4] Applying Chronological Train/Test Split (80% Train, 20% Test)...")
    print(f"  -> Training Sequences: {X_train.shape[0]} days")
    print(f"  -> Testing Sequences:  {X_test.shape[0]} days (Out-of-sample forward evaluation)")

    # Convert to PyTorch Tensors
    train_dataset = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train, dtype=torch.float32))
    test_dataset = TensorDataset(torch.tensor(X_test, dtype=torch.float32), torch.tensor(y_test, dtype=torch.float32))

    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)

    # Step 5: Instantiate Neural Network Model
    print("\n[Step 5] Initializing PyTorch LSTM Neural Network:")
    model = FinancialLSTMPredictor(input_size=3, hidden_size=32, num_layers=2, dropout=0.2)
    print(model)

    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.008, weight_decay=1e-4)

    # Step 6: Training Loop over 40 Epochs
    epochs = 40
    print(f"\n[Step 6] Executing Model Training over {epochs} Epochs...")
    print("Epoch | Train Loss (MSE) | Val Loss (MSE)")
    print("-" * 42)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            preds = model(batch_X)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_X.size(0)

        train_loss /= len(train_dataset)

        # Validation Loss
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_X, batch_y in test_loader:
                preds = model(batch_X)
                loss = criterion(preds, batch_y)
                val_loss += loss.item() * batch_X.size(0)
        val_loss /= len(test_dataset)

        if epoch % 5 == 0 or epoch == 1:
            print(f"{epoch:5d} | {train_loss:16.6f} | {val_loss:14.6f}")

    # Step 7: Test Set Inference and Denormalization
    print("\n[Step 7] Generating Test Forecasts and Inverting MinMax Scaling...")
    model.eval()
    with torch.no_grad():
        test_preds_tensor = model(torch.tensor(X_test, dtype=torch.float32))
        y_test_pred_scaled = test_preds_tensor.numpy()

    # Invert scaling back to original INR (₹)
    # Scaler min/max for net_savings is at index 2
    net_min = scaler.data_min_[2]
    net_max = scaler.data_max_[2]

    y_test_actual_inr = y_test * (net_max - net_min) + net_min
    y_test_pred_inr = y_test_pred_scaled * (net_max - net_min) + net_min

    mae = mean_absolute_error(y_test_actual_inr, y_test_pred_inr)
    mse = mean_squared_error(y_test_actual_inr, y_test_pred_inr)
    rmse = np.sqrt(mse)
    mape = np.mean(np.abs((y_test_actual_inr - y_test_pred_inr) / np.maximum(y_test_actual_inr, 1.0))) * 100

    # Directional Accuracy (Did the model correctly predict if net savings went up or down?)
    actual_direction = np.sign(y_test_actual_inr[1:] - y_test_actual_inr[:-1])
    pred_direction = np.sign(y_test_pred_inr[1:] - y_test_actual_inr[:-1])
    directional_acc = np.mean(actual_direction == pred_direction) * 100

    print("-" * 50)
    print("  LSTM TIME-SERIES EVALUATION METRICS:")
    print(f"  - Test MAE (Real INR):           ₹{mae:.2f}")
    print(f"  - Test Root MSE (RMSE):          ₹{rmse:.2f}")
    print(f"  - Mean Abs % Error (MAPE):       {mape:.2f}%")
    print(f"  - Directional Trend Accuracy:    {directional_acc:.1f}%")
    print("-" * 50)

    # Step 8: Multi-Day Forecast Horizon Table
    print("\n[Step 8] Test Period Comparison (First 10 Forecast Days):")
    results_df = pd.DataFrame({
        "Day #": [f"Day +{i+1}" for i in range(10)],
        "Actual Net (₹)": np.round(y_test_actual_inr.flatten()[:10], 2),
        "Predicted Net (₹)": np.round(y_test_pred_inr.flatten()[:10], 2),
        "Error (₹)": np.round(np.abs(y_test_actual_inr.flatten()[:10] - y_test_pred_inr.flatten()[:10]), 2),
    })
    print(results_df.to_string(index=False))

    # Step 9: 7-Day Recursive Future Forecasting Demonstration
    print("\n[Step 9] 7-Day Forward Horizon Recursive Forecasting Demonstration:")
    print("  Using the last 7 days of known transaction logs to project the upcoming week:")

    recent_sequence = X_test[-1].copy()  # Shape: (7, 3)
    future_forecasts = []

    current_window = torch.tensor(recent_sequence, dtype=torch.float32).unsqueeze(0)  # (1, 7, 3)

    for day_step in range(1, 8):
        with torch.no_grad():
            next_net_scaled = model(current_window).item()

        next_net_inr = next_net_scaled * (net_max - net_min) + net_min
        future_forecasts.append(next_net_inr)

        # Update sliding window by shifting and appending estimated step
        # Approximate income & expense based on average ratios
        est_inc_scaled = next_net_scaled * 1.5
        est_exp_scaled = next_net_scaled * 0.5
        new_step = torch.tensor([[[est_inc_scaled, est_exp_scaled, next_net_scaled]]], dtype=torch.float32)
        current_window = torch.cat([current_window[:, 1:, :], new_step], dim=1)

    print("\n  Projected 7-Day Net Cash Flow Forecast:")
    days_labels = ["Day 1 (Tomorrow)", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
    total_projected_savings = 0.0
    for label, val in zip(days_labels, future_forecasts):
        print(f"    • {label:<18}: ₹{val:7.2f}")
        total_projected_savings += val

    print(f"\n  🎯 Cumulative 7-Day Forecasted Savings: ₹{total_projected_savings:.2f}")
    if total_projected_savings > 2500:
        print("  💡 Financial Outlook: Strong weekly savings trajectory. Worker is positioned to meet weekly rent/debt commitments.")
    else:
        print("  ⚠️ Financial Outlook: Tight weekly savings projected. Worker advised to target additional peak-hour gig slots.")

    print("\n" + "=" * 80)
    print("LSTM Deep Learning demonstration completed successfully.")
    print("=" * 80)


if __name__ == "__main__":
    train_and_evaluate_lstm()
