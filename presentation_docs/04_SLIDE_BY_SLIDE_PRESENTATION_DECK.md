# 📊 Slide-by-Slide Presentation Deck & Speaking Script

This guide provides the exact slide layout, content, visuals, and verbal script for presenting **FairWork Setu** in your 5th Semester AIML Mini Project evaluation or conference demo.

**Total Target Duration:** 10 to 12 minutes (including demo and QA).

---

## 📑 Slide Outline

* **Slide 1:** Title, Team Members, and Academic Affiliation
* **Slide 2:** Motivation & The Reality of 450 Million Gig Workers
* **Slide 3:** Problem Statement & Research Questions
* **Slide 4:** Proposed Solution: FairWork Setu (The 4 Pillars)
* **Slide 5:** System Architecture & Technology Stack
* **Slide 6:** Multilingual & Voice-First Natural Language Pipeline
* **Slide 7:** Machine Learning Model 1 — OLS Linear Regression (Cash Flow Forecast)
* **Slide 8:** Machine Learning Model 2 — Logistic Regression (Deficit Risk Classification)
* **Slide 9:** Machine Learning Model 3 — PyTorch LSTM (Deep Sequential Forecasting)
* **Slide 10:** Machine Learning Model 4 — K-Means Clustering (Spending Archetypes)
* **Slide 11:** Interactive AI Lab & Academic Testbench
* **Slide 12:** Experimental Results, Metrics & Model Comparison
* **Slide 13:** Ethics, Data Privacy & Fairness Safeguards
* **Slide 14:** Future Scope & Conclusion
* **Slide 15:** Thank You & Q&A

---

### Slide 1: Title & Introduction
* **Slide Header:** सेतु — FairWork Setu
* **Subtitle:** AI-Powered Livelihood Companion for India's Informal & Gig Workers
* **Details:** 5th Semester Mini Project | Department of Artificial Intelligence & Machine Learning
* **Presenter Script:**
  > *"Respected guide and honorable evaluators, good morning. Today, we are proud to present our 5th Semester AIML project: 'Setu — An AI-Powered Livelihood Companion for India's Informal and Gig Workers'. Setu, meaning 'bridge', connects India's unorganized workforce with financial predictability, fair opportunities, health protections, and recognized credentials through practical artificial intelligence."*

---

### Slide 2: Motivation & Background
* **Slide Header:** The Informal Economy Dilemma
* **Visuals:** Bar chart of 450M unorganized workers; icons for delivery rider, cab driver, domestic worker.
* **Key Points:**
  * 450M informal workers in India; 12M+ active platform gig workers.
  * Extreme income volatility governed by algorithmic surge pricing and seasonal demand.
  * Absence of formal employment contracts, monthly payslips, or financial safety nets.
  * Low digital literacy and language barriers preventing adoption of traditional fintech apps.
* **Presenter Script:**
  > *"India's informal economy is massive, accounting for over 90% of our total workforce. However, platforms like Swiggy, Zomato, and Uber subject workers to severe cash flow volatility. Because they earn and spend on a daily cash and UPI basis, traditional banking apps built for salaried professionals fail them completely. They lack resumes, credit scores, and access to the welfare schemes designed for them."*

---

### Slide 3: Problem Statement
* **Slide Header:** Key Challenges Addressed
* **Bullet Points:**
  1. **Cash Flow Precarity:** How can a daily-wage worker foresee budget deficits before running out of cash?
  2. **Vernacular Accessibility:** How can non-literate workers track money without typing English words?
  3. **Skill Invisibility:** How can informal years of work experience be converted into portable digital credentials?
  4. **Welfare Disconnect:** How can workers discover verified government social security schemes without middleman exploitation?
* **Presenter Script:**
  > *"This brings us to our core research challenge: Can we develop a voice-first, bilingual artificial intelligence system that models volatile daily cash flows, segments spending behavior, and provides proactive financial and career empowerment for gig workers?"*

---

### Slide 4: Proposed Solution: The 4 Pillars
* **Slide Header:** Setu: A 4-Pillar Ecosystem
* **Visuals:** 4 distinct modular cards (Kaam, Dhan, Sehat, Kaushal).
* **Key Points:**
  * **काम (Kaam):** Fair-pay gig matching without opaque commission cuts.
  * **धन (Dhan):** Daily voice ledger, ML cash flow forecasting, and interactive financial calendar.
  * **सेहत (Sehat):** Welfare scheme finder (e-Shram, PM-JAY) and fatigue management alerts.
  * **कौशल (Kaushal):** Automatic Digital Skill Passport generator with QR verification.
* **Presenter Script:**
  > *"To solve these multifaceted challenges, Setu is organized into four distinct modules: 'Kaam' for fair work opportunities; 'Dhan' for financial forecasting and tracking; 'Sehat' for health and government social security; and 'Kaushal' for skill credentialing."*

---

