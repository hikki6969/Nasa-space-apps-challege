# Changelog

All notable changes to the specification and implementation baseline are recorded here.

## 2026-11-14 — A2 annotation proposal and human-review gate

### Added

- `data/annotations.json` with seven AI-extracted record proposals and field-level provenance. All records are `annotation_status = metadata_only`; Data Safety §9 human review is pending.
- `docs/DEEP_RESEARCH_SIGNOFF.md` documenting the extraction sources and per-field proposals; it is explicitly not a human sign-off.
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
