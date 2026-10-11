# Ethics, Privacy, and Safety

## 1. Core principle

Setu assists workers. It does **not** make final decisions about employment, loans, insurance, medical treatment, welfare eligibility, or legal rights.

## 2. Privacy rules

### Data minimization

Collect only:

- Mobile number
- Name
- City/locality
- Occupation and skills
- Income/expense entries
- Optional location
- Optional profile photo

Do **not** collect:

- Bank passwords
- UPI PINs
- Aadhaar number
- Full ID documents
- Exact live location unless the user explicitly enables it
- Health records
- Biometric data

### User control

The worker must be able to:

- View their profile
- Edit information
- Delete income/expense entries
- Delete their account
- Withdraw consent for optional data collection

### Audio handling

- Process audio only to generate a transcript.
- Do not retain raw audio unless the user explicitly opts in.
- Delete temporary audio after processing.
- Do not use worker voice data to train public models without explicit informed consent.

## 3. Security

- Use HTTPS for all communication.
- Hash passwords or use OTP/JWT-based authentication.
- Encrypt sensitive data at rest where possible.
- Use role-based access control in the backend.
- Never expose database credentials in the frontend.
- Store API keys in environment variables.
- Validate all user inputs.
- Apply rate limiting to AI endpoints.

## 4. AI fairness

### Risks

- Job recommendations may favour certain localities, genders, or languages.
- Income forecasts may be inaccurate for seasonal workers.
- Health/welfare retrieval may miss state-specific information.
- A financial score could be misused as a credit score.

### Mitigations

- Test recommendations across gender, city, occupation, and language groups.
- Show reasons for every recommendation.
- Allow workers to edit skills and preferences.
- Use ranges instead of exact income predictions.
- Clearly label the Financial Stability Score as informational.
- Do not share scores with lenders or employers.

## 5. Health safety

Setu must not diagnose diseases.

If a worker reports emergency symptoms, the app must:

1. Show emergency numbers immediately.
2. Advise contacting local emergency services.
3. Show nearby verified health facilities if available.
4. Avoid giving treatment instructions.

Example:

> “यह आपातकालीन स्थिति हो सकती है। कृपया 108 या 112 पर संपर्क करें और नज़दीकी अस्पताल जाएँ।”

## 6. Employment safety

Setu must not guarantee jobs.

Every job recommendation should show:

- Source
- Pay range, if available
- Location
- Date
- “Verify before joining” message

The app should warn users never to pay money to get a job.

## 7. Financial safety

Setu must not:

- Approve loans
- Recommend a specific lender
- Promise returns
- Give investment advice
- Claim a worker is creditworthy

It may only help the worker understand their own recorded income, expenses, and savings progress.

## 8. Transparency

Every AI-generated recommendation should explain:

- Why it was suggested
- What data was used
- What the worker can change
- Where the information came from

Example:

> “यह काम सुझाया गया क्योंकि इसमें वायरिंग और फैन रिपेयर स्किल मैच हुई।”

## 9. Disclaimer text

Show this on onboarding and in relevant screens:

> **Setu केवल सूचना, रिकॉर्ड रखने और सुझाव देने के लिए है। यह कानूनी, चिकित्सा, रोजगार या वित्तीय सलाह नहीं देता। किसी भी निर्णय से पहले आधिकारिक स्रोत या योग्य विशेषज्ञ से पुष्टि करें।**

English version:

> **Setu provides information, record-keeping, and suggestions only. It does not provide legal, medical, employment, or financial advice. Please verify with official sources or qualified professionals before making decisions.**
