# Deep Research Report — PSI Annotation Proposal

> **Not a human sign-off.** This report was produced by an AI extraction pass.
> Data Safety §9 requires a named human reviewer before any annotation becomes
> `verified`. All seven records remain `metadata_only` pending that review.

- **Session date:** 2026-11-14
- **Executed by:** AI extraction pass (OpenCode agent)
- **Task:** Open 7 PSI detail pages + experimental tables; propose annotation rows; check claims in VERIFIED_FACTS.md; propose scenario values; output `data/annotations.json` + VERIFIED_FACTS.md updates + PROBLEM_LOG.md entries.
- **Status:** Proposal complete; human review pending. All seven records are `metadata_only`; Scenario A flow and Scenario B/D numeric inputs remain unruled.

---

## 1. Data sources accessed

| Source | URL | Method | Lines |
|--------|-----|--------|-------|
| PSI-159 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-159 | git-tracked `data/psi_snapshot.json` | — |
| PSI-10 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-10 | git-tracked `data/psi_snapshot.json` | — |
| PSI-101 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-101 | git-tracked `data/psi_snapshot.json` | — |
| PSI-98 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-98 | git-tracked `data/psi_snapshot.json` | — |
| PSI-25 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-25 | git-tracked `data/psi_snapshot.json` | — |
| PSI-69 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-69 | git-tracked `data/psi_snapshot.json` | — |
| PSI-68 snapshot record | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-68 | git-tracked `data/psi_snapshot.json` | — |
| CFI-G Inverse CSV | S3 (via PSI redirect) | `curl` live download | 1016 lines (1015 rows) |
| CFI-G Normal CSV | S3 (via PSI redirect) | `curl` live download | 180 lines (179 rows) |
| Flame Design Inverse CSV | S3 (via PSI redirect) | `curl` live download | 121 lines (120 rows) |
| Flame Design Normal CSV | S3 (via PSI redirect) | `curl` live download | 208 lines (207 rows) |
| SAME-R CSV | S3 (via PSI redirect) | `curl` live download | 110 lines (109 rows) |
| SAFFIRE-1 CSV | S3 (via PSI redirect) | `curl` live download | 5 lines (4 rows, 2 combustion) |
| BASS-II CSV | S3 (via PSI redirect) | `curl` live download | 130 lines (129 rows) |
| FLEX CSV | S3 (via PSI redirect) | `curl` live download | 275 lines (274 rows) |
| Flex2 CSV | S3 (via PSI redirect) | `curl` live download | 9 lines (8 rows) |

Raw CSVs are gitignored local scratch at `data/raw_csv/`; PSI-10 rows are not redistributed.

---

## 2. Per-record field extraction table

Each row = one physical field for one record. Source = table name + column, or narrative excerpt.

### PSI-159 — ACME CFI-G

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | 0.12 – 0.85 | fraction | CFI-G_Inverse Flames.csv → XO2 col, 154 rows, max=0.85, min=0.12 | reported | VF-07 |
| pressure | 7.18 – 48.01 | psia | CFI-G_Inverse Flames.csv → `approx p (bar)` col, min=0.4954, max=3.3099 bar; ×14.5038 | safely_derived | Wider range from inverse table |
| flow_velocity | null | — | No cm/s column in either table | null | Table has HC burnrate (mg/s) and O₂ flow rate (mg/s), not cm/s |
| gravity | 0.0 – 0.0 | g | PSI-159 narrative: "aboard the International Space Station"; project_type=microgravity | safely_derived | Single ISS gravity level |
| recorded_gravity_values | [0.0] | g | Same as above | safely_derived | — |
| recorded_flow_values | [] | cm/s | No cm/s column | null | — |
| fuel | propane, n-butane, ethane | — | CFI-G_Inverse Flames.csv → Fuel col; Normal Flames.csv → Fuel col | reported | — |
| fuel_phases | ["gas"] | — | sub_research_area='Flames of Gaseous Fuels'; approach: "spherical diffusion flame" | reported | — |
| safety_theme | prevention | — | Objectives: cool flame kinetics, extinction limits, flammability | reported | — |
| evidence_class | flame_physics | — | sub_research_area='Flames of Gaseous Fuels'; pure combustion physics | reported | — |

