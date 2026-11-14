"""Representative H0 mock payloads.

Numbers and identifiers come from the Verified Facts ledger. Table rows are
intentionally empty: the canonical snapshot and curated annotations arrive in
H1, and this module must not invent measurements.
"""

from __future__ import annotations

from urllib.parse import quote

from .api_models import (
    AskResponse,
    CatalogCounts,
    CatalogEntry,
    CatalogResponse,
    Citation,
    CompareResponse,
    CompareRow,
    ContextCard,
    ContextResponse,
    DimensionScore,
    HealthResponse,
    InvestigationResponse,
    ObservationPoint,
    ObservationsResponse,
    RankedResult,
    RankResponse,
    ScenarioFixture,
    ScenariosResponse,
    TablePreview,
)
from .models import (
    ExperimentalTable,
    InvestigationRecord,
    ProgramContext,
    Provenance,
    Range,
    Scenario,
)

PSI_SEARCH_URL = (
    "https://psi.nasa.gov/geode-py/ws/repo/search"
    "?ffield=Research%20Area&fvalue=Combustion%20Science"
)
DETAIL_URL = "https://psi.nasa.gov/geode-py/ws/repo/investigations/{psi_id}"
TABLE_URL = (
    "https://psi.nasa.gov/geode-py/ws/studies/{psi_id}/download"
    "?file={file_name}&version={version}&redirect=false"
)
COMBUSTION_SCIENCE_URL = (
    "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/"
    "physical-sciences-program/combustion-science/"
)
FM2_URL = (
    "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/"
    "physical-sciences-program/combustion-science/"
    "flammability-of-materials-on-the-moon-fm2/"
)
SOFIE_URL = (
    "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/"
    "physical-sciences-program/combustion-science/"
    "solid-fuel-ignition-and-extinction-sofie/"
)
FLARE_URL = (
    "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/"
    "physical-sciences-program/combustion-science/"
    "flammability-limits-at-reduced-g-experiment-flare/"
)
APOLLO_1_URL = "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1"
APOLLO_13_URL = "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13"
MIR_URL = (
    "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/"
)
SPINOFF_DETECTOR_URL = "https://spinoff.nasa.gov/node/9407"
SPINOFF_OXYGEN_URL = "https://spinoff.nasa.gov/Spinoff2019/ps_2.html"
SPINOFF_EQUIPMENT_URL = "https://spinoff.nasa.gov/Spinoff2020/pdf/Spinoff2020.pdf"


def _detail_url(psi_id: str) -> str:
    return DETAIL_URL.format(psi_id=psi_id)


def _table_url(psi_id: str, file_name: str, version: int) -> str:
    return TABLE_URL.format(
        psi_id=psi_id, file_name=quote(file_name), version=version
    )


def _provenance(
    url: str,
    kind: str,
    excerpt: str,
    note: str | None = None,
    value_kind: str = "reported",
) -> Provenance:
    return Provenance(
        source_url=url,
        source_kind=kind,
        excerpt=excerpt,
        note=note,
        value_kind=value_kind,
    )


def _table(
    psi_id: str,
    file_name: str,
    version: int,
    s3_version_id: str,
) -> ExperimentalTable:
    return ExperimentalTable(
        psi_id=psi_id,
        file_name=file_name,
        version=version,
        s3_version_id=s3_version_id,
        download_url=_table_url(psi_id, file_name, version),
        columns=[],
        rows=[],
        provenance=_provenance(
            _table_url(psi_id, file_name, version),
            "psi_table",
            f"{file_name}, version {version}, S3 version ID {s3_version_id}.",
            note="H0 mock keeps rows empty; curated rows arrive in H1.",
        ),
    )


