# Master Handoff Instructions for Claude: IEEE Conference Paper Assembly

## Purpose of this Document
This file contains the complete, authoritative operational instructions for **Claude (Anthropic)** to assemble, format, and generate the final publication-ready research paper for **FairWork Setu** in the official **IEEE Conference Two-Column Format** (either as complete LaTeX source code or through a compilation script like `python-docx` / Typst).

---

## 1. Source Document Manifest

Claude must draw exclusively from the verified source documents in this directory:
1. `paper_draft.md`: The complete, unabridged manuscript containing Sections I through IX, Acknowledgments, and References.
2. `abstract_and_index_terms.md`: The official Title, Author Block, Abstract (238 words), and Index Terms.
3. `model_methodology.md`: Deep mathematical formulations, equation blocks, and algorithm specifications.
4. `experimental_results.md`: Empirical performance analysis, hypothesis validations (H1, H2, H3), and edge ablation benchmarks.
5. `related_work.md`: Literature review, theoretical grounding, and the comparative literature table.
6. `references.md`: Complete bibliographic inventory of all 22 verified IEEE references.
7. `figure_plan.md`: Figure numbers, high-res file paths (`figures/fig*.png`), placement mapping, and captions.
8. `tables/table1_forecasting.md` through `table6_kmeans_segmentation.md`: Formatted numerical tables I through VI.
9. `verification_report.md`: Forensic audit corroboration, synthetic data disclosures, and methodological boundary notes.

---

## 2. IEEE Manuscript Formatting Requirements

When generating the final output, Claude must strictly enforce standard IEEE Conference two-column specifications:

### A. Document Geometry and Layout
- **Page Size:** US Letter (8.5 × 11.0 inches) or A4 (210 × 297 mm).
- **Margins:** Top = 0.75 in (19 mm), Bottom = 1.0 in (25.4 mm), Left/Right = 0.625 in (15.9 mm).
- **Column Configuration:** Two columns per page.
  - Column Width: 3.5 inches (88.9 mm / 21 picas).
  - Column Gutter (Spacing): 0.25 inches (6.35 mm / 1.5 picas).
- **Title and Author Block:** Centered across both columns on the top of the first page.

### B. Typography (Times New Roman / Computer Modern)
- **Title:** 24 pt, Bold, Centered, Title Case.
- **Author Names:** 11 pt, Regular, Centered.
- **Author Affiliations:** 10 pt, Regular / Italic, Centered.
- **Abstract & Index Terms:** 9 pt, Bold heading (*Abstract*—, *Index Terms*—), text in 9 pt Regular or Bold Italic as per IEEE style.
- **Section Headings (Level 1):** 10 pt, Small Caps, Centered, Roman numerals (e.g., `I. INTRODUCTION`).
- **Subsection Headings (Level 2):** 10 pt, Italic, Flush Left, Capital letters (e.g., *A. Volatile Gig Income and Cash-Flow Forecasting*).
- **Sub-subsection Headings (Level 3):** 10 pt, Italic, Indented, Arabic numerals (e.g., *1) Autoregressive Random Forest Regressor:*).
- **Body Text:** 10 pt, Regular, Justified, First-line indent = 0.14 inches (3.5 mm).
- **Equations:** Centered on column width with right-aligned numbering `(1)`, `(2)`, etc.
- **Table Captions:** 8 pt, Small Caps, Centered above table, Roman numerals (e.g., `TABLE I: TIME-SERIES CASH FLOW FORECASTING BENCHMARK`).
- **Figure Captions:** 8 pt, Regular, Centered or Justified below figure, Arabic numerals (e.g., `Fig. 1. Dual-layer system architecture...`).
- **References:** 8 pt, Regular, Hanging indent, Numerical citations in brackets `[1]`, `[2]`.

---

## 3. Structural Assembly and Section Sequence

Claude must assemble the final paper strictly following this section order:

