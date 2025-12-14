import yfinance as yf
import pandas as pd
from datetime import date
import numpy as np

# Example penny stock list (replace with real list)
PENNY_STOCKS = ["SINT", "VSTM", "SPCE", "XELA", "FNMA"]

def calculate_score(price, volume, iv):
    """Simple scoring function"""
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
            if price is None or price > 5:
                continue

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

    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results[:limit]


def get_options_chain(ticker):
    """Return full options chain (calls + puts) for a ticker"""
    try:
        stock = yf.Ticker(ticker)
        expirations = stock.options  # list of expiration dates
        options_data = []

        for exp in expirations:
            chain = stock.option_chain(exp)
            for option_type, df in [("call", chain.calls), ("put", chain.puts)]:
                for _, row in df.iterrows():
                    options_data.append({
                        "expiration": exp,
                        "strike": row["strike"],
                        "type": option_type,
                        "oi": row.get("openInterest", 0),
                        "volume": row.get("volume", 0),
                        "iv": round(row.get("impliedVolatility", 0.0), 2)
                    })
        return options_data
    except Exception as e:
        print(f"Error fetching options for {ticker}: {e}")
        return []
