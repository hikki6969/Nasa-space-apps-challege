# FireSight — Product Specification

- **Status:** Approved implementation baseline; schema frozen 2026-11-14
- **Product:** NASA PSI Fire Safety Evidence Synthesizer
- **Audience:** NASA fire-safety engineers, researchers, reviewers, and demo evaluators
- **Evidence authority:** [Verified Facts](VERIFIED_FACTS.md), then field-level annotation provenance, then other official NASA sources
- **Related documents:** [Decision Log](01_DECISION_LOG.md), [Verification Plan](06_VERIFICATION_PLAN.md), [Team Execution Plan](07_TEAM_EXECUTION_PLAN.md), [Person A TODO](todo/PERSON_A.md), [Person B TODO](todo/PERSON_B.md)

## 1. Purpose

FireSight is a local, explainable dashboard that ranks NASA combustion investigations against crew-fire scenarios. It shows the evidence behind every score, identifies missing conditions, compares investigations, and presents observed test points without turning a small corpus into a predictive flammability model.

### 1.1 Goals

- Retrieve relevant completed PSI investigations from an exact, reproducible corpus.
- Rank records deterministically using six physical/taxonomic dimensions.
- Show every dimension, weight, similarity, source, limitation, and coverage value.
- Make evidence gaps prominent rather than manufacturing a best match.
- Link investigations to historical incidents and NASA Spinoff context without treating context as evidence.
- Run locally and offline in the judged path.
- Keep template/retrieval explanations primary; keep local generative AI optional and disabled by default.

### 1.2 Non-goals

- No fitted flammability model, prediction curve, probability, confidence interval, or validated flammability boundary.
- No CFD execution.
- No claim that microgravity data substitutes for lunar or Martian partial gravity.
- No rocket-engine or propellant-combustion analysis.
- No multi-user accounts, collaborative annotations, or persistent preferences.
- No external LLM/API dependency in the committed demo path.
- No PostgreSQL or pgvector service.
- No runtime PyTorch or runtime embedding model.

## 2. Core journeys

1. Select a crew-environment scenario.
2. Set oxygen, pressure, gravity, flow, material phase, and safety theme where values are known.
3. Retrieve candidate PSI investigations.
4. Rank eligible completed evidence deterministically.
5. Inspect per-dimension scores, coverage, provenance, and experimental tables.
6. Identify completed evidence that does **not** cover the scenario.
7. Compare two to four investigations in a matrix and optional parallel-coordinates view.
8. Explore observed flammability test points without extrapolation.
9. Ask bounded retrieval questions and receive cited template answers.
10. View relevant NASA history and Spinoff context.

## 3. Evidence corpus and status model

### 3.1 Canonical corpus

The canonical source is a git-tracked, hash-pinned JSON snapshot:

```text
data/
  psi_snapshot.json       # exactly the 24 VF-01 records
  annotations.json        # field-level source-cited annotations
  program_context.json     # non-measured program context such as FM2/SoFIE/FLARE
  embeddings.npy          # build-time MiniLM embeddings
  snapshot.sha256         # SHA-256 of canonical JSON inputs
```

SQLite/FTS5 is a reproducible derived index:

```text
data/generated/firesight.db
```

The snapshot must contain exactly the accessions listed in VF-01. PSI-181 and PSI-108 must be absent because they fail the exact research-area filter. PSI-47 is present because the live filter returns it, but its catalog role is `instrument_context`, not ranked evidence.

### 3.2 Curated records

The initial physically annotated set contains seven records:

| PSI ID | Acronym | Role |
|---|---|---|
| PSI-159 | ACME CFI-G | high-O₂ gas/flame context |
| PSI-10 | ACME/Flame Design | high-O₂ gas/flame context |
| PSI-101 | SAME-R | detection instrumentation |
| PSI-98 | SAFFIRE-I | large-scale fire demonstration |
| PSI-25 | BASS-II | solid-fuel burning/suppression |
| PSI-69 | FLEX | droplet flammability and suppressant evidence |
| PSI-68 | FLEX-2 | bi-component droplet-combustion evidence |

PSI-117 remains in the 24-record catalog as FLEX-derived modeling context. It is not deeply curated and is never a measured observation or default ranked candidate.

### 3.3 Status vocabulary

