"""Focused regressions for the M4 final-audit findings.

The assertions come from Product Spec §§6.1, 6.2, 6.4, 7, 9 and Data Safety §9.
"""

import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app import main as main_module
from backend.app import retrieval as retrieval_module
from backend.app.main import app
from backend.app.models import Scenario
from backend.app.retrieval import reciprocal_rank_fusion, retrieve_candidates


ROOT = Path(__file__).resolve().parents[2]


client = TestClient(app)

SCENARIO_A = {
    "oxygen_fraction": 0.30,
    "pressure_psia": 8.2,
    "gravity_g": 0.16,
    "flow_velocity_cms": None,
    "fuel_phase": "solid",
    "safety_theme": "prevention",
}
SCENARIO_B = {
    "oxygen_fraction": None,
    "pressure_psia": None,
    "gravity_g": None,
    "flow_velocity_cms": None,
    "fuel_phase": None,
    "safety_theme": "detection",
}


def rank(scenario: dict, scenario_id: str | None = None) -> dict:
    response = client.post(
        "/api/rank",
        json={"scenario": scenario, "scenario_id": scenario_id, "limit": 10},
    )
    assert response.status_code == 200
    return response.json()


def test_rank_uses_formula_for_the_requested_body_not_canned_canonical_results() -> None:
    """A canonical id is metadata; it must not replace the submitted body."""
    canonical_a = rank(SCENARIO_A, "A")
    same_body_without_id = rank(SCENARIO_A)
    different_body_with_same_id = rank(SCENARIO_B, "A")

    canonical_ids = {result["psi_id"] for result in canonical_a["results"]}
    assert canonical_ids == {
        "PSI-10",
        "PSI-159",
        "PSI-68",
        "PSI-69",
        "PSI-25",
        "PSI-98",
        "PSI-101",
    }
    assert canonical_ids == {
        result["psi_id"] for result in same_body_without_id["results"]
    }
    assert {
        result["psi_id"] for result in different_body_with_same_id["results"]
    } != canonical_ids
    assert "PSI-101" in {
        result["psi_id"] for result in different_body_with_same_id["results"]
    }

    narratives = {
        result["psi_id"]: result["justification"]
        for result in canonical_a["results"]
    }
    assert "liquid-droplet phase" not in narratives["PSI-68"]
    assert "numeric physical inputs are not specified" not in narratives["PSI-69"]
    assert "requested detection theme" not in narratives["PSI-101"]
    assert "30% O2" not in different_body_with_same_id["gap_statement"]

    changed_oxygen = {**SCENARIO_A, "oxygen_fraction": 0.50}
    changed_oxygen_response = rank(changed_oxygen, "A")
    bass = next(
        result
        for result in changed_oxygen_response["results"]
        if result["psi_id"] == "PSI-25"
    )
    oxygen_dimension = next(
        dimension for dimension in bass["dimensions"] if dimension["name"] == "oxygen"
    )
    assert "0.50 fraction" in oxygen_dimension["limitation"]
    assert "0.30" not in oxygen_dimension["limitation"]
    assert "30% O2" not in changed_oxygen_response["gap_statement"]


def test_zero_similarity_records_are_not_ranked_as_partial_matches() -> None:
    """A meaningful partial match requires at least one matching dimension."""
    scenario_b = rank(SCENARIO_B)

    assert [result["psi_id"] for result in scenario_b["results"]] == ["PSI-101"]
    for result in scenario_b["results"]:
        assert result["score"] > 0
        assert result["match_class"] == "partial_match"
    assert "PSI-47" not in {
        result["psi_id"] for result in scenario_b["results"]
    }
    assert "PSI-117" not in {
        result["psi_id"] for result in scenario_b["results"]
    }


