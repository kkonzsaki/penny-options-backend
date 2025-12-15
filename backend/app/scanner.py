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


def get_options_chain(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        expirations = stock.options

        if not expirations:
            return {
                "symbol": ticker.upper(),
                "error": "No options available for this symbol"
            }

        expiration = expirations[0]
        chain = stock.option_chain(expiration)

        if chain.calls.empty and chain.puts.empty:
            return {
                "symbol": ticker.upper(),
                "error": "Options chain empty"
            }

        calls = _clean_df(chain.calls.head(10))
        puts = _clean_df(chain.puts.head(10))

        return {
            "symbol": ticker.upper(),
            "expiration": expiration,
            "calls": calls,
            "puts": puts
        }

    except Exception as e:
        return {
            "symbol": ticker.upper(),
            "error": "Failed to fetch option chain",
            "details": str(e)
        }
