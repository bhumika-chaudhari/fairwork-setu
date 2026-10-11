# API Specification

## 1. Base URL

```text
https://api.setu-app.in/v1
```

For local development:

```text
http://localhost:8000/api/v1
```

## 2. Authentication

Use JWT bearer tokens.

```http
Authorization: Bearer <access_token>
```

## 3. Response format

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Request successful"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be greater than zero"
  }
}
```

## 4. Auth endpoints

### `POST /auth/request-otp`

Request:

```json
{
  "phone_number": "+919999999999"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP sent"
}
```

### `POST /auth/verify-otp`

Request:

```json
{
  "phone_number": "+919999999999",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "user_id": 1
  }
}
```

## 5. Profile endpoints

### `GET /users/me`

Returns the logged-in worker profile.

### `PATCH /users/me`

Updates profile fields.

Request:

```json
{
  "name": "Ramesh Kumar",
  "city": "Pune",
  "occupation": "Electrician",
  "preferred_language": "hi"
}
```

### `POST /users/me/skills`

Request:

```json
{
  "skills": ["wiring", "fan repair", "switchboard repair"],
  "experience_years": 4
}
```

## 6. Voice endpoints

### `POST /ai/transcribe`

Uploads audio and returns transcript.

Request: `multipart/form-data`

| Field | Type |
|---|---|
| audio | file |
| language_hint | string, optional |

Response:

```json
{
  "success": true,
  "data": {
    "transcript": "आज 800 रुपये कमाए, 150 पेट्रोल में गए",
    "language": "hi",
    "confidence": 0.91
  }
}
```

### `POST /ai/extract`

Converts transcript into structured entries.

Request:

```json
{
  "transcript": "आज 800 रुपये कमाए, 150 पेट्रोल में गए",
  "language": "hi"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "income": {
      "amount": 800,
      "category": "daily_wage",
      "date": "2026-10-11"
    },
    "expense": {
      "amount": 150,
      "category": "travel_fuel",
      "date": "2026-10-11"
    }
  }
}
```

## 7. Money endpoints

### `POST /money/income`

Request:

```json
{
  "amount": 800,
  "category": "daily_wage",
  "work_type": "electrician",
  "entry_date": "2026-10-11",
  "source": "voice"
}
```

### `GET /money/income`

Query parameters:

- `start_date`
- `end_date`
- `group_by`: `day`, `week`, `month`

### `POST /money/expenses`

Request:

```json
{
  "amount": 150,
  "category": "travel_fuel",
  "entry_date": "2026-10-11",
  "source": "voice"
}
```

### `GET /money/summary`

Response:

```json
{
  "success": true,
  "data": {
    "today_income": 800,
    "today_expense": 150,
    "week_income": 4650,
    "month_income": 18200,
    "net_month_income": 12300,
    "savings_progress": 25
  }
}
```

### `GET /money/forecast`

Response:

```json
{
  "success": true,
  "data": {
    "forecast_start": "2026-10-12",
    "forecast_end": "2026-10-18",
    "predicted_income": 4600,
    "lower_bound": 3900,
    "upper_bound": 5400,
    "confidence": "medium"
  }
}
```

### `GET /money/stability-score`

Response:

```json
{
  "success": true,
  "data": {
    "score": 62,
    "label": "Stable",
    "factors": {
      "income_regularity": 18,
      "savings_rate": 16,
      "emergency_fund": 12,
      "work_consistency": 9,
      "expense_stability": 7
    }
  }
}
```

## 8. Job endpoints

### `GET /jobs/recommendations`

Query parameters:

- `city`
- `skill`
- `latitude`
- `longitude`
- `availability`
- `limit`

Response:

```json
{
  "success": true,
  "data": [
    {
      "job_id": 102,
      "title": "Electrician Helper",
      "match_score": 0.92,
      "distance_km": 2.4,
      "pay_min": 700,
      "pay_max": 900,
      "reason": "Matches wiring and fan-repair skills"
    }
  ]
}
```

### `POST /jobs/{job_id}/interest`

Marks that the worker is interested in a job.

## 9. Health and welfare endpoints

### `GET /health/resources`

Query parameters:

- `city`
- `latitude`
- `longitude`
- `resource_type`
- `radius_km`

### `POST /assistant/ask`

Request:

```json
{
  "question": "Mujhe sarkari health scheme ke baare mein batao",
  "language": "hi"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "answer": "आप e-Shram जैसी आधिकारिक जानकारी देख सकते हैं। नीचे दिए स्रोतों से पुष्टि करें।",
    "sources": [
      {
        "title": "e-Shram One Stop Solution",
        "url": "https://eshram.gov.in/One-Stop-Solution"
      }
    ],
    "confidence": "medium"
  }
}
```

## 10. Skill Passport endpoint

### `POST /kaushal/passport`

Generates a Skill Passport PDF.

Response:

```json
{
  "success": true,
  "data": {
    "passport_id": 12,
    "pdf_url": "https://storage.example.com/passports/W001.pdf"
  }
}
```

## 11. Error codes

| Code | Meaning |
|---|---|
| `AUTH_REQUIRED` | Missing or invalid token |
| `VALIDATION_ERROR` | Invalid request data |
| `NOT_FOUND` | Resource does not exist |
| `MODEL_ERROR` | AI/ML inference failed |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |
