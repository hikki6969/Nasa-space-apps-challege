import pytest
from pydantic import ValidationError

from backend.app.models import (
    ExperimentalTable,
    InvestigationRecord,
    ProgramContext,
    Provenance,
    Range,
    Scenario,
)


def provenance() -> Provenance:
    return Provenance(
        source_url="https://example.test/source",
        source_kind="psi_narrative",
        excerpt="test excerpt",
    )


def minimal_record(**overrides) -> InvestigationRecord:
    data = {
        "psi_id": "PSI-900",
        "title": "Test investigation",
        "research_area": "Combustion Science",
        "project_type": "microgravity",
        "evidence_class": "bench_flammability",
        "objectives_text": "Test objective.",
        "approach_text": "Test approach.",
        "data_status": "complete",
        "annotation_status": "verified",
        "source_url": "https://example.test/PSI-900",
    }
    data.update(overrides)
    return InvestigationRecord(**data)


def test_minimal_record_is_valid():
    record = minimal_record()
    assert record.rank_eligible is True
    assert record.provenance == {}


def test_reversed_range_bounds_fail():
    with pytest.raises(ValidationError, match="Range.min must be <= Range.max"):
        Range(min=0.3, max=0.2, unit="fraction")


@pytest.mark.parametrize(
    "payload",
    [
        {"min": "0.1", "max": 0.2, "unit": "fraction"},
        {"min": 0.1, "max": "0.2", "unit": "fraction"},
    ],
)
def test_range_rejects_string_to_number_coercion(payload):
    with pytest.raises(ValidationError):
        Range(**payload)


def test_scenario_rejects_string_to_number_coercion():
    with pytest.raises(ValidationError):
        Scenario(oxygen_fraction="0.3")


def test_range_rejects_extra_fields():
    with pytest.raises(ValidationError):
        Range(min=0.1, max=0.2, unit="fraction", unit_note="extra")


@pytest.mark.parametrize(
    ("field", "value", "wrong_unit"),
    [
        ("oxygen_fraction", {"min": 0.1, "max": 0.2}, "psia"),
        ("pressure", {"min": 7.0, "max": 8.0}, "fraction"),
        ("flow_velocity", {"min": 1.0, "max": 2.0}, "psia"),
        ("gravity", {"min": 0.0, "max": 1.0}, "cm/s"),
    ],
)
def test_physical_range_rejects_wrong_unit(field, value, wrong_unit):
    with pytest.raises(ValidationError, match=f"{field} must use unit"):
        minimal_record(
            **{field: Range(**value, unit=wrong_unit)},
            provenance={field: provenance()},
        )


MISSING_PROVENANCE_CASES = [
    ("oxygen_fraction", {"oxygen_fraction": Range(min=0.1, max=0.2, unit="fraction")}),
    ("pressure", {"pressure": Range(min=7.0, max=8.0, unit="psia")}),
    ("flow_velocity", {"flow_velocity": Range(min=1.0, max=2.0, unit="cm/s")}),
    ("gravity", {"gravity": Range(min=0.0, max=1.0, unit="g")}),
    ("fuel", {"fuel": "PMMA"}),
    ("fuel_phases", {"fuel_phases": ["solid"]}),
    ("safety_theme", {"safety_theme": "prevention"}),
]


@pytest.mark.parametrize(("field", "payload"), MISSING_PROVENANCE_CASES)
def test_missing_provenance_fails_even_for_metadata_only(field, payload):
    with pytest.raises(ValidationError, match=f"Missing provenance for {field}"):
        minimal_record(annotation_status="metadata_only", **payload)


def test_recorded_gravity_values_require_own_provenance():
    with pytest.raises(
        ValidationError, match="Missing provenance for recorded_gravity_values"
    ):
        minimal_record(
            gravity=Range(min=0.0, max=0.0, unit="g"),
            recorded_gravity_values=[0.0],
            provenance={"gravity": provenance()},
        )


def test_recorded_flow_values_require_own_provenance():
    with pytest.raises(
        ValidationError, match="Missing provenance for recorded_flow_values"
    ):
        minimal_record(
            flow_velocity=Range(min=0.0, max=2.0, unit="cm/s"),
            recorded_flow_values=[1.0],
            provenance={"flow_velocity": provenance()},
        )