### PSI-10 — ACME / Flame Design

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | 0.198 – 0.849978 | fraction | Inverse Flame.csv → XO2 col, max=**0.849977932** (109 rows); Normal Flame.csv → XO2(init) col, max=0.40 (207 rows) | reported | VF-08. License unknown: table rows not redistributed |
| pressure | 6.24 – 44.20 | psia | Inverse Flame.csv → pinit(atm), min=0.4246, max=3.0076 atm; ×14.6959 | safely_derived | Wider range from inverse table |
| flow_velocity | null | — | No cm/s column in either table | null | — |
| gravity | 0.0 – 0.0 | g | project_type=microgravity; ISS + drop tower | safely_derived | — |
| recorded_gravity_values | [0.0] | g | Same | safely_derived | — |
| recorded_flow_values | [] | cm/s | No cm/s column | null | — |
| fuel | C2H4 (ethylene), C3H8 (propane) | — | Normal Flame.csv → Fuel col: C2H4, C3H8; Inverse col: XC2H4 implies ethylene | reported | — |
| fuel_phases | ["gas"] | — | sub_research_area='Flames of Gaseous Fuels' | reported | — |
| safety_theme | prevention | — | Objectives: extinction limits, soot-inception, flammability | reported | — |
| evidence_class | flame_physics | — | — | reported | — |

### PSI-101 — SAME-R

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | null | — | No O₂ column in SAME-R.csv | null | Smoke detection experiment |
| pressure | null | — | No pressure column in SAME-R.csv | null | — |
| flow_velocity | 0.0 – 8.1 | cm/s | SAME-R.csv → `Inlet velocity (cm/s)` col, min=0, max=8.1, 109 rows | reported | — |
| gravity | 0.0 – 0.0 | g | project_type=microgravity; ISS flight July–Sep 2010 | safely_derived | — |
| recorded_gravity_values | [0.0] | g | Same | safely_derived | — |
| recorded_flow_values | [0.0, 1.0, 2.0, 8.0, 8.1] | cm/s | SAME-R.csv → `Inlet velocity (cm/s)` col, unique values | reported | 5 discrete levels |
| fuel | Kapton, Lampwick, Pyrell, Silicone, Teflon | — | SAME-R.csv → Sample Type col | reported | Pyrolysis/smoldering sources |
| fuel_phases | ["solid"] | — | Approach: "pyrolyzing/smoldering source"; all materials are solids | reported | — |
| safety_theme | detection | — | Objectives: "relate particle size distribution to smoke detectors" | reported | — |
| evidence_class | detection_instrumentation | — | Title: Smoke Aerosol Measurement; objectives focus on detector response | reported | — |

### PSI-98 — SAFFIRE-I

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | 0.215 – 0.217 | fraction | SAFFIRE-1.csv → `Percent O2` col: S1="21.5-21.7", S2="~21.5"; ÷100 | safely_derived | Only 2 combustion rows |
| pressure | null | — | No pressure column in SAFFIRE-1.csv | null | — |
| flow_velocity | 20.0 – 20.0 | cm/s | SAFFIRE-1.csv → `Air Flow (cm/s)` col = 20 for both rows; approach_text confirms | reported | Single level |
| gravity | 0.0 – 0.0 | g | project_type=microgravity; Cygnus post-deberth | safely_derived | — |
| recorded_gravity_values | [0.0] | g | Same | safely_derived | — |
| recorded_flow_values | [20.0] | cm/s | SAFFIRE-1.csv → Air Flow col = 20 | reported | — |
| fuel | SIBAL fabric (75% cotton, 25% fiberglass) | — | SAFFIRE-1.csv → Material col = "SIBAL Fabric"; approach_text | reported | — |
| fuel_phases | ["solid"] | — | Approach: "large piece of flammable fabric" | reported | — |
| safety_theme | prevention | — | sub_research_area='Spacecraft Fire, Smoke Distribution'; objectives: flammability limits | reported | — |
| evidence_class | large_scale_demonstration | — | 0.94 m × 0.4 m SIBAL sample in Cygnus vehicle | reported | — |

