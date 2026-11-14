# Person B TODO — Frontend & QA

**Owner boundary:** `frontend/**`, `tests/frontend/**`, and `docker/nginx.conf`.

**Start here:** [Product Spec §10](../00_PRODUCT_SPEC.md#10-frontend), [Verification Plan](../06_VERIFICATION_PLAN.md), and the H0 mock contract from Person A.

## B0. Frontend foundation

- [x] Create React + Vite + TypeScript + Tailwind frontend.
- [x] Add Plotly for parallel coordinates and the observed map; add no second component library.
- [x] Create a typed API client and mock adapter.
- [x] Implement the NASA-inspired dark-space visual tokens and responsive shell.
- [x] Implement keyboard-accessible navigation and tab semantics.

**Done when:** production build passes and the typed mock client renders one scenario and one result.

**Dependencies:** none; use the agreed H0 shape if Person A's OpenAPI is not yet available.

## B1. Scenario controls and results

- [x] Build scenario panel controls for oxygen, pressure, gravity, flow, phase, and theme.
- [x] Represent explicitly unspecified scenario values without silently defaulting them.
- [x] Build result cards with score, coverage, match class, six-slot dimension breakdown (requested, present or missing, or not requested), limitations, and justification.
- [x] Build the evidence-gap banner from the API gap statement.
- [x] Ensure missing dimensions visibly differ from zero-similarity dimensions.

**Done when:** four mock scenarios produce visibly different, explainable results.

**Dependencies:** B0; H0 for real types.

## B2. Overview

- [x] Show total, completed, curated, metadata-only, instrument-context, and anticipated counts.
- [x] Show evidence-class and safety-theme distributions.
- [x] Show hardware/facility distribution.
- [x] Show top completed evidence and coverage warnings for the active scenario.
- [x] Keep historical/Spinoff counts visibly separate from PSI evidence counts.

**Done when:** counts match API fixtures and no anticipated record is counted as measured.

**Dependencies:** B0, H1 for real data.

## B3. Investigations, filters, and provenance

- [ ] Build catalog search and filters for theme, phase, project type, evidence class, and status.
- [ ] Add sorting by physical score, coverage, and title.
- [ ] Build detail view with objectives, approach, findings, source links, and table preview.
- [ ] Build field-level provenance display.
- [ ] Render metadata-only and instrument-context records as visibly non-ranked.
- [ ] Render remote text as text, never raw HTML.

**Done when:** all 24 records are reachable and every curated numeric value links to provenance.

**Dependencies:** B0, H1.

## B4. Compare

- [ ] Allow selection of two to four records.
- [ ] Build side-by-side matrix of comparable fields.
- [ ] List shared and different hardware, fuels, phases, themes, and measurements.
- [ ] Add Plotly parallel coordinates only for fields with compatible units.
- [ ] Do not force missing or incompatible values onto a shared axis.

**Done when:** comparison works for same-theme and cross-theme records without implying equivalent evidence classes.

**Dependencies:** B1, H2.

## B5. Observed Flammability Map

- [ ] Plot only API-returned measured observations.
- [ ] Encode outcome and material/fuel class clearly and accessibly.
- [ ] Add optional translucent observed-domain hull.
- [ ] Display exactly: “Observed test domain; not a validated flammability boundary.”
- [ ] Add no fitted curve, probability, confidence interval, risk tier, or extrapolation.
- [ ] Prove FM2, LUCI, PSI-47, PSI-117, and every program-context or anticipated record are absent.
- [ ] Add a source/visual regression test for the forbidden chart elements.

**Done when:** observed-map tests pass and a reviewer cannot mistake the hull for a boundary.

**Dependencies:** B1, H2.

## B6. Historical and Earth Applications

- [ ] Build Apollo 1, Mir, and Apollo 13 context cards from official NASA sources.
- [ ] Build NASA Spinoff cards from official URLs.
- [ ] Label thematic links as thematic unless direct lineage is explicit.
- [ ] Keep every context card outside numerical ranking and measured plots.

**Done when:** no historical/spinoff value can enter a ranking payload or observed observation.

**Dependencies:** B0, H1.

## B7. Bounded Q&A and scope guard

- [ ] Build question input with preset examples.
- [ ] Render template answers, matched records, fields, and linked PSI citations.
- [ ] Display out-of-scope rocket/propellant refusals clearly.
- [ ] Do not inject answer HTML.
- [ ] Confirm `USE_LLM=false` is invisible in the normal experience.

**Done when:** valid questions are cited and scope violations are refused.

**Dependencies:** B1, H2.

## B8. Accessibility, responsive behavior, and error states

- [ ] Verify keyboard-only use of controls, tabs, filters, compare selection, dialogs, and charts.
- [ ] Add visible focus and screen-reader labels.
- [ ] Add loading, empty, missing-table, hash/index failure, and API error states.
- [ ] Check mobile and large-display layouts for all six tabs.
- [ ] Verify color contrast and non-color status cues.

**Done when:** the accessibility and responsive checks in the Verification Plan pass.

**Dependencies:** B1–B7.

## B9. Frontend packaging

- [ ] Add the frontend Dockerfile with pinned Node/dependency versions.
- [ ] Configure nginx static hosting and `/api` proxying.
- [ ] Ensure runtime does not fetch CDN scripts, fonts, or data.
- [ ] Add a production preview/smoke test.

**Done when:** the frontend image serves the production build and proxies the backend offline.

**Dependencies:** B0; root Compose coordination with Person A.

## B10. Frontend and end-to-end verification

- [ ] Add component tests for scenario controls, score breakdown, gap banner, provenance, compare, map, context, and Q&A.
- [ ] Add the four scenario end-to-end tests.
- [ ] Add the keyboard and responsive checks.
- [ ] Run type check, frontend tests, and production build after the final mutation.
- [ ] Run the complete Docker demo twice with networking disabled.
- [ ] Update the Changelog and Problem Log for behavior changes.
- [ ] Deliver H3 to Person A for every reproducible UI/API defect: request, response, expected result, and screenshot when visual.

**Done when:** H4 frontend evidence is current and both demo rehearsals pass.

**Dependencies:** B8, B9, H2.

## Blockers and rulings needed

- [ ] **Confirm:** final API field names from H0 before completing typed integration.
- [ ] **Confirm:** accessibility test tooling when the frontend scaffold selects Vitest/Jest and the browser driver.
- [ ] **Rule:** exact parallel-coordinate fields that are comparable across selected records.
- [ ] **Rule:** official LUCI card content only after Person A verifies the source.

## Handoff log

| Date | Handoff | Recipient | Evidence | Notes |
|---|---|---|---|---|
| — | H0 typed client/mock review | Person A | — | — |
| — | H3 UI/API defect reports | Person A | — | — |
| — | H4 frontend/demo evidence | release | — | — |
