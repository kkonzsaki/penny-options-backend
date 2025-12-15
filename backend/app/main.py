from fastapi import FastAPI
from datetime import date
from app.scanner import get_penny_candidates, get_options_chain
import yfinance as yf

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/candidates")
def candidates(horizon: str = "day", limit: int = 10):
    results = get_penny_candidates(limit=limit)
    return {
        "as_of": str(date.today()),
        "horizon": horizon,
        "candidates": results
    }

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    ticker = ticker.upper()
    stock = yf.Ticker(ticker)
    info = stock.info
    price = info.get("regularMarketPrice")

    options = get_options_chain(ticker)

    return {
        "symbol": ticker,
        "price": price,
        "options": options
    }
from fastapi.responses import JSONResponse

@app.get("/debug/test-ticker/{ticker}")
def debug_ticker(ticker: str):
    import yfinance as yf
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        expirations = stock.options or []

        options_preview = []
        if expirations:
            exp = expirations[0]
            chain = stock.option_chain(exp)
            options_preview = {
                "calls": chain.calls.head(3).to_dict(orient="records"),
                "puts": chain.puts.head(3).to_dict(orient="records")
            }

        return JSONResponse({
            "info": info,
            "expirations": expirations,
            "options_preview": options_preview
        })
    except Exception as e:
        return JSONResponse({
            "error": str(e)
        })
