# Evaluation Metrics

## 1. Evaluation principles

Evaluate each AI/ML component separately. Do not report only overall app accuracy.

Use a held-out test set that the model has never seen during training.

## 2. Speech-to-text

### Metrics

- Word Error Rate (WER)
- Character Error Rate (CER)
- Language detection accuracy
- Average processing time

### Formula

\[
WER = rac{S + D + I}{N}
\]

Where:

- \(S\) = substitutions
- \(D\) = deletions
- \(I\) = insertions
- \(N\) = total words in reference transcript

### Target

- WER below 25% for clear Hindi/English voice samples is acceptable for MVP.
- Below 15% is strong.

## 3. Expense classification

### Metrics

- Accuracy
- Precision
- Recall
- Macro F1-score
- Confusion matrix

### Target

| Model | Minimum macro F1 |
|---|---:|
| TF-IDF + Logistic Regression | 0.70 |
| Transformer-based classifier | 0.80 |

## 4. Information extraction

### Metrics

- Entity precision
- Entity recall
- Entity F1
- Amount extraction accuracy
- Date extraction accuracy

### Target

- Amount extraction accuracy: at least 90%
- Date extraction accuracy: at least 85%
- Overall entity F1: at least 0.80

## 5. Income forecasting

### Metrics

- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Percentage Error (MAPE)
- Coverage of prediction interval

### Formulas

\[
MAE = rac{1}{n}\sum_{i=1}^{n}|y_i - \hat{y}_i|
\]

\[
RMSE = \sqrt{rac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}
\]

\[
MAPE = rac{100}{n}\sum_{i=1}^{n}\left|rac{y_i - \hat{y}_i}{y_i}ight|
\]

### Target

- MAPE below 20% on synthetic weekly data is acceptable for MVP.
- Always show a prediction range instead of a single number.

## 6. Job matching

### Metrics

- Precision@5
- Recall@5
- Mean Reciprocal Rank (MRR)
- Human relevance rating

### Human evaluation

Ask 3 evaluators to mark each recommended job as:

- Relevant
- Partially relevant
- Irrelevant

### Target

- Precision@5: at least 0.70
- MRR: at least 0.70

## 7. RAG evaluation

### Metrics

- Retrieval Recall@5
- Answer faithfulness
- Citation accuracy
- Refusal correctness

### Faithfulness rule

An answer is faithful only if every factual claim is supported by a retrieved source.

### Refusal correctness

If the knowledge base does not contain the answer, the system must say it cannot confirm the answer and show official sources.

### Target

- Retrieval Recall@5: at least 0.80
- Citation accuracy: at least 0.90
- Hallucinated-answer rate: below 10%

## 8. Financial Stability Score

### Evaluation

Use synthetic data with known labels:

- Low stability
- Medium stability
- High stability

### Metrics

- Accuracy
- Macro F1
- Mean absolute score error

### Important

The score must never be presented as a credit score or loan-approval score.

## 9. UI/UX evaluation

Test with at least 5–10 users.

Measure:

- Task completion rate
- Time to complete income entry
- Number of taps required
- User comprehension score
- System Usability Scale (SUS), optional

### Tasks

1. Add today’s income by voice.
2. Add an expense by voice.
3. Find a nearby job.
4. Download Skill Passport.
5. Ask a health/welfare question.

### Target

- At least 80% task completion without help.
- Income entry completed within 60 seconds.
- At least 70% of users can explain what the app does after one demo.

## 10. Reporting template

Include these tables in the final report:

| Component | Metric | Baseline | Improved model | Target |
|---|---:|---:|---:|---:|
| Expense classification | Macro F1 |  |  | 0.80 |
| Income forecasting | MAPE |  |  | Below 20% |
| Job matching | Precision@5 |  |  | 0.70 |
| RAG | Recall@5 |  |  | 0.80 |
| Speech-to-text | WER |  |  | Below 25% |
