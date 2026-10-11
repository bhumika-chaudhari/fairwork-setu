# Requirements Specification

## 1. Functional requirements

### FR-1: User registration and login

- The worker shall register using a mobile number.
- The system shall support OTP-based login in the demonstration environment.
- The worker shall choose a preferred language: Hindi or English.
- The system shall create a unique worker profile.

### FR-2: Worker profile

The worker shall be able to add:

- Name
- City and locality
- Occupation
- Skills
- Years of experience
- Languages known
- Work availability
- Preferred work type
- Optional photo

Profile creation shall support both form input and voice input.

### FR-3: Voice input

- The worker shall be able to speak in Hindi or English.
- The system shall convert speech to text.
- The system shall extract structured information such as amount, date, work type, skill, and location.
- The worker shall be able to review and edit extracted information before saving.

### FR-4: Income tracking

The worker shall be able to record:

- Daily income
- Income source
- Work type
- Date
- Optional location

The system shall calculate daily, weekly, and monthly income.

### FR-5: Expense tracking

The worker shall be able to record expenses under categories such as:

- Travel/Fuel
- Food
- Rent
- Tools
- Mobile/Internet
- Medical
- Education
- Other

The system shall calculate net income as:

\[
	ext{Net Income} = 	ext{Total Income} - 	ext{Total Expenses}
\]

### FR-6: Savings goal

The worker shall be able to create an emergency-savings goal.

The system shall show:

- Target amount
- Current saved amount
- Remaining amount
- Suggested daily saving amount
- Progress percentage

### FR-7: Income forecasting

The system shall predict the worker’s expected income for the next 7 days.

The forecast shall show a range, not a single guaranteed value.

Example:

> “Next week’s expected income: ₹4,200–₹5,000.”

### FR-8: Financial Stability Score

The system shall generate a Financial Stability Score from 0 to 100 based on:

- Regularity of income entries
- Average income
- Savings rate
- Expense volatility
- Number of active work days
- Emergency-fund progress

The score is informational only and must not be used for loan approval.

### FR-9: Job/work discovery

The worker shall be able to search for work using:

- Skill
- City/locality
- Work type
- Availability
- Expected pay range

The system shall return ranked work suggestions with:

- Title
- Distance
- Pay range
- Skill-match score
- Work type
- Source

### FR-10: Skill Passport

The system shall generate a downloadable Skill Passport PDF containing:

- Worker name
- City
- Occupation
- Skills
- Experience
- Languages
- Availability
- Work history summary
- Average recorded income
- Generated date
- Disclaimer

### FR-11: Health-resource discovery

The worker shall be able to search for:

- Nearby government hospitals
- Primary health centres
- Clinics
- Emergency helplines

The system shall display source-linked information only.

### FR-12: Welfare and skilling discovery

The worker shall be able to ask questions such as:

- “Which schemes can I check?”
- “Is there any skill training near me?”
- “What is e-Shram?”

The system shall return relevant public information with source URLs.

### FR-13: Multilingual UI

The MVP shall support:

- Hindi
- English

The architecture shall allow additional Indian languages later.

### FR-14: Reports

The worker shall be able to download:

- Skill Passport PDF
- Monthly income summary
- Savings progress summary

### FR-15: Offline-friendly behaviour

The app should allow basic income/expense entries to be saved locally when internet is unavailable and synchronized later.

This is desirable but optional for the first demo.

## 2. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | The app must be usable on low-end Android phones |
| NFR-2 | Main screens must load within 2 seconds on a normal 4G connection |
| NFR-3 | Voice-to-text processing should complete within 5 seconds for short inputs |
| NFR-4 | The UI must support large fonts and high-contrast mode |
| NFR-5 | All text-background contrast must meet at least 4.5:1 for normal text |
| NFR-6 | The app must support Hindi and English |
| NFR-7 | Personal data must be stored securely and minimally |
| NFR-8 | The system must show source links for health/welfare information |
| NFR-9 | The system must clearly state that it does not provide legal, medical, or financial advice |
| NFR-10 | The backend API must be modular so new Indian languages and work categories can be added |

## 3. Hardware requirements

### Development

- Laptop with at least 8 GB RAM; 16 GB recommended for local ML experimentation
- Android phone for testing
- Microphone and internet connection

### Deployment

- Cloud backend with PostgreSQL
- Object storage for PDFs and optional profile photos
- GPU is not required for the MVP if speech-to-text uses an API or a small local model

## 4. Software requirements

| Component | Requirement |
|---|---|
| Mobile OS | Android 9+ preferred |
| Backend | Python 3.11+ |
| Database | PostgreSQL 15+ |
| Frontend | React Native / Expo |
| Package management | npm/pnpm for frontend, uv/pip for backend |
| Containerization | Docker and Docker Compose |
| Version control | Git and GitHub |

## 5. Acceptance criteria

The project is accepted for the semester demo when:

1. A worker can register and create a profile.
2. A worker can add income and expenses by voice.
3. Extracted income/expense data can be reviewed and edited.
4. The Dhan dashboard shows income trends and a 7-day forecast.
5. The Kaam screen shows ranked work suggestions.
6. The Kaushal screen generates a Skill Passport PDF.
7. The Sehat screen returns source-linked health/welfare information.
8. The app works in Hindi and English.
9. The app displays clear disclaimers for financial, health, and employment information.
