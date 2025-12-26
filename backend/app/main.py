from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import date, timedelta
import random

app = FastAPI(title="Penny Options Backend")

# ---------------------------
# CORS (VERY IMPORTANT)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# MOCK DATA
# ---------------------------
CANDIDATES = [
    {"symbol": "SINT", "price": 3.61},
    {"symbol": "TTOO", "price": 0.01},
    {"symbol": "NKLA", "price": 0.18},
    {"symbol": "BBIG", "price": 0.45},
    {"symbol": "CLOV", "price": 2.58},
    {"symbol": "IDEX", "price": 0.88},
    {"symbol": "PLUG", "price": 2.20},
]

# ---------------------------
# ROOT
# ---------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}

# ---------------------------
# CANDIDATES ENDPOINT
# ---------------------------
@app.get("/api/v1/candidates")
def get_candidates():
    # Simulate price movement
    updated = []
    for c in CANDIDATES:
        delta = random.uniform(-0.05, 0.05)
        price = round(max(0.01, c["price"] + delta), 2)
        updated.append({"symbol": c["symbol"], "price": price})

    return {
        "count": len(updated),
        "candidates": updated
    }

# ---------------------------
# OPTIONS CHAIN ENDPOINT
# ---------------------------
@app.get("/api/v1/options/{symbol}")
def get_options(symbol: str):
    today = date.today()
    options = []

    for i in range(1, 4):
        exp = today + timedelta(days=i * 7)

        for strike in [0.5, 1, 2, 3, 5]:
            options.append({
                "symbol": symbol.upper(),
                "type": "call",
                "strike": strike,
                "expiration": exp.isoformat(),
                "ask": round(random.uniform(0.05, 0.5), 2),
            })

            options.append({
                "symbol": symbol.upper(),
                "type": "put",
                "strike": strike,
                "expiration": exp.isoformat(),
                "ask": round(random.uniform(0.05, 0.5), 2),
            })

    return {
        "symbol": symbol.upper(),
        "options": options
    }