### PSI-25 — BASS-II

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | 0.136 – 0.222 | fraction | BASS-II.csv → `Calibrated initial O2 % by vol` col, 129 rows, min=13.6%, max=22.2% | reported | VF-06. Final O₂ outliers (0.6%, 0.9%, 39.1%, 40.4%) stored separately; NOT in this range |
| pressure | null | — | No pressure column in BASS-II.csv | null | — |
| flow_velocity | 0.0 – 40.0 | cm/s | Approach_text: "airflow speeds up to 40 cm/s"; Air display col min=0 | safely_derived | No direct cm/s column; upper bound from narrative |
| gravity | 0.0 – 0.0 | g | project_type=microgravity; ISS MSG | safely_derived | — |
| recorded_gravity_values | [0.0] | g | Same | safely_derived | — |
| recorded_flow_values | [] | cm/s | No direct cm/s column; Fan/Air display are instrument readings | null | Cannot enumerate levels without cm/s calibration table |
| fuel | PMMA films/rods, SIBAL fabric, and other solids | — | BASS-II.csv → `Fuel Sample Material` col | reported | — |
| fuel_phases | ["solid"] | — | Objectives_text: "solid fuels burning in low-velocity forced flows" | reported | — |
| safety_theme | prevention | — | Objectives: ignition, spread, extinction limits (prevention); also suppression | reported | — |
| evidence_class | bench_flammability | — | Bench-scale solid fuel flammability in MSG wind tunnel | reported | — |

> [!CAUTION]
> BASS-II initial O₂ = 0.136–0.222. This record **must not** be described as "covering 30% O₂". P-001 / VF-06.

### PSI-69 — FLEX

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | 0.12 – 0.34 | fraction | FLEX.csv → `O initial ambient composition; mole fraction` col, 274 rows | reported | — |
| pressure | 10.18 – 44.86 | psia | FLEX.csv → `Ambient pressure; mmHg` col (non-zero), min=526.3, max=2319.9 mmHg; ×0.019337 | safely_derived | VF-16 |
| flow_velocity | null | — | No cm/s column in FLEX.csv | null | approach_text: "sub-buoyant convective flow" for some tests, but no table column |
| gravity | 0.0 – 0.0 | g | project_type=microgravity; ISS | safely_derived | — |
| recorded_gravity_values | [0.0] | g | Same | safely_derived | — |
| recorded_flow_values | [] | cm/s | No cm/s column | null | — |
| fuel | Methanol, Heptane | — | FLEX.csv → Fuel col | reported | — |
| fuel_phases | ["liquid_droplet"] | — | Objectives: "liquid fuels in microgravity"; approach: "burning behavior of large droplets" | reported | — |
| safety_theme | suppression | — | Objectives: "measure the effectiveness of fire suppressants (CO₂, He, SF₆)" | reported | — |
| evidence_class | suppression | — | Primary focus is suppressant efficacy and LOI | reported | — |

### PSI-68 — FLEX-2

| Field | Value | Unit | Source | Kind | Note |
|-------|-------|------|--------|------|------|
| oxygen_fraction | 0.17 – 0.30 | fraction | Flex2.csv → `Oxygen Mole Fraction` col: "0.17; 0.21; 0.25; 0.3" (all 8 rows) | reported | Table is parameter matrix, not test-point rows (P-018) |
| pressure | 7.35 – 44.09 | psia | Flex2.csv → `Ambient Pressure (atm)` col: "0.5; 1.0; 1.5; 2.0; or 3.0"; ×14.696 | safely_derived | — |
| flow_velocity | 0.1 – 5.0 | cm/s | Flex2.csv → `Flow Velocity (cm/s)` col: "0.1 - 5" (all rows) | reported | — |
| gravity | 0.0 – 0.0 | g | project_type=microgravity; ISS | safely_derived | — |
| recorded_gravity_values | [0.0] | g | Same | safely_derived | — |
| recorded_flow_values | [] | cm/s | Table is parameter matrix; no discrete enumerated flow test levels | null | P-018 |
| fuel | IsoOctane, n-Octane, Heptane, Decane, Ethanol, Propanol/Glycerol, Heptane/IsoOctane | — | Flex2.csv → `Sample (Fuel Type)` col | reported | — |
| fuel_phases | ["liquid_droplet"] | — | Objectives: "bi-component droplet combustion" | reported | — |
| safety_theme | suppression | — | Objectives: "Study flame extinction mechanisms"; bi-component droplets | reported | — |
| evidence_class | bench_flammability | — | Bench-scale droplet combustion with controlled atmosphere | reported | — |

---

## 3. Verification of specific claims

| Claim | Verdict | Evidence |
|-------|---------|----------|
| BASS-II initial O₂ = 0.136–0.222 | ✅ CONFIRMED | BASS-II.csv `Calibrated initial O2 % by vol` col: min=13.6%, max=22.2%, 129 rows |
| BASS-II final outliers 0.6%, 0.9%, 39.1%, 40.4% kept separate | ✅ CONFIRMED | Same column for final O₂: those exact values appear as 4 outliers |
| CFI-G inverse max XO₂ = 0.85 | ✅ CONFIRMED | CFI-G_Inverse Flames.csv XO2 col: max=0.850000 (154 numeric rows) — VF-07 |
| Flame Design inverse max XO₂ = 0.849977932 | ✅ CONFIRMED | Flame Design_Inverse Flame.csv XO2 col: max=0.849977932 (109 rows) — VF-08 |
| SLICE = gas-phase | ✅ UNCHANGED | VF-09 (PSI-106, not in this annotation pass; fact stands) |
| PSI-117 has no experimental table | ✅ UNCHANGED | VF-10 (not curated in this pass; fact stands) |

