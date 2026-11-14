# Verified Facts

This file is the evidence ledger for FireSight. It records observations made directly against the live NASA PSI API and official NASA pages. It is the highest-priority source for data claims; product wording must not exceed what the cited observation supports.

## Verification metadata

- **Verified at:** 2026-11-14T05:05:31Z (UTC)
- **Annotation pass:** 2026-11-14 (H1 delivery: seven curated records with 51 field-level provenance entries; all records maintained as `metadata_only` pending out-of-band named human review per Data Safety §9; downstream text indexing A3 and T-017 scenario test unblocked)
- **Primary data system:** NASA Physical Sciences Informatics (PSI)
- **Search URL:** <https://psi.nasa.gov/geode-py/ws/repo/search?ffield=Research%20Area&fvalue=Combustion%20Science>
- **Detail URL pattern:** <https://psi.nasa.gov/geode-py/ws/repo/investigations/{PSI-ID}>
- **Table download URL pattern:** <https://psi.nasa.gov/geode-py/ws/studies/{PSI-ID}/download?file={FILE}&version={VERSION}&redirect=false>
- **Snapshot SHA-256:** `596f50c614478bdc08a578fbde6ac6f27d87a30acfb9220e6d401b6e99be146a` for `data/psi_snapshot.json` (24 records, 22 verified table downloads). The authoritative manifest is `data/snapshot.sha256`; regenerate both with `python scripts/build_snapshot.py`.
- **Annotations SHA-256:** `330041ea9b576f7f5f540e9ca96bec9ade98008cca75587466fb885eb8682e96` for `data/annotations.json` (H1 delivery package; seven curated records; all `metadata_only` pending human review; 0 verified). Program-context inputs still need to join the manifest.
- **Evidence rule:** a value without a source observation is `null`; it is not estimated from memory or inferred silently.

## VF-01 — Exact combustion corpus has 24 records

The exact PSI filter `Research Area = Combustion Science` returned `hits.total = 24` and 24 result documents at the verification timestamp. The returned accessions were:

```text
PSI-142 PSI-62  PSI-60  PSI-26  PSI-106 PSI-98  PSI-117 PSI-115
PSI-47  PSI-100 PSI-39  PSI-102 PSI-159 PSI-101 PSI-25  PSI-99
PSI-22  PSI-107 PSI-21  PSI-20  PSI-23  PSI-10  PSI-69  PSI-68
```

**Use:** the canonical PSI snapshot must contain these 24 accessions, no more and no fewer.

## VF-02 — Two previously reported keyword extras are not combustion records

Detail requests confirmed that:

- `PSI-181` has `researchArea = Materials Science`; it concerns solder materials.
- `PSI-108` has `researchArea = Fluid Physics`; it concerns surface-tension-driven convection.

Neither record appears in the exact VF-01 result. A prior session reported a 26-record keyword result, but its exact request URL was not preserved and therefore was not independently reproduced. **Do not use 26 as a build invariant.** The reproducible invariant is the exact 24-record filter in VF-01.

## VF-03 — DAFT is currently inside the exact 24-record corpus

`PSI-47` is currently returned by VF-01 and its detail record states:

- title: `Dust and Aerosol Measurement Feasibility Test / Dust and Aerosol Measurement Feasibility Test-2`
- acronym: `DAFT / DAFT-2`
- `researchArea = Combustion Science`
- `subResearchArea = Spacecraft Fire Safety`
- one visible experimental table: `PSI-47_Experimental table_DAFT.csv`, version `2`, S3 version ID `O29jpvz.2oan3.Tf0_roWQeK9uZf5Tgx`

**Correction:** the earlier assumption that DAFT was outside the 24-record filter is stale. Removing it would silently reduce the exact corpus to 23. FireSight therefore retains PSI-47 in the 24-record catalog but assigns it the separate `instrument_context` catalog role. It is not a physical-ranking candidate and is not presented as completed fire-safety evidence.

## VF-04 — SAME-R and SAFFIRE-I IDs are valid

| Accession | Title | Acronym | Research area | Visible table |
|---|---|---|---|---|
| `PSI-101` | Smoke Aerosol Measurement Experiment-Reflight | SAME-R | Combustion Science | `PSI-101_Experimental table_SAME-R.csv`, v1 |
| `PSI-98` | Spacecraft Fire Safety Experiment-I | SAFFIRE-I | Combustion Science | `PSI-98_Experimental table_SAFFIRE-1.csv`, v1 |

