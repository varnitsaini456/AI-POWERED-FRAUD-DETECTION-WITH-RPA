"""
AI-Powered Fraud Detection - API Backend
FastAPI server that serves fraud predictions with SHAP explanations.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional
import sys
import os

# Add parent directory so we can import from ml/ and rpa/
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "rpa"))
from ml.predict import load_model, predict

# Import RPA bots so the API can trigger them when fraud is detected
from rpa.bot1_alert import send_alert
from rpa.bot2_case import create_case
from rpa.bot3_report import generate_report
from rpa.bot4_logger import log_full_pipeline

# ============================================================================
# App Setup
# ============================================================================
@asynccontextmanager
async def lifespan(app):
    """Load the XGBoost model when the server starts."""
    print("Loading fraud detection model...")
    load_model()
    print("Model ready! Server is accepting requests.")
    yield

app = FastAPI(
    title="Fraud Detection API",
    description="AI-Powered Fraud Detection with XGBoost + SHAP Explanations",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow React frontend (localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request / Response Models
# ============================================================================
class TransactionRequest(BaseModel):
    """
    Transaction data for fraud prediction.
    All fields are optional - missing features default to 0.
    """
    TransactionID: Optional[float] = 0
    TransactionDT: Optional[float] = 0
    TransactionAmt: Optional[float] = 0
    ProductCD: Optional[float] = 0
    card1: Optional[float] = 0
    card2: Optional[float] = 0
    card3: Optional[float] = 0
    card4: Optional[float] = 0
    card5: Optional[float] = 0
    card6: Optional[float] = 0

    model_config = ConfigDict(extra="allow")  # Accept any additional fields (all 471 features)


class ShapFeature(BaseModel):
    feature: str
    shap_value: float
    direction: str


class PredictionResponse(BaseModel):
    fraud_probability: float
    is_fraud: int
    risk_level: str
    shap_explanation: list[ShapFeature]
    rpa_triggered: Optional[bool] = False
    rpa_actions: Optional[list] = None


# ============================================================================
# Endpoints
# ============================================================================
@app.get("/health")
def health_check():
    """Check if the server and model are running."""
    return {"status": "healthy", "model": "XGBoost Fraud Detection"}


@app.post("/predict", response_model=PredictionResponse)
def predict_fraud(transaction: TransactionRequest):
    """
    Predict fraud probability for a transaction.

    Returns fraud probability, risk level (LOW/MEDIUM/HIGH),
    and SHAP explanation of top contributing features.

    If fraud_probability > 0.5, automatically triggers RPA pipeline:
        Bot 1 (Alert) -> Bot 2 (Case) -> Bot 3 (Report) -> Bot 4 (Logger)
    """
    try:
        # Convert request to dict (includes all extra fields too)
        transaction_dict = transaction.model_dump()
        result = predict(transaction_dict)

        # Auto-trigger RPA pipeline if fraud detected
        if result["fraud_probability"] > 0.5:
            # Build transaction context for bots
            txn_context = {
                "id": f"TXN-{int(transaction_dict.get('TransactionID', 0)) or 'LIVE'}",
                "customer": "Live User",
                "amount": transaction_dict.get("TransactionAmt", 0),
                "merchant": "Live Transaction",
                "city": "Unknown",
                "card": "Live Card",
                "fraud_probability": result["fraud_probability"],
                "shap_explanation": result["shap_explanation"],
            }

            # Run all 4 bots in sequence
            alert_result = send_alert(txn_context)
            case_result = create_case(txn_context)
            report_result = generate_report(txn_context, case_id=case_result["case_id"])
            bot_results = [alert_result, case_result, report_result]
            log_result = log_full_pipeline(txn_context, bot_results)

            result["rpa_triggered"] = True
            result["rpa_actions"] = [
                {"bot": "Bot 1 - Alert", "status": "sent", "detail": "SMS + Email dispatched"},
                {"bot": "Bot 2 - Case", "status": "created", "detail": f"Case {case_result['case_id']} assigned to {case_result['assigned_to']}"},
                {"bot": "Bot 3 - Report", "status": "generated", "detail": f"STR {report_result['report_id']} saved"},
                {"bot": "Bot 4 - Logger", "status": "logged", "detail": f"{log_result['entries_logged']} entries recorded"},
            ]
        else:
            result["rpa_triggered"] = False
            result["rpa_actions"] = []

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ============================================================================
# Run with: uvicorn app:app --reload
# Or:       python app.py
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
