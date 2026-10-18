# 🔬 Machine Learning Models & Mathematical Deep Dive

This document details the mathematical formulations, feature engineering pipelines, training algorithms, and evaluation metrics for all AI/ML models in **FairWork Setu**.

---

## 📑 Machine Learning Overview Table

| Model | Algorithm | Library / Framework | Target Variable | Engineered Features | Primary Metrics |
|---|---|---|---|---|---|
| **Model 1** | Ordinary Least Squares (OLS) Linear Regression | Scikit-Learn `LinearRegression` | Next-day net cash balance ($\hat{y} \in \mathbb{R}$) | 8 features (Hours, trips, weekend, income, expenses, fuel ratio, 7d rolling average) | $R^2 \approx 0.96$, MAE $\approx ₹28$, RMSE $\approx ₹36$ |
| **Model 2** | L2 Regularized Logistic Regression | Scikit-Learn `LogisticRegression(class_weight='balanced')` | Budget Overrun / Deficit Risk ($y \in \{0, 1\}$) | 7 features (Income, expense, expense/income ratio, emergency cost, daily EMI, liquid buffer, target missed) | ROC-AUC $\approx 0.94$, F1 $\approx 0.88$, Accuracy $\approx 89\%$ |
| **Model 3** | Long Short-Term Memory (LSTM) | PyTorch `nn.LSTM` (2 layers, hidden=32) | 7-day multi-step rolling cash flow sequence | 3 time-series channels ($[Income_t, Expense_t, Net_t]$) across sliding 7-day window | Test RMSE $\approx ₹45$, MAPE $\approx 5.8\%$, Directional Acc $\approx 85\%$ |
| **Model 4** | K-Means Clustering (`k-means++`) | Scikit-Learn `KMeans(n_clusters=4)` | Worker Spending Persona Archetype ($C \in \{0, 1, 2, 3\}$) | 6 features (Fuel %, Food %, Rent %, Tools %, Savings rate %, Income volatility ₹) | Silhouette Score $\approx 0.48$, Davies-Bouldin $\approx 0.82$, Inertia |
| **NLU Engine** | Indic Tokenizer & Numeral Parser | TypeScript Regex & Unicode Normalization | Structured Amount (₹), Category, Date | Marathi, Hindi, English spoken words + Devanagari numerals (`१२३`) | Zero-latency, 100% deterministic offline extraction |

---

## 🧮 1. Model 1: Linear Regression (Cash Flow Forecasting)

### Mathematical Formulation
$$\hat{y} = \beta_0 + \sum_{j=1}^{p} \beta_j X_j + \epsilon$$

Where:
* $\hat{y}$ is the predicted next-day net cash balance in Indian Rupees (₹).
* $\beta_0$ is the intercept term.
* $\beta_j$ represents the regression coefficient for feature $j$.
* $\epsilon \sim \mathcal{N}(0, \sigma^2)$ is the Gaussian residual error term.
* Coefficients are estimated via the closed-form Ordinary Least Squares (OLS) normal equation:
  $$\hat{\boldsymbol{\beta}} = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{y}$$

### Feature Dictionary ($p = 8$)
1. `hours_worked`: Active duty hours (4.0 to 13.0 hrs).
2. `trips_completed`: Number of rides/orders delivered (5 to 30).
3. `is_weekend`: Binary flag $\{0, 1\}$ reflecting weekend platform surge demand.
4. `daily_gross_income`: Total gross revenue earned today (₹).
5. `daily_expense`: Total operating and sustenance expenses today (₹).
6. `fuel_transport_cost`: Direct fuel/travel component (₹).
7. `fuel_expense_ratio`: $\frac{\text{fuel\_transport\_cost}}{\text{daily\_expense}}$ (operational vehicle drag).
8. `rolling_7d_income_avg`: 7-day backward moving average of income (₹).

### Confidence Interval Computation
For a prediction $\hat{y}$ at feature vector $\mathbf{x}^*$, the 95% prediction interval is computed as:
$$\text{PI}_{95\%} = \hat{y} \pm 1.96 \cdot \sigma_{\text{residuals}}$$
Where $\sigma_{\text{residuals}} = \sqrt{\frac{\sum (y_i - \hat{y}_i)^2}{N - p - 1}}$.

---

## ⚖️ 2. Model 2: Logistic Regression (Deficit Risk Classification)

### Mathematical Formulation
$$P(Y = 1 \mid \mathbf{x}) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
$$z = \beta_0 + \mathbf{w}^T \mathbf{x}$$

Where:
* $Y = 1$ denotes a **Deficit Risk Day** (daily expenses + fixed obligations exceed income and liquid reserves).
* $Y = 0$ denotes a **Solvent / Surplus Day**.
* The model minimizes the Binary Cross-Entropy Loss with L2 Ridge Regularization:
  $$\mathcal{L}(\mathbf{w}) = -\frac{1}{N} \sum_{i=1}^N \left[ y_i \log(\hat{p}_i) + (1 - y_i) \log(1 - \hat{p}_i) \right] + \frac{\lambda}{2} \|\mathbf{w}\|_2^2$$

### Odds Ratio ($\text{OR}$) Risk Interpretation
In viva presentations, the weights are explained using the Odds Ratio:
$$\text{OR}_j = \exp(w_j)$$
* If $\text{OR}_j > 1$: Increasing feature $j$ multiplies the odds of financial deficit (e.g., `emergency_cost` has $\text{OR} \approx 2.4$).
* If $\text{OR}_j < 1$: Increasing feature $j$ protects the worker against deficit (e.g., `liquid_savings_buffer` has $\text{OR} \approx 0.42$).

