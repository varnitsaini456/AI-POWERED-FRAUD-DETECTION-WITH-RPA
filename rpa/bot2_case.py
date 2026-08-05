"""
RPA Bot 2: Case Bot
Auto-creates fraud cases in a SQLite database for investigation.
In production, this would integrate with a case management system like ServiceNow.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fraud_cases.db")


def init_database():
    """Create the fraud cases table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fraud_cases (
            case_id TEXT PRIMARY KEY,
            transaction_id TEXT,
            customer TEXT,
            amount REAL,
            merchant TEXT,
            city TEXT,
            fraud_probability REAL,
            risk_level TEXT,
            top_risk_factor TEXT,
            status TEXT DEFAULT 'open',
            assigned_to TEXT DEFAULT 'Fraud Analyst Team',
            created_at TEXT,
            updated_at TEXT,
            notes TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()


def create_case(transaction):
    """
    Create a new fraud case in the database.

    Args:
        transaction: dict with fraud transaction details.

    Returns:
        dict with case details.
    """
    init_database()

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    fraud_prob = transaction.get("fraud_probability", 0)

    # Generate case ID
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM fraud_cases")
    count = cursor.fetchone()[0]
    case_id = f"CASE-{count + 1:04d}"

    # Determine risk level and assignment
    if fraud_prob >= 0.7:
        risk_level = "HIGH"
        assigned_to = "Senior Fraud Analyst"
    elif fraud_prob >= 0.3:
        risk_level = "MEDIUM"
        assigned_to = "Fraud Analyst Team"
    else:
        risk_level = "LOW"
        assigned_to = "Auto-Review Queue"

    # Get top risk factor from SHAP
    shap_reasons = transaction.get("shap_explanation", [])
    top_factor = shap_reasons[0]["feature"] if shap_reasons else "N/A"

    # Insert case
    cursor.execute("""
        INSERT INTO fraud_cases
        (case_id, transaction_id, customer, amount, merchant, city,
         fraud_probability, risk_level, top_risk_factor, status,
         assigned_to, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id,
        transaction.get("id", "N/A"),
        transaction.get("customer", "Unknown"),
        transaction.get("amount", 0),
        transaction.get("merchant", "Unknown"),
        transaction.get("city", "Unknown"),
        fraud_prob,
        risk_level,
        top_factor,
        "open",
        assigned_to,
        timestamp,
        timestamp,
    ))
    conn.commit()
    conn.close()

    # Print simulation output
    print("\n" + "=" * 60)
    print("  BOT 2: CASE BOT - Case Created")
    print("=" * 60)
    print(f"  Case ID:        {case_id}")
    print(f"  Transaction:    {transaction.get('id', 'N/A')}")
    print(f"  Customer:       {transaction.get('customer', 'Unknown')}")
    print(f"  Amount:         Rs {transaction.get('amount', 0):,.2f}")
    print(f"  Fraud Score:    {fraud_prob * 100:.1f}%")
    print(f"  Risk Level:     {risk_level}")
    print(f"  Top Factor:     {top_factor}")
    print(f"  Assigned To:    {assigned_to}")
    print(f"  Status:         OPEN")
    print(f"  Database:       {DB_PATH}")
    print("=" * 60)

    return {
        "bot": "Bot 2 - Case",
        "status": "created",
        "case_id": case_id,
        "risk_level": risk_level,
        "assigned_to": assigned_to,
        "timestamp": timestamp,
        "db_path": DB_PATH,
    }


def get_all_cases():
    """Retrieve all cases from the database."""
    init_database()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fraud_cases ORDER BY created_at DESC")
    columns = [desc[0] for desc in cursor.description]
    cases = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return cases


# Quick test
if __name__ == "__main__":
    test_txn = {
        "id": "TXN-001234",
        "customer": "Rohan Sharma",
        "amount": 45000.00,
        "merchant": "Amazon India",
        "city": "Mumbai",
        "fraud_probability": 0.92,
        "shap_explanation": [
            {"feature": "TransactionAmt", "shap_value": 1.32, "direction": "increases fraud risk"},
        ],
    }
    result = create_case(test_txn)
    print(f"\nCase created: {result['case_id']}")

    print("\nAll cases in database:")
    for case in get_all_cases():
        print(f"  {case['case_id']} | {case['customer']} | Rs {case['amount']:,.2f} | {case['status']}")
