# ADR-0001: Use versioned JSON as canonical data

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** FireSight implementation team

## Context

The corpus contains 24 PSI investigations, public experimental tables, and human annotations. The application needs reproducible builds, inspectable evidence, and a simple offline runtime. A mutable database alone would hide editorial changes and make it difficult to review numeric claims.

## Options considered

1. Git-tracked JSON as canonical data with a generated SQLite index.
2. PostgreSQL as the primary system of record.
3. SQLite as the primary and only store.
4. Live PSI API calls at runtime.

## Decision

Use option 1. Canonical JSON and annotations are hashed and git-tracked. SQLite/FTS5 and embeddings are reproducible derived artifacts. Runtime reads the local snapshot and does not depend on live PSI availability.

## Consequences

- Positive: evidence changes are reviewable; offline demo works; no database service is required.
- Positive: schema validation and provenance checks can run before serving data.
- Negative: the build includes a snapshot/index refresh step.
- Negative: large raw tables would increase repository size; only the seven curated records and required table previews are included initially.
- Follow-up: if corpus size grows materially, revisit storage packaging without changing the canonical-JSON principle.

## Links

- [Product Spec §3](../00_PRODUCT_SPEC.md#3-evidence-corpus-and-status-model)
- [Data Safety](../05_DATA_SAFETY.md)
- [Verified Facts](../VERIFIED_FACTS.md)
