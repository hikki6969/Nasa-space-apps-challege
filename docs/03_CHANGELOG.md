# Changelog

All notable changes to the specification and implementation baseline are recorded here.

## 2026-11-14 — B2 overview

### Added

- Overview count tiles for catalog total, completed, curated, metadata-only, instrument-context, and anticipated records, with a note that these status axes overlap and that anticipated FM2 is outside the measured catalog.
- A corpus-boundary panel that counts PSI evidence separately from historical incidents, NASA Spinoff applications, program context, and anticipated program status.
- Active-scenario selection (A–D) in the Overview, with each scenario's gap statement, top completed evidence, per-result coverage, and derived coverage warnings for missing requested dimensions.
- `OverviewPanel.test.tsx` coverage for fixture counts, evidence-class/theme/hardware/data-status distributions, separated context counts, active-scenario switching, and coverage warnings.

### Changed

- Overview distributions now use the same fixture-backed counts as the API, and instrumentation context is excluded from the ranked-evidence candidate count.
- B2 checkboxes marked complete in `docs/todo/PERSON_B.md` after `npm run check` passed (typecheck, lint, 18 tests, production build).

## 2026-11-14 — B1 scenario controls and results

### Added

- Editable Investigations scenario controls for oxygen, pressure, gravity, flow, material phase, and safety theme, with A–D canonical presets, per-field clear actions, range validation, and a draft requested-set `Q(S)` preview.
- Explicit unspecified handling: blank numeric fields and “Not specified” selects remain `null` and are excluded from the draft requested set instead of defaulting to zero.
- Ranked-result cards with score, coverage, match class, evidence class, always-visible six-slot dimension breakdown, limitations, justification, and provenance pointers.
- Dimension-status legend that distinguishes not requested, missing (no record value), zero similarity (record value exists), partial, and match states.
- `InvestigationsPanel.test.tsx` coverage for all four canonical scenarios, explicit unspecified inputs, missing-versus-zero rendering, and out-of-range validation.

### Changed

- Submitting or loading a preset now re-ranks immediately; draft edits show a dirty-state badge and preserve the previous results until ranked or discarded.
- Cards state the score formula (`weighted similarity × √coverage`) and the requested/present dimension counts.
- A result title no longer repeats an acronym when it equals the title.
- B1 checkboxes marked complete in `docs/todo/PERSON_B.md` after `npm run check` passed (typecheck, lint, 15 tests, production build).

## 2026-11-14 — B0 frontend foundation

### Added

- React 19 + Vite 8 + TypeScript frontend with Tailwind CSS 4 dark-space visual tokens and a responsive WAI-ARIA tab shell.
- Typed H0 API client with a mock adapter, shared `FireSightApi` surface, and persistent `H0 mock · not canonical` disclosure.
- Six lazy-mounted tabs: Overview, Investigations, Compare, Observed Map, Historical & Earth Applications, and Q&A.
- Lazy-loaded Plotly parallel coordinates and observed flammability map with data-table fallbacks.
- Vitest coverage for the mock H0 contract, tab keyboard semantics, and the scenario/result, compare/map, context, and Q&A render paths.

### Changed

- B0 checkboxes marked complete in `docs/todo/PERSON_B.md` after `npm run check` passed (typecheck, lint, 10 tests, production build).

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
