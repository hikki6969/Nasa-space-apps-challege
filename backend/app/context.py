"""Context response generator for incidents, spinoffs, and program contexts."""

from __future__ import annotations

import json
from pathlib import Path

from .api_models import ContextResponse

ROOT = Path(__file__).resolve().parents[2]
CONTEXT_JSON_PATH = ROOT / "backend" / "mocks" / "context.json"


def get_context_response() -> ContextResponse:
    data = json.loads(CONTEXT_JSON_PATH.read_text(encoding="utf-8"))
    return ContextResponse.model_validate(data)