BASS_II_OXYGEN = _provenance(
    _table_url("PSI-25", "PSI-25_Experimental table_BASS-II.csv", 1),
    "psi_table",
    "Calibrated initial O2 minimum 13.6% by volume (test O12); maximum 22.2%.",
    note="Initial conditions only; final O2 outliers 0.6%, 0.9%, 39.1%, and 40.4% remain separate.",
    value_kind="reported",
)
BASS_II_PHASE = _provenance(
    _detail_url("PSI-25"),
    "psi_narrative",
    "Study the ignition, flame growth, flame spread, and extinction limits for solid fuels burning in low-velocity forced flows in microgravity.",
    note="Solid fuel phase taken from the stated BASS-II objective.",
)
BASS_II_THEME = _provenance(
    _detail_url("PSI-25"),
    "psi_narrative",
    "BASS-II results contribute to the combustion computational models used in the design of fire detection and suppression systems in microgravity and on Earth.",
    note="Primary safety theme curated as prevention; suppression is secondary.",
    value_kind="safely_derived",
)
FLEX_PHASE = _provenance(
    _detail_url("PSI-69"),
    "psi_narrative",
    "The FLEX investigation aims to map the flammability limits of liquid fuels in microgravity environments and measure the effectiveness of gaseous fire suppressants.",
    note="Liquid-droplet phase taken from the stated FLEX objective.",
)
FLEX_THEME = _provenance(
    _detail_url("PSI-69"),
    "psi_narrative",
    "Measure the effectiveness of various gaseous fire suppressants such as CO2, He, and SF6.",
    note="Primary safety theme curated as suppression.",
    value_kind="safely_derived",
)
FLEX2_PHASE = _provenance(
    _detail_url("PSI-68"),
    "psi_narrative",
    "Provide benchmark experimental data on bi-component droplet combustion over a wide range of initial conditions.",
    note="Liquid-droplet phase taken from the stated FLEX-2 objective.",
)
FLEX2_THEME = _provenance(
    _detail_url("PSI-68"),
    "psi_narrative",
    "Benchmark experimental data on bi-component droplet combustion, including extinction and model validation.",
    note="Primary safety theme curated as suppression; the evidence class remains flame physics.",
    value_kind="safely_derived",
)
CFI_G_FUEL = _provenance(
    _detail_url("PSI-159"),
    "psi_narrative",
    "Determine the conditions for which cool diffusion flames occur for propane, n-butane, and n-pentane.",
    note="Gaseous fuel and gas phase taken from the stated CFI-G objective.",
)
CFI_G_THEME = _provenance(
    _detail_url("PSI-159"),
    "psi_narrative",
    "Determine the conditions for which cool diffusion flames occur.",
    note="Primary safety theme curated as prevention for flame-physics context.",
    value_kind="safely_derived",
)
FLAME_DESIGN_FUEL = _provenance(
    _detail_url("PSI-10"),
    "psi_narrative",
    "Obtain soot-inception limits ... for C2H4 and CH4 flames.",
    note="Gaseous fuel and gas phase taken from the stated Flame Design objective.",
)
FLAME_DESIGN_THEME = _provenance(
    _detail_url("PSI-10"),
    "psi_narrative",
    "Obtain soot-inception limits of quasi-steady normal and inverse spherical diffusion flames.",
    note="Primary safety theme curated as prevention for flame-physics context.",
    value_kind="safely_derived",
)
SAFFIRE_FUEL = _provenance(
    _detail_url("PSI-98"),
    "psi_narrative",
    "The sample material for Saffire-I is a composite fabric called Sibal consisting of cotton on a fiberglass substrate (75% cotton, 25% fiberglass by weight).",
    note="Solid fuel phase taken from the stated SAFFIRE-I approach.",
)
SAFFIRE_THEME = _provenance(
    _detail_url("PSI-98"),
    "psi_narrative",
    "Determine how rapidly a large scale fire grows in low-gravity.",
    note="Primary safety theme curated as prevention.",
    value_kind="safely_derived",
)
SAME_R_THEME = _provenance(
    _detail_url("PSI-101"),
    "psi_narrative",
    "Quantify the sizes that the liquid smoke particulate achieves in low gravity.",
    note="Primary safety theme curated as detection instrumentation.",
    value_kind="safely_derived",
)
DAFT_THEME = _provenance(
    _detail_url("PSI-47"),
    "psi_narrative",
    "Mitigate the risk for the Smoke Aerosol Measurement Experiment (SAME).",
    note="Detection instrument context; not flame-spread evidence.",
    value_kind="safely_derived",
)

