# Model 3: Transaction Anomaly Detection

## Purpose
Flag unusual transactions for review using an unsupervised anomaly-detection model.

## Proposed algorithm
Isolation Forest. It flags transactions that differ from learned patterns; a flag does not prove fraud.

## Files
- eda.py: dataset inspection
- preprocessing.py: numeric feature selection and missing-value handling
- train.py: train/test split and model training
- evaluate.py: anomaly-rate and score summaries, with optional label metrics
- predict.py: score new transaction CSV files
- config.py: dataset paths and model settings

## Dataset
Expected path: data/raw/transactions.csv.
Feature selection must be reviewed once the real dataset is available. The starter implementation uses numeric columns and excludes common identifiers/labels.

## Commands
pip install -r requirements.txt
python eda.py
python train.py
python evaluate.py
python predict.py --input data/raw/transactions.csv --output evaluation/anomaly_predictions.csv

## Output
- artifacts/anomaly_detector.joblib
- artifacts/imputer.joblib
- artifacts/feature_columns.json
- evaluation/metrics.json

## Status
Starter scaffold only. No dataset has been added; the model has not been trained or validated.
Antigravity must adapt feature selection, check for data leakage, review contamination, and test against the finalized dataset before integration.
If verified labels exist, evaluate precision, recall, F1 and the confusion matrix. Otherwise, review flagged cases using domain rules or expert feedback.
