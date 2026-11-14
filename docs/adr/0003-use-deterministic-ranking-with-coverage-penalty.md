# ADR-0003: Use deterministic ranking with a coverage penalty

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** FireSight implementation team

## Context

FireSight must rank investigations by physical and taxonomic similarity while showing evidence gaps. Missing fields must not improve a score. A score must be explainable and reproducible across local runs.

## Options considered

1. Weighted average over only present fields.
2. Weighted average over all fields plus a coverage penalty.
3. Fitted flammability/regression model.
4. Large-language-model ranking or explanation without a deterministic base.

## Decision

Use option 2. Fixed weights are O₂ 0.30, pressure 0.20, gravity 0.20, flow 0.10, phase 0.10, and theme 0.10. Score only dimensions explicitly requested by the scenario. Missing record dimensions inside that requested set contribute zero without redistribution. Multiply the weighted mean by coverage^0.5 over the requested set. A direct match requires all six dimensions. Match classification is separate from numeric proximity.

## Consequences

- Positive: incomplete evidence is visibly penalized.
- Positive: every contribution and coverage value can be displayed and tested.
- Positive: ranking does not change with model availability or network state.
- Negative: incomplete records can rank below broader records even when one condition matches strongly.
- Negative: fixed weights encode a product decision and require explicit revision to change.
- Follow-up: weights may be changed only through the Decision Log and updated tests.

## Links

- [Product Spec §6](../00_PRODUCT_SPEC.md#6-retrieval)
- [Problem Log P-011](../02_PROBLEM_LOG.md)
- [Verification Plan](../06_VERIFICATION_PLAN.md)
