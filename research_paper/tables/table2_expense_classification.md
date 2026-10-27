# TABLE II: CODE-MIXED HINGLISH EXPENSE CLASSIFICATION BREAKDOWN (32 TEST SAMPLES)

### Caption
**TABLE II: PER-CLASS PRECISION, RECALL, F1-SCORE, AND LEXICAL CHARACTERISTICS FOR THE 8-CLASS CODE-MIXED HINGLISH EXPENSE CLASSIFIER ON 32 HELD-OUT PHRASES**

---

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

---

### Methodological Notes & Footnotes
1. **Model Pipeline:** Sublinear TF-IDF Vectorizer ($1 + \ln(tf)$) over unigrams and bigrams ($n \in \{1, 2\}$) mapped through a Multinomial Logistic Regression model trained with an $L_2$ regularization penalty ($C = 1.0$, tolerance $= 10^{-4}$).
2. **Dataset Specifications:** Total corpus consists of 160 labeled natural voice transcriptions in Romanized Hindi-English code-mixed phonology ("Hinglish"), split stratified into 128 training phrases and 32 test phrases (exactly 4 evaluation instances per class).
3. **Confusion Dynamics:** 
   - Strict transactional obligations (EMI/Loan, Rent) achieve perfect 1.000 F1-scores due to unambiguous domain keywords (*kist, bhada*).
   - Ambiguity arises primarily between *Personal/Misc* and *Health/Medical* where polysemous phrases (e.g., general medical shop purchases vs. daily provisions) introduce lexical overlap.
4. **Weighted vs. Macro Metrics:** Due to balanced test support (4 samples/class), the weighted average precision (0.738), recall (0.750), and F1 (0.736) correspond directly to macro-averaged evaluation across classes.
