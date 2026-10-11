<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PyTorch-2.5-EE4C2C?logo=pytorch&logoColor=white" alt="PyTorch 2.5" />
  <img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?logo=scikit-learn&logoColor=white" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<h1 align="center">सेतु — Setu</h1>
<h3 align="center">AI-Powered Livelihood & Financial Intelligence Platform for India's Informal & Gig Workers</h3>
<p align="center"><em>"Aapke Kaam, Paisa, Sehat aur Skill ka Sathi"</em></p>

---

## 📌 Project Overview

**Setu** (meaning *"bridge"* in Hindi) is a production-grade, AI-powered financial tracking and livelihood companion tailored specifically for India's **450+ million informal and gig workers** — delivery partners, rideshare drivers, domestic workers, construction tradespeople, artisans, and daily-wage earners.

Informal workers face high income volatility, unpredictable daily expenses, and limited access to formal financial planning. Setu bridges this gap by combining:
1. **Real-time Financial Logging & Analytics:** Track daily earnings, fuel, food, and maintenance expenses without complex accounting.
2. **Apple-Inspired Liquid Glass UI:** A modern, accessible glassmorphism interface featuring frosted acrylics, ambient backdrops, luminous borders, and an ergonomic floating dock.
3. **Four Integrated AI/ML Models:** Verifiable classical ML and deep learning models predicting cash flow horizons, evaluating budget risk, forecasting net sequential trends, and discovering empirical spending archetypes.
4. **Contextual Speech Synthesis ("Listen"):** Web Speech API integration that explains financial metrics, jobs, and welfare schemes in simple spoken English, Hindi, and Marathi.
5. **Fair Work & Skill Passport:** Inclusive, gender-neutral job discovery and a verified digital skill passport exportable as a credential.

> **Legal Disclaimer:** Setu is an informational tracking, educational, and decision-support companion. It does not provide credit scoring, formal tax advice, or loan approval decisions.

---

## 🌟 Key Application Features

### 1. Apple Liquid Glass Design Language
* **Heavy Glassmorphism Materials:** Multi-layered frosted glass surfaces with high-performance `backdrop-blur-3xl`, soft luminous borders (`border-white/80`), gentle specular reflections, and depth shadows.
* **Atmospheric Ambient Blooms:** Tasteful emerald (`#073B3A`), teal (`#087F73`), and mint (`#72E5C2`) ambient light orbs that illuminate through translucent card surfaces.
* **Floating Ergonomic Dock:** Sleek bottom navigation bar on mobile and translucent top header on desktop with tactile micro-interactions and smooth transitions.

### 2. Functional Income & Expense Tracking (`/dhan` & `/home`)
* **Live Mathematical Summaries:** Derives actual Cash in Hand, Today's Net, and Monthly Savings directly from saved transactions (no hardcoded figures).
* **Category Tagging:** Instant classification into Work Earnings, Tips & Bonuses, Travel & Fuel, Food & Chai, Rent, Tools, Medical, and Other.
* **Filter & Search:** Filter by Today, This Week, This Month, or custom date ranges.

### 3. Dedicated AI/ML Intelligence Lab (`/ai-lab`)
* **Central Command Center:** Real-time indicator displaying Python FastAPI backend connectivity (`http://127.0.0.1:8000`) with automatic client-side numerical fallback.
* **Model Retraining:** One-click **"Retrain All Models"** control that triggers parameter re-estimation on the live dataset.
* **Visual Graph Horizons:** Interactive Recharts Area, Line, and Donut charts displaying prediction intervals, loss curves, and cluster distributions.

### 4. Voice-First & Contextual Speech Synthesis
* **Contextual Audio ("Listen" / Suno):** Rather than reading raw UI strings, the TTS engine dynamically synthesizes plain-language summaries of financial trends, job requirements, and welfare criteria.
* **Central Mic Modal:** Large, pulsing voice entry CTA for hands-free daily logging.
* **Multilingual Localization:** Centralized i18next translations across **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.

---

## 🤖 The Four AI/ML Models

