# TABLE IV: DETERMINISTIC INFORMATION EXTRACTION BENCHMARK (170 PHRASES)

### Caption
**TABLE IV: ACCURACY AND SUB-MILLISECOND INFERENCE LATENCY OF THE DETERMINISTIC FINITE-STATE NATURAL LANGUAGE UNDERSTANDING AUTOMATON EVALUATED ON 170 TEST PHRASES**

---

| Extraction Task | Corpus Size ($N$) | Correctly Extracted Instances | Empirical Accuracy (%) | Mean Processing Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Numerical & Currency Extraction** | 170 phrases | 170 | **100.0%** | **< 1.2 milliseconds** |
| **Transaction Direction (Credit / Debit)** | 170 phrases | 170 | **100.0%** | **< 1.2 milliseconds** |
| **Primary Taxonomy Mapping** | 170 phrases | 161 | **94.7%** | **< 1.2 milliseconds** |

---

### Methodological Notes & Footnotes
1. **Automaton Design:** Implemented as a client-side deterministic finite-state automaton (DFA) coupled with compiled regular expressions (`src/services/voiceAssistantService.ts` and `src/services/mlService.ts`).
2. **Regex Patterns:**
   - Numerical Currency: `(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:rs|rupees|rupaye)?`
   - Credit Keywords: `[mila, aaya, earned, got, credit, received, tip, bonus, tankha, payment]`
   - Debit Keywords: `[diya, kharch, spent, paid, cut, debit, bhara, lag gaya, petrol]`
3. **Taxonomy Edge Cases:** The 5.3% error in primary taxonomy mapping occurs when user utterances combine multiple disjoint expenses in a single spoken utterance without punctuation (e.g., *"500 rupaye petrol aur 100 ka khana"*), which defaults to the leading detected semantic token unless segmented by the downstream TF-IDF classifier.
4. **Latency Advantage:** Achieving $<1.2\text{ ms}$ on standard mobile WebKit/V8 runtimes ensures zero perceptible delay during live microphone speech transcription, executing directly on the device without server round-trip latency.
