# Section II: Related Work and Literature Review

This document provides the complete, publication-ready literature review for the research paper, establishing theoretical grounding across four distinct computing and socio-technical disciplines, synthesizing existing literature, and highlighting the specific technical gaps addressed by FairWork Setu.

---

## II. RELATED WORK

### A. Algorithmic Management and Gig Labor Precarity
The rapid expansion of platform-mediated gig labor has fundamentally restructured employment relations across the Global South. NITI Aayog [1] estimates that India's gig economy engages over 7.7 million workers—projected to reach 23.5 million by 2030—comprising food delivery riders, rideshare drivers, home service professionals, and logistics couriers. Despite providing low-barrier livelihood entry, empirical investigations by the Fairwork India project [2] document severe structural precarity: zero employment contracts, arbitrary account deactivations, lack of minimum wage floors, and complete absence of formal occupational accident coverage.

Wood et al. [3] and Rahman [4] conceptualize these dynamics as "algorithmic management," wherein opaque algorithmic dispatchers govern task distribution, compensation calculations, and customer rating thresholds. Because platforms treat gig laborers as "independent delivery partners" rather than statutory employees, the burden of cash-flow volatility, vehicle depreciation, fuel price surges, and health risks is transferred entirely onto the individual worker. Consequently, workers operate under acute psychological and financial stress, lacking institutional accounting mechanisms to evaluate whether their net earnings exceed operational overhead.

---

### B. Time-Series Forecasting in Volatile Micro-Finance
Traditional time-series econometric frameworks—such as Autoregressive Integrated Moving Average (ARIMA) and seasonal decomposition by Box et al. [5]—rely upon underlying assumptions of stationarity, homoskedasticity, and regular periodicity. However, informal gig earnings in developing economies violate these classical assumptions: daily revenue oscillates violently based on dynamic surge multipliers, localized festival demand, erratic fuel outlays, and platform-imposed algorithmic rationing.

Recent machine learning paradigms have explored non-linear sequence modeling for micro-finance. Breiman’s Random Forest architecture [6] has demonstrated high robustness against overfitting on sparse, non-stationary tabular data through bootstrap feature bagging. Hochreiter and Schmidhuber’s Long Short-Term Memory (LSTM) recurrent neural networks [7] preserve long-term temporal dependencies across sequential data. Nevertheless, existing mobile personal finance applications (e.g., Walnut, Money View, Mint) remain strictly reactive: they compute retrospective expenditure aggregates or simple rolling moving averages that fail to anticipate impending weekly cash deficits. FairWork Setu bridges this gap by engineering autoregressive lag topologies ($t-1, t-2, t-3, t-7, t-14$) combined with cyclical trigonometric day-of-week embeddings, delivering proactive forward-looking cash flow projections.

---

### C. Code-Mixed and Dialectal Natural Language Processing in Indic Domains
Personal accounting platforms in emerging markets typically mandate manual textual keyboard entry in standard English or formalized script. However, over 65% of Indian gig platform workers exhibit limited functional English literacy and interact verbally using colloquial, code-mixed Romanized dialects ("Hinglish" or "Bilingual Indic Vernacular").

Bali et al. [12] and Joshi et al. [13] have established that code-mixed informal dialects present formidable challenges to conventional natural language processing pipelines due to inconsistent phonetic spelling variations (e.g., *"kharcha"*, *"kharacha"*, *"kharch"* for expense), grammatical code-switching, and absence of standardized lexical corpora. While large-scale foundation acoustic models such as OpenAI Whisper [14] demonstrate remarkable multi-lingual automatic speech recognition (ASR) capabilities, hosting heavy multi-billion-parameter deep neural networks locally on entry-level Android smartphones (e.g., MediaTek Helio or Qualcomm Snapdragon 400-series chipsets) remains computationally intractable due to severe RAM constraints (2GB–3GB) and thermal throttling.

FairWork Setu addresses this limitation by deploying a hybrid client-server language pipeline: client-side deterministic finite-state regex automata extract numerical amounts and transaction directions in $<1.2\text{ ms}$, while a server-side sublinear TF-IDF vectorizer coupled with a Multinomial Logistic Regression model [15], [20] categorizes 8 colloquial expense classes in sub-10ms inference.

---