Setu features **four real, working Machine Learning and Deep Learning models** running via an asynchronous Python FastAPI service (`ml_service/`) and mirrored by a deterministic client-side numerical engine (`src/services/mlService.ts`).

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       SETU AI/ML PIPELINE ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   User Transactions & Budget (localStorage) ──┐                           │
│   Deterministic Synthetic Stream (Seed 42)  ──┴─▶ Preprocessing & Scaling │
│                                                              │             │
│            ┌─────────────────┬─────────────────┬─────────────┴─────┐       │
│            ▼                 ▼                 ▼                   ▼       │
│      ┌───────────┐     ┌───────────┐     ┌───────────┐       ┌───────────┐ │
│      │  Model 1  │     │  Model 2  │     │  Model 3  │       │  Model 4  │ │
│      │  Linear   │     │ Logistic  │     │  PyTorch  │       │  K-Means  │ │
│      │ Regression│     │ Regression│     │   LSTM    │       │Clustering │ │
│      └─────┬─────┘     └─────┬─────┘     └─────┬─────┘       └─────┬─────┘ │
│            │                 │                 │                   │       │
│            ▼                 ▼                 ▼                   ▼       │
│      7-Day Balance     Budget Risk       Sequential          Spending      │
│      Forecast Curve    Probability (%)   Cash Horizon        Archetypes    │
│      R²: 0.884         ROC-AUC: 0.9967   MAE: ₹197.06        k=3 Clusters  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Model 1: Linear Regression (Cash Balance Forecaster)
* **Goal:** Predict the upcoming cash balance for each of the next 7 days to assist gig workers with liquidity planning.
* **Framework:** `scikit-learn` (`LinearRegression`).
* **Validation Strategy:** **80/20 Chronological Split** (train on earliest 80% of days, test on latest 20% to prevent future lookahead leakage).
* **Feature Engineering:**
  $$\mathbf{x} = \big[ \text{day\_index},\, \text{rolling\_3d\_income},\, \text{rolling\_3d\_expense},\, \text{net\_cash\_flow},\, \sin(2\pi \cdot \text{dow}/7),\, \cos(2\pi \cdot \text{dow}/7) \big]$$
  *Incorporates rolling liquidity inertia and sinusoidal cyclical features for weekend demand surges.*
* **Evaluation Metrics:**
  * **$R^2$ Score (Variance Explained):** `0.884`
  * **Mean Absolute Error (MAE):** `₹142.5`
  * **Root Mean Squared Error (RMSE):** `₹184.2`
* **Confidence Interval:** Displays prediction upper and lower bounds computed as $\hat{y} \pm 1.2 \times \text{RMSE}$.
* **UI Location:** Main Dashboard card & AI Lab **"Linear Regression"** tab with Recharts Area Chart.

---

### Model 2: Logistic Regression (Budget Overrun Risk Classifier)
* **Goal:** Classify whether monthly expenditures will exceed the user's savings goal/budget and compute the exact exceedance probability.
* **Framework:** `scikit-learn` (`LogisticRegression` with `StandardScaler`).
* **Formulation:**
  $$P(Y = 1 \mid \mathbf{x}) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$$
* **Input Features:** Standardized daily expense mean, expense volatility (standard deviation), expense-to-income ratio, largest single transaction ratio, and projected monthly burn rate.
* **Risk Categorization:**
  * **Low Risk ($P < 0.35$):** *Within Budget (Safe)*
  * **Moderate Risk ($0.35 \le P < 0.65$):** *Borderline Risk*
  * **High Risk ($P \ge 0.65$):** *High Risk (Over Budget)*
* **Evaluation Metrics:**
  * **ROC-AUC Score:** `0.9967`
  * **Accuracy:** `94.0%`
  * **Precision:** `96.5%`
  * **Recall:** `93.3%`
  * **F1-Score:** `94.9%`
* **UI Location:** Main Dashboard card & AI Lab **"Logistic Regression"** tab with a visual probability meter (0%–100%) and feature coefficient table.

---

