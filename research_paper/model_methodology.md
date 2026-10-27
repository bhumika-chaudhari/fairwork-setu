# Section IV: Machine Learning Methodology and Mathematical Formulations

This document provides the complete, mathematically rigorous formulation of all machine learning models, algorithms, and inference pipelines integrated into the FairWork Setu dual-layer architecture.

---

## IV. MACHINE LEARNING METHODOLOGY

### A. Volatile Gig Income and Cash-Flow Forecasting

#### 1. Autoregressive Random Forest Regressor
Informal gig workers experience high daily earnings volatility driven by localized weather events, platform surge pricing, day-of-week demand cycles, and festival surges. To capture these non-linear temporal dynamics without imposing strict stationarity assumptions, we formulate daily cash-flow forecasting as a supervised tabular regression problem over historical sequence windows.

Let $y_t \in \mathbb{R}^+$ denote the net daily earnings of a worker on day $t$. We construct an autoregressive lag feature vector $\mathbf{x}_t \in \mathbb{R}^{14}$ comprising:
1. **Short-Term Autoregressive Lags:** $y_{t-1}, y_{t-2}, y_{t-3}$, capturing immediate temporal momentum and short-term earnings inertia.
2. **Weekly Seasonal Lags:** $y_{t-7}, y_{t-14}$, capturing strong weekly recurring platform demand patterns (e.g., weekend food delivery peaks).
3. **Rolling Window Statistics:**
   - 7-day Simple Moving Average: $\bar{y}_{t, 7} = \frac{1}{7} \sum_{i=1}^7 y_{t-i}$
   - 7-day Rolling Standard Deviation: $\sigma_{t, 7} = \sqrt{\frac{1}{7} \sum_{i=1}^7 (y_{t-i} - \bar{y}_{t, 7})^2}$
   - 14-day Simple Moving Average: $\bar{y}_{t, 14} = \frac{1}{14} \sum_{i=1}^{14} y_{t-i}$
   - 14-day Rolling Standard Deviation: $\sigma_{t, 14} = \sqrt{\frac{1}{14} \sum_{i=1}^{14} (y_{t-i} - \bar{y}_{t, 14})^2}$
4. **Trigonometric Cyclical Calendar Encodings:** To model the continuous periodic nature of day-of-week $d_t \in \{0, 1, \dots, 6\}$ without imposing artificial ordinal boundaries between Sunday (6) and Monday (0):
   $$x_{t, \sin} = \sin\left(\frac{2\pi \cdot d_t}{7}\right), \quad x_{t, \cos} = \cos\left(\frac{2\pi \cdot d_t}{7}\right)$$
5. **Weekend Indicator:** $I_{\text{weekend}} = \mathbb{I}(d_t \in \{5, 6\})$.

The regression function is modeled using an ensemble of $B = 100$ decorrelated decision trees:
$$\hat{y}_t = \frac{1}{B} \sum_{b=1}^B T_b(\mathbf{x}_t; \Theta_b)$$
where each tree $T_b$ is trained on a bootstrap sample $\mathcal{D}_b \subset \mathcal{D}$ using recursive binary splitting. At each internal node $j$, the optimal split feature $k$ and threshold $\theta$ are chosen to minimize Mean Squared Error (MSE):
$$\mathcal{L}_{\text{split}}(k, \theta) = \sum_{i \in \mathcal{S}_{\text{left}}} (y_i - \bar{y}_{\text{left}})^2 + \sum_{i \in \mathcal{S}_{\text{right}}} (y_i - \bar{y}_{\text{right}})^2$$
Ensemble aggregation provides resilience against extreme individual outlier days, stabilizing prediction intervals.

---

#### 2. Deep Sequential PyTorch LSTM Regressor
To benchmark against deep recurrent architectures, we implement a 2-layer Long Short-Term Memory (LSTM) sequence model. Let $\mathbf{s}_t = [y_{t-T+1}, \dots, y_t]^\top \in \mathbb{R}^{T \times 1}$ represent a sequence of normalized historical daily earnings over lookback window $T = 7$.