### D. Dense Semantic Retrieval and Social Safety Net Entitlements
Although statutory welfare legislation exists—such as the landmark *Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023* [21], the central *Code on Social Security, 2020* [22], and the *Building and Other Construction Workers (BOCW) Act, 1996*—less than 12% of eligible informal workers successfully access these statutory entitlements. This entitlement deficit stems from bureaucratic opacity, complex legal terminology, and fragmented governmental portal architectures (e.g., e-Shram, state labor welfare boards).

In parallel, semantic retrieval systems have transitioned from sparse keyword search (BM25) to dense bi-encoder sentence representations. Reimers and Gurevych [9] pioneered Sentence-BERT, enabling dense semantic mapping into metric vector spaces. Johnson et al. [10] developed FAISS (Facebook AI Similarity Search) to execute exact Euclidean ($L_2$) and inner-product vector indexing with sub-millisecond query latency. Lewis et al. [11] formalized Retrieval-Augmented Generation (RAG) to ground language queries in verified external document corpora. FairWork Setu leverages an exact FAISS Flat-L2 index over 28 statutory Indian legal provisions, converting complex legislative clauses into clear, vernacular, voice-accessible rights summaries without generative hallucination risks.

---

## Comparative Literature Analysis

| Dimension / Capability | Traditional Gig Apps (Uber, Zomato, Swiggy) | Commercial FinTech (Walnut, Money View, Khatabook) | Academic Forecasting (ARIMA / Classical LSTMs) | Government Portals (e-Shram, State BOCW) | **FairWork Setu (Proposed)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Worker Perspective** | Platform-Centric (Monitors delivery velocity) | Consumer-Centric (Assumes fixed monthly salaries) | Algorithmic-Centric (Abstract benchmark evaluations) | Administrative-Centric (Static bureaucratic forms) | **Worker-First Livelihood & Financial Intelligence** |
| **Cash Flow Forecasting** | None (Retrospective summary only) | None (Displays historical bar charts) | High error under non-stationary volatility | None | **Random Forest + PyTorch LSTM (47.1% MAE reduction)** |
| **Input Modality** | English / Rigid Form Fields | English Keyboard / SMS Scraping | Batch CSV / Tabular datasets | Desktop Web Forms (Requires cyber-café assistance) | **Multimodal Voice-First (Hinglish ASR + Regex DFA)** |
| **Expense Categorization** | Not Applicable | Automated SMS scraping (Fails for cash/UPI transactions) | General text benchmarks (IMDb, 20Newsgroups) | Not Applicable | **8-Class Hinglish TF-IDF + Logistic Classifier (F1 = 0.736)** |
| **Budget Stress / Anomaly** | None | Simple budget alert (% of manual monthly budget) | Unsupervised Outlier Detection on generic data | None | **Isolation Forest ($s(x) \le -0.100$) + $L_2$ Logistic Deficit Risk** |
| **Legal Welfare Access** | Terms of Service FAQs (No legal advocacy) | None | None | Fragmented PDF gazettes and broken state links | **FAISS Flat-L2 Legal RAG across 4 Statutory Acts (MRR@4 = 0.9167)** |
| **Offline Resilience** | App fails without active 4G/5G | Requires constant cloud network | Offline execution only | Complete failure without high-speed internet | **Dual-Layer Failover: Sub-5ms pure TypeScript edge heuristics** |

---

## Summary of Identified Research Gaps

Existing systems leave four critical sociotechnical and computational voids:
1. **The Volatility Blindspot:** Traditional financial management algorithms assume predictable bi-weekly or monthly income streams. They possess no domain-adapted predictive mechanisms to forecast earnings that fluctuate daily by up to 300%.
2. **The Linguistic Exclusion Barrier:** Commercial personal finance tools rely heavily on SMS scraping or English keyboard entry, rendering them virtually unusable for colloquial, non-literate, or code-mixed Hindi/Indic speech users.
3. **The Siloed Welfare Gap:** Government portals publish vital legislative rights in complex legal statutory text without semantic retrieval or personalized matching, keeping workers structurally alienated from their statutory entitlements.
4. **The Network Fragility Problem:** High-end neural architectures fail when deployed in rural or high-density urban transit corridors where mobile cellular connections frequently drop. There is an absence of unified architectures that seamlessly degrade from cloud machine learning microservices to deterministic client-side edge heuristics.