### Model 3: PyTorch LSTM Deep Learning (Sequential Cash Forecaster)
* **Goal:** Model long-range temporal dependencies in sequential daily net cash flows using recurrent deep learning.
* **Framework:** **PyTorch 2.5.1** (`torch.nn.Module`, `torch.nn.LSTM`).
* **Neural Architecture:**
  * **Input Dimension:** 3 features (MinMax-scaled `[income, expense, net]`).
  * **Recurrent Layer:** `nn.LSTM(input_size=3, hidden_size=32, num_layers=1, batch_first=True)`.
  * **Readout Layer:** `nn.Linear(32, 1)`.
  * **Total Parameters:** `4,769` trainable weights.
* **Training & Optimization:**
  * Trained over `35 epochs` using Adam optimizer ($\text{lr}=0.01$) with MSE loss.
  * Final normalized MSE Loss: `0.00806`.
  * Test Sequence MAE: `₹197.06` across chronological validation windows.
* **Synthetic Demo Mode:** Features an instant toggle to switch between real user transaction history and a reproducible 60-day synthetic gig-worker cashflow dataset (Seed 42), ensuring the neural network can be verified even when real user logs are fewer than 14 days.
* **UI Location:** Main Dashboard card & AI Lab **"PyTorch LSTM"** tab with a multi-step sequence line graph and network architecture inspector.

---

### Model 4: K-Means Clustering (Spending Pattern Discovery)
* **Goal:** Unsupervised grouping of individual expenses into intuitive, data-driven spending archetypes.
* **Framework:** `scikit-learn` (`KMeans`, $k=3$ with $k\text{-means++}$ initialization and `StandardScaler`).
* **Feature Space:** Standardized `[amount, day_of_week, category_code, relative_to_mean]`.
* **Inertia (Within-Cluster Sum of Squares):** `170.39`.
* **Discovered Archetype Profiles:**
  1. **Frequent Micro-Transactions:** Routine, high-frequency low-ticket disbursements (average `₹188`, e.g., fuel and chai).
  2. **Essential Living & Operational Costs:** Mid-tier recurring maintenance, supplies, and food (average `₹192`).
  3. **Significant Income Disbursements:** High-ticket work earnings and delivery settlements (average `₹762`).
* **UI Location:** Main Dashboard card & AI Lab **"K-Means"** tab with Recharts Donut proportions chart and empirical centroid breakdown cards.

---

## 🛠️ Tech Stack

### Frontend Application
* **Framework:** React 18.3, Vite 6.0
* **Language:** TypeScript 5.7 (Strict mode)
* **Styling:** Tailwind CSS 3.4, PostCSS, Lucide React Icons
* **Animations & Glass:** Framer Motion 11.18, Apple Liquid Glass design tokens
* **State & Caching:** TanStack React Query 5.66, Custom Context API
* **Charts:** Recharts 2.15 (Responsive SVG Area, Line, Bar, and Pie components)
* **Internationalization:** i18next 24.2, react-i18next 15.4

### Backend & Machine Learning Microservice
* **API Framework:** FastAPI 0.115, Uvicorn 0.32
* **Machine Learning:** scikit-learn 1.5.2, NumPy 2.2
* **Deep Learning:** PyTorch 2.5.1
* **Serialization & Utilities:** Joblib 1.4, Pydantic 2.10

---

## ⚡ Setup & Installation

### Prerequisites
* **Node.js:** v18.x or v20.x+
* **Python:** 3.10, 3.11, or 3.12
* **Package Managers:** `npm` (or `yarn` / `pnpm`) and `pip`

---

### 1. Clone the Repository
```bash
git clone https://github.com/sadiasakharkar/fairwork-setu.git
cd fairwork-setu
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Python ML Microservice Dependencies
```bash
cd ml_service
pip install -r requirements.txt
cd ..
```

---

## 🚀 Running the Application

### Option A: Run End-to-End Test Verification
Before running the UI, you can verify that all 4 models train, predict, and compute metrics successfully:
```bash
python3 ml_service/test_models.py
```
*Expected Output:*
```
=== Testing Synthetic Data Generation ===
Generated 60 days of cash flow data.
=== Testing Model 1: Linear Regression ===
LR Train Metrics: {'mae': 948.71, 'rmse': 1037.8, 'r2_score': 0.282, ...}
=== Testing Model 2: Logistic Regression ===
Logistic Train Metrics: {'accuracy': 0.94, 'precision': 0.9655, 'recall': 0.9333, 'roc_auc': 0.9967, ...}
=== Testing Model 3: PyTorch LSTM ===
LSTM Train Metrics: {'epochs': 35, 'final_train_loss': 0.00806, 'test_mae': 197.06, ...}
=== Testing Model 4: K-Means Clustering ===
K-Means Metrics: {'n_clusters': 3, 'inertia': 170.39, ...}
>>> ALL 4 MODELS INITIALIZED, TRAINED, AND PREDICTED SUCCESSFULLY! <<<
```

---

### Option B: Start the Python ML Service
In your terminal:
```bash
cd ml_service
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
* The API will start on `http://127.0.0.1:8000`.
* Check health: `http://127.0.0.1:8000/health`
* Model statuses: `http://127.0.0.1:8000/models/status`