**Use:** the approved curated set may use PSI-101 and PSI-98; no SAME/SAFFIRE-II substitution is required.

## VF-05 — FLEX and FLEX-2 are real PSI records with public tables

| Accession | Acronym | Evidence | Visible table |
|---|---|---|---|
| `PSI-69` | FLEX | Microgravity droplet combustion and gaseous-suppressant investigation | `PSI-69_Experimental table_FLEX.csv`, v1, S3 version `TParjCiGvSeDqRYFafCSaXSv1jLiimyd` |
| `PSI-68` | FLEX-2 | Microgravity bi-component droplet-combustion investigation | `PSI-68_Experimental table_Flex2.csv`, v1, S3 version `7Ky5xBhUl3Mmyj.f.ljQm9cWtzvLmMeh` |

PSI-69 describes measuring limiting oxygen index and suppressant effects for liquid-fuel droplets. PSI-68 describes benchmark experiments on bi-component droplet combustion, including extinction and model validation.

## VF-06 — BASS-II initial oxygen is 13.6–22.2%, not 30%+

PSI-25 detail identifies the table as `PSI-25_Experimental table_BASS-II.csv`, version 1, S3 version ID `..Z_cQ7ymWFmdISmAvT7c5Gcs7ZHo4N_`.

A CSV parse of all 129 data rows found:

- calibrated **initial** O₂ minimum: **13.6% by volume** (test `O12`);
- calibrated **initial** O₂ maximum: **22.2% by volume**;
- calibrated final O₂ values include four conspicuous outliers: **0.6%, 0.9%, 39.1%, and 40.4%**.

**Use:** the curated BASS-II oxygen range is 0.136–0.222 fraction. The anomalous final values are stored and labeled separately; they are not folded into the initial-condition range. BASS-II must not be described as covering a 30% O₂ scenario.

## VF-07 — CFI-G reaches 0.85 mole-fraction O₂

PSI-159 has two visible tables. In `PSI-159_Experimental table_CFI-G_Inverse Flames.csv`, the `XO2` column has 154 numeric rows and a maximum of **0.85**. The normal-flame table has a maximum initial O₂ of 0.3997.

**Use:** CFI-G is high-O₂ context. Its gaseous-fuel and microgravity evidence class remains distinct from solid-fuel lunar-habitat evidence.

## VF-08 — Flame Design reaches 0.849977932 mole-fraction O₂

PSI-10 has two visible tables. In `PSI-10_Experimental table_Flame Design_Inverse Flame.csv`, the `XO2` column has 109 numeric rows and a maximum of **0.849977932**. The normal-flame table has a maximum initial O₂ of 0.4.

**Use:** Flame Design is high-O₂ context, not evidence for solid-fuel behavior at partial gravity.

## VF-09 — SLICE is a gas-phase diffusion-flame investigation

PSI-106 states in its objective and hypothesis that it studies the structure and stability of **laminar diffusion flames** in microgravity.

**Use:** SLICE is gas-phase flame-physics evidence, not solid-material flammability evidence.

## VF-10 — PSI-117 is FLEX-derived CFD and has no experimental table

PSI-117 is titled `Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics: A Multidimensional Multi-Physics CFD Analysis`. Its approach says model fidelity was established against ISS FLEX measurements before controlled simulations. Its detail response contains no `experimentalTable` entries.

**Use:** PSI-117 is `modeling`, `partial`, and contextual only. It has no measured table and no physical score input in the default ranking.

## VF-11 — FM2, SoFIE, and FLARE are program context, not records in the 24-record PSI corpus

NASA's official Combustion Science page lists FM2, SoFIE, and FLARE as current combustion research:

- <https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/>
- <https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/>
- <https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/>
- <https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-limits-at-reduced-g-experiment-flare/>

None appears in VF-01. FM2 is therefore `anticipated_in_psi`; SoFIE is program context with no current PSI record; FLARE is program context with no current PSI record. The official LUCI page was not verified in this session, so LUCI may not be described as a measured PSI record or given an unverified source URL.

**Use:** anticipated or program-context entries live outside the 24-record measured catalog and can never appear on a measured-observation plot.

## VF-12 — Official historical context sources are available

The following official NASA pages were reachable at the verification timestamp:

- Apollo 1: <https://sma.nasa.gov/sma-disciplines/accllp/apollo-1>
- Apollo 13: <https://sma.nasa.gov/sma-disciplines/accllp/apollo-13>
- Mir fire: <https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/>
- Combustion Science program: <https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/>

Apollo 1, Mir, and Apollo 13 are explanatory context only. None is a numerical ranking input.

## VF-13 — NASA Spinoff context is thematic unless lineage is explicit

Official NASA Spinoff pages are available for fire detection, oxygen safety, and terrestrial suppression/equipment themes:

- <https://spinoff.nasa.gov/node/9407> — incipient fire detector that discriminates combustion particles from dust.
- <https://spinoff.nasa.gov/Spinoff2019/ps_2.html> — oxygen-safety gas regulators.
- <https://spinoff.nasa.gov/Spinoff2020/pdf/Spinoff2020.pdf> — public-safety equipment derived from spacecraft fire work.

**Use:** Spinoff cards are contextual and linked thematically to relevant PSI evidence. Do not claim direct lineage from a specific PSI investigation unless the source explicitly establishes it.

## VF-14 — SAFFIRE-I test conditions: 20 cm/s flow, ~21.5% O₂, SIBAL solid fabric

PSI-98 table `PSI-98_Experimental table_SAFFIRE-1.csv` (v1, S3 `_eNG2ATl_BkM8A7pV_lFCVUo5ptKZk3G`) contains 2 combustion rows (S1, S2):

| Row | Air Flow (cm/s) | Percent O₂ | Flow Direction |
|-----|----------------|-----------|---------------|
| S1  | 20             | 21.5–21.7 | Concurrent |
| S2  | 20             | ~21.5     | Opposed |

approach_text also states: *"Saffire-I was conducted at an air flow velocity of 20 cm/s."*

**Use:** SAFFIRE-I has a single recorded flow level of 20 cm/s and O₂ range 0.215–0.217 fraction. No pressure column appears in the table. Gravity = 0 g (Cygnus post-deberth microgravity).

## VF-15 — SAME-R inlet velocity levels are 0, 1, 2, 8, 8.1 cm/s; O₂/pressure not in table

`PSI-101_Experimental table_SAME-R.csv` (v1, S3 `.oPay0vhtdm5h57opgMlVjUs90TD6akh`) has 109 rows with an `Inlet velocity (cm/s)` column. Unique observed values: **0.0, 1.0, 2.0, 8.0, 8.1 cm/s**. Sample types: Kapton, Lampwick, Pyrell, Silicone, Teflon.

No O₂ fraction column, no pressure column, no gravity column appears in this table.

**Use:** SAME-R records five discrete inlet-velocity levels. flow_velocity range = 0–8.1 cm/s (table). recorded_flow_values = [0.0, 1.0, 2.0, 8.0, 8.1]. oxygen_fraction = null (no source). pressure = null (no source).

## VF-16 — FLEX (PSI-69) O₂ range is 0.12–0.34 fraction; pressures 10.2–44.9 psia; fuels Methanol and Heptane

`PSI-69_Experimental table_FLEX.csv` (v1, S3 `TParjCiGvSeDqRYFafCSaXSv1jLiimyd`) has 274 rows. Column `O initial ambient composition; mole fraction`: min = **0.12**, max = **0.34**. Column `Ambient pressure; mmHg` (non-zero): min = 526.3 mmHg = **10.18 psia**, max = 2319.9 mmHg = **44.86 psia**. Fuel column unique values: **Methanol, Heptane**.

**Use:** FLEX O₂ range 0.12–0.34 fraction; pressure range 10.18–44.86 psia (derived from mmHg column). Fuel phase: liquid_droplet. No cm/s flow column in table.

## VF-17 — FLEX-2 (PSI-68) O₂ 0.17–0.30, pressure 0.5–3.0 atm, flow 0.1–5 cm/s; 8 fuel types

`PSI-68_Experimental table_Flex2.csv` (v1, S3 `7Ky5xBhUl3Mmyj.f.ljQm9cWtzvLmMeh`) has 8 rows (one per fuel type). Key parameter values:

- **Oxygen Mole Fraction:** `0.17; 0.21; 0.25; 0.3` → range **0.17–0.30 fraction**
- **Ambient Pressure (atm):** `0.5; 1.0; 1.5; 2.0; or 3.0` → **7.35–44.09 psia**
- **Flow Velocity (cm/s):** `0.1 - 5` → range **0.1–5.0 cm/s**
- Fuels: IsoOctane, n-Octane, Heptane, Decane, Ethanol, Propanol/Glycerol mixtures, Heptane/IsoOctane

