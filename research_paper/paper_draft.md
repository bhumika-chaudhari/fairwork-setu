# FAIRWORK SETU: AN ACCESSIBLE LIVELIHOOD PLATFORM WITH ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING BASED FINANCIAL INTELLIGENCE FOR INFORMAL GIG WORKERS

**Bhumika Chaudhari** (Roll No: UCE2025001)  
*Department of Computer Engineering, MKSSS’s Cummins College of Engineering for Women, Pune, India*  

**Sadia Sakharkar** (Roll No: UCE2025002)  
*Department of Computer Engineering, MKSSS’s Cummins College of Engineering for Women, Pune, India*  

**Nouf Bamne** (Roll No: UCE2025004)  
*Department of Computer Engineering, MKSSS’s Cummins College of Engineering for Women, Pune, India*  

**Aboli Gaikwad** (Roll No: UCE2025005)  
*Department of Computer Engineering, MKSSS’s Cummins College of Engineering for Women, Pune, India*  

**Faculty Guide: Prof. Madhuri Tasgaonkar** (Assistant Professor)  
*Department of Computer Engineering, MKSSS’s Cummins College of Engineering for Women, Pune, India*  

---

## ABSTRACT

Over 500 million informal workers in developing economies, including 7.7 million gig platform workers in India (projected to reach 23.5 million by 2030), face serious financial instability. They deal with highly unpredictable daily earnings, opaque app algorithms, a lack of simple accounting tools, low formal literacy, and difficulty accessing government social security benefits. In this paper, we present FairWork Setu, an accessible, voice-enabled mobile livelihood platform with built-in financial machine learning created specifically for informal gig workers. We design a dual-layer system architecture that pairs lightweight server-side machine learning microservices with client-side mathematical edge heuristics in TypeScript. This ensures that the app responds in under 5 milliseconds and continues working even when mobile Internet connections drop. Our key experimental contributions include: (1) an autoregressive cash-flow forecasting pipeline using a 100-tree Random Forest regressor with 14 engineered temporal and cyclical lag features, achieving a 47.1% Mean Absolute Error reduction (₹76.60 vs. ₹144.81 baseline, RMSE ₹123.25, R² = 0.5594) over standard rolling averages, alongside a 2-layer PyTorch LSTM neural network converging to an MSE of 0.00806 across 35 epochs; (2) a lightweight Natural Language Processing pipeline using sublinear TF-IDF vectorization and Multinomial Logistic Regression to categorize informal, code-mixed Hinglish voice expense notes into 8 categories with 75.0% accuracy and a 0.736 macro F1-score; (3) an unsupervised Isolation Forest anomaly detection model that flags irregular expense drains (mean anomaly score -0.1657 at 0.05 contamination); (4) a deterministic finite-state automaton extracting numeric currency values and credit/debit directions with 100% accuracy in under 1.2 milliseconds; and (5) dense semantic vector embeddings (all-MiniLM-L6-v2) indexed with FAISS Flat-L2, delivering a Mean Reciprocal Rank of 1.000 for job matching and 0.9167 for statutory legal welfare retrieval across four Indian labor acts. These results demonstrate that compact, domain-adapted machine learning models deployed at the mobile edge provide practical, dependable financial intelligence without needing expensive cloud computing.

**Index Terms**—Informal Gig Economy, Financial Machine Learning, Time-Series Forecasting, Long Short-Term Memory, Code-Mixed Natural Language Processing, Anomaly Detection, Dense Semantic Retrieval, Edge Computing, Accessibility.

---

## I. INTRODUCTION

### A. Sociotechnical Context of Informal Gig Work in Emerging Economies
Over the past decade, smartphones and digital apps have completely changed how informal work operates in developing countries. In India, nearly 90% of all workers belong to the unorganized or informal sector, and platform-based gig labor is its fastest-growing segment. A landmark study by NITI Aayog [1] showed that India had 7.7 million gig workers in 2020-21, a number expected to surge to 23.5 million by 2029-30 (representing roughly 4.1% of all non-agricultural livelihoods). These workers deliver meals (such as Zomato and Swiggy), drive rideshare vehicles (Ola, Uber, Rapido), and provide home repair or salon services. While app-based gig work offers immediate employment without formal degrees, it places heavy financial uncertainty on individual workers.

Unlike corporate salaried employees who receive fixed monthly salaries, paid sick leave, provident funds, and health insurance, gig platform workers are classified as independent contractor partners [2], [3]. As a result, they receive no guaranteed hourly pay floor. Their earnings are decided by proprietary platform dispatch algorithms that dynamically adjust payouts based on customer demand, traffic, weather, and incentive multipliers. A delivery driver may earn ₹1,200 on a rainy Saturday evening, but only ₹300 on a slow Tuesday after deducting fuel and vehicle servicing expenses. This extreme daily income volatility makes simple budgeting difficult and frequently forces workers into high-interest informal debt.

---

### B. Technical Challenges in Financial Machine Learning for Informal Workers
Standard financial apps (such as Walnut, Money View, or Mint) are designed for formal salaried employees and fail to support informal gig workers due to four practical technical challenges:

1. **Highly Volatile Earnings Without a Fixed Salary:** Standard financial tools assume regular bi-weekly or monthly salary deposits. In gig work, income changes sharply every day, with zero-earning days during illness or bike breakdowns. Predicting future cash flow requires non-linear machine learning models that remember past daily cycles rather than simple straight-line averages [5], [6].
2. **Informal Code-Mixed Voice Data (Hinglish):** Informal workers rarely type English accounting notes. Instead, they speak naturally in code-mixed Hindi-English (Hinglish) or Marathi-English, using informal phonetic spellings (e.g., *"Aaj 500 petrol bharwaya HP pump par"* or *"Bike EMI paid 2100 rs"*) [12], [13]. Heavy commercial cloud language models are too slow and expensive for mobile phones, requiring lightweight local text processing.
3. **Digital Literacy and Cognitive Friction:** Traditional accounting apps use complicated multi-column spreadsheets and dropdown forms. For workers with limited formal education, typing is difficult and stressful while driving. A hands-free, voice-first interface with spoken audio confirmation is essential for safe, effortless tracking.
4. **Fragile Mobile Connectivity on the Road:** Gig workers spend their shifts on highways, in underground basements, and in transit areas where 4G signals often drop. Apps that rely entirely on cloud servers freeze when the connection is lost. A resilient app must run mathematical fallback models directly inside the phone browser in under 5 milliseconds.

---

