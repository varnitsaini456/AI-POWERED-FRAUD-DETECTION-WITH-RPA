"""
RPA Bot 1: Alert Bot
Simulates sending SMS/email alerts when fraud is detected.
In production, this would use Twilio (SMS) or SendGrid (email).
"""

from datetime import datetime


def send_alert(transaction):
    """
    Simulate sending fraud alert to customer via SMS and email.

    Args:
        transaction: dict with keys like customer, amount, merchant,
                     fraud_probability, shap_explanation, etc.

    Returns:
        dict with alert details and status.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    fraud_pct = transaction.get("fraud_probability", 0) * 100

    # Top reason from SHAP
    shap_reasons = transaction.get("shap_explanation", [])
    top_reason = shap_reasons[0]["feature"] if shap_reasons else "multiple factors"

    # --- Simulate SMS Alert ---
    sms_message = (
        f"[FRAUD ALERT] Dear {transaction['customer']}, "
        f"a suspicious transaction of Rs {transaction['amount']:,.2f} "
        f"at {transaction['merchant']} has been flagged. "
        f"If this wasn't you, call 1800-XXX-XXXX immediately. "
        f"- FraudGuard AI"
    )

    # --- Simulate Email Alert ---
    email_subject = f"Fraud Alert: Suspicious transaction of Rs {transaction['amount']:,.2f}"
    email_body = f"""
    Dear {transaction['customer']},

    Our AI system has detected a suspicious transaction on your account:

    Transaction ID:    {transaction.get('id', 'N/A')}
    Amount:            Rs {transaction['amount']:,.2f}
    Merchant:          {transaction['merchant']}
    Location:          {transaction.get('city', 'Unknown')}
    Time:              {timestamp}
    Fraud Probability: {fraud_pct:.1f}%
    Primary Risk Factor: {top_reason}

    ACTION REQUIRED:
    - If you made this transaction, no action needed.
    - If you did NOT make this transaction, please call our
      fraud helpline at 1800-XXX-XXXX immediately.

    Your card has been temporarily held for your safety.

    Regards,
    FraudGuard AI - Fraud Detection & Prevention System
    """

    # --- Print simulation output ---
    print("\n" + "=" * 60)
    print("  BOT 1: ALERT BOT - Fraud Notification")
    print("=" * 60)
    print(f"  Timestamp:  {timestamp}")
    print(f"  Customer:   {transaction['customer']}")
    print(f"  Fraud Risk: {fraud_pct:.1f}%")
    print()
    print("  [SMS SENT]")
    print(f"  {sms_message}")
    print()
    print("  [EMAIL SENT]")
    print(f"  Subject: {email_subject}")
    print(f"  Body: (see email_body variable for full content)")
    print("=" * 60)

    return {
        "bot": "Bot 1 - Alert",
        "status": "sent",
        "timestamp": timestamp,
        "sms_message": sms_message,
        "email_subject": email_subject,
        "email_body": email_body.strip(),
        "customer": transaction["customer"],
        "transaction_id": transaction.get("id", "N/A"),
    }


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
            {"feature": "card1_te", "shap_value": 0.89, "direction": "increases fraud risk"},
        ],
    }
    result = send_alert(test_txn)
    print(f"\nAlert result: {result['status']}")
