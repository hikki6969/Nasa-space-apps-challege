# Team Execution Plan

This plan divides implementation between two people while keeping one evidence contract and one API contract. The authoritative requirements are in [Product Spec](00_PRODUCT_SPEC.md), [Verified Facts](VERIFIED_FACTS.md), and [Verification Plan](06_VERIFICATION_PLAN.md).

## 1. Workstream ownership

| Area | Person A — Evidence & Backend | Person B — Frontend & QA |
|---|---|---|
| Canonical snapshot | Owner | Consumer |
| Field-level annotations | Owner | Consumer |
| Pydantic schema | Owner | Consumer via generated/manual types |
| Snapshot/embedding builders | Owner | Consumer |
| SQLite/FTS5 | Owner | Consumer |
| Similarity/ranking | Owner | Consumer via API |
| Template justifications/scope guard | Owner | Consumer via API |
| FastAPI routes | Owner | Consumer via API |
| React/Vite/Tailwind shell | Consumer | Owner |
| Scenario panel | Consumer | Owner |
| Investigations/filter/provenance UI | Consumer | Owner |
| Compare matrix/parallel coordinates | Consumer | Owner |
| Observed-point map | Consumer | Owner |
| Historical/Spinoff context UI | Consumer | Owner |
| Bounded Q&A UI | Consumer | Owner |
| Accessibility/responsive checks | Support | Owner |
| Backend Dockerfile | Owner | Consumer |
| Frontend Dockerfile/nginx | Consumer | Owner |
| Root Docker Compose | Owner | Reviewer |
| Backend tests | Owner | Reviewer |
| Frontend/component/E2E tests | Reviewer | Owner |
| Documentation fact ledger | Owner | Consumer |
| Documentation updates | Own section | Own section; coordinate shared files |

Detailed checklists:

- [Person A TODO](todo/PERSON_A.md)
- [Person B TODO](todo/PERSON_B.md)

## 2. Exclusive file ownership

To avoid merge conflicts, use these boundaries unless a handoff explicitly changes ownership.

### Person A

```text
backend/**
data/**
scripts/build_snapshot.py
scripts/build_embeddings.py
scripts/build_index.py
scripts/check_data.py
tests/backend/**
docs/VERIFIED_FACTS.md
```

### Person B

```text
frontend/**
tests/frontend/**
docker/nginx.conf
```

### Joint review, one owner per change

```text
docker-compose.yml
README.md
scripts/check_docs.py
docs/00_PRODUCT_SPEC.md
docs/01_DECISION_LOG.md
docs/02_PROBLEM_LOG.md
docs/03_CHANGELOG.md
docs/06_VERIFICATION_PLAN.md
docs/07_TEAM_EXECUTION_PLAN.md
```

A shared file is changed in one coordinated edit; do not maintain parallel variants.

## 3. Dependency graph

```text
A: schema + mock contract
   -> B: frontend shell and typed mock client
A: canonical snapshot + seven annotations
   -> B: real catalog/detail fixtures
A: FTS5 + ranking + templates
   -> B: real rank/compare/ask integration
B: frontend feature views
   -> A: API defects and missing fields
Both: tests + Docker rehearsal
```

Person B must not wait for the entire backend. Build against a versioned mock contract, then replace mocks through the same typed client.

## 4. Handoff packages

| Handoff | From | To | Contents | Acceptance |
|---|---|---|---|---|
| H0 | A | B | frozen Pydantic schema, OpenAPI JSON, representative mock responses | schema tests pass; mock IDs/numbers match VF ledger |
| H1 | A | B | 24-record snapshot fixture, seven annotations, table previews | data validation passes; exact IDs and BASS-II checks pass |
| H2 | A | B | `/rank`, `/compare`, `/observations`, `/context`, `/ask` endpoints | targeted backend tests pass; p95 target measured |
| H3 | B | A | reproducible UI/API defect report with request, response, expected result | defect enters Problem Log before fix |
| H4 | Both | release | pinned dependency files, images, green test output, demo script | clean offline Docker rehearsal passes |

## 5. Phase schedule and gates

### Phase 0 — Specification and skeleton (hours 0–3)

- **A:** implement the frozen schema, formula functions, validation tests, and mock API payloads.
- **B:** create the React/Vite/TypeScript shell, scenario controls, typed API client, and mock result cards.
- **Gate:** mock data renders; every result has dimensions, coverage, and non-empty justification; schema rejects incoherent records.

### Phase 1 — Data sprint (hours 3–8)

- **A:** build the exact 24-record snapshot, ingest public tables, curate seven records, generate digest.
- **B:** complete catalog/detail/search shells against H1 fixtures and build the provenance components.
- **Gate:** all records validate; seven annotations have field-level provenance; VF corrections are mechanically tested.

### Phase 2 — Retrieval and scoring (hours 8–18)

- **A:** implement FTS5/BM25, build-time embeddings, six similarities, coverage score, match classes, templates, and scope guard.
- **B:** integrate rank results, filters, sorting, score breakdown, and gap banner through H2.
- **Gate:** all four scenario invariants pass; no weight redistribution; no template false coverage; ranking p95 below 500 ms.

### Phase 3 — Frontend integration (hours 18–30)

- **A:** stabilize API contracts and fix H3 defects.
- **B:** finish Compare, observed map, context, Q&A, accessibility, and responsive behavior.
- **Gate:** visible scenario differences; no direct claim without all exact conditions; no fitted plot; keyboard/mobile checks pass.

### Phase 4 — Optional local Phi-3 (hours 30–38)

- **A:** optional profile, structured context, citation/numeric validation, cache, model/prompt hashes.
- **B:** optional-model status/error presentation that is hidden by default.
- **Gate:** every optional-LLM gate passes; otherwise `USE_LLM=false` remains final.

### Phase 5 — Hardening (hours 38–44)

- **A:** backend error states, missing-table handling, snapshot validator, backend image.
- **B:** frontend error states, accessibility pass, frontend image and nginx proxy.
- **Gate:** clean Docker startup, offline demo, missing optional model tolerated.

### Phase 6 — Rehearsal (hours 44–48)

- **Both:** two complete demo runs, offline recording, Q&A preparation, final documentation/test freeze.
- **Gate:** no feature work after freeze; all required evidence is current.

## 6. Working agreement

- Person A owns evidence truth. Person B must not “correct” numeric values in the UI; they report H3.
- Person B owns interaction truth. Person A must not change response semantics without updating the mock/OpenAPI contract and notifying Person B.
- Every completed checklist item includes a command, test, screenshot, or file reference.
- A gate is blocked, not passed, when evidence is missing.
- New scope is added only by explicit product-spec and decision-log change.

## 7. Definition of done for each person

A person's work is done only when:

- every assigned gate item is checked with concrete evidence;
- affected tests pass after the last mutation;
- no owned file contains secrets, signed URLs, or generated database artifacts;
- documentation is updated for behavior changes;
- known gaps are recorded rather than hidden.

## 8. Current entry point

- **Person A:** start with the schema/model and snapshot builder tests in [Person A TODO](todo/PERSON_A.md).
- **Person B:** start with the frontend shell and mock API contract in [Person B TODO](todo/PERSON_B.md).
- **Joint:** review H0 together before either workstream advances to real data.
