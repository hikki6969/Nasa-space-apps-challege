# Changelog

All notable changes to the specification and implementation baseline are recorded here.

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
