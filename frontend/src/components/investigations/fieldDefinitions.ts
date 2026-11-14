import type { InvestigationDetail } from '../../api'
import {
  PHASE_LABELS,
  THEME_LABELS,
} from '../../lib/labels'
import { formatNumber, formatRangeValue } from '../../lib/format'

export interface FieldDefinition {
  key: string
  label: string
  value: (detail: InvestigationDetail) => string | null
}

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    key: 'oxygen_fraction',
    label: 'Oxygen range',
    value: (detail) =>
      detail.oxygen_fraction ? formatRangeValue(detail.oxygen_fraction) : null,
  },
  {
    key: 'pressure',
    label: 'Pressure range',
    value: (detail) =>
      detail.pressure ? formatRangeValue(detail.pressure) : null,
  },
  {
    key: 'flow_velocity',
    label: 'Flow-velocity range',
    value: (detail) =>
      detail.flow_velocity ? formatRangeValue(detail.flow_velocity) : null,
  },
  {
    key: 'gravity',
    label: 'Gravity range',
    value: (detail) => (detail.gravity ? formatRangeValue(detail.gravity) : null),
  },
  {
    key: 'recorded_gravity_values',
    label: 'Recorded gravity levels',
    value: (detail) =>
      detail.recorded_gravity_values.length > 0
        ? detail.recorded_gravity_values
            .map((value) => `${formatNumber(value)} g`)
            .join(', ')
        : null,
  },
  {
    key: 'recorded_flow_values',
    label: 'Recorded flow levels',
    value: (detail) =>
      detail.recorded_flow_values.length > 0
        ? detail.recorded_flow_values
            .map((value) => `${formatNumber(value)} cm/s`)
            .join(', ')
        : null,
  },
  {
    key: 'fuel',
    label: 'Fuel',
    value: (detail) => detail.fuel,
  },
  {
    key: 'fuel_phases',
    label: 'Material phases',
    value: (detail) =>
      detail.fuel_phases.length > 0
        ? detail.fuel_phases
            .map((phase) => PHASE_LABELS[phase])
            .join(', ')
        : null,
  },
  {
    key: 'safety_theme',
    label: 'Primary safety theme',
    value: (detail) =>
      detail.safety_theme ? THEME_LABELS[detail.safety_theme] : null,
  },
]
