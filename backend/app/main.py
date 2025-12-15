from fastapi import FastAPI
from .scanner import get_penny_candidates, get_options_chain # import functions from scanner.py

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "okay"}

@app.get("/api/v1/candidates")
def candidates():
    return get_penny_candidates(limit=10)

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    return get_options_chain(ticker)
