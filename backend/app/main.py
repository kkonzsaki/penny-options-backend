from fastapi import FastAPI
from datetime import date

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/candidates")
def candidates(horizon: str = "day", limit: int = 10):
    return {
        "as_of": str(date.today()),
        "horizon": horizon,
        "candidates": [
            {
                "symbol": "ABC",
                "price": 2.34,
                "volume": 1834921,
                "iv": 1.87,
                "score": 82.4,
                "signals": ["volume_spike", "iv_expansion"]
            }
        ][:limit]
    }

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    return {
        "symbol": ticker.upper(),
        "price": 2.34,
        "options": [
            {
                "expiration": "2025-12-20",
                "strike": 2.5,
                "type": "call",
                "oi": 4120,
                "volume": 987,
                "iv": 1.92
            }
        ]
    }
