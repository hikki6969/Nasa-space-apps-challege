import { useId, useState, type FormEvent } from 'react'
import type {
  FuelPhase,
  SafetyTheme,
  Scenario,
  ScenarioInputs,
} from '../../api/types'
import { formatFraction } from '../../lib/format'
import {
  DIMENSION_LABELS,
  PHASE_LABELS,
  THEME_LABELS,
} from '../../lib/labels'
import {
  requestedDimensionsForInputs,
  sameScenarioInputs,
} from '../../lib/scenario'
import { Badge } from '../ui/Badge'
import { Panel } from '../ui/Panel'

type NumericKey =
  | 'oxygen_fraction'
  | 'pressure_psia'
  | 'gravity_g'
  | 'flow_velocity_cms'

type ScenarioErrorMap = Partial<Record<keyof ScenarioInputs, string>>

interface NumericField {
  key: NumericKey
  label: string
  unit: string
  step: number
  min: number
  max?: number
  hint: string
}

const NUMERIC_FIELDS: NumericField[] = [
  {
    key: 'oxygen_fraction',
    label: 'Oxygen',
    unit: 'fraction',
    step: 0.01,
    min: 0,
    max: 1,
    hint: 'Mole fraction; 0.30 = 30% O₂.',
  },
  {
    key: 'pressure_psia',
    label: 'Pressure',
    unit: 'psia',
    step: 0.1,
    min: 0,
    hint: 'Absolute cabin or test-section pressure.',
  },
  {
    key: 'gravity_g',
    label: 'Gravity',
    unit: 'g',
    step: 0.01,
    min: 0,
    hint: 'Acceleration relative to Earth gravity.',
  },
  {
    key: 'flow_velocity_cms',
    label: 'Flow',
    unit: 'cm/s',
    step: 0.1,
    min: 0,
    hint: 'Forced-flow speed. Leave unspecified when no numeric value is ruled.',
  },
]

const PHASE_OPTIONS: Array<{ value: '' | FuelPhase; label: string }> = [
  { value: '', label: 'Not specified' },
  { value: 'solid', label: PHASE_LABELS.solid },
  { value: 'liquid_droplet', label: PHASE_LABELS.liquid_droplet },
  { value: 'gas', label: PHASE_LABELS.gas },
]

const THEME_OPTIONS: Array<{ value: '' | SafetyTheme; label: string }> = [
  { value: '', label: 'Not specified' },
  { value: 'prevention', label: THEME_LABELS.prevention },
  { value: 'detection', label: THEME_LABELS.detection },
  { value: 'suppression', label: THEME_LABELS.suppression },
]

