import yfinance as yf

def get_options_chain(ticker: str):
    """
    Returns the options chain for a given stock ticker.
    Handles errors gracefully if ticker or data is invalid.
    """
    try:
        stock = yf.Ticker(ticker)
        options = stock.options
        if not options:
            return {"error": "No options data available for this ticker"}

        option_chains = []
        for exp_date in options[:5]:  # limit to first 5 expiration dates
            opt = stock.option_chain(exp_date)
            calls = opt.calls.to_dict(orient="records")
            puts = opt.puts.to_dict(orient="records")
            option_chains.append({
                "expirationDate": exp_date,
                "calls": calls,
                "puts": puts
            })
        return option_chains
    except Exception as e:
        return {"error": str(e)}
