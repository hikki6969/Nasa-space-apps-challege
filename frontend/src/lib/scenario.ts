import type { DimensionName, ScenarioInputs } from '../api/types'

/**
 * Presentation-only helpers for the scenario form. Scoring and the
 * authoritative requested set remain backend-owned; these helpers only let the
 * UI preview whether a draft field is specified and compare a draft against the
 * last submitted inputs.
 */

const DIMENSION_FOR_INPUT: ReadonlyArray<
  [keyof ScenarioInputs, DimensionName]
> = [
  ['oxygen_fraction', 'oxygen'],
  ['pressure_psia', 'pressure'],
  ['gravity_g', 'gravity'],
  ['flow_velocity_cms', 'flow'],
  ['fuel_phase', 'phase'],
  ['safety_theme', 'theme'],
]

export function sameScenarioInputs(
  left: ScenarioInputs,
  right: ScenarioInputs,
): boolean {
  return (Object.keys(left) as Array<keyof ScenarioInputs>).every(
    (key) => left[key] === right[key],
  )
}

export function requestedDimensionsForInputs(
  inputs: ScenarioInputs,
): DimensionName[] {
  return DIMENSION_FOR_INPUT.filter(([key]) => inputs[key] !== null).map(
    ([, dimension]) => dimension,
  )
}
