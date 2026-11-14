# Technology Stack

The stack is selected for a 24-record, local, offline demo. Exact package versions are locked in project lockfiles when the implementation is created; the table below defines the intended components, not floating dependency ranges.

## 1. Runtime topology

```text
Browser
  -> nginx / React production build
  -> /api proxy
  -> FastAPI / Uvicorn
  -> canonical JSON + generated SQLite/FTS5 + embeddings.npy
```

| Layer | Selection | Constraint |
|---|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Plotly | No second component library; production build served by nginx |
| Backend | Python 3.11+, FastAPI, Pydantic v2 | Typed request/response models; no ORM required |
| Validation | Pydantic v2 | Strict model validation; no silent numeric coercion/defaults |
| Search | Python standard `sqlite3` with FTS5 | Derived index; BM25 built in; no external search service |
| Similarity | NumPy | Runtime loads only `embeddings.npy`; no model inference |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` at build/refresh time | Exact model revision and artifact hash must be pinned before generation |
| Optional AI | Local Phi-3 profile | Excluded from default image; `USE_LLM=false` |
| Containers | Docker Compose | Two services: frontend and backend |
| Frontend server | nginx | Serves static Vite output and proxies `/api` |
| Tests | pytest for backend; the project's chosen Vitest/Jest setup for frontend | Assertions from [Verification Plan](06_VERIFICATION_PLAN.md) are mandatory |
| Docs check | Python standard library | `scripts/check_docs.py`; no documentation framework dependency |

## 2. Canonical data layout

```text
data/
  psi_snapshot.json
  annotations.json
  program_context.json
  embeddings.npy
  snapshot.sha256
  generated/
    firesight.db
```

Rules:

- JSON is canonical and git-tracked.
- The SQLite database and embeddings are reproducible derived artifacts.
- The generated database may be ignored by git if the build command recreates it deterministically.
- The embedding array is committed or reproducibly generated with a pinned model hash; the runtime never imports PyTorch.

## 3. Backend modules

```text
backend/app/
  main.py             # FastAPI application and route registration
  models.py           # frozen Pydantic schema
  catalog.py          # canonical snapshot loading and validation
  retrieval.py        # structured filters and FTS5/BM25
  similarity.py       # six deterministic similarity functions
  ranking.py          # weighted score, coverage, match classes
  justifications.py   # template explanations and scope guard
  observations.py     # measured-point-only plot data
  context.py          # incidents, Spinoff, instrument/program context
```

Module boundaries follow the product layers. Do not add repository, service, or ORM layers unless a measured requirement appears.

## 4. Frontend modules

```text
frontend/src/
  api/                # generated/manual API types and client
  components/         # shared controls and visualization components
  features/
    scenarios/
    investigations/
    compare/
    observed-map/
    context/
    qa/
  App.tsx
  main.tsx
```

Use the production build as the judged path. Development servers are conveniences, not deployment evidence.

## 5. Dependencies deliberately excluded

- PostgreSQL and pgvector.
- Runtime PyTorch, Transformers, or sentence-transformers.
- Hosted LLM clients and API-key handling.
- A graph database or Cytoscape dependency.
- A fitted-model/statistical-learning service.
- A frontend component library in addition to Tailwind's utility layer.

## 6. Model and artifact governance

| Artifact | Allowed location | Required record |
|---|---|---|
| Canonical PSI JSON | `data/` | source URLs, SHA-256, license fields |
| Human annotations | `data/annotations.json` | field-level provenance |
| MiniLM artifact | build environment | model ID, revision, SHA-256, license |
| `embeddings.npy` | `data/` | generator command and model hash |
| Optional Phi-3 artifact | host-mounted optional profile only | model ID, revision, hash, license, prompt hash |
| PSI table data | snapshot/derived index | file name, version ID, stable download URL; never a signed URL |

## 7. Version and license policy

- Python and npm exact versions are pinned in lockfiles and container images.
- Every dependency must have a compatible license recorded before merge.
- Model and dataset licenses are recorded separately from application-code licenses.
- A missing license is `unknown` and blocks redistribution; it is not assumed to be public domain.
- The current PSI detail records expose per-record license metadata. The snapshot builder preserves that field verbatim.

## 8. Performance targets

| Path | Target |
|---|---|
| Ranking request p95 | below 500 ms without optional LLM |
| Catalog/detail request p95 | below 250 ms on the local fixture set |
| Optional LLM response p95 | below 3 s with cached outputs; otherwise disabled |
| Frontend production build | completes in the clean Docker build without network at runtime |
| Offline demo | all core paths function with network disabled |

Performance claims require command output captured after the final relevant mutation.