**Use:** FLEX-2 is a parameter-matrix table (not individual test-point rows). All fuel types share the same parameter ranges. Fuel phase: liquid_droplet.

## VF-18 — CFI-G (PSI-159) pressure range 0.495–3.310 bar = 7.18–48.01 psia; fuels propane, butane, ethane

`PSI-159_Experimental table_CFI-G_Inverse Flames.csv`: `approx p (bar)` column min = 0.4954 bar, max = 3.3099 bar. Converted: **7.18–48.01 psia**. Fuel column: propane, ethane, butane (and mixtures in Normal table). Both tables are ISS (project_type = microgravity), recorded_gravity_values = [0.0]. No cm/s flow column; flow parameterized by HC burnrate (mg/s) and O₂ flow rate (mg/s).

## VF-19 — Flame Design (PSI-10) pressure range 0.425–3.008 atm = 6.24–44.20 psia; fuels C2H4 and C3H8

`PSI-10_Experimental table_Flame Design_Inverse Flame.csv`: `pinit(atm)` column min = 0.4246 atm, max = 3.0076 atm. Converted: **6.24–44.20 psia**. Normal Flame table: 0.932–1.297 atm = 13.70–19.06 psia. Inverse table has the wider pressure range. Fuel column (Normal): C2H4, C3H8. Inverse table has XC2H4 column implying ethylene. No cm/s flow column in either table.

**Use:** PSI-10 license is unknown (P-016); table rows must not be redistributed. These values are reported as metadata/range summary only.

## VF-20 — Scenario ruling status (A, B, C, D)

- **Scenario A**: O₂ = 0.30, pressure = 8.2 psia, gravity = 0.16 g, phase = solid, theme = prevention are pre-existing spec values. Flow remains **null** (P-017): the 5 cm/s candidate has no directly-read primary URL with a verbatim excerpt.
- **Scenario B**: numeric inputs remain **unruled**. The ISS engineering-baseline candidates (0.21 fraction, 14.7 psia) have no primary source URL/excerpt and are not verified facts.
- **Scenario C**: theme = suppression, phase = liquid_droplet. No numeric ruling required.
- **Scenario D**: numeric inputs remain **unruled**. Apollo 1 is explanatory context only and must never enter scoring (Product Spec §7; T-025). The Apollo 1 page is a context source, not a scenario input.

## VF-21 — H1 delivery and Scenario A direct gap (T-017)

- **H1 delivery:** Seven records (`PSI-159`, `PSI-10`, `PSI-101`, `PSI-98`, `PSI-25`, `PSI-69`, `PSI-68`) are curated in `data/annotations.json` with 51 field-level provenance entries. Under Data Safety §9, all seven records are maintained with `annotation_status = "metadata_only"` and `_human_review.status = "pending"` pending out-of-band named human review.
- **T-017 scenario gap verified:** Scenario A (0.30 O₂, 8.2 psia, 0.16 g, null flow, solid fuel, prevention theme) produces zero `direct_match` results against canonical records. Canonical records evaluate to `contextual_only` under `metadata_only` status. Furthermore, under physical ranking rules, the partial-gravity condition (0.16 g vs 0.0 g microgravity in all PSI combustion records) and the unspecified flow dimension (|Q(S)| = 5 < 6) guarantee that no record can achieve `direct_match`, confirming the T-017 invariant.
- **Downstream unblocking:** Downstream A3 derived index (SQLite/FTS5) and text embeddings from canonical text metadata are unblocked.

## Corrections controlled by this ledger

1. BASS-II initial O₂ is 0.136–0.222, not 0.30+.
2. CFI-G and Flame Design are high-O₂ but gas-phase/microgravity context.
3. SLICE is gas-phase.
4. SAME-R and SAFFIRE-I are valid; no substitution is needed.
5. FLEX and FLEX-2 are available and have public tables.
6. PSI-117 is modeling-only and has no experimental table.
7. DAFT is currently in the exact 24-record filter; retain it as instrument context, not ranked evidence.
8. FM2, SoFIE, and FLARE are not current PSI catalog records.
9. Historical incidents and Spinoff cases are context, never ranking inputs.
