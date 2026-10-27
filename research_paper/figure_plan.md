# Figure Inventory and Placement Plan: FairWork Setu

This document specifies the complete visual figure plan for the IEEE research paper, including high-resolution asset filenames, dimensions, subsection placements, formal IEEE captions, and detailed technical descriptions.

All image files are stored locally in the `research_paper/figures/` directory.

---

## Summary Matrix

| Figure ID | High-Res Source File | Subsection Placement | Width (Inches / Columns) | Technical Topic |
| :--- | :--- | :--- | :--- | :--- |
| **Fig. 1** | `figures/fig1_system_architecture.png` | Section III-A | 3.5 in (Single Column) or 7.0 in (Page Top) | Dual-Layer System Architecture & Data Flow |
| **Fig. 2** | `figures/fig3_income_forecasting_eval.png` | Section VI-A | 3.5 in (Single Column) | Empirical Cash-Flow Forecasting (22 Hold-Out Days) |
| **Fig. 3** | `figures/fig4_expense_classification_cm.png` | Section VI-B | 3.5 in (Single Column) | Normalized Confusion Matrix: 8-Class Hinglish NLP |
| **Fig. 4** | `figures/fig5_anomaly_detection_scores.png` | Section VI-C | 3.5 in (Single Column) | Isolation Forest Anomaly Score Distribution |
| **Fig. 5** | `figures/fig6_lstm_loss_and_forecast.png` | Section VI-A | 3.5 in (Single Column) | PyTorch 2-Layer LSTM Loss Convergence (35 Epochs) |
| **Fig. 6** | `figures/fig7_retrieval_ranking_eval.png` | Section VI-E | 3.5 in (Single Column) | Dense Semantic Retrieval MRR, Top-k Hit Rates, and Legal RAG |
| **Fig. 7** | `figures/fig8_kmeans_clusters.png` | Section VI-F | 3.5 in (Single Column) | Unsupervised K-Means Spending Archetypes ($k=3$) |
| **Fig. S1** (Supp.) | `figures/fig2_data_distributions.png` | Section V-A / Appendix | 3.5 in (Single Column) | Longitudinal Earnings Distribution & Temporal Autocorrelation |

---

## Detailed Figure Specifications

### Figure 1: Dual-Layer System Architecture
- **File:** `research_paper/figures/fig1_system_architecture.png`
- **Formal IEEE Caption:**  
  `Fig. 1. Dual-layer system architecture of FairWork Setu, depicting the integration of client-side multimodal interaction channels (Voice ASR, Web Speech API, Deterministic Regex NLU, and TypeScript mathematical heuristics) with server-side machine learning microservices (Random Forest Regressor, PyTorch LSTM, TF-IDF Logistic Regression, Isolation Forest, and FAISS Flat-L2 Semantic Retrieval) orchestrated over Supabase PostgreSQL.`
- **Placement:** Section III: *System Architecture and Data Flow*, Subsection A (*Architectural Philosophy: The Dual-Layer Hierarchy*).
- **What It Communicates:**
  - Client Edge Layer: React 18, TypeScript, Tailwind CSS, Lucide icons, Web Speech API, pure TypeScript mathematical forecasting and budget risk evaluators.
  - API Gateway / Microservice Layer: Python 3.12, FastAPI, Scikit-Learn, PyTorch, Sentence Transformers (`all-MiniLM-L6-v2`), FAISS.
  - Data Persistence: Supabase PostgreSQL with Row Level Security (RLS), encrypted credential storage, and offline localStorage synchronization.
  - Network failover pipeline ensuring sub-5ms local UI feedback during intermittent network disconnections.

---

### Figure 2: Empirical Cash-Flow Forecasting Comparison
- **File:** `research_paper/figures/fig3_income_forecasting_eval.png`
- **Formal IEEE Caption:**  
  `Fig. 2. Empirical cash-flow forecasting comparison across 22 hold-out test days, contrasting ground-truth earnings against the 7-day Simple Moving Average (SMA), Ordinary Least Squares (OLS) baseline, 2-layer PyTorch LSTM, and the proposed Random Forest Regressor (MAE = ₹76.60 vs. ₹144.81 baseline).`
- **Placement:** Section VI: *Results and Performance Analysis*, Subsection A (*Comparative Evaluation of Cash-Flow Forecasting Models*).
- **What It Communicates:**
  - Visual time-series trajectories for Day 79 to Day 100.
  - Demonstrates that SMA lags actual turning points by 3–4 days, while OLS produces an uncalibrated static linear slope.
  - Highlights how the 100-tree Random Forest closely tracks weekend earnings spikes and mid-week dips with an $R^2$ of 0.5594.

---

