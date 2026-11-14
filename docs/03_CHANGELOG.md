# Changelog

All notable changes to the specification and implementation baseline are recorded here.

## 2026-11-14 — Person B H2 live backend integration (full alignment)

### Added

- `frontend/src/api/live.ts` — the live H2 adapter. Normalizes Person A's wire format onto the UI's shapes: slim `/api/catalog` is hydrated from `/api/investigations/{id}` (25 in-memory calls, exact — never estimated); counts/distributions/warnings derived from the 24 hydrated canonical records; `anticipated` counted from `/api/context` programs with `data_status = anticipated_in_psi`; snapshot SHA-256 read from `/api/health`; `/api/compare` returns full records which feed the same derivation path as the mock (`buildCompareFromRecords`); `material_phase`/`safety_theme` map to the UI's `phase`/`theme` dimensions; `similarity` stays nullable end-to-end. Nothing is fabricated; provenance passes through untouched.
- `frontend/src/api/derived.ts` — derivation helpers shared by the mock and live adapters (counts, distributions, compare matrix, parallel axes), so both produce identical UI shapes from the same records.
- `frontend/src/features/investigations/liveBackend.integration.test.tsx` — 12 opt-in tests (9 adapter-level + 3 UI run-throughs of B3/B4: catalog render/search/facet filter, detail with field-level provenance, compare drawer). Skipped unless `FIRESIGHT_LIVE_API=1` with the backend running at `FIRESIGHT_API_BASE_URL` (default `http://127.0.0.1:8000/api`); always skipped by `npm run check`.
- `RankRequest.scenario_id` (`'A'|'B'|'C'|'D'`) — the Overview now ranks canonical scenarios with their id, which selects the canonical gap statement (e.g. T-017's direct gap for Scenario A).

### Changed

- `frontend/src/api/client.ts` — the transport (`createHttpTransport`) is now separated from any schema assumption; normalization lives in `live.ts`. `createHttpApi` is replaced by `createLiveApi` (exported from `api/index.ts`).
- `types.ts` — aligned with the live contract: `ObservationPoint` is now `{ psi_id, file_name, row_index, oxygen_fraction, pressure_psia, flow_velocity_cms, gravity_g, fuel_phase, outcome?, provenance }` with null live values; `ObservationsResponse.excluded` replaced by `excluded_psi_ids` (the live endpoint reports accessions only); `DimensionScore.similarity` is `number | null`; `AskCitation.field/value` optional; `ExperimentalTable.s3_version_id` removed (absent in live previews).
- `frontend/Dockerfile` — production image now builds with `VITE_API_MODE=http` and `VITE_API_BASE_URL=/api` (previously the default mock bundle shipped in the "live" image); offline mock builds possible via `--build-arg VITE_API_MODE=mock`.
- Observed map (B5) — two honest render modes from one payload: flow-rich fixtures keep the 2-D O₂×flow chart (hull on ≥3 points); live oxygen-bounds-only data renders a single-lane strip with `.0%` O₂ axis, no flow axis, no hull, and legends shown only for outcomes/phases actually present ("The live endpoint reports no outcome for these rows"). Disclaimer remains exact and always visible.
- Mock fixture (`api/mock/observations.ts`) carries representative outcomes/flow so the 2-D chart stays exercisable offline; values labeled H0 non-canonical.
- Q&A panel renders citation field/value only when present (live citations carry none).

### Verified

- Live backend (`uvicorn backend.app.main:app --port 8000`): `/api/health` ok (snapshot digest `596f50c6…`, `use_llm=false`). Integration suite: **12/12 pass**, including T-017 shape of Scenario A (no `direct_match`, canonical gap statement), BASS-II oxygen provenance (`excerpt_or_table_ref`, VF-06), exact disclaimer string, FM2/LUCI/PSI-47/PSI-117 exclusion, rocket/propellant refusal, and Spot-check rendering of the full catalog UI with real scores (PSI-25 `0.199 · 80%`, PSI-47 `Not ranked · instrument context`).
- `npm run check` → typecheck, lint (0 warnings), **70/70** tests, production build (integration suite skips by default).

### Known limits

- The mock adapter (H0 representative fixtures) remains the default for offline development and is unaffected by the live path. The containerized demo (`docker compose`) has NOT been rebuilt/re-verified in this pass — B9 remains unchecked; the Dockerfile change fixes the mock-bundle bug but needs an H4 rehearsal.
- The live `/api/compare` returns Python-repr `rows` that the UI deliberately does not render; the matrix and unit-compatible parallel axes derive from the hydrated full records instead (identical logic to the mock, missing values excluded rather than imputed).
- The live observed-points endpoint reports 2 BASS-II oxygen bounds only — the map shows them as measured table bounds; no flow axis, no outcome encoding (not fabricated).
- Hydration is 25 HTTP calls per catalog load; acceptable against the in-memory backend, worth revisiting if the corpus grows.

## 2026-11-14 — Person B B5 implementation (Observed Flammability Map)

### Added

- `frontend/src/features/observed-map/ObservedMapPanel.test.tsx` — 17 cases in four suites:
  - Panel: exact spec §10.2 disclaimer (`Observed test domain; not a validated flammability boundary.`) rendered as a `role="note"`; exactly the API-returned 14 fixture points plotted (rows counted) with PSI-47, PSI-117, FM2, SoFIE, FLARE and LUCI absent; the excluded-context panel lists all six with reasons; outcome-colour and material-phase-shape legends are present and accessible (`Outcome colours`, `Material phase marker shapes`); the translucent hull is an opt-out checkbox, on by default; H0 mock-fixture notice visible.
  - `buildObservedMapTraces`: scatter traces only (exactly one `lines` trace — the hull, `fill: 'toself'`, closed polygon, labelled with exactly the required disclaimer); hull omitted when toggled off or with fewer than three points; one marker trace per phase·outcome group with symbol/colour matched to phase/outcome; four distinct outcome colours; serialized traces contain no fitted-curve, probability, confidence-interval, risk-tier, or extrapolation token.
  - `convexHull`: encloses observed points, excludes interior points, handles duplicate/collinear inputs without fabricating vertices.
  - Source regression: `observedMap.ts`, `ObservedMapPanel.tsx` and `geometry.ts` contain no statistical-model implementation tokens (logistic, polyfit, trendline, confidence_interval, pvalue, r_squared, lowess, quartile, …), and no `validated flammability boundary` copy outside the exact required disclaimer string.
- The hull trace's Plotly legend label is now exactly `OBSERVED_DOMAIN_DISCLAIMER` (spec §10.2: "The hull label is exactly …"); previously it was `Observed test domain (descriptive)`.

### Verification

- `npm run check` → typecheck, lint (0 warnings), 65/65 tests (was 48), production build.
- `python scripts/check_docs.py` → 0 failures (17 required documents).
- The existing mock-adapter case (`keeps context-only IDs out of measured observations and uses the exact disclaimer`) remains green; together with the new component suite, FM2/LUCI/PSI-47/PSI-117/SoFIE/FLARE are proven absent at both layers.

### Known limits

- Observed points remain H0 representative fixtures; real H1 tables arrive with Person A's table previews. The hull is descriptive only — it is not a validated flammability boundary. jsdom prints harmless `HTMLCanvasElement.getContext` warnings from Plotly; the accessible data table in every chart remains the authoritative fallback.

## 2026-11-14 — Milestone H4: Offline Two-Service Containerization & Hardening (A6 / B9)

### Added

- **A6 (Backend packaging & hardening)**:
  - `backend/Dockerfile`: Minimal production container using `python:3.12-slim`, non-root user `appuser` (UID 10001), healthcheck on `/api/health`, CMD `uvicorn`. Includes all canonical data, generated SQLite/FTS5 database, and text embeddings. Pinned runtime dependencies without torch or transformers.
  - `backend/app/catalog.py`: Added `verify_system_integrity()` and `get_health_response()` checking snapshot presence, SHA-256 digest match, SQLite database presence, and embeddings presence.
- **B9 (Frontend packaging & reverse proxy)**:
  - `frontend/Dockerfile`: Multi-stage production container (`node:22-alpine` builder with `npm ci` and `npm run build` -> `nginx:alpine` runner).
  - `docker/nginx.conf`: Nginx configuration supporting IPv4 (`listen 80;`) and IPv6 (`listen [::]:80;`), gzip compression, static SPA routing, and reverse proxying `/api/` to `http://backend:8000/api/`.
  - `.dockerignore`: Optimized build context ignoring `.venv`, `node_modules`, `frontend/dist`, and raw scratch data.
- **H4 (Offline multi-service orchestration)**:
  - `compose.yaml` & `docker-compose.yml`: Multi-service orchestration mapping backend to port 8000 and frontend to port 3000, with dependency ordering ensuring frontend waits for healthy backend.

### Verified

- Container build and execution: both `firesight-backend` and `firesight-frontend` containers start cleanly and achieve `(healthy)` status.
- Reverse proxy integration: `curl http://localhost:3000/api/health` returns status `ok`, verified snapshot digest (`596f50c6...`), index, and embeddings.
- Endpoints verified through proxy: `/api/health`, `/api/catalog`, `/api/scenarios`, `/api/rank`, `/api/compare`, `/api/observations`, `/api/context`, and `/api/ask` (including rocket/propellant scope guard refusal).
- Test suites: 148 backend pytest tests passed; 49 frontend Vitest tests, typecheck, lint, and build passed (`npm run check`).
- Data and docs integrity: `check_data.py` reports 0 failures (7 source_cited); `check_docs.py` reports 0 failures (17 required documents).

## 2026-11-14 — Person A A3, A4, A5 delivery and H2 handoff package

### Added

- **A3 (Derived index and embeddings)**:
  - `scripts/build_index.py`: generates SQLite database `data/generated/firesight.db` with an FTS5 virtual table (`investigations_fts`) using `porter unicode61` tokenizer over title, objectives, approach, findings, fuel, hardware, and keywords for all 24 canonical records.
  - `scripts/build_embeddings.py`: generates 384-dimensional L2-normalized text embeddings (`data/embeddings.npy`) from `sentence-transformers/all-MiniLM-L6-v2` (model revision `c224e78d5e4b10e9976450a52084712171457f30`, Apache-2.0) with row-order manifest `data/embeddings_manifest.json`.
  - `tests/backend/test_index.py`: validates table structure, FTS5 BM25 search, embeddings normalization, manifest consistency, and asserts runtime code does not import Torch, Transformers, or sentence-transformers.
- **A4 (Similarity and ranking benchmark)**:
  - `tests/backend/test_benchmark_ranking.py`: measures ranking latency across all four canonical scenarios, validating p95 latency = 7.39 ms against the strictly enforced < 500 ms threshold.
- **A5 & H2 (Live API wiring, templates, and retrieval)**:
  - `backend/app/catalog.py`: canonical loader merging `psi_snapshot.json` and `annotations.json` into typed `InvestigationRecord` models and table previews.
  - `backend/app/retrieval.py`: structured filters, SQLite FTS5/BM25 retrieval, vector cosine similarity via NumPy dot products, and Reciprocal Rank Fusion (RRF).
  - `backend/app/justifications.py`: template explanations engine, dimension scoring, false-coverage prevention (BASS-II at 30% O2 never described as covering), gap statements, and rocket/propellant scope guard.
  - `backend/app/observations.py`: measured observation points from ranked-eligible evidence records only; strictly excludes PSI-47, PSI-117, FM2, and LUCI.
  - `backend/app/context.py`: structured context response for incidents, spinoffs, and programs.
  - `backend/app/main.py`: live endpoints wired to canonical data for `/api/health`, `/api/catalog`, `/api/investigations/{id}`, `/api/scenarios`, `/api/rank`, `/api/compare`, `/api/observations`, `/api/context`, and `/api/ask`.

### Verified

- `pytest`: 148 passed in 1.95s.
- `npm run check`: typecheck, lint (0 warnings), 49 Vitest tests passed, production build clean.
- `scripts/check_data.py`: 0 failures (24 records, 22 tables, 7 annotations, 7 source_cited).
- `scripts/check_docs.py`: 0 failures (17 required documents).
- H2 handoff delivered to Person B in `docs/todo/PERSON_A.md`.

## 2026-11-14 — Person B B4 verification pass (key findings in the comparison matrix)

### Added

- `CompareDrawer` now renders a **Key findings** row alongside scores, coverage, and approach: each selected record shows its `key_findings_text`, or the explicit fallback `No key-findings text is available for this record.` when the record carries none. Findings are never fabricated, and the row repeats the non-ranked rule — metadata-only/instrument-context records keep `Not ranked` badges with no scores or coverage values.
- One Vitest case in `frontend/src/features/investigations/CatalogExplorer.test.tsx` (`compares key findings, withholding them when the record has none`) asserting both paths: verified PSI-25 renders the fixture finding; metadata-only PSI-142 renders the withheld fallback.

### Verified

- The catalog-pinned Compare mode (commit `d5d2477`) and the Parallel-coordinates Compare tab both satisfy the B4 checklist: per-row pins capped at four, side-by-side matrix, non-ranked badges instead of numeric scores for metadata-only/instrument-context records, shared/different fuels, phases, themes and hardware via the compare API contract, and Plotly parallel coordinates limited to numeric fields present for every selected record (an axis is dropped entirely when any selection lacks a value).
- `npm run check` → typecheck, lint (0 warnings), 48/48 tests (was 47), production build.
- `python scripts/check_docs.py` → 0 failures (17 required documents).

### Known limits

- Compare mode remains fixture-backed under H1 and unverified against real annotations; no numeric annotation is displayed without provenance. Explicit shared/different measurement grouping beyond the compare API contract (`compare.shared` / `compare.differences`) still needs a Person A contract extension.

## 2026-11-14 — Person B B4 implementation (Compare mode)

### Added

- Catalog-based compare selection in `CatalogExplorer`: a per-row pin checkbox (`Mark <psi_id> for comparison`), capped at four, with an always-visible disabled/enabled `Compare selected (n)` button in the filter bar.
- `CompareDrawer` in `frontend/src/components/investigations/CompareDrawer.tsx`: a side-by-side, provenance-first comparison of 1–4 pinned records fetched through the typed client — titles, acronyms, safety themes, fuel phases, project type, evidence class, physical proximity score, coverage, approach text, and field-level provenance (source URL, value kind, accession link) on every curated numeric value. Missing provenance withholds the value rather than showing it.
- Non-ranked handling: pinned metadata-only and instrument-context records render `Not ranked · <reason>` badges instead of scores/coverage, with a visible `role="note"` disclosure that selections are not all ranked evidence.
- Shared `fieldDefinitions.ts` between the detail view and the comparison view (single source of truth for the curated-field mapping).
- Seven Vitest cases in `frontend/src/features/investigations/CatalogExplorer.test.tsx`: disabled-until-two selection, open/close, pinned-removal, pin limit, non-ranked badge rendering with a ranked co-selection, scores/coverage/approach/provenance content, and pin clearing.

### Changed

- InvestigationsPanel owns compare state and renders `CompareDrawer` below the catalog; the existing Compare tab (curated-record matrix, shared/differences, Plotly parallel coordinates) is unchanged.

### Known limits

- Explicit shared/different measurement grouping beyond the compare API contract (`compare.shared` / `compare.differences`) needs a Person A contract extension — the matrix itself displays measurement ranges field-by-field, but no new backend data group was invented.
- Compare mode is fixture-backed under H0 and unverified under H1; no numeric annotation is displayed without provenance.

## 2026-11-14 — H1 delivery and Scenario A direct gap (T-017) unblocking

### Added

- `test_scenario_a_partial_gravity_direct_gap_t017` in `tests/backend/test_ranking.py`: verifies that Scenario A produces zero direct matches against canonical annotations (`data/annotations.json`) and under physical ranking rules due to partial gravity (0.16 g vs 0.0 g) and unspecified flow velocity (T-017).
- VF-21 in `docs/VERIFIED_FACTS.md` documenting H1 delivery and the verified Scenario A direct gap.

### Changed

- `docs/todo/PERSON_A.md`: marked A2 H1 handoff delivered with 7 curated records maintained as `annotation_status = metadata_only` and `_human_review.status = pending` under Data Safety §9 pending out-of-band human review.
- `docs/todo/PERSON_A.md`: marked T-017 as implemented and passing (29 ranking tests passing).
- `docs/todo/PERSON_A.md`: noted downstream A3 (SQLite/FTS5 search index and MiniLM text embeddings from canonical text metadata) is unblocked.
- Updated Handoff log with H1 delivery date, evidence, and notes.

## 2026-11-14 — A2 annotation proposal and human-review gate

### Added

- `data/annotations.json` with seven AI-extracted record proposals and field-level provenance. All records are `annotation_status = metadata_only`; Data Safety §9 human review is pending.
- `docs/DEEP_RESEARCH_SIGNOFF.md` documenting the extraction sources and per-field proposals; it is explicitly not a human sign-off.
- `docs/ANNOTATION_REVIEW_WORKSHEET.md` with 70 field-level checks, 7 evidence classifications, and 4 scenario rulings for the named human reviewer.
- VF-14 through VF-19 for SAFFIRE-I, SAME-R, FLEX, FLEX-2, CFI-G, and Flame Design table facts; P-017 through P-022.

### Changed

- Scenario B numeric inputs remain unruled; Scenario D numeric inputs are excluded because Apollo 1 is context only (Product Spec §7; T-025).
- `data/raw_csv/` is gitignored local scratch; PSI-10 rows are not redistributed.
- All seven annotations were downgraded from the extraction pass's `verified` status to `metadata_only` pending a named human reviewer.
- `scripts/check_data.py` validates annotation records, the seven-ID set, PSI-10 row exclusion, and the human-review gate.
- `data/snapshot.sha256` now covers both canonical JSON inputs; `scripts/build_snapshot.py` preserves the annotation digest on rebuild.

## 2026-11-14 — Person A A4 pure similarity and ranking

### Added

- `backend/app/ranking.py` with the frozen oxygen/pressure tolerance overlap, gravity and flow exact/bracket rules, phase/theme similarity, coverage-penalty aggregation, and direct/partial/contextual classification.
- `tests/backend/test_ranking.py` with 28 hand-computed tests covering T-011–T-016, T-018–T-020, and T-045.

### Changed

- `docs/todo/PERSON_A.md` records A4's pure-function evidence; T-017 and the p95 target remain blocked on A2 canonical annotations and the Scenario B–D numeric rulings.

## 2026-11-14 — Person B B3 implementation (Investigations, filters, and provenance)

### Added

- `CatalogExplorer` in `frontend/src/components/investigations/CatalogExplorer.tsx`: search over investigation ID, title, acronym, research area, fuel, hardware, theme/evidence labels, plus lazily loaded objectives/approach/findings text for the 24 accessions.
- Seven catalog facets: safety theme, fuel phase, project type, evidence class, data status, annotation status, and catalog role, with an always-visible active-filter count and a one-click reset.
- Sorting by title A–Z/Z–A, physical score/coverage high→low and low→high. Records without a rank result (metadata-only, instrument-context, or not in the active ranking) always sort after ranked records — never interleaved, never shown a fabricated score.
- `InvestigationDetailView` (fetching wrapper + exported `InvestigationDetailContent`): objectives, approach, key findings, source link, table preview (PSI-25 BASS-II fixture), and always-on field-level provenance (source URL, source kind, excerpt/table reference, value kind, note) for every curated numeric value. Missing provenance withholds the value instead of showing it.
- `frontend/src/lib/records.ts` `rankEligibility` helper shared by the catalog table and the detail view for non-ranked rendering.
- Lazy objectives fetch on first keystroke; H0 mock/HTTP behavior unchanged (no contract change).
- `frontend/src/features/investigations/CatalogExplorer.test.tsx` with 23 tests: 24-accession reachability (table + typed client), ID/title/objectives search, all seven facet filters, active-count/reset, six sort orders with ranked-before-non-ranked ordering, visibly non-ranked badges, detail flow, provenance display, safe-text rendering of HTML-looking remote strings.

### Changed

- Investigations tab now renders the catalog table below the scenario workbench; ranked-results list carries `aria-label="Ranked results"` to keep tests deterministic.
- H0 mock adapter gained the PSI-25 experimental-table fixture (representative values only; real previews arrive via H1).
- Existing B1/App tests were re-scoped to the ranked-results region because the catalog table repeats record names.

### Verification

- `npm run check` → typecheck, lint (0 warnings), 41/41 tests, production build.
- H1 artifacts (real snapshot, annotations, table previews) remain Person A's gap; no numeric annotation is displayed unless provenance is present.

## 2026-11-14 — Person A A0/A1 implementation and H0 handoff

### Added

- Frozen Pydantic schema in `backend/app/models.py` with strict models, field-specific units, provenance checks, nested-table linkage, and rank eligibility.
- Versioned API contract in `backend/app/api_models.py`, `backend/openapi.json` (v0.1.0), and 15 representative H0 mock payloads in `backend/mocks/`.
- H0 FastAPI mock surface in `backend/app/main.py` for all nine specified endpoints.
- Schema, contract, API, and snapshot tests under `tests/backend/`.
- Deterministic `scripts/build_snapshot.py`, the canonical `data/psi_snapshot.json`, and `data/snapshot.sha256`.
- Offline `scripts/check_data.py` validator for membership, licenses, stable URLs, and digest.
- Shared corpus constants in `backend/app/corpus.py`.

### Changed

- `docs/VERIFIED_FACTS.md` now records the generated snapshot digest and manifest.
- `scripts/check_docs.py` validates a real 64-hex snapshot digest instead of the placeholder text.
- PSI-10 is retained with `license.status = unknown` and `redistribution = blocked`; table rows for it must not be redistributed (Decision D-016, Problem P-016).

### Evidence

- `.venv/bin/python -m pytest -q` → 91 passed.
- `.venv/bin/python scripts/check_data.py` → `Data check: 0 failures (24 records, 22 tables)`.
- Two consecutive snapshot builds were byte-identical with SHA-256 `596f50c614478bdc08a578fbde6ac6f27d87a30acfb9220e6d401b6e99be146a`.
- `.venv/bin/python scripts/check_docs.py` → 0 failures.

## 2026-11-14 — Documentation baseline and implementation handoff

### Added

- Software-specific product, decision, problem, changelog, technology, data-safety, verification, evidence, scratchpad, and team-execution documents.
- Five accepted ADRs covering canonical data, derived search index, deterministic ranking, optional local LLM, and rejection of fitted flammability models.
- Separate Person A and Person B TODO lists with ownership, dependencies, gates, and handoff packages.
- `scripts/check_docs.py` to validate the documentation contract.

### Changed

- Froze the `Range` schema and reversed-bound validation.
- Froze oxygen, pressure, gravity, flow, phase, and theme similarity rules.
- Froze missing-field handling: fixed weights normalized over scenario-requested dimensions and a coverage^0.5 penalty.
- Removed `anticipated` from `evidence_class`; `data_status` is authoritative for anticipated programs.
- Changed the initial deep-annotation scope from six to seven records by curating FLEX and FLEX-2 and retaining PSI-117 as context.
- Corrected the corpus decision: PSI-47 remains one of the exact 24 live records but is non-ranked instrument context and is excluded from measured plots.
- Defined how unspecified scenario dimensions are excluded from the requested score set while missing record fields still receive no weight redistribution.
- Split non-measured programs into the table-free `ProgramContext` model with `active_program` and `anticipated_in_psi` statuses.
- Enabled strict Pydantic validation, field-specific unit checks, unconditional field provenance, parent-child table ID checks, and explicit gravity/flow presence rules.

### Evidence corrections

- BASS-II initial O₂ is 13.6–22.2%; anomalous final values are separate.
- CFI-G reaches 0.85 mole-fraction O₂; Flame Design reaches 0.849977932.
- SLICE is gas-phase diffusion-flame evidence.
- SAME-R (PSI-101) and SAFFIRE-I (PSI-98) are valid live records.
- FLEX (PSI-69) and FLEX-2 (PSI-68) are valid live records with tables.
- PSI-117 has no experimental table.
- FM2, SoFIE, and FLARE are program context, not records in the exact 24-record corpus.

### Removed

- Logistic-regression flammability model and bootstrap confidence intervals.
- Runtime Torch/MiniLM requirement.
- Hosted LLM default and invalid model reference.
- PostgreSQL, pgvector, and a third runtime service.
- DAFT as a ranked fire-safety candidate.

## Earlier conceptual milestones

- 2026-11-14 — FireSight UX/taxonomy merged with the evidence-corrected whitepaper.
- 2026-11-14 — Evidence ledger and corrected corpus count established.
- 2026-11-14 — Lean two-service Docker architecture approved.
- 2026-11-14 — Deterministic weighted ranking and coverage penalty approved.
