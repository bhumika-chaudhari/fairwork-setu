# TABLE III: BUDGET STRESS AND ANOMALY DETECTION EVALUATION

### Caption
**TABLE III: PERFORMANCE AND OPERATIONAL METRICS FOR OUTFLOW ANOMALY DETECTION AND BUDGET OVERRUN RISK CLASSIFICATION**

---

| Application Task | Algorithm / Architecture | Sample Size ($N$) | Anomaly Rate / Accuracy | F1 / ROC-AUC | Decision Threshold & Operational Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Outflow Anomaly Detection** | Isolation Forest ($B=100$, Contamination $c=0.05$) | 50 Hold-Out Records | 4.0% Outliers Flagged | Mean Anomaly Score: -0.1657 | Decision boundary $s(x) \le -0.100$ |
| **Budget Overrun Prediction** | $L_2$-Regularized Logistic Regression ($C=1.0$) | 250 Ledger Records | 94.0% Classification Accuracy | F1 = 0.949, ROC-AUC = 0.9967 | Positive Risk if $P(\text{Deficit}) \ge 0.50$ |

---

### Methodological Notes & Footnotes
1. **Isolation Forest Mechanism:** Evaluates tree path length $h(x)$ across an ensemble of 100 isolation trees. Outliers are isolated close to root nodes due to erratic transaction amounts or uncharacteristic category distributions. The standardized anomaly score is calculated as:
   $$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$$
   where $c(n) = 2\left(\ln(n - 1) + 0.5772156649\right) - \frac{2(n - 1)}{n}$ represents the average path length of an unsuccessful search in a binary search tree.
2. **Deficit Risk Feature Space:** The budget risk classifier takes 3 normalized operational features:
   - Expense-to-income ratio: $\rho = \frac{\text{Total Expenses}}{\text{Total Income}}$
   - Net cash balance: $\Delta = \text{Total Income} - \text{Total Expenses}$
   - Frequency of transactions: Count of discrete debit events over the billing period.
3. **Clinical Grounding:** The ROC-AUC of 0.9967 and F1 of 0.949 demonstrate that deterministic budget deficits can be flagged with high fidelity before catastrophic liquidity exhaustion occurs, giving workers proactive push notifications.
