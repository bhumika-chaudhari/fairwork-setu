# 🎓 Viva Voce & Technical Q&A Preparation Guide

This guide compiles **25 anticipated viva examination questions and answers** across machine learning, system design, data science, and ethics for the **FairWork Setu** project.

---

## 🤖 Section A: Machine Learning & Mathematics

### Q1: Why did you implement both Linear Regression and an LSTM? Isn't one regression model enough?
**Answer:**
> *"Linear Regression and LSTM serve complementary purposes in our architecture:*
> 1. *Linear Regression models static, one-step-ahead closing balance based on aggregate daily features ($X$). It is fast, mathematically closed-form via OLS, highly explainable, and computes exact analytical confidence intervals.*
> 2. *However, Linear Regression treats consecutive days as independent and identically distributed (i.i.d.), ignoring temporal order. In the gig economy, earnings have strong temporal autocorrelation and weekly periodicity (e.g., weekend surges and multi-day fatiguing effects). The LSTM Recurrent Neural Network processes a 7-day sliding window sequence, preserving chronological momentum and non-linear multi-day interactions that static regression misses."*

---

### Q2: How did you select the optimal number of clusters ($k$) in K-Means?
**Answer:**
> *"We determined $k=4$ using a three-stage validation protocol:*
> 1. *The **Elbow Method**: We evaluated Within-Cluster Sum of Squares (Inertia) from $k=2$ to $k=7$. The inflection point ('elbow') occurred at $k=4$, where marginal reduction in inertia plateaued.*
> 2. *The **Silhouette Analysis**: The mean Silhouette Coefficient ($s(i) = \frac{b(i)-a(i)}{\max(a(i), b(i))}$) reached its global maximum of approximately $0.48$ at $k=4$, indicating tight intra-cluster cohesion and well-separated boundaries.*
> 3. *The **Davies-Bouldin Index**: Lower values indicate better separation. It reached a local minimum of $0.82$ at $k=4$.*
> *Qualitatively, $k=4$ cleanly maps to realistic domain personas: High-Mileage Delivery Riders, Disciplined Savers, Rent/Debt-Strained Workers, and Volatile Hand-to-Mouth Workers."*

---

### Q3: How did you handle class imbalance in the Logistic Regression deficit model?
**Answer:**
> *"In our dataset, acute deficit days represent roughly 25–30% of total days (minority class). To prevent the classifier from biasing toward the majority solvent class, we implemented two strategies:*
> 1. *Used `class_weight='balanced'` in Scikit-Learn. This automatically adjusts weights inversely proportional to class frequencies: $w_j = \frac{N}{2 \cdot N_j}$.*
> 2. *Tuned the **decision threshold** down from the default $0.50$ to **$0.45$**. In financial early warning systems, a False Negative (failing to alert a worker of imminent deficit) is significantly more detrimental than a False Positive (a precautionary alert). Lowering the threshold boosts **Recall** to ~89% without severe precision degradation."*

---

### Q4: What is the significance of the Odds Ratio in Logistic Regression?
**Answer:**
> *"Because Logistic Regression models the log-odds ($\ln \frac{p}{1-p} = \mathbf{w}^T \mathbf{x}$), exponentiating the learned weight gives the Odds Ratio: $\text{OR}_j = \exp(w_j)$.*
> *If a feature like `emergency_repair_cost` has $\text{OR} = 2.4$, it means that for every 1-unit standardized increase in emergency expense, the odds of entering a budget deficit multiply by 2.4. Conversely, `liquid_savings_buffer` has $\text{OR} = 0.42$, indicating a protective mitigating effect."*

---

### Q5: Why did you use synthetic data instead of scraping live Swiggy or Uber data? Is synthetic data academically valid?
**Answer:**
> *"Using synthetic data is an intentional and academically grounded choice for three reasons:*
> 1. *Gig platforms (Swiggy, Zomato, Uber) strictly prohibit public scraping and consider worker earnings proprietary data.*
> 2. *Gathering real financial records from vulnerable gig workers without Institutional Review Board (IRB) ethics clearance and strict data protection agreements would raise serious privacy risks.*
> 3. *Our synthetic data generator (`synthetic_data.py`) is grounded in published empirical literature from Fairwork India and NITI Aayog gig economy reports. It simulates realistic distributions, weekend surges (1.25x–1.4x multipliers), realistic fuel expenditures (30–45% of gross earnings), and emergency vehicle breakdown frequencies. All generation uses fixed random seeds for complete academic reproducibility."*

