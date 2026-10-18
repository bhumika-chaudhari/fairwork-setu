"""
API Router for FairWork Setu's 8 AI Models.
Exposes endpoints for:
1. /api/models/expense-classify (Model 1)
2. /api/models/income-forecast (Model 2)
3. /api/models/anomaly-detect (Model 3)
4. /api/models/voice-transcribe (Model 4)
5. /api/models/extract-transaction (Model 5)
6. /api/models/job-match (Model 6)
7. /api/models/skill-recommend (Model 7)
8. /api/models/health-rag (Model 8)
9. /api/models/registry (Audit & Live Status)
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field

from ai_models_service import ai_models_service

ai_models_router = APIRouter(prefix="/api/models", tags=["ai_models"])


# -------------------------------------------------------------------------
# REQUEST SCHEMAS
# -------------------------------------------------------------------------

class ExpenseClassifyRequest(BaseModel):
    text: str = Field(..., description="Transaction narration, e.g. 'Petrol for bike 250 rs'")


class IncomeForecastRequest(BaseModel):
    periods: Optional[int] = Field(7, description="Forecast horizon in days (1 to 30)")
    history: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional list of [{'date': 'YYYY-MM-DD', 'amount': 850.0}]"
    )


class AnomalyDetectRequest(BaseModel):
    transactions: List[Dict[str, Any]] = Field(
        ...,
        description="List of transactions with amount, category, date, etc."
    )


class VoiceTranscribeRequest(BaseModel):
    hint_text: Optional[str] = Field(None, description="Optional text for simulation or fallback")


class TransactionExtractRequest(BaseModel):
    text: str = Field(..., description="Conversational text, e.g. 'Aaj zomato se 850 kamaya aur 200 ka petrol bharwaya'")


class JobMatchRequest(BaseModel):
    worker_profile: Dict[str, Any] = Field(
        default_factory=lambda: {
            "name": "Ramesh Kumar",
            "role": "Delivery Partner",
            "skills": ["Driving", "Two Wheeler", "Navigation", "Smartphone"],
            "location": "South Delhi"
        }
    )
    top_k: Optional[int] = 4


class SkillRecommendRequest(BaseModel):
    worker_profile: Dict[str, Any] = Field(
        default_factory=lambda: {
            "current_role": "Delivery Partner",
            "skills": ["Road Safety", "Two Wheeler Driving"],
            "target_role": "Fleet Supervisor or Commercial Van Driver",
            "interests": "Logistics, Vehicle Diagnostics"
        }
    )
    top_k: Optional[int] = 4


class HealthRAGRequest(BaseModel):
    query: str = Field(..., description="Query regarding healthcare or welfare schemes, e.g. 'Ayushman Bharat card hospital admission'")
    top_k: Optional[int] = 4


class AssistantIntentRequest(BaseModel):
    text: str = Field(..., description="Worker utterance in Hindi, Marathi, English, or Hinglish")
    language: Optional[str] = Field("auto", description="Spoken or typed language code")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Dialogue context")



# -------------------------------------------------------------------------
# ROUTES
# -------------------------------------------------------------------------

@ai_models_router.get("/registry")
def get_registry():
    """
    Returns audit status, algorithms, dataset details, and evaluation metrics for all 8 models.
    """
    return ai_models_service.get_models_registry()


@ai_models_router.post("/expense-classify")
def classify_expense(payload: ExpenseClassifyRequest):
    """
    Model 1: Predicts expense category from transaction text.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Transaction text cannot be empty.")
    return ai_models_service.classify_expense(payload.text)


@ai_models_router.post("/income-forecast")
def forecast_income(payload: IncomeForecastRequest):
    """
    Model 2: Generates recursive multi-step daily income forecast with lag features.
    """
    return ai_models_service.forecast_income(
        periods=payload.periods or 7,
        history_data=payload.history
    )


@ai_models_router.post("/anomaly-detect")
def detect_anomalies(payload: AnomalyDetectRequest):
    """
    Model 3: Evaluates transaction batch with Isolation Forest to detect irregular amounts or timings.
    """
    return ai_models_service.detect_anomalies(payload.transactions)


@ai_models_router.post("/voice-transcribe")
def voice_transcribe(payload: VoiceTranscribeRequest):
    """
    Model 4: Transcribes voice audio into text using OpenAI Whisper Tiny.
    """
    return ai_models_service.transcribe_audio(hint_text=payload.hint_text)


@ai_models_router.post("/extract-transaction")
def extract_transaction(payload: TransactionExtractRequest):
    """
    Model 5: Extracts amount, category, type (income/expense), and date from Hinglish input.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    return ai_models_service.extract_transaction(payload.text)


@ai_models_router.post("/job-match")
def match_jobs(payload: JobMatchRequest):
    """
    Model 6: Ranks open jobs based on semantic cosine similarity to worker profile.
    """
    return {
        "matched_jobs": ai_models_service.match_jobs(
            payload.worker_profile,
            top_k=payload.top_k or 4
        )
    }


@ai_models_router.post("/skill-recommend")
def recommend_skills(payload: SkillRecommendRequest):
    """
    Model 7: Recommends accredited PMKVY/NSDC upskilling courses tailored to worker skills and career goals.
    """
    return {
        "recommended_courses": ai_models_service.recommend_skills(
            payload.worker_profile,
            top_k=payload.top_k or 4
        )
    }


@ai_models_router.post("/health-rag")
def search_health_welfare_rag(payload: HealthRAGRequest):
    """
    Model 8: Retrieves verified government health and welfare scheme passages using FAISS.
    """
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    return ai_models_service.search_health_welfare_rag(
        payload.query,
        top_k=payload.top_k or 4
    )


@ai_models_router.post("/assistant-intent")
def parse_assistant_intent(payload: AssistantIntentRequest):
    """
    Unified Multilingual NLU & Action Router for Setu Voice Assistant.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Utterance text cannot be empty.")
    return ai_models_service.parse_assistant_intent(payload.text, context=payload.context)