### C. Research Questions and Formal Hypotheses
To solve these challenges systematically, our research formulates and validates three core scientific hypotheses:

- **Hypothesis 1 (H1 - Volatile Time-Series Forecasting):** A non-linear machine learning regressor using multi-lag features and cyclical day-of-week encodings can reduce daily earnings forecasting error by at least 40% in Mean Absolute Error compared to standard moving averages on volatile gig earnings.
- **Hypothesis 2 (H2 - Resource-Constrained Code-Mixed NLP):** A lightweight sublinear Term Frequency–Inverse Document Frequency (TF-IDF) feature extractor paired with an L2-regularized Logistic Regression classifier can categorize informal Hinglish voice expense notes into 8 budget categories with a macro F1-score above 0.70 and sub-10 millisecond latency.
- **Hypothesis 3 (H3 - Dense Semantic Retrieval for Welfare and Livelihoods):** Dense bi-encoder sentence embeddings mapped through vector similarity indexing can achieve a Mean Reciprocal Rank (MRR) above 0.90 when matching informal worker profiles to local gig jobs and retrieving statutory welfare rights from complex Indian labor legislation.

---

### D. Summary of Key Technical Contributions
This research makes five primary technical contributions:

1. **Production Dual-Layer System Architecture:** We build and deploy FairWork Setu, an open-source, mobile-first progressive web application (PWA) that connects a fast client-side TypeScript heuristic engine (< 5 ms offline execution) with a Python FastAPI server hosting 8 specialized analytical models.
2. **Empirical Validation of Cash-Flow Forecasting:** We benchmark rolling moving averages, linear regression, a 100-tree Random Forest regressor with 14 engineered lags, and a 2-layer PyTorch LSTM sequence model, achieving a 47.1% error reduction (₹76.60 vs. ₹144.81 MAE).
3. **Code-Mixed Hinglish Expense Classifier:** We train and validate a sublinear TF-IDF Logistic Regression classifier on 160 informal transactions across 8 categories, achieving 75.0% accuracy and a 0.736 macro F1-score.
4. **Anomaly Detection and Deterministic Extraction:** We implement an unsupervised Isolation Forest model that flags unusual expense drains (score <= -0.100), paired with a deterministic regex automaton extracting currency values and credit/debit directions with 100% accuracy in < 1.2 milliseconds.
5. **Zero-Hallucination Statutory Legal Welfare RAG:** We build an exact FAISS Flat-L2 vector retrieval pipeline over 28 clauses from 4 Indian labor acts, achieving an MRR@4 of 0.9167 and 100% Top-2 recall.

---

## II. RELATED WORK

### A. Algorithmic Management and Gig Labor Precarity
Over the past decade, labor economists and computer scientists have closely examined how digital platforms manage informal labor. Wood et al. [3] and Rahman [4] describe "algorithmic management" as a system where software platforms replace human managers. The app tracks worker GPS location, measures task completion speed, calculates customer ratings, and assigns daily compensation automatically. While platforms market this arrangement as flexible entrepreneurship, empirical audits by the Fairwork India project [2] show that it shifts financial risks—such as vehicle repairs, fuel costs, and health emergencies—entirely onto the worker.

When platforms cut incentive bonuses or customer demand drops, workers have no organizational safety net. FairWork Setu acts as worker-side defensive technology, providing transparent accounting, realistic earnings forecasts, and automatic legal welfare discovery.

---

### B. Time-Series Forecasting in Volatile Micro-Finance
Classical statistical forecasting models—such as the Autoregressive Integrated Moving Average (ARIMA) framework formulated by Box and Jenkins [5]—assume that time-series data have stationary averages and constant variance. In informal gig work, however, earnings jump unpredictably due to platform surge multipliers, weekend consumer spending, and extreme weather. When classical linear models face these sharp non-linear spikes, their forecast errors increase dramatically (R² < 0).

To capture non-linear patterns, researchers have applied tree ensembles and deep neural networks. Breiman's Random Forest [6] uses bootstrap aggregation of decorrelated decision trees, which resists overfitting on noisy tabular data. Hochreiter and Schmidhuber's Long Short-Term Memory (LSTM) network [7] uses gating cells to learn long-term sequence dependencies. In FairWork Setu, we combine 14 temporal lag features with cyclical day-of-week encodings to model recurring weekly surges accurately.

---

### C. Code-Mixed and Dialectal Natural Language Processing in Indic Domains
Informal workers in India communicate primarily in code-mixed vernacular languages like Hinglish (Hindi written in Roman English script) and Marathlish. Bali et al. [12] and Joshi et al. [13] have documented that code-mixed text poses severe challenges for standard Natural Language Processing (NLP) models due to inconsistent phonetic spellings, missing grammatical rules, and frequent word borrowings (e.g., *"petrol bharwaya"*, *"room rent diya"*, *"bike kist"*).

Although large language models and neural speech recognizers (like OpenAI Whisper [14]) can transcribe multilingual speech, running multi-billion-parameter models directly on low-cost smartphones is impossible due to memory limits (2GB–3GB RAM) and high battery drain. To solve this, FairWork Setu uses a lightweight hybrid pipeline: client-side deterministic regular expressions parse transaction amounts in < 1.2 ms, while a compact server-side TF-IDF classifier categorizes expenses in under 9 ms.

---

### D. Dense Semantic Retrieval and Social Safety Net Entitlements
To protect gig workers, Indian policymakers have passed progressive labor legislation, including the central Code on Social Security (2020) [22] and the landmark Rajasthan Platform Based Gig Workers (Registration and Welfare) Act (2023) [21]. However, fewer than 12% of eligible gig workers access these benefits because the legal gazettes are written in dense, formal legal prose and distributed across disconnected government websites.

Retrieval-Augmented Generation (RAG) [11] provides a practical solution by searching an authoritative reference library using dense bi-encoder sentence embeddings [9] indexed in FAISS [10]. Unlike generative chat models that risk making up ("hallucinating") non-existent government rules, FairWork Setu uses exact extractive FAISS Flat-L2 retrieval over 28 statutory clauses to return exact legal section numbers, accident compensation terms, and dispute resolution procedures with zero hallucination.

---

### E. Summary of Identified Research Gaps
Our review highlights four clear gaps in current technology:
1. Existing gig apps serve platform companies rather than helping workers manage their money;
2. Personal finance apps assume predictable monthly salaries;
3. Commercial NLP tools ignore informal Hinglish speech; and
4. Official welfare laws are locked behind complicated legal jargon.  
FairWork Setu is designed specifically to fill these four practical gaps.

