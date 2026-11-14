# FireSight · NASA PSI Fire Safety Evidence Synthesizer

FireSight is an explainable, local evidence synthesizer that ranks NASA Physical Sciences Informatics (PSI) combustion investigations against human spacecraft fire-safety scenarios. It surfaces the empirical evidence behind every score, exposes uncharacterized environmental combinations as explicit gap statements, and visualizes observed test domains without extrapolating an empirical dataset into a predictive flammability model.

---

## Key Capabilities

1. **Deterministic Physical Ranking**: Evaluates 6 physical and taxonomic dimensions (Oxygen, Pressure, Gravity, Flow Velocity, Fuel Phase, and Safety Theme) with strict tolerance-overlap formulas, coverage penalties, and no score redistribution.
2. **Provenance-First Evidence (Data Safety §9)**: Curated numeric parameters carry field-level provenance (`source_url`, `source_kind`, `excerpt_or_table_ref`, `value_kind`, `extraction_method = "script"`).
3. **Honest Gap Statements**: Identifies uncharacterized domain gaps (such as Scenario A's partial-gravity 30% O₂ solid-fuel regime) rather than manufacturing false matches.
4. **Side-by-Side Comparison**: Multi-investigation comparison matrix and parallel-coordinates plot for compatible physical axes.
5. **Observed Test Domain**: Scatter visualization of measured observation points with explicit disclaimer: *"Observed test domain; not a validated flammability boundary."*
6. **Bounded Q&A & Scope Guard**: Answers spacecraft fire-safety queries from curated evidence; strictly refuses out-of-scope rocket-engine or propellant-combustion queries.

---

## Architecture

The project consists of two containerized, offline-capable services:

```text
├── backend/
│   ├── Dockerfile             # Python 3.12-slim non-root runtime (port 8000)
│   └── app/
│       ├── main.py            # FastAPI endpoints (/api/health, /api/rank, etc.)
│       ├── catalog.py         # Canonical 24-record loader and integrity validator
│       ├── retrieval.py       # SQLite FTS5 BM25 + NumPy MiniLM vector cosine RRF
│       ├── ranking.py         # Deterministic physical similarity formulas
│       ├── justifications.py  # Template explanations and scope guard
│       └── observations.py    # Measured observations from ranked-eligible evidence
├── frontend/
│   ├── Dockerfile             # Multi-stage build: node:22-alpine -> nginx:alpine (port 3000)
│   └── src/
│       ├── features/          # Overview, Investigations, Compare, Observed Map, Context, QA
│       ├── components/        # Accessible UI primitives, ChartFrame, PlotlyChart
│       └── api/               # Typed client with mock/live adapters
├── data/
│   ├── psi_snapshot.json      # Frozen 24-record canonical dataset
│   ├── annotations.json       # 7 curated records with field-level provenance
│   ├── snapshot.sha256        # SHA-256 digest (596f50c6...)
│   └── embeddings.npy         # (24, 384) float32 normalized MiniLM text embeddings
├── docker/
│   └── nginx.conf             # Nginx reverse proxy configuration (/api/ -> backend)
├── compose.yaml               # Multi-service local orchestration
└── scripts/                   # Data validation, index building, and contract export
```

---

## Quickstart (Offline Containerized Deployment)

Run both services with Docker Compose:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Direct**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Local Development

### Backend (Python 3.12+)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt  # or run via .venv

# Run the test suite
python -m pytest

# Run the data and documentation integrity checkers
python scripts/check_data.py
python scripts/check_docs.py

# Start local backend dev server
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend (Node 22+)

```bash
cd frontend
npm ci

# Typecheck, lint, test, and build
npm run check

# Start local frontend dev server
npm run dev
```

---

## Verification Gates

All machine-checked verification gates pass cleanly:

| Gate | Command | Status |
|---|---|---|
| **Data Integrity** | `python scripts/check_data.py` | 0 failures (24 records, 22 tables, 7 source_cited) |
| **Doc Contract** | `python scripts/check_docs.py` | 0 failures (17 required documents) |
| **Backend Tests** | `pytest` | 148 passed |
| **Frontend Tests** | `npm --prefix frontend run check` | 49 passed, 0 lint errors, build clean |
| **Latency Benchmark**| `pytest tests/backend/test_benchmark_ranking.py` | p95 = 7.39 ms (< 500 ms target) |
| **Container Health** | `docker compose up --build` | Both containers start and report `(healthy)` |

---

## Safety & Invariant Rulings

- **Data Safety §9 (D-017, P-024)**: Annotation status is `source_cited` backed by field-level provenance. No human verification or signature is claimed.
- **Scope Guard (P-002)**: Rocket-engine and propellant-combustion queries return immediate bounded refusals.
- **Corpus Boundaries**: PSI-47 is preserved as `instrument_context` and never ranked; PSI-117 is preserved as modeling context without measured tables.
- **Runtime Dependency Boundary**: Runtime execution strictly forbids importing PyTorch or Transformers (`USE_LLM=false`). Text embeddings are precomputed and queried via pure NumPy dot products.
