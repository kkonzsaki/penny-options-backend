from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.scanner import get_penny_candidates, get_options_chain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
def candidates():
    return get_penny_candidates()

@app.get("/api/v1/symbol/{ticker}")
def symbol(ticker: str):
    return get_options_chain(ticker)
