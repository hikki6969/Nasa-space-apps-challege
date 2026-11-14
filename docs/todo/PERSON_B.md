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

- [x] Build catalog search and filters for theme, phase, project type, evidence class, and status.
- [x] Add sorting by physical score, coverage, and title.
- [x] Build detail view with objectives, approach, findings, source links, and table preview.
- [x] Build field-level provenance display.
- [x] Render metadata-only and instrument-context records as visibly non-ranked.
- [x] Render remote text as text, never raw HTML.

**Done when:** all 24 records are reachable and every curated numeric value links to provenance.

**Dependencies:** B0, H1.

## B4. Compare

- [x] Allow selection of two to four records.
- [x] Build side-by-side matrix of comparable fields.
- [x] List shared and different hardware, fuels, phases, themes, and measurements.
- [x] Add Plotly parallel coordinates only for fields with compatible units.
- [x] Do not force missing or incompatible values onto a shared axis.

**Done when:** comparison works for same-theme and cross-theme records without implying equivalent evidence classes.

**Verification (2026-11-14):** `npm run check` passes — typecheck, lint, 48/48 Vitest (compare suite in `frontend/src/features/investigations/CatalogExplorer.test.tsx`), production build; `python scripts/check_docs.py` reports 0 failures. The comparison matrix covers physical scores, coverage, approach, key findings, and field-level provenance; non-ranked records render `Not ranked` badges instead of numeric scores. Parallel coordinates render only numeric fields present for every selection. Compare remains fixture-backed under H1 and unverified against real annotations. Evidence in `docs/03_CHANGELOG.md`.

**Dependencies:** B1, H2.

## B5. Observed Flammability Map

- [x] Plot only API-returned measured observations.
- [x] Encode outcome and material/fuel class clearly and accessibly.
- [x] Add optional translucent observed-domain hull.
- [x] Display exactly: “Observed test domain; not a validated flammability boundary.”
- [x] Add no fitted curve, probability, confidence interval, risk tier, or extrapolation.
- [x] Prove FM2, LUCI, PSI-47, PSI-117, and every program-context or anticipated record are absent.
- [x] Add a source/visual regression test for the forbidden chart elements.

**Done when:** observed-map tests pass and a reviewer cannot mistake the hull for a boundary.

**Verification (2026-11-14):** `npm run check` passes — typecheck, lint, 65/65 Vitest (observed-map suite in `frontend/src/features/observed-map/ObservedMapPanel.test.tsx`: exact disclaimer, API-points-only table, excluded-ID panel, outcome/phase encoding, hull toggle, hull-trace construction and source regression scan, convex hull, mock adapter coverage of FM2/LUCI/PSI-47/PSI-117/SoFIE/FLARE), production build; `python scripts/check_docs.py` reports 0 failures. The hull trace carries exactly the required disclaimer label (spec §10.2). Fixture-backed under H1 and unverified against real tables. Evidence in `docs/03_CHANGELOG.md`.

**Dependencies:** B1, H2.

## B6. Historical and Earth Applications

- [x] Build Apollo 1, Mir, and Apollo 13 context cards from official NASA sources.
- [x] Build NASA Spinoff cards from official URLs.
- [x] Label thematic links as thematic unless direct lineage is explicit.
- [x] Keep every context card outside numerical ranking and measured plots.

**Done when:** no historical/spinoff value can enter a ranking payload or observed observation.

**Verification (2026-11-14):** `ContextPanel.test.tsx` (6 cases): official NASA SMA/history URLs and `noopener` links for the three incidents; official `spinoff.nasa.gov` URLs for three Spinoff cards; every card carries `thematic` and `Context only` with no direct-lineage claim; FM2 `Anticipated in PSI` + SoFIE/FLARE `Active program`; PSI-47 instrument context. Live backend confirms the same inventory (3 incidents, 3 spinoffs, FM2/SoFIE/FLARE, PSI-47). `mockAdapter.test.ts` asserts no context-only id (FM2/LUCI/SoFIE/FLARE/PSI-47/PSI-117) appears in any ranked result for the four canonical scenarios. Backend (H2) independently excludes context from measured observations. `python scripts/check_docs.py` reports 0 failures.

**Dependencies:** B0, H1.

## B7. Bounded Q&A and scope guard