### Slide 5: System Architecture
* **Slide Header:** 3-Tier System Architecture
* **Visuals:** Architecture diagram (React/Vite Frontend $\leftrightarrow$ TypeScript Client Services $\leftrightarrow$ FastAPI ML Microservice $\leftrightarrow$ Scikit-Learn & PyTorch).
* **Key Points:**
  * **Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
  * **Backend Microservice:** FastAPI asynchronous Python backend serving ML inference.
  * **Resilience:** Automatic fallback client engine ensuring uninterrupted offline usage.
  * **Storage:** Browser-native LocalStorage with local timezone consistency.
* **Presenter Script:**
  > *"Our system follows a decoupled 3-tier architecture. The client layer is built with React 18, TypeScript, and Vite for instant mobile responsiveness. The intelligence layer runs on a FastAPI Python microservice running Scikit-Learn and PyTorch. If the worker is offline or connectivity drops, our client service gracefully falls back to local heuristic calculations without breaking the UI."*

---

### Slide 6: Voice-First & Indic NLU Pipeline
* **Slide Header:** Voice-First Vernacular Accessibility
* **Visuals:** Audio waveform $\rightarrow$ Devanagari text $\rightarrow$ Extracted Amount (₹) & Category badge.
* **Key Points:**
  * Web Speech API integration for Hindi, Marathi, and English voice capture.
  * Custom Indic numeral parser handling Devanagari numerals (`०-९`) and vernacular words (*"दोनशे"*, *"पांच सौ"*, *"हज़ार"*).
  * 100% deterministic keyword and regex intent classification for categories (Fuel, Food, Medicine, Tips).
* **Presenter Script:**
  > *"Typing amounts is often a friction point for field workers. With Setu's voice engine, a delivery rider simply says: 'आज पेट्रोल का 150 रुपया खर्च हुआ'. Our Indic NLU engine normalizes spoken Hindi and Marathi words, parses Devanagari numerals, and automatically tags the transaction as a ₹150 Fuel expense in under 50 milliseconds."*

---

### Slide 7: ML Model 1 — OLS Linear Regression
* **Slide Header:** Daily Cash Flow & Balance Forecast
* **Formula:** $\hat{y} = \beta_0 + \sum \beta_j X_j + \epsilon$
* **Key Highlights:**
  * **Target:** Next-day net closing cash balance in ₹.
  * **Features:** Hours worked, trips completed, weekend indicator, daily income/expenses, fuel ratio, 7-day rolling average.
  * **Performance:** $R^2 = 0.963$, MAE $= ₹28.40$, RMSE $= ₹36.20$.
  * **Output:** 7-day projected cash flow curve with 95% confidence intervals on the Dhan screen.
* **Presenter Script:**
  > *"Our first model is an Ordinary Least Squares Linear Regression. It models daily net cash balance based on 8 engineered operational features. Achieving an R-squared of over 0.96 on benchmark data, it plots a 7-day forward trajectory with upper and lower confidence intervals, allowing workers to plan upcoming expenditures safely."*

---

### Slide 8: ML Model 2 — Logistic Regression
* **Slide Header:** Budget Overrun & Deficit Early Warning
* **Formula:** $P(Y=1 \mid \mathbf{x}) = \frac{1}{1 + e^{-(\beta_0 + \mathbf{w}^T \mathbf{x})}}$
* **Key Highlights:**
  * **Target:** Binary risk classification ($1 = \text{Deficit Risk}, 0 = \text{Solvent}$).
  * **Features:** Expense-to-income ratio, emergency repair costs, daily EMI, liquid buffer, missed platform bonuses.
  * **Metrics:** ROC-AUC $= 0.941$, F1-Score $= 0.88$, Balanced Accuracy $= 89.2\%$.
  * **Decision Threshold:** Tuned to $0.45$ to prioritize high recall and prevent unnotified financial distress.
* **Presenter Script:**
  > *"Our second model is an L2-regularized Logistic Regression classifier designed as an early warning system. By evaluating emergency expenses and liquid buffers, it predicts whether the worker will face a budget deficit. We tuned the decision threshold to 0.45 because in worker financial safety, missing a deficit warning has far worse consequences than a false alarm."*

---

### Slide 9: ML Model 3 — PyTorch LSTM Neural Network
* **Slide Header:** Sequential Deep Learning Time-Series
* **Architecture:** 2-Layer LSTM (Hidden size=32, Dropout=0.2) + Dense Head (Linear 32 $\rightarrow$ 16 $\rightarrow$ 1).
* **Key Highlights:**
  * **Input:** 7-day sliding window tensor $(B, 7, 3)$ tracking $[Income, Expense, Net]$.
  * **Temporal Memory:** Captures weekly cyclicality (weekend spikes) and autoregressive momentum that static regression ignores.
  * **Metrics:** Test RMSE $= ₹45.10$, MAPE $= 5.8\%$, Directional Accuracy $= 85.3\%$.
