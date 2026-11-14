# Verification Plan

A requirement is complete only after an executable validator passes after the last relevant mutation. Prose review and model self-review are supplementary, not completion evidence.

## 1. Verification levels

1. Hidden deterministic acceptance validator.
2. Runtime/API execution.
3. Project test suite.
4. Type checker/compiler.
5. Static analysis.
6. Executable reproducer.
7. Structural/diff invariant.
8. Independent review.

## 2. Required test matrix

| ID | Requirement | Method | Pass condition |
|---|---|---|---|
| T-001 | Exact corpus | snapshot membership test | exactly VF-01's 24 IDs; no duplicates |
| T-002 | False positives excluded | membership test | PSI-181 and PSI-108 absent |
| T-003 | DAFT placement | schema/catalog/ranking test | PSI-47 present, `instrument_context`, never ranked |
| T-004 | Curated IDs | annotation validator | exactly PSI-159, 10, 101, 98, 25, 69, 68 are `source_cited` initially |
| T-005 | Snapshot integrity | digest check | recorded SHA-256 matches canonical JSON |
| T-006 | Schema strictness | Pydantic tests | reversed range, string-to-number coercion, wrong field unit, missing provenance on any populated physical field including `metadata_only` records, and incoherent status fail |
| T-007 | Program-context status | validator test | program context uses the separate model, distinguishes `active_program` from `anticipated_in_psi`, and exposes no evidence class or measured table |
| T-008 | BASS-II wording | template regression test | Scenario A justification does not claim BASS-II covers 30% O₂ |
| T-009 | BASS-II numeric fidelity | fixture/table test | initial range 0.136–0.222; final outliers remain separate |
| T-010 | No false coverage | template regression suite | no “covers” claim for an out-of-range dimension |
| T-011 | Missing-record-field rule | unit test | weights are not redistributed to a missing record field |
| T-012 | Coverage penalty | unit test | equal matches rank lower when coverage is lower over the same requested scenario dimensions |
| T-013 | Oxygen similarity | table-driven unit test | frozen tolerance-overlap formula matches expected values |
| T-014 | Pressure similarity | table-driven unit test | frozen tolerance-overlap formula matches expected values |
| T-015 | Gravity exact | unit test | exact recorded level gives 1.0 |
| T-016 | Gravity bracket | unit test | strict bracket gives 0.5; outside gives 0.0 |
| T-017 | Partial-gravity direct gap | scenario test | Scenario A has no `direct_match` |
| T-018 | Flow similarity | table-driven unit test | exact/bracket/tolerance/disjoint branches match specification |
| T-019 | Phase similarity | unit test | exact phase 1.0; non-match 0.0; empty means missing |
| T-020 | Theme similarity | unit test | primary 1.0; secondary 0.6; unrelated 0.0; absent missing |
| T-021 | Scenario A gap | API/UI test | explicit no-completed-direct-match statement |
| T-022 | Scenario B detection | API/UI test | SAME-R appears; DAFT is outside ranked results |
| T-023 | Scenario C suppression | API/UI test | FLEX and FLEX-2 appear as completed evidence |
| T-024 | Scenario D context | API/UI test | no completed direct Apollo 1 reconstruction is claimed; high-O₂ gaseous context and solid-fuel context remain separated; Apollo 1 appears only as context |
| T-025 | Historical inputs excluded | scorer test | Apollo/Mir values are not scenario or record inputs |
| T-026 | Template citations | API test | every cited PSI ID exists in canonical data |
| T-027 | Template numerics | API test | every generated number matches canonical record |
| T-028 | Scope guard | API/UI test | rocket/propellant questions receive a bounded refusal |
| T-029 | Observed-map inputs | API test | only measured, completed, ranked-eligible evidence records with observations are returned; PSI-47, PSI-117, modeling, program-context, and metadata-only records are absent |
| T-030 | Anticipated not plotted | API/UI test | FM2, LUCI if present, and every other program-context entry are absent |
| T-031 | No fitted model | source/static plus UI test | no regression/probability/CI implementation; no fitted trace |
| T-032 | Hull wording | UI test | exact non-validation disclaimer is visible |
| T-033 | Embedding matrix | artifact test | shape and model hash match the pinned build; runtime has no Torch import |
| T-034 | Search index | integration test | FTS5/BM25 query returns expected IDs and remains reproducible |
| T-035 | Comparison | API/UI test | two-to-four records show shared/different fields and comparable axes only |
| T-036 | Ranking performance | benchmark | p95 below 500 ms without optional LLM |
| T-037 | Offline operation | Docker/network test | core demo works with network disabled |
| T-038 | LLM disabled | source/runtime test | `USE_LLM=false` path has no model runtime or network dependency |
| T-039 | Optional LLM gate | validation suite | exact numerics, valid citations, no unsupported claims, p95 below 3 s; otherwise disabled |
| T-040 | Frontend build | CI command | type check and production build pass |
| T-041 | Accessibility | automated plus manual keyboard test | controls, tabs, dialogs, and charts are keyboard usable |
| T-042 | Responsive layout | browser checks at mobile and desktop widths | no blocked core journey |
| T-043 | Docker rehearsal | clean build | `docker compose up --build` starts both services |
| T-044 | Documentation | `python scripts/check_docs.py` | zero failures |
| T-045 | Unspecified scenario dimension | unit test | an unspecified scenario dimension is excluded from `Q(S)` and record coverage; missing record fields in `Q(S)` still receive no weight redistribution |
| T-046 | Nested table linkage | schema test | an `ExperimentalTable.psi_id` differing from its parent `InvestigationRecord.psi_id` fails validation |