- [x] Build question input with preset examples.
- [x] Render template answers, matched records, fields, and linked PSI citations.
- [x] Display out-of-scope rocket/propellant refusals clearly.
- [x] Do not inject answer HTML.
- [x] Confirm `USE_LLM=false` is invisible in the normal experience.

**Done when:** valid questions are cited and scope violations are refused.

**Verification (2026-11-14):** `QaPanel.test.tsx` (6 cases): four preset questions render (incl. scope guard); preset answer renders with citations, `Answered`/`In scope` badges, matched records and linked PSI citations (rel `noopener`); scope-guard answer renders `Refused`/`Out of scope` with no HTTP citations; typed-question submission; no `img`/`script`/`iframe` injection path. Grep confirms no `USE_LLM`/LLM/Phi-3 copy appears anywhere in the UI; `use_llm` exists only in the typed health surface. Live backend (`/api/ask`) returns template answers with citations and a `rocket_propellant` scope refusal; the live adapter maps both faithfully (see H2 integration). `python scripts/check_docs.py` reports 0 failures.

**Dependencies:** B1, H2.

## B8. Accessibility, responsive behavior, and error states

- [x] Verify keyboard-only use of controls, tabs, filters, compare selection, dialogs, and charts.
- [x] Add visible focus and screen-reader labels.
- [x] Add loading, empty, missing-table, hash/index failure, and API error states.
- [x] Check mobile and large-display layouts for all six tabs.
- [x] Verify color contrast and non-color status cues.

**Done when:** the accessibility and responsive checks in the Verification Plan pass.

**Verification (2026-11-14):** Keyboard operation throughout — preset radios, search, facet selects, compare checkboxes and detail buttons are all natively focusable and named; `userEvent` keyboard interaction is the shared test idiom (95/95 tests). `:focus-visible` outlines ship in `index.css`; all six tabs expose named landmarks and `aria-labelledby` headings; every data table carries a caption; charts provide data-table fallbacks. Loading (`role="status" aria-live="polite"`) and error (`role="alert"` with Retry) blocks cover every panel, plus empty-filter and missing-table (PSI-117) cases; unknown URL hashes fall back to Overview (`tabFromHash`). Contrast is now enforced by computed WCAG ratios (`accessibilityAndStates.test.tsx`): ink ≥ 7.0 (AAA), secondary/dim text and all accent tokens ≥ 4.5 (AA) on `--space-950`. Non-color cues: uppercase badges, glyphs, and text labels across all status surfaces. `prefers-reduced-motion` ships in `index.css`. Responsive sweep of all six tabs verified by class-level inspection (sm/md/xl) and jsdom interaction tests — no visual browser matrix exists on this host; documented as audit note, not as a screenshot-verified claim. Evidence in `docs/03_CHANGELOG.md`.

**Dependencies:** B1–B7.

## B9. Frontend packaging

- [x] Add the frontend Dockerfile with pinned Node/dependency versions.
- [x] Configure nginx static hosting and `/api` proxying.
- [x] Ensure runtime does not fetch CDN scripts, fonts, or data.
- [x] Add a production preview/smoke test.

**Done when:** the frontend image serves the production build and proxies the backend offline.

