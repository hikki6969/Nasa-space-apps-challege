"""Versioned API contract for the FireSight backend (H0 mock surface)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import Field

from .models import (
    DataStatus,
    EvidenceClass,
    FuelPhase,
    InvestigationRecord,
    ProgramContext,
    ProjectType,
    Provenance,
    SafetyTheme,
    Scenario,
    StrictModel,
)

DimensionName = Literal[
    "oxygen",
    "pressure",
    "gravity",
    "flow",
    "material_phase",
    "safety_theme",
]
MatchClass = Literal["direct_match", "partial_match", "contextual_only"]


class HealthResponse(StrictModel):
    status: Literal["ok", "degraded"]
    version: str
    snapshot: bool
    snapshot_sha256: str | None
    snapshot_records: int
    index: bool
    embeddings: bool
    use_llm: bool
    messages: list[str]


class CatalogEntry(StrictModel):
    psi_id: str
    title: str
    acronym: str | None = None
    project_type: ProjectType
    catalog_role: Literal["evidence", "instrument_context"]
    data_status: DataStatus | None = None
    annotation_status: Literal["verified", "metadata_only"]
    evidence_class: EvidenceClass | None = None
    safety_theme: SafetyTheme | None = None
    source_url: str


class CatalogCounts(StrictModel):
    total: int
    evidence: int
    instrument_context: int
    verified: int
    metadata_only: int
    by_evidence_class: dict[str, int]


class CatalogResponse(StrictModel):
    counts: CatalogCounts
    records: list[CatalogEntry]


class TablePreview(StrictModel):
    file_name: str
    version: int
    columns: list[str]
    row_count: int
    rows: list[dict[str, Any]]
    download_url: str
    provenance: Provenance


class InvestigationResponse(StrictModel):
    record: InvestigationRecord
    table_previews: list[TablePreview]


class ScenarioFixture(StrictModel):
    id: Literal["A", "B", "C", "D"]
    name: str
    description: str
    scenario: Scenario
    expected_invariant: str
    numeric_inputs_complete: bool


class ScenariosResponse(StrictModel):
    scenarios: list[ScenarioFixture]


class RankRequest(StrictModel):
    scenario: Scenario
    scenario_id: str | None = None
    limit: int = Field(default=10, ge=1, le=10)


class DimensionScore(StrictModel):
    name: DimensionName
    weight: float
    requested: bool
    present: bool
    similarity: float | None
    record_value: str | None = None
    scenario_value: str | None = None
    provenance: Provenance | None = None
    limitation: str | None = None


class RankedResult(StrictModel):
    psi_id: str
    title: str
    acronym: str | None = None
    score: float
    coverage: float
    match_class: MatchClass
    dimensions: list[DimensionScore]
    justification: str
    matched_conditions: list[str]
    missing_dimensions: list[str]
    limitations: list[str]
    provenance: dict[str, Provenance]
    source_url: str
    evidence_class: EvidenceClass
    data_status: DataStatus


class RankResponse(StrictModel):
    scenario_id: str | None
    requested_dimensions: list[DimensionName]
    results: list[RankedResult]
    gap_statement: str


class CompareRequest(StrictModel):
    psi_ids: list[str] = Field(min_length=2, max_length=4)


class CompareRow(StrictModel):
    name: str
    values: dict[str, str | None]


class CompareResponse(StrictModel):
    psi_ids: list[str]
    records: list[InvestigationRecord]
    shared_fields: list[str]
    differing_fields: list[str]
    rows: list[CompareRow]


class ObservationPoint(StrictModel):
    psi_id: str
    file_name: str
    row_index: int
    oxygen_fraction: float | None = None
    pressure_psia: float | None = None
    flow_velocity_cms: float | None = None
    gravity_g: float | None = None
    fuel_phase: FuelPhase | None = None
    provenance: Provenance


class ObservationsResponse(StrictModel):
    points: list[ObservationPoint]
    excluded_psi_ids: list[str]
    disclaimer: str


class ContextCard(StrictModel):
    kind: Literal["incident", "spinoff"]
    id: str
    title: str
    summary: str
    source_url: str


class ContextResponse(StrictModel):
    incidents: list[ContextCard]
    spinoff: list[ContextCard]
    instruments: list[CatalogEntry]
    programs: list[ProgramContext]


class AskRequest(StrictModel):
    question: str = Field(min_length=1)


class Citation(StrictModel):
    psi_id: str
    title: str
    source_url: str


class AskResponse(StrictModel):
    answer: str
    citations: list[Citation]
    refused: bool
    refusal_reason: str | None = None
    scope: Literal["fire_safety", "rocket_propellant", "out_of_scope"]
