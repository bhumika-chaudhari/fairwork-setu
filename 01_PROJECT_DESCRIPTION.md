# Project Description: Setu

## 1. Product vision

**Setu** is an AI-powered livelihood companion for India’s informal and gig workers. It helps workers move from daily survival work toward greater income stability, better work opportunities, improved financial resilience, and skill growth.

The name **Setu** means “bridge.” The application acts as a bridge between:

- A worker’s current skills and nearby work opportunities.
- Irregular daily earnings and planned savings.
- Health needs and verified public health/welfare resources.
- Informal experience and a structured digital Skill Passport.

## 2. Target users

Setu is designed for workers who may not have a formal contract, salary slip, resume, or stable monthly income.

Primary user groups:

- Construction and road-work labourers
- Electricians, plumbers, painters, carpenters, and masons
- Domestic workers and home-service professionals
- Street vendors and small traders
- Auto-rickshaw and taxi drivers
- Delivery and ride-hailing workers
- Tailors, loaders, warehouse workers, and daily-wage workers
- Migrant workers in cities

## 3. User pain points

| Pain point | Setu response |
|---|---|
| Workers do not know where to find suitable nearby work | Kaam module recommends work based on skill, location, and availability |
| Income is irregular and difficult to plan | Dhan module records earnings and forecasts weekly income |
| Workers do not track expenses or savings | Dhan module categorizes expenses and suggests small savings actions |
| Workers lack a resume or digital proof of skills | Kaushal module creates a Skill Passport |
| Workers do not know nearby affordable health services | Sehat module shows verified public health-resource information |
| Workers are unaware of welfare and skilling options | Sehat/Kaushal modules provide source-linked discovery |
| Many workers prefer speaking over typing | Voice-first Hindi/English interaction |
| Apps are often text-heavy and difficult to use | Large buttons, simple cards, and minimal reading |

## 4. Product modules

### 4.1 Kaam — Work Discovery

The worker provides their occupation, skills, city, and availability. Setu recommends relevant nearby work opportunities.

Example:

> Worker profile: Electrician, Pune, skills: wiring, fan repair, switchboard repair.  
> Setu shows: “Electrician helper — 2.4 km away — 92% skill match.”

### 4.2 Dhan — Money and Stability

The worker records income and expenses by voice or simple form.

Example:

> “Aaj 900 rupaye kamaye, 150 petrol mein gaye.”

Setu extracts:

- Income: ₹900
- Expense: ₹150
- Category: Travel/Fuel
- Net income: ₹750
- Date: Today

It then updates income trends, forecasts future earnings, and suggests savings actions.

### 4.3 Sehat — Health and Welfare Discovery

The worker can ask:

> “Mujhe sasta hospital chahiye.”

Setu shows nearby public health facilities and relevant verified welfare information. It does **not** diagnose illness.

### 4.4 Kaushal — Skill Passport

Setu converts a worker’s spoken profile into a structured digital profile.

Example output:

```text
Skill Passport — Ramesh Kumar
Occupation: Electrician
City: Pune
Skills: House wiring, fan repair, switchboard repair
Experience: 4 years
Languages: Hindi, Marathi
Availability: Full-time
Average recorded daily income: ₹720
```

The worker can download this as a PDF and share it with employers, contractors, or training providers.

## 5. AI/ML role

AI/ML is used to make the app useful without requiring workers to fill complex forms.

| Capability | AI/ML method |
|---|---|
| Convert speech to text | Whisper / IndicConformer |
| Extract income, expense, date, and category | NER + classification |
| Forecast weekly income | Regression / time-series model |
| Match worker to jobs | Sentence embeddings + similarity ranking |
| Recommend courses and schemes | Content-based recommendation + retrieval |
| Answer health/welfare questions | Retrieval-Augmented Generation with citations |
| Create Skill Passport | Skill extraction + template generation |
| Detect unusual income or expense patterns | Anomaly detection |

## 6. Expected outcome

By the end of the project, Setu should demonstrate:

1. A worker can create a profile through voice or a simple form.
2. A worker can record income and expenses by speaking.
3. The app can forecast weekly earnings.
4. The app can recommend relevant nearby work.
5. The app can generate a Skill Passport PDF.
6. The app can retrieve relevant health/welfare information with source links.
7. The app works in Hindi and English with a clean, accessible mobile UI.

## 7. Project positioning

**Setu is not a legal-advice app, bank, insurer, doctor, or employment agency.**

It is an **AI livelihood assistant** that helps workers organize their work, money, health-resource discovery, and skills.
