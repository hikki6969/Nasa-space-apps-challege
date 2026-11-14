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
- No curated annotations, embeddings, derived database, containers, or frontend exist yet.

## Next actions

1. **Person A:** complete A2 — ingest the seven curated records, field-level provenance, and H1.
2. **Person B:** scaffold the frontend against the H0 mock contract and publish H0 review notes.
3. **Joint:** review H0 before real-data integration.
4. **Person A:** then build A3 derived index/embeddings and A4 scoring.
5. **Person B:** integrate H1 catalog/detail fixtures.

## Open items and owners

| Item | Owner | Blocking |
|---|---|---|
| Scenario A numeric flow | A + reviewer | Scenario A fixture; otherwise remain explicitly missing |
| Scenarios B–D numeric physical inputs | A + reviewer | Fixtures B–D |
| Canonical snapshot SHA-256 | A | Resolved 2026-11-14: `596f50c6…`; annotation digest joins in A2 |
| Exact MiniLM revision/hash and license | A | Embedding build |
| Official LUCI source | A | Optional LUCI context card only |
| Frontend test/browser tool | B | Frontend test gate |
| Optional Phi-3 artifact hash/license | A | Optional Phase 4 only |

## Rules that must not drift

- Never call BASS-II 30% O₂ evidence.
- Never plot PSI-47/DAFT, PSI-117, FM2, LUCI, any `ProgramContext` entry (`active_program` or `anticipated_in_psi`), or `metadata_only` records as measured observations.
- Never fit or imply a flammability boundary.
- Never redistribute missing weights.
- Never let historical incidents or Spinoff cases enter numerical scoring.
- Never let PSI-47/DAFT enter physical ranking, default retrieval results, observation endpoints, or measured plots.
- Never add a hosted LLM or API key to the committed path.
- Never claim a direct match without all six exact conditions.

## Useful commands

```bash
python scripts/check_docs.py
python scripts/check_data.py
python scripts/build_snapshot.py
python scripts/export_contract.py
python -m pytest -q
# frontend commands are added with the scaffold
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
- Tests: 91 passed; data check: 0 failures; docs check: 0 failures.