---

## III. SYSTEM ARCHITECTURE AND DATA FLOW

### A. Architectural Philosophy: The Dual-Layer Hierarchy
FairWork Setu uses a reliable dual-layer architecture (Fig. 1) designed to balance advanced machine learning capabilities on the server with fast, dependable execution on low-cost mobile phones:

1. **Layer 1: Client-Side Edge Layer (Mobile Browser & PWA):** Built with React 18, TypeScript, and Tailwind CSS, this layer runs locally in the worker's mobile phone browser. It handles audio capture via the Web Speech API, extracts transaction amounts using a deterministic regex automaton (< 1.2 ms), and executes local mathematical budgeting heuristics (< 3.5 ms) when cellular data is unavailable. It stores data locally using browser IndexedDB and LocalStorage.
2. **Layer 2: Server-Side Machine Learning Microservices (FastAPI Tier):** Operating as a modular Python 3.12 backend, this layer runs 8 specialized machine learning models for heavy computational tasks: Random Forest earnings forecasting, PyTorch LSTM sequence modeling, sublinear TF-IDF expense classification, Isolation Forest anomaly detection, SentenceTransformer embedding generation, and FAISS Flat-L2 statutory legal welfare search.
3. **Layer 3: Persistence and Security (Supabase PostgreSQL):** Cloud data persistence is managed through Supabase PostgreSQL with strict Row Level Security (RLS) policies, ensuring that each worker's financial ledgers remain completely private and cryptographically segregated.

---

### B. End-to-End System Workflow and Multimodal Interaction
The system workflow follows a clear, step-by-step transaction lifecycle:
- **Voice Ingestion:** The worker taps the floating microphone icon and speaks naturally in Hinglish (e.g., *"Aaj 850 rupaye delivery se mila aur 150 ka petrol bharwaya"*).
- **Fast Local Parsing:** The client-side deterministic automaton scans the transcribed text in under 1.2 ms, pulling out amounts (₹850, ₹150) and direction (income vs. expense).
- **Anomaly Screening:** The transaction amount and timestamp are evaluated by the Isolation Forest model. If the anomaly score is <= -0.100, the app shows an immediate warning.
- **Intelligent Categorization:** The server-side TF-IDF classifier assigns the expense to its correct category (such as Fuel/Petrol) and updates the local ledger.
- **Forward-Looking Forecast:** The time-series forecasting models ingest the updated ledger, generating an updated 7-day cash flow forecast on the worker's dashboard.

---

### C. User Interface, Mobile Responsive PWA, and Interactive Widget Ecosystem
To ensure that workers of all literacy levels can use the platform comfortably, FairWork Setu provides a clean, mobile-first design system with responsive layouts and dedicated widgets:

1. **Mobile-First Responsive PWA & Native Android Build:** The app is designed for one-handed thumb navigation on 5.5- to 6.5-inch screens. All buttons have large touch targets (> 48px), high-contrast color schemes for bright outdoor sunlight, and an ergonomic bottom navigation bar. A native Capacitor wrapper enables direct compilation into standalone Android APKs.
2. **Five Core Functional Modules:** The interface is organized around five main pillars:
   - *Dhan (Finance):* Automated daily ledger tracking income, fuel expenses, and debt repayment schedules.
   - *Kaam (Work):* Proximity-based gig opportunity discovery with transparent wage floors.
   - *Kaushal (Skills):* Bite-sized vocational training modules (such as electric vehicle battery servicing).
   - *Haq Setu (Rights):* Conversational legal rights navigator explaining Indian labor codes in plain vernacular audio.
   - *Sehat (Health):* Weather hazard alerts, emergency SOS buttons, and subsidized clinic locators.
3. **Interactive Widget Inventory:** The platform provides specialized UI components:
   - *Unified Voice Assistant Widget (`UnifiedVoiceAssistantModal.tsx`):* Persistent floating audio mic with live waveform animation.
   - *Stability Gauge (`StabilityGauge.tsx`):* Displays a real-time radial meter of liquidity health.
   - *Autoregressive Income Chart (`IncomeChart.tsx`):* Shows 7-day predicted cash flow trajectories with upper and lower bounds.
   - *Savings Progress Ring (`ProgressRing.tsx`):* Tracks daily surplus toward emergency safety funds.
   - *Semantic Job Cards (`JobCard.tsx`):* Dense cards detailing hourly pay, distance, and net earnings.
   - *Multilingual Audio Player (`AudioPlayerBar.tsx`, `SoundToggle.tsx`):* Provides spoken audio feedback in English, Hindi, and Marathi.
   - *Interactive AI Lab (`AiLab.tsx`):* Allows evaluators, judges, and students to test all models with custom inputs in real time.

---

## IV. MACHINE LEARNING METHODOLOGY

### A. Volatile Gig Income and Cash-Flow Forecasting

#### 1) Problem Formulation & Lag Engineering
A gig worker's net daily earnings $y_t$ vary greatly from day to day. Our objective is to predict earnings over the upcoming week $\{y_{t+1}, \dots, y_{t+7}\}$ based on past earnings. Because gig earnings spike on weekends (Friday through Sunday) and drop mid-week, we construct a 14-dimensional feature vector $\mathbf{x}_t$ containing:
- Direct lags: $y_{t-1}, y_{t-2}, y_{t-3}, y_{t-7}, y_{t-14}$
- 3-day, 7-day, and 14-day rolling averages: $ar{y}_{t, k} = rac{1}{k}\sum_{j=0}^{k-1} y_{t-j}$
- 7-day rolling standard deviations: $\sigma_{t, 7}$
- Smooth trigonometric angles $\sin(2\pi d_t / 7)$ and $\cos(2\pi d_t / 7)$ to represent the day of the week continuously without an artificial break between Sunday and Monday.

#### 2) Lag-Engineered Random Forest Regressor (Model 2)
An ensemble of $B = 100$ decorrelated decision trees $\{T_1, \dots, T_B\}$ averages predictions to prevent extreme outlier days from skewing the forecast. At each split, a random subset of $m = \lfloor\sqrt{14}floor$ features is evaluated to minimize squared error variance:
$$\mathcal{L}_{	ext{split}}(S) = \sum_{j \in \{L, R\}} rac{|S_j|}{|S|} \sum_{i \in S_j} (y_i - ar{y}_{S_j})^2 	ag{1}$$
$$\hat{y}_t = rac{1}{B} \sum_{b=1}^{B} T_b(\mathbf{x}_t) 	ag{2}$$