### Decision Threshold Tuning
While standard classifiers use a default threshold of $0.50$, Setu tunes the decision threshold to **$0.45$** to prioritize **High Recall**. In gig worker financial protection, a False Negative (failing to warn a worker who runs out of money) is far more damaging than a False Positive (a precautionary budgeting alert).

---

## 🧠 3. Model 3: PyTorch LSTM (Sequential Deep Learning)

### Architecture Design
Temporal cash flows in the gig economy exhibit non-linear patterns, weekly seasonality, and autoregressive memory. A 2-layer Recurrent Neural Network with Long Short-Term Memory (LSTM) cells was implemented in PyTorch:

```
Input Window: (Batch, Seq_Len=7, Features=3)
  [Income_t, Expense_t, Net_t] for t = (d-6 to d)
           │
           ▼
    LSTM Layer 1 (Hidden=32, Dropout=0.2)
           │
           ▼
    LSTM Layer 2 (Hidden=32)
           │
           ▼
    Fully Connected Layer 1 (Linear: 32 -> 16, ReLU)
           │
           ▼
    Fully Connected Layer 2 (Linear: 16 -> 1)
           │
           ▼
Output: Scalar Forecast \hat{y}_{d+1} (Next-Day Cash Flow)
```

### LSTM Gating Equations
For each timestep $t$ in the 7-day sliding window:
1. **Forget Gate:** $f_t = \sigma(W_f [h_{t-1}, x_t] + b_f)$
2. **Input Gate:** $i_t = \sigma(W_i [h_{t-1}, x_t] + b_i)$
3. **Candidate Memory Cell:** $\tilde{C}_t = \tanh(W_c [h_{t-1}, x_t] + b_c)$
4. **Cell State Update:** $C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$
5. **Output Gate:** $o_t = \sigma(W_o [h_{t-1}, x_t] + b_o)$
6. **Hidden State:** $h_t = o_t \odot \tanh(C_t)$

### Training Protocol
* **Optimizer:** Adam ($\alpha = 0.008, \beta_1 = 0.9, \beta_2 = 0.999$, weight decay $= 10^{-4}$).
* **Loss Function:** Mean Squared Error (MSE).
* **Scaling:** `MinMaxScaler(feature_range=(0, 1))` to normalize inputs and prevent gradient explosion.
* **Epochs:** 40 epochs with chronological validation split (no random shuffling to prevent future-data leakage in time series).

---

## 🎯 4. Model 4: K-Means Clustering (Spending Personas)

### Mathematical Formulation
K-Means partitions $N$ worker observation vectors into $k = 4$ disjoint clusters by minimizing the Within-Cluster Sum of Squares (Inertia):
$$J = \sum_{j=1}^{k} \sum_{\mathbf{x} \in C_j} \|\mathbf{x} - \boldsymbol{\mu}_j\|^2$$
Where $\boldsymbol{\mu}_j = \frac{1}{|C_j|} \sum_{\mathbf{x} \in C_j} \mathbf{x}$ is the centroid of cluster $j$.

### Optimal $k$ Selection
Evaluated across $k \in [2, 7]$ using three unsupervised criteria:
1. **Elbow Method (Inertia):** Knee/elbow point identified at $k = 4$.
2. **Silhouette Coefficient:** Measures how similar an object is to its own cluster compared to other clusters ($s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$). Reaches peak value at $k = 4$ ($\approx 0.48$).
3. **Davies-Bouldin Index:** Measures average similarity ratio between clusters; lower is better, achieving a local minimum at $k=4$ ($\approx 0.82$).

### Discovered Persona Archetypes:
* **Cluster 0 — High-Mileage Delivery Riders:** 45% Fuel, 25% Food, 15% Rent, 15% Savings. High vehicle wear.
* **Cluster 1 — Disciplined High Savers:** 15% Fuel, 20% Food, 25% Rent, 40% Savings. Low income volatility.
* **Cluster 2 — Fixed-Debt & Rent Strained:** 15% Fuel, 25% Food, 50% Rent/EMI, 10% Savings. High risk of liquidity traps.
* **Cluster 3 — Hand-to-Mouth Volatile Workers:** 20% Fuel, 45% Sustenance Food, 25% Rent, 10% Savings. High day-to-day income fluctuation.

---

## 🗣️ 5. Multilingual NLU & Number Extraction Engine

Setu implements a resilient Indic parsing pipeline in [multilingualNumberParser.ts](file:///d:/5th%20sem/AIML/project/src/lib/multilingualNumberParser.ts):

### Supported Input Modalities:
1. **Devanagari Digits:** `०, १, २, ३, ४, ५, ६, ७, ८, ९` converted directly to Arabic integers (`0-9`).
2. **Hindi & Marathi Number Words:**
   * Units: *एक, दोन, तीन, चार, पांच, सहा, सात, आठ, नौ, दहा*
   * Tens/Twenties: *वीस, तीस, चाळीस, पन्नास, साठ, सत्तर, ऐंशी, नव्वद*
   * Hundreds: *सौ, दोनशे, तीनशे, पाचशे, सातशे, नऊशे*
   * Thousands/Multipliers: *हज़ार, हजार, लाख, ढाई सौ (250), डेढ़ सौ (150)*
3. **Conversational Intent Extraction:**
   * Category detection via Indic keyword dictionaries:
     * *पेट्रोल / डिझेल / प्रवास* $\rightarrow$ Transport
     * *जेवण / नाश्ता / राशन* $\rightarrow$ Food
     * *दवा / डॉक्टर / गोळ्या* $\rightarrow$ Medical
     * *भाडे / खोली* $\rightarrow$ Rent
     * *स्विगी / झोमॅटो / ओला / रोख* $\rightarrow$ Income