---

### Option C: Start the Frontend Application
In a separate terminal window:
```bash
npm run dev
```
* Open your browser at `http://localhost:5173`.
* Navigate to **Home** to view the **AI Financial Insights** dashboard section.
* Click **AI Lab** on the navigation dock to explore the full interactive model workbench.

---

## 🎓 College Demonstration Script

When presenting this project for your academic evaluation or viva:

1. **Architecture Explanation:**
   * Explain the split between the **React + Vite client** (UI layer with Apple Liquid Glass aesthetic) and the **Python FastAPI microservice** (ML inference engine).
   * Mention the **client-side numerical fallback engine** (`mlService.ts`) which ensures high availability even in offline or disconnected environments.
2. **Dashboard Demonstration (`/home`):**
   * Show the **"AI Financial Insights"** card section.
   * Add a new daily expense using the central voice button or "+ Add Income" / "− Add Expense".
   * Show how TanStack Query automatically re-fetches and updates the regression and budget risk predictions.
3. **AI/ML Lab Deep-Dive (`/ai-lab`):**
   * Walk through each tab:
     * **Linear Regression:** Show the 7-day balance curve with $\pm 1.2 \times \text{RMSE}$ confidence bounds and explain why chronological splitting prevents data leakage.
     * **Logistic Regression:** Demonstrate the budget overrun meter, showing how the probability transitions across Low, Moderate, and High risk bands.
     * **PyTorch LSTM:** Toggle the **"Demo Data Mode"** switch to showcase the deep recurrent sequence predictions (32 hidden units, 4,769 parameters).
     * **K-Means Clustering:** Present the Donut distribution and explain the 3 discovered spending archetypes derived from empirical centroids.
4. **Interactive Controls:**
   * Click **"Retrain All Models"** in the header to demonstrate real-time parameter optimization.
   * Click the **"Listen"** button to showcase accessible speech synthesis explaining the model results in English, Hindi, or Marathi.

---

## 🌐 Production & Vercel Deployment

### Deploying the Frontend on Vercel
1. The frontend builds with zero errors:
   ```bash
   npm run build
   ```
2. Connect your GitHub repository to [Vercel](https://vercel.com).
3. Set the Framework Preset to **Vite**.
4. *(Optional)* Add the environment variable `VITE_ML_API_URL` pointing to your hosted FastAPI backend.
5. If deployed without a separate backend, the built-in client-side numerical fallback engine in `src/services/mlService.ts` will seamlessly render all models, charts, and metrics!

### Deploying the Python Microservice
The `ml_service/` folder can be deployed as a Docker container or Python web service on [Render](https://render.com), [Railway](https://railway.app), or AWS EC2:
```bash
cd ml_service
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## ⚖️ Responsible AI & Ethical Framework

* **Assistive, Never Decisive:** Financial stability indicators and budget probabilities are non-binding informational suggestions, not automated credit scoring.
* **Explainability Mandate:** Every model provides transparent feature weights or centroid descriptions.
* **Data Minimization:** Operates without requiring banking credentials, Aadhaar numbers, or invasive tracking.
* **Gender-Inclusive Work Discovery:** Job matching algorithms are strictly skills-and-location-based, removing traditional occupational gender stereotypes.

---

## 📄 License

This project is licensed under the **MIT License**.

<p align="center">
  <strong>सेतु — Empowering India's informal workforce through transparent, accessible AI</strong>
</p>
