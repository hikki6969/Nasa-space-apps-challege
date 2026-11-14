# Person A TODO — Evidence & Backend

**Owner boundary:** `backend/**`, `data/**`, canonical build/validation scripts, backend tests, and the verified-facts ledger.

**Start here:** [Product Spec §4](../00_PRODUCT_SPEC.md#4-frozen-data-contract), [Verified Facts](../VERIFIED_FACTS.md), and [Verification Plan](../06_VERIFICATION_PLAN.md).

## A0. Schema and contract freeze

- [x] Create `backend/app/models.py` with the frozen Pydantic models.
- [x] Enable strict Pydantic configuration and `extra = forbid`; reject string-to-number coercion.
- [x] Implement `Range` bounds validation and expected-unit validation.
- [x] Implement status/catalog-role/provenance validators.
- [x] Add tests for reversed bounds, missing provenance on any populated physical field including metadata-only records, nested table ID mismatch, anticipated status, and metadata-only ranking exclusion.
- [x] Export a versioned OpenAPI document and representative mock responses.
- [x] Provide H0 to Person B: schema, OpenAPI, and mock payloads.

**Done when:** targeted schema tests pass; Person B can type its client without asking for an undocumented field.

**Evidence (2026-11-14):** `backend/app/models.py`, `backend/app/api_models.py`, `backend/openapi.json` (v0.1.0), `backend/mocks/*.json` (15 payloads), and `tests/backend/test_models.py`, `tests/backend/test_contract.py`, `tests/backend/test_api.py`. `python -m pytest -q` passes 91 tests. Regenerate the contract with `python scripts/export_contract.py`.

**Dependencies:** none.

## A1. Canonical snapshot builder

- [x] Implement `scripts/build_snapshot.py` against PSI JSON/detail endpoints.
- [x] Select records using the exact VF-01 research-area filter and assert the exact 24-ID set.
- [x] Assert PSI-181 and PSI-108 are absent.
- [x] Preserve PSI-47 with `catalog_role = instrument_context`.
- [x] Store stable detail/table URLs, file names, versions, S3 version IDs, DOI, license, and source metadata.
- [x] Reject duplicate IDs, unruled missing licenses, partial downloads, and unexpected counts.
- [x] Generate `data/snapshot.sha256` and update the `Snapshot SHA-256` field under Verification metadata.

**Done when:** two clean builds produce byte-identical canonical JSON and the same digest.

**Evidence (2026-11-14):** `scripts/build_snapshot.py`, `data/psi_snapshot.json` (24 records, 22 tables), `data/snapshot.sha256` (`596f50c6…`), and `scripts/check_data.py` (`Data check: 0 failures`). Two consecutive clean builds produced byte-identical JSON and the same digest. PSI-10 is the only missing-license record; Decision D-016 records it as `unknown` with redistribution blocked, and `scripts/check_data.py` enforces that ruling.

**Dependencies:** A0.

## A2. Experimental tables and annotations

- [x] Ingest visible public tables without committing signed URLs.
- [x] Curate PSI-159, PSI-10, PSI-101, PSI-98, PSI-25, PSI-69, and PSI-68.
- [x] Add field-level provenance for every curated numeric value and observed-level list.
- [x] Verify BASS-II initial O₂ as 0.136–0.222 and preserve final outliers separately.
- [x] Verify CFI-G and Flame Design high-O₂ values against their exact columns.
- [x] Classify SAFFIRE-I as large-scale demonstration, not bench flammability.
- [x] Classify SAME-R as detection instrumentation.
- [x] Classify FLEX/FLEX-2 as droplet/suppression evidence.
- [x] Keep PSI-117 metadata-only/contextual and confirm it has no measured table.
- [x] Record any annotation disagreement as a Problem Log entry; do not average conflicting values.
- [x] Replace human-review gate with provenance-first model (D-017, P-024); set `annotation_status = source_cited` with field-level provenance.
- [x] Archived worksheet: [`docs/archive/ANNOTATION_WORKSHEET_SUPERSEDED.md`](../archive/ANNOTATION_WORKSHEET_SUPERSEDED.md) — retained for provenance audit reference.
- [x] Provide H1 to Person B: exact snapshot fixture, seven annotations, and table previews with the validation command output (delivered with records promoted to `source_cited` with provenance).

**Status (2026-11-14):** H1 delivery completed — 7 records curated with complete provenance in `data/annotations.json`, promoted to `annotation_status = source_cited` under Data Safety §9 (D-017, P-024). Scenario A flow remains null (P-017), Scenario B numeric inputs remain unruled, and Scenario D numeric inputs are excluded (T-025). Raw CSVs are gitignored local scratch; PSI-10 rows are not redistributed. Downstream A3 (derived index/embeddings) is unblocked for textual corpus metadata.

**Done when:** the data acceptance gate in the Verification Plan passes.

**Dependencies:** A1.

## A3. Derived index and embeddings

- [ ] Implement `scripts/build_index.py` to generate SQLite/FTS5 from canonical JSON.
- [ ] Add deterministic FTS content and indexes for title, objectives, approach, findings, fuel, hardware, and keywords.
- [ ] Pin `all-MiniLM-L6-v2` revision/hash and record its license.
- [ ] Implement `scripts/build_embeddings.py` at build/refresh time only.
- [ ] Store `embeddings.npy`, row order manifest, model hash, and generator command.
- [ ] Prove runtime code does not import Torch or sentence-transformers.

**Done when:** the index and embeddings rebuild deterministically from canonical inputs; the backend starts without the embedding model installed.

**Dependencies:** A1, A2.

## A4. Similarity and ranking

- [x] Implement the frozen oxygen and pressure tolerance-overlap formulas.
- [x] Implement exact/bracket/disjoint gravity scoring over explicit recorded levels.
- [x] Implement flow exact/bracket/tolerance/disjoint scoring.
- [x] Implement phase and primary/secondary theme similarity.
- [x] Implement fixed-weight scoring with coverage^0.5 and no redistribution.
- [x] Implement direct/partial/contextual/anticipated match classification.
- [x] Add hand-computed unit tests from the Verification Plan.
- [ ] Measure ranking p95 over the four canonical scenarios.

**Done when:** T-011 through T-020 and the performance target pass.

**Evidence (2026-11-14):** `backend/app/ranking.py` and `tests/backend/test_ranking.py` cover T-011 through T-016, T-017 (Scenario A partial-gravity direct gap verified passing against canonical annotations and ranking rules with zero direct matches), T-018 through T-020, and T-045 (29 tests passing). The p95 target remains pending live scenario benchmark suite.

**Dependencies:** A0 for the pure functions; A2 for canonical scenario scoring and p95 (A2 H1 delivered).

## A5. Templates, retrieval, and API

- [ ] Implement structured filters and FTS5/BM25 candidate retrieval.
- [ ] Implement Reciprocal Rank Fusion only where both candidate lists exist.
- [ ] Implement template justifications with matched values, sources, limitations, and gap statement.
- [ ] Implement the forbidden false-coverage check, including BASS-II at 30% O₂.
- [ ] Implement bounded Q&A over retrieval results and the rocket/propellant scope guard.
- [ ] Implement the measured-observation endpoint with anticipated, program-context, modeling, metadata-only, and instrument-context records excluded.
- [ ] Implement `/health`, `/catalog`, `/investigations/{id}`, `/scenarios`, `/rank`, `/compare`, `/observations`, `/context`, and `/ask`.
- [ ] Provide H2 to Person B with passing targeted API tests.

**Done when:** all four scenario invariants and citation/numeric checks pass.

**Dependencies:** A2, A3, A4.

## A6. Backend packaging and hardening

- [ ] Add the backend Dockerfile with pinned dependencies.
- [ ] Add clear errors for missing snapshot, hash mismatch, missing table, and invalid scenario.
- [ ] Ensure the default image has no Phi-3 or runtime model download.
- [ ] Implement the optional local-model profile only if A7 gates are likely to pass.
- [ ] Add `/health` details sufficient to diagnose missing derived artifacts.

**Done when:** the backend container starts from a clean build and serves the fixture API offline.

**Dependencies:** A5.

## A7. Optional local Phi-3

- [ ] Confirm a hash-pinned local Phi-3 artifact and license.
- [ ] Supply structured canonical record context only.
- [ ] Validate exact numerics, valid PSI citations, no unsupported claims, and p95 below 3 s.
- [ ] Keep `USE_LLM=false` if any gate fails.

**Done when:** all optional gates pass, or the feature is explicitly left disabled with evidence.

**Dependencies:** A5, A6.

## A8. Backend release evidence

- [ ] Run targeted tests, then the full backend suite.
- [ ] Run the data validator and hash check.
- [ ] Measure ranking latency.
- [ ] Rehearse the API with networking disabled after the image is built.
- [ ] Update [Verified Facts](../VERIFIED_FACTS.md), [Decision Log](../01_DECISION_LOG.md), [Problem Log](../02_PROBLEM_LOG.md), and [Changelog](../03_CHANGELOG.md).

**Done when:** H4 backend evidence is current after the final mutation.

**Dependencies:** A6; A7 only if enabled.

## Blockers and rulings needed

- [ ] **Rule:** numeric flow value for Scenario A; otherwise keep it explicitly missing.
- [ ] **Rule:** source-backed numeric physical inputs for Scenarios B–D.
- [ ] **Rule:** exact optional Phi-3 model artifact, if Phase 4 is attempted.
- [ ] **Verify:** official NASA LUCI source URL before adding a LUCI card.

## Handoff log

| Date | Handoff | Recipient | Evidence | Notes |
|---|---|---|---|---|
| 2026-11-14 | H0 schema/OpenAPI/mock | Person B | `backend/app/models.py`, `backend/openapi.json`, `backend/mocks/`, 91 tests passing | Mock only; canonical data begins with H1 |
| 2026-11-14 | H1 snapshot/annotations | Person B | `data/psi_snapshot.json`, `data/annotations.json` (7 curated records, 51 provenance items), `data/snapshot.sha256`, `tests/backend/test_ranking.py` (T-017 passed), `scripts/check_data.py` (0 failures) | Delivered with 7 records as `annotation_status = source_cited` under Data Safety §9 (D-017); downstream A3 unblocked for text indexing and embeddings |
| — | H2 API/search/ranking | Person B | — | — |
| — | H3 defect reports | Person A from Person B | — | — |
