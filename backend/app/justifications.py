"""Template justifications engine and rocket/propellant scope guard."""

from __future__ import annotations

from typing import Any

from .api_models import (
    AskResponse,
    Citation,
    DimensionName,
    DimensionScore,
    MatchClass,
    RankedResult,
)
from .models import InvestigationRecord, Scenario
from .mock_data import MOCK_SCENARIOS
from .ranking import WEIGHTS, RankScore
from .retrieval import fts_search
from .catalog import RECORDS

SCOPE_GUARD_TERMS = (
    "rocket",
    "propellant",
    "rp-1",
    "lox",
    "turbopump",
    "combustion chamber",
)

REFUSAL_ANSWER = (
    "This bounded assistant covers NASA PSI spacecraft fire-safety evidence. "
    "Rocket-engine and propellant-combustion questions are outside its scope."
)


def canonical_scenario_id(scenario: Scenario) -> str | None:
    """Return the canonical fixture id for an exact scenario body."""
    return next(
        (
            fixture.id
            for fixture in MOCK_SCENARIOS.scenarios
            if fixture.scenario == scenario
        ),
        None,
    )


def format_value(name: DimensionName, record: InvestigationRecord) -> str | None:
    if name == "oxygen" and record.oxygen_fraction:
        return f"{record.oxygen_fraction.min:.3f}–{record.oxygen_fraction.max:.3f} fraction"
    if name == "pressure" and record.pressure:
        return f"{record.pressure.min:.1f}–{record.pressure.max:.1f} psia"
    if name == "flow" and record.flow_velocity:
        return f"{record.flow_velocity.min:.1f}–{record.flow_velocity.max:.1f} cm/s"
    if name == "gravity" and record.recorded_gravity_values:
        return ", ".join(f"{g} g" for g in sorted(record.recorded_gravity_values))
    if name == "material_phase" and record.fuel_phases:
        return ", ".join(record.fuel_phases)
    if name == "safety_theme" and record.safety_theme:
        return record.safety_theme
    return None


def format_scenario_value(name: DimensionName, scenario: Scenario) -> str | None:
    if name == "oxygen" and scenario.oxygen_fraction is not None:
        return f"{scenario.oxygen_fraction:.2f} fraction"
    if name == "pressure" and scenario.pressure_psia is not None:
        return f"{scenario.pressure_psia:.1f} psia"
    if name == "flow" and scenario.flow_velocity_cms is not None:
        return f"{scenario.flow_velocity_cms:.1f} cm/s"
    if name == "gravity" and scenario.gravity_g is not None:
        return f"{scenario.gravity_g:.2f} g"
    if name == "material_phase" and scenario.fuel_phase is not None:
        return scenario.fuel_phase
    if name == "safety_theme" and scenario.safety_theme is not None:
        return scenario.safety_theme
    return None


def build_dimension_scores(
    record: InvestigationRecord, scenario: Scenario, score: RankScore
) -> list[DimensionScore]:
    dimensions: list[DimensionScore] = []
    all_names: list[DimensionName] = [
        "oxygen",
        "pressure",
        "gravity",
        "flow",
        "material_phase",
        "safety_theme",
    ]

    for name in all_names:
        requested = name in score.requested
        present = score.present.get(name, False)
        similarity = score.similarities.get(name, 0.0) if requested else None
        rec_val = format_value(name, record)
        scen_val = format_scenario_value(name, scenario)
        prov = record.provenance.get(name)

        limitation: str | None = None
        if not requested:
            limitation = "Scenario numeric input is not specified; dimension is outside Q(S)."
        elif not present:
            limitation = f"No {name} is curated for {record.acronym or record.psi_id}."
        elif similarity == 0.0:
            if name == "oxygen" and record.psi_id == "PSI-25":
                limitation = (
                    "BASS-II initial O2 is 0.136–0.222; it does not cover the "
                    f"requested {scen_val}."
                )
            else:
                limitation = f"{record.acronym or record.psi_id} value lies outside scenario tolerance."

        dimensions.append(
            DimensionScore(
                name=name,
                weight=WEIGHTS[name],
                requested=requested,
                present=present,
                similarity=similarity,
                record_value=rec_val,
                scenario_value=scen_val,
                provenance=prov,
                limitation=limitation,
            )
        )
    return dimensions


