import { useMemo, useState } from 'react'
import {
  useApi,
  type CompareCell,
  type CompareField,
  type InvestigationSummary,
} from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { ChartFrame } from '../../components/charts/ChartFrame'
import { PlotlyChart } from '../../components/charts/PlotlyChart'
import { buildParallelCoordinates } from '../../components/charts/parallelCoordinates'
import { Badge } from '../../components/ui/Badge'
import { MockNotice } from '../../components/ui/MockNotice'
import { Panel } from '../../components/ui/Panel'
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from '../../components/ui/States'
import { baseLayout } from '../../lib/chartTheme'
import { formatNumber, humanize } from '../../lib/format'
import { EVIDENCE_CLASS_LABELS } from '../../lib/labels'

const HUMANIZED_FIELDS = new Set([
  'evidence_class',
  'catalog_role',
  'project_type',
  'data_status',
  'annotation_status',
  'safety_theme',
  'secondary_safety_themes',
  'fuel_phases',
])

function formatCell(field: CompareField, value: CompareCell): string {
  if (value === null) return '—'
  if (Array.isArray(value)) {
    return value.length > 0
      ? value
          .map((item) =>
            typeof item === 'number' ? formatNumber(item) : humanize(item),
          )
          .join(', ')
      : '—'
  }
  if (typeof value === 'number') return formatNumber(value)
  return HUMANIZED_FIELDS.has(field.key) ? humanize(value) : value
}

interface RecordPickerProps {
  candidates: InvestigationSummary[]
  selected: string[]
  onToggle: (psiId: string) => void
}

