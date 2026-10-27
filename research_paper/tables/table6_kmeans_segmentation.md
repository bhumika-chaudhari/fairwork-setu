# TABLE VI: UNSUPERVISED SPENDING SEGMENTATION CLUSTER CENTROIDS (K-MEANS, K=3)

### Caption
**TABLE VI: QUANTITATIVE CHARACTERISTICS, CENTROID AMOUNTS, POPULATION PROPORTIONS, AND DOMAIN ARCHETYPES DERIVED VIA UNSUPERVISED K-MEANS CLUSTERING ($K=3$) ON GIG WORKER LEDGER TRANSACTIONS**

---

| Cluster ID | Behavioral Archetype | Mean Amount (₹) | Transaction Proportion (%) | Characteristic Informal Expenditure Types & Economic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Cluster 0** | **Micro-Disbursements** | **₹188.00** | 27.8% | Tea, mid-shift refreshments, daily mobile data packs, bridge/toll tolls, parking charges |
| **Cluster 1** | **Daily Operational Costs** | **₹192.50** | 37.8% | Fuel refills (petrol/diesel), inner-tube puncture repairs, routine 2-wheeler engine lubrication |
| **Cluster 2** | **Major Cash Inflows & Outflows** | **₹762.00** | 34.4% | Weekly platform payouts, monthly room rent, two-wheeler vehicle loan EMI, emergency healthcare visits |

---

### Methodological Notes & Footnotes
1. **Model Specification:** Unsupervised K-Means clustering fitted over normalized transaction ledger amounts and category features. Number of clusters $K = 3$ was identified via the elbow method (Inertia $= 170.39$ at $k=3$ vs $284.12$ at $k=2$, demonstrating optimal variance capture without over-partitioning).
2. **Economic Implications:**
   - **Micro-Disbursements (27.8%):** Represents recurrent daily out-of-pocket operational friction that informal workers frequently fail to record, leading to perceived unaccounted income loss ("paisa kahan gaya pata nahi chala").
   - **Daily Operational Costs (37.8%):** Direct overhead necessary to generate gig earnings. Without active tracking, workers misestimate net margins after fuel and vehicle depreciation.
   - **Major Cash Inflows/Outflows (34.4%):** Lump-sum platform payouts and fixed overhead. Demonstrates that informal workers oscillate between small daily cash transactions and large structural liabilities, requiring multi-scale cash flow intelligence.
