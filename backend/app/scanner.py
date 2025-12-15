# scanner.py
import yfinance as yf
import pandas as pd

def get_penny_candidates(limit=10):
    """
    Fetch a list of penny stock tickers. For demonstration purposes,
    this is a static list. You can replace this with a dynamic screener if desired.
    """
    penny_stocks = [
        "SINT", "ZYME", "NVCN", "PLUG", "CLOV", "FUV", "NOK", "SIRI", "AMD", "GE"
    ]
    # Limit results
    return penny_stocks[:limit]

def get_options_chain(ticker: str):
    """
    Fetch the options chain for a given ticker symbol using yfinance.
    Returns a dictionary with calls and puts DataFrames converted to JSON.
    """
    try:
        stock = yf.Ticker(ticker)
        options_dates = stock.options

        if not options_dates:
            return {"error": f"No options data found for {ticker}"}

        chain = {}
        # Fetch the nearest expiration date options
        nearest_exp = options_dates[0]
        opt_chain = stock.option_chain(nearest_exp)

        # Convert to JSON-serializable lists
        chain["calls"] = opt_chain.calls.to_dict(orient="records")
        chain["puts"] = opt_chain.puts.to_dict(orient="records")
        chain["expirationDate"] = nearest_exp
        return chain

    except Exception as e:
        return {"error": str(e)}
