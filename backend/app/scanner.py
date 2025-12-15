import yfinance as yf
import pandas as pd

# List of penny stocks to scan
PENNY_STOCKS = [
    "SINT", "VSTM", "SPCE", "XELA", "FNMA"  # replace/add more as needed
]

def calculate_score(price, volume, iv):
    """
    Calculate a simple score for a penny stock based on price, volume, and implied volatility.
    """
    score = 0
    if volume > 500_000:
        score += 40
    if iv > 1.0:
        score += 30
    if price < 5:
        score += 30
    return score

def get_options_chain(ticker):
    """
    Safely fetch full options chain (calls + puts) for a ticker.
    Returns a list of option dicts with expiration, strike, type, OI, volume, IV.
    """
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
            except Exception:
                # Skip this expiration if something goes wrong
                continue

        return options_data
    except Exception:
        # Return empty if ticker cannot be fetched
        return []

def get_penny_candidates(limit=10):
    """
    Safely fetch penny stocks with tradable options.
    Returns a list of dicts with symbol, price, volume, iv, score, and empty signals.
    """
    results = []

    for ticker in PENNY_STOCKS:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            price = info.get("regularMarketPrice")
            if price is None or price > 5:
                continue

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
        except Exception:
            # Skip this ticker if any error occurs
            continue

    # Sort by score descending and return top `limit` results
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results[:limit]