- `catalog_role = evidence`: may be eligible for ranking after curation.
- `catalog_role = instrument_context`: visible outside physical ranking (PSI-47).
- `data_status = complete`: completed investigation with accessible evidence.
- `data_status = partial`: completed but metadata or accessible evidence is incomplete.
- `data_status = anticipated_in_psi`: expected program, represented by the separate `ProgramContext` model rather than the measured 24-record catalog.
- `data_status = active_program`: current official program context without a current PSI record, also represented by `ProgramContext`.
- `annotation_status = source_cited`: physical fields carry field-level provenance.
- `annotation_status = metadata_only`: catalog-visible but excluded from physical ranking.

## 4. Frozen data contract

### 4.1 Pydantic models

The implementation must use the following logical schema. Python code is the normative representation.

```python
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

RangeUnit = Literal["fraction", "psia", "cm/s", "g"]
FuelPhase = Literal["solid", "liquid_droplet", "gas"]
SafetyTheme = Literal["prevention", "detection", "suppression"]
EvidenceClass = Literal[
    "bench_flammability",
    "large_scale_demonstration",
    "flame_physics",
    "detection_instrumentation",
    "suppression",
    "modeling",
]
ProjectType = Literal["microgravity", "ground"]
CatalogRole = Literal["evidence", "instrument_context"]
DataStatus = Literal["complete", "partial"]
ProgramContextStatus = Literal["active_program", "anticipated_in_psi"]
AnnotationStatus = Literal["source_cited", "metadata_only"]
ExtractionMethod = Literal["script", "manual", "script_assisted_manual"]

class StrictModel(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

class Range(StrictModel):
    min: float
    max: float
    unit: RangeUnit
    notes: str | None = None

    @model_validator(mode="after")
    def validate_bounds(self) -> "Range":
        if self.min > self.max:
            raise ValueError("Range.min must be <= Range.max")
        return self

class Provenance(StrictModel):
    source_url: str
    source_kind: Literal["psi_narrative", "psi_table", "publication", "nasa_program"]
    excerpt_or_table_ref: str
    note: str | None = None
    value_kind: Literal["reported", "safely_derived"] = "reported"
    extraction_method: ExtractionMethod | None = None

class ExperimentalTable(StrictModel):
    psi_id: str
    file_name: str
    version: int
    s3_version_id: str
    download_url: str
    columns: list[str]
    rows: list[dict[str, Any]]
    provenance: Provenance

class InvestigationRecord(StrictModel):
    psi_id: str
    title: str
    acronym: str | None = None
    research_area: str
    project_type: ProjectType
    catalog_role: CatalogRole = "evidence"
    evidence_class: EvidenceClass
    safety_theme: SafetyTheme | None = None
    secondary_safety_themes: list[SafetyTheme] = []

    fuel: str | None = None
    fuel_phases: list[FuelPhase] = []
    oxygen_fraction: Range | None = None
    pressure: Range | None = None
    flow_velocity: Range | None = None
    gravity: Range | None = None
    recorded_gravity_values: list[float] = []
    recorded_flow_values: list[float] = []
    hardware: list[str] = []
    orientation: list[str] = []

    objectives_text: str
    approach_text: str
    key_findings_text: str | None = None

    experimental_tables: list[ExperimentalTable] = []
    data_status: DataStatus
    annotation_status: AnnotationStatus
    extraction_method: ExtractionMethod | None = None

    doi: str | None = None
    license: str | None = None
    source_url: str
    provenance: dict[str, Provenance] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_record(self) -> "InvestigationRecord":
        expected_units = {
            "oxygen_fraction": "fraction",
            "pressure": "psia",
            "flow_velocity": "cm/s",
            "gravity": "g",
        }
        for field, expected_unit in expected_units.items():
            value = getattr(self, field)
            if value is not None and value.unit != expected_unit:
                raise ValueError(f"{field} must use unit {expected_unit}")

        if self.recorded_gravity_values and self.gravity is None:
            raise ValueError("recorded_gravity_values requires a gravity Range")
        if self.recorded_flow_values and self.flow_velocity is None:
            raise ValueError("recorded_flow_values requires a flow_velocity Range")

        for table in self.experimental_tables:
            if table.psi_id != self.psi_id:
                raise ValueError("experimental_tables.psi_id must match parent psi_id")

        physical = {
            "oxygen_fraction", "pressure", "flow_velocity", "gravity",
            "fuel", "fuel_phases", "safety_theme",
        }
        for field in physical:
            value = getattr(self, field)
            if value not in (None, [], ""):
                if field not in self.provenance:
                    raise ValueError(f"Missing provenance for {field}")
        for field in ("recorded_gravity_values", "recorded_flow_values"):
            if getattr(self, field) and field not in self.provenance:
                raise ValueError(f"Missing provenance for {field}")
        return self

class ProgramContext(StrictModel):
    program_id: str
    title: str
    data_status: ProgramContextStatus
    source_url: str
    provenance: dict[str, Provenance] = Field(default_factory=dict)

class Scenario(StrictModel):
    oxygen_fraction: float | None = None
    pressure_psia: float | None = None
    gravity_g: float | None = None
    flow_velocity_cms: float | None = None
    fuel_phase: FuelPhase | None = None
    safety_theme: SafetyTheme | None = None
```

