"""
FastAPI Server for Setu AI/ML Financial Intelligence Service.
Exposes REST endpoints for:
1. Linear Regression (Cash Flow Forecast)
2. Logistic Regression (Budget Risk)
3. PyTorch LSTM (Deep Learning Sequential Forecast)
4. K-Means Clustering (Spending Pattern Discovery)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.linear_regression import linear_model
from models.logistic_regression import logistic_model
from models.lstm_model import lstm_model
from models.kmeans_clustering import kmeans_model
from marketplace import marketplace_router
from health_service import health_router
from ai_models_router import ai_models_router
from notifications_router import notifications_router
from database import init_db
from user_router import user_router
from transactions_router import transactions_router
from auth_router import auth_router

app = FastAPI(
    title="Setu Financial & Livelihood Marketplace Service",
    description="Production-grade AI/ML Microservice for cash flow forecasting, budget risk analysis, LSTM sequence prediction, transaction clustering, worker marketplace, 8 integrated ML models, and smart cross-platform notifications.",
    version="1.0.0",
)

# Enable CORS for local dev and future Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        init_db()
        print("[Database] Schema initialized successfully.")
    except Exception as e:
        print(f"[Database] Warning: Schema initialization encountered an issue: {e}")

app.include_router(marketplace_router)
app.include_router(health_router)
app.include_router(ai_models_router)
app.include_router(notifications_router)
app.include_router(user_router)
app.include_router(transactions_router)
app.include_router(auth_router)



# Request schemas
class TransactionItem(BaseModel):
    id: Optional[str] = None
    type: str  # 'income' or 'expense'
    amount: float
    category: Optional[str] = "other"
    description: Optional[str] = ""
    timestamp: str  # ISO string
    workRef: Optional[str] = None


class PredictPayload(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    budget: Optional[float] = 5000.0
    period_days: Optional[int] = 30
    force_demo: Optional[bool] = False


class TrainPayload(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    force_demo: Optional[bool] = False
    clusters: Optional[int] = 3


# Endpoints
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "setu-ml-engine",
        "timestamp": datetime.now().isoformat(),
        "frameworks": ["scikit-learn 1.5.2", "PyTorch 2.5.1", "FastAPI 0.115.6"],
    }


@app.get("/models/status")
def get_all_models_status():
    """
    Returns high-level status of all 4 models for dashboard overview and AI Lab header.
    """
    return {
        "linear_regression": {
            "name": "Linear Regression",
            "purpose": "Cash Flow & Balance Forecast",
            "status": "trained" if linear_model.model else "not_trained",
            "is_synthetic": linear_model.is_synthetic_training,
            "last_trained": linear_model.last_trained,
            "key_metric": f"R²: {linear_model.metrics.get('r2_score', 'N/A')}",
        },
        "logistic_regression": {
            "name": "Logistic Regression",
            "purpose": "Budget Risk Classification",
            "status": "trained" if logistic_model.model else "not_trained",
            "is_synthetic": True,
            "last_trained": logistic_model.last_trained,
            "key_metric": f"ROC-AUC: {logistic_model.metrics.get('roc_auc', 'N/A')}",
        },
        "lstm_deep_learning": {
            "name": "LSTM Neural Network",
            "purpose": "Sequential Cash Flow Forecast",
            "status": "demo_mode"
            if lstm_model.is_demo_mode
            else ("trained" if lstm_model.model else "not_trained"),
            "is_synthetic": lstm_model.is_demo_mode,
            "last_trained": lstm_model.last_trained,
            "key_metric": f"Test MAE: ₹{lstm_model.metrics.get('test_mae', 'N/A')}",
        },
        "kmeans_clustering": {
            "name": "K-Means Clustering",
            "purpose": "Spending Pattern Discovery",
            "status": "trained" if kmeans_model.model else "not_trained",
            "is_synthetic": kmeans_model.metrics.get("is_synthetic", False),
            "last_trained": kmeans_model.last_trained,
            "key_metric": f"Clusters: {kmeans_model.metrics.get('n_clusters', 3)}",
        },
    }


@app.post("/models/train-all")
def train_all_models(payload: TrainPayload):
    """
    Trains all 4 models in sequence.
    """
    lr_res = linear_model.train(payload.transactions)
    log_res = logistic_model.train()
    lstm_res = lstm_model.train(payload.transactions, force_demo=payload.force_demo)
    km_res = kmeans_model.train(payload.transactions, n_clusters=payload.clusters or 3)

    return {
        "status": "all_models_trained",
        "linear_regression": lr_res,
        "logistic_regression": log_res,
        "lstm": lstm_res,
        "kmeans": km_res,
    }


# -------------------------------------------------------------
# MODEL 1: LINEAR REGRESSION ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/linear-regression/train")
def train_linear_regression(payload: TrainPayload):
    try:
        return linear_model.train(payload.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/linear-regression/predict")
def predict_linear_regression(payload: PredictPayload):
    try:
        return linear_model.predict_next_7_days(payload.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# MODEL 2: LOGISTIC REGRESSION ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/logistic-regression/train")
def train_logistic_regression(payload: TrainPayload):
    try:
        return logistic_model.train()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/logistic-regression/predict")
def predict_logistic_regression(payload: PredictPayload):
    try:
        return logistic_model.predict_risk(
            raw_transactions=payload.transactions,
            budget_amount=payload.budget or 5000.0,
            period_days=payload.period_days or 30,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# MODEL 3: LSTM DEEP LEARNING ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/lstm/train")
def train_lstm(payload: TrainPayload):
    try:
        return lstm_model.train(
            raw_transactions=payload.transactions,
            force_demo=payload.force_demo or False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/lstm/predict")
def predict_lstm(payload: PredictPayload):
    try:
        return lstm_model.predict_next_7_days(
            raw_transactions=payload.transactions,
            force_demo=payload.force_demo or False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# MODEL 4: K-MEANS CLUSTERING ENDPOINTS
# -------------------------------------------------------------
@app.post("/models/kmeans/train")
def train_kmeans(payload: TrainPayload):
    try:
        return kmeans_model.train(
            raw_transactions=payload.transactions,
            n_clusters=payload.clusters or 3,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/kmeans/predict")
def predict_kmeans(payload: PredictPayload):
    try:
        return kmeans_model.predict_clusters(payload.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# HAQ SETU: WORKER RIGHTS & ACCOUNT RECOVERY ENDPOINTS
# -------------------------------------------------------------

class HaqCaseAssessmentPayload(BaseModel):
    platform: str
    problem_type: str
    date_occurred: Optional[str] = "Recent days"
    reason_given: Optional[str] = "not_sure"
    reason_category: Optional[str] = "other"
    has_screenshot: Optional[bool] = False
    pasted_text_length: Optional[int] = 0
    has_contacted_support: Optional[bool] = False
    has_submitted_appeal: Optional[bool] = False
    ticket_number: Optional[str] = ""
    requested_outcome: Optional[str] = "fair_review"
    average_daily_income: Optional[float] = 850.0


class HaqAppealPayload(BaseModel):
    platform: str
    problem_type: str
    date_occurred: Optional[str] = "Recent days"
    reason_given: Optional[str] = "not_sure"
    reason_category: Optional[str] = "other"
    pasted_text: Optional[str] = ""
    user_description: Optional[str] = ""
    ticket_number: Optional[str] = ""
    requested_outcome: Optional[str] = "fair_review"
    worker_name: Optional[str] = "[Worker Name]"
    worker_id: Optional[str] = "[Partner ID]"
    language: Optional[str] = "en"
    bilingual: Optional[bool] = True


class HaqCaseItem(BaseModel):
    id: str
    platform: str
    category: str
    title: str
    dateOccurred: str
    createdAt: str
    updatedAt: str
    status: str
    ticketNumber: Optional[str] = None
    followUpDate: Optional[str] = None
    notes: Optional[str] = None
    appealSubject: Optional[str] = None
    appealBody: Optional[str] = None
    outcomeRequested: Optional[str] = None
    evidenceSummary: Optional[str] = None
    hasEvidence: Optional[bool] = False


# In-memory case storage
HAQ_CASES_DB: Dict[str, Dict[str, Any]] = {}


@app.get("/haq-setu/legal-sources")
def get_legal_sources():
    """
    Returns verified primary statutory and legal sources regarding gig worker rights in India.
    """
    return [
        {
            "id": "raj-gig-act-2023",
            "jurisdiction": "Rajasthan",
            "title": "The Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023",
            "authority": "Government of Rajasthan (Act No. 18 of 2023)",
            "officialUrl": "https://labour.rajasthan.gov.in",
            "relevantProvision": "Section 16 & 17: Grievance Redressal and Opportunity to be Heard",
            "effectiveDate": "September 2023",
            "lastVerifiedDate": "October 2024",
            "reviewStatus": "Gazette Published",
            "workerScope": "All platform gig workers registered in Rajasthan",
            "summary": "India's landmark legislation establishing a dedicated Gig Workers Welfare Board, a Social Security and Welfare Fund funded by a fee on platform transactions, and statutory rights to grievance redressal.",
            "keyRights": [
                "Right to be registered with the Welfare Board upon onboarding",
                "Right to access social security benefits funded by transaction cess",
                "Right to a formal hearing before unilateral termination or deactivation",
                "Right to petition the Appellate Authority against aggregator unfair actions"
            ]
        },
        {
            "id": "code-social-security-2020",
            "jurisdiction": "National (India)",
            "title": "The Code on Social Security, 2020 (Central Act No. 36 of 2020)",
            "authority": "Ministry of Labour and Employment, Government of India",
            "officialUrl": "https://labour.gov.in/sites/default/files/SS_Code_Gazette.pdf",
            "relevantProvision": "Chapter IX, Section 114: Framing of Welfare Schemes for Gig and Platform Workers",
            "effectiveDate": "Enacted by Parliament (Rules under progressive rollout)",
            "lastVerifiedDate": "October 2024",
            "reviewStatus": "Gazette Published",
            "workerScope": "Nationwide platform workers and informal gig delivery partners",
            "summary": "First national legal recognition defining 'gig worker' and 'platform worker' in Indian statutory law, empowering Central/State Governments to formulate targeted social security schemes.",
            "keyRights": [
                "Formal legal definition separating platform workers from general contractors",
                "National Social Security Board for Gig Workers with worker representation",
                "Contribution mandate requiring aggregators to contribute 1-2% of annual turnover",
                "Registration on national worker registries (e-Shram)"
            ]
        },
        {
            "id": "karn-gig-bill-2024",
            "jurisdiction": "Karnataka",
            "title": "Karnataka Platform-based GIG Workers (Social Security and Welfare) Bill, 2024",
            "authority": "Labour Department, Government of Karnataka",
            "officialUrl": "https://labour.karnataka.gov.in",
            "relevantProvision": "Clause 14: Fair Contract Terms & Notice Period before Termination",
            "effectiveDate": "Introduced in Assembly (July 2024)",
            "lastVerifiedDate": "October 2024",
            "reviewStatus": "Draft Bill",
            "workerScope": "Delivery, ride-hailing, and home-service gig workers in Karnataka",
            "summary": "Proposes minimum 14-day notice before contract termination or permanent deactivation, mandatory disclosure of algorithmic scoring criteria, and internal dispute resolution committees.",
            "keyRights": [
                "Prohibition of abrupt algorithmic deactivation without human review",
                "Mandatory written explanation detailing the breach of terms before deactivation",
                "Internal Dispute Resolution Committee mandated for every aggregator",
                "Appeals mechanism to the state Labour Commissioner"
            ]
        },
        {
            "id": "principles-natural-justice",
            "jurisdiction": "National (India)",
            "title": "Doctrine of Natural Justice & Contractual Fairness (Audi Alteram Partem)",
            "authority": "Supreme Court of India (Constitutional Precedents)",
            "officialUrl": "https://main.sci.gov.in",
            "relevantProvision": "Right to Notice and Opportunity to be Heard in Commercial Contracts",
            "effectiveDate": "Established Constitutional Jurisprudence",
            "lastVerifiedDate": "October 2024",
            "reviewStatus": "Verified by Legal Literacy Desk",
            "workerScope": "Contractual workers and commercial delivery partners across India",
            "summary": "Under Indian contract law and constitutional jurisprudence, arbitrary deprivation of livelihood without reasonable notice or opportunity to respond violates fundamental fairness and the implied covenant of good faith.",
            "keyRights": [
                "Right to receive specific notice stating reasons for adverse platform action",
                "Right to inspect records or complaints cited as the basis for account suspension",
                "Right to submit a formal counter-explanation before a final decision is locked",
                "Protection against punitive penalties imposed without contractual basis"
            ]
        }
    ]


@app.post("/haq-setu/assess-case")
def assess_haq_case(payload: HaqCaseAssessmentPayload):
    """
    Performs structured assessment of an account deactivation or penalty dispute.
    Returns categorized facts, unconfirmed items, a tailored action checklist, and legal references.
    """
    platform = payload.platform
    date_str = payload.date_occurred or "Recent days"

    summary_told = [
        f"Platform affected: {platform}.",
        f"Problem reported: {payload.problem_type.replace('_', ' ').capitalize()}.",
        f"Occurred on: {date_str}.",
        f"Notice received: {'Yes' if payload.reason_given == 'yes_message' else 'No clear reason provided'}.",
        f"Evidence attached: {'Screenshot provided' if payload.has_screenshot else 'Pasted message text' if payload.pasted_text_length > 0 else 'None (proceeding factually)'}.",
        f"Support contacted: {'Yes' if payload.has_contacted_support else 'Not yet'}{f' (Ticket: {payload.ticket_number})' if payload.ticket_number else ''}.",
        f"Outcome requested: {payload.requested_outcome.replace('_', ' ').capitalize()}."
    ]

    what_we_know = [
        f"Worker reported disruption of platform account access on {platform}.",
        "Established natural justice principles require aggregators to provide notice and opportunity to be heard before permanent livelihood termination.",
        "Indian courts have consistently held that commercial terms must be exercised in good faith and without arbitrary discrimination."
    ]

    needs_confirmation = [
        "The specific order ID, delivery timestamp, or system rule cited by the aggregator has not yet been officially produced with evidence.",
        "Whether this action was triggered by an automated algorithmic threshold or was confirmed by a designated human grievance officer."
    ]

    checklist = [
        {
            "step": 1,
            "title": "Preserve all notices and delivery order records",
            "detail": "Save the deactivation SMS, app screenshots, order history logs, and any recent customer tips or positive ratings.",
            "urgency": "high"
        },
        {
            "step": 2,
            "title": "Submit formal written inquiry requesting specific clause & evidence",
            "detail": f"Send the prepared appeal to {platform} partner support. Request the specific order ID or policy clause cited.",
            "urgency": "high"
        },
        {
            "step": 3,
            "title": "Request a 48-hour human review window",
            "detail": "Ask platform support to assign a human review officer to inspect your lifetime delivery count, overall rating, and tenure.",
            "urgency": "medium"
        },
        {
            "step": 4,
            "title": "Note down reference number and follow-up deadline",
            "detail": "Always save the ticket reference number, submission date, and set a reminder to follow up in 48 hours.",
            "urgency": "standard"
        },
        {
            "step": 5,
            "title": "Explore temporary alternative earnings on Kaam",
            "detail": "While your appeal is under review, check nearby open shifts or secondary platform opportunities on Setu Kaam.",
            "urgency": "standard"
        }
    ]

    daily_avg = payload.average_daily_income or 850.0
    estimated_weekly_loss = round(daily_avg * 7)

    return {
        "summaryWhatYouToldUs": summary_told,
        "whatWeKnow": what_we_know,
        "whatNeedsConfirmation": needs_confirmation,
        "checklist": checklist,
        "applicableRights": [
            {
                "title": "Right to Notice and Fair Hearing (Audi Alteram Partem)",
                "source": "Principles of Natural Justice & Contract Law",
                "url": "https://main.sci.gov.in",
                "provision": "Right to know specific allegations and present defense before livelihood loss"
            },
            {
                "title": "Platform Worker Grievance Redressal Right",
                "source": "The Rajasthan Platform Based Gig Workers Act, 2023 (Model Provision)",
                "url": "https://labour.rajasthan.gov.in",
                "provision": "Section 16: Mandatory grievance officer & dispute hearing"
            },
            {
                "title": "Recognition of Gig Worker Identity & Social Security",
                "source": "Code on Social Security, 2020",
                "url": "https://labour.gov.in",
                "provision": "Section 114: Statutory status for gig and platform delivery workers"
            }
        ],
        "estimatedShortfall": {
            "weeklyIncomeBaseline": daily_avg,
            "daysImpacted": 7,
            "estimatedLoss": estimated_weekly_loss,
            "disclaimer": "Estimated cash flow interruption based on your recorded daily earnings average. This is an informational projection to assist with emergency budgeting, not a guaranteed legal damage claim."
        }
    }


@app.post("/haq-setu/generate-appeal")
def generate_haq_appeal(payload: HaqAppealPayload):
    """
    Generates a polite, factual, and legally grounded appeal letter for platform partner support.
    """
    platform = payload.platform
    worker_name = payload.worker_name or "[Worker Name]"
    worker_id = payload.worker_id or "[Partner ID / Registered Phone]"
    ticket = f" (Reference Ticket: {payload.ticket_number})" if payload.ticket_number else ""
    date_str = payload.date_occurred or "recently"

    subject = f"[Formal Appeal] Urgent Review Request: Account Deactivation Reconsideration - {worker_id}"

    body = f"""To: The Partner Support & Grievance Officer,
{platform} Operations Desk

