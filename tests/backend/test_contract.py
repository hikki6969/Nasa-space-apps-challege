import json
import re
from pathlib import Path

import pytest

from backend.app.api_models import (
    AskResponse,
    CatalogResponse,
    CompareResponse,
    ContextResponse,
    HealthResponse,
    InvestigationResponse,
    ObservationsResponse,
    RankResponse,
    ScenariosResponse,
)
from backend.app.main import app
from backend.app.mock_data import (
    CATALOG,
    MOCK_ASK,
    MOCK_CATALOG,
    MOCK_RANKS,
    MOCK_SCENARIOS,
    mock_ask,
    mock_investigation,
)
from backend.app.models import InvestigationRecord

ROOT = Path(__file__).resolve().parents[2]
MOCK_DIR = ROOT / "backend" / "mocks"
EXPECTED_CURATED = {"PSI-159", "PSI-10", "PSI-101", "PSI-98", "PSI-25", "PSI-69", "PSI-68"}


def verified_corpus() -> set[str]:
    facts = (ROOT / "docs" / "VERIFIED_FACTS.md").read_text(encoding="utf-8")
    block = re.search(r"```text\n(.*?)\n```", facts, re.DOTALL)
    assert block is not None
    ids = re.findall(r"PSI-\d+", block.group(1))
    assert len(ids) == 24
    assert len(set(ids)) == 24
    return set(ids)


def test_catalog_matches_exact_verified_corpus():
    corpus = verified_corpus()
    catalog_ids = {entry.psi_id for entry in CATALOG}
    assert catalog_ids == corpus
    assert "PSI-181" not in catalog_ids
    assert "PSI-108" not in catalog_ids


def test_catalog_counts_are_consistent():
    counts = MOCK_CATALOG.counts
    assert counts.total == 24
    assert counts.evidence == 23
    assert counts.instrument_context == 1
    assert counts.source_cited == 7
    assert counts.metadata_only == 17
    assert sum(counts.by_evidence_class.values()) == 9


def test_curated_records_are_verified_and_rank_eligible():
    curated = {
        record.psi_id: record
        for record in (mock_investigation(psi_id).record for psi_id in EXPECTED_CURATED)
    }
    assert set(curated) == EXPECTED_CURATED
    for record in curated.values():
        assert record.annotation_status == "source_cited"
        assert record.extraction_method == "script"
        assert record.catalog_role == "evidence"
        assert record.rank_eligible is True


def test_daft_is_present_but_not_ranked():
    entry = next(entry for entry in CATALOG if entry.psi_id == "PSI-47")
    assert entry.catalog_role == "instrument_context"
    assert entry.annotation_status == "metadata_only"
    record = mock_investigation("PSI-47").record
    assert record.rank_eligible is False


def test_psi_117_is_modeling_metadata_only_without_tables():
    record = mock_investigation("PSI-117").record
    assert record.evidence_class == "modeling"
    assert record.data_status == "partial"
    assert record.annotation_status == "metadata_only"
    assert record.experimental_tables == []
    assert record.rank_eligible is False


def test_bass_ii_initial_oxygen_range_and_provenance():
    record = mock_investigation("PSI-25").record
    assert record.oxygen_fraction is not None
    assert record.oxygen_fraction.min == pytest.approx(0.136)
    assert record.oxygen_fraction.max == pytest.approx(0.222)
    excerpt = record.provenance["oxygen_fraction"].excerpt_or_table_ref
    assert "13.6%" in excerpt
    assert "22.2%" in excerpt
    assert "30" not in excerpt


def test_scenario_fixtures_match_frozen_inputs():
    scenarios = {fixture.id: fixture for fixture in MOCK_SCENARIOS.scenarios}
    assert set(scenarios) == {"A", "B", "C", "D"}
    assert scenarios["A"].scenario.oxygen_fraction == pytest.approx(0.30)
    assert scenarios["A"].scenario.pressure_psia == pytest.approx(8.2)
    assert scenarios["A"].scenario.gravity_g == pytest.approx(0.16)
    assert scenarios["A"].scenario.flow_velocity_cms is None
    assert scenarios["A"].scenario.fuel_phase == "solid"
    assert scenarios["A"].scenario.safety_theme == "prevention"
    assert scenarios["B"].scenario.safety_theme == "detection"
    assert scenarios["C"].scenario.fuel_phase == "liquid_droplet"
    assert scenarios["C"].scenario.safety_theme == "suppression"
    assert scenarios["D"].scenario.safety_theme == "prevention"
    assert all(not fixture.numeric_inputs_complete for fixture in scenarios.values())


