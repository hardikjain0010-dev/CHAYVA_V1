"""
Parses Indian bank / UPI SMS notifications into structured expense data.

Covers common formats from HDFC, SBI, ICICI, Axis, PhonePe, Google Pay
and Paytm. Designed to be extended: add new (bank_name, pattern) pairs to
BANK_PATTERNS as more real-world SMS samples are collected.
"""
import re
from datetime import datetime
from typing import Optional

# Each pattern must capture at least an amount. Named groups used where possible:
# amount, merchant, date, txn_type (debit/credit)
BANK_PATTERNS = [
    # HDFC: "Rs.500.00 debited from a/c **1234 on 05-07-26 to VPA merchant@upi"
    {
        "bank": "HDFC",
        "pattern": re.compile(
            r"Rs\.?\s?(?P<amount>[\d,]+\.?\d*)\s*(?P<txn_type>debited|credited).*?(?:to|from)\s+(?:VPA\s+)?(?P<merchant>[\w.@\-\s]+?)(?:\s+on|\.|\s*$)",
            re.IGNORECASE,
        ),
    },
    # SBI UPI: "Dear Customer, Rs 250 debited @ SBI a/c XX1234 on 05Jul26 trf to Merchant Name"
    {
        "bank": "SBI",
        "pattern": re.compile(
            r"Rs\.?\s?(?P<amount>[\d,]+\.?\d*)\s*(?P<txn_type>debited|credited).*?(?:trf to|transferred to)\s+(?P<merchant>[\w.@\-\s]+?)(?:\s+on|\.|\s*$)",
            re.IGNORECASE,
        ),
    },
    # PhonePe: "Paid Rs.199 to Merchant Name via PhonePe UPI"
    {
        "bank": "PhonePe",
        "pattern": re.compile(
            r"Paid\s+Rs\.?\s?(?P<amount>[\d,]+\.?\d*)\s+to\s+(?P<merchant>[\w.@\-\s]+?)\s+via",
            re.IGNORECASE,
        ),
    },
    # Google Pay: "You paid Rs 150 to Merchant using Google Pay"
    {
        "bank": "Google Pay",
        "pattern": re.compile(
            r"[Yy]ou paid\s+Rs\.?\s?(?P<amount>[\d,]+\.?\d*)\s+to\s+(?P<merchant>[\w.@\-\s]+?)\s+using",
            re.IGNORECASE,
        ),
    },
    # Paytm: "Rs.99 paid to Merchant successfully via Paytm"
    {
        "bank": "Paytm",
        "pattern": re.compile(
            r"Rs\.?\s?(?P<amount>[\d,]+\.?\d*)\s+paid\s+to\s+(?P<merchant>[\w.@\-\s]+?)\s+successfully",
            re.IGNORECASE,
        ),
    },
    # ICICI: "INR 320.00 debited from your account for UPI transaction to Merchant"
    {
        "bank": "ICICI",
        "pattern": re.compile(
            r"INR\s?(?P<amount>[\d,]+\.?\d*)\s*(?P<txn_type>debited|credited).*?to\s+(?P<merchant>[\w.@\-\s]+?)(?:\s+on|\.|\s*$)",
            re.IGNORECASE,
        ),
    },
    # Axis: "Axis Bank: Rs.450.00 debited from A/c no. XX1234 on 05-07-2026 for UPI/Merchant"
    {
        "bank": "Axis",
        "pattern": re.compile(
            r"Axis Bank.*?Rs\.?\s?(?P<amount>[\d,]+\.?\d*)\s*(?P<txn_type>debited|credited).*?for\s+(?:UPI/)?(?P<merchant>[\w.@\-\s]+?)(?:\s+on|\.|\s*$)",
            re.IGNORECASE,
        ),
    },
    # Generic fallback: any "Rs 123" or "INR 123" with no clean merchant match
    {
        "bank": "Unknown",
        "pattern": re.compile(r"(?:Rs\.?|INR)\s?(?P<amount>[\d,]+\.?\d*)", re.IGNORECASE),
    },
]

REVERSED_KEYWORDS = ["reversed", "refund", "failed", "unsuccessful", "declined"]

CATEGORY_KEYWORDS = {
    "food": ["swiggy", "zomato", "restaurant", "cafe", "food", "dominos", "mcdonald"],
    "shopping": ["amazon", "flipkart", "myntra", "mall", "store"],
    "transport": ["uber", "ola", "rapido", "petrol", "fuel", "irctc"],
    "entertainment": ["netflix", "spotify", "bookmyshow", "hotstar"],
    "bills": ["recharge", "electricity", "broadband", "dth"],
}


def _guess_category(merchant: str) -> str:
    merchant_lower = (merchant or "").lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(k in merchant_lower for k in keywords):
            return category
    return "general"


def parse_sms(text: str) -> dict:
    """
    Extracts amount, merchant, bank, date, transaction_type from a bank SMS.
    Returns a dict; fields that can't be determined are None.
    Skips (returns transaction_type='reversed') for failed/reversed transactions.
    """
    if not text or not text.strip():
        return _empty_result(text)

    text_lower = text.lower()
    if any(kw in text_lower for kw in REVERSED_KEYWORDS):
        return {
            "amount": None,
            "merchant": None,
            "bank": None,
            "transaction_type": "reversed_or_failed",
            "category_guess": None,
            "date": None,
            "confidence": 0.9,
            "raw_text": text,
        }

    # Handle multiple amounts in one SMS: prefer the debit amount if txn_type is present
    best_match = None
    best_bank = None
    for entry in BANK_PATTERNS:
        m = entry["pattern"].search(text)
        if m:
            best_match = m
            best_bank = entry["bank"]
            break

    if not best_match:
        return _empty_result(text)

    groups = best_match.groupdict()
    amount_str = groups.get("amount", "").replace(",", "") if groups.get("amount") else None
    amount = float(amount_str) if amount_str else None
    merchant = groups.get("merchant", "").strip() if groups.get("merchant") else None
    txn_type = groups.get("txn_type", "debited").lower() if groups.get("txn_type") else "debited"

    date_match = re.search(r"(\d{1,2}[-/][A-Za-z0-9]{2,9}[-/]\d{2,4})", text)
    date_str = date_match.group(1) if date_match else None

    confidence = 0.9 if best_bank != "Unknown" else 0.5
    if not merchant:
        confidence -= 0.2

    return {
        "amount": amount,
        "merchant": merchant,
        "bank": best_bank,
        "transaction_type": txn_type,
        "category_guess": _guess_category(merchant or ""),
        "date": date_str,
        "confidence": round(max(confidence, 0.1), 2),
        "raw_text": text,
    }


def _empty_result(text: str) -> dict:
    return {
        "amount": None,
        "merchant": None,
        "bank": None,
        "transaction_type": None,
        "category_guess": None,
        "date": None,
        "confidence": 0.0,
        "raw_text": text,
    }