def test_observation_phase_has_its_own_provenance() -> None:
    """Oxygen and phase values must not share a misattributed provenance."""
    response = client.get("/api/observations")
    assert response.status_code == 200
    points = response.json()["points"]

    assert points
    for point in points:
        assert point["fuel_phase"] == "solid"
        oxygen_provenance = point["provenance"]
        field_provenance = point["field_provenance"]
        phase_provenance = field_provenance["fuel_phases"]
        oxygen_excerpt = oxygen_provenance["excerpt_or_table_ref"]
        phase_excerpt = phase_provenance["excerpt_or_table_ref"]
        assert field_provenance["oxygen_fraction"] == oxygen_provenance
        assert oxygen_excerpt
        assert phase_excerpt
        assert phase_excerpt != oxygen_excerpt
        assert "solid" in phase_excerpt.lower()


def test_compare_exposes_committed_embedding_similarity(monkeypatch) -> None:
    """Compare must use the committed MiniLM/NumPy similarity helper."""
    manifest = json.loads(
        (ROOT / "data" / "embeddings_manifest.json").read_text(encoding="utf-8")
    )
    embeddings = np.load(ROOT / "data" / "embeddings.npy")
    row_order = manifest["row_order"]
    expected = float(
        np.dot(
            embeddings[row_order.index("PSI-25")],
            embeddings[row_order.index("PSI-10")],
        )
    )

    response = client.post(
        "/api/compare",
        json={"psi_ids": ["PSI-25", "PSI-10"]},
    )
    assert response.status_code == 200
    assert response.json()["similarities"]["PSI-25|PSI-10"] == pytest.approx(
        expected
    )

    monkeypatch.setattr(
        retrieval_module,
        "investigation_similarity",
        lambda left, right: 0.25,
    )
    response = client.post(
        "/api/compare",
        json={"psi_ids": ["PSI-25", "PSI-10"]},
    )
    assert response.json()["similarities"]["PSI-25|PSI-10"] == pytest.approx(0.25)


def test_rank_uses_structured_candidate_retrieval(monkeypatch) -> None:
    """Ranking must use the bounded, eligible-candidate retrieval path."""
    calls: list[Scenario] = []
    original = main_module.retrieve_candidates

    def recording_retrieve_candidates(
        scenario: Scenario, free_text: str | None = None, limit: int = 10
    ):
        calls.append(scenario)
        assert limit == 10
        return original(scenario, free_text=free_text, limit=limit)

    monkeypatch.setattr(
        main_module, "retrieve_candidates", recording_retrieve_candidates
    )
    response = rank(SCENARIO_A)
    assert response["results"]
    assert len(calls) == 1

    candidates = retrieve_candidates(Scenario(**SCENARIO_A), limit=10)
    assert len(candidates) <= 10
    assert all(record.rank_eligible for record in candidates)
    assert all(record.evidence_class != "modeling" for record in candidates)


def test_reciprocal_rank_fusion_uses_standard_rank_scores() -> None:
    """The existing RRF helper must remain deterministic where hybrid lists apply."""
    fused = reciprocal_rank_fusion([["PSI-25"], ["PSI-10"]], k=60)
    scores = dict(fused)
    assert scores["PSI-25"] == pytest.approx(1 / 61)
    assert scores["PSI-10"] == pytest.approx(1 / 61)
    assert fused == reciprocal_rank_fusion([["PSI-25"], ["PSI-10"]], k=60)


def test_active_docs_do_not_claim_a_human_review_gate() -> None:
    """D-017 and Data Safety §9 require provenance, not reviewer attestation."""
    product_spec = (ROOT / "docs/00_PRODUCT_SPEC.md").read_text()
    adr_0004 = (
        ROOT / "docs/adr/0004-keep-generative-llm-optional-and-off-by-default.md"
    ).read_text()
    problem_log = (ROOT / "docs/02_PROBLEM_LOG.md").read_text()

    assert (
        "annotation reviewer must confirm every numeric value"
        not in product_spec
    )
    assert "Human-verified annotations are required" not in adr_0004
    assert (
        "human-verified annotations and template retrieval are primary"
        not in problem_log
    )
    assert (
        "provenance-first deterministic annotations and template retrieval are primary"
        in problem_log
    )
