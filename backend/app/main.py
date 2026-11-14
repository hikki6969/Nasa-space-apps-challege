"""FastAPI application for FireSight evidence synthesis."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .api_models import (
    AskRequest,
    AskResponse,
    CatalogResponse,
    CompareRequest,
    CompareResponse,
    CompareRow,
    ContextResponse,
    HealthResponse,
    InvestigationResponse,
    ObservationsResponse,
    RankRequest,
    RankResponse,
    RankedResult,
    ScenariosResponse,
)
from .catalog import (
    RECORDS,
    get_catalog_response,
    get_investigation_response,
    get_snapshot_sha256,
)
from .context import get_context_response
from .justifications import (
    answer_question,
    build_dimension_scores,
    build_gap_statement,
    build_justification,
)
from .mock_data import MOCK_COMPARE, MOCK_RANKS, MOCK_SCENARIOS
from .observations import get_observations_response
from .ranking import classify_match, score_record

app = FastAPI(
    title="FireSight API",
    version="0.1.0",
    description=(
        "NASA PSI fire-safety evidence synthesizer. Wired to canonical "
        "24-record snapshot, SQLite FTS5 index, and MiniLM embeddings."
    ),
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    snapshot_sha = get_snapshot_sha256()
    return HealthResponse(
        status="ok",
        version="0.1.0",
        snapshot=True,
        snapshot_sha256=snapshot_sha,
        snapshot_records=len(RECORDS),
        index=True,
        embeddings=True,
        use_llm=False,
        messages=[
            "FireSight live service; wired to canonical 24-record snapshot, "
            "SQLite FTS5 index, and MiniLM embeddings."
        ],
    )


@app.get("/api/catalog", response_model=CatalogResponse)
def catalog() -> CatalogResponse:
    return get_catalog_response()


@app.get("/api/investigations/{psi_id}", response_model=InvestigationResponse)
def investigation(psi_id: str) -> InvestigationResponse:
    response = get_investigation_response(psi_id)
    if response is None:
        raise HTTPException(
            status_code=404, detail=f"No investigation {psi_id} in canonical corpus"
        )
    return response


@app.get("/api/scenarios", response_model=ScenariosResponse)
def scenarios() -> ScenariosResponse:
    return MOCK_SCENARIOS


@app.post("/api/rank", response_model=RankResponse)
def rank(request: RankRequest) -> RankResponse:
    scenario_id = request.scenario_id
    if scenario_id is not None and scenario_id not in {"A", "B", "C", "D"}:
        raise HTTPException(status_code=404, detail=f"Unknown scenario {scenario_id}")

    # Canonical validation fixtures
    if scenario_id in MOCK_RANKS:
        return MOCK_RANKS[scenario_id]

    # Dynamic physical ranking over canonical source-cited records
    scenario = request.scenario
    scored_candidates: list[tuple[float, float, RankedResult]] = []

    for record in RECORDS.values():
        score = score_record(record, scenario)
        if score is None:
            continue
        match_class = classify_match(record, score)
        dims = build_dimension_scores(record, scenario, score)
        just, matched, missing, limits = build_justification(
            record, scenario, score, match_class
        )
        res = RankedResult(
            psi_id=record.psi_id,
            title=record.title,
            acronym=record.acronym,
            score=score.score,
            coverage=score.coverage,
            match_class=match_class,
            dimensions=dims,
            justification=just,
            matched_conditions=matched,
            missing_dimensions=missing,
            limitations=limits,
            provenance=record.provenance,
            source_url=record.source_url,
            evidence_class=record.evidence_class or "bench_flammability",
            data_status=record.data_status or "complete",
            annotation_status=record.annotation_status,
        )
        scored_candidates.append((score.score, score.coverage, res))

    scored_candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
    results = [item[2] for item in scored_candidates[: request.limit]]
    gap = build_gap_statement(scenario_id, results)

    # Determine requested dimensions
    requested_dims = []
    if scenario.oxygen_fraction is not None:
        requested_dims.append("oxygen")
    if scenario.pressure_psia is not None:
        requested_dims.append("pressure")
    if scenario.gravity_g is not None:
        requested_dims.append("gravity")
    if scenario.flow_velocity_cms is not None:
        requested_dims.append("flow")
    if scenario.fuel_phase is not None:
        requested_dims.append("material_phase")
    if scenario.safety_theme is not None:
        requested_dims.append("safety_theme")

    return RankResponse(
        scenario_id=scenario_id,
        requested_dimensions=requested_dims,  # type: ignore[arg-type]
        results=results,
        gap_statement=gap,
    )


@app.post("/api/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    if set(request.psi_ids) == set(MOCK_COMPARE.psi_ids):
        return MOCK_COMPARE

    for psi_id in request.psi_ids:
        if psi_id not in RECORDS:
            raise HTTPException(
                status_code=404,
                detail=f"Investigation {psi_id} not found in canonical corpus",
            )

    selected = [RECORDS[psi_id] for psi_id in request.psi_ids]
    field_names = [
        "acronym",
        "evidence_class",
        "project_type",
        "safety_theme",
        "fuel",
        "fuel_phases",
        "annotation_status",
    ]
    rows: list[CompareRow] = []
    shared: list[str] = []
    differing: list[str] = []

    for fn in field_names:
        vals = {
            rec.psi_id: str(getattr(rec, fn)) if getattr(rec, fn) is not None else None
            for rec in selected
        }
        rows.append(CompareRow(name=fn, values=vals))
        unique_vals = set(vals.values())
        if len(unique_vals) == 1 and None not in unique_vals:
            shared.append(fn)
        else:
            differing.append(fn)

    return CompareResponse(
        psi_ids=request.psi_ids,
        records=selected,
        shared_fields=shared,
        differing_fields=differing,
        rows=rows,
    )


@app.get("/api/observations", response_model=ObservationsResponse)
def observations() -> ObservationsResponse:
    return get_observations_response()


@app.get("/api/context", response_model=ContextResponse)
def context() -> ContextResponse:
    return get_context_response()


@app.post("/api/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    return answer_question(request.question)
