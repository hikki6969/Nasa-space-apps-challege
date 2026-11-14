#!/usr/bin/env python3
"""Export the versioned OpenAPI document and H0 mock payloads."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.main import app  # noqa: E402
from backend.app.mock_data import (  # noqa: E402
    MOCK_ASK,
    MOCK_CATALOG,
    MOCK_COMPARE,
    MOCK_CONTEXT,
    MOCK_HEALTH,
    MOCK_OBSERVATIONS,
    MOCK_RANKS,
    MOCK_REFUSAL,
    MOCK_SCENARIOS,
    mock_investigation,
)

OUT = ROOT / "backend"


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if hasattr(payload, "model_dump"):
        payload = payload.model_dump(mode="json")
    path.write_text(
        json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


write_json(OUT / "openapi.json", app.openapi())

mock_dir = OUT / "mocks"
write_json(mock_dir / "health.json", MOCK_HEALTH)
write_json(mock_dir / "catalog.json", MOCK_CATALOG)
write_json(mock_dir / "scenarios.json", MOCK_SCENARIOS)
write_json(mock_dir / "compare.json", MOCK_COMPARE)
write_json(mock_dir / "observations.json", MOCK_OBSERVATIONS)
write_json(mock_dir / "context.json", MOCK_CONTEXT)
write_json(mock_dir / "ask.json", MOCK_ASK)
write_json(mock_dir / "ask-refusal.json", MOCK_REFUSAL)
for scenario_id, response in MOCK_RANKS.items():
    write_json(mock_dir / f"rank-{scenario_id.lower()}.json", response)
for psi_id in ("PSI-25", "PSI-69", "PSI-68"):
    response = mock_investigation(psi_id)
    if response is not None:
        write_json(mock_dir / f"investigation-{psi_id.lower()}.json", response)

print(f"Wrote {OUT / 'openapi.json'} and {len(list(mock_dir.glob('*.json')))} mock payloads")
