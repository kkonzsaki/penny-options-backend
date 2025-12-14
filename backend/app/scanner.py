import yfinance as yf
import pandas as pd
import numpy as np

# Example penny stock list (replace or expand)
PENNY_STOCKS = [
    "SINT", "VSTM", "SPCE", "XELA", "FNMA"
]

def calculate_score(price, volume, iv):
    """Simple scoring function for demonstration"""
    score = 0
    if volume > 500_000:
        score += 40
    if iv > 1.0:
        score += 30
    if price < 5:
        score += 30
    return score

def get_penny_candidates(limit=10):
    results = []

    for ticker in PENNY_STOCKS:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            price = info.get("regularMarketPrice")
            volume = info.get("volume", 0)
            if price is None or price > 5:  # only pennies
                continue

            # Simple placeholder IV calculation
            iv = info.get("impliedVolatility", 0.0)
            score = calculate_score(price, volume, iv)

            results.append({
                "symbol": ticker,
                "price": price,
                "volume": volume,
                "iv": round(iv, 2),
                "score": round(score, 2),
                "signals": []
            })
        except Exception as e:
            print(f"Error fetching {ticker}: {e}")

    # Sort by score descending
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results[:limit]