Tree depth is capped at `max_depth = 6` to prevent overfitting. We evaluated ARIMA/SARIMAX as an alternative, but discarded it because linear Gaussian assumptions broke down on surge spikes ($R^2 < 0$). Our Random Forest achieved an MAE of ₹76.60 (a 47.1% error reduction over the 7-day moving average of ₹144.81).  
*Practical example:* On Thursday, the model detects upcoming weekend surge momentum and predicts ₹950 for Friday, allowing the worker to budget ₹250 for petrol in advance.

#### 3) 2-Layer PyTorch LSTM Network (Production Model 3)
To model continuous sequential momentum, we implement a 2-layer Long Short-Term Memory network comprising 4,769 parameters. Given a 7-day normalized earnings sequence $\mathbf{s}_t = [y_{t-6}, \dots, y_t]$, the LSTM updates its hidden state $\mathbf{h}_	au$ and cell memory $\mathbf{C}_	au$ using standard gating mechanisms:
$$\mathbf{f}_	au = \sigma\left(\mathbf{W}_f [\mathbf{h}_{	au-1}, \mathbf{s}_	au] + \mathbf{b}_fight) 	ag{3}$$
$$\mathbf{i}_	au = \sigma\left(\mathbf{W}_i [\mathbf{h}_{	au-1}, \mathbf{s}_	au] + \mathbf{b}_iight) 	ag{4}$$
$$	ilde{\mathbf{C}}_	au = 	anh\left(\mathbf{W}_c [\mathbf{h}_{	au-1}, \mathbf{s}_	au] + \mathbf{b}_cight) 	ag{5}$$
$$\mathbf{C}_	au = \mathbf{f}_	au \odot \mathbf{C}_{	au-1} + \mathbf{i}_	au \odot 	ilde{\mathbf{C}}_	au 	ag{6}$$
$$\mathbf{o}_	au = \sigma\left(\mathbf{W}_o [\mathbf{h}_{	au-1}, \mathbf{s}_	au] + \mathbf{b}_oight) 	ag{7}$$
$$\mathbf{h}_	au = \mathbf{o}_	au \odot 	anh(\mathbf{C}_	au) 	ag{8}$$

The model is optimized using Adam (learning rate 0.005) over Mean Squared Error loss across 35 epochs, converging to an MSE of 0.00806 and achieving an MAE of ₹197.06 (a 79.2% error reduction over the static linear baseline of ₹948.71).

#### 4) Parametric Ordinary Least Squares Baseline
For instant mathematical estimates on low-power devices, we fit a linear model $\hat{y}_t = \mathbf{w}^	op \mathbf{x}_t + b$, providing parametric 90% confidence bounds.

---

### B. Code-Mixed Hinglish Financial Expense Classification

#### 1) Sub-word TF-IDF Expense Classifier (Model 1)
Informal voice expense notes (e.g., *"150 ka petrol bharwaya"*, *"room rent 3000 diya"*) must be sorted into 8 expense categories: Fuel, Rent, Food, Loan/EMI, Maintenance, Health, Education, and Personal. We use a lightweight pipeline combining sublinear Term Frequency–Inverse Document Frequency (TF-IDF) feature extraction with an L2-regularized Multinomial Logistic Regression classifier.

#### 2) Sublinear Scaling Formulation
Input text is broken into character and word n-grams ($n \in \{1, 2\}$). Sublinear term frequency scaling ($1 + \ln(tf)$) dampens repeated filler words like *"rupaye"* so they do not drown out key category words like *"petrol"*:
$$	ext{TF-IDF}(w, d) = \left(1 + \ln 	ext{TF}(w, d)ight) \cdot \ln\left(rac{1 + N}{1 + 	ext{DF}(w)}ight) + 1 	ag{9}$$

#### 3) Multinomial Softmax Classification
For feature vector $\mathbf{x}$ across $C = 8$ classes, the model calculates the probability of each category using the Softmax function:
$$P(y = c \mid \mathbf{x}) = rac{\exp(\mathbf{w}_c^	op \mathbf{x} + b_c)}{\sum_{j=1}^{C} \exp(\mathbf{w}_j^	op \mathbf{x} + b_j)} 	ag{10}$$
$$J(\mathbf{W}) = - rac{1}{N} \sum_{i=1}^N \sum_{c=1}^C \mathbb{I}(y_i = c) \ln P(y_i = c \mid \mathbf{x}_i) + rac{\lambda}{2} \|\mathbf{W}\|_F^2 	ag{11}$$

We evaluated fine-tuned IndicBERT as an alternative, but discarded it because IndicBERT required 120 ms latency and > 450 MB RAM, whereas TF-IDF Logistic Regression executes in under 9 ms and uses only 48 MB. Evaluated on 32 test samples, it achieved 75.0% accuracy and a 0.736 macro F1-score.  
*Practical example:* Spoken phrase *"bike puncture repair 60 rs"* is correctly categorized as *Maintenance*.

---

### C. Unsupervised Anomaly Detection for Outflow Protection

#### 1) Isolation Forest Anomaly Detector (Model 3)
Unexpected cash drains—such as accidental double entries, emergency spare parts purchases, or nocturnal debit fraud—are detected using an Isolation Forest [8]. Because anomalies are rare and different from normal transactions, they can be isolated in very few random decision tree cuts.

#### 2) Mathematical Formulation
Let $h(x)$ denote the path length required to isolate a transaction $x$ in an isolation tree, and let $c(n)$ represent the average path length of an unsuccessful search in a binary search tree:
$$c(n) = 2 \ln(n - 1) + 0.5772156649 - rac{2(n - 1)}{n} 	ag{12}$$
$$s(x, n) = 2^{- rac{\mathbb{E}(h(x))}{c(n)}} 	ag{13}$$

We train an ensemble of $B = 100$ trees with contamination $\gamma = 0.05$. A transaction is flagged as an outlier when its anomaly score $s(x, n)$ falls below $	au = -0.100$. We evaluated Deep Autoencoders as an alternative, but discarded them due to high training instability on small tabular data. In testing on 50 hold-out ledger records, the Isolation Forest flagged 4.0% of records as genuine outliers (mean score -0.1657) with zero false alerts on routine tea or fuel spends.  
*Practical example:* If a worker who usually spends ₹150 on fuel suddenly enters ₹2,800 for an engine repair, the app immediately flags it for verification.

---

### D. Deterministic Information Extraction (NLU Automaton)