Subject: {subject}

Dear Grievance Officer,

I am writing this formal appeal to urgently request a human review and reconsideration of the account deactivation/suspension imposed on my partner account {date_str}{ticket}.

Worker Details:
- Partner / Registered Name: {worker_name}
- Partner ID / Registered Contact: {worker_id}
- Platform: {platform}

Issue Summary:
My partner account was deactivated/suspended {date_str}. {f'Regarding the notice: "{payload.pasted_text[:200]}"...' if payload.pasted_text else 'No specific evidence or order clause was communicated to me.'}
{f'Factual Context: {payload.user_description}' if payload.user_description else ''}

As an independent delivery worker dependent on platform earnings for my family's livelihood, I have consistently strived to adhere to platform policies, maintain customer satisfaction, and perform my duties with integrity.

Under established natural justice principles and fair commercial practice, I respectfully request:
1. A fair human review of the decision and an opportunity to inspect any specific order complaints.
2. An opportunity to provide supporting delivery timestamps or renewed verification documentation.
3. An official ticket / complaint reference number and the designated timeframe for response.

Thank you for your prompt and fair attention to this matter.

Yours sincerely,
{worker_name}
Contact: {worker_id}
Date: {datetime.now().strftime('%d %B %Y')}"""

    bilingual_expl = None
    if payload.bilingual:
        bilingual_expl = f"""[Hindi / Marathi Summary for Worker's Reference]:
यह औपचारिक पत्र आपके खाते को दोबारा चालू करवाने और कंपनी से निष्पक्ष जाँच की माँग करने के लिए तैयार किया गया है।
इसमें लिखा है कि:
• आपका खाता {date_str} को बंद किया गया था।
• आप कंपनी से अपील कर रहे हैं कि किसी इंसान द्वारा इसकी दोबारा जाँच की जाए।
• यदि कोई ग्राहक शिकायत या सिस्टम गलती है, तो आपको अपनी बात रखने और दस्तावेज दिखाने का मौका दिया जाए।
• इसे कंपनी के सपोर्ट डेस्क पर भेजें और टिकट नंबर अवश्य सुरक्षित रखें।"""

    return {
        "subject": subject,
        "recipient": f"support@{platform.lower().replace(' ', '')}.com",
        "body": body,
        "bilingualExplanation": bilingual_expl,
        "targetSupportEmail": f"support@{platform.lower().replace(' ', '')}.com",
        "targetSupportPortal": "https://consumerhelpline.gov.in",
        "language": payload.language or "en"
    }


@app.post("/haq-setu/cases")
def save_case(case: HaqCaseItem):
    """
    Saves a case into the backend store.
    """
    HAQ_CASES_DB[case.id] = case.dict()
    return {"status": "saved", "case_id": case.id}


@app.get("/haq-setu/cases")
def list_cases():
    """
    Lists all saved grievance cases.
    """
    return list(HAQ_CASES_DB.values())


@app.get("/haq-setu/cases/{case_id}")
def get_case(case_id: str):
    """
    Retrieves a specific grievance case by ID.
    """
    if case_id in HAQ_CASES_DB:
        return HAQ_CASES_DB[case_id]
    raise HTTPException(status_code=404, detail="Case not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
