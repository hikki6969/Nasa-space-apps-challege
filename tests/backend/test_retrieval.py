import json
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models import InvestigationRecord, Scenario
from backend.app.ranking import classify_match, score_record

ROOT = Path(__file__).resolve().parents[2]
ANNOTATIONS_PATH = ROOT / "data" / "annotations.json"

client = TestClient(app)


def test_scenario_b_returns_same_r_via_api():
    """Scenario B (Cabin detection) returns SAME-R (PSI-101) as primary evidence."""
    response = client.post(
        "/api/rank",
        json={
            "scenario": {"safety_theme": "detection"},
            "scenario_id": "B",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["scenario_id"] == "B"
    assert len(payload["results"]) > 0

    top_result = payload["results"][0]
    assert top_result["psi_id"] == "PSI-101"
    assert top_result["acronym"] == "SAME-R"
    assert top_result["match_class"] == "partial_match"
    assert top_result["score"] == 1.0
    assert any("detection" in m.lower() for m in top_result["matched_conditions"])


def test_scenario_c_returns_flex_and_flex2_via_api():
    """Scenario C (Droplet suppression) returns FLEX (PSI-69) and FLEX-2 (PSI-68)."""
    response = client.post(
        "/api/rank",
        json={
            "scenario": {
                "fuel_phase": "liquid_droplet",
                "safety_theme": "suppression",
            },
            "scenario_id": "C",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["scenario_id"] == "C"

    result_ids = [r["psi_id"] for r in payload["results"]]
    result_acronyms = [r["acronym"] for r in payload["results"]]

    assert "PSI-69" in result_ids
    assert "PSI-68" in result_ids
    assert "FLEX" in result_acronyms
    assert "FLEX-2" in result_acronyms

    for r in payload["results"]:
        if r["psi_id"] in {"PSI-69", "PSI-68"}:
            assert r["match_class"] == "partial_match"
            assert r["score"] == 1.0


def test_scenario_b_canonical_annotations_ranking():
    """Evaluate canonical annotations against Scenario B using the ranking rules."""
    annotations = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    scenario_b_raw = annotations["scenarios"]["scenario_B"]
    scenario_b = Scenario(safety_theme=scenario_b_raw["safety_theme"])

    records = [
        InvestigationRecord.model_validate(r) for r in annotations["records"]
    ]

    scored = []
    for r in records:
        score = score_record(r, scenario_b)
        if score is not None and score.score > 0:
            scored.append((score.score, r.psi_id, r.acronym, classify_match(r, score)))

    # Sort descending by score
    scored.sort(key=lambda x: x[0], reverse=True)
    assert len(scored) > 0
    # Top ranked record must be SAME-R (PSI-101)
    top_score, top_id, top_acronym, top_match = scored[0]
    assert top_id == "PSI-101"
    assert top_acronym == "SAME-R"
    assert top_match == "partial_match"


def test_scenario_c_canonical_annotations_ranking():
    """Evaluate canonical annotations against Scenario C using the ranking rules."""
    annotations = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    scenario_c_raw = annotations["scenarios"]["scenario_C"]
    scenario_c = Scenario(
        fuel_phase=scenario_c_raw["fuel_phase"],
        safety_theme=scenario_c_raw["safety_theme"],
    )

    records = [
        InvestigationRecord.model_validate(r) for r in annotations["records"]
    ]

    scored = []
    for r in records:
        score = score_record(r, scenario_c)
        if score is not None and score.score > 0:
            scored.append((score.score, r.psi_id, r.acronym, classify_match(r, score)))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_ids = {item[1] for item in scored[:2]}
    assert "PSI-69" in top_ids  # FLEX
    assert "PSI-68" in top_ids  # FLEX-2
    for item in scored:
        if item[1] in {"PSI-69", "PSI-68"}:
            assert item[0] == 1.0  # Perfect score on specified dimensions
            assert item[3] == "partial_match"
