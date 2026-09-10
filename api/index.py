import os
import sys
import traceback
from pathlib import Path

# Ensure project root is in sys.path for Vercel Lambda runtime
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from backend.server import app
except Exception as e:
    import logging
    logging.exception("CRITICAL: Failed to import backend.server")
    print(f"CRITICAL ERROR IMPORTING APP: {e}", file=sys.stderr)
    traceback.print_exc()

    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Error Fallback")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def fallback_error_handler(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend failed to start on Vercel",
                "exception_type": type(e).__name__,
                "exception_message": str(e),
                "traceback": traceback.format_exc().splitlines(),
                "env_keys_present": [k for k in os.environ.keys() if not k.startswith("npm_")],
            },
        )

__all__ = ["app"]
