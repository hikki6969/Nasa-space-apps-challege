"""Frozen FireSight evidence schema.

This module is the normative representation from Product Spec section 4.1.
Do not loosen strictness, units, or provenance requirements without a
product-spec and decision-log change.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

RangeUnit = Literal["fraction", "psia", "cm/s", "g"]
FuelPhase = Literal["solid", "liquid_droplet", "gas"]
SafetyTheme = Literal["prevention", "detection", "suppression"]
EvidenceClass = Literal[
    "bench_flammability",
    "large_scale_demonstration",
    "flame_physics",
    "detection_instrumentation",
    "suppression",
    "modeling",
]
ProjectType = Literal["microgravity", "ground"]
CatalogRole = Literal["evidence", "instrument_context"]
DataStatus = Literal["complete", "partial"]
ProgramContextStatus = Literal["active_program", "anticipated_in_psi"]
AnnotationStatus = Literal["source_cited", "metadata_only"]
ExtractionMethod = Literal["script", "manual", "script_assisted_manual"]
# Populated values in these fields must carry field-level provenance.
PHYSICAL_FIELDS = frozenset(
    {
        "oxygen_fraction",
        "pressure",
        "flow_velocity",
        "gravity",
        "fuel",
        "fuel_phases",
        "safety_theme",
    }
)
RECORDED_VALUE_FIELDS = ("recorded_gravity_values", "recorded_flow_values")


class StrictModel(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")


class Range(StrictModel):
    min: float
    max: float
    unit: RangeUnit
    notes: str | None = None

    @model_validator(mode="after")
    def validate_bounds(self) -> "Range":
        if self.min > self.max:
            raise ValueError("Range.min must be <= Range.max")
        return self


class Provenance(StrictModel):
    source_url: str
    source_kind: Literal["psi_narrative", "psi_table", "publication", "nasa_program"]
    excerpt_or_table_ref: str
    note: str | None = None
    value_kind: Literal["reported", "safely_derived"] = "reported"
    extraction_method: ExtractionMethod | None = None


class ExperimentalTable(StrictModel):
    psi_id: str
    file_name: str
    version: int
    s3_version_id: str
    download_url: str
    columns: list[str]
    rows: list[dict[str, Any]]
    provenance: Provenance


class InvestigationRecord(StrictModel):
    psi_id: str
    title: str
    acronym: str | None = None
    research_area: str
    project_type: ProjectType
    catalog_role: CatalogRole = "evidence"
    evidence_class: EvidenceClass
    safety_theme: SafetyTheme | None = None
    secondary_safety_themes: list[SafetyTheme] = []

    fuel: str | None = None
    fuel_phases: list[FuelPhase] = []
    oxygen_fraction: Range | None = None
    pressure: Range | None = None
    flow_velocity: Range | None = None
    gravity: Range | None = None
    recorded_gravity_values: list[float] = []
    recorded_flow_values: list[float] = []
    hardware: list[str] = []
    orientation: list[str] = []

    objectives_text: str
    approach_text: str
    key_findings_text: str | None = None

    experimental_tables: list[ExperimentalTable] = []
    data_status: DataStatus
    annotation_status: AnnotationStatus
    extraction_method: ExtractionMethod | None = None

    doi: str | None = None
    license: str | None = None
    source_url: str
    provenance: dict[str, Provenance] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_record(self) -> "InvestigationRecord":
        expected_units = {
            "oxygen_fraction": "fraction",
            "pressure": "psia",
            "flow_velocity": "cm/s",
            "gravity": "g",
        }
        for field, expected_unit in expected_units.items():
            value = getattr(self, field)
            if value is not None and value.unit != expected_unit:
                raise ValueError(f"{field} must use unit {expected_unit}")

        if self.recorded_gravity_values and self.gravity is None:
            raise ValueError("recorded_gravity_values requires a gravity Range")
        if self.recorded_flow_values and self.flow_velocity is None:
            raise ValueError("recorded_flow_values requires a flow_velocity Range")

        for table in self.experimental_tables:
            if table.psi_id != self.psi_id:
                raise ValueError("experimental_tables.psi_id must match parent psi_id")

        for field in PHYSICAL_FIELDS:
            value = getattr(self, field)
            if value not in (None, [], ""):
                if field not in self.provenance:
                    raise ValueError(f"Missing provenance for {field}")
        for field in RECORDED_VALUE_FIELDS:
            if getattr(self, field) and field not in self.provenance:
                raise ValueError(f"Missing provenance for {field}")

        if self.annotation_status == "source_cited":
            if self.extraction_method is None:
                raise ValueError("source_cited records require extraction_method")
            for field, entry in self.provenance.items():
                if entry.extraction_method is None:
                    raise ValueError(
                        f"Missing extraction_method in provenance for {field}"
                    )
        return self

    @property
    def rank_eligible(self) -> bool:
        """Only source-cited evidence records enter physical ranking."""
        return (
            self.annotation_status == "source_cited" and self.catalog_role == "evidence"
        )


class ProgramContext(StrictModel):
    program_id: str
    title: str
    data_status: ProgramContextStatus
    source_url: str
    provenance: dict[str, Provenance] = Field(default_factory=dict)


class Scenario(StrictModel):
    oxygen_fraction: float | None = None
    pressure_psia: float | None = None
    gravity_g: float | None = None
    flow_velocity_cms: float | None = None
    fuel_phase: FuelPhase | None = None
    safety_theme: SafetyTheme | None = None