For each step $\tau \in \{1, \dots, T\}$, the hidden state $\mathbf{h}_\tau \in \mathbb{R}^H$ ($H = 16$) and cell state $\mathbf{c}_\tau \in \mathbb{R}^H$ are updated via affine gating mechanisms:
$$\mathbf{f}_\tau = \sigma\left(\mathbf{W}_f \mathbf{s}_\tau + \mathbf{U}_f \mathbf{h}_{\tau-1} + \mathbf{b}_f\right) \quad \text{(Forget Gate)}$$
$$\mathbf{i}_\tau = \sigma\left(\mathbf{W}_i \mathbf{s}_\tau + \mathbf{U}_i \mathbf{h}_{\tau-1} + \mathbf{b}_i\right) \quad \text{(Input Gate)}$$
$$\tilde{\mathbf{c}}_\tau = \tanh\left(\mathbf{W}_c \mathbf{s}_\tau + \mathbf{U}_c \mathbf{h}_{\tau-1} + \mathbf{b}_c\right) \quad \text{(Candidate Cell State)}$$
$$\mathbf{c}_\tau = \mathbf{f}_\tau \odot \mathbf{c}_{\tau-1} + \mathbf{i}_\tau \odot \tilde{\mathbf{c}}_\tau \quad \text{(Cell State Update)}$$
$$\mathbf{o}_\tau = \sigma\left(\mathbf{W}_o \mathbf{s}_\tau + \mathbf{U}_o \mathbf{h}_{\tau-1} + \mathbf{b}_o\right) \quad \text{(Output Gate)}$$
$$\mathbf{h}_\tau = \mathbf{o}_\tau \odot \tanh(\mathbf{c}_\tau) \quad \text{(Hidden State)}$$
where $\sigma(z) = \frac{1}{1 + e^{-z}}$ denotes the sigmoid activation function and $\odot$ denotes the Hadamard element-wise product.

The terminal hidden vector $\mathbf{h}_T^{(2)}$ from the second LSTM layer is passed through a linear projection layer:
$$\hat{y}_{t+1} = \mathbf{W}_{\text{out}} \mathbf{h}_T^{(2)} + b_{\text{out}}$$
The model comprises 4,769 trainable parameters and is optimized using Adam ($\beta_1 = 0.9, \beta_2 = 0.999$, learning rate $\eta = 0.005$) over the Mean Squared Error loss function:
$$\mathcal{L}_{\text{MSE}} = \frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2$$

---

### B. Code-Mixed Hinglish Financial Expense Classification

Informal gig workers narrate daily expenditures via colloquial speech containing code-mixed Hindi-English phrases (e.g., *"Aaj bike ka tyre puncture ho gaya 150 rupaye lag gaye"*). To categorize these unstructured utterances into 8 standardized expense classes:
$$\mathcal{C} = \{\text{Food}, \text{Fuel}, \text{EMI/Loan}, \text{Rent}, \text{Maintenance}, \text{Education}, \text{Health}, \text{Personal}\}$$

#### 1. Sublinear TF-IDF Feature Representation
Input text strings are normalized via lowercasing, punctuation stripping, and whitespace collapse. We compute Term Frequency–Inverse Document Frequency (TF-IDF) feature vectors over contiguous character and word n-grams ($n \in \{1, 2\}$):
$$\text{TF}_{\text{sub}}(t, d) = 1 + \ln(\text{tf}(t, d)) \quad \text{if } \text{tf}(t, d) > 0, \text{ else } 0$$
$$\text{IDF}(t, \mathcal{D}) = \ln\left(\frac{1 + |\mathcal{D}|}{1 + \text{df}(t, \mathcal{D})}\right) + 1$$
$$\mathbf{v}(t, d) = \text{TF}_{\text{sub}}(t, d) \times \text{IDF}(t, \mathcal{D})$$
The resulting sparse feature vector is normalized to unit Euclidean length:
$$\mathbf{z}_d = \frac{\mathbf{v}_d}{\|\mathbf{v}_d\|_2}$$
Sublinear term frequency dampens the disproportionate impact of repeated filler words (*"rupaye"*, *"diya"*, *"aaya"*), while n-gram preservation captures crucial collocations such as *"room rent"* and *"bike emi"*.

