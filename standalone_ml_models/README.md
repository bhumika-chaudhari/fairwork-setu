# FairWork Setu — Standalone AI/ML Model Demonstrations

Academic Mini Project Implementation & Demonstration Suite  
**Institution Evaluation Track — Machine Learning Engineering**

---

## 📌 Executive Summary & Academic Disclosure

This directory contains **four independent, standalone Python machine learning models** developed for the academic demonstration and technical evaluation of the **FairWork Setu** project.

> [!IMPORTANT]
> **Complete Decoupling Notice:**  
> These scripts are completely independent demonstration models. They are **not integrated** into the live React/Vite web application, frontend UI, production database, or backend API server. They exist as self-contained ML programs for university evaluation, code review, and Viva presentation.

> [!NOTE]
> **Transparent Data Disclosure:**  
> In compliance with strict academic integrity standards, all four models generate and execute on **reproducible synthetic benchmark data**. The data generators simulate realistic financial and operational characteristics of Indian platform gig workers (such as food delivery riders, auto-rickshaw drivers, and urban domestic gig workers).

---

## 🧠 Model Catalog

| # | Script Name | Algorithm | Task Type | Target / Objective | Primary Metrics |
|---|-------------|-----------|-----------|--------------------|-----------------|
| **1** | `linear_regression.py` | Ordinary Least Squares (OLS) Linear Regression | Supervised Regression | Predict next-day net cash flow (₹) | MAE, RMSE, $R^2$, Adj $R^2$ |
| **2** | `logistic_regression.py` | Logistic Regression (L2, Balanced) | Supervised Classification | Classify budget-overrun / deficit risk (0/1) | Accuracy, Precision, Recall, F1, ROC-AUC |
| **3** | `lstm_model.py` | Long Short-Term Memory (LSTM) Neural Net | Deep Sequential Forecasting | 7-day rolling time-series cash-flow forecast | Test MAE, RMSE, MAPE, Directional Acc |
| **4** | `kmeans_clustering.py` | K-Means Clustering (`k-means++`) | Unsupervised Clustering | Segment workers into spending personas | Inertia (WCSS), Silhouette Score, Davies-Bouldin |

---

## 🔬 Detailed Model Descriptions

### Model 1: Linear Regression (`linear_regression.py`)
- **Problem Statement:** Platform gig workers experience extreme day-to-day cash flow volatility. Predicting next-day net cash flow enables workers to plan discretionary spending and avoid negative cash surprises.
- **Mathematical Formulation:**
  $$\hat{y} = \beta_0 + \sum_{j=1}^{p} \beta_j X_j + \epsilon$$
- **Engineered Features:**
  - `hours_worked`: Active duty hours (4 – 13 hrs).
  - `trips_completed`: Number of delivery orders / passenger trips (5 – 30).
  - `is_weekend`: Binary surge-pricing indicator.
  - `daily_gross_income`: Daily revenue in ₹.
  - `daily_expense`: Operational and living expenditure in ₹.
  - `fuel_transport_cost`: Transportation cost component in ₹.
  - `fuel_expense_ratio`: Proportion of fuel cost to total expenses.
  - `rolling_7d_income_avg`: 7-day smoothed historical earnings baseline in ₹.
- **Pipeline:** Synthetic synthesis ($N=600$) $\rightarrow$ Train/Test Split (80/20) $\rightarrow$ `StandardScaler` $\rightarrow$ OLS fit $\rightarrow$ Residual analysis & standardized feature coefficient ranking.

---

### Model 2: Logistic Regression (`logistic_regression.py`)
- **Problem Statement:** Binary early-warning system to detect whether an informal worker faces a significant risk of a budget deficit or overrun on a given day.
- **Mathematical Formulation:**
  $$P(Y=1|X) = \sigma(z) = \frac{1}{1 + e^{-(\beta_0 + \mathbf{w}^T \mathbf{x})}}$$
- **Engineered Features:**
  - `daily_income`: Gross revenue in ₹.
  - `daily_expense`: Daily operating costs in ₹.
  - `expense_income_ratio`: Expenditure-to-income proportion.
  - `emergency_cost`: Unplanned tyre puncture, vehicle repair, or medical expense in ₹.
  - `daily_emi_obligation`: Fixed daily share of rent or chit-fund loan EMI in ₹.
  - `liquid_savings_buffer`: Accessible emergency cash balance in ₹.
  - `platform_target_missed`: Binary indicator of missed platform incentive bonuses.
- **Pipeline:** Synthetic synthesis ($N=600$) $\rightarrow$ Stratified Train/Test Split (80/20) $\rightarrow$ `StandardScaler` $\rightarrow$ L2-regularized Logistic Regression with balanced class weights $\rightarrow$ Confusion Matrix, ROC-AUC analysis, and feature Odds Ratio ($\exp(\beta)$) risk factor interpretation.

---

### Model 3: LSTM Deep Learning (`lstm_model.py`)
- **Problem Statement:** Cash flows in the gig economy exhibit temporal dependence, weekday-weekend cyclicity, and autoregressive momentum that static models cannot capture. A multi-layer LSTM neural network models sequential dependencies across time.
- **Neural Architecture:**
  - **Input Tensor:** Shape `(batch_size, seq_length=7, num_features=3)` representing 7-day sliding historical windows of `[income, expense, net_savings]`.
  - **Recurrent Core:** 2-layer LSTM (`hidden_size=32`, `num_layers=2`, `dropout=0.2`).
  - **Dense Head:** `Linear(32 -> 16)` $\rightarrow$ `ReLU` $\rightarrow$ `Linear(16 -> 1)`.
  - **Optimizer & Loss:** Adam (`lr=0.008`, `weight_decay=1e-4`), Mean Squared Error (MSE) loss across 40 epochs.