Implementation notes:

- Units are fixed by field and enforced by the validator: oxygen `fraction`, pressure `psia`, flow `cm/s`, gravity `g`. Strict model configuration also rejects string-to-number coercion.
- `recorded_gravity_values` and `recorded_flow_values` contain only explicitly observed levels, each supported by provenance. They are not inferred from narrative adjectives.
- Gravity is a present scoring dimension only when `recorded_gravity_values` is non-empty; a summary range without recorded levels is not enough.
- Flow is a present scoring dimension when `flow_velocity` is present. A non-empty recorded-level list takes precedence for exact/bracket scoring; otherwise the range is used for tolerance overlap.
- An empty phase/theme collection means the dimension is missing. A non-empty collection that does not match is a present dimension with similarity zero.
- `evidence_class` and `data_status` are not redundant: the former describes what kind of completed evidence exists; the latter describes completion/availability.
- `anticipated` is deliberately not an evidence class. Program context uses the separate `ProgramContext` model: FM2 is `anticipated_in_psi`; SoFIE and FLARE are `active_program`. Neither model has `evidence_class` or measured tables.

## 5. Provenance rules

Every non-null physical value, observed-level list, and experimental table must have provenance containing:

- source URL;
- source kind;
- verbatim excerpt or table/row reference;
- annotation note when interpretation was required;
- `reported` or `safely_derived` value kind.

A derived value must preserve the source values and transformation. A value without provenance is `null`. The annotation reviewer must confirm every numeric value before it enters the catalog.

## 6. Retrieval

### 6.1 Candidate generation

1. Apply structured filters for safety theme, evidence class, fuel phase, project type, data status, and catalog role.
2. Use SQLite FTS5/BM25 over titles, objectives, approach, findings, fuels, hardware, and keywords.
3. Use NumPy cosine over committed MiniLM embeddings for investigation-to-investigation similarity and Compare.
4. Fuse ranked lists with Reciprocal Rank Fusion when both FTS and semantic similarity are applicable.
5. Forward at most 10 candidates to physical scoring.
6. Score only `annotation_status = source_cited`, `catalog_role = evidence` records.

Runtime arbitrary-text dense encoding is not part of the committed path. FTS5/BM25 handles free text. A pinned ONNX encoder may be proposed later as a separately gated enhancement.

### 6.2 Ranking formula

Weights are frozen:

| Dimension | Weight |
|---|---:|
| Oxygen | 0.30 |
| Pressure | 0.20 |
| Gravity | 0.20 |
| Flow | 0.10 |
| Material phase | 0.10 |
| Safety theme | 0.10 |

Let `Q(S)` be the dimensions explicitly specified by scenario `S`. For record `I`:

\[
S(I,S)=\left(\frac{\sum_{i\in Q(S)} w_i\,sim_i(I,S)\,present_i}{\sum_{i\in Q(S)} w_i}\right)\left(\frac{\sum_{i\in Q(S)} present_i}{|Q(S)|}\right)^{0.5}
\]

- An unspecified **scenario** dimension is outside the requested set `Q(S)`; it is not a zero-similarity record field and does not reduce record coverage.
- A missing **record** dimension inside `Q(S)` contributes zero and its weight is not redistributed.
- Coverage is the percentage of requested dimensions present in the record. When all six dimensions are requested, this is the original `present / 6` rule.
- A record with fewer reported dimensions cannot outrank an equally matching, more complete record over the same requested set.
- A record with no present requested dimension is not ranked.
- If `Q(S)` is empty, no physical score is produced.
- `direct_match` requires `|Q(S)| = 6`; a partial scenario cannot produce a direct match.

### 6.3 Similarity functions

#### Oxygen and pressure: tolerance-scaled interval overlap

For record interval `R = [r_min, r_max]`, scenario value `s`, and tolerance `t`:

1. If `s` lies inside `R`, similarity is `1.0`.
2. Otherwise, compute overlap length between `R` and scenario window `[s-t, s+t]`.
3. Similarity is `min(1, overlap_length / (2t))`.
4. If the intervals are disjoint, similarity is `0`.

Frozen tolerances:

- oxygen: `t = 0.02` absolute mole fraction (two percentage points);
- pressure: `t = 0.2 psia`.

These tolerances scale similarity only. They are not applicability boundaries.

#### Gravity: discrete recorded-level bracket

Using `G = recorded_gravity_values`:

- `1.0` if `s ∈ G`;
- `0.5` if `s` is strictly between two values in `G`;
- `0.0` otherwise.

A separate 0 g record does not make a scenario at 0.16 g directly covered. Only levels explicitly recorded for that record affect the result.

#### Flow: recorded value, bracket, then tolerance overlap

Using `V = recorded_flow_values`:

- `1.0` if `s ∈ V`;
- `0.5` if `s` is strictly between two values in `V`;
- otherwise, compute normalized overlap with the record flow interval using `t = 1 cm/s`, capped at `0.5`;
- `0.0` if disjoint and outside tolerance.

#### Material phase

- `1.0` if the scenario phase is in `fuel_phases`;
- `0.0` otherwise when `fuel_phases` is non-empty;
- dimension missing when `fuel_phases` is empty.

“Combustible” is not equivalent to a specific material phase.

#### Safety theme

- `1.0` for the primary theme;
- `0.6` for a secondary theme;
- `0.0` for an unrelated theme;
- dimension missing when no theme is curated.

### 6.4 Match classification

- `direct_match`: all six scenario dimensions are specified and present in the record; primary theme, phase, oxygen, pressure, gravity, and flow similarities all equal `1.0`.
- `partial_match`: eligible ranked record with meaningful matching dimensions but not all direct conditions.
- `contextual_only`: modeling, instrument-context, metadata-only, anticipated, or otherwise non-ranked context.
- `anticipated_in_psi`: separate status, never a direct or partial measured match.

The physical score ranks proximity; it does not establish applicability.

## 7. Canonical scenarios

### Scenario A — lunar habitat

| Input | Value |
|---|---|
| Oxygen | 0.30 fraction |
| Pressure | 8.2 psia |
| Gravity | 0.16 g |
| Flow | forced; numeric cm/s value **not specified** |
| Phase | solid |
| Theme | prevention |

Required presentation:

- No completed PSI record directly covers the solid-fuel, 30% O₂, 8.2 psia, partial-gravity combination.
- CFI-G and Flame Design are high-O₂ but gas-phase/microgravity context.
- BASS-II and SAFFIRE-I are solid-fuel context but not at 30% O₂.
- FM2 is shown separately as `anticipated_in_psi`.
- The flow gap is explicit until a numeric scenario value is ruled; it cannot create a direct match.

The fixture must not claim that BASS-II “covers” 30% O₂.

### Scenario B — cabin detection

- Theme: detection.
- Numeric physical inputs: **not specified**.
- Expected completed evidence: SAME-R.
- DAFT/DAFT-2 appears in the separate Instrument Context panel, never as a ranked candidate.

### Scenario C — droplet suppression

- Theme: suppression; phase: liquid droplet.
- Numeric physical inputs: **not specified**.
- Expected completed evidence: FLEX and FLEX-2.
- PSI-117 may appear as a contextual FLEX-derived modeling card with no measured table.

### Scenario D — Apollo 1 reconstruction

- Theme: prevention.
- Numeric physical inputs: **not specified**.
- CFI-G and Flame Design are nearest high-O₂ completed context, but gas-phase/microgravity.
- BASS-II and SAFFIRE-I are nearer solid-fuel context, but not at 100% O₂.
- No completed PSI record is a direct Apollo 1 reconstruction.
- Apollo 1 is an explanatory precedent, never a scoring input.

Numeric values marked “not specified” must not be interpolated. The responsible owner must add a cited ruling before the corresponding fixture gate.

## 8. Justification engine

### 8.1 Default template path

Every ranked result contains:

1. matched conditions with exact record and scenario values;
2. source references;
3. missing or mismatched dimensions;
4. conservative safety interpretation;
5. historical context only when an incident tag genuinely applies.

Template wording may say a record covers a condition only when the corresponding direct-match predicate is true. It must not use “covers” for an out-of-range condition.

### 8.2 Optional local Phi-3

`USE_LLM=false` by default. The optional profile must not change ranking or the committed template answers. If enabled, it must pass all gates:

1. generated numeric values match canonical records exactly;
2. cited PSI IDs exist in the snapshot;
3. no unsupported historical claim;
4. p95 generation latency below three seconds with cached outputs;
5. all curated validation scenarios pass citation and scope checks.

If any gate fails, the local model remains off. No hosted model client or API key is permitted.

## 9. Backend API

The implementation must expose stable JSON contracts:

| Method and path | Purpose |
|---|---|
| `GET /api/health` | service and snapshot status |
| `GET /api/catalog` | 24-record catalog and counts |
| `GET /api/investigations/{psi_id}` | record, provenance, and table preview |
| `GET /api/scenarios` | canonical scenario fixtures |
| `POST /api/rank` | deterministic results, breakdowns, coverage, gaps |
| `POST /api/compare` | comparison matrix for selected records |
| `GET /api/observations` | measured test points from ranked eligible evidence only; excludes anticipated, program-context, modeling, and instrument-context records |
| `GET /api/context` | incidents, Spinoff, instrument/program context |
| `POST /api/ask` | bounded cited template answer |

`POST /api/rank` returns at least:

```json
{
  "results": [
    {
      "psi_id": "PSI-25",
      "score": 0.0,
      "coverage": 0.5,
      "match_class": "partial_match",
      "dimensions": [
        {"name": "oxygen", "weight": 0.30, "similarity": 0.0, "present": true}
      ],
      "justification": "...",
      "limitations": ["..."]
    }
  ],
  "gap_statement": "..."
}
```

The exact response may add fields but must not omit the breakdown, coverage, provenance pointers, or gap statement.

## 10. Frontend

### 10.1 Tabs

1. **Overview** — corpus counts, evidence/theme/hardware distributions, top completed evidence, coverage warnings.
2. **Investigations** — search, filters, sorting, score breakdown, table preview, source/provenance.
3. **Compare** — two-to-four-record matrix, shared/different fields, optional Plotly parallel coordinates.
4. **Observed Flammability Map** — observed O₂/flow points only, optional translucent observed-domain hull.
5. **Historical & Earth Applications** — Apollo 1, Mir, Apollo 13, and NASA Spinoff cards, visibly separated from PSI evidence.
6. **PSI Intelligence / Q&A** — bounded retrieval questions, template answers with linked PSI citations, rocket/propellant scope guard.

### 10.2 Observed-map constraints

- No fitted curve, probability, confidence interval, extrapolation, or predictive legend.
- The hull label is exactly: **“Observed test domain; not a validated flammability boundary.”**
- Anticipated records, program-context records, `instrument_context` records (including PSI-47), and records without measured tables are absent from measured plots and the observation endpoint.
- FM2 and LUCI cannot appear as measured observations.

### 10.3 Accessibility and safety

- Keyboard-accessible controls, tabs, dialogs, and charts.
- Remote text is rendered as text, never injected as raw HTML.
- Responsive from mobile to large display.
- Dark-space visual system; blue for metadata/navigation, amber for flame conditions, cyan for comparisons/coverage.

## 11. Runtime and deployment

Two local services:

```text
frontend: nginx serving the production React build; proxies /api to backend
backend:  FastAPI/Uvicorn, Pydantic validation, SQLite/FTS5, NumPy cosine,
          deterministic ranking, template explanations
```

Required command:

```bash
docker compose up --build
```

The default backend does not load PyTorch or an embedding model. It loads the committed embedding matrix and performs cosine similarity with NumPy. The default image contains no optional LLM runtime.

## 12. Acceptance criteria

1. The snapshot contains exactly the VF-01 accessions and passes its SHA-256 check.
2. Seven records are deeply curated; remaining records are visibly metadata-only or context-only.
3. Scenario A reports an honest evidence gap.
4. Every ranked result exposes all six dimension slots (requested, present or missing, or not requested), weights, coverage, provenance pointers, and limitations.
5. Missing fields cannot improve a score.
6. Investigation comparison and observed-point visualization work.
7. Bounded Q&A returns cited template answers and refuses rocket/propellant questions.
8. The application runs locally without internet.
9. The default demo path contains no external model dependency.
10. Optional Phi-3 either passes every gate or remains disabled.
11. The observed map contains no fitted model or confidence interval.
12. Docker rehearsal, tests, and the documentation checker pass after the final mutation.

## 13. Implementation sequence

See [Team Execution Plan](07_TEAM_EXECUTION_PLAN.md). Phase gates are evidence-based; a prose assertion is not a completed gate.