#### 2. Multinomial Logistic Regression Classifier
The normalized TF-IDF vector $\mathbf{z} \in \mathbb{R}^V$ is mapped to class probability distribution $\mathbf{p} \in \Delta^7$ using a linear multinomial log-odds model:
$$P(y = c \mid \mathbf{z}) = \frac{\exp(\mathbf{w}_c^\top \mathbf{z} + b_c)}{\sum_{k=1}^K \exp(\mathbf{w}_k^\top \mathbf{z} + b_k)}$$
Parameters $\mathbf{W} \in \mathbb{R}^{K \times V}$ are estimated by minimizing the categorical cross-entropy loss augmented with an $L_2$ Tikhonov regularization penalty:
$$\mathcal{L}_{\text{NLP}}(\mathbf{W}) = -\frac{1}{N} \sum_{i=1}^N \sum_{k=1}^K \mathbb{I}(y_i = k) \ln P(y_i = k \mid \mathbf{z}_i) + \frac{1}{2C} \sum_{k=1}^K \|\mathbf{w}_k\|_2^2$$
where $C = 1.0$ controls regularization strength.

---

### C. Unsupervised Outflow Anomaly Detection

To alert workers to unexpected drain on daily liquidity without requiring pre-labeled anomaly datasets, we deploy an unsupervised Isolation Forest model [8].

Given an ensemble of $B = 100$ isolation trees $\{T_1, \dots, T_B\}$ constructed by randomly selecting a feature and a random split value between the minimum and maximum values of the feature, an anomalous transaction isolates close to the root node.

Let $h(x)$ denote the path length (number of edges traversed) to isolate instance $x$ in tree $T$. The expected path length across the ensemble is $\mathbb{E}(h(x))$. The normalized anomaly score $s(x, n)$ for an instance $x$ given dataset size $n$ is:
$$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$$
where $c(n)$ is the average path length of an unsuccessful search in a Binary Search Tree (BST):
$$c(n) = 2\left(\ln(n - 1) + \gamma\right) - \frac{2(n - 1)}{n}$$
where $\gamma \approx 0.5772156649$ is Euler’s constant.

- If $s(x, n) \to 1$: $\mathbb{E}(h(x)) \to 0$, indicating an immediate outlier.
- If $s(x, n) < 0.5$: $\mathbb{E}(h(x)) \to n - 1$, indicating normal routine transactions.

We calibrate the decision boundary at contamination parameter $c = 0.05$. Transactions yielding an anomaly score $s(x) \le -0.100$ are flagged as anomalous outflows, triggering an immediate verification prompt.

---

### D. Deterministic Finite-State Information Extraction (NLU Automaton)

To guarantee zero latency and complete offline autonomy on low-cost hardware, numerical transaction values and credit/debit transaction directions are extracted deterministically via a compiled Finite-State Automaton (DFA).

Formally, the DFA is defined as a 5-tuple:
$$\mathcal{M} = \left(Q, \Sigma, \delta, q_0, F\right)$$
where $\Sigma$ is the alphabet of alphanumeric characters and Unicode currency symbols (₹), $Q$ is the set of parsing states, $q_0 \in Q$ is the initial scan state, $F \subseteq Q$ is the set of terminal acceptance states, and $\delta: Q \times \Sigma \to Q$ is the transition function.

1. **Numerical Currency Extraction:** Matches the regular language:
   $$\mathcal{L}_{\text{curr}} = \left[\text{rs}\mid\text{inr}\mid\text{₹}\right]^? \cdot \left[\text{whitespace}\right]^* \cdot (\text{digit}^+ \cdot (\text{comma}\cdot\text{digit}^3)^* \cdot (\text{dot}\cdot\text{digit}^{1..2})^?) \cdot \left[\text{rs}\mid\text{rupees}\mid\text{rupaye}\right]^?$$
2. **Transaction Polarity Direction:** Matches credit keywords $\mathcal{K}_{\text{credit}} = \{\text{mila, aaya, earned, got, credit, received, tip, bonus}\}$ versus debit keywords $\mathcal{K}_{\text{debit}} = \{\text{diya, kharch, spent, paid, cut, debit, bhara, petrol}\}$.

Because regular expressions over small strings execute in linear time $\mathcal{O}(L)$ with respect to string length $L$, execution completes in under 1.2 milliseconds directly within the mobile browser thread.

---

### E. Dense Semantic Retrieval, Job Matching, and Legal Welfare RAG

#### 1. Bi-Encoder Semantic Embedding Model
To match informal gig workers to available hyper-local opportunities, recommended upskilling modules, and statutory welfare provisions, we employ the `sentence-transformers/all-MiniLM-L6-v2` dense bi-encoder architecture [9].