* **Presenter Script:**
  > *"Because gig earnings exhibit weekly cycles and temporal dependencies, static models have limits. We built a 2-layer LSTM recurrent neural network in PyTorch. Taking a 7-day window of income, expenses, and net savings, the LSTM learns temporal momentum, delivering a multi-day sequential forecast with an average error of less than 6%."*

---

### Slide 10: ML Model 4 — K-Means Clustering
* **Slide Header:** Unsupervised Spending Persona Segmentation
* **Objective:** $J = \sum_{k} \sum \|\mathbf{x} - \boldsymbol{\mu}_k\|^2$ using `k-means++`.
* **Key Highlights:**
  * **Optimal $k=4$:** Validated via the Elbow Method, Silhouette Score ($0.48$), and Davies-Bouldin Index ($0.82$).
  * **The 4 Personas:**
    1. *High-Mileage Delivery Riders:* Heavy fuel expenditure (45%), moderate food.
    2. *Disciplined Savers:* High savings rate (40%), balanced expenses.
    3. *Rent & Debt Strained:* Over 50% tied up in fixed housing and loan EMI.
    4. *Hand-to-Mouth Volatile Workers:* High subsistence food costs, volatile daily earnings.
* **Presenter Script:**
  > *"Every gig worker has different financial habits. We implemented unsupervised K-Means clustering across 6 spending and volatility features. Through Silhouette analysis and the Elbow method, we discovered 4 clear archetypes: high-mileage riders, disciplined savers, debt-strained workers, and volatile daily-wage earners. This enables Setu to tailor micro-savings nudges specifically to their profile."*

---

### Slide 11: Interactive AI Lab
* **Slide Header:** The AI Lab — Live Model Evaluation Testbench
* **Visuals:** Screenshot of `AiLabPage.tsx` showing training cards, metric badges, and interactive sliders.
* **Key Highlights:**
  * Real-time training and inference trigger from the browser UI.
  * Live inspection of model weights, confusion matrices, and loss convergence.
  * Dual-mode operation: Benchmark Synthetic Data vs. Live User Data.
* **Presenter Script:**
  > *"A standout feature of our project is the AI Lab page. Rather than treating machine learning as a black box, the AI Lab provides a live interactive testbench where evaluators can trigger model retraining, inspect confusion matrices, examine feature weights, and test live predictions directly from the browser."*

---

### Slide 12: Experimental Results & Model Comparison
* **Slide Header:** Quantitative Comparative Evaluation
* **Comparison Table:**
  * Linear Regression: Fast, explainable baseline, excellent for 1-day cash balance ($R^2 = 0.96$).
  * Logistic Regression: High interpretability via Odds Ratios, ideal for binary risk thresholding ($\text{AUC} = 0.94$).
  * LSTM Network: Best for multi-day sequential seasonality and non-linear patterns ($\text{MAPE} = 5.8\%$).
  * K-Means: Zero-label discovery of behavioral segments ($\text{Silhouette} = 0.48$).
* **Presenter Script:**
  > *"Here we summarize our comparative evaluation. Linear regression provides rapid, explainable single-day balance forecasts. Logistic regression gives interpretable odds ratios for deficit risk. PyTorch LSTM excels at capturing multi-day cyclicality, while K-Means segments worker behavior without requiring manual labels."*

---

### Slide 13: Ethics, Privacy & Fairness
* **Slide Header:** Ethical AI & Data Privacy Safeguards
* **Key Points:**
  * **Informational Only:** Clear disclaimers that Setu does not make automated credit or employment denials.
  * **On-Device Data Sovereignty:** Personal ledgers remain inside local client storage; no centralized selling of worker data.
  * **Fair Wages Benchmark:** Job recommendations adhere to regional minimum wage living standards.
* **Presenter Script:**
  > *"Ethics and worker dignity are central to Setu. We follow strict data minimization: transaction ledgers remain stored on the client. Our algorithms are strictly informational—we never penalize workers with automated loan rejections or algorithmic blacklisting. Every job listed must meet regional fair pay benchmarks."*

---

### Slide 14: Future Scope & Conclusion
* **Slide Header:** Conclusion & Future Enhancements
* **Key Points:**
  * **On-Device TFLite / ONNX:** Running LSTM models directly inside low-end mobile devices without internet.
  * **Full Multilingual Voice Assistant:** End-to-end Indic LLM integration via open-source models (Llama 3 / Sarvam AI).
  * **Direct UPI & Account Aggregator API Integration:** Automated ledger sync with consent.
  * **Official Recognition:** Partnering with state BOCW boards and gig unions for verified Skill Passports.
* **Presenter Script:**
  > *"In conclusion, FairWork Setu proves that artificial intelligence can be tailored to the realities of India's unorganized workforce. In the future, we plan to convert our LSTM models to ONNX runtime for on-device inference and integrate Account Aggregator APIs. Thank you, and we now welcome your questions."*