---

## 4. Scenario rulings

| Scenario | Field | Value | Source | Status |
|----------|-------|-------|--------|--------|
| A — Lunar habitat | O₂ | 0.30 | Product spec §7 | Pre-existing ruling |
| A — Lunar habitat | Pressure | 8.2 psia | Product spec §7 | Pre-existing ruling |
| A — Lunar habitat | Gravity | 0.16 g | Product spec §7 | Pre-existing ruling |
| A — Lunar habitat | **Flow** | **null** | No primary-source URL confirmed for 5 cm/s | ⚠️ **PENDING — P-017** |
| A — Lunar habitat | Phase | solid | Product spec §7 | Pre-existing ruling |
| A — Lunar habitat | Theme | prevention | Product spec §7 | Pre-existing ruling |
| B — Cabin detection | O₂ | null | No primary source URL/excerpt for the 0.21 candidate | ⚠️ **UNRULED** |
| B — Cabin detection | Pressure | null | No primary source URL/excerpt for the 14.7 psia candidate | ⚠️ **UNRULED** |
| C — Droplet suppression | Phase | liquid_droplet | Task specification | ✅ Ruled |
| C — Droplet suppression | Theme | suppression | Task specification | ✅ Ruled |
| D — Apollo 1 | O₂ | null | Apollo 1 is context only; historical values must not enter scoring (spec §7, T-025) | 🚫 **EXCLUDED** |
| D — Apollo 1 | Pressure | null | Apollo 1 is context only; historical values must not enter scoring (spec §7, T-025) | 🚫 **EXCLUDED** |

> [!IMPORTANT]
> **Scenario A flow is still null.** The demo gap statement must report flow as unspecified for Scenario A. The 5 cm/s candidate from SoFIE literature must be sourced from a directly-read primary URL before it can be entered as a ruled value. See P-017.

---

## 5. Outputs produced

| File | Description |
|------|-------------|
| `data/annotations.json` | 7 curated records with field-level provenance (51 provenance entries) + scenario rulings |
| `docs/VERIFIED_FACTS.md` | VF-14 through VF-20 added |
| `docs/02_PROBLEM_LOG.md` | P-017, P-018, P-019 added |
| `docs/DEEP_RESEARCH_SIGNOFF.md` | This file |
| `data/raw_csv/` | Local scratch only (gitignored); PSI-10 rows must not be redistributed |

---

## 6. What was NOT changed

- VF-01 through VF-13: unchanged — no new evidence contradicts them.
- Product spec `00_PRODUCT_SPEC.md`: unchanged — no schema conflicts found.
- `data/psi_snapshot.json`: unchanged — annotation data is separate from the snapshot.
- PSI-117 modeling status: unchanged.
- P-001 through P-016: unchanged.
- All seven `annotation_status` values are `metadata_only`, not `verified`; the extraction is a proposal, not a human confirmation.
- Scenario B and D numeric inputs are null; Apollo 1 is context only (spec §7, T-025).

---

## 7. Open items requiring follow-up

| ID | Action required |
|----|----------------|
| — | **Human review:** a named human reviewer confirms all seven records' numeric values and provenance, then sets `annotation_status=verified`. Until then, all records stay `metadata_only`. |
| P-017 | Read SoFIE program page directly; extract verbatim "5 cm/s" passage; add as `nasa_program` provenance; set Scenario A `flow_velocity_cms = 5.0` |
| — | Scenario B: either cite a primary ISS/NASA source with URL and verbatim excerpt for 0.21 and 14.7 psia, or leave both null. |
| — | Scenario D: keep numeric inputs null. Apollo 1 is context only (spec §7, T-025). |
| — | SAME-R pressure and O₂: table has no such columns. These will remain null unless a secondary SAME-R publication is cited. |
| — | BASS-II flow velocity: `recorded_flow_values` remains empty. The Fan/Air display columns are instrument readings; a calibration table (if one exists) would be needed to convert to cm/s. |
| — | PSI-10 license: remains unknown (P-016). No change. |