Given an arbitrary input query string $q$ (e.g., worker skills, or statutory rights inquiry) and a candidate target passage $p$:
$$\mathbf{u} = \text{MeanPooling}(\text{Transformer}(q)) \in \mathbb{R}^{384}$$
$$\mathbf{v} = \text{MeanPooling}(\text{Transformer}(p)) \in \mathbb{R}^{384}$$
The semantic similarity between query and candidate document is measured using the cosine similarity of their normalized embeddings:
$$\text{Sim}(q, p) = \cos(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$

#### 2. Exact FAISS Flat-L2 Vector Store for Statutory RAG
For legal welfare retrieval across the 28 statutory chunks of Indian labor legislation, high precision is paramount to avoid hallucinations. We construct an exact FAISS Flat-L2 index [10] without lossy quantization or inverted list approximation:
$$d(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|_2 = \sqrt{\sum_{i=1}^{384} (u_i - v_i)^2}$$
Candidate chunks are ranked in ascending order of Euclidean distance:
$$\mathcal{R}_q = \text{argsort}_{p \in \mathcal{D}} d(\mathbf{u}, \mathbf{v}_p)$$
The top-$k$ retrieved statutory clauses are injected into the context prompt of the welfare assistant, providing verbatim citations to specific legal section numbers and entitlement claim criteria.

---

### F. Unsupervised Spending Pattern Segmentation via K-Means

To provide workers with behavioral spending feedback, we cluster historical transactions into intuitive archetypes using K-Means clustering [17].

Given a set of $N$ transaction feature vectors $\mathbf{x}_i \in \mathbb{R}^d$ (encoding transaction amount and category indicators), K-Means partitions the observations into $K = 3$ clusters $\mathcal{S} = \{S_1, S_2, S_3\}$ to minimize the within-cluster sum of squares (inertia):
$$J = \sum_{k=1}^K \sum_{\mathbf{x} \in S_k} \|\mathbf{x} - \boldsymbol{\mu}_k\|_2^2$$
where $\boldsymbol{\mu}_k = \frac{1}{|S_k|} \sum_{\mathbf{x} \in S_k} \mathbf{x}$ is the centroid of cluster $S_k$.

The optimization proceeds via iterative expectation-maximization:
1. **Assignment Step:**
   $$S_k^{(t)} = \left\{\mathbf{x}_i : \left\|\mathbf{x}_i - \boldsymbol{\mu}_k^{(t)}\right\|_2^2 \le \left\|\mathbf{x}_i - \boldsymbol{\mu}_j^{(t)}\right\|_2^2 \quad \forall j, 1 \le j \le K\right\}$$
2. **Update Step:**
   $$\boldsymbol{\mu}_k^{(t+1)} = \frac{1}{\left|S_k^{(t)}\right|} \sum_{\mathbf{x} \in S_k^{(t)}} \mathbf{x}$$

Evaluating inertia across candidate values $K \in \{2, 3, 4, 5\}$ reveals an elbow at $K = 3$ (Inertia = 170.39), corresponding to:
- **Cluster 0 (Micro-Disbursements):** High-frequency, low-denomination operational transactions (tea, tolls, mobile recharge; mean ₹188).
- **Cluster 1 (Daily Operational Costs):** Moderate-denomination direct operational overhead (fuel refills, bike maintenance; mean ₹192.50).
- **Cluster 2 (Major Inflows/Outflows):** High-denomination structural transactions (weekly platform disbursements, rent, EMI; mean ₹762).

---

### G. Client-Side Edge Heuristic Engine (Pure TypeScript)

To ensure high availability in connectivity-compromised operational environments, FairWork Setu implements an edge mathematical engine in pure TypeScript (`src/services/mlService.ts`). When the mobile client detects network latency exceeding 2,000 milliseconds or an offline socket state, execution fails over automatically:
1. **Edge Cash-Flow Projections:** Computes an exponential decay-weighted moving average:
   $$\hat{y}_{t+1} = \frac{\sum_{i=0}^6 \alpha^i y_{t-i}}{\sum_{i=0}^6 \alpha^i}, \quad \alpha = 0.85$$
2. **Edge Deficit Risk:** Computes deterministic liquidity coverage ratio:
   $$\text{CR} = \frac{\text{Current Balance} + \hat{y}_{t+1}}{\text{Expected Weekly Fixed Liabilities}}$$
   If $\text{CR} < 1.0$, a high-priority budget risk warning is issued locally in under 5 milliseconds.
