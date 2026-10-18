# Model 2: Income Forecasting

## Purpose
Forecast future income from historical income records.

## Proposed algorithm
Random Forest Regressor, compared with a rolling-average baseline.

## Files
- eda.py: dataset inspection
- preprocessing.py: aggregation and lag-feature creation
- train.py: chronological split and training
- evaluate.py: MAE, RMSE, R2 and baseline comparison
- predict.py: recursive forecasting
- config.py: dataset paths and settings

## Dataset
Expected initial path: data/raw/income.csv.
Configure DATE_COLUMN, TARGET_COLUMN and FREQUENCY after reviewing the real dataset.
The starter implementation expects dated numeric income records.

## Commands
pip install -r requirements.txt
python eda.py
python train.py
python evaluate.py
python predict.py --periods 7

## Status
Starter scaffold only. No dataset has been added; the model has not been trained or validated.
Antigravity must adapt and test the code using the finalized dataset before integration.
Forecasts are estimates, not guaranteed future earnings.


<!-- Status -->
## Development Status

**Status:** Initial scaffold — dataset not yet added; model not yet trained or validated.

### Pending Tasks

- Inspect the finalized dataset and identify the actual date and income columns.
- Update EDA, preprocessing, training, evaluation, and prediction code to match the dataset.
- Handle missing values, duplicates, and irregular date frequencies where appropriate.
- Prevent data leakage by using a chronological train-test split.
- Evaluate the model using MAE, RMSE, and comparison with a rolling-average baseline.
- Save the trained model and required preprocessing artifacts.
- Verify forecast inputs and outputs for Setu backend integration.
- Update setup instructions and test the complete workflow.

### Algorithm

- **Random Forest Regressor** for income forecasting.
- **Rolling Average** as a baseline for comparison.
- Time-based features, lag features, and rolling statistics where appropriate.

**Note:** The algorithm and implementation must be reviewed against the actual dataset before the model is considered validated or ready for integration.