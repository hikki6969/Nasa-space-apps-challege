"""Frozen similarity and ranking rules from Product Spec section 6.2-6.4.

These functions are pure: callers supply canonical records and scenarios.
"""

from __future__ import annotations

from dataclasses import dataclass

from .api_models import DimensionName, MatchClass
from .models import FuelPhase, InvestigationRecord, Range, SafetyTheme, Scenario

OXYGEN_TOLERANCE = 0.02
PRESSURE_TOLERANCE = 0.2
FLOW_TOLERANCE = 1.0

WEIGHTS: dict[DimensionName, float] = {
    "oxygen": 0.30,
    "pressure": 0.20,
    "gravity": 0.20,
    "flow": 0.10,
    "material_phase": 0.10,
    "safety_theme": 0.10,
}


@dataclass(frozen=True)
class RankScore:
    score: float
    coverage: float
    requested: tuple[DimensionName, ...]
    present: dict[DimensionName, bool]
    similarities: dict[DimensionName, float]


def interval_similarity(value: float, interval: Range, tolerance: float) -> float:
    """Tolerance-scaled overlap: 1.0 inside, tapered outside, 0.0 disjoint."""
    if interval.min <= value <= interval.max:
        return 1.0
    overlap = max(
        0.0,
        min(interval.max, value + tolerance) - max(interval.min, value - tolerance),
    )
    return min(1.0, overlap / (2 * tolerance))


def oxygen_similarity(value: float, interval: Range) -> float:
    return interval_similarity(value, interval, OXYGEN_TOLERANCE)


def pressure_similarity(value: float, interval: Range) -> float:
    return interval_similarity(value, interval, PRESSURE_TOLERANCE)


def gravity_similarity(value: float, levels: list[float]) -> float:
    """Exact recorded level, strict bracket between levels, else zero."""
    if value in levels:
        return 1.0
    ordered = sorted(set(levels))
    if any(low < value < high for low, high in zip(ordered, ordered[1:])):
        return 0.5
    return 0.0


def flow_similarity(value: float, levels: list[float], interval: Range) -> float:
    """Exact/bracket on recorded levels, then tolerance overlap capped at 0.5."""
    if value in levels:
        return 1.0
    ordered = sorted(set(levels))
    if any(low < value < high for low, high in zip(ordered, ordered[1:])):
        return 0.5
    return min(0.5, interval_similarity(value, interval, FLOW_TOLERANCE))


def phase_similarity(phase: FuelPhase, phases: list[FuelPhase]) -> float:
    return 1.0 if phase in phases else 0.0


def theme_similarity(
    theme: SafetyTheme,
    primary: SafetyTheme | None,
    secondary: list[SafetyTheme],
) -> float:
    if primary is not None and theme == primary:
        return 1.0
    return 0.6 if theme in secondary else 0.0


def score_record(record: InvestigationRecord, scenario: Scenario) -> RankScore | None:
    """Score one record over the scenario dimensions that are specified."""
    # Product Spec 6.4: modeling is contextual, even when otherwise verified.
    if not record.rank_eligible or record.evidence_class == "modeling":
        return None

    requested: list[DimensionName] = []
    present: dict[DimensionName, bool] = {}
    similarities: dict[DimensionName, float] = {}

    if scenario.oxygen_fraction is not None:
        requested.append("oxygen")
        present["oxygen"] = record.oxygen_fraction is not None
        similarities["oxygen"] = (
            oxygen_similarity(scenario.oxygen_fraction, record.oxygen_fraction)
            if record.oxygen_fraction is not None
            else 0.0
        )

    if scenario.pressure_psia is not None:
        requested.append("pressure")
        present["pressure"] = record.pressure is not None
        similarities["pressure"] = (
            pressure_similarity(scenario.pressure_psia, record.pressure)
            if record.pressure is not None
            else 0.0
        )

    if scenario.gravity_g is not None:
        requested.append("gravity")
        present["gravity"] = bool(record.recorded_gravity_values)
        similarities["gravity"] = (
            gravity_similarity(scenario.gravity_g, record.recorded_gravity_values)
            if record.recorded_gravity_values
            else 0.0
        )

    if scenario.flow_velocity_cms is not None:
        requested.append("flow")
        present["flow"] = record.flow_velocity is not None
        similarities["flow"] = (
            flow_similarity(
                scenario.flow_velocity_cms,
                record.recorded_flow_values,
                record.flow_velocity,
            )
            if record.flow_velocity is not None
            else 0.0
        )

    if scenario.fuel_phase is not None:
        requested.append("material_phase")
        present["material_phase"] = bool(record.fuel_phases)
        similarities["material_phase"] = (
            phase_similarity(scenario.fuel_phase, record.fuel_phases)
            if record.fuel_phases
            else 0.0
        )

    if scenario.safety_theme is not None:
        requested.append("safety_theme")
        present["safety_theme"] = (
            record.safety_theme is not None or bool(record.secondary_safety_themes)
        )
        similarities["safety_theme"] = (
            theme_similarity(
                scenario.safety_theme,
                record.safety_theme,
                record.secondary_safety_themes,
            )
            if present["safety_theme"]
            else 0.0
        )

    if not requested:
        return None

    present_count = sum(1 for name in requested if present[name])
    if present_count == 0:
        return None

    total_weight = sum(WEIGHTS[name] for name in requested)
    matched_weight = sum(
        WEIGHTS[name] * similarities[name] for name in requested if present[name]
    )
    coverage = present_count / len(requested)
    return RankScore(
        score=matched_weight / total_weight * coverage**0.5,
        coverage=coverage,
        requested=tuple(requested),
        present=present,
        similarities=similarities,
    )


def classify_match(record: InvestigationRecord, score: RankScore | None) -> MatchClass:
    """Direct needs all six scenario dimensions and full similarity."""
    # Anticipated program context uses ProgramContext and never reaches scoring.
    if score is None or not record.rank_eligible or record.evidence_class == "modeling":
        return "contextual_only"
    if len(score.requested) == 6 and all(
        score.similarities[name] == 1.0 for name in score.requested
    ):
        return "direct_match"
    return "partial_match"
