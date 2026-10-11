# Agent Handoff Instructions

This document tells any AI agent or developer how to work on **Setu** without changing the agreed project scope.

## 1. Project identity

- **Name:** Setu
- **Full name:** Setu — AI Livelihood Companion for India’s Informal & Gig Workers
- **Tagline:** Aapke Kaam, Paisa, Sehat aur Skill ka Sathi
- **Target users:** Informal workers, daily-wage workers, gig/platform workers, migrants, and low-income urban workers in India
- **Primary language:** Hindi-first, English supported
- **Primary interaction:** Voice-first, mobile-first

## 2. Locked project scope

Do **not** change the product into a legal-advice app, contract analyzer, loan-approval app, medical diagnosis app, or generic chatbot.

The four locked modules are:

| Module | Name | Purpose |
|---|---|---|
| 1 | **Kaam** | Find nearby work matching skills and location |
| 2 | **Dhan** | Track income/expenses, forecast earnings, build savings |
| 3 | **Sehat** | Discover nearby health resources and welfare information |
| 4 | **Kaushal** | Create a Skill Passport and recommend learning |

## 3. Locked problem statement

> India’s informal and gig workers face irregular income, limited savings, weak digital work profiles, and poor awareness of nearby work, health, welfare, and skilling opportunities. Setu is a voice-first, multilingual AI livelihood companion that helps workers record income and expenses, forecast earnings, build emergency savings, discover nearby work matching their skills, access verified health and welfare information, and create a digital Skill Passport.

## 4. Locked tech stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native + Expo |
| Web dashboard, optional | React + Vite |
| Backend | Python FastAPI |
| Database | PostgreSQL |
| Vector store | FAISS for MVP; pgvector optional |
| Speech-to-text | Whisper or IndicConformer |
| NLP | spaCy + Hugging Face Transformers |
| Embeddings | Sentence Transformers |
| ML | scikit-learn, XGBoost, PyTorch |
| PDF | ReportLab |
| Deployment | Docker; Render/Railway/AWS optional |

Do not replace these without a strong reason and explicit approval from the project team.

## 5. MVP boundaries

An agent must build only the following first:

1. Phone-number login.
2. Worker profile creation.
3. Voice-based income/expense entry.
4. Dhan dashboard.
5. Weekly income forecast.
6. Basic job matching.
7. Skill Passport PDF.
8. Health/welfare RAG search.
9. Hindi and English UI.

Do not build payments, real recruitment, loan scoring, insurance claims, or medical diagnosis in the MVP.

## 6. Required UI rules

- Use mobile-first, single-column layout.
- Use bottom navigation: **Home, Kaam, Dhan, More/Sehat-Kaushal**.
- Keep a central microphone button.
- Use Hindi-first labels.
- Use large fonts and large tap targets.
- Minimum tap target: 48 × 48 px.
- Use the approved color palette:

| Token | Hex |
|---|---|
| Primary | `#0F766E` |
| Accent | `#F59E0B` |
| Background | `#FAF7F2` |
| Surface | `#FFFFFF` |
| Text | `#1F2937` |
| Success | `#16A34A` |
| Warning | `#D97706` |
| Danger | `#DC2626` |
| Health | `#2563EB` |

- Maintain at least 4.5:1 text contrast for normal text.
- Use Noto Sans Devanagari UI for Hindi.

## 7. Required AI behaviour

- Convert voice to text using Whisper or IndicConformer.
- Extract amounts, dates, categories, skills, and locations.
- Ask the worker to confirm extracted data before saving.
- Forecast income as a range, never as a guarantee.
- Match jobs using embeddings plus location and availability.
- Answer health/welfare questions using retrieved public sources only.
- Always show source URLs for health/welfare answers.
- If information is unavailable, say so instead of guessing.

## 8. Forbidden actions

An agent must not:

- Add legal-advice generation.
- Add loan approval or credit decisioning.
- Add medical diagnosis.
- Claim government scheme eligibility with certainty.
- Store Aadhaar, bank passwords, UPI PINs, or biometric data.
- Use worker data for external model training without explicit consent.
- Remove disclaimers.
- Change the app name, module names, or core problem statement without approval.
- Build all advanced features before completing the MVP.

## 9. Development order

Follow this exact order:

1. Backend setup and database.
2. Authentication and worker profile.
3. Income/expense tracking.
4. Dhan dashboard and forecasting.
5. Voice input and extraction.
6. Kaam job matching.
7. Kaushal Skill Passport.
8. Sehat/RAG search.
9. UI polish, testing, and demo preparation.

## 10. Definition of done

A feature is complete only when:

- It works on an Android phone.
- It works with Hindi and English.
- It handles empty, loading, error, and offline states.
- It does not expose sensitive data.
- It has basic tests or manual test steps.
- It is documented.
- It matches this specification.

## 11. Questions an agent should ask before changing scope

1. Does this change the locked problem statement?
2. Does this add a high-risk decision such as loan approval or medical diagnosis?
3. Does this require real worker data?
4. Does this make the MVP too large?
5. Does this improve the worker’s ability to find work, manage money, stay healthy, or grow skills?

If the answer to any question suggests scope creep, do not implement it without approval.
