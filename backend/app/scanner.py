import re
from typing import List, Dict, Any
import yfinance as yf
import pandas as pd


# -----------------------------
# Helpers
# -----------------------------

def normalize_ticker(ticker: str) -> str:
    """
    Validate and normalize ticker symbols
    """
    if not ticker:
        raise ValueError("Ticker is required")

    ticker = ticker.upper().strip()

    if not re.fullmatch(r"[A-Z]{1,5}", ticker):
        raise ValueError("Invalid ticker format")

    return ticker


def safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


# -----------------------------
# Penny Stock Scanner
# -----------------------------

def get_penny_candidates(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Returns penny-stock option candidates
    """
    symbols = [
        "SINT", "MULN", "FFIE", "TTOO", "CEI",
        "NKLA", "HIVE", "MARA", "RIOT", "SOS"
    ]

    results = []

    for symbol in symbols:
        try:
            stock = yf.Ticker(symbol)
            info = stock.fast_info

            price = safe_float(info.get("last_price"))
            volume = safe_float(info.get("last_volume"))

            if price <= 0 or volume <= 0:
                continue

            # Penny stock rule
            if price > 5:
                continue

            options = stock.options
            if not options:
                continue

            results.append({
                "symbol": symbol,
                "price": round(price, 4),
                "volume": int(volume),
                "option_expirations": len(options)
            })

        except Exception:
            continue

    # Sort by volume descending
    results.sort(key=lambda x: x["volume"], reverse=True)

    return results[:limit]


# -----------------------------
# Options Chain Lookup
# -----------------------------

def get_options_chain(ticker: str) -> Dict[str, Any]:
    """
    Returns options chain data for ANY valid ticker
    """
    try:
        ticker = normalize_ticker(ticker)
    except ValueError as e:
        return {"error": str(e)}

    try:
        stock = yf.Ticker(ticker)

        # 🔑 Force Yahoo session initialization
        _ = stock.history(period="1d")

        expirations = stock.options
        if not expirations:
            return {"error": f"No options available for {ticker}"}

        expiration = expirations[0]

        try:
            chain = stock.option_chain(expiration)
        except Exception:
            return {"error": "Options data temporarily unavailable. Please retry."}

        calls = chain.calls
        puts = chain.puts

        def simplify(df: pd.DataFrame):
            return [
                {
                    "strike": float(row["strike"]),
                    "lastPrice": safe_float(row.get("lastPrice")),
                    "bid": safe_float(row.get("bid")),
                    "ask": safe_float(row.get("ask")),
                    "volume": int(row.get("volume") or 0),
                    "openInterest": int(row.get("openInterest") or 0),
                    "impliedVolatility": round(
                        safe_float(row.get("impliedVolatility")) * 100, 2
                    )
                }
                for _, row in df.iterrows()
            ]

        return {
            "symbol": ticker,
            "expiration": expiration,
            "calls": simplify(calls),
            "puts": simplify(puts),
        }

    except Exception as e:
        return {
            "error": "Failed to fetch option chain",
            "details": str(e)
        }