### Figure 3: Normalized Confusion Matrix for Hinglish NLP
- **File:** `research_paper/figures/fig4_expense_classification_cm.png`
- **Formal IEEE Caption:**  
  `Fig. 3. Normalized confusion matrix for the 8-class code-mixed Hinglish expense classifier evaluated on 32 held-out test phrases, demonstrating strong diagonal dominance with localized ambiguity between Medical and Personal expense classes.`
- **Placement:** Section VI: *Results and Performance Analysis*, Subsection B (*Code-Mixed Expense Classification Performance*).
- **What It Communicates:**
  - Normalized diagonal showing 1.00 accuracy for EMI/Loan and Rent, 1.00 recall for Fuel/Petrol, and 0.75 for Food & Dining and Education.
  - Visualizes the 0.50 off-diagonal dispersion between Health/Medical and Personal/Misc, confirming the polysemous nature of colloquial retail purchases.

---

### Figure 4: Isolation Forest Anomaly Score Distribution
- **File:** `research_paper/figures/fig5_anomaly_detection_scores.png`
- **Formal IEEE Caption:**  
  `Fig. 4. Isolation Forest anomaly score distribution across 50 hold-out ledger records, demonstrating clear bimodal separation between nominal routine disbursements and flagged budget-stress anomalies (threshold s(x) <= -0.100).`
- **Placement:** Section VI: *Results and Performance Analysis*, Subsection C (*Anomaly Detection and Budget Stress Evaluation*).
- **What It Communicates:**
  - Anomaly score histogram and kernel density estimation.
  - Normal transactions cluster around $s(x) \in [-0.02, 0.08]$.
  - The 4.0% flagged anomalous transactions cleanly separate at $s(x) \le -0.100$ (mean score $-0.1657$), representing catastrophic repair bills or uncharacteristic luxury outlays.

---

### Figure 5: PyTorch LSTM Loss Convergence & Sequence Forecast
- **File:** `research_paper/figures/fig6_lstm_loss_and_forecast.png`
- **Formal IEEE Caption:**  
  `Fig. 5. PyTorch 2-layer LSTM training loss convergence across 35 epochs (converging to MSE = 0.00806) alongside next-step sequence trajectory predictions on unseen gig earnings sequences.`
- **Placement:** Section VI: *Results and Performance Analysis*, Subsection A (*Comparative Evaluation of Cash-Flow Forecasting Models*).
- **What It Communicates:**
  - Training loss descent curve showing rapid convergence from initial MSE $>0.08$ down to stable $0.00806$ by epoch 30.
  - Trajectory plot showing LSTM tracking temporal momentum without catastrophic gradient divergence.

---

### Figure 6: Dense Semantic Retrieval and Ranking Evaluation
- **File:** `research_paper/figures/fig7_retrieval_ranking_eval.png`
- **Formal IEEE Caption:**  
  `Fig. 6. Ranking and retrieval evaluation curves depicting Mean Reciprocal Rank (MRR = 1.000 for gig matching, MRR@4 = 0.9167 for statutory welfare RAG) and Top-k hit distributions across semantic similarity benchmarks.`
- **Placement:** Section VI: *Results and Performance Analysis*, Subsection E (*Dense Semantic Retrieval and Ranking Benchmarks*).
- **What It Communicates:**
  - Top-1, Top-2, Top-3, and Top-5 hit rates for the FAISS Flat-L2 index.
  - 100% Top-2 accuracy across statutory welfare acts, verifying that zero statutory inquiries missed the appropriate legislative clause.

---

### Figure 7: Unsupervised K-Means Spending Clusters
- **File:** `research_paper/figures/fig8_kmeans_clusters.png`
- **Formal IEEE Caption:**  
  `Fig. 7. Unsupervised K-Means clustering (k = 3, Inertia = 170.39) of informal gig worker transactions, delineating Micro-Disbursements (Cluster 0, mean ₹188), Daily Operational Costs (Cluster 1, mean ₹192), and Major Cash Inflows/Outflows (Cluster 2, mean ₹762).`
- **Placement:** Section VI: *Results and Performance Analysis*, Subsection F (*Unsupervised Spending Pattern Segmentation Findings*).
- **What It Communicates:**
  - Scatter plot in amount-category space showing the three natural expenditure clusters.
  - Centroid coordinates marked with confidence intervals and transaction frequency proportions.

---

### Supplementary Figure S1: Earnings Distribution
- **File:** `research_paper/figures/fig2_data_distributions.png`
- **Formal IEEE Caption:**  
  `Fig. S1. Longitudinal distribution of informal daily gig earnings over the 100-day evaluation period, illustrating severe right-skewness, weekend wage surges, and high day-to-day variance characteristic of platform gig labor.`
- **Placement:** Section V: *Experimental Setup and Datasets*, Subsection A (*Corpus Specifications and Empirical Split Protocols*).
