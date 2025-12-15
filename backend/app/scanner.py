import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict


# ---------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------

def _safe_float(value, default=0.0):
    try:
        if value is None or (isinstance(value, float) and np.isnan(value)):
            return default
        return float(value)
    except Exception:
        return default


def _safe_int(value, default=0):
    try:
        if value is None or (isinstance(value, float) and np.isnan(value)):
            return default
        return int(value)
    except Exception:
        return default


# ---------------------------------------------------------
# Penny stock scanner
# ---------------------------------------------------------

def get_penny_candidates(limit: int = 10) -> Dict:
    """
    Returns a simple list of penny-stock candidates.
    (You can later expand this universe logic.)
    """

    tickers = [
        "SINT",
        "MULN",
        "TTOO",
        "NKLA",
        "BBIG",
        "CLOV",
        "IDEX",
        "PLUG",
        "SOFI",
        "F"
    ]

    results = []

    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            price = stock.fast_info.get("lastPrice")

            if price is None:
                continue

            if price <= 5:
                results.append({
                    "symbol": ticker,
                    "price": round(float(price), 2)
                })

        except Exception:
            continue

    return {
        "count": len(results[:limit]),
        "candidates": results[:limit]
    }


# ---------------------------------------------------------
# Options chain fetcher
# ---------------------------------------------------------

def get_options_chain(
    ticker: str,
    min_oi: int = 0
) -> Dict:
    """
    Fetch options chain safely for any symbol.
    """

    try:
        stock = yf.Ticker(ticker)
        expirations = stock.options

        if not expirations:
            return {"error": "No options available for this symbol"}

        calls_all = []
        puts_all = []

        for exp in expirations:
            try:
                chain = stock.option_chain(exp)

                for _, row in chain.calls.iterrows():
                    oi = _safe_int(row.get("openInterest"))
                    if oi >= min_oi:
                        calls_all.append({
                            "contractSymbol": row.get("contractSymbol"),
                            "strike": _safe_float(row.get("strike")),
                            "expiration": exp,
                            "lastPrice": _safe_float(row.get("lastPrice")),
                            "bid": _safe_float(row.get("bid")),
                            "ask": _safe_float(row.get("ask")),
                            "volume": _safe_int(row.get("volume")),
                            "openInterest": oi,
                            "impliedVolatility": _safe_float(row.get("impliedVolatility")),
                            "delta": None  # yfinance does not reliably return delta
                        })

                for _, row in chain.puts.iterrows():
                    oi = _safe_int(row.get("openInterest"))
                    if oi >= min_oi:
                        puts_all.append({
                            "contractSymbol": row.get("contractSymbol"),
                            "strike": _safe_float(row.get("strike")),
                            "expiration": exp,
                            "lastPrice": _safe_float(row.get("lastPrice")),
                            "bid": _safe_float(row.get("bid")),
                            "ask": _safe_float(row.get("ask")),
                            "volume": _safe_int(row.get("volume")),
                            "openInterest": oi,
                            "impliedVolatility": _safe_float(row.get("impliedVolatility")),
                            "delta": None
                        })

            except Exception:
                continue

        return {
            "symbol": ticker.upper(),
            "calls": calls_all,
            "puts": puts_all
        }

    except Exception as e:
        return {
            "error": "Failed to fetch option chain",
            "details": str(e)
        }


# ---------------------------------------------------------
# Scoring logic (STEP 4)
# ---------------------------------------------------------

def score_option(option: Dict) -> float:
    """
    Compute an opportunity score for a single option contract.
    """

    try:
        volume = _safe_float(option.get("volume"))
        oi = _safe_float(option.get("openInterest"))
        iv = _safe_float(option.get("impliedVolatility"))

        score = (
            volume * 0.4 +
            oi * 0.4 +
            iv * 10 * 0.2
        )

        return round(score, 2)

    except Exception:
        return 0.0


# ---------------------------------------------------------
# Ranked options endpoint (STEP 4)
# ---------------------------------------------------------

def get_ranked_options(
    ticker: str,
    limit: int = 10,
    min_oi: int = 100
) -> Dict:
    """
    Return top-ranked option contracts for a symbol.
    """

    chain = get_options_chain(
        ticker=ticker,
        min_oi=min_oi
    )

    if "error" in chain:
        return chain

    ranked = []

    for call in chain.get("calls", []):
        call["type"] = "call"
        call["score"] = score_option(call)
        ranked.append(call)

    for put in chain.get("puts", []):
        put["type"] = "put"
        put["score"] = score_option(put)
        ranked.append(put)

    ranked_sorted = sorted(
        ranked,
        key=lambda x: x["score"],
        reverse=True
    )

    return {
        "symbol": ticker.upper(),
        "count": len(ranked_sorted[:limit]),
        "top_opportunities": ranked_sorted[:limit]
    }