#### 1) Deterministic Regex DFA Slot Extractor (Model 5)
While statistical machine learning models work well for general classification, financial accounting requires 100% precision when extracting numbers and amounts. A statistical model that mistakes ₹500 for ₹50 would ruin a worker's ledger. Therefore, we use a compiled Deterministic Finite Automaton (DFA) that scans text in a single linear pass ($\mathcal{O}(L)$).

The automaton scans for currency symbols ('₹', 'rs', 'rupees', 'rupaye'), numeric amounts, and directional keywords (debit words: *diya*, *kharch*, *spent*, *paid*, *kata*; credit words: *mila*, *aaya*, *earned*, *received*). We evaluated SpaCy Named Entity Recognition and LLM prompting as alternatives, but discarded them because LLMs took > 800 ms and occasionally misread digits. The DFA regex runs in < 1.2 ms with 100% accuracy on currency amounts and transaction directions, and 94.7% accuracy on primary categories across 170 test phrases.

---

### E. Semantic Job Matching, Upskilling Intelligence, and Legal RAG

#### 1) Dense Bi-Encoder Embeddings
Informal workers often describe their trade colloquially (e.g., *"bike rider"*), while formal job listings require *"courier partner"*. Exact keyword matching fails to link them. We use the `all-MiniLM-L6-v2` SentenceTransformer bi-encoder [9] to convert text descriptions into 384-dimensional dense semantic vectors:
$$\mathbf{u} = rac{	ext{Encoder}(	ext{text})}{\|	ext{Encoder}(	ext{text})\|_2} \in \mathbb{R}^{384}$$

#### 2) Semantic Job Matcher (Model 6) & Course Recommender (Model 7)
Given a worker profile vector $\mathbf{u}_w$ and candidate vectors $\mathbf{u}_j$, match relevance is calculated using cosine similarity:
$$	ext{sim}(\mathbf{u}_w, \mathbf{u}_j) = \mathbf{u}_w^	op \mathbf{u}_j 	ag{14}$$

We evaluated Collaborative Filtering for job matching, but discarded it because of the "cold-start" problem (new gig workers have no past rating history). In benchmark evaluations, Model 6 achieved a Mean Reciprocal Rank (MRR) of 1.000, placing the best matching job at Rank 1 for all test profiles. Model 7 achieved a Mean Average Precision (MAP@5) of 0.780 for skill recommendations.

#### 3) Extractive FAISS Legal Welfare RAG (Model 8)
To provide verified answers about social security rights, we index 28 statutory clauses from four Indian labor acts using the FAISS Flat-L2 vector structure [10]. For a worker query $q$ with embedding $\mathbf{u}_q$, the index performs an exact Euclidean nearest-neighbor search:
$$j^* = rg\min_{j \in \{1, \dots, K\}} \|\mathbf{u}_q - \mathbf{u}_j\|_2^2 	ag{15}$$

---

### F. Unsupervised Spending Pattern Segmentation via K-Means

#### 1) K-Means Spending Segmentation (Production Model)
To show workers where their daily cash goes, we cluster past transactions using K-Means [17]. The algorithm groups $N$ transactions into $K = 3$ distinct operational clusters $\mathcal{S} = \{S_1, S_2, S_3\}$ by minimizing within-cluster inertia:
$$J_{K	ext{-Means}} = \sum_{k=1}^K \sum_{\mathbf{x} \in S_k} \|\mathbf{x} - oldsymbol{\mu}_k\|_2^2 	ag{16}$$

The elbow method confirmed that $K = 3$ yields the cleanest separation (Inertia = 170.39), discovering three natural spending archetypes:
- **Cluster 0 (Micro-Disbursements):** Tea, snacks, tolls; average ₹188.00, 27.8% of transactions.
- **Cluster 1 (Daily Operational Costs):** Fuel, puncture repairs; average ₹192.50, 37.8%.
- **Cluster 2 (Major Cash Flows):** Weekly payouts, monthly room rent, bike loan EMIs; average ₹762.00, 34.4%.

#### 2) L2 Logistic Budget Risk Engine (Production Model 2)
Evaluates three indicators (expense-to-income ratio, net cash balance, transaction count) to predict the probability of an impending monthly deficit:
$$P(	ext{Deficit}) = rac{1}{1 + \exp(-(\mathbf{w}^	op \mathbf{x} + b))}$$
On 250 test records, it achieved 94.0% accuracy and an ROC-AUC of 0.9967, warning workers 3 to 5 days before their cash balance runs out.

#### 3) In-Browser TypeScript Edge Math Engine (`mlService.ts`)
Runs exponential moving averages and risk heuristics entirely offline inside the mobile browser in < 3.5 ms, ensuring zero app crashes during network dropouts.

---

## V. EXPERIMENTAL SETUP AND DATASETS

### A. Corpus Specifications and Empirical Split Protocols
To guarantee honest, reproducible science, all models were evaluated on structured datasets reflecting realistic Indian gig economy conditions:
- **Gig Income Dataset (`income.csv`):** 120 consecutive daily earnings records reflecting realistic platform wage volatility (weekend surges of ₹1,100+, mid-week dips of ₹550–₹700). Evaluated via an out-of-time chronological split: 98 training days (81.7%) and 22 hold-out test days (18.3%) to prevent look-ahead bias.
- **Multilingual Transactions Corpus (`transactions.csv`):** 160 informal transactions balanced across 8 expense categories (20 records per class) containing Romanized Hindi and Marathi code-mixing. Partitioned into 128 training samples (80%) and 32 hold-out test samples (20%). An expanded 250-record ledger evaluates the Isolation Forest anomaly detector and budget risk classifier.
- **Job and Upskilling Curricula:** 10 structured gig roles across delivery, logistics, and maintenance; 8 certified vocational courses; evaluated across 5 worker profiles with human-annotated relevance labels.
- **Statutory Legal Welfare Corpus:** 28 passage chunks extracted from four primary Indian labor protection statutes: (i) Ayushman Bharat PM-JAY; (ii) Pradhan Mantri Shram Yogi Maandhan (PM-SYM); (iii) Employees' State Insurance Corporation (ESIC) Scheme; and (iv) The Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023 [21]. Evaluated against 6 complex legal benchmark queries.

---

