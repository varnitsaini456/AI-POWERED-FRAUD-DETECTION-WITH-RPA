"""
RPA Pipeline Orchestrator
Chains all 4 bots together: Fraud detected → Alert → Case → Report → Log

This is the main script that demonstrates the full RPA workflow.
Run this to simulate what happens when a fraud transaction is detected.
"""

import sys
import os

# Add parent directory for ml imports
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from bot1_alert import send_alert
from bot2_case import create_case
from bot3_report import generate_report
from bot4_logger import log_full_pipeline


def run_rpa_pipeline(transaction):
    """
    Execute the full RPA pipeline for a flagged transaction.

    Flow: Fraud Detection → Alert → Case Creation → Report → Logging

    Args:
        transaction: dict with transaction details and fraud score.

    Returns:
        dict with all bot results.
    """
    print("\n" + "#" * 70)
    print("#" + " " * 68 + "#")
    print("#    RPA FRAUD RESPONSE PIPELINE - INITIATED" + " " * 24 + "#")
    print("#" + " " * 68 + "#")
    print("#" * 70)
    print(f"\n  Transaction: {transaction.get('id', 'N/A')}")
    print(f"  Customer:    {transaction.get('customer', 'Unknown')}")
    print(f"  Amount:      Rs {transaction.get('amount', 0):,.2f}")
    print(f"  Fraud Score: {transaction.get('fraud_probability', 0) * 100:.1f}%")

    bot_results = []

    # Bot 1: Send Alert
    print("\n>>> Executing Bot 1: Alert Bot...")
    alert_result = send_alert(transaction)
    bot_results.append(alert_result)

    # Bot 2: Create Case
    print("\n>>> Executing Bot 2: Case Bot...")
    case_result = create_case(transaction)
    bot_results.append(case_result)

    # Bot 3: Generate Report
    print("\n>>> Executing Bot 3: Report Bot...")
    report_result = generate_report(transaction, case_id=case_result["case_id"])
    bot_results.append(report_result)

    # Bot 4: Log Everything
    print("\n>>> Executing Bot 4: Logger Bot...")
    log_result = log_full_pipeline(transaction, bot_results)
    bot_results.append(log_result)

    # Final Summary
    print("\n" + "#" * 70)
    print("#    RPA PIPELINE COMPLETE" + " " * 43 + "#")
    print("#" * 70)
    print(f"""
  SUMMARY:
  --------
  Transaction:  {transaction.get('id', 'N/A')}
  Customer:     {transaction.get('customer', 'Unknown')}
  Amount:       Rs {transaction.get('amount', 0):,.2f}
  Fraud Score:  {transaction.get('fraud_probability', 0) * 100:.1f}%

  Bot 1 (Alert):   SMS + Email sent
  Bot 2 (Case):    {case_result['case_id']} created -> {case_result['assigned_to']}
  Bot 3 (Report):  {report_result['report_id']} saved
  Bot 4 (Logger):  {log_result['entries_logged']} entries logged

  All RPA bots executed successfully!
""")

    return {
        "transaction_id": transaction.get("id"),
        "bots_executed": 4,
        "alert": alert_result,
        "case": case_result,
        "report": report_result,
        "log": log_result,
    }


# ============================================================================
# DEMO: Run with sample fraud transactions
# ============================================================================
if __name__ == "__main__":
    # Sample fraudulent transactions for demo
    fraud_transactions = [
        {
            "id": "TXN-005847",
            "customer": "Rohan Sharma",
            "amount": 48750.00,
            "merchant": "Unknown Online Store",
            "city": "Lagos, Nigeria",
            "card": "Visa ****1234",
            "timestamp": "2026-04-16 02:34:12",
            "fraud_probability": 0.94,
            "shap_explanation": [
                {"feature": "TransactionAmt", "shap_value": 1.52, "direction": "increases fraud risk"},
                {"feature": "card1_te", "shap_value": 0.93, "direction": "increases fraud risk"},
                {"feature": "C14", "shap_value": 1.14, "direction": "increases fraud risk"},
                {"feature": "dist1", "shap_value": 0.78, "direction": "increases fraud risk"},
                {"feature": "V282", "shap_value": -0.37, "direction": "decreases fraud risk"},
            ],
        },
        {
            "id": "TXN-005923",
            "customer": "Priya Patel",
            "amount": 32000.00,
            "merchant": "Electronics Hub",
            "city": "Delhi",
            "card": "MC ****5678",
            "timestamp": "2026-04-16 14:22:45",
            "fraud_probability": 0.87,
            "shap_explanation": [
                {"feature": "TransactionAmt", "shap_value": 1.21, "direction": "increases fraud risk"},
                {"feature": "D2", "shap_value": 0.84, "direction": "increases fraud risk"},
                {"feature": "card1_te", "shap_value": -1.10, "direction": "decreases fraud risk"},
                {"feature": "V283", "shap_value": 0.62, "direction": "increases fraud risk"},
                {"feature": "C14", "shap_value": 0.55, "direction": "increases fraud risk"},
            ],
        },
    ]

    print("=" * 70)
    print("  FRAUDGUARD AI - RPA WORKFLOW AUTOMATION DEMO")
    print("  Simulating fraud response for 2 flagged transactions")
    print("=" * 70)

    for txn in fraud_transactions:
        run_rpa_pipeline(txn)

    print("\n" + "=" * 70)
    print("  DEMO COMPLETE!")
    print("  Check the following outputs:")
    print("    - rpa/fraud_cases.db  (SQLite database with cases)")
    print("    - rpa/reports/        (STR report files)")
    print("    - rpa/logs/           (Activity logs)")
    print("=" * 70)
