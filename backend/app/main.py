"""H0 FastAPI mock surface for the frozen FireSight contract."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .api_models import (
    AskRequest,
    AskResponse,
    CatalogResponse,
    CompareRequest,
    CompareResponse,
    ContextResponse,
    HealthResponse,
    InvestigationResponse,
    ObservationsResponse,
    RankRequest,
    RankResponse,
    ScenariosResponse,
)
from .mock_data import (
    MOCK_CATALOG,
    MOCK_COMPARE,
    MOCK_CONTEXT,
    MOCK_HEALTH,
    MOCK_OBSERVATIONS,
    MOCK_RANKS,
    MOCK_SCENARIOS,
    mock_ask,
    mock_investigation,
)

app = FastAPI(
    title="FireSight API",
    version="0.1.0",
    description=(
        "NASA PSI fire-safety evidence synthesizer. This version is the H0 mock "
        "contract; canonical snapshot endpoints arrive in H1/H2."
    ),
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return MOCK_HEALTH


@app.get("/api/catalog", response_model=CatalogResponse)
def catalog() -> CatalogResponse:
    return MOCK_CATALOG


@app.get("/api/investigations/{psi_id}", response_model=InvestigationResponse)
def investigation(psi_id: str) -> InvestigationResponse:
    response = mock_investigation(psi_id)
    if response is None:
        raise HTTPException(status_code=404, detail=f"No mock investigation {psi_id}")
    return response


@app.get("/api/scenarios", response_model=ScenariosResponse)
def scenarios() -> ScenariosResponse:
    return MOCK_SCENARIOS


@app.post("/api/rank", response_model=RankResponse)
def rank(request: RankRequest) -> RankResponse:
    scenario_id = request.scenario_id or "A"
    response = MOCK_RANKS.get(scenario_id)
    if response is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario {scenario_id}")
    return response


@app.post("/api/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    if set(request.psi_ids) != set(MOCK_COMPARE.psi_ids):
        raise HTTPException(
            status_code=404,
            detail="H0 mock comparison is fixed to PSI-69 and PSI-68",
        )
    return MOCK_COMPARE


@app.get("/api/observations", response_model=ObservationsResponse)
def observations() -> ObservationsResponse:
    return MOCK_OBSERVATIONS


@app.get("/api/context", response_model=ContextResponse)
def context() -> ContextResponse:
    return MOCK_CONTEXT


@app.post("/api/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    return mock_ask(request.question)