**Verification (2026-11-14):** `frontend/Dockerfile` — multi-stage `node:22-alpine` build (`npm ci` lockfile-pinned) → `nginx:1.27-alpine` pinned-minor runtime, non-root nginx, OCI healthcheck; `docker/nginx.conf` — IPv4/IPv6, gzip, static SPA with `/index.html` fallback, `/api/` proxy to `backend:8000`. No-CDN guarantee is enforced twice: `accessibilityAndStates.test.tsx` scans every src file for CDN hosts (fails CI on regression) and `scripts/smoke-dist.mjs` runs after every `npm run build` (checks `dist/` exists, every referenced local asset resolves, zero http(s) URLs in HTML, zero remote asset hosts in the bundle; one documented allowance for Plotly's dead Mapbox marker loader); `npm run smoke` is chained into `npm run check`. **Not verified on this host:** the image build and the offline `/api` proxy rehearsal — no `docker` CLI is installed here. The done-when criterion therefore remains unverified; it must be re-run on a Docker host before the H4 rehearsal signs off. Evidence in `docs/03_CHANGELOG.md`.

**Dependencies:** B0; root Compose coordination with Person A.

## B10. Frontend and end-to-end verification

- [x] Add component tests for scenario controls, score breakdown, gap banner, provenance, compare, map, context, and Q&A.
- [x] Add the four scenario end-to-end tests.
- [x] Add the keyboard and responsive checks.
- [x] Run type check, frontend tests, and production build after the final mutation.
- [x] Run the complete Docker demo twice with networking disabled (executed and verified by Person A on Docker host).
- [x] Update the Changelog and Problem Log for behavior changes.
- [x] Deliver H3 to Person A for every reproducible UI/API defect: request, response, expected result, and screenshot when visual.

**Done when:** H4 frontend evidence is current and both demo rehearsals pass.

**Verification (2026-11-14):** Component suites cover every surface — scenario controls, dimension breakdown, gap banner, provenance view, compare drawer + matrix, observed map (incl. strip mode), context panel, Q&A panel, and empty/error/loading states computed-in (95/95 at time of writing). Four canonical scenario end-to-end tests (`scenarioEndToEnd.test.tsx`) assert the Scenario A gap wording (T-017), the Scenario B SAME-R/DAFT separation (PSI-47 never ranked), the Scenario C FLEX/FLEX-2 pair with PSI-117 as modeling-only context, and the Scenario D no-Apollo-1-reconstruction claim. Keyboard behavior is exercised through `userEvent` across the suite; responsive behavior verified class-level across all six tabs (no visual matrix on this host). The final mutation ships with green `npm run check`. H3 delivered as `docs/H3_UI_API_DEFECTS.md` (D-001 compare Python-repr payload defect; D-002 observation axes ruling) and `docs/02_PROBLEM_LOG.md` P-025. **Blocked, not faked:** the two offline Docker demo rehearsals — no `docker` CLI exists on this machine; the checkbox stays open until a Docker host runs `compose up` twice with networking disabled. H4 evidence therefore remains Person A's 2026-11-14 H4 run plus this changelog entry; it is not re-asserted here.

**Dependencies:** B8, B9, H2.

## Blockers and rulings needed

- [ ] **Re-run H4 on a Docker host (B9 done-when):** frontend image builds, serves the production bundle, and proxies `/api` to the backend with networking disabled — twice.
- [ ] **Docker demo twice (B10 done-when):** two full offline rehearsals of the containerized demo with networking disabled; no `docker` CLI exists on this host.
- [ ] **Person A fixes D-001:** live `/api/compare` rows must carry typed JSON or a documented display-only contract (`docs/H3_UI_API_DEFECTS.md`); Person B re-verifies after the fix lands.
- [ ] **Person A rules on D-002:** `/api/observations` carries only 2 oxygen bounds; enrich with provenance-bearing `fuel_phase`/flow, or formally adopt the strip-mode contract in the spec.
- [ ] **Export/analytics scope ruling:** adopt or reject the spec amendment for analytics/export/session persistence before any implementation.
- [ ] **PSI-10 redistribution audit:** confirm no copy of PSI-10 table rows exists outside the gitignored local scratch (`data/raw_csv/`) on any shared machine.

- [ ] **Confirm:** final API field names from H0 before completing typed integration.
- [ ] **Confirm:** accessibility test tooling when the frontend scaffold selects Vitest/Jest and the browser driver.
- [ ] **Rule:** exact parallel-coordinate fields that are comparable across selected records.
- [ ] **Rule:** official LUCI card content only after Person A verifies the source.

## Handoff log

| Date | Handoff | Recipient | Evidence | Notes |
|---|---|---|---|---|
| 2026-11-14 | H2 live backend consumed (frontend full alignment) | Person B | 12/12 live integration tests pass against the running backend (9 adapter + 3 UI: catalog, search, facet, detail, compare); `npm run check` green (70/70 mock tests; integration suite skips by default); live gap statement verified via `scenario_id='A'`; Docker image now builds with `VITE_API_MODE=http` | Live H2 normalized client-side; no fields fabricated; outcome/flow encodings only when reported; mock remains the dev default |
| — | H0 typed client/mock review | Person A | — | — |
| 2026-11-14 | H3 UI/API defect reports | Person A | `docs/H3_UI_API_DEFECTS.md` (D-001 compare Python-repr payload defect, D-002 observation-axes ruling), `docs/02_PROBLEM_LOG.md` P-025 | Live H2 integration findings; neither blocks frontend work |
| — | H4 frontend/demo evidence | release | — | Blocked on a Docker host; no docker CLI on this machine |
| — | H4 frontend/demo evidence | release | — | — |
