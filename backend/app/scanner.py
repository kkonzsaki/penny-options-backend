# backend/app/scanner.py

import yfinance as yf

def get_penny_candidates(limit=10):
    """
    Returns a list of penny stock tickers.
    Placeholder logic: replace with your real data source.
    """
    tickers = ["SINT", "XYZ", "ABC"]  # example penny stock tickers
    return tickers[:limit]

def get_options_chain(ticker: str):
    """
    Fetches the options chain for ANY ticker.
    Returns a dictionary with calls and puts for each expiry date.
    """
    try:
        stock = yf.Ticker(ticker)
        if not stock.options:
            return {"error": f"No options available for {ticker}"}

        all_options = {}
        for date in stock.options:
            opt = stock.option_chain(date)
            all_options[date] = {
                "calls": opt.calls.fillna("").to_dict(orient="records"),
                "puts": opt.puts.fillna("").to_dict(orient="records")
            }

        return {"ticker": ticker, "options": all_options}

    except Exception as e:
        return {"error": str(e), "ticker": ticker}