```text
TITLE: FAIRWORK SETU: AN ACCESSIBLE LIVELIHOOD PLATFORM WITH ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING BASED FINANCIAL INTELLIGENCE FOR INFORMAL GIG WORKERS

AUTHORS:
Bhumika Chaudhari¹, Sadia Sakharkar¹, Nouf Bamne¹, Aboli Gaikwad¹
Faculty Guide: Prof. Madhuri Tasgaonkar²
¹Third Year B.Tech, Department of Computer Engineering
²Assistant Professor, Department of Computer Engineering
MKSSS’s Cummins College of Engineering for Women, Pune, India

ABSTRACT & INDEX TERMS

I. INTRODUCTION
   A. Sociotechnical Context of Informal Gig Work in Emerging Economies
   B. Technical Challenges in Financial Machine Learning for Informal Workers
   C. Research Questions and Formal Hypotheses (H1, H2, H3)
   D. Summary of Key Technical Contributions

II. RELATED WORK
   A. Algorithmic Management and Gig Labor Precarity
   B. Time-Series Forecasting in Volatile Micro-Finance
   C. Code-Mixed and Dialectal Natural Language Processing in Indic Domains
   D. Dense Semantic Retrieval and Social Safety Net Entitlements
   [Comparative Literature Table]
   E. Summary of Identified Research Gaps

III. SYSTEM ARCHITECTURE AND DATA FLOW
   A. Architectural Philosophy: The Dual-Layer Hierarchy [Fig. 1]
   B. End-to-End System Workflow and Multimodal Interaction

IV. MACHINE LEARNING METHODOLOGY
   A. Volatile Gig Income and Cash-Flow Forecasting (Random Forest & LSTM) [Eqs. 1–7]
   B. Code-Mixed Hinglish Financial Expense Classification (TF-IDF + Logistic) [Eqs. 8–11]
   C. Unsupervised Outflow Anomaly Detection (Isolation Forest) [Eqs. 12–14]
   D. Deterministic Information Extraction (NLU DFA Automaton)
   E. Dense Semantic Retrieval, Job Matching, and Legal Welfare RAG (MiniLM + FAISS Flat-L2) [Eqs. 15–18]
   F. Unsupervised Spending Pattern Segmentation via K-Means [Eqs. 19–21]
   G. Client-Side Edge Heuristic Engine (Pure TypeScript Fallback) [Eqs. 22–23]

V. EXPERIMENTAL SETUP AND DATASETS
   A. Corpus Specifications and Empirical Split Protocols
   B. Formal Mathematical Evaluation Metrics

VI. RESULTS AND PERFORMANCE ANALYSIS
   A. Comparative Evaluation of Cash-Flow Forecasting Models (H1 Validation) [TABLE I, Fig. 2, Fig. 5]
   B. Code-Mixed Expense Classification Performance (H2 Validation) [TABLE II, Fig. 3]
   C. Anomaly Detection and Budget Stress Evaluation [TABLE III, Fig. 4]
   D. Deterministic Information Extraction Benchmark [TABLE IV]
   E. Dense Semantic Retrieval and Ranking Benchmarks (H3 Validation) [TABLE V, Fig. 6]
   F. Unsupervised Spending Pattern Segmentation Findings [TABLE VI, Fig. 7]

VII. ABLATION STUDY AND CLIENT-SIDE EDGE INFERENCE
   A. Latency, Memory, and Compute Benchmarks [Ablation Benchmark Table]
   B. Graceful Degradation and Offline Resilience

VIII. THREATS TO VALIDITY AND LIMITATIONS
   A. Methodological Constraints and Synthetic Data Disclosures
   B. Acoustic Noise and Dialectal Limitations in Speech Recognition

IX. CONCLUSION AND FUTURE WORK
   A. Summary of Scientific Findings
   B. Policy Implications and Future Technological Roadmap

ACKNOWLEDGMENT

REFERENCES [1]–[22]
```

---

## 4. Specific Instructions for Claude when Generating LaTeX

If prompting Claude to generate a complete `.tex` document:
1. Use `\documentclass[conference]{IEEEtran}`.
2. Include packages: `\usepackage{cite}`, `\usepackage{amsmath,amssymb,amsfonts}`, `\usepackage{algorithmic}`, `\usepackage{graphicx}`, `\usepackage{textcomp}`, `\usepackage{xcolor}`, `\usepackage{booktabs}`, `\usepackage{microtype}`.
3. Replace all unicode currency symbols (₹) with `\text{₹}` or `\text{Rs.}` (using `\usepackage{newunicodechar}` or macro `\newcommand{\INR}{\text{₹}}`).
4. Format all tables using `booktabs` (`\toprule`, `\midrule`, `\bottomrule`) with no vertical lines as strictly mandated by IEEE formatting guidelines.
5. In figures, use `\includegraphics[width=\columnwidth]{figures/figX.png}`. For wide architecture diagrams spanning both columns (Fig. 1), use `\begin{figure*} ... \end{figure*}`.
6. Format math equations using `\begin{equation}` with standard labels `\label{eq:rf_reg}` for easy in-text referencing.
7. Ensure all 22 references in `references.md` are converted to standard BibTeX or `\begin{thebibliography}{22}` format.

---

## 5. Specific Instructions for Claude when Generating DOCX via Python

If prompting Claude to build a Python script (`build_ieee_docx.py`) using `python-docx`:
1. Use two-column section formatting: `section._sectPr.xpath('./w:cols')[0].set(qn('w:num'), '2')`.
2. Insert title, author block, abstract, and wide figures in a single-column continuous section break preceding the two-column body.
3. Configure table borders: clear left, right, and inside vertical borders; set 1 pt solid top/bottom borders and 0.5 pt light header bottom borders.
4. Set image widths to `Inches(3.5)` for column-width figures and `Inches(7.0)` for full-width figures.
5. Match RGB palette: Charcoal dark body text `(33, 33, 33)`, muted captions `(85, 85, 85)`, and brand-accent header accents where permissible.
