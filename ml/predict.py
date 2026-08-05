"""
Fraud Detection - Prediction Module
Loads the saved XGBoost model and returns predictions with SHAP explanations.
Used by the API (Phase 3) and RPA bots (Phase 5).
"""

import joblib
import pickle
import numpy as np
import pandas as pd
import shap
import os

# Path to saved model files (relative to this file)
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_detection_xgboost.pkl")
FEATURES_PATH = os.path.join(MODEL_DIR, "feature_names.pkl")

# Global variables - loaded once, reused for every prediction
_model = None
_feature_names = None
_explainer = None


def load_model():
    """Load the saved XGBoost model and feature names. Called once at startup."""
    global _model, _feature_names, _explainer

    _model = joblib.load(MODEL_PATH)
    with open(FEATURES_PATH, "rb") as f:
        _feature_names = pickle.load(f)
    _explainer = shap.TreeExplainer(_model)

    print(f"Model loaded: {len(_feature_names)} features")
    return _model


def predict(transaction_data):
    """
    Predict fraud for a single transaction.

    Args:
        transaction_data: dict or DataFrame with transaction features.

    Returns:
        dict with fraud_probability, risk_level, and shap_explanation.
    """
    if _model is None:
        load_model()

    # Convert dict to DataFrame if needed
    if isinstance(transaction_data, dict):
        df = pd.DataFrame([transaction_data])
    else:
        df = transaction_data.copy()

    # Ensure all expected features are present, fill missing with 0
    for col in _feature_names:
        if col not in df.columns:
            df[col] = 0

    # Keep only the features the model expects, in the correct order
    df = df[_feature_names]

    # Predict
    fraud_probability = float(_model.predict_proba(df)[:, 1][0])
    is_fraud = int(fraud_probability >= 0.5)

    # Risk level
    if fraud_probability < 0.3:
        risk_level = "LOW"
    elif fraud_probability < 0.7:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # SHAP explanation
    shap_values = _explainer.shap_values(df)
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]  # Fraud class
    else:
        shap_vals = shap_values[0]

    # Top 5 contributing features
    feature_contributions = sorted(
        zip(_feature_names, shap_vals),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:5]

    shap_explanation = [
        {
            "feature": name,
            "shap_value": round(float(val), 4),
            "direction": "increases fraud risk" if val > 0 else "decreases fraud risk"
        }
        for name, val in feature_contributions
    ]

    return {
        "fraud_probability": round(fraud_probability, 4),
        "is_fraud": is_fraud,
        "risk_level": risk_level,
        "shap_explanation": shap_explanation
    }


# Quick test when running this file directly
if __name__ == "__main__":
    load_model()
    print(f"\nModel ready! Expects {len(_feature_names)} features.")
    print(f"First 10 features: {_feature_names[:10]}")

    # Test with a dummy transaction (all zeros)
    print("\nTest prediction (dummy transaction):")
    result = predict({feat: 0 for feat in _feature_names})
    print(f"  Fraud probability: {result['fraud_probability']}")
    print(f"  Risk level: {result['risk_level']}")
    print(f"  Top reasons:")
    for item in result['shap_explanation']:
        print(f"    - {item['feature']}: {item['shap_value']:+.4f} ({item['direction']})")
