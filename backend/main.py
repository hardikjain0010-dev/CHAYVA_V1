"""Compatibility entrypoint for local uvicorn runs.

The application package lives in ``spendmind_backend/spendmind_backend`` and
uses top-level imports such as ``core`` and ``routers`` internally. Keep this
shim small so ``uvicorn main:app --reload`` works from the backend directory.
"""
from pathlib import Path
import sys

PACKAGE_DIR = Path(__file__).resolve().parent / "spendmind_backend" / "spendmind_backend"

if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from spendmind_backend.spendmind_backend.main import app
