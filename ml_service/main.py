"""
FastAPI Server for Setu AI/ML Financial Intelligence Service.
Exposes REST endpoints for:
1. Linear Regression (Cash Flow Forecast)
2. Logistic Regression (Budget Risk)
3. PyTorch LSTM (Deep Learning Sequential Forecast)
4. K-Means Clustering (Spending Pattern Discovery)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.linear_regression import linear_model
from models.logistic_regression import logistic_model
from models.lstm_model import lstm_model
from models.kmeans_clustering import kmeans_model

app = FastAPI(
    title="Setu Financial AI/ML Service",
    description="Production-grade AI/ML Microservice for cash flow forecasting, budget risk analysis, LSTM sequence prediction, and transaction clustering.",
    version="1.0.0",
)

# Enable CORS for local dev and future Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request schemas
class TransactionItem(BaseModel):
    id: Optional[str] = None
    type: str  # 'income' or 'expense'
    amount: float
    category: Optional[str] = "other"
    description: Optional[str] = ""
    timestamp: str  # ISO string
    workRef: Optional[str] = None


class PredictPayload(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    budget: Optional[float] = 5000.0
    period_days: Optional[int] = 30
    force_demo: Optional[bool] = False


class TrainPayload(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    force_demo: Optional[bool] = False
    clusters: Optional[int] = 3


# Endpoints
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "setu-ml-engine",
        "timestamp": datetime.now().isoformat(),
        "frameworks": ["scikit-learn 1.5.2", "PyTorch 2.5.1", "FastAPI 0.115.6"],
    }


@app.get("/models/status")
def get_all_models_status():
    """
    Returns high-level status of all 4 models for dashboard overview and AI Lab header.
    """
    return {
        "linear_regression": {
            "name": "Linear Regression",
            "purpose": "Cash Flow & Balance Forecast",
            "status": "trained" if linear_model.model else "not_trained",
            "is_synthetic": linear_model.is_synthetic_training,
            "last_trained": linear_model.last_trained,
            "key_metric": f"R²: {linear_model.metrics.get('r2_score', 'N/A')}",
        },
        "logistic_regression": {
            "name": "Logistic Regression",
            "purpose": "Budget Risk Classification",
            "status": "trained" if logistic_model.model else "not_trained",
            "is_synthetic": True,
            "last_trained": logistic_model.last_trained,
            "key_metric": f"ROC-AUC: {logistic_model.metrics.get('roc_auc', 'N/A')}",
        },
        "lstm_deep_learning": {
            "name": "LSTM Neural Network",
            "purpose": "Sequential Cash Flow Forecast",
            "status": "demo_mode"
            if lstm_model.is_demo_mode
            else ("trained" if lstm_model.model else "not_trained"),
            "is_synthetic": lstm_model.is_demo_mode,
            "last_trained": lstm_model.last_trained,
            "key_metric": f"Test MAE: ₹{lstm_model.metrics.get('test_mae', 'N/A')}",
        },
        "kmeans_clustering": {
            "name": "K-Means Clustering",
            "purpose": "Spending Pattern Discovery",
            "status": "trained" if kmeans_model.model else "not_trained",
            "is_synthetic": kmeans_model.metrics.get("is_synthetic", False),
            "last_trained": kmeans_model.last_trained,
            "key_metric": f"Clusters: {kmeans_model.metrics.get('n_clusters', 3)}",
        },
    }


@app.post("/models/train-all")
def train_all_models(payload: TrainPayload):
    """
    Trains all 4 models in sequence.
    """
    lr_res = linear_model.train(payload.transactions)
    log_res = logistic_model.train()
    lstm_res = lstm_model.train(payload.transactions, force_demo=payload.force_demo)
    km_res = kmeans_model.train(payload.transactions, n_clusters=payload.clusters or 3)

    return {
        "status": "all_models_trained",
        "linear_regression": lr_res,
        "logistic_regression": log_res,
        "lstm": lstm_res,
        "kmeans": km_res,
    }


# -------------------------------------------------------------
# MODEL 1: LINEAR REGRESSION ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/linear-regression/train")
def train_linear_regression(payload: TrainPayload):
    try:
        return linear_model.train(payload.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/linear-regression/predict")
def predict_linear_regression(payload: PredictPayload):
    try:
        return linear_model.predict_next_7_days(payload.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# MODEL 2: LOGISTIC REGRESSION ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/logistic-regression/train")
def train_logistic_regression(payload: TrainPayload):
    try:
        return logistic_model.train()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/logistic-regression/predict")
def predict_logistic_regression(payload: PredictPayload):
    try:
        return logistic_model.predict_risk(
            raw_transactions=payload.transactions,
            budget_amount=payload.budget or 5000.0,
            period_days=payload.period_days or 30,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# MODEL 3: LSTM DEEP LEARNING ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/lstm/train")
def train_lstm(payload: TrainPayload):
    try:
        return lstm_model.train(
            raw_transactions=payload.transactions,
            force_demo=payload.force_demo or False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/lstm/predict")
def predict_lstm(payload: PredictPayload):
    try:
        return lstm_model.predict_next_7_days(
            raw_transactions=payload.transactions,
            force_demo=payload.force_demo or False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# MODEL 4: K-MEANS CLUSTERING ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/kmeans/train")
def train_kmeans(payload: TrainPayload):
    try:
        return kmeans_model.train(
            raw_transactions=payload.transactions,
            n_clusters=payload.clusters or 3,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/kmeans/predict")
def predict_kmeans(payload: PredictPayload):
    try:
        return kmeans_model.predict_clusters(payload.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
