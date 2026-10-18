# 🎬 Live Project Demo Walkthrough Script

Follow this step-by-step procedure to execute a flawless 5-minute live demonstration of **FairWork Setu** for evaluators and external examiners.

---

## 🛠️ Step 0: Pre-Demo Setup & Service Launch

Open two terminal tabs in the project root:

### Terminal 1: Launch FastAPI ML Microservice
```powershell
cd "d:\5th sem\AIML\project\ml_service"
python -m uvicorn main:app --reload --port 8000
```
*Verify:* Open `http://127.0.0.1:8000/docs` in your browser to confirm Swagger UI is active with all 4 model endpoints.

### Terminal 2: Launch React/Vite Frontend
```powershell
cd "d:\5th sem\AIML\project"
npm run dev
```
*Verify:* Open `http://localhost:5173` in Google Chrome (recommended for Web Speech API support).

---

## 🧭 Live Demo Flow (5 Minutes Total)

```
[0:00] Landing & Onboarding ──▶ [1:00] Home Screen & Voice Entry
                                        │
                                        ▼
[3:30] Kaam / Sehat / Kaushal ◀── [1:45] Dhan Page & ML Forecasts
         │
         ▼
[4:15] AI Lab Live Evaluation ──▶ [5:00] Conclusion & Q&A
```

---

### Phase 1: Onboarding & Vernacular Setup (1 Minute)
1. **Navigate to:** `http://localhost:5173`
2. **What to Show:**
   * Highlight the clean bilingual greeting: *"Aapke Kaam, Paisa, Sehat aur Skill ka Sathi"*.
   * Select a language toggle (e.g., Hindi or Marathi).
   * Choose worker profile: **"Delivery Partner (Swiggy / Zomato)"**, City: **"Pune"**, Daily Target: **"₹800"**.
   * Click **"शुरू करें (Get Started)"**.
3. **What to Say to Evaluators:**
   > *"Notice how the onboarding process avoids overwhelming technical jargon. In three simple taps, the worker specifies their category and income expectations, creating a personalized baseline without needing an email or formal bank login."*

---

### Phase 2: Home Dashboard & Voice Entry (1 Minute)
1. **Navigate to:** Home Screen (`/home`).
2. **What to Show:**
   * Today's balance summary card with tactile **"Add Income"** (green) and **"Add Expense"** (amber/orange) buttons.
   * Point out the **Financial Health Meter (0–100)** and the **Rest & Hydration Reminder** banner.
   * Click the **Floating Mic Button (🎙️)**.
   * Say clearly: *"आज स्विगी से 750 रुपये मिले"* or type into the voice simulation fallback.
   * Watch the system automatically categorize it as **Income $\rightarrow$ Platform Delivery $\rightarrow$ ₹750**.
   * Click **"Save Entry"**.
3. **What to Say to Evaluators:**
   > *"Here is our voice-first entry system. Our Indic Natural Language Parser normalizes spoken vernacular, extracts the numeral, and updates the local cash ledger in real-time. Notice how the today's balance card immediately reflects the newly added cash flow."*

---

### Phase 3: Dhan Page & ML Forecasting (1.5 Minutes)
1. **Navigate to:** Money Tab (`/dhan`).
2. **What to Show:**
   * **Interactive Date Bar:** Click on yesterday's date, then click on today's date. Show how the transaction list and net sum dynamically adapt to the selected day.
   * **Cash Flow Forecast Card (Linear Regression):**
     * Point out the projected 7-day trajectory line.
     * Point out the upper and lower 95% confidence bands and predicted next-day closing balance.
   * **Budget Overrun Risk Card (Logistic Regression):**
     * Show the real-time probability meter (e.g., *"18% Low Deficit Risk"*).
   * **Spending Archetype Card (K-Means):**
     * Show the assigned persona badge: *"Cluster 0 — High-Mileage Delivery Rider"*.
3. **What to Say to Evaluators:**
   > *"This is the core financial engine of Setu. Rather than simple historical tracking, we apply machine learning: Linear Regression predicts next-day cash balance with confidence intervals, Logistic Regression assesses daily deficit risk, and K-Means clusters their spending habits into actionable personas."*

---

### Phase 4: Kaam, Sehat & Kaushal (45 Seconds)
1. **Kaam (`/kaam`):**
   * Show verified gig listings with fair wage verification badges ($\ge ₹750/\text{day}$).
2. **Sehat (`/sehat`):**
   * Show the government welfare scheme eligibility cards (e-Shram card, PM-JAY Ayushman Bharat).
3. **Kaushal (`/kaushal`):**
   * Show the **Digital Skill Passport**.
   * Highlight the verified experience tags (*Two-Wheeler Navigation*, *Fleet Safety*), star rating, and real-time generated QR Code.
4. **What to Say to Evaluators:**
   > *"Under Kaam, all listed gigs enforce fair wage minimums. Under Sehat, workers check eligibility for government welfare. And under Kaushal, informal experience is compiled into a verifiable Digital Skill Passport with a QR code for prospective employers."*

---

### Phase 5: The AI Lab — Live Model Evaluation (1 Minute)
1. **Navigate to:** AI Lab Tab (`/ai-lab`).
2. **What to Show:**
   * Point out the status badges showing framework versions (**Scikit-learn 1.5.2, PyTorch 2.5.1, FastAPI**).
   * Click **"Train Linear Regression"** $\rightarrow$ Watch the training progress bar and see the live $R^2$ score ($0.96$) update!
   * Click **"Train Logistic Regression"** $\rightarrow$ Show the confusion matrix and ROC-AUC score ($0.94$).
   * Click **"Train K-Means"** $\rightarrow$ Show the cluster centroids and Silhouette score ($0.48$).
   * Show the PyTorch LSTM card with sequence forecast curves.
3. **What to Say to Evaluators:**
   > *"Finally, here in our AI Lab, examiners can inspect the live ML pipeline. Every model can be trained and evaluated on demand. We expose the exact loss convergence, confusion matrices, and R-squared scores, proving complete functional integration between our Python backend and React frontend."*

---

## 🏆 Demo Recovery / Fallback Tips:
* **If microphone speech recognition fails in a noisy classroom:** Use the keyboard text input fallback inside the voice modal. Type `"दोनशे रुपये पेट्रोल"` or `"500 swiggy income"` to demonstrate the exact same Indic parser logic!
* **If the Python FastAPI server is closed:** Show how the frontend gracefully falls back to local heuristic mode without showing blank error screens, demonstrating robust software engineering design!
