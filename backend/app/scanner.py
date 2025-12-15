import yfinance as yf
import pandas as pd
import numpy as np


def _clean_df(df: pd.DataFrame):
    """
    Convert dataframe into fully JSON-safe records
    """
    df = df.replace([np.nan, np.inf, -np.inf], 0)

    # Convert all numeric values to Python floats
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].astype(float)

    return df.to_dict(orient="records")


def get_penny_candidates(limit: int = 10):
    tickers = [
        "SINT", "MULN", "CEI", "BBIG", "TOP",
        "GNS", "NKLA", "TTOO", "MARA", "RIOT"
    ]

    results = []

    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            price = stock.fast_info.get("lastPrice")

            if price and price < 5:
                results.append({
                    "symbol": ticker,
                    "price": round(float(price), 4)
                })
        except Exception:
            continue

    return results[:limit]


def get_options_chain(
    ticker: str,
    expiry: str | None = None,
    min_oi: int = 0,
    max_strike_pct: int = 30
):
    try:
        stock = yf.Ticker(ticker.upper())
        expirations = stock.options

        if not expirations:
            return {
                "symbol": ticker.upper(),
                "error": "No options available"
            }

        # Pick expiration
        selected_expiry = expiry if expiry in expirations else expirations[0]
        chain = stock.option_chain(selected_expiry)

        price = stock.fast_info.get("lastPrice")
        if not price:
            return {
                "symbol": ticker.upper(),
                "error": "Unable to fetch stock price"
            }

        max_strike = price * (1 + max_strike_pct / 100)
        min_strike = price * (1 - max_strike_pct / 100)

        def filter_chain(df):
            df = df.replace([np.nan, np.inf, -np.inf], 0)
            df = df[
                (df["strike"] >= min_strike) &
                (df["strike"] <= max_strike) &
                (df["openInterest"] >= min_oi)
            ]
            for col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].astype(float)
            return df.to_dict(orient="records")

        return {
            "symbol": ticker.upper(),
            "price": round(float(price), 2),
            "expiration": selected_expiry,
            "calls": filter_chain(chain.calls),
            "puts": filter_chain(chain.puts)
        }

    except Exception as e:
        return {
            "symbol": ticker.upper(),
            "error": "Failed to fetch option chain",
            "details": str(e)
        }
