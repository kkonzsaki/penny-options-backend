# backend/app/scanner.py

import yfinance as yf

def get_penny_candidates(limit=10):
    """
    Returns a sample list of penny stock tickers.
    Replace with your real penny stock data source.
    """
    penny_stocks = ["SINT", "XYZ", "ABC", "DEF", "GHI", "JKL"]
    return penny_stocks[:limit]

def get_options_chain(ticker: str):
    """
    Returns the options chain for a given ticker.
    Handles stocks with no options gracefully.
    """
    try:
        stock = yf.Ticker(ticker)

        # Check if there are any options
        if not stock.options:
            return {"ticker": ticker, "error": "No options available for this ticker"}

        # Build the options dictionary
        options_data = {}
        for expiry in stock.options:
            chain = stock.option_chain(expiry)
            options_data[expiry] = {
                "calls": chain.calls.fillna("").to_dict(orient="records"),
                "puts": chain.puts.fillna("").to_dict(orient="records"),
            }

        return {"ticker": ticker, "options": options_data}

    except Exception as e:
        # Catch all errors to prevent internal server error
        return {"ticker": ticker, "error": str(e)}