function RecordPicker({ candidates, selected, onToggle }: RecordPickerProps) {
  const atLimit = selected.length >= 4

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-ink-dim uppercase">
        Select two to four curated records
      </legend>
      <p id="compare-selection-help" className="mb-2 text-xs text-ink-dim">
        Only H1-style curated evidence records are comparable in this H0 view.
        Instrument context and metadata-only records stay out of the matrix.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {candidates.map((record) => {
          const checked = selected.includes(record.psi_id)
          const disabled = !checked && atLimit
          return (
            <label
              key={record.psi_id}
              aria-describedby="compare-selection-help"
              className={
                checked
                  ? 'flex cursor-pointer gap-2.5 rounded-tile border border-compare/60 bg-compare/10 px-3 py-2.5'
                  : disabled
                    ? 'flex cursor-not-allowed gap-2.5 rounded-tile border border-edge bg-space-900/40 px-3 py-2.5 opacity-55'
                    : 'flex cursor-pointer gap-2.5 rounded-tile border border-edge bg-space-900/55 px-3 py-2.5 hover:border-edge-strong hover:bg-space-800/60'
              }
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(record.psi_id)}
                className="mt-1 size-4 shrink-0 accent-[var(--accent-cyan)]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <code className="font-mono text-[10px] font-bold text-compare">
                    {record.psi_id}
                  </code>
                  <span className="truncate text-sm font-semibold text-ink">
                    {record.acronym ?? record.title}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-dim">
                  {EVIDENCE_CLASS_LABELS[record.evidence_class]}
                  {record.fuel ? ` · ${humanize(record.fuel)}` : ''}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function ComparePanel() {
  const api = useApi()
  const [selection, setSelection] = useState<string[]>([])
  const [touched, setTouched] = useState(false)

  const catalogQuery = useAsyncData(
    (signal) => api.getCatalog({ signal }),
    [api],
  )

  const candidates = useMemo(
    () =>
      (catalogQuery.data?.records ?? []).filter(
        (record) =>
          record.annotation_status === 'verified' &&
          record.catalog_role === 'evidence',
      ),
    [catalogQuery.data],
  )

  const defaultSelection = candidates.slice(0, 2).map((record) => record.psi_id)
  const effectiveSelection = touched ? selection : defaultSelection
  const selectionKey = effectiveSelection.join(',')

  const compareQuery = useAsyncData(
    (signal) =>
      effectiveSelection.length >= 2
        ? api.compare({ psi_ids: effectiveSelection }, { signal })
        : Promise.resolve(null),
    [api, selectionKey],
  )

  function toggle(psiId: string) {
    setTouched(true)
    setSelection((previous) => {
      const base = touched ? previous : defaultSelection
      if (base.includes(psiId)) {
        return base.filter((candidate) => candidate !== psiId)
      }
      if (base.length >= 4) return base
      return [...base, psiId]
    })
  }

  const compare = compareQuery.data
  const sharedItems: Array<{ label: string; values: string[] }> = compare
    ? [
        { label: 'Fuels', values: compare.shared.fuels },
        { label: 'Fuel phases', values: compare.shared.fuel_phases },
        { label: 'Safety themes', values: compare.shared.safety_themes },
        { label: 'Hardware', values: compare.shared.hardware },
        {
          label: 'Evidence class',
          values: compare.shared.evidence_classes,
        },
      ]
    : []
  const differenceItems: Array<{ label: string; values: string[] }> = compare
    ? [
        { label: 'Fuels', values: compare.differences.fuels },
        { label: 'Fuel phases', values: compare.differences.fuel_phases },
        {
          label: 'Safety themes',
          values: compare.differences.safety_themes,
        },
        { label: 'Hardware', values: compare.differences.hardware },
      ]
    : []
  const chartData = useMemo(
    () =>
      compare
        ? buildParallelCoordinates(compare.parallel_axes, compare.psi_ids)
        : [],
    [compare],
  )
  const chartLayout = useMemo(
    () => baseLayout({ margin: { l: 40, r: 30, t: 30, b: 40 } }),
    [],
  )

  if (catalogQuery.status === 'loading' && !catalogQuery.data) {
    return <LoadingBlock label="Loading comparable records…" rows={4} />
  }

  if (catalogQuery.status === 'error' && catalogQuery.error) {
    return (
      <ErrorBlock
        title="Could not load the comparison catalog"
        error={catalogQuery.error}
        onRetry={catalogQuery.reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <Panel
        eyebrow="Compare"
        title="Compare two to four completed investigations"
        description="The matrix keeps missing values visible. Parallel coordinates include only fields that carry a value for every selected record — nothing is imputed."
        actions={<Badge tone="compare">Descriptive only</Badge>}
      >
        <RecordPicker
          candidates={candidates}
          selected={effectiveSelection}
          onToggle={toggle}
        />
        <p className="mt-3 text-xs text-ink-dim" aria-live="polite">
          {effectiveSelection.length} of 4 selected
          {effectiveSelection.length < 2
            ? ' — select at least two to build the matrix.'
            : '.'}
        </p>
      </Panel>

      {effectiveSelection.length < 2 ? (
        <EmptyState
          title="Select at least two records"
          description="Comparison requires between two and four distinct curated records."
        />
      ) : compareQuery.status === 'error' && compareQuery.error ? (
        <ErrorBlock
          title="Comparison failed"
          error={compareQuery.error}
          onRetry={compareQuery.reload}
        />
      ) : compareQuery.status === 'loading' || !compare ? (
        <LoadingBlock label="Building the comparison matrix…" rows={4} />
      ) : (
        <>
          <Panel
            eyebrow="Comparison matrix"
            title="Field-by-field evidence"
            description="A dash means the record carries no curated value for that field. Missing values are never estimated."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Comparison matrix for the selected PSI records
                </caption>
                <thead>
                  <tr className="border-b border-edge-strong">
                    <th
                      scope="col"
                      className="sticky left-0 bg-space-900 px-3 py-2 text-[11px] font-bold tracking-[0.1em] text-ink-dim uppercase"
                    >
                      Field
                    </th>
                    {compare.records.map((record) => (
                      <th
                        key={record.psi_id}
                        scope="col"
                        className="px-3 py-2 align-top"
                      >
                        <span className="block font-mono text-[10px] font-bold text-compare">
                          {record.psi_id}
                        </span>
                        <span className="mt-0.5 block max-w-[16rem] text-xs font-semibold text-ink">
                          {record.acronym ?? record.title}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compare.fields.map((field) => (
                    <tr
                      key={field.key}
                      className="border-b border-edge/70 align-top last:border-b-0"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 bg-space-900 px-3 py-2 text-xs font-semibold text-ink-muted"
                      >
                        {field.label}
                        {field.unit && (
                          <span className="ml-1 font-mono text-[10px] text-ink-dim">
                            {field.unit}
                          </span>
                        )}
                      </th>
                      {compare.psi_ids.map((psiId) => {
                        const value = field.values[psiId] ?? null
                        return (
                          <td
                            key={psiId}
                            className={
                              value === null
                                ? 'px-3 py-2 text-xs text-ink-dim'
                                : 'px-3 py-2 text-xs break-words text-ink-muted'
                            }
                          >
                            {formatCell(field, value)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel
              eyebrow="Shared"
              title="Common ground"
              description="Values every selected record has in common."
            >
              <dl className="space-y-2.5">
                {sharedItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[10px] font-bold tracking-[0.1em] text-ink-dim uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink-muted">
                      {item.values.length > 0
                        ? item.values.map(humanize).join(', ')
                        : 'None shared'}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel
              eyebrow="Differences"
              title="Where the records diverge"
              description="Values that are not held by every selected record."
            >
              <dl className="space-y-2.5">
                {differenceItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[10px] font-bold tracking-[0.1em] text-ink-dim uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink-muted">
                      {item.values.length > 0
                        ? item.values.map(humanize).join(', ')
                        : 'No differing values'}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>

          <ChartFrame
            title="Parallel coordinates"
            description="Each vertical axis is a shared numeric field. One line connects the selected records across comparable fields."
            summary="Only shared numeric fields appear. An axis is dropped entirely when any selected record lacks a value, so the chart never invents a coordinate."
            table={
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Parallel-coordinate values for the selected records
                </caption>
                <thead>
                  <tr className="border-b border-edge-strong">
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      Axis
                    </th>
                    {compare.records.map((record) => (
                      <th
                        key={record.psi_id}
                        scope="col"
                        className="px-2 py-1.5 font-mono text-ink-muted"
                      >
                        {record.psi_id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compare.parallel_axes.map((axis) => (
                    <tr key={axis.key} className="border-b border-edge/60">
                      <th scope="row" className="px-2 py-1.5 text-ink-muted">
                        {axis.label} ({axis.unit})
                      </th>
                      {compare.psi_ids.map((psiId) => (
                        <td key={psiId} className="px-2 py-1.5 font-mono text-ink">
                          {axis.values[psiId] === undefined
                            ? '—'
                            : formatNumber(axis.values[psiId] ?? 0, 4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          >
            {chartData.length > 0 ? (
              <PlotlyChart
                data={chartData}
                layout={chartLayout}
                title="Parallel coordinates comparing the selected records"
                minHeight={380}
              />
            ) : (
              <EmptyState
                title="No shared numeric fields"
                description="These records have no numeric field with a value for every selection. Missing fields are excluded rather than imputed."
              />
            )}
          </ChartFrame>

          <MockNotice notice={compare.mock_notice} />
        </>
      )}
    </div>
  )
}
