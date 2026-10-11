import sys
import os

# Add ml_service to path
sys.path.insert(0, os.path.dirname(__file__))

from synthetic_data import generate_synthetic_daily_data, generate_budget_training_dataset
from models.linear_regression import linear_model
from models.logistic_regression import logistic_model
from models.lstm_model import lstm_model
from models.kmeans_clustering import kmeans_model

def run_tests():
    print("=== Testing Synthetic Data Generation ===")
    series = generate_synthetic_daily_data(num_days=60)
    print(f"Generated {len(series)} days of cash flow data.")
    assert len(series) == 60
    
    print("\n=== Testing Model 1: Linear Regression ===")
    lr_train = linear_model.train([])
    print("LR Train Metrics:", lr_train.get("metrics"))
    lr_pred = linear_model.predict_next_7_days([])
    print(f"LR 7-day predictions count: {len(lr_pred.get('forecast_7_days', []))}")
    assert len(lr_pred.get("forecast_7_days", [])) == 7
    
    print("\n=== Testing Model 2: Logistic Regression ===")
    log_train = logistic_model.train()
    print("Logistic Train Metrics:", log_train.get("metrics"))
    log_pred = logistic_model.predict_risk([], budget_amount=6000.0)
    print(f"Logistic Risk: {log_pred.get('risk_level')}, Prob: {log_pred.get('over_budget_probability')}")
    assert "over_budget_probability" in log_pred

    print("\n=== Testing Model 3: PyTorch LSTM ===")
    lstm_train = lstm_model.train([], force_demo=True)
    print("LSTM Train Metrics:", lstm_train.get("metrics"))
    lstm_pred = lstm_model.predict_next_7_days([], force_demo=True)
    print(f"LSTM 7-day forecast count: {len(lstm_pred.get('forecast_7_days', []))}")
    assert len(lstm_pred.get("forecast_7_days", [])) == 7

    print("\n=== Testing Model 4: K-Means Clustering ===")
    km_train = kmeans_model.train([])
    print("K-Means Metrics:", km_train.get("metrics"))
    km_pred = kmeans_model.predict_clusters([])
    print(f"K-Means clusters discovered: {len(km_pred.get('cluster_summaries', []))}")
    assert len(km_pred.get("cluster_summaries", [])) == 3

    print("\n>>> ALL 4 MODELS INITIALIZED, TRAINED, AND PREDICTED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()