def test_scenario_a_has_no_direct_match_and_honest_bass_ii_wording():
    response = MOCK_RANKS["A"]
    assert all(result.match_class != "direct_match" for result in response.results)
    bass = next(result for result in response.results if result.psi_id == "PSI-25")
    justification = bass.justification.lower()
    assert "does not cover" in justification
    assert "covers 30% o2" not in justification
    gap = response.gap_statement.lower()
    assert "partial-gravity" in gap
    assert "30% o2" in gap
    assert "fm2" in gap


def test_scenario_b_contains_same_r_and_excludes_daft():
    response = MOCK_RANKS["B"]
    assert {result.psi_id for result in response.results} == {"PSI-101"}
    assert all(result.psi_id != "PSI-47" for result in response.results)


def test_scenario_c_contains_flex_and_flex2():
    response = MOCK_RANKS["C"]
    assert {result.psi_id for result in response.results} == {"PSI-69", "PSI-68"}


def test_scenario_d_keeps_context_separate():
    response = MOCK_RANKS["D"]
    assert all(result.match_class != "direct_match" for result in response.results)
    assert {result.psi_id for result in response.results} == {"PSI-159", "PSI-25"}
    assert all("apollo" not in result.psi_id.lower() for result in response.results)


def test_every_ranked_result_exposes_six_dimension_slots():
    for response in MOCK_RANKS.values():
        for result in response.results:
            assert len(result.dimensions) == 6
            assert sum(dimension.weight for dimension in result.dimensions) == pytest.approx(1.0)
            requested = {dimension.name for dimension in result.dimensions if dimension.requested}
            assert requested == set(response.requested_dimensions)
            for dimension in result.dimensions:
                if dimension.requested:
                    assert dimension.similarity is not None
                    if not dimension.present:
                        assert dimension.similarity == 0.0
                else:
                    assert dimension.similarity is None


def test_ask_scope_guard_refuses_rocket_questions():
    refusal = mock_ask("What propellant should a rocket burn?")
    assert refusal.refused is True
    assert refusal.scope == "rocket_propellant"
    assert refusal.citations == []


def test_ask_answers_fire_safety_questions_with_citation():
    answer = mock_ask("Does BASS-II cover 30% oxygen?")
    assert answer.refused is False
    assert answer.scope == "fire_safety"
    assert answer.citations
    assert answer.citations[0].psi_id == "PSI-25"
    assert MOCK_ASK.answer


def test_openapi_export_is_current_and_complete():
    exported = json.loads((ROOT / "backend" / "openapi.json").read_text(encoding="utf-8"))
    assert exported == app.openapi()
    assert exported["info"]["version"] == app.version
    expected_paths = {
        "/api/health",
        "/api/catalog",
        "/api/investigations/{psi_id}",
        "/api/scenarios",
        "/api/rank",
        "/api/compare",
        "/api/observations",
        "/api/context",
        "/api/ask",
    }
    assert expected_paths <= set(exported["paths"])
    schemas = exported["components"]["schemas"]
    for schema in ("InvestigationRecord", "ProgramContext", "Scenario", "RankResponse"):
        assert schema in schemas


MOCK_MODELS = {
    "health": HealthResponse,
    "catalog": CatalogResponse,
    "scenarios": ScenariosResponse,
    "compare": CompareResponse,
    "observations": ObservationsResponse,
    "context": ContextResponse,
    "ask": AskResponse,
    "ask-refusal": AskResponse,
    "rank-a": RankResponse,
    "rank-b": RankResponse,
    "rank-c": RankResponse,
    "rank-d": RankResponse,
    "investigation-psi-25": InvestigationResponse,
    "investigation-psi-69": InvestigationResponse,
    "investigation-psi-68": InvestigationResponse,
}


@pytest.mark.parametrize(("name", "model"), sorted(MOCK_MODELS.items()))
def test_exported_mock_payload_validates(name, model):
    path = MOCK_DIR / f"{name}.json"
    assert path.is_file(), f"missing exported mock {path.name}"
    model.model_validate(json.loads(path.read_text(encoding="utf-8")))


def test_investigation_record_types_round_trip():
    record = mock_investigation("PSI-25").record
    assert InvestigationRecord.model_validate(record.model_dump()) == record