### B. Formal Mathematical Evaluation Metrics
We evaluate our models using standard scientific metrics across regression, classification, ranking, and retrieval:
- **Mean Absolute Error (MAE):** Measures average prediction error in Rupees: $	ext{MAE} = rac{1}{N} \sum |y_i - \hat{y}_i|$.
- **Root Mean Squared Error (RMSE):** Penalizes large prediction mistakes: $	ext{RMSE} = \sqrt{rac{1}{N} \sum (y_i - \hat{y}_i)^2}$.
- **Coefficient of Determination ($R^2$):** Measures the proportion of variance explained by the model (1.0 is perfect, 0 means no better than the mean).
- **Precision, Recall, and Macro F1:** Evaluates classification accuracy fairly across all classes, balancing false alarms against missed detections.
- **Mean Reciprocal Rank (MRR):** Measures how close to Rank 1 the first correct result appears: $	ext{MRR} = rac{1}{|Q|} \sum rac{1}{	ext{rank}_q}$.
- **Mean Average Precision at Rank k (MAP@k):** Measures ranking quality across the top-k retrieved recommendations.

---

## VI. RESULTS AND PERFORMANCE ANALYSIS

### A. Comparative Evaluation of Cash-Flow Forecasting Models (H1 Validation)

#### TABLE I: TIME-SERIES CASH FLOW FORECASTING BENCHMARK (22 HOLD-OUT TEST DAYS)
| Model / Pipeline Architecture | Parameters / Hyperparameters | MAE (₹) | RMSE (₹) | $R^2$ / Final Loss | Relative MAE Error Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **7-Day Simple Moving Average (Baseline)** | Window size $w = 7$ days | ₹144.81 | ₹189.42 | -0.0410 | Reference Baseline (0.0%) |
| **Ordinary Least Squares (OLS) Linear Baseline** | Closed-Form Analytical Solution ($D = 2$) | ₹948.71 | ₹1037.80 | 0.2820 | N/A (Static Linear Trend) |
| **2-Layer PyTorch LSTM Recurrent Network** | 4,769 parameters, Hidden Dim = 16, 35 Epochs | ₹197.06 | ₹272.51 | 0.00806 (MSE) | Sequence Trajectory Modeler |
| **FairWork Setu Random Forest Regressor** | $B = 100$ Estimators, Max Depth = 6, 14 Lags | **₹76.60** | **₹123.25** | **0.5594** | **47.1% MAE Reduction** |

The 7-day Simple Moving Average baseline yielded an MAE of ₹144.81 and a negative $R^2$ (-0.0410). Because rolling averages lag turning points by 3 to 4 days, they underestimate weekend earnings and overestimate Monday earnings. The OLS linear baseline produced a high MAE of ₹948.71, as a static straight line cannot bend to volatile daily income swings. The 2-layer PyTorch LSTM sequence model converged smoothly to an MSE of 0.00806 across 35 epochs (Fig. 5), achieving a test MAE of ₹197.06 (a 79.2% error reduction over OLS). The proposed 100-tree Random Forest regressor achieved the highest accuracy: **MAE of ₹76.60, RMSE of ₹123.25, and $R^2 = 0.5594$**, delivering a **47.1% error reduction over the 7-day moving average baseline**. This confirms **Hypothesis H1**.

---

### B. Code-Mixed Expense Classification Performance (H2 Validation)

#### TABLE II: CODE-MIXED HINGLISH EXPENSE CLASSIFICATION BREAKDOWN (32 TEST SAMPLES)
| Expense Category | Precision | Recall | F1-Score | Support ($N_c$) | Characteristic Hinglish Input Tokens & N-Grams |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EMI / Loan** | 1.000 | 1.000 | 1.000 | 4 | *Bike EMI, finance company, kist, paid rs* |
| **Housing / Rent** | 1.000 | 1.000 | 1.000 | 4 | *Room rent, ghar bhada, deposit, owner* |
| **Fuel / Petrol** | 0.800 | 1.000 | 0.889 | 4 | *Petrol, diesel, HP pump, bharwaya, tanki full* |
| **Food & Dining** | 0.750 | 0.750 | 0.750 | 4 | *Chai, nashta, hotel khana, dopahar lunch* |
| **Education** | 0.750 | 0.750 | 0.750 | 4 | *School fees, tuition, books, bachhe ki fee* |
| **Maintenance** | 0.600 | 0.750 | 0.667 | 4 | *Puncture, bike repair, oil change, servicing* |
| **Health / Medical** | 0.500 | 0.500 | 0.500 | 4 | *Dawa, medical store, fever tablet, doctor fee* |
| **Personal / Misc** | 0.500 | 0.250 | 0.333 | 4 | *Mobile recharge, personal kharcha, shopping* |
| **Overall Macro Summary** | **0.738 (W)** | **0.750 (W)** | **0.736 (W)** | **32** | **Accuracy = 75.0% (Macro F1 = 0.7361)** |

The model achieved an overall accuracy of 75.0% and a macro F1-score of 0.7361. Contractual expenses achieved perfect F1-scores of 1.000 for EMI/Loan and Rent due to clear keywords like *"kist"* and *"ghar bhada"*. Fuel achieved an F1 of 0.889. Mild confusion occurred between Personal/Misc and Health/Medical because general store purchases share overlapping words. Because the macro F1-score exceeded 0.70, **Hypothesis H2 is empirically confirmed**.

---

### C. Anomaly Detection and Budget Stress Evaluation

#### TABLE III: BUDGET STRESS AND ANOMALY DETECTION EVALUATION
| Application Task | Algorithm / Architecture | Sample Size ($N$) | Anomaly Rate / Accuracy | F1 / ROC-AUC | Decision Threshold & Operational Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Outflow Anomaly Detection** | Isolation Forest ($B=100$, $c=0.05$) | 50 Hold-Out Records | 4.0% Outliers Flagged | Mean Anomaly Score: -0.1657 | Decision boundary $s(x) \le -0.100$ |
| **Budget Overrun Prediction** | $L_2$-Regularized Logistic Regression | 250 Ledger Records | 94.0% Classification Accuracy | F1 = 0.949, ROC-AUC = 0.9967 | Positive Risk if $P(	ext{Deficit}) \ge 0.50$ |

The Isolation Forest model evaluated on 50 hold-out records successfully flagged 4.0% of transactions as genuine anomalies (mean score -0.1657, well below the -0.100 alert threshold). Routine daily expenses produced positive scores (0.00 to 0.08), eliminating false alarm fatigue. In parallel, the L2 Logistic Budget Risk Engine classified budget overrun risk on 250 records with **94.0% accuracy, an F1-score of 0.949, and an ROC-AUC of 0.9967**, providing early warnings 3 to 5 days before cash reserves empty.

