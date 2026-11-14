import { ApiError } from './client'
import {
  type EvidenceClass,
  type FuelPhase,
  type CatalogDistributions,
  type CatalogResponse,
  type CompareField,
  type CompareResponse,
  type DistributionBucket,
  type InvestigationSummary,
  type ParallelAxis,
  type Range,
  type SafetyTheme,
} from './types'

/**
 * Derivation helpers shared by the offline mock adapter and the live H2
 * adapter. Both produce the same UI-facing shapes from the same record list,
 * so feature code never distinguishes between modes. Every derived number is
 * computed from the committed record set or it is not shown at all.
 */

export function humanize(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function countBy(values: string[]): DistributionBucket[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => ({ key, label: humanize(key), count }))
}

export function buildDistributions(
  records: InvestigationSummary[],
): CatalogDistributions {
  return {
    evidence_class: countBy(records.map((record) => record.evidence_class)),
    safety_theme: countBy(
      records.map((record) => record.safety_theme ?? 'uncurated'),
    ),
    hardware: countBy(records.flatMap((record) => record.hardware)).slice(0, 8),
    data_status: countBy(records.map((record) => record.data_status)),
  }
}

export interface BuildCatalogOptions {
  snapshotSha256: string
  /** Anticipated program-context entries, derived from /api/context. */
  anticipated: number
  warnings: string[]
  mockNotice: string | null
}

/** Counts, distributions, and warnings derived from full hydrated records. */
export function buildCatalogFromRecords(
  records: InvestigationSummary[],
  options: BuildCatalogOptions,
): CatalogResponse {
  return {
    snapshot_sha256: options.snapshotSha256,
    counts: {
      total: records.length,
      complete: records.filter((record) => record.data_status === 'complete')
        .length,
      partial: records.filter((record) => record.data_status === 'partial')
        .length,
      curated: records.filter(
        (record) =>
          record.annotation_status === 'source_cited' &&
          record.catalog_role !== 'instrument_context',
      ).length,
      metadata_only: records.filter(
        (record) => record.annotation_status === 'metadata_only',
      ).length,
      instrument_context: records.filter(
        (record) => record.catalog_role === 'instrument_context',
      ).length,
      anticipated: options.anticipated,
    },
    distributions: buildDistributions(records),
    records,
    warnings: options.warnings,
    mock_notice: options.mockNotice,
  }
}

function formatRange(range: Range | null, digits = 3): string | null {
  if (!range) return null
  const trim = (value: number) => Number(value.toFixed(digits)).toString()
  return `${trim(range.min)}–${trim(range.max)} ${range.unit}`
}

function sameValues<T>(values: T[][]): T[] {
  if (values.length === 0) return []
  const first = values[0] ?? []
  return first.filter((value) =>
    values.every((list) => list.some((candidate) => candidate === value)),
  )
}

function differingValues<T>(values: T[][]): T[] {
  const all = new Set(values.flat())
  return [...all].filter(
    (value) => !values.every((list) => list.some((candidate) => candidate === value)),
  )
}

const FIELD_DEFINITIONS: Array<{
  key: string
  label: string
  unit: string | null
  comparable: boolean
  value: (record: InvestigationSummary) => CompareField['values'][string]
}> = [
  {
    key: 'title',
    label: 'Title',
    unit: null,
    comparable: false,
    value: (record) => record.title,
  },
  {
    key: 'evidence_class',
    label: 'Evidence class',
    unit: null,
    comparable: false,
    value: (record) => record.evidence_class,
  },
  {
    key: 'catalog_role',
    label: 'Catalog role',
    unit: null,
    comparable: false,
    value: (record) => record.catalog_role,
  },
  {
    key: 'project_type',
    label: 'Project type',
    unit: null,
    comparable: false,
    value: (record) => record.project_type,
  },
  {
    key: 'data_status',
    label: 'Data status',
    unit: null,
    comparable: false,
    value: (record) => record.data_status,
  },
  {
    key: 'annotation_status',
    label: 'Annotation status',
    unit: null,
    comparable: false,
    value: (record) => record.annotation_status,
  },
  {
    key: 'safety_theme',
    label: 'Primary safety theme',
    unit: null,
    comparable: false,
    value: (record) => record.safety_theme,
  },
  {
    key: 'secondary_safety_themes',
    label: 'Secondary safety themes',
    unit: null,
    comparable: false,
    value: (record) => record.secondary_safety_themes,
  },
  {
    key: 'fuel',
    label: 'Fuel',
    unit: null,
    comparable: false,
    value: (record) => record.fuel,
  },
  {
    key: 'fuel_phases',
    label: 'Fuel phases',
    unit: null,
    comparable: false,
    value: (record) => record.fuel_phases,
  },
  {
    key: 'oxygen_fraction',
    label: 'Oxygen range',
    unit: 'fraction',
    comparable: true,
    value: (record) => formatRange(record.oxygen_fraction),
  },
  {
    key: 'pressure',
    label: 'Pressure range',
    unit: 'psia',
    comparable: true,
    value: (record) => formatRange(record.pressure),
  },
  {
    key: 'flow_velocity',
    label: 'Flow range',
    unit: 'cm/s',
    comparable: true,
    value: (record) => formatRange(record.flow_velocity),
  },
  {
    key: 'gravity',
    label: 'Gravity range',
    unit: 'g',
    comparable: true,
    value: (record) => formatRange(record.gravity),
  },
  {
    key: 'recorded_gravity_values',
    label: 'Recorded gravity levels',
    unit: 'g',
    comparable: true,
    value: (record) => record.recorded_gravity_values,
  },
  {
    key: 'hardware',
    label: 'Hardware / facility',
    unit: null,
    comparable: false,
    value: (record) => record.hardware,
  },
  {
    key: 'source_url',
    label: 'NASA PSI source',
    unit: null,
    comparable: false,
    value: (record) => record.source_url,
  },
]

