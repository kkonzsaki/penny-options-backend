from fastapi import FastAPI
from datetime import date
from app.scanner import get_penny_candidates

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
    stock = yf.Ticker(ticker)
    info = stock.info
    price = info.get("regularMarketPrice")
    return {
        "symbol": ticker.upper(),
        "price": price,
        "options": []  # Placeholder, can add option chain later
    }
