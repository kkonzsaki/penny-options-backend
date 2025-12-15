# main.py
from fastapi import FastAPI
from scanner import get_penny_candidates, get_options_chain  # import functions from scanner.py

app = FastAPI(title="Penny Options Scout API", version="1.0")

@app.get("/api/v1/candidates")
def candidates(limit: int = 10):
    """
    Return a list of penny stock tickers.
    You can specify the limit via query parameter, e.g., ?limit=5
    """
    return get_penny_candidates(limit=limit)

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    """
    Return the options chain for a given ticker.
    Example: /api/v1/symbol/AAPL
    """
    return get_options_chain(ticker)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
