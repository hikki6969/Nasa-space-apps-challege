import json
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.mock_data import MOCK_RANKS
from backend.app.models import InvestigationRecord, Scenario
from backend.app.ranking import oxygen_similarity, score_record

ROOT = Path(__file__).resolve().parents[2]
ANNOTATIONS_PATH = ROOT / "data" / "annotations.json"

client = TestClient(app)


def test_bass_ii_scenario_a_does_not_claim_oxygen_coverage():
    """T-008 / P-001 regression: BASS-II at Scenario A must NOT produce 'covers'

    for oxygen dimension. Calibrated initial O2 spans 13.6-22.2%, whereas
    Scenario A requests 30% (0.30).
    """
    response = client.post(
        "/api/rank",
        json={
            "scenario": {
                "oxygen_fraction": 0.30,
                "pressure_psia": 8.2,
                "gravity_g": 0.16,
                "fuel_phase": "solid",
                "safety_theme": "prevention",
            },
            "scenario_id": "A",
        },
    )
    assert response.status_code == 200
    payload = response.json()

    bass_results = [
        r for r in payload["results"]
        if r["psi_id"] == "PSI-25" or r["acronym"] == "BASS-II"
    ]
    assert len(bass_results) > 0

    for bass in bass_results:
        # Check oxygen dimension specifically
        oxygen_dims = [d for d in bass["dimensions"] if d["name"] == "oxygen"]
        assert len(oxygen_dims) == 1
        ox_dim = oxygen_dims[0]

        # Dimension must not claim coverage
        assert ox_dim["similarity"] < 1.0
        limitation = ox_dim.get("limitation") or ""
        assert "outside tolerance" in limitation or "does not cover" in limitation or "not reach" in limitation
        # Must NOT state that it covers oxygen / 30% O2
        assert "covers 30% o2" not in limitation.lower()
        assert "covers 30% oxygen" not in limitation.lower()
        assert "covers oxygen" not in limitation.lower()

        # Overall record justification and limitations must not describe BASS-II as covering 30% O2
        justification = bass.get("justification", "").lower()
        assert "does not reach 0.30" in justification or "does not cover" in justification
        assert "covers 30% o2" not in justification
        assert "covers the lunar-habitat condition" not in justification

        limitations = " ".join(bass.get("limitations", [])).lower()
        assert "must not be described as covering 30% o2" in limitations


def test_bass_ii_mock_rank_fixture_does_not_claim_oxygen_coverage():
    """Check MOCK_RANKS['A'] directly."""
    rank_a = MOCK_RANKS["A"]
    bass_results = [r for r in rank_a.results if r.psi_id == "PSI-25"]
    assert len(bass_results) == 1
    bass = bass_results[0]

    ox_dims = [d for d in bass.dimensions if d.name == "oxygen"]
    assert len(ox_dims) == 1
    assert ox_dims[0].similarity == 0.0

    ox_limit = ox_dims[0].limitation or ""
    assert "covers 30%" not in ox_limit.lower()
    assert "outside tolerance" in ox_limit.lower()


def test_bass_ii_canonical_record_oxygen_similarity_is_zero():
    """Test using canonical annotations.json that BASS-II oxygen range (0.136-0.222)

    has 0.0 similarity to Scenario A's 0.30 O2 fraction.
    """
    annotations = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    bass_raw = next(r for r in annotations["records"] if r["psi_id"] == "PSI-25")
    bass_record = InvestigationRecord.model_validate(bass_raw)

    assert bass_record.oxygen_fraction is not None
    assert bass_record.oxygen_fraction.min == 0.136
    assert bass_record.oxygen_fraction.max == 0.222

    # Scenario A requests 0.30
    sim = oxygen_similarity(0.30, bass_record.oxygen_fraction)
    assert sim == 0.0

    scenario_a = Scenario(
        oxygen_fraction=0.30,
        pressure_psia=8.2,
        gravity_g=0.16,
        fuel_phase="solid",
        safety_theme="prevention",
    )
    score = score_record(bass_record, scenario_a)
    assert score is not None
    assert score.similarities["oxygen"] == 0.0
