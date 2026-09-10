import os
import sys
from pathlib import Path

# Ensure project root is in sys.path for Vercel Lambda runtime
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.server import app

# Explicit top-level FastAPI instance for Vercel AST parser
app = app

__all__ = ["app"]