## 3. Canonical scenario fixtures

### Scenario A — lunar habitat

Expected invariant:

- zero `direct_match` records;
- explicit gap statement names the solid-fuel, 30% O₂, 8.2 psia, partial-gravity combination;
- BASS-II, CFI-G, and Flame Design are represented according to their actual limitations;
- FM2 is separate and anticipated.

### Scenario B — cabin detection

Expected invariant:

- SAME-R is present;
- DAFT is not a ranked candidate;
- detector evidence is not presented as flame-spread evidence.

### Scenario C — droplet suppression

Expected invariant:

- FLEX and FLEX-2 are present;
- PSI-117, if shown, is labeled modeling/no experimental table.

### Scenario D — Apollo 1 reconstruction

Expected invariant:

- no `direct_match` claim;
- high-O₂ gaseous context and solid-fuel context are separated;
- Apollo 1 appears only as context.

## 4. Scoring reference examples

Tests must use hand-computed values, not duplicate the production function.

| Case | Expected |
|---|---|
| oxygen range [0.136, 0.222], scenario 0.30, tolerance 0.02 | 0.0 |
| oxygen range [0.28, 0.31], scenario 0.30 | 1.0 |
| pressure range [7.9, 8.1], scenario 8.2, tolerance 0.2 | at least 0.5 and calculated exactly by the frozen formula |
| gravity recorded [0.0, 1.0], scenario 0.16 | 0.5 |
| gravity recorded [0.0], scenario 0.16 | 0.0 |
| exact recorded gravity 0.16 | 1.0 |
| scenario requests six dimensions, record has five | coverage 5/6, missing dimension contributes zero, no redistributed weight |
| scenario requests three dimensions, record has all three | coverage 1.0; unspecified dimensions are outside `Q(S)` |
| same requested set, equal weighted similarity, coverage 5/6 versus 6/6 | five-of-six score is lower |

## 5. Data acceptance gate

Before the Phase 1 gate:

- all 24 records validate;
- every curated numeric field has provenance;
- table metadata points to the correct file name and version;
- BASS-II initial oxygen is 0.136–0.222;
- no PSI-181/PSI-108;
- PSI-47 is present but non-ranked;
- FLEX/FLEX-2 tables are present;
- snapshot digest is generated and recorded.

## 6. UI acceptance gate

Before the Phase 3 gate:

- the four scenarios produce visibly different, explainable results;
- score breakdown and coverage are visible for every result;
- the gap banner appears where required;
- compare matrix and observed map use source records;
- keyboard and mobile checks pass;
- no chart presents a boundary or prediction.

## 7. Release gate

The final mutation must be followed by:

```bash
python scripts/check_docs.py
pytest
# frontend type check and production test command
npm run build
# in the frontend directory
docker compose up --build
```

The exact frontend test command is fixed when the frontend scaffold is created. The clean offline rehearsal and both canonical demo runs must also pass.

## 8. Failure handling

A failed gate blocks promotion. Record unexpected behavior in [Problem Log](02_PROBLEM_LOG.md) using the fixed defect shape. Do not weaken an assertion merely to make a gate green unless the product specification is deliberately revised and the change is logged.