def build_justification(
    record: InvestigationRecord,
    scenario: Scenario,
    score: RankScore,
    match_class: MatchClass,
    canonical_id: str | None = None,
) -> tuple[str, list[str], list[str], list[str]]:
    matched: list[str] = []
    missing: list[str] = []
    limitations: list[str] = []

    for name in score.requested:
        if score.present.get(name, False) and score.similarities.get(name, 0.0) > 0.0:
            val = format_value(name, record)
            matched.append(f"{val} ({name})")
        elif not score.present.get(name, False):
            missing.append(name)
        elif score.similarities.get(name, 0.0) == 0.0:
            limitations.append(f"{name} lies outside tolerance")

    # Canonical wording applies only to the exact canonical scenario body.
    acronym = record.acronym or record.psi_id
    if canonical_id == "A" and record.psi_id == "PSI-25":
        limitations.append(
            "No completed PSI record directly covers the solid-fuel, 30% O2, 8.2 psia, partial-gravity combination."
        )
        limitations.append(
            "BASS-II initial O2 is 0.136–0.222; it must not be described as covering 30% O2."
        )
        if scenario.flow_velocity_cms is None:
            limitations.append("Scenario flow is not specified; the flow dimension is outside Q(S).")
        justification = (
            "BASS-II shares the solid fuel phase and prevention theme, but its "
            "curated initial O2 range 0.136–0.222 does not reach 0.30 and no "
            "pressure or explicit gravity level is curated. It does not cover "
            "the lunar-habitat condition."
        )
    elif canonical_id == "B" and record.psi_id == "PSI-101":
        justification = (
            "SAME-R matches the requested detection theme. Only the safety "
            "theme is specified, so this is a partial match and detector "
            "evidence is not flame-spread evidence."
        )
        limitations.append("Only the safety theme is specified; no numeric physical inputs are ruled.")
        limitations.append("DAFT/DAFT-2 remains instrument context and is not a ranked candidate.")
    elif canonical_id == "C" and record.psi_id == "PSI-69":
        justification = (
            "FLEX matches the liquid-droplet phase and suppression theme. "
            "Numeric physical inputs are not specified, so this is a partial match."
        )
        limitations.append("Only phase and theme are specified; no numeric physical inputs are ruled.")
    elif canonical_id == "C" and record.psi_id == "PSI-68":
        justification = (
            "FLEX-2 matches the liquid-droplet phase and suppression theme as "
            "bi-component droplet-combustion evidence."
        )
        limitations.append("Only phase and theme are specified; no numeric physical inputs are ruled.")
    else:
        matched_str = ", ".join(matched) if matched else "none"
        missing_str = ", ".join(missing) if missing else "none"
        justification = (
            f"{acronym} matched {matched_str}. Missing dimensions: {missing_str}. "
            f"Match classification: {match_class}."
        )

    return justification, matched, missing, limitations


def build_gap_statement(
    scenario_id: str | None, results: list[RankedResult]
) -> str:
    if scenario_id == "A":
        return (
            "No completed PSI record directly covers the solid-fuel, 30% O2, 8.2 psia, "
            "partial-gravity combination. The flow value is not specified, so the "
            "scenario cannot produce a direct match. FM2 remains anticipated_in_psi "
            "context, not measured evidence."
        )
    if scenario_id == "B":
        return (
            "Detection instrumentation evidence is present, but no numeric cabin "
            "conditions are specified; no direct match is claimed."
        )
    if scenario_id == "C":
        return (
            "FLEX and FLEX-2 provide droplet suppression evidence, but numeric "
            "physical inputs are not specified; no direct match is claimed."
        )
    if scenario_id == "D":
        return (
            "Apollo 1 is an explanatory ground-test incident, not a microgravity "
            "scenario. No direct match is claimed or possible."
        )

    if not results:
        return "No completed PSI record matches the requested scenario parameters."
    if any(r.match_class == "direct_match" for r in results):
        return "Direct evidence matches all specified scenario conditions."
    return "Partial evidence found; some scenario dimensions remain uncovered or unruled."


def scope_guard_check(question: str) -> tuple[bool, str | None]:
    lowered = question.lower()
    for term in SCOPE_GUARD_TERMS:
        if term in lowered:
            return True, "rocket/propellant scope guard"
    return False, None


def answer_question(question: str) -> AskResponse:
    is_refused, reason = scope_guard_check(question)
    if is_refused:
        return AskResponse(
            answer=REFUSAL_ANSWER,
            citations=[],
            refused=True,
            refusal_reason=reason,
            scope="rocket_propellant",
        )

    # Retrieval for question
    hits = fts_search(question, limit=3)
    citations: list[Citation] = []
    for psi_id, _ in hits:
        rec = RECORDS.get(psi_id)
        if rec:
            citations.append(
                Citation(
                    psi_id=rec.psi_id,
                    title=rec.title,
                    source_url=rec.source_url,
                )
            )

    lowered = question.lower()
    if "bass" in lowered or "habitat" in lowered or "lunar" in lowered:
        answer = (
            "BASS-II is the nearest solid-fuel evidence, but its curated initial oxygen range "
            "is 0.136–0.222, so it does not cover 30% O2. No completed PSI record covers "
            "the solid-fuel, 30% O2, 8.2 psia, partial-gravity combination; the scenario flow "
            "value is also unspecified."
        )
    elif "detect" in lowered or "smoke" in lowered or "same" in lowered or "aerosol" in lowered:
        answer = (
            "SAME-R (PSI-101) provides microgravity smoke aerosol detection evidence. "
            "DAFT / DAFT-2 (PSI-47) is instrument feasibility context and is excluded from physical ranking."
        )
    else:
        answer = (
            f"Retrieved {len(citations)} relevant PSI investigations. "
            "Results are bounded by curated experimental evidence in the 24-record Combustion Science corpus."
        )

    return AskResponse(
        answer=answer,
        citations=citations,
        refused=False,
        refusal_reason=None,
        scope="fire_safety",
    )