const AXIS_DEFINITIONS: Array<{
  key: string
  label: string
  unit: string
  value: (record: InvestigationSummary) => number | null
}> = [
  {
    key: 'oxygen_min',
    label: 'O₂ min',
    unit: 'fraction',
    value: (record) => record.oxygen_fraction?.min ?? null,
  },
  {
    key: 'oxygen_max',
    label: 'O₂ max',
    unit: 'fraction',
    value: (record) => record.oxygen_fraction?.max ?? null,
  },
  {
    key: 'pressure_min',
    label: 'Pressure min',
    unit: 'psia',
    value: (record) => record.pressure?.min ?? null,
  },
  {
    key: 'pressure_max',
    label: 'Pressure max',
    unit: 'psia',
    value: (record) => record.pressure?.max ?? null,
  },
  {
    key: 'flow_min',
    label: 'Flow min',
    unit: 'cm/s',
    value: (record) => record.flow_velocity?.min ?? null,
  },
  {
    key: 'flow_max',
    label: 'Flow max',
    unit: 'cm/s',
    value: (record) => record.flow_velocity?.max ?? null,
  },
  {
    key: 'gravity_min',
    label: 'Gravity min',
    unit: 'g',
    value: (record) => {
      if (record.recorded_gravity_values.length > 0) {
        return Math.min(...record.recorded_gravity_values)
      }
      return record.gravity?.min ?? null
    },
  },
  {
    key: 'gravity_max',
    label: 'Gravity max',
    unit: 'g',
    value: (record) => {
      if (record.recorded_gravity_values.length > 0) {
        return Math.max(...record.recorded_gravity_values)
      }
      return record.gravity?.max ?? null
    },
  },
]

function buildParallelAxes(records: InvestigationSummary[]): ParallelAxis[] {
  return AXIS_DEFINITIONS.flatMap((axis) => {
    const values: Record<string, number> = {}
    for (const record of records) {
      const value = axis.value(record)
      if (value === null) return []
      values[record.psi_id] = value
    }
    return [
      {
        key: axis.key,
        label: axis.label,
        unit: axis.unit,
        values,
      },
    ]
  })
}

export interface CompareFromRecordsOptions {
  /** Notice shown under the parallel-coordinates chart. */
  mockNotice: string | null
}

/**
 * Build the shared/different field matrix and unit-compatible parallel axes
 * from fully hydrated records. Shared by the mock adapter (fixture records)
 * and the live H2 adapter (records hydrated from /api/investigations, or the
 * full records embedded in the /api/compare response).
 */
export function buildCompareFromRecords(
  psiIds: string[],
  records: InvestigationSummary[],
  options: CompareFromRecordsOptions,
): CompareResponse {
  const uniqueIds = [...new Set(psiIds)]
  if (uniqueIds.length < 2 || uniqueIds.length > 4) {
    throw new ApiError(
      400,
      'POST /api/compare',
      'Select between two and four distinct PSI records.',
    )
  }

  const byId = new Map(records.map((record) => [record.psi_id, record]))
  const selected = uniqueIds.map((psiId) => {
    const found = byId.get(psiId)
    if (!found) {
      throw new ApiError(404, 'POST /api/compare', `Unknown PSI record ${psiId}`)
    }
    return found
  })

  const fields: CompareField[] = FIELD_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    unit: definition.unit,
    comparable: definition.comparable,
    values: Object.fromEntries(
      selected.map((record) => [record.psi_id, definition.value(record)]),
    ),
  }))

  const fuelLists = selected.map((record) => (record.fuel ? [record.fuel] : []))
  const phaseLists = selected.map((record) => record.fuel_phases)
  const themeLists = selected.map((record) => [
    ...(record.safety_theme ? [record.safety_theme] : []),
    ...record.secondary_safety_themes,
  ])
  const hardwareLists = selected.map((record) => record.hardware)
  const classLists = selected.map((record) => [record.evidence_class])

  return {
    psi_ids: uniqueIds,
    records: selected,
    fields,
    shared: {
      fuels: sameValues(fuelLists),
      fuel_phases: sameValues<FuelPhase>(phaseLists),
      safety_themes: sameValues<SafetyTheme>(themeLists),
      hardware: sameValues(hardwareLists),
      evidence_classes: sameValues<EvidenceClass>(classLists),
    },
    differences: {
      fuels: differingValues(fuelLists),
      fuel_phases: differingValues<FuelPhase>(phaseLists),
      safety_themes: differingValues<SafetyTheme>(themeLists),
      hardware: differingValues(hardwareLists),
    },
    parallel_axes: buildParallelAxes(selected),
    mock_notice: options.mockNotice,
  }
}