- **Pipeline:** Chronological synthesis ($N=200$ days) $\rightarrow$ `MinMaxScaler` $\rightarrow$ Sliding window creation $\rightarrow$ Strict chronological split (80% train, 20% test, no shuffling) $\rightarrow$ Epoch-by-epoch training $\rightarrow$ Inverse scaling back to INR $\rightarrow$ 7-day recursive forward forecasting.

---

### Model 4: K-Means Clustering (`kmeans_clustering.py`)
- **Problem Statement:** Unsupervised segmentation of informal workers according to their expenditure allocation habits to generate tailored financial interventions.
- **Objective Function:**
  $$J = \sum_{i=1}^{k} \sum_{\mathbf{x} \in C_i} \|\mathbf{x} - \boldsymbol{\mu}_i\|^2$$
- **Engineered Features:**
  - `fuel_travel_pct`: % of expenses spent on fuel / transport.
  - `food_living_pct`: % spent on meals and sustenance.
  - `rent_utilities_pct`: % allocated to rent, electricity, and utilities.
  - `tools_repair_pct`: % spent on vehicle maintenance and equipment.
  - `savings_rate_pct`: % of daily gross income saved.
  - `income_volatility_inr`: Standard deviation of weekly income in ₹.
- **Optimal $k$ Selection:** Systematic evaluation across $k \in [2, 7]$ using the **Elbow Method (Inertia)**, **Silhouette Analysis**, and **Davies-Bouldin Index**. Identifies $k=4$ as the natural clustering structure:
  1. *Cluster 0: High-Mileage Delivery Riders* (high fuel, moderate food, medium savings).
  2. *Cluster 1: Disciplined High Savers* (low fuel, balanced expenditure, high savings rate).
  3. *Cluster 2: Rent & Fixed-Debt Strained* (high fixed housing costs, minimal savings buffer).
  4. *Cluster 3: Hand-to-Mouth Volatile Workers* (high subsistence food, high income fluctuation).

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Python 3.10, 3.11, or 3.12 (Tested on Python 3.12.4).
- Standard scientific Python libraries.

### Installation
From the root directory or inside `standalone_ml_models/`:

```bash
cd standalone_ml_models
pip install -r requirements.txt
```

*Contents of `requirements.txt`:*
```text
numpy>=1.26.0
pandas>=2.0.0
scikit-learn>=1.3.0
torch>=2.0.0
```

---

### Running the Scripts

Each script is completely self-contained and can be executed individually:

#### 1. Run Linear Regression
```bash
python3 linear_regression.py
```
*Outputs: Dataset summary, Train/Test sample sizes, MAE, MSE, RMSE, $R^2$, Adjusted $R^2$, standardized feature coefficients, test comparisons, and a live inference demonstration.*

#### 2. Run Logistic Regression
```bash
python3 logistic_regression.py
```
*Outputs: Class distribution, Accuracy, Precision, Recall, F1-Score, ROC-AUC, full Confusion Matrix, classification report, feature Odds Ratios, and two contrasting case-study predictions.*

#### 3. Run LSTM Deep Learning
```bash
python3 lstm_model.py
```
*Outputs: 200-day time-series preview, tensor shapes, model architecture, epoch loss progression, test MAE and RMSE in real ₹ INR, MAPE, directional trend accuracy, and a recursive 7-day future cash flow forecast.*

#### 4. Run K-Means Clustering
```bash
python3 kmeans_clustering.py
```
*Outputs: Multi-variate summary statistics, $k=2..7$ comparison table with Inertia, Silhouette Score, and Davies-Bouldin Index, final cluster centroids, persona distribution, FairWork financial guidance per persona, and new worker cluster classification.*

---

## 📊 Summary of Verified Results

Based on reproducible runs with random seed 42:

| Metric | Linear Regression | Logistic Regression | LSTM Deep Learning | K-Means Clustering |
|--------|-------------------|---------------------|--------------------|--------------------|
| **Core Metric** | $R^2 = 0.9422$ | Accuracy $= 97.50\%$ | Test MAE $= ₹90.00$ | Silhouette Score $= 0.5583$ |
| **Error / Loss** | MAE $= ₹39.09$ | Binary Cross-Entropy | Test RMSE $= ₹119.26$ | Inertia (WCSS) $= 614.27$ |
| **Secondary Metric** | RMSE $= ₹48.05$ | ROC-AUC $= 1.0000$ (F1: $0.9362$) | Directional Acc $= 81.6\%$ | Davies-Bouldin Index $= 0.6567$ |
| **Evaluation Set** | 120 test days (80/20) | 120 test profiles (80/20) | 39 out-of-sample days | 500 worker profiles ($k=4$) |

---

## 🎓 Academic Viva Presentation Tips

When presenting these models to your professor or viva examiner:
1. **Explain the Motivation:** Emphasize that informal gig workers lack fixed monthly salaries; therefore, predictive models for cash-flow volatility, deficit classification, time-series forecasting, and expense segmentation directly address real-world financial inclusion challenges.
2. **Explain Model Diversity:**
   - Linear Regression demonstrates **interpretable baseline continuous regression**.
   - Logistic Regression demonstrates **probabilistic risk classification & odds-ratio analysis**.
   - LSTM demonstrates **non-linear recurrent deep learning for sequential patterns**.
   - K-Means demonstrates **unsupervised worker persona discovery & clustering quality analysis**.
3. **Be Transparent About Data:** Honestly state that while actual user platform logs require large-scale live deployment, these models are rigorously developed on realistic, reproducible synthetic benchmark data modeling Indian gig economic parameters.