---

### Q6: How do you prevent overfitting in the LSTM model?
**Answer:**
> *"We applied three regularizers in the PyTorch architecture:*
> 1. *Added an explicit `dropout=0.2` layer between the recurrent LSTM layers.*
> 2. *Applied L2 weight decay ($10^{-4}$) inside the Adam optimizer to penalize excessively large weights.*
> 3. *Kept the model lightweight (hidden dimension of 32 and 2 layers) rather than over-parameterizing.*
> 4. *Enforced a strict **chronological train/test split** (80% train, 20% test without shuffling) so the model is always evaluated on strictly unseen future time horizons."*

---

## 💻 Section B: System Design & Engineering

### Q7: What happens if the FastAPI backend service crashes or the user has no internet connection?
**Answer:**
> *"The frontend is engineered with an **Offline-First Fallback Architecture** in `src/services/mlService.ts`. When an API call to `http://127.0.0.1:8000` times out or fails:*
> 1. *The service catches the network exception and smoothly switches to a local client-side statistical engine.*
> 2. *It computes exponential moving averages, historical daily burn rates, and rule-based heuristic projections directly in TypeScript.*
> 3. *The UI displays a non-blocking indicator (`is_synthetic` or `demo_mode`) without crashing or freezing."*

---

### Q8: How does the Multilingual Number Parser handle Devanagari numerals and spoken words?
**Answer:**
> *"Our custom engine in `src/lib/multilingualNumberParser.ts` executes in three sequential stages:*
> 1. *Unicode Normalization: Directly maps Devanagari numerals `[०-९]` to standard digits `[0-9]`.*
> 2. *Lexical Token Matching: Scans strings for Hindi and Marathi spoken numbers (e.g., 'दोनशे' $\rightarrow 200$, 'पांच सौ' $\rightarrow 500$, 'हज़ार' $\rightarrow 1000$).*
> 3. *Multiplier & Compound Combination: Handles vernacular modifiers like 'ढाई सौ' (250) or 'डेढ़ हज़ार' (1500) and extracts context keywords ('पेट्रोल', 'स्विगी') to associate the amount with the correct category."*

---

### Q9: Why did you choose React + Vite instead of a standard mobile framework like React Native / Android Studio?
**Answer:**
> *"We developed Setu as a high-performance **Progressive Web App (PWA)** using React 18, Vite, and Tailwind CSS:*
> 1. *It provides universal cross-platform compatibility across any mobile browser (Chrome on budget Android phones) without requiring heavy APK installations on low-storage devices.*
> 2. *Vite enables instantaneous development compilation and small bundle footprints.*
> 3. *The design system adheres to mobile-first viewport constraints (fixed bottom navigation, touch targets $\ge 48\text{px}$, high-contrast typography) to ensure optimal usability for field workers."*

---

### Q10: How does the Financial Stability Score work? Is it an automated credit rating?
**Answer:**
> *"No, it is strictly an **informational self-reflection index (0–100)**. It computes a weighted composite across 5 factors:*
> 1. *Savings Rate (30% weight)*
> 2. *Cash Flow Regularity / Consistency (25% weight)*
> 3. *Expense-to-Income Ratio (20% weight)*
> 4. *Emergency Buffer Days (15% weight)*
> 5. *Budget Adherence (10% weight)*
> *It explicitly displays a disclaimer that it cannot be used for commercial credit underwriting, protecting workers against predatory automated profiling."*

---

## ⚖️ Section C: Ethics, Limitations & Future Work

### Q11: What are the main limitations of your current project?
**Answer:**
> *"The key limitations are:*
> 1. *The core ML models currently train on simulated benchmark distributions rather than multi-year real bank statements.*
> 2. *The speech engine relies on the browser's Web Speech API, which requires browser support and internet access for high-accuracy Indic transcription.*
> 3. *Job listings and welfare schemes are curated demonstration datasets rather than live government API feeds."*

### Q12: If you had 6 more months, what would you implement next?
**Answer:**
> *"We would focus on:*
> 1. *Exporting our PyTorch LSTM models to **ONNX / TFLite runtime** to run inference entirely on-device inside client JavaScript/WASM with zero server latency.*
> 2. *Integrating India's **Account Aggregator (AA) framework** for automated UPI transaction ingestion with user consent.*
> 3. *Fine-tuning an open-source lightweight Indic LLM (like Sarvam AI or Llama 3 8B) for natural voice conversations in rural dialects."*
