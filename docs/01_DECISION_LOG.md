# Decision Log

Contested product and engineering rulings live here. Detailed rationale is in the linked ADRs; verified data claims live in [Verified Facts](VERIFIED_FACTS.md).

| ID | Date | Decision | Status | Basis | Constrains |
|---|---|---|---|---|---|
| D-001 | 2026-11-14 | Use versioned JSON as canonical evidence and SQLite/FTS5 as a derived index | Accepted | Small corpus, reproducibility, simple deployment | [ADR-0001](adr/0001-use-versioned-json-as-canonical-data.md) |
| D-002 | 2026-11-14 | Use SQLite FTS5/BM25 for runtime text retrieval and precomputed MiniLM/NumPy for record similarity | Accepted | No runtime Torch; 24 records do not justify a vector database | [ADR-0002](adr/0002-use-sqlite-fts5-as-derived-index.md) |
| D-003 | 2026-11-14 | Rank deterministically with fixed weights over scenario-requested dimensions and a coverage penalty exponent of 0.5; never redistribute missing record weights | Accepted | Explainability and penalty for incomplete evidence | [ADR-0003](adr/0003-use-deterministic-ranking-with-coverage-penalty.md) |
| D-004 | 2026-11-14 | Keep template/retrieval explanations primary; local Phi-3 optional and `USE_LLM=false` by default | Accepted | Offline reliability and citation-accuracy gates | [ADR-0004](adr/0004-keep-generative-llm-optional-and-off-by-default.md) |
| D-005 | 2026-11-14 | Reject fitted flammability models, probabilities, confidence intervals, and extrapolated boundaries | Accepted | Heterogeneous corpus and tiny per-material sample size | [ADR-0005](adr/0005-reject-fitted-flammability-model.md) |
| D-006 | 2026-11-14 | Preserve the exact live 24-record corpus; retain PSI-47 as non-ranked `instrument_context` | Accepted | VF-01 and VF-03: removing PSI-47 would incorrectly yield 23 | [Product Spec §3](00_PRODUCT_SPEC.md#3-evidence-corpus-and-status-model) |
| D-007 | 2026-11-14 | Curate seven physical records: CFI-G, Flame Design, SAME-R, SAFFIRE-I, BASS-II, FLEX, FLEX-2 | Accepted | Makes Scenario C coherent while preserving the other canonical scenarios | [Product Spec §3.2](00_PRODUCT_SPEC.md#32-curated-records) |
| D-008 | 2026-11-14 | Treat PSI-117 as non-measured FLEX-derived modeling context | Accepted | VF-10: no experimental table | [Problem Log P-008](02_PROBLEM_LOG.md) |
| D-009 | 2026-11-14 | Remove `anticipated` from `evidence_class`; represent program-only state with the separate `ProgramContext` model and `data_status` (human-review dependency superseded by D-017) | Accepted | One field, one meaning; program context has no evidence class or measured table | [Product Spec §4](00_PRODUCT_SPEC.md#4-frozen-data-contract) |
| D-010 | 2026-11-14 | Freeze `Range` with `min`, `max`, `unit`, and optional `notes`; reject reversed bounds | Accepted | Removes undefined schema and silent defaults | [Product Spec §4.1](00_PRODUCT_SPEC.md#41-pydantic-models) |
| D-011 | 2026-11-14 | Freeze gravity as exact/bracket/disjoint scoring over explicit recorded levels | Accepted | Makes “no direct partial-gravity evidence” behavioral | [Product Spec §6.3](00_PRODUCT_SPEC.md#63-similarity-functions) |
| D-012 | 2026-11-14 | Keep Apollo 1, Mir, Apollo 13, and Spinoff outside numerical scoring | Accepted | Context must not become hidden numerical evidence | [Verified Facts VF-12/VF-13](VERIFIED_FACTS.md) |
| D-013 | 2026-11-14 | Store FM2/SoFIE/FLARE in the separate `ProgramContext` model outside the measured catalog; never plot them as measured | Accepted | VF-11 | [Product Spec §3](00_PRODUCT_SPEC.md#3-evidence-corpus-and-status-model) |
| D-014 | 2026-11-14 | Use two Docker services: FastAPI backend and nginx-served React frontend | Accepted | Clear runtime boundary and local reproducibility | [Product Spec §11](00_PRODUCT_SPEC.md#11-runtime-and-deployment) |
| D-015 | 2026-11-14 | Exclude unspecified scenario dimensions from the requested set; retain the no-redistribution rule for missing record fields; require all six inputs for `direct_match` | Accepted | Makes partial scenario fixtures deterministic without inventing values | [Product Spec §6.2](00_PRODUCT_SPEC.md#62-ranking-formula) |
| D-016 | 2026-11-14 | Keep PSI-10 in the exact 24-record corpus with `license.status = unknown` and `redistribution = blocked` | Accepted | PSI-10 exposes no license metadata; Data Safety §7 forbids assuming public domain, while VF-01 forbids dropping the record | A2 table ingestion; PSI-10 remains metadata/narrative context |
| D-017 | 2026-11-14 | Annotation status is `source_cited` when provenance is attached. No human-review gate exists. Auditable via source URL + excerpt/table reference | Accepted | Replaces blocked human review gate with auditable provenance-first model | [Data Safety §9](05_DATA_SAFETY.md#9-annotation-extraction-and-provenance) |

## Deferred, not rejected

- Runtime dense free-text retrieval may be added later with a pinned ONNX MiniLM encoder and a separate gate.
- Additional records may be curated after the seven-record baseline passes all gates.
- Optional local Phi-3 may be enabled only after the citation and latency gates pass.
- Runtime ONNX query encoding is not implied by the committed MiniLM record-similarity array.

## Open evidence items

| Item | Owner | Blocking point | Required resolution |
|---|---|---|---|
| Scenario A numeric flow | Person A | Scenario A fixture | Cite a value or keep the condition explicitly missing; do not interpolate |
| Scenario B–D numeric physical inputs | Person A | Fixtures B–D | Record a source-backed ruling per field |
| Snapshot SHA-256 | Person A | Data gate | Generate `data/snapshot.sha256` and update VF ledger |
| LUCI official program source | Person A | Anticipated-context card | Verify an official NASA URL or omit the card |
