"""
RPA Bot 4: Logger Bot
Logs all RPA bot actions to a centralized log file.
In production, this would push to an ELK stack or Splunk.
"""

import os
import json
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
LOG_FILE = os.path.join(LOG_DIR, "rpa_activity.log")
JSON_LOG = os.path.join(LOG_DIR, "rpa_activity.json")


def log_action(bot_name, action, details, transaction_id="N/A"):
    """
    Log an RPA bot action to file.

    Args:
        bot_name: str, e.g. "Bot 1 - Alert"
        action: str, e.g. "ALERT_SENT", "CASE_CREATED", "REPORT_GENERATED"
        details: dict with action details.
        transaction_id: str, the transaction ID.

    Returns:
        dict with log entry details.
    """
    os.makedirs(LOG_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Text log entry
    log_entry = f"[{timestamp}] [{bot_name}] [{action}] TXN:{transaction_id} | {json.dumps(details)}\n"

    # Append to text log
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_entry)

    # Append to JSON log (for dashboard consumption)
    json_entry = {
        "timestamp": timestamp,
        "bot": bot_name,
        "action": action,
        "transaction_id": transaction_id,
        "details": details,
    }

    # Read existing JSON log or create new
    json_data = []
    if os.path.exists(JSON_LOG):
        try:
            with open(JSON_LOG, "r", encoding="utf-8") as f:
                json_data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            json_data = []

    json_data.append(json_entry)

    with open(JSON_LOG, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)

    return json_entry


def log_full_pipeline(transaction, bot_results):
    """
    Log the complete RPA pipeline execution for a transaction.

    Args:
        transaction: dict with transaction details.
        bot_results: list of dicts from each bot's execution.

    Returns:
        dict with summary.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    txn_id = transaction.get("id", "N/A")

    # Log each bot's action
    for result in bot_results:
        bot_name = result.get("bot", "Unknown")
        action = result.get("status", "unknown").upper()
        log_action(bot_name, action, result, txn_id)

    # Log pipeline completion
    log_action("Pipeline", "COMPLETED", {
        "transaction_id": txn_id,
        "customer": transaction.get("customer", "Unknown"),
        "amount": transaction.get("amount", 0),
        "fraud_probability": transaction.get("fraud_probability", 0),
        "bots_executed": len(bot_results),
    }, txn_id)

    # Print summary
    print("\n" + "=" * 60)
    print("  BOT 4: LOGGER BOT - Pipeline Logged")
    print("=" * 60)
    print(f"  Transaction:    {txn_id}")
    print(f"  Customer:       {transaction.get('customer', 'Unknown')}")
    print(f"  Bots Executed:  {len(bot_results)}")
    print()
    for result in bot_results:
        status_icon = "OK" if result.get("status") in ["sent", "created", "generated"] else "??"
        print(f"    [{status_icon}] {result.get('bot', 'Unknown')}: {result.get('status', 'unknown')}")
    print()
    print(f"  Text Log:  {LOG_FILE}")
    print(f"  JSON Log:  {JSON_LOG}")
    print("=" * 60)

    return {
        "bot": "Bot 4 - Logger",
        "status": "logged",
        "timestamp": timestamp,
        "log_file": LOG_FILE,
        "json_log": JSON_LOG,
        "entries_logged": len(bot_results) + 1,
    }


def get_recent_logs(n=10):
    """Get the last N log entries from JSON log."""
    if not os.path.exists(JSON_LOG):
        return []
    with open(JSON_LOG, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data[-n:]


# Quick test
if __name__ == "__main__":
    test_results = [
        {"bot": "Bot 1 - Alert", "status": "sent", "timestamp": "2026-04-16"},
        {"bot": "Bot 2 - Case", "status": "created", "case_id": "CASE-0001"},
        {"bot": "Bot 3 - Report", "status": "generated", "report_id": "STR-001"},
    ]
    test_txn = {"id": "TXN-001234", "customer": "Rohan Sharma", "amount": 45000.00, "fraud_probability": 0.92}

    log_full_pipeline(test_txn, test_results)
    print(f"\nRecent logs: {len(get_recent_logs())} entries")
