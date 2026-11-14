import json
from pathlib import Path

import pytest

from backend.app.models import InvestigationRecord, Provenance, Range, Scenario
from backend.app.ranking import (
    classify_match,
    flow_similarity,
    gravity_similarity,
    oxygen_similarity,
    phase_similarity,
    pressure_similarity,
    score_record,
    theme_similarity,
)

ROOT = Path(__file__).resolve().parents[2]
ANNOTATIONS_PATH = ROOT / "data" / "annotations.json"


def provenance() -> Provenance:
    return Provenance(
        source_url="https://example.test/source",
        source_kind="psi_narrative",
        excerpt_or_table_ref="test excerpt",
        extraction_method="script",
    )


def make_record(**overrides) -> InvestigationRecord:
    data = {
        "psi_id": "PSI-900",
        "title": "Test investigation",
        "research_area": "Combustion Science",
        "project_type": "microgravity",
        "evidence_class": "bench_flammability",
        "objectives_text": "Test objective.",
        "approach_text": "Test approach.",
        "data_status": "complete",
        "annotation_status": "source_cited",
        "extraction_method": "script",
        "source_url": "https://example.test/PSI-900",
    }
    data.update(overrides)
    physical = (
        "oxygen_fraction",
        "pressure",
        "flow_velocity",
        "gravity",
        "fuel",
        "fuel_phases",
        "safety_theme",
        "recorded_gravity_values",
        "recorded_flow_values",
    )
    data["provenance"] = {
        field: provenance()
        for field in physical
        if data.get(field) not in (None, [], "")
    }
    return InvestigationRecord(**data)


def oxygen_range(minimum: float, maximum: float) -> Range:
    return Range(min=minimum, max=maximum, unit="fraction")


def test_missing_record_field_does_not_redistribute_weight():
    record = make_record(oxygen_fraction=oxygen_range(0.1, 0.2))
    score = score_record(record, Scenario(oxygen_fraction=0.15, pressure_psia=8.2))

    assert score is not None
    assert score.present == {"oxygen": True, "pressure": False}
    assert score.similarities["pressure"] == 0.0
    assert score.coverage == 0.5
    assert score.score == pytest.approx(0.3 / 0.5 * 0.5**0.5)


def test_lower_coverage_ranks_lower_at_equal_similarity():
    complete = make_record(
        oxygen_fraction=oxygen_range(0.1, 0.2),
        pressure=Range(min=8.0, max=9.0, unit="psia"),
    )
    partial = make_record(oxygen_fraction=oxygen_range(0.1, 0.2))
    scenario = Scenario(oxygen_fraction=0.15, pressure_psia=8.2)

    complete_score = score_record(complete, scenario)
    partial_score = score_record(partial, scenario)

    assert complete_score is not None and partial_score is not None
    assert complete_score.score == pytest.approx(1.0)
    assert complete_score.coverage == 1.0
    assert complete_score.score > partial_score.score


def test_unspecified_scenario_dimension_is_outside_requested_set():
    record = make_record(oxygen_fraction=oxygen_range(0.1, 0.2))
    score = score_record(record, Scenario(oxygen_fraction=0.15))

    assert score is not None
    assert score.requested == ("oxygen",)
    assert "pressure" not in score.similarities
    assert score.coverage == 1.0
    assert score.score == pytest.approx(1.0)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (0.15, 1.0),
        (0.10, 1.0),
        (0.21, 0.25),
        (0.09, 0.25),
        (0.30, 0.0),
    ],
)
def test_oxygen_tolerance_overlap(value, expected):
    assert oxygen_similarity(value, oxygen_range(0.1, 0.2)) == pytest.approx(expected)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (8.2, 1.0),
        (9.1, 0.25),
        (7.9, 0.25),
        (7.0, 0.0),
    ],
)
def test_pressure_tolerance_overlap(value, expected):
    interval = Range(min=8.0, max=9.0, unit="psia")
    assert pressure_similarity(value, interval) == pytest.approx(expected)


def test_gravity_exact_recorded_level():
    assert gravity_similarity(0.16, [0.0, 0.16, 1.0]) == 1.0
    assert gravity_similarity(0.0, [0.0, 0.16]) == 1.0


def test_gravity_bracket_and_outside():
    assert gravity_similarity(0.08, [0.0, 0.16]) == 0.5
    assert gravity_similarity(0.16, [0.0]) == 0.0
    assert gravity_similarity(0.5, [0.0, 0.16]) == 0.0


@pytest.mark.parametrize(
    ("value", "levels", "minimum", "maximum", "expected"),
    [
        (2.0, [2.0], 1.0, 3.0, 1.0),
        (2.0, [1.0, 3.0], 1.0, 3.0, 0.5),
        (2.5, [], 1.0, 2.0, 0.25),
        (2.0, [1.0], 1.0, 3.0, 0.5),
        (10.0, [], 1.0, 3.0, 0.0),
    ],
)
def test_flow_exact_bracket_tolerance_and_disjoint(
    value, levels, minimum, maximum, expected
):
    interval = Range(min=minimum, max=maximum, unit="cm/s")
    assert flow_similarity(value, levels, interval) == pytest.approx(expected)


def test_phase_exact_and_non_match():
    assert phase_similarity("solid", ["solid"]) == 1.0
    assert phase_similarity("gas", ["solid"]) == 0.0


def test_empty_phase_is_missing_not_zero_similarity():
    record = make_record(safety_theme="prevention")
    score = score_record(
        record, Scenario(fuel_phase="solid", safety_theme="prevention")
    )

    assert score is not None
    assert score.present["material_phase"] is False
    assert score.similarities["material_phase"] == 0.0
    assert score.score == pytest.approx(0.5 * 0.5**0.5)


