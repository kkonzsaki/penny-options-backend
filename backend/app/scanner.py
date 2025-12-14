import yfinance as yf
import pandas as pd

def get_penny_candidates(limit=10):
    # example tickers for testing
    tickers = ["AAPL", "TSLA", "SPCE"]  # replace with penny stock list
    results = []

    for t in tickers:
        try:
            stock = yf.Ticker(t)
            price = stock.info.get("regularMarketPrice", None)
            if price is None or price > 5:  # only pennies
                continue

            results.append({
                "symbol": t,
                "price": price,
                "volume": stock.info.get("volume", 0),
                "iv": 0.0,  # placeholder for implied volatility
                "score": 0.0,
                "signals": []
            })
        except Exception as e:
            print(f"Error fetching {t}: {e}")

    return results[:limit]