function parseNumeric(raw: string): number | null {
  if (raw.trim() === '') return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function validateInputs(inputs: ScenarioInputs): ScenarioErrorMap {
  const errors: ScenarioErrorMap = {}

  const oxygen = inputs.oxygen_fraction
  if (
    oxygen !== null &&
    (!Number.isFinite(oxygen) || oxygen < 0 || oxygen > 1)
  ) {
    errors.oxygen_fraction =
      'Enter an oxygen mole fraction from 0 to 1 (for example 0.30).'
  }

  const pressure = inputs.pressure_psia
  if (
    pressure !== null &&
    (!Number.isFinite(pressure) || pressure <= 0)
  ) {
    errors.pressure_psia = 'Enter a pressure greater than 0 psia.'
  }

  const gravity = inputs.gravity_g
  if (gravity !== null && (!Number.isFinite(gravity) || gravity < 0)) {
    errors.gravity_g = 'Enter a gravity level of 0 g or greater.'
  }

  const flow = inputs.flow_velocity_cms
  if (flow !== null && (!Number.isFinite(flow) || flow < 0)) {
    errors.flow_velocity_cms = 'Enter a flow velocity of 0 cm/s or greater.'
  }

  return errors
}

interface ScenarioControlsProps {
  scenarios: Scenario[]
  /** Inputs behind the currently displayed results, not the draft. */
  rankedInputs: ScenarioInputs
  onRank: (inputs: ScenarioInputs) => void
}

export function ScenarioControls({
  scenarios,
  rankedInputs,
  onRank,
}: ScenarioControlsProps) {
  const baseId = useId()
  const initial = scenarios[0]
  const [draft, setDraft] = useState<ScenarioInputs>(
    initial ? initial.inputs : {
      oxygen_fraction: null,
      pressure_psia: null,
      gravity_g: null,
      flow_velocity_cms: null,
      fuel_phase: null,
      safety_theme: null,
    },
  )
  const [errors, setErrors] = useState<ScenarioErrorMap>({})

  const activePreset =
    scenarios.find((scenario) => sameScenarioInputs(scenario.inputs, draft)) ??
    null
  const dirty = !sameScenarioInputs(draft, rankedInputs)
  const draftRequested = requestedDimensionsForInputs(draft)

  function update(patch: Partial<ScenarioInputs>) {
    setDraft((previous) => ({ ...previous, ...patch }))
    setErrors({})
  }

  function rank(inputs: ScenarioInputs) {
    const nextErrors = validateInputs(inputs)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onRank(inputs)
  }

  function loadPreset(scenario: Scenario) {
    setDraft(scenario.inputs)
    rank(scenario.inputs)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    rank(draft)
  }

  const errorCount = Object.keys(errors).length

  return (
    <Panel
      eyebrow="Investigations"
      title="Scenario controls"
      description="Set oxygen, pressure, gravity, flow, material phase, and safety theme, then rank the completed evidence. Empty numeric fields and “Not specified” selects stay outside the requested set Q(S); they are never silently defaulted to zero."
      actions={<Badge tone="compare">Weights frozen</Badge>}
    >
      <fieldset>
        <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-ink-dim uppercase">
          Canonical scenarios
        </legend>
        <p className="mb-2 text-xs text-ink-dim">
          Loading a preset replaces the draft and re-ranks it immediately.
        </p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {scenarios.map((scenario, index) => {
            const active = scenario.id === activePreset?.id
            return (
              <label
                key={scenario.id}
                className={
                  active
                    ? 'flex cursor-pointer gap-2.5 rounded-tile border border-nav/60 bg-nav/10 px-3 py-2.5'
                    : 'flex cursor-pointer gap-2.5 rounded-tile border border-edge bg-space-900/55 px-3 py-2.5 hover:border-edge-strong hover:bg-space-800/60'
                }
              >
                <input
                  type="radio"
                  name={`${baseId}-preset`}
                  value={scenario.id}
                  checked={active}
                  onChange={() => loadPreset(scenario)}
                  className="mt-1 size-4 shrink-0 accent-nav"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-nav">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {scenario.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-dim">
                    {scenario.summary}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <form onSubmit={handleSubmit} noValidate className="mt-5">
        <fieldset>
          <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-ink-dim uppercase">
            Physical and thematic inputs
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {NUMERIC_FIELDS.map((field) => {
              const inputId = `${baseId}-${field.key}`
              const hintId = `${baseId}-${field.key}-hint`
              const error = errors[field.key]
              const value = draft[field.key]
              return (
                <div
                  key={field.key}
                  className="rounded-tile border border-edge bg-space-900/55 p-3"
                >
                  <div className="flex min-h-5 items-center justify-between gap-2">
                    <label
                      htmlFor={inputId}
                      className="text-xs font-semibold text-ink"
                    >
                      {field.label}
                    </label>
                    {value === null ? (
                      <Badge
                        tone={
                          field.key === 'flow_velocity_cms'
                            ? 'flame'
                            : 'neutral'
                        }
                      >
                        Not specified
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => update({ [field.key]: null })}
                        aria-label={`Mark ${field.label} unspecified`}
                        className="rounded border border-edge-strong bg-space-800 px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted hover:border-flame/50 hover:text-flame"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id={inputId}
                      type="number"
                      inputMode="decimal"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value === null ? '' : value}
                      placeholder="Not specified"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${hintId}-error` : hintId}
                      onChange={(event) =>
                        update({
                          [field.key]: parseNumeric(event.target.value),
                        })
                      }
                      className={
                        error
                          ? 'min-w-0 flex-1 rounded-md border border-danger/60 bg-space-950 px-2.5 py-1.5 font-mono text-sm text-ink focus:border-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]'
                          : 'min-w-0 flex-1 rounded-md border border-edge-strong bg-space-950 px-2.5 py-1.5 font-mono text-sm text-ink focus:border-nav/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]'
                      }
                    />
                    <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                      {field.unit}
                    </span>
                  </div>

                  {field.key === 'oxygen_fraction' && value !== null && (
                    <p className="mt-1 text-[11px] text-compare">
                      = {formatFraction(value)} O₂
                    </p>
                  )}

                  {error ? (
                    <p
                      id={`${hintId}-error`}
                      className="mt-1 text-[11px] leading-snug text-danger"
                    >
                      {error}
                    </p>
                  ) : (
                    <p
                      id={hintId}
                      className="mt-1 text-[11px] leading-snug text-ink-dim"
                    >
                      {field.hint}
                    </p>
                  )}
                </div>
              )
            })}

            <div className="rounded-tile border border-edge bg-space-900/55 p-3">
              <label
                htmlFor={`${baseId}-fuel-phase`}
                className="text-xs font-semibold text-ink"
              >
                Material phase
              </label>
              <select
                id={`${baseId}-fuel-phase`}
                value={draft.fuel_phase ?? ''}
                onChange={(event) =>
                  update({
                    fuel_phase:
                      event.target.value === ''
                        ? null
                        : (event.target.value as FuelPhase),
                  })
                }
                className="mt-1.5 w-full rounded-md border border-edge-strong bg-space-950 px-2.5 py-1.5 text-sm text-ink focus:border-nav/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              >
                {PHASE_OPTIONS.map((option) => (
                  <option key={option.value || 'unspecified'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] leading-snug text-ink-dim">
                {draft.fuel_phase === null
                  ? 'Not specified: outside Q(S), never inferred as solid.'
                  : 'Only the selected phase is requested.'}
              </p>
            </div>

            <div className="rounded-tile border border-edge bg-space-900/55 p-3">
              <label
                htmlFor={`${baseId}-safety-theme`}
                className="text-xs font-semibold text-ink"
              >
                Safety theme
              </label>
              <select
                id={`${baseId}-safety-theme`}
                value={draft.safety_theme ?? ''}
                onChange={(event) =>
                  update({
                    safety_theme:
                      event.target.value === ''
                        ? null
                        : (event.target.value as SafetyTheme),
                  })
                }
                className="mt-1.5 w-full rounded-md border border-edge-strong bg-space-950 px-2.5 py-1.5 text-sm text-ink focus:border-nav/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value || 'unspecified'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] leading-snug text-ink-dim">
                {draft.safety_theme === null
                  ? 'Not specified: outside Q(S), never inferred from context.'
                  : 'Only the selected theme is requested.'}
              </p>
            </div>
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="rounded-md border border-nav/60 bg-nav/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-nav/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
          >
            Rank scenario
          </button>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setDraft(rankedInputs)
                setErrors({})
              }}
              className="rounded-md border border-edge-strong bg-space-800 px-3 py-2 text-sm font-semibold text-ink-muted hover:border-nav/60 hover:text-ink"
            >
              Discard edits
            </button>
          )}
          {dirty ? (
            <Badge tone="flame">Draft edits not ranked yet</Badge>
          ) : (
            <Badge tone="safe">Results current</Badge>
          )}
        </div>

        {errorCount > 0 && (
          <p role="alert" className="mt-2 text-xs font-semibold text-danger">
            Fix the highlighted {errorCount === 1 ? 'field' : 'fields'} before
            ranking.
          </p>
        )}
      </form>

      <p
        aria-live="polite"
        className="mt-4 rounded-tile border border-edge bg-space-900/55 px-3 py-2 text-xs leading-relaxed text-ink-muted"
      >
        <span className="font-bold tracking-[0.1em] text-ink-dim uppercase">
          Draft requested set Q(S)
        </span>{' '}
        <span className="font-mono text-ink">
          {draftRequested.length > 0
            ? draftRequested.map((name) => DIMENSION_LABELS[name]).join(' · ')
            : 'None — no physical score can be produced'}
        </span>
        . Unspecified fields are excluded from Q(S) and are never treated as
        zero-similarity record values.
      </p>

      {activePreset && (
        <div className="mt-4 border-t border-edge pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold tracking-[0.12em] text-ink-dim uppercase">
              Presentation invariants
            </h3>
            <Badge tone="nav">{activePreset.short_name}</Badge>
          </div>
          <ul className="mt-2 grid gap-1.5 md:grid-cols-2">
            {activePreset.expected_invariants.map((invariant) => (
              <li
                key={invariant}
                className="flex gap-2 text-xs leading-relaxed text-ink-muted"
              >
                <span aria-hidden="true" className="text-compare">
                  ›
                </span>
                <span>{invariant}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-ink-dim">
        H0 mock: representative results exist only for the four canonical
        scenarios. Custom inputs return an explicit limitation gap until the H2
        backend is connected.
      </p>
    </Panel>
  )
}
