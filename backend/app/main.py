from fastapi import FastAPI
from backend.app.scanner import get_penny_candidates

app = FastAPI()

@app.get("/api/v1/candidates")
def candidates(horizon: str = "day", limit: int = 10):
    results = get_penny_candidates(limit=limit)
    return {
        "as_of": str(date.today()),
        "horizon": horizon,
        "candidates": results
    }