BASS_II = InvestigationRecord(
    psi_id="PSI-25",
    title="Burning and Suppression of Solids - II",
    acronym="BASS-II",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="bench_flammability",
    safety_theme="prevention",
    secondary_safety_themes=["suppression"],
    fuel_phases=["solid"],
    oxygen_fraction=Range(
        min=0.136,
        max=0.222,
        unit="fraction",
        notes="Calibrated initial O2; final outliers are excluded.",
    ),
    objectives_text=(
        "Study the ignition, flame growth, flame spread, and extinction limits for "
        "solid fuels burning in low-velocity forced flows in microgravity, and help "
        "bridge ground-based material flammability screening to microgravity behavior."
    ),
    approach_text=(
        "Microgravity combustion tests aboard the International Space Station used a "
        "small wind tunnel with airflow speeds up to 40 cm/s and oxygen varied by "
        "adding diluent."
    ),
    experimental_tables=[
        _table(
            "PSI-25",
            "PSI-25_Experimental table_BASS-II.csv",
            1,
            "..Z_cQ7ymWFmdISmAvT7c5Gcs7ZHo4N_",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/4qc4-de67",
    license="CC0-1.0",
    source_url=_detail_url("PSI-25"),
    provenance={
        "oxygen_fraction": BASS_II_OXYGEN,
        "fuel_phases": BASS_II_PHASE,
        "safety_theme": BASS_II_THEME,
    },
)

DAFT = InvestigationRecord(
    psi_id="PSI-47",
    title=(
        "Dust and Aerosol Measurement Feasibility Test / "
        "Dust and Aerosol Measurement Feasibility Test-2"
    ),
    acronym="DAFT / DAFT-2",
    research_area="Combustion Science",
    project_type="microgravity",
    catalog_role="instrument_context",
    evidence_class="detection_instrumentation",
    safety_theme="detection",
    objectives_text=(
        "Mitigate smoke-aerosol measurement risk for SAME by testing a modified "
        "P-Trak particulate counter in microgravity."
    ),
    approach_text=(
        "Modify the TSI P-Trak condenser for capillary isopropyl-alcohol recycling "
        "and test it with Arizona Red Dust aerosol in microgravity."
    ),
    experimental_tables=[
        _table(
            "PSI-47",
            "PSI-47_Experimental table_DAFT.csv",
            2,
            "O29jpvz.2oan3.Tf0_roWQeK9uZf5Tgx",
        )
    ],
    data_status="complete",
    annotation_status="metadata_only",
    doi="10.60555/ztgj-d202",
    license="CC0-1.0",
    source_url=_detail_url("PSI-47"),
    provenance={"safety_theme": DAFT_THEME},
)

FLEX_DERIVED_MODEL = InvestigationRecord(
    psi_id="PSI-117",
    title=(
        "Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics: "
        "A Multidimensional Multi-Physics CFD Analysis"
    ),
    research_area="Combustion Science",
    project_type="ground",
    evidence_class="modeling",
    objectives_text=(
        "Use FLEX flight data to quantify how external thermal and convective "
        "perturbations regulate droplet cool-flame dynamics."
    ),
    approach_text=(
        "A 3-D OpenFOAM model of n-alkane droplet cool flames was validated against "
        "ISS FLEX measurements before controlled simulations."
    ),
    data_status="partial",
    annotation_status="metadata_only",
    doi="10.60555/gz0q-b577",
    license="CC0-1.0",
    source_url=_detail_url("PSI-117"),
)

CFI_G = InvestigationRecord(
    psi_id="PSI-159",
    title=(
        "Advanced Combustion via Microgravity Experiments / "
        "Cool Flames Investigation with Gases"
    ),
    acronym="ACME CFI-G",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="flame_physics",
    safety_theme="prevention",
    fuel="propane, n-butane, n-pentane",
    fuel_phases=["gas"],
    objectives_text=(
        "Determine the conditions for which cool diffusion flames occur for propane, "
        "n-butane, and n-pentane across normal and inverse flames."
    ),
    approach_text=(
        "Perform spherical diffusion flame tests aboard the International Space "
        "Station across fuels, reactant dilutions, flow rates, and pressures."
    ),
    experimental_tables=[
        _table(
            "PSI-159",
            "PSI-159_Experimental table_CFI-G_Inverse Flames.csv",
            1,
            "n3Zpkz..GSnB2jgO4PjIOmXhx_AbOG.5",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/cyt1-kh64",
    license="CC0-1.0",
    source_url=_detail_url("PSI-159"),
    provenance={
        "fuel": CFI_G_FUEL,
        "fuel_phases": CFI_G_FUEL,
        "safety_theme": CFI_G_THEME,
    },
)

FLAME_DESIGN = InvestigationRecord(
    psi_id="PSI-10",
    title="Advanced Combustion via Microgravity Experiments / Flame Design",
    acronym="ACME/Flame Design",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="flame_physics",
    safety_theme="prevention",
    fuel="C2H4 and CH4",
    fuel_phases=["gas"],
    objectives_text=(
        "Obtain soot-inception limits of quasi-steady normal and inverse spherical "
        "diffusion flames for C2H4 and CH4 flames."
    ),
    approach_text=(
        "Perform spherical diffusion flame tests in drop towers and aboard the "
        "International Space Station across dilutions, flow rates, and pressures."
    ),
    experimental_tables=[
        _table(
            "PSI-10",
            "PSI-10_Experimental table_Flame Design_Inverse Flame.csv",
            1,
            "nh7js1HZYURqkuJrR16wzSEyOekz__PS",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/w4zy-bt45",
    license=None,
    source_url=_detail_url("PSI-10"),
    provenance={
        "fuel": FLAME_DESIGN_FUEL,
        "fuel_phases": FLAME_DESIGN_FUEL,
        "safety_theme": FLAME_DESIGN_THEME,
    },
)

SAME_R = InvestigationRecord(
    psi_id="PSI-101",
    title="Smoke Aerosol Measurement Experiment-Reflight",
    acronym="SAME-R",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="detection_instrumentation",
    safety_theme="detection",
    objectives_text=(
        "Quantify smoke particulate sizes in low gravity and relate droplet size "
        "distribution to smoke generation and transport conditions."
    ),
    approach_text=(
        "SAME-R reused SAME on-orbit hardware with a new test material, broader test "
        "conditions, and the in-house M-pass instrument."
    ),
    experimental_tables=[
        _table(
            "PSI-101",
            "PSI-101_Experimental table_SAME-R.csv",
            1,
            ".oPay0vhtdm5h57opgMlVjUs90TD6akh",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/2np7-jv14",
    license="CC0-1.0",
    source_url=_detail_url("PSI-101"),
    provenance={"safety_theme": SAME_R_THEME},
)

SAFFIRE_I = InvestigationRecord(
    psi_id="PSI-98",
    title="Spacecraft Fire Safety Experiment-I",
    acronym="SAFFIRE-I",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="large_scale_demonstration",
    safety_theme="prevention",
    fuel="Sibal (75% cotton, 25% fiberglass)",
    fuel_phases=["solid"],
    objectives_text=(
        "Determine how rapidly a large-scale fire grows in low gravity and "
        "investigate low-g flammability limits against normal-gravity screening."
    ),
    approach_text=(
        "Saffire-I burned a 0.94 m by 0.4 m Sibal fabric sample aboard a deberthed "
        "Cygnus resupply vehicle."
    ),
    experimental_tables=[
        _table(
            "PSI-98",
            "PSI-98_Experimental table_SAFFIRE-1.csv",
            1,
            "_eNG2ATl_BkM8A7pV_lFCVUo5ptKZk3G",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/0t15-1z43",
    license="CC0-1.0",
    source_url=_detail_url("PSI-98"),
    provenance={
        "fuel": SAFFIRE_FUEL,
        "fuel_phases": SAFFIRE_FUEL,
        "safety_theme": SAFFIRE_THEME,
    },
)

FLEX = InvestigationRecord(
    psi_id="PSI-69",
    title="Flame Extinguishment Experiment",
    acronym="FLEX",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="bench_flammability",
    safety_theme="suppression",
    secondary_safety_themes=["prevention"],
    fuel="liquid fuels",
    fuel_phases=["liquid_droplet"],
    objectives_text=(
        "Map the flammability limits of liquid fuels in microgravity and measure the "
        "effectiveness of gaseous fire suppressants such as CO2, He, and SF6."
    ),
    approach_text=(
        "Ignite and observe large droplets, determining limiting oxygen index as a "
        "function of ambient pressure and suppressant presence."
    ),
    experimental_tables=[
        _table(
            "PSI-69",
            "PSI-69_Experimental table_FLEX.csv",
            1,
            "TParjCiGvSeDqRYFafCSaXSv1jLiimyd",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/mbq8-0451",
    license="CC0-1.0",
    source_url=_detail_url("PSI-69"),
    provenance={
        "fuel": FLEX_PHASE,
        "fuel_phases": FLEX_PHASE,
        "safety_theme": FLEX_THEME,
    },
)

FLEX_2 = InvestigationRecord(
    psi_id="PSI-68",
    title="Flame Extinguishment Experiment - 2",
    acronym="FLEX-2",
    research_area="Combustion Science",
    project_type="microgravity",
    evidence_class="flame_physics",
    safety_theme="suppression",
    fuel="bi-component fuel droplets",
    fuel_phases=["liquid_droplet"],
    objectives_text=(
        "Extend FLEX results to fuels and conditions that mimic real combustor "
        "conditions and provide benchmark bi-component droplet-combustion data."
    ),
    approach_text=(
        "Vary chamber pressure from 0.5 to 3.0 atm and O2 concentration from 0.1 to "
        "0.4 mole fraction before dispensing a target fuel droplet."
    ),
    experimental_tables=[
        _table(
            "PSI-68",
            "PSI-68_Experimental table_Flex2.csv",
            1,
            "7Ky5xBhUl3Mmyj.f.ljQm9cWtzvLmMeh",
        )
    ],
    data_status="complete",
    annotation_status="verified",
    doi="10.60555/byp8-h018",
    license="CC0-1.0",
    source_url=_detail_url("PSI-68"),
    provenance={
        "fuel": FLEX2_PHASE,
        "fuel_phases": FLEX2_PHASE,
        "safety_theme": FLEX2_THEME,
    },
)

MOCK_RECORDS = {
    record.psi_id: record
    for record in [
        BASS_II,
        DAFT,
        FLEX_DERIVED_MODEL,
        CFI_G,
        FLAME_DESIGN,
        SAME_R,
        SAFFIRE_I,
        FLEX,
        FLEX_2,
    ]
}

_CATALOG_META = [
    ("PSI-10", "Advanced Combustion via Microgravity Experiments / Flame Design", "ACME/Flame Design", "microgravity"),
    ("PSI-100", "Spacecraft Fire Experiment-III", "SAFFIRE-III", "microgravity"),
    ("PSI-101", "Smoke Aerosol Measurement Experiment-Reflight", "SAME-R", "microgravity"),
    ("PSI-102", "Smoke and Aerosol Measurement Experiment", "SAME", "microgravity"),
    ("PSI-106", "Structure and Liftoff In Combustion Experiment", "SLICE", "microgravity"),
    ("PSI-107", "Smoke Point In Co-flow Experiment", "SPICE", "microgravity"),
    ("PSI-115", "Utilization of the Smoke Aerosol Measurement Experiment Data for Advanced Modeling and Simulation of Smoke Generation in Micro-Gravity", None, "ground"),
    ("PSI-117", "Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics: A Multidimensional Multi-Physics CFD Analysis", None, "ground"),
    ("PSI-142", "Quantitative Studies of Cool Flame Transitions at Radiation / Stretch Extinction Using Counterflow Flames", None, "ground"),
    ("PSI-159", "Advanced Combustion via Microgravity Experiments / Cool Flames Investigation with Gases", "ACME CFI-G", "microgravity"),
    ("PSI-20", "Advanced Combustion via Microgravity Experiments - Burning Rate Emulator", "ACME BRE", "microgravity"),
    ("PSI-21", "Advanced Combustion via Microgravity Experiments / Coflow Laminar Diffusion Flame", "ACME CLD Flame", "microgravity"),
    ("PSI-22", "Advanced Combustion via Microgravity Experiments Electric-Field Effects on Laminar Diffusion Flames", "ACME E-FIELD Flames", "microgravity"),
    ("PSI-23", "Advanced Combustion via Microgravity Experiments-Structure and Response of Spherical Diffusion Flames", "ACME s-Flame", "microgravity"),
    ("PSI-25", "Burning and Suppression of Solids - II", "BASS-II", "microgravity"),
    ("PSI-26", "Burning and Suppression of Solids", "BASS", "microgravity"),
    ("PSI-39", "Cool Flames Investigation", "CFI", "microgravity"),
    ("PSI-47", "Dust and Aerosol Measurement Feasibility Test / Dust and Aerosol Measurement Feasibility Test-2", "DAFT / DAFT-2", "microgravity"),
    ("PSI-60", "Computational and Experimental Analysis of SPICE Data Sets", None, "ground"),
    ("PSI-62", "Concurrent Flame Spread Modeling using Flamelet Generated Manifolds in Microgravity with Comparison to BASS Experiments using Two-Color Tomography", None, "ground"),
    ("PSI-68", "Flame Extinguishment Experiment - 2", "FLEX-2", "microgravity"),
    ("PSI-69", "Flame Extinguishment Experiment", "FLEX", "microgravity"),
    ("PSI-98", "Spacecraft Fire Safety Experiment-I", "SAFFIRE-I", "microgravity"),
    ("PSI-99", "Spacecraft Fire Experiment-II", "SAFFIRE-II", "microgravity"),
]


def _catalog_entry(psi_id: str, title: str, acronym: str | None, project_type: str) -> CatalogEntry:
    record = MOCK_RECORDS.get(psi_id)
    return CatalogEntry(
        psi_id=psi_id,
        title=title,
        acronym=acronym,
        project_type=project_type,
        catalog_role=record.catalog_role if record else "evidence",
        data_status=record.data_status if record else None,
        annotation_status=record.annotation_status if record else "metadata_only",
        evidence_class=record.evidence_class if record else None,
        safety_theme=record.safety_theme if record else None,
        source_url=_detail_url(psi_id),
    )


CATALOG = [_catalog_entry(*meta) for meta in _CATALOG_META]
CATALOG.sort(key=lambda entry: entry.psi_id)

_evidence_class_counts: dict[str, int] = {}
for _entry in CATALOG:
    if _entry.evidence_class is not None:
        _evidence_class_counts[_entry.evidence_class] = (
            _evidence_class_counts.get(_entry.evidence_class, 0) + 1
        )

MOCK_CATALOG = CatalogResponse(
    counts=CatalogCounts(
        total=len(CATALOG),
        evidence=sum(entry.catalog_role == "evidence" for entry in CATALOG),
        instrument_context=sum(
            entry.catalog_role == "instrument_context" for entry in CATALOG
        ),
        verified=sum(entry.annotation_status == "verified" for entry in CATALOG),
        metadata_only=sum(
            entry.annotation_status == "metadata_only" for entry in CATALOG
        ),
        by_evidence_class=_evidence_class_counts,
    ),
    records=CATALOG,
)

SCENARIOS = [
    ScenarioFixture(
        id="A",
        name="Lunar habitat",
        description="Solid-fuel fire prevention at 30% O2, 8.2 psia, and 0.16 g.",
        scenario=Scenario(
            oxygen_fraction=0.30,
            pressure_psia=8.2,
            gravity_g=0.16,
            flow_velocity_cms=None,
            fuel_phase="solid",
            safety_theme="prevention",
        ),
        expected_invariant=(
            "Zero direct_match records; the gap names the solid-fuel, 30% O2, "
            "8.2 psia, partial-gravity combination; FM2 remains anticipated."
        ),
        numeric_inputs_complete=False,
    ),
    ScenarioFixture(
        id="B",
        name="Cabin detection",
        description="Cabin smoke/fire detection theme; numeric inputs not specified.",
        scenario=Scenario(safety_theme="detection"),
        expected_invariant=(
            "SAME-R is present; DAFT stays outside ranked results; detector evidence "
            "is not presented as flame-spread evidence."
        ),
        numeric_inputs_complete=False,
    ),
    ScenarioFixture(
        id="C",
        name="Droplet suppression",
        description="Liquid-droplet suppression theme; numeric inputs not specified.",
        scenario=Scenario(fuel_phase="liquid_droplet", safety_theme="suppression"),
        expected_invariant=(
            "FLEX and FLEX-2 are present; PSI-117, if shown, is modeling context "
            "with no measured table."
        ),
        numeric_inputs_complete=False,
    ),
    ScenarioFixture(
        id="D",
        name="Apollo 1 reconstruction",
        description="Prevention theme; numeric inputs not specified.",
        scenario=Scenario(safety_theme="prevention"),
        expected_invariant=(
            "No direct_match claim; high-O2 gas-phase context and solid-fuel context "
            "remain separated; Apollo 1 appears only as context."
        ),
        numeric_inputs_complete=False,
    ),
]

MOCK_SCENARIOS = ScenariosResponse(scenarios=SCENARIOS)

_DIMENSION_WEIGHTS = [
    ("oxygen", 0.30),
    ("pressure", 0.20),
    ("gravity", 0.20),
    ("flow", 0.10),
    ("material_phase", 0.10),
    ("safety_theme", 0.10),
]


def _dimensions(
    requested: set[str],
    available: dict[str, tuple[str, Provenance]],
    similarities: dict[str, float],
    scenario_values: dict[str, str],
    limitations: dict[str, str],
) -> list[DimensionScore]:
    dimensions: list[DimensionScore] = []
    for name, weight in _DIMENSION_WEIGHTS:
        is_requested = name in requested
        present = name in available
        if is_requested:
            similarity = similarities.get(name, 0.0) if present else 0.0
        else:
            similarity = None
        dimensions.append(
            DimensionScore(
                name=name,
                weight=weight,
                requested=is_requested,
                present=present,
                similarity=similarity,
                record_value=available[name][0] if present else None,
                scenario_value=scenario_values.get(name) if is_requested else None,
                provenance=available[name][1] if present else None,
                limitation=limitations.get(name),
            )
        )
    return dimensions


_SCENARIO_A_DIMS = _dimensions(
    requested={"oxygen", "pressure", "gravity", "material_phase", "safety_theme"},
    available={
        "oxygen": ("0.136–0.222 fraction", BASS_II_OXYGEN),
        "material_phase": ("solid", BASS_II_PHASE),
        "safety_theme": ("prevention", BASS_II_THEME),
    },
    similarities={"oxygen": 0.0, "material_phase": 1.0, "safety_theme": 1.0},
    scenario_values={
        "oxygen": "0.30",
        "pressure": "8.2 psia",
        "gravity": "0.16 g",
        "material_phase": "solid",
        "safety_theme": "prevention",
    },
    limitations={
        "oxygen": "BASS-II initial O2 is 0.136–0.222; the 0.30 scenario lies outside tolerance.",
        "pressure": "No pressure range is curated for BASS-II.",
        "gravity": "No explicit recorded gravity level is curated for BASS-II.",
        "flow": "Scenario flow is not specified, so flow is outside Q(S).",
    },
)

_SCENARIO_C_DIMS = _dimensions(
    requested={"material_phase", "safety_theme"},
    available={
        "material_phase": ("liquid_droplet", FLEX_PHASE),
        "safety_theme": ("suppression", FLEX_THEME),
    },
    similarities={"material_phase": 1.0, "safety_theme": 1.0},
    scenario_values={"material_phase": "liquid_droplet", "safety_theme": "suppression"},
    limitations={
        name: "Scenario numeric input is not specified; dimension is outside Q(S)."
        for name in ("oxygen", "pressure", "gravity", "flow")
    },
)

_SCENARIO_C_DIMS_FLEX2 = _dimensions(
    requested={"material_phase", "safety_theme"},
    available={
        "material_phase": ("liquid_droplet", FLEX2_PHASE),
        "safety_theme": ("suppression", FLEX2_THEME),
    },
    similarities={"material_phase": 1.0, "safety_theme": 1.0},
    scenario_values={"material_phase": "liquid_droplet", "safety_theme": "suppression"},
    limitations={
        name: "Scenario numeric input is not specified; dimension is outside Q(S)."
        for name in ("oxygen", "pressure", "gravity", "flow")
    },
)

_SCENARIO_B_DIMS = _dimensions(
    requested={"safety_theme"},
    available={"safety_theme": ("detection", SAME_R_THEME)},
    similarities={"safety_theme": 1.0},
    scenario_values={"safety_theme": "detection"},
    limitations={
        name: "Scenario numeric input is not specified; dimension is outside Q(S)."
        for name in ("oxygen", "pressure", "gravity", "flow", "material_phase")
    },
)

_SCENARIO_D_DIMS_CFI_G = _dimensions(
    requested={"safety_theme"},
    available={"safety_theme": ("prevention", CFI_G_THEME)},
    similarities={"safety_theme": 1.0},
    scenario_values={"safety_theme": "prevention"},
    limitations={
        name: "Scenario numeric input is not specified; dimension is outside Q(S)."
        for name in ("oxygen", "pressure", "gravity", "flow", "material_phase")
    },
)

_SCENARIO_D_DIMS_BASS = _dimensions(
    requested={"safety_theme"},
    available={"safety_theme": ("prevention", BASS_II_THEME)},
    similarities={"safety_theme": 1.0},
    scenario_values={"safety_theme": "prevention"},
    limitations={
        name: "Scenario numeric input is not specified; dimension is outside Q(S)."
        for name in ("oxygen", "pressure", "gravity", "flow", "material_phase")
    },
)


def _ranked(
    record: InvestigationRecord,
    score: float,
    coverage: float,
    dimensions: list[DimensionScore],
    justification: str,
    matched: list[str],
    missing: list[str],
    limitations: list[str],
) -> RankedResult:
    return RankedResult(
        psi_id=record.psi_id,
        title=record.title,
        acronym=record.acronym,
        score=score,
        coverage=coverage,
        match_class="partial_match",
        dimensions=dimensions,
        justification=justification,
        matched_conditions=matched,
        missing_dimensions=missing,
        limitations=limitations,
        provenance=record.provenance,
        source_url=record.source_url,
        evidence_class=record.evidence_class,
        data_status=record.data_status,
    )


MOCK_RANKS = {
    "A": RankResponse(
        scenario_id="A",
        requested_dimensions=["oxygen", "pressure", "gravity", "material_phase", "safety_theme"],
        results=[
            _ranked(
                BASS_II,
                score=0.1721,
                coverage=0.6,
                dimensions=_SCENARIO_A_DIMS,
                justification=(
                    "BASS-II shares the solid fuel phase and prevention theme, but its "
                    "curated initial O2 range 0.136–0.222 does not reach 0.30 and no "
                    "pressure or explicit gravity level is curated. It does not cover "
                    "the lunar-habitat condition."
                ),
                matched=["solid fuel phase", "prevention theme"],
                missing=["pressure", "gravity"],
                limitations=[
                    "No completed PSI record directly covers the solid-fuel, 30% O2, 8.2 psia, partial-gravity combination.",
                    "BASS-II initial O2 is 0.136–0.222; it must not be described as covering 30% O2.",
                    "Scenario flow is not specified; the flow dimension is outside Q(S).",
                ],
            )
        ],
        gap_statement=(
            "No completed PSI record directly covers the solid-fuel, 30% O2, 8.2 psia, "
            "partial-gravity combination. The flow value is not specified, so the "
            "scenario cannot produce a direct match. FM2 remains anticipated_in_psi "
            "context, not measured evidence."
        ),
    ),
    "B": RankResponse(
        scenario_id="B",
        requested_dimensions=["safety_theme"],
        results=[
            _ranked(
                SAME_R,
                score=1.0,
                coverage=1.0,
                dimensions=_SCENARIO_B_DIMS,
                justification=(
                    "SAME-R matches the requested detection theme. Only the safety "
                    "theme is specified, so this is a partial match and detector "
                    "evidence is not flame-spread evidence."
                ),
                matched=["detection theme"],
                missing=[],
                limitations=[
                    "Only the safety theme is specified; no numeric physical inputs are ruled.",
                    "DAFT/DAFT-2 remains instrument context and is not a ranked candidate.",
                ],
            )
        ],
        gap_statement=(
            "Detection instrumentation evidence is present, but no numeric cabin "
            "conditions are specified; no direct match is claimed."
        ),
    ),
    "C": RankResponse(
        scenario_id="C",
        requested_dimensions=["material_phase", "safety_theme"],
        results=[
            _ranked(
                FLEX,
                score=1.0,
                coverage=1.0,
                dimensions=_SCENARIO_C_DIMS,
                justification=(
                    "FLEX matches the liquid-droplet phase and suppression theme. "
                    "Numeric physical inputs are not specified, so this is a partial "
                    "match."
                ),
                matched=["liquid_droplet phase", "suppression theme"],
                missing=[],
                limitations=[
                    "Only phase and theme are specified; no numeric physical inputs are ruled.",
                ],
            ),
            _ranked(
                FLEX_2,
                score=1.0,
                coverage=1.0,
                dimensions=_SCENARIO_C_DIMS_FLEX2,
                justification=(
                    "FLEX-2 matches the liquid-droplet phase and suppression theme as "
                    "bi-component droplet-combustion evidence."
                ),
                matched=["liquid_droplet phase", "suppression theme"],
                missing=[],
                limitations=[
                    "Only phase and theme are specified; no numeric physical inputs are ruled.",
                ],
            ),
        ],
        gap_statement=(
            "FLEX and FLEX-2 provide droplet suppression evidence, but numeric "
            "physical inputs are unspecified; no direct match is claimed."
        ),
    ),
    "D": RankResponse(
        scenario_id="D",
        requested_dimensions=["safety_theme"],
        results=[
            _ranked(
                CFI_G,
                score=1.0,
                coverage=1.0,
                dimensions=_SCENARIO_D_DIMS_CFI_G,
                justification=(
                    "CFI-G matches the prevention theme as high-O2 gas-phase "
                    "microgravity context. It is not a solid-fuel Apollo 1 "
                    "reconstruction."
                ),
                matched=["prevention theme"],
                missing=[],
                limitations=[
                    "High-O2 gas-phase microgravity context is not solid-fuel Apollo 1 evidence.",
                    "No numeric physical inputs are specified.",
                ],
            ),
            _ranked(
                BASS_II,
                score=1.0,
                coverage=1.0,
                dimensions=_SCENARIO_D_DIMS_BASS,
                justification=(
                    "BASS-II matches the prevention theme as solid-fuel context, but "
                    "it is not at 100% O2 and is not an Apollo 1 reconstruction."
                ),
                matched=["prevention theme"],
                missing=[],
                limitations=[
                    "BASS-II is solid-fuel context but not at 100% O2.",
                    "No numeric physical inputs are specified.",
                ],
            ),
        ],
        gap_statement=(
            "No completed PSI record is a direct Apollo 1 reconstruction. High-O2 "
            "gas-phase context and solid-fuel context remain separated, and Apollo 1 "
            "is explanatory context only, never a scoring input."
        ),
    ),
}

MOCK_COMPARE = CompareResponse(
    psi_ids=["PSI-69", "PSI-68"],
    records=[FLEX, FLEX_2],
    shared_fields=[
        "research_area",
        "project_type",
        "catalog_role",
        "data_status",
        "annotation_status",
        "fuel_phases",
        "safety_theme",
    ],
    differing_fields=["psi_id", "title", "acronym", "evidence_class", "doi"],
    rows=[
        CompareRow(
            name="evidence_class",
            values={"PSI-69": "bench_flammability", "PSI-68": "flame_physics"},
        ),
        CompareRow(
            name="safety_theme",
            values={"PSI-69": "suppression", "PSI-68": "suppression"},
        ),
        CompareRow(
            name="fuel_phases",
            values={"PSI-69": "liquid_droplet", "PSI-68": "liquid_droplet"},
        ),
    ],
)

MOCK_OBSERVATIONS = ObservationsResponse(
    points=[
        ObservationPoint(
            psi_id="PSI-25",
            file_name="PSI-25_Experimental table_BASS-II.csv",
            row_index=0,
            oxygen_fraction=0.136,
            provenance=BASS_II_OXYGEN,
        ),
        ObservationPoint(
            psi_id="PSI-25",
            file_name="PSI-25_Experimental table_BASS-II.csv",
            row_index=1,
            oxygen_fraction=0.222,
            provenance=BASS_II_OXYGEN,
        ),
    ],
    excluded_psi_ids=["PSI-47", "PSI-117"],
    disclaimer="Observed test domain; not a validated flammability boundary.",
)

MOCK_CONTEXT = ContextResponse(
    incidents=[
        ContextCard(
            kind="incident",
            id="apollo-1",
            title="Apollo 1",
            summary="Explanatory precedent for a high-oxygen, ground-test cabin fire; never a scoring input.",
            source_url=APOLLO_1_URL,
        ),
        ContextCard(
            kind="incident",
            id="mir-fire",
            title="Mir fire",
            summary="Explanatory precedent for a spacecraft fire event; never a scoring input.",
            source_url=MIR_URL,
        ),
        ContextCard(
            kind="incident",
            id="apollo-13",
            title="Apollo 13",
            summary="Explanatory precedent for oxygen-system risk; never a scoring input.",
            source_url=APOLLO_13_URL,
        ),
    ],
    spinoff=[
        ContextCard(
            kind="spinoff",
            id="incipient-fire-detector",
            title="Incipient fire detector",
            summary="Discriminates combustion particles from dust; thematic context, not direct PSI lineage.",
            source_url=SPINOFF_DETECTOR_URL,
        ),
        ContextCard(
            kind="spinoff",
            id="oxygen-safety-regulators",
            title="Oxygen-safety gas regulators",
            summary="Oxygen-safety equipment with thematic links to spacecraft fire work.",
            source_url=SPINOFF_OXYGEN_URL,
        ),
        ContextCard(
            kind="spinoff",
            id="public-safety-equipment",
            title="Public-safety equipment",
            summary="Terrestrial suppression and equipment themes; no direct PSI lineage claimed.",
            source_url=SPINOFF_EQUIPMENT_URL,
        ),
    ],
    instruments=[next(entry for entry in CATALOG if entry.psi_id == "PSI-47")],
    programs=[
        ProgramContext(
            program_id="FM2",
            title="Flammability of Materials on the Moon (FM2)",
            data_status="anticipated_in_psi",
            source_url=FM2_URL,
            provenance={
                "data_status": _provenance(
                    COMBUSTION_SCIENCE_URL,
                    "nasa_program",
                    "Listed as current combustion research; no PSI record appears in the exact 24-record corpus.",
                    note="Anticipated program context, never a measured observation.",
                )
            },
        ),
        ProgramContext(
            program_id="SoFIE",
            title="Solid Fuel Ignition and Extinction (SoFIE)",
            data_status="active_program",
            source_url=SOFIE_URL,
            provenance={
                "data_status": _provenance(
                    SOFIE_URL,
                    "nasa_program",
                    "Official program page; no current PSI record in the exact 24-record corpus.",
                )
            },
        ),
        ProgramContext(
            program_id="FLARE",
            title="Flammability Limits at Reduced Gravity Experiment (FLARE)",
            data_status="active_program",
            source_url=FLARE_URL,
            provenance={
                "data_status": _provenance(
                    FLARE_URL,
                    "nasa_program",
                    "Official program page; no current PSI record in the exact 24-record corpus.",
                )
            },
        ),
    ],
)

MOCK_ASK = AskResponse(
    answer=(
        "BASS-II is the nearest solid-fuel evidence, but its curated initial oxygen "
        "range is 0.136–0.222, so it does not cover 30% O2. No completed PSI record "
        "covers the solid-fuel, 30% O2, 8.2 psia, partial-gravity combination; the "
        "scenario flow value is also unspecified."
    ),
    citations=[
        Citation(
            psi_id="PSI-25",
            title=BASS_II.title,
            source_url=BASS_II.source_url,
        )
    ],
    refused=False,
    scope="fire_safety",
)

MOCK_REFUSAL = AskResponse(
    answer=(
        "This bounded assistant covers NASA PSI spacecraft fire-safety evidence. "
        "Rocket-engine and propellant-combustion questions are outside its scope."
    ),
    citations=[],
    refused=True,
    refusal_reason="rocket/propellant scope guard",
    scope="rocket_propellant",
)

MOCK_HEALTH = HealthResponse(
    status="ok",
    version="0.1.0",
    snapshot=False,
    snapshot_sha256=None,
    snapshot_records=0,
    index=False,
    embeddings=False,
    use_llm=False,
    messages=[
        "H0 mock contract; endpoints are not yet wired to the canonical snapshot or derived index."
    ],
)


def mock_investigation(psi_id: str) -> InvestigationResponse | None:
    record = MOCK_RECORDS.get(psi_id)
    if record is None:
        return None
    previews = [
        TablePreview(
            file_name=table.file_name,
            version=table.version,
            columns=table.columns,
            row_count=len(table.rows),
            rows=table.rows,
            download_url=table.download_url,
            provenance=table.provenance,
        )
        for table in record.experimental_tables
    ]
    return InvestigationResponse(record=record, table_previews=previews)


def mock_ask(question: str) -> AskResponse:
    lowered = question.lower()
    if "rocket" in lowered or "propellant" in lowered:
        return MOCK_REFUSAL
    return MOCK_ASK
