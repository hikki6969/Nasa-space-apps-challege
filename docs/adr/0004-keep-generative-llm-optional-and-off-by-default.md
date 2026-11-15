# ADR-0004: Keep generative AI optional and off by default

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** FireSight implementation team

## Context

The demo must work offline without API keys or rate limits. Explanations must preserve citations and numeric fidelity. Deterministic extraction plus field-level provenance prevents unsupported numeric values from entering the canonical catalog; no human-reviewer attestation is claimed (Decision D-017, Data Safety §9).

## Options considered

1. Template/retrieval explanations only.
2. Default hosted LLM with template fallback.
3. Default local Phi-3.
4. Optional local Phi-3 behind a disabled-by-default flag.

## Decision

Use options 1 and 4. The committed path is template/retrieval primary with `USE_LLM=false`. An optional local Phi-3 profile may be enabled only after exact-numeric, citation, unsupported-claim, and p95 latency gates pass. No hosted model client is permitted.

## Consequences

- Positive: offline behavior is deterministic and always available.
- Positive: optional generation cannot alter canonical annotations or ranking.
- Negative: template explanations have less linguistic variety.
- Negative: maintaining a local model profile adds optional packaging work.
- Follow-up: if any optional gate fails, keep the model disabled and document the failed gate.

## Links

- [Decision D-004](../01_DECISION_LOG.md)
- [Product Spec §8](../00_PRODUCT_SPEC.md#8-justification-engine)
- [Data Safety](../05_DATA_SAFETY.md)
