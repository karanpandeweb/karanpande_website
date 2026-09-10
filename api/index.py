import os
import sys
import traceback
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Explicit module-level assignment so Vercel AST parser finds it unconditionally
app = FastAPI(title="Karan Pande Photography")

try:
    from backend.server import app as real_app
    app = real_app
except Exception as e:
    err_type = type(e).__name__
    err_msg = str(e)
    err_tb = traceback.format_exc().splitlines()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def fallback_error_handler(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend failed to start on Vercel",
                "exception_type": err_type,
                "exception_message": err_msg,
                "traceback": err_tb,
            },
        )

__all__ = ["app"]
