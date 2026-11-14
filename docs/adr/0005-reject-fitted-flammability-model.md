# ADR-0005: Reject a fitted flammability model

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** FireSight implementation team

## Context

The corpus has 24 heterogeneous investigations and only a small number with comparable tabulated points. Material classes, fuels, hardware, pressure, oxygen, flow, and gravity vary. A regression curve and bootstrap confidence intervals would look precise without validated predictive meaning.

## Options considered

1. Logistic regression by material class with bootstrap confidence intervals.
2. Observed source points with an optional observed-domain hull.
3. No visualization of experimental points.
4. A larger separately validated dataset/model.

## Decision

Use option 2. Plot source observations only. A translucent hull may describe the observed test domain and must carry the exact label “Observed test domain; not a validated flammability boundary.” Reject fitted curves, probabilities, confidence intervals, extrapolation, and implied risk tiers.

## Consequences

- Positive: the visualization remains defensible for a combustion-science audience.
- Positive: every plotted coordinate can be traced to a source table row.
- Negative: the map does not estimate flammability at a new condition.
- Negative: sparse groups require careful visual encoding and accessibility.
- Follow-up: a fitted model would require a separately approved, representative dataset and validation protocol.

## Links

- [Problem Log P-006](../02_PROBLEM_LOG.md)
- [Product Spec §10.2](../00_PRODUCT_SPEC.md#102-observed-map-constraints)
- [Verification Plan](../06_VERIFICATION_PLAN.md)
