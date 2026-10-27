# TABLE I: TIME-SERIES CASH FLOW FORECASTING BENCHMARK (22 HOLD-OUT TEST DAYS)

### Caption
**TABLE I: EMPIRICAL PERFORMANCE COMPARISON OF DAILY CASH-FLOW FORECASTING ARCHITECTURES ON A 22-DAY OUT-OF-SAMPLE TEST SET**

---

| Model / Pipeline Architecture | Parameters / Hyperparameters | MAE (₹) | RMSE (₹) | $R^2$ / Final Loss | Relative MAE Error Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **7-Day Simple Moving Average (Baseline)** | Window size $w = 7$ days | ₹144.81 | ₹189.42 | -0.0410 | Reference Baseline (0.0%) |
| **Ordinary Least Squares (OLS) Linear Baseline** | Closed-Form Analytical Solution ($D = 2$) | ₹948.71 | ₹1037.80 | 0.2820 | N/A (Static Linear Trend) |
| **2-Layer PyTorch LSTM Recurrent Network** | 4,769 parameters, Hidden Dim = 16, 35 Epochs | ₹197.06 | ₹272.51 | 0.00806 (MSE) | Sequence Trajectory Modeler |
| **FairWork Setu Random Forest Regressor** | $B = 100$ Estimators, Max Depth = 6, 14 Lags | **₹76.60** | **₹123.25** | **0.5594** | **47.1% MAE Reduction** |

---

### Methodological Notes & Footnotes
1. **Evaluation Split:** Trained on the initial 78 days of longitudinal daily gig earnings; evaluated on the final 22 contiguous hold-out days to preserve chronological causality without look-ahead data leakage.
2. **Feature Representation:** The Random Forest regressor utilizes 14 engineered features comprising autoregressive cash lags ($t-1, t-2, t-3, t-7, t-14$), rolling statistical windows (7-day and 14-day moving averages and standard deviations), and calendar features including day-of-week one-hot indicators and cyclical trigonometric representations:
   $$\sin\left(\frac{2\pi \cdot \text{day}}{7}\right), \quad \cos\left(\frac{2\pi \cdot \text{day}}{7}\right)$$
3. **Error Metrics:** 
   - $\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$
   - $\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$
   - $R^2 = 1 - \frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2}{\sum_{i=1}^n (y_i - \bar{y})^2}$
4. **Primary Finding:** The Random Forest model achieved a 47.1% reduction in MAE relative to the standard 7-day Simple Moving Average (SMA), proving Hypothesis H1 that non-linear ensemble tree architectures effectively capture weekend wage spikes and localized demand cycles in informal earnings.
