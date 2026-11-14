import type {
  DimensionName,
  DimensionScore,
  EvidenceClass,
  FuelPhase,
  MatchClass,
  ObservationOutcome,
  SafetyTheme,
} from '../api/types'

export const DIMENSION_LABELS: Record<DimensionName, string> = {
  oxygen: 'Oxygen',
  pressure: 'Pressure',
  gravity: 'Gravity',
  flow: 'Flow',
  phase: 'Material phase',
  theme: 'Safety theme',
}

export const DIMENSION_UNITS: Record<DimensionName, string> = {
  oxygen: 'fraction',
  pressure: 'psia',
  gravity: 'g',
  flow: 'cm/s',
  phase: 'phase',
  theme: 'theme',
}

export const MATCH_CLASS_LABELS: Record<MatchClass, string> = {
  direct_match: 'Direct match',
  partial_match: 'Partial match',
  contextual_only: 'Contextual only',
  anticipated_in_psi: 'Anticipated in PSI',
}

export const EVIDENCE_CLASS_LABELS: Record<EvidenceClass, string> = {
  bench_flammability: 'Bench flammability',
  large_scale_demonstration: 'Large-scale demonstration',
  flame_physics: 'Flame physics',
  detection_instrumentation: 'Detection instrumentation',
  suppression: 'Suppression',
  modeling: 'Modeling',
}

export const THEME_LABELS: Record<SafetyTheme, string> = {
  prevention: 'Prevention',
  detection: 'Detection',
  suppression: 'Suppression',
}

export const PHASE_LABELS: Record<FuelPhase, string> = {
  solid: 'Solid',
  liquid_droplet: 'Liquid droplet',
  gas: 'Gas',
}

export const OUTCOME_LABELS: Record<ObservationOutcome, string> = {
  ignition: 'Ignition',
  extinction: 'Extinction',
  no_ignition: 'No ignition',
  suppression: 'Suppression',
}

export type DimensionStatus =
  | 'not_requested'
  | 'missing'
  | 'zero'
  | 'partial'
  | 'match'

export function dimensionStatus(
  dimension: DimensionScore,
): DimensionStatus {
  if (!dimension.requested) return 'not_requested'
  if (!dimension.present) return 'missing'
  if ((dimension.similarity ?? 0) >= 1) return 'match'
  if ((dimension.similarity ?? 0) > 0) return 'partial'
  return 'zero'
}

export const DIMENSION_STATUS_LABELS: Record<DimensionStatus, string> = {
  not_requested: 'Not requested',
  missing: 'Missing',
  zero: '0 similarity',
  partial: 'Partial',
  match: 'Match',
}