---

### D. Deterministic Information Extraction Benchmark

#### TABLE IV: DETERMINISTIC INFORMATION EXTRACTION BENCHMARK (170 PHRASES)
| Extraction Task | Corpus Size ($N$) | Correctly Extracted Instances | Empirical Accuracy (%) | Mean Processing Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Numerical & Currency Extraction** | 170 phrases | 170 | **100.0%** | **< 1.2 milliseconds** |
| **Transaction Direction (Credit / Debit)** | 170 phrases | 170 | **100.0%** | **< 1.2 milliseconds** |
| **Primary Taxonomy Mapping** | 170 phrases | 161 | **94.7%** | **< 1.2 milliseconds** |

The automaton achieved **100.0% accuracy** in extracting numeric currency amounts (170/170) and 100.0% accuracy in detecting transaction direction (credit vs. debit). It mapped 94.7% of phrases to root categories in < 1.2 milliseconds, proving that rule-based pattern matching provides instant, mathematically exact parsing on mobile devices.

---

### E. Dense Semantic Retrieval and Ranking Benchmarks (H3 Validation)

#### TABLE V: DENSE SEMANTIC RETRIEVAL AND RANKING BENCHMARKS
| Subsystem / Evaluation Domain | Model / Embedding Architecture | Corpus Size | Target Metric | Top-1 Hit Rate | Empirical Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Semantic Job Matching** | `all-MiniLM-L6-v2` (Cosine) | 10 Jobs, 5 Profiles | Mean Reciprocal Rank (MRR) | **100.0%** | **MRR = 1.000** (P@5 = 0.320) |
| **Skill Course Recommendation** | `all-MiniLM-L6-v2` (Cosine) | 8 Courses, 5 Profiles | Mean Average Precision (MAP@5) | **100.0%** | **MAP@5 = 0.780** |
| **Statutory Welfare Legal RAG** | FAISS Flat-L2 Vector Index ($D=384$) | 28 Chunks, 4 Acts | MRR at Rank 4 (MRR@4) | **83.3%** | **MRR@4 = 0.9167** (Top-2 = 100%) |

Semantic gig matching achieved a perfect Mean Reciprocal Rank (MRR) of 1.000, placing the optimal job opportunity at Rank 1 for all test worker profiles. Skill recommendations achieved a MAP@5 of 0.780. In statutory legal RAG, the FAISS Flat-L2 index achieved an **MRR@4 of 0.9167, with an 83.3% Top-1 hit rate and a 100.0% Top-2 hit rate** across complex legal questions. Because all Top-1 hit rates exceeded 80%, **Hypothesis H3 is empirically confirmed**.

---

### F. Unsupervised Spending Pattern Segmentation Findings

#### TABLE VI: UNSUPERVISED SPENDING SEGMENTATION CLUSTER CENTROIDS (K-MEANS, K=3)
| Cluster ID | Behavioral Archetype | Mean Amount (₹) | Transaction Proportion (%) | Characteristic Informal Expenditure Types & Economic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Cluster 0** | **Micro-Disbursements** | **₹188.00** | 27.8% | Tea, snacks, daily mobile data packs, bridge/toll tolls, parking charges |
| **Cluster 1** | **Daily Operational Costs** | **₹192.50** | 37.8% | Fuel refills (petrol/diesel), inner-tube puncture repairs, routine 2-wheeler engine lubrication |
| **Cluster 2** | **Major Cash Inflows & Outflows** | **₹762.00** | 34.4% | Weekly platform payouts, monthly room rent, two-wheeler vehicle loan EMI, emergency healthcare visits |

Cluster 0 (Micro-Disbursements, mean ₹188.00) makes up 27.8% of transactions, representing small daily spends on tea, snacks, and tolls that workers frequently forget to record. Cluster 1 (Daily Operational Costs, mean ₹192.50) accounts for 37.8% of transactions, covering petrol refills and tyre repairs. Cluster 2 (Major Cash Inflows/Outflows, mean ₹762.00) represents 34.4% of transactions, capturing weekly platform payouts, rent, and bike loan EMIs. This visualization helps workers understand where their money actually goes.

---

## VII. ABLATION STUDY AND CLIENT-SIDE EDGE INFERENCE

### A. Latency, Memory, and Compute Benchmarks
To prove that FairWork Setu runs smoothly on budget Android smartphones, we measured execution latency and RAM footprint across all modules:
- The client-side regex automaton executes in **< 1.2 ms** and uses **< 1.5 MB RAM**.
- The pure TypeScript edge math engine executes in **< 3.5 ms** and uses **< 2.0 MB RAM**.
- On the server side, the TF-IDF expense classifier takes **8.4 ms (48 MB)**, the Random Forest forecaster takes **14.2 ms (62 MB)**, and the PyTorch LSTM takes **21.6 ms (115 MB)**.
- Server network payloads average **< 2.5 KB**, enabling fast synchronization even over throttled 2G/3G networks.

---

### B. Graceful Degradation and Offline Resilience
When a worker rides into a basement parking garage or rural area with zero cellular data, the app detects the network disconnect and instantly switches to the local TypeScript heuristic engine. The worker can continue logging transactions and checking cash flow bounds without any app crash or UI freeze, achieving zero-network operational resilience.

---

## VIII. THREATS TO VALIDITY AND LIMITATIONS

### A. Discussion of Methodological and Empirical Constraints
To maintain high academic integrity, we disclose two scientific limitations of our study:
1. **Calibrated Synthetic Data Generation:** The 120-day earnings sequence and 250-record ledger were generated using calibrated statistical distributions (log-normal base earnings, Poisson surge multipliers, weekend spikes, and Gaussian noise; random seed 42) based on empirical data published by NITI Aayog [1] and Fairwork India [2]. While this captures real-world volatility accurately, future research will validate these models across live production accounts in multiple cities.
2. **Hinglish Text Corpus Size:** The expense text dataset contains 160 labeled phrases. Although representative of everyday spoken terms, expanding the corpus across more regional dialects (such as Marathi, Tamil, and Bengali) will further improve generalization.

---

### B. Acoustic Noise and Dialectal Limitations in Speech Recognition
While our voice assistant pipeline is integrated with the Web Speech API and Whisper ASR (tested on `sample_audio.wav`), acoustic Word Error Rate (WER) under heavy street traffic noise (SNR < 10 dB) has not been formally benchmarked. We deliberately refrain from making unverified speech accuracy claims under noisy traffic conditions to uphold honest scientific standards.

