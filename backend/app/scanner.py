import yfinance as yf
import pandas as pd
from datetime import date

PENNY_STOCKS = ["SINT", "VSTM", "SPCE", "XELA", "FNMA"]  # your penny list

def calculate_score(price, volume, iv):
    score = 0
    if volume > 500_000:
        score += 40
    if iv > 1.0:
        score += 30
    if price < 5:
        score += 30
    return score

def get_options_chain(ticker):
    """Return full options chain safely"""
    try:
        stock = yf.Ticker(ticker)
        expirations = stock.options or []
        options_data = []

        for exp in expirations:
            try:
                chain = stock.option_chain(exp)
                for option_type, df in [("call", chain.calls), ("put", chain.puts)]:
                    if df is not None:
                        for _, row in df.iterrows():
                            options_data.append({
                                "expiration": exp,
                                "strike": row.get("strike"),
                                "type": option_type,
                                "oi": row.get("openInterest", 0),
                                "volume": row.get("volume", 0),
                                "iv": round(row.get("impliedVolatility", 0.0), 2)
                            })
            except Exception as e:
                print(f"Error fetching chain for {ticker} {exp}: {e}")

        return options_data
    except Exception as e:
        print(f"Error fetching options for {ticker}: {e}")
        return []

def get_penny_candidates(limit=10):
    results = []

    for ticker in PENNY_STOCKS:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            price = info.get("regularMarketPrice")
            if price is None or price > 5:
                continue

            # Only include if options exist
            options = get_options_chain(ticker)
            if not options:
                continue

            volume = info.get("volume", 0)
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
