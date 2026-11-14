# ADR-0002: Use SQLite FTS5 as the derived search index

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** FireSight implementation team

## Context

The application needs full-text investigation search, record comparison, and a small semantic-similarity layer. The corpus has 24 records. The runtime must stay lightweight and offline, with no runtime Torch and no additional service.

## Options considered

1. SQLite FTS5 plus precomputed MiniLM embeddings and NumPy cosine.
2. PostgreSQL plus pgvector.
3. Runtime sentence-transformers inference.
4. A hosted vector/search API.

## Decision

Use option 1. Generate SQLite/FTS5 from canonical JSON. Generate MiniLM embeddings at build/refresh time and commit or reproducibly build `embeddings.npy`. Runtime performs NumPy cosine for record-to-record similarity. Free-text queries use FTS5/BM25.

## Consequences

- Positive: one local backend process; no vector database or model server.
- Positive: ranking remains fast and deterministic for the corpus size.
- Positive: runtime does not load PyTorch or an embedding model.
- Negative: arbitrary free-text queries do not use dense semantic encoding.
- Negative: embedding order and model hash must be tracked with the array.
- Follow-up: runtime dense query encoding may be proposed with pinned ONNX MiniLM after a separate accuracy/latency gate.

## Links

- [Decision D-002](../01_DECISION_LOG.md)
- [Technology Stack](../04_TECH_STACK.md)
- [Verification Plan](../06_VERIFICATION_PLAN.md)