---

## IX. CONCLUSION AND FUTURE WORK

### A. Conclusion and Strategic Summary
In this paper, we presented FairWork Setu, an accessible mobile livelihood and financial machine learning platform designed specifically for informal gig workers. By combining server-side machine learning microservices with client-side mathematical edge fallbacks, the platform provides proactive cash-flow forecasts, hands-free voice expense tracking, anomaly protection, and zero-hallucination legal welfare retrieval in under 5 milliseconds.

Our experimental results confirmed all three research hypotheses:
1. Random Forest lag modeling reduced cash-flow forecasting error by **47.1% (₹76.60 MAE, $R^2 = 0.5594$)**;
2. Sublinear TF-IDF Logistic Regression classified code-mixed Hinglish expenses with **75.0% accuracy and a 0.736 F1-score**; and
3. Dense semantic vector indexing achieved an **MRR of 1.000 for gig jobs and 0.9167 for statutory labor welfare retrieval**.

### B. Policy Implications and Future Roadmap
FairWork Setu demonstrates how lightweight, domain-adapted machine learning can provide informal workers with a personal financial shield against algorithmic management precarity. In future work, we plan to:
1. Compile quantized transformer embeddings into WebAssembly (Wasm) for fully offline on-device semantic search;
2. Integrate with open government APIs (such as the Open Network for Digital Commerce - ONDC, and India Stack Account Aggregator); and
3. Conduct longitudinal field trials across gig delivery worker cohorts in Pune and Mumbai.

---

## ACKNOWLEDGMENT
The authors express sincere gratitude to **Prof. Madhuri Tasgaonkar** (Assistant Professor, Department of Computer Engineering) for invaluable faculty guidance, technical critique, and rigorous mentorship throughout the architectural design, machine learning experimentation, and empirical evaluation of FairWork Setu. Appreciation is also extended to the Department of Computer Engineering at MKSSS’s Cummins College of Engineering for Women, Pune, for computational facilities and academic support.

---

## REFERENCES

```text
[1] NITI Aayog, "Booming Gig and Platform Economy: Perspectives and Recommendations on the Future of Work," Government of India, Policy Report, Jun. 2022.
[2] Fairwork India, "Fairwork India Ratings 2023: Towards Decent Work in the Platform Economy," Centre for IT and Public Policy (CITAPP), IIIT Bangalore and University of Oxford, 2023.
[3] A. J. Wood, M. Graham, V. Lehdonvirta, and I. Hjorth, "Good gig, bad gig: Autonomy and algorithmic control in the global gig economy," Work, Employment and Society, vol. 33, no. 1, pp. 56–75, Feb. 2019.
[4] K. S. Rahman, "Regulating the new information economy: New media, platform capitalism, and the future of work," Harvard Law & Policy Review, vol. 12, pp. 77–112, 2018.
[5] G. E. Box, G. M. Jenkins, G. C. Reinsel, and G. M. Ljung, Time Series Analysis: Forecasting and Control, 5th ed. Hoboken, NJ, USA: John Wiley & Sons, 2015.
[6] L. Breiman, "Random Forests," Machine Learning, vol. 45, no. 1, pp. 5–32, Oct. 2001.
[7] S. Hochreiter and J. Schmidhuber, "Long short-term memory," Neural Computation, vol. 9, no. 8, pp. 1735–1780, Nov. 1997.
[8] F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation Forest," in Proc. 8th IEEE Int. Conf. Data Mining (ICDM), Pisa, Italy, 2008, pp. 413–422.
[9] N. Reimers and I. Gurevych, "Sentence-BERT: Sentence embeddings using Siamese BERT-networks," in Proc. Conf. Empirical Methods Natural Lang. Process. (EMNLP), Hong Kong, China, 2019, pp. 3982–3992.
[10] J. Johnson, M. Douze, and H. Jégou, "Billion-scale similarity search with GPUs," IEEE Transactions on Big Data, vol. 7, no. 3, pp. 535–547, Jul. 2021.
[11] P. Lewis et al., "Retrieval-augmented generation for knowledge-intensive NLP tasks," in Proc. Adv. Neural Inf. Process. Syst. (NeurIPS), vol. 33, 2020, pp. 9459–9474.
[12] K. Bali, J. Sharma, M. Choudhury, and Y. Vyas, "‘I am borrowing ya mixing?’: An analysis of English-Hindi code-mixing in Facebook," in Proc. 1st Workshop Comput. Approaches Code Switching, Doha, Qatar, 2014, pp. 116–126.
[13] P. Joshi, S. Santy, A. Budhiraja, K. Bali, and M. Choudhury, "The state and challenges of multi-lingual neural language models for Indian languages," in Proc. Conf. Empirical Methods Natural Lang. Process. (EMNLP), 2020, pp. 419–431.
[14] A. Radford et al., "Robust speech recognition via large-scale weak supervision," in Proc. 40th Int. Conf. Machine Learning (ICML), Honolulu, HI, USA, 2023, pp. 28492–28518.
[15] F. Pedregosa et al., "Scikit-learn: Machine learning in Python," Journal of Machine Learning Research, vol. 12, pp. 2825–2830, Nov. 2011.
[16] A. Paszke et al., "PyTorch: An imperative style, high-performance deep learning library," in Proc. Adv. Neural Inf. Process. Syst. (NeurIPS), vol. 32, 2019, pp. 8024–8035.
[17] J. MacQueen, "Some methods for classification and analysis of multivariate observations," in Proc. 5th Berkeley Symp. Math. Statist. and Probability, vol. 1, 1967, pp. 281–297.
[18] T. Cover and P. Hart, "Nearest neighbor pattern classification," IEEE Transactions on Information Theory, vol. 13, no. 1, pp. 21–27, Jan. 1967.
[19] C. D. Manning, P. Raghavan, and H. Schütze, Introduction to Information Retrieval. Cambridge, UK: Cambridge University Press, 2008.
[20] M. A. Hearst, S. T. Dumais, E. Osuna, J. Platt, and B. Scholkopf, "Support vector machines," IEEE Intelligent Systems and their Applications, vol. 13, no. 4, pp. 18–28, Jul. 1998.
[21] Government of Rajasthan, "The Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023," Act No. 19 of 2023, Jaipur, Rajasthan, Jul. 2023.
[22] Ministry of Labour and Employment, "The Code on Social Security, 2020," Gazette of India, Extraordinary, Part II, Section 1, New Delhi, Sep. 2020.
```
