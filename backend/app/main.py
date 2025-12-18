from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.scanner import get_penny_candidates, get_options_chain

app = FastAPI()

# ✅ CORS — REQUIRED FOR RENDER FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://penny-options-frontend.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "backend live"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/candidates")
def candidates(limit: int = 10):
    return get_penny_candidates(limit=limit)

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    return get_options_chain(ticker)
