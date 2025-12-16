from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

# ✅ RELATIVE IMPORT (this is the fix)
from .scanner import (
    get_penny_candidates,
    get_options_chain,
)

app = FastAPI(
    title="Options Scanner API",
    version="1.0",
)

API_VERSION = "1.0"


# -------------------------
# Helper response builders
# -------------------------

def success(data):
    return {
        "status": "ok",
        "version": API_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }


def error(code: str, message: str, http_status: int = 400):
    return JSONResponse(
        status_code=http_status,
        content={
            "status": "error",
            "version": API_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "code": code,
            "message": message,
        },
    )


# -------------------------
# Health Check
# -------------------------

@app.get("/health")
def health():
    return success({"service": "ok"})


# -------------------------
# Penny Stock Candidates
# -------------------------

@app.get("/api/v1/candidates")
def candidates():
    try:
        results = get_penny_candidates()
        return success(results)
    except Exception as e:
        return error(
            code="CANDIDATES_FAILED",
            message=str(e),
            http_status=500,
        )


# -------------------------
# Options Chain by Symbol
# -------------------------

@app.get("/api/v1/symbol/{symbol}")
def symbol(symbol: str):
    try:
        chain = get_options_chain(symbol.upper())
        return success(chain)
    except ValueError as e:
        return error(
            code="INVALID_SYMBOL",
            message=str(e),
            http_status=404,
        )
    except Exception as e:
        return error(
            code="OPTION_CHAIN_FAILED",
            message=str(e),
            http_status=500,
        )
