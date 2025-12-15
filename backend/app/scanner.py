# scanner.py

import yfinance as yf
import pandas as pd

def get_penny_candidates(limit=10):
    """
    Keep your penny stock logic here if you still want it.
    Returns a list of penny stock tickers.
    """
    # Example placeholder logic:
    # Fetch a bunch of tickers and filter by price < $5
    tickers = ["SINT", "XYZ", "ABC"]  # Replace with your actual source
    return tickers[:limit]

def get_options_chain(ticker: str):
    """
    Fetches the full options chain for ANY ticker.
    """
    try:
        stock = yf.Ticker(ticker)
        options_dates = stock.options
        all_options = {}

        for date in options_dates:
            opt = stock.option_chain(date)
            calls = opt.calls.to_dict(orient="records")
            puts = opt.puts.to_dict(orient="records")
            all_options[date] = {"calls": calls, "puts": puts}

        return {"ticker": ticker, "options": all_options}

    except Exception as e:
        return {"error": str(e), "ticker": ticker}
