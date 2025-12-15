# main.py
from fastapi import FastAPI
from scanner import get_penny_candidates, get_options_chain

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/candidates")
def candidates(limit: int = 10):
    return get_penny_candidates(limit=limit)

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    return get_options_chain(ticker)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