def test_populated_metadata_only_record_with_provenance_is_valid():
    record = minimal_record(
        annotation_status="metadata_only",
        oxygen_fraction=Range(min=0.1, max=0.2, unit="fraction"),
        provenance={"oxygen_fraction": provenance()},
    )
    assert record.rank_eligible is False


def test_recorded_gravity_values_require_gravity_range():
    with pytest.raises(ValidationError, match="requires a gravity Range"):
        minimal_record(
            recorded_gravity_values=[0.0],
            provenance={"recorded_gravity_values": provenance()},
        )


def test_recorded_flow_values_require_flow_range():
    with pytest.raises(ValidationError, match="requires a flow_velocity Range"):
        minimal_record(
            recorded_flow_values=[1.0],
            provenance={"recorded_flow_values": provenance()},
        )


def table(psi_id: str = "PSI-900") -> ExperimentalTable:
    return ExperimentalTable(
        psi_id=psi_id,
        file_name="table.csv",
        version=1,
        s3_version_id="version-id",
        download_url="https://example.test/table.csv",
        columns=[],
        rows=[],
        provenance=provenance(),
    )


def test_nested_table_id_mismatch_fails():
    with pytest.raises(
        ValidationError, match="experimental_tables.psi_id must match parent psi_id"
    ):
        minimal_record(experimental_tables=[table("PSI-901")])


def test_matching_nested_table_id_passes():
    record = minimal_record(experimental_tables=[table()])
    assert record.experimental_tables[0].psi_id == record.psi_id


def test_experimental_table_requires_provenance():
    with pytest.raises(ValidationError):
        ExperimentalTable(
            psi_id="PSI-900",
            file_name="table.csv",
            version=1,
            s3_version_id="version-id",
            download_url="https://example.test/table.csv",
            columns=[],
            rows=[],
        )


def test_program_context_distinguishes_statuses():
    anticipated = ProgramContext(
        program_id="FM2",
        title="Flammability of Materials on the Moon",
        data_status="anticipated_in_psi",
        source_url="https://example.test/fm2",
    )
    active = ProgramContext(
        program_id="SoFIE",
        title="Solid Fuel Ignition and Extinction",
        data_status="active_program",
        source_url="https://example.test/sofie",
    )
    assert anticipated.data_status == "anticipated_in_psi"
    assert active.data_status == "active_program"


@pytest.mark.parametrize(
    "extra",
    [
        {"evidence_class": "modeling"},
        {"experimental_tables": []},
        {"annotation_status": "verified"},
    ],
)
def test_program_context_rejects_measured_record_fields(extra):
    with pytest.raises(ValidationError):
        ProgramContext(
            program_id="FM2",
            title="Flammability of Materials on the Moon",
            data_status="anticipated_in_psi",
            source_url="https://example.test/fm2",
            **extra,
        )


def test_program_context_rejects_unknown_status():
    with pytest.raises(ValidationError):
        ProgramContext(
            program_id="FM2",
            title="Flammability of Materials on the Moon",
            data_status="complete",
            source_url="https://example.test/fm2",
        )


def test_rank_eligibility_excludes_metadata_only():
    record = minimal_record(annotation_status="metadata_only")
    assert record.rank_eligible is False


def test_rank_eligibility_excludes_instrument_context():
    record = minimal_record(catalog_role="instrument_context")
    assert record.rank_eligible is False


def test_rank_eligibility_excludes_metadata_only_instrument_context():
    record = minimal_record(
        catalog_role="instrument_context", annotation_status="metadata_only"
    )
    assert record.rank_eligible is False


def test_record_rejects_unknown_catalog_role():
    with pytest.raises(ValidationError):
        minimal_record(catalog_role="ranked")


def test_record_rejects_program_context_status():
    with pytest.raises(ValidationError):
        minimal_record(data_status="anticipated_in_psi")


def test_provenance_rejects_unknown_value_kind():
    with pytest.raises(ValidationError):
        Provenance(
            source_url="https://example.test/source",
            source_kind="psi_narrative",
            excerpt="test excerpt",
            value_kind="estimated",
        )
