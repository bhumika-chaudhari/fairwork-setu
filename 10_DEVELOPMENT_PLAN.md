# Development Plan

## 1. Build order

Do not build all modules at once. Follow this order.

## Phase 1: Foundation — Week 1

### Goals

- Set up GitHub repository
- Create backend and mobile-app folders
- Set up PostgreSQL
- Implement phone-number login
- Create basic worker profile

### Deliverables

- Running FastAPI server
- Running React Native/Expo app
- Database connection
- User registration and profile API

## Phase 2: Money Module — Week 2

### Goals

- Add income entry
- Add expense entry
- Build Dhan dashboard
- Add weekly income chart
- Implement simple savings goal

### Deliverables

- Manual income/expense entry
- Income and expense history
- Weekly/monthly summary
- Savings progress ring

## Phase 3: Voice AI — Week 3

### Goals

- Add microphone recording
- Integrate Whisper or hosted ASR
- Extract amount, category, and date
- Show editable confirmation screen

### Deliverables

- “Bol kar add karo” feature
- Voice-to-income entry
- Voice-to-expense entry
- Transcript review screen

## Phase 4: Kaam Module — Week 4

### Goals

- Create job dataset
- Add skill-based job matching
- Build Kaam screen
- Show match score and distance

### Deliverables

- Job recommendation API
- Job cards UI
- Skill-match explanation

## Phase 5: Kaushal Module — Week 5

### Goals

- Generate Skill Passport
- Add PDF generation
- Add course/skill recommendations

### Deliverables

- Skill Passport screen
- PDF download
- Basic course suggestions

## Phase 6: Sehat and RAG — Week 6

### Goals

- Add health-resource search
- Build RAG knowledge base
- Add source-linked question answering
- Add disclaimers

### Deliverables

- Sehat screen
- Assistant Q&A
- Source cards
- Emergency helpline section

## Phase 7: Polish and Demo — Week 7

### Goals

- Improve Hindi UI
- Add empty/error states
- Improve charts
- Test on a real Android phone
- Prepare demo script
- Write project report

### Deliverables

- Final APK or Expo demo
- Demo video
- Project report
- Presentation slides

## 8. Team allocation

For a 4-member team:

| Member | Responsibility |
|---|---|
| Member 1 | React Native UI, navigation, charts, voice UI |
| Member 2 | FastAPI backend, PostgreSQL, authentication, APIs |
| Member 3 | ML models: NER, classification, forecasting, matching |
| Member 4 | RAG, datasets, health/scheme data, PDF generation, testing |

All members should contribute to testing and documentation.

## 9. Definition of done

A feature is complete only when:

- Backend API works.
- Mobile UI works.
- Data is saved correctly.
- The feature works in Hindi and English.
- Basic errors are handled.
- The feature is tested on an Android phone.
- Documentation is updated.

## 10. Demo script

1. Open Setu in Hindi.
2. Create a worker profile: “Electrician, Pune.”
3. Say: “Aaj 900 kamaye, 150 petrol mein gaye.”
4. Show Dhan dashboard and forecast.
5. Search: “Mujhe electrician ka kaam chahiye.”
6. Show ranked job cards.
7. Ask: “Mujhe sarkari health scheme ke baare mein batao.”
8. Show source-linked answer.
9. Generate and download Skill Passport PDF.
10. Explain privacy, safety, and future scope.
