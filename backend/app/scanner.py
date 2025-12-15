def get_options_chain(ticker):
    """Return full options chain safely"""
    import yfinance as yf

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
