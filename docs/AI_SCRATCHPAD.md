# AI Scratchpad

Keep this file short enough to reread at the start of every implementation session.

## Current state — 2026-11-14

- Product specification and evidence ledger are written.
- Live PSI checks confirm the exact 24-record corpus, SAME-R, SAFFIRE-I, FLEX, FLEX-2, BASS-II oxygen values, high-O₂ values, SLICE phase, and PSI-117's lack of a table.
- PSI-47 is a current member of the exact 24-record filter but is non-ranked instrument context.
- Seven records are the initial deep-annotation set.
- Schema, strict units, dimensional similarities, requested-dimension scoring, match classification, status semantics, and verification assertions are frozen in [Product Spec](00_PRODUCT_SPEC.md).
- Two-person ownership and handoffs are in [Team Execution Plan](07_TEAM_EXECUTION_PLAN.md).
- The final documentation-audit findings are closed: unconditional provenance enforcement, parent-child table linkage, requested-dimension scoring wording, and the exclusion rules.
- A0 is implemented: frozen schema, H0 mock API, versioned OpenAPI, and 15 mock payloads; 91 backend tests pass.
- A1 is implemented: deterministic 24-record snapshot, 22 verified table downloads, and `data/snapshot.sha256` (`596f50c6…`).
- A4 pure scoring is implemented: frozen similarity functions, coverage-penalty aggregation, and match classification in `backend/app/ranking.py`; 28 hand-computed tests pass.
- Frontend B0–B2 is merged and `frontend/src/lib/` is tracked; `npm run check` passes.
- A2 proposal exists: `data/annotations.json` has seven AI-extracted records with field-level provenance, all `annotation_status = metadata_only`. No human has confirmed them.
- Scenario A flow remains null (P-017); Scenario B numeric inputs are unruled; Scenario D numeric inputs are excluded (T-025).
- Raw CSVs live in gitignored `data/raw_csv/`; PSI-10 rows are not redistributed.
- No embeddings, derived database, or containers yet.

## Next actions

1. **Human reviewer:** complete [`ANNOTATION_REVIEW_WORKSHEET.md`](ANNOTATION_REVIEW_WORKSHEET.md) (70 fields, 7 classifications, 4 scenario rulings); then Person A may set `annotation_status = verified`.
2. **Person A:** after review, run T-017 and the p95 ranking target against canonical records; then build A3 derived index/embeddings.
3. **Person A:** cite a primary source for Scenario B or leave its numeric inputs null.
4. **Person B:** integrate H1 catalog/detail fixtures once A2 publishes them.
5. **Joint:** keep H0-only frontend behavior until H1 exists.

## Open items and owners

| Item | Owner | Blocking |
|---|---|---|
| Named human annotation reviewer | User/team | A2 verified status for all seven records |
| Scenario A numeric flow | A + reviewer | Scenario A fixture; otherwise remain explicitly missing |
| Scenario B numeric inputs | A + reviewer | Fixture B; otherwise remain explicitly missing |
| Scenario D numeric inputs | — | Excluded by spec §7 and T-025; Apollo 1 is context only |
| Canonical snapshot SHA-256 | A | Resolved 2026-11-14: `596f50c6…`; annotation digest joins in A2 |
| Exact MiniLM revision/hash and license | A | Embedding build |
| Official LUCI source | A | Optional LUCI context card only |
| Frontend test/browser tool | B | Frontend test gate |
| Optional Phi-3 artifact hash/license | A | Optional Phase 4 only |

## Rules that must not drift

- Never call BASS-II 30% O₂ evidence.
- Never mark an AI-extracted annotation `verified`; a named human reviewer must confirm it first.
- Never plot PSI-47/DAFT, PSI-117, FM2, LUCI, any `ProgramContext` entry (`active_program` or `anticipated_in_psi`), or `metadata_only` records as measured observations.
- Never fit or imply a flammability boundary.
- Never redistribute missing weights.
- Never let historical incidents or Spinoff cases enter numerical scoring.
- Never let PSI-47/DAFT enter physical ranking, default retrieval results, observation endpoints, or measured plots.
- Never let modeling records enter physical ranking; they are contextual only.
- Never add a hosted LLM or API key to the committed path.
- Never claim a direct match without all six exact conditions.

## Useful commands

```bash
python scripts/check_docs.py
python scripts/check_data.py
python scripts/build_snapshot.py
python scripts/export_contract.py
python -m pytest -q
cd frontend && npm run check
docker compose up --build
```

## Last evidence observed

- PSI search total: 24.
- PSI-101: SAME-R, one visible table.
- PSI-98: SAFFIRE-I, one visible table.
- PSI-47: DAFT/DAFT-2, one visible table, exact-filter member.
- PSI-69: FLEX, one visible table.
- PSI-68: FLEX-2, one visible table.
- PSI-25 table: 129 rows; initial O₂ 13.6–22.2%; final outliers 0.6, 0.9, 39.1, 40.4%.
- PSI-159 inverse table: max `XO2 = 0.85`.
- PSI-10 inverse table: max `XO2 = 0.849977932`.
- PSI-117: no experimental table.
- Snapshot: 24 records, 22 verified tables, SHA-256 `596f50c6…`; two builds byte-identical.
- Annotations: 7 AI-extracted records, 0 verified, all `metadata_only`; human review pending.
- Tests: 120 passed; data check: 0 failures; docs check: 0 failures.
- Frontend: typecheck, lint, 18 tests, and production build pass.
