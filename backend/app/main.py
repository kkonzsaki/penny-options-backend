from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.scanner import get_penny_candidates, get_options_chain

app = FastAPI()

# CORS — FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/api/v1/candidates")
def candidates():
    return get_penny_candidates()

@app.get("/api/v1/options/{symbol}")
def options_chain(symbol: str):
    return get_options_chain(symbol)
