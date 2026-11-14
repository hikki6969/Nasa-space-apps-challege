import type { Range, RangeUnit } from '../api/types'

export function humanize(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatFraction(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatScore(value: number): string {
  return value.toFixed(3)
}

export function formatNumber(value: number, digits = 3): string {
  if (Number.isInteger(value)) return value.toString()
  return Number(value.toFixed(digits)).toString()
}

export function unitLabel(unit: RangeUnit): string {
  switch (unit) {
    case 'fraction':
      return 'fraction'
    case 'psia':
      return 'psia'
    case 'cm/s':
      return 'cm/s'
    case 'g':
      return 'g'
  }
}

export function formatRange(range: Range | null, digits = 3): string {
  if (!range) return '—'
  return `${formatNumber(range.min, digits)}–${formatNumber(range.max, digits)} ${unitLabel(range.unit)}`
}

export function formatRangeValue(range: Range | null): string {
  if (!range) return 'Not specified'
  if (range.unit === 'fraction') {
    return `${formatFraction(range.min)}–${formatFraction(range.max)}`
  }
  return `${formatNumber(range.min)}–${formatNumber(range.max)} ${unitLabel(range.unit)}`
}

export function formatScenarioInput(
  key:
    | 'oxygen'
    | 'pressure'
    | 'gravity'
    | 'flow'
    | 'phase'
    | 'theme',
  value: number | string | null,
): string {
  if (value === null) return 'Not specified'
  if (typeof value === 'string') return humanize(value)
  switch (key) {
    case 'oxygen':
      return formatFraction(value)
    case 'pressure':
      return `${formatNumber(value)} psia`
    case 'gravity':
      return `${formatNumber(value)} g`
    case 'flow':
      return `${formatNumber(value)} cm/s`
    case 'phase':
    case 'theme':
      return humanize(String(value))
  }
}

export function formatList(values: string[], empty = 'None curated'): string {
  return values.length > 0 ? values.map(humanize).join(', ') : empty
}