def test_theme_primary_secondary_unrelated():
    assert theme_similarity("prevention", "prevention", []) == 1.0
    assert theme_similarity("detection", "prevention", ["detection"]) == 0.6
    assert theme_similarity("suppression", "prevention", ["detection"]) == 0.0


def test_absent_theme_is_missing_not_zero_similarity():
    record = make_record(fuel_phases=["solid"])
    score = score_record(
        record, Scenario(fuel_phase="solid", safety_theme="prevention")
    )

    assert score is not None
    assert score.present["safety_theme"] is False
    assert score.similarities["safety_theme"] == 0.0


def full_record(**overrides) -> InvestigationRecord:
    data = {
        "oxygen_fraction": oxygen_range(0.3, 0.3),
        "pressure": Range(min=8.2, max=8.2, unit="psia"),
        "gravity": Range(min=0.16, max=0.16, unit="g"),
        "recorded_gravity_values": [0.16],
        "flow_velocity": Range(min=2.0, max=2.0, unit="cm/s"),
        "recorded_flow_values": [2.0],
        "fuel_phases": ["solid"],
        "safety_theme": "prevention",
    }
    data.update(overrides)
    return make_record(**data)


def full_scenario(**overrides) -> Scenario:
    data = {
        "oxygen_fraction": 0.3,
        "pressure_psia": 8.2,
        "gravity_g": 0.16,
        "flow_velocity_cms": 2.0,
        "fuel_phase": "solid",
        "safety_theme": "prevention",
    }
    data.update(overrides)
    return Scenario(**data)


def test_direct_match_requires_all_six_dimensions():
    record = full_record()
    score = score_record(record, full_scenario())

    assert score is not None
    assert score.score == pytest.approx(1.0)
    assert score.coverage == 1.0
    assert classify_match(record, score) == "direct_match"


def test_five_matching_dimensions_are_partial_not_direct():
    record = full_record()
    score = score_record(record, full_scenario(flow_velocity_cms=None))

    assert score is not None
    assert classify_match(record, score) == "partial_match"


def test_missing_dimension_prevents_direct_match():
    record = full_record(flow_velocity=None, recorded_flow_values=[])
    score = score_record(record, full_scenario())

    assert score is not None
    assert score.present["flow"] is False
    assert classify_match(record, score) == "partial_match"


def test_metadata_only_record_is_contextual():
    record = make_record(
        annotation_status="metadata_only",
        oxygen_fraction=oxygen_range(0.3, 0.3),
    )

    assert score_record(record, Scenario(oxygen_fraction=0.3)) is None
    assert classify_match(record, None) == "contextual_only"


def test_modeling_record_is_contextual():
    record = make_record(
        evidence_class="modeling",
        oxygen_fraction=oxygen_range(0.3, 0.3),
    )

    assert score_record(record, Scenario(oxygen_fraction=0.3)) is None
    assert classify_match(record, None) == "contextual_only"


def test_t004_curated_records_are_source_cited():
    """T-004: All 7 curated records have annotation_status == 'source_cited'."""
    annotations_data = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    records = annotations_data["records"]
    assert len(records) == 7
    for record in records:
        assert record["annotation_status"] == "source_cited"
        assert record["extraction_method"] in {"script", "manual", "script_assisted_manual"}


def test_scenario_a_partial_gravity_direct_gap_t017():
    """T-017: Scenario A partial-gravity direct gap produces zero direct_match results.

    Verification Plan T-017: 'Scenario A has no direct_match'.
    1. Verifies against canonical annotations that all records produce zero direct_match
       results (none is direct_match under source_cited status).
    2. Verifies against physical ranking rules that Scenario A produces zero direct_match
       results because:
       - Gravity is 0.16 g (lunar partial gravity) whereas PSI records are microgravity (0.0 g).
       - Flow velocity is null (|Q(S)| = 5 < 6), which precludes direct_match per Spec §6.4.
    """
    annotations_data = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    scenario_raw = annotations_data["scenarios"]["scenario_A"]
    scenario_a = Scenario(
        oxygen_fraction=scenario_raw["oxygen_fraction"],
        pressure_psia=scenario_raw["pressure_psia"],
        gravity_g=scenario_raw["gravity_g"],
        flow_velocity_cms=scenario_raw["flow_velocity_cms"],
        fuel_phase=scenario_raw["fuel_phase"],
        safety_theme=scenario_raw["safety_theme"],
    )

    records = [
        InvestigationRecord.model_validate(raw)
        for raw in annotations_data["records"]
    ]
    assert len(records) == 7

    # 1. Canonical data verification
    canonical_matches = []
    for record in records:
        score = score_record(record, scenario_a)
        match_class = classify_match(record, score)
        canonical_matches.append(match_class)
        assert match_class != "direct_match"

    assert not any(m == "direct_match" for m in canonical_matches)

    # 2. Physical ranking rule verification under source_cited status
    for record in records:
        if record.catalog_role == "evidence" and record.evidence_class != "modeling":
            score = score_record(record, scenario_a)
            assert score is not None
            # Direct match requires all six dimensions (|Q(S)| == 6) and all similarities == 1.0.
            # Scenario A has flow=None (5 dimensions) and gravity is 0.16 g vs 0.0 g (similarity 0.0).
            match_class = classify_match(record, score)
            assert match_class != "direct_match"
            assert match_class == "partial_match"

