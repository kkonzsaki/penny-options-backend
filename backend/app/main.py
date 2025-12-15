from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .scanner import (
    get_penny_candidates,
    get_options_chain,
    get_ranked_options
)


app = FastAPI(
    title="Penny Options Scout API",
    version="1.0.0"
)

# ---------------------------------------------------------
# CORS (safe defaults)
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}

# ---------------------------------------------------------
# Penny stock candidates
# ---------------------------------------------------------

@app.get("/api/v1/candidates")
def candidates(limit: int = Query(10, ge=1, le=50)):
    return get_penny_candidates(limit=limit)

# ---------------------------------------------------------
# Raw options chain
# ---------------------------------------------------------

@app.get("/api/v1/symbol/{ticker}")
def symbol(
    ticker: str,
    min_oi: int = Query(0, ge=0)
):
    return get_options_chain(
        ticker=ticker.upper(),
        min_oi=min_oi
    )

# ---------------------------------------------------------
# Ranked options (STEP 4.3)
# ---------------------------------------------------------

@app.get("/api/v1/ranked/{ticker}")
def ranked_options(
    ticker: str,
    limit: int = Query(10, ge=1, le=50),
    min_oi: int = Query(100, ge=0)
):
    return get_ranked_options(
        ticker=ticker.upper(),
        limit=limit,
        min_oi=min_oi
    )
