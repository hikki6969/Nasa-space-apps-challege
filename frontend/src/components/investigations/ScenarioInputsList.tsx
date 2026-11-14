import type { ScenarioInputs } from '../../api/types'
import { formatScenarioInput } from '../../lib/format'
import { Badge } from '../ui/Badge'

const FIELDS: Array<{
  key: keyof ScenarioInputs
  label: string
}> = [
  { key: 'oxygen_fraction', label: 'Oxygen' },
  { key: 'pressure_psia', label: 'Pressure' },
  { key: 'gravity_g', label: 'Gravity' },
  { key: 'flow_velocity_cms', label: 'Flow' },
  { key: 'fuel_phase', label: 'Phase' },
  { key: 'safety_theme', label: 'Theme' },
]

const INPUT_KEY = {
  oxygen_fraction: 'oxygen',
  pressure_psia: 'pressure',
  gravity_g: 'gravity',
  flow_velocity_cms: 'flow',
  fuel_phase: 'phase',
  safety_theme: 'theme',
} as const

interface ScenarioInputsListProps {
  inputs: ScenarioInputs
}

export function ScenarioInputsList({ inputs }: ScenarioInputsListProps) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {FIELDS.map((field) => {
        const value = inputs[field.key]
        const unspecified = value === null
        return (
          <div
            key={field.key}
            className="rounded-tile border border-edge bg-space-900/65 px-3 py-2"
          >
            <dt className="text-[10px] font-bold tracking-[0.1em] text-ink-dim uppercase">
              {field.label}
            </dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span
                className={
                  unspecified
                    ? 'text-sm font-semibold text-ink-dim italic'
                    : 'font-mono text-sm font-semibold text-ink'
                }
              >
                {formatScenarioInput(
                  INPUT_KEY[field.key],
                  value as number | string | null,
                )}
              </span>
              {unspecified && (
                <Badge tone={field.key === 'flow_velocity_cms' ? 'flame' : 'neutral'}>
                  {field.key === 'flow_velocity_cms' ? 'Gap' : 'Not set'}
                </Badge>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
