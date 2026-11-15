import { useMemo } from 'react'
import { useApi, type RankedResult } from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge } from '../ui/Badge'
import { ErrorBlock, LoadingBlock } from '../ui/States'
import {
  EVIDENCE_CLASS_LABELS,
  PHASE_LABELS,
  THEME_LABELS,
} from '../../lib/labels'
import { formatPercent, formatScore, humanize } from '../../lib/format'
import { rankEligibility } from '../../lib/records'
import {
  FIELD_DEFINITIONS,
  type FieldDefinition,
} from './fieldDefinitions'

interface CompareDrawerProps {
  ids: string[]
  rankedResults: RankedResult[]
  scenarioName: string | null
  onRemove: (psiId: string) => void
  onClear: () => void
  onClose: () => void
}

interface CuratedField extends FieldDefinition {
  display: string
}

const CELL = 'border-b border-edge/70 px-3 py-2 align-top'
const FIELD_HEAD =
  'sticky left-0 z-10 bg-space-900 px-3 py-2 text-left fs-micro text-ink-dim'

function RankedCell({
  eligible,
  ranked,
  ineligibilityReason,
}: {
  eligible: boolean
  ranked: RankedResult | null
  ineligibilityReason: string | null
}) {
  if (!eligible) {
    return (
      <Badge
        tone={
          ineligibilityReason === 'instrument context' ? 'compare' : 'flame'
        }
      >
        Not ranked · {ineligibilityReason}
      </Badge>
    )
  }
  if (!ranked) {
    return (
      <span className="text-xs text-ink-dim">
        Not in the active ranking
      </span>
    )
  }
  return (
    <span className="font-mono text-xs text-nav">{formatScore(ranked.score)}</span>
  )
}

export function CompareDrawer({
  ids,
  rankedResults,
  scenarioName,
  onRemove,
  onClear,
  onClose,
}: CompareDrawerProps) {
  const api = useApi()
  const joinKey = ids.join(',')
  const detailQuery = useAsyncData(
    (signal) =>
      Promise.all(ids.map((psiId) => api.getInvestigation(psiId, { signal }))),
    [api, joinKey],
  )

  const rankById = useMemo(
    () =>
      new Map(rankedResults.map((result) => [result.psi_id, result])),
    [rankedResults],
  )

  const headingId = 'compare-drawer-heading'

  const details = detailQuery.data ?? null
  const anyNonRanked =
    details?.some(
      (detail) => !rankEligibility(detail).eligible,
    ) ?? false

  return (
    <section
      aria-labelledby={headingId}
      className="surface mt-5 p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold tracking-[0.16em] text-compare uppercase">
            Compare
          </p>
          <h2
            id={headingId}
            className="text-lg font-semibold tracking-tight text-ink sm:text-xl"
          >
            Side-by-side: {ids.length} {ids.length === 1 ? 'record' : 'records'}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            Titles, themes, phases, physical proximity, and approach together,
            with field-level provenance on every curated numeric value. Scores
            describe physical proximity only — they are not applicability and
            never appear for non-ranked records.
            {scenarioName
              ? ` Shown against Scenario ${scenarioName}.`
              : ' No scenario is ranked yet, so no scores are shown.'}
          </p>
        </div>
        <div className="flex flex-wrap shrink-0 gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-[2px] border border-edge-strong bg-space-800 px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-nav/60 hover:text-ink"
          >
            Clear comparison
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[2px] border border-edge-strong bg-space-800 px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-nav/60 hover:text-ink"
          >
            Close comparison
          </button>
        </div>
      </header>

      {anyNonRanked && (
        <p
          role="note"
          aria-label="Non-ranked records in comparison"
          className="mt-3 rounded-tile border border-flame/45 bg-flame/10 px-3 py-2 text-xs leading-relaxed text-ink-muted"
        >
          <span className="font-bold tracking-[0.1em] text-flame uppercase">
            Not all selections are ranked evidence.
          </span>{' '}
          Metadata-only and instrument-context records remain visible for
          transparency; they are never shown a score, a coverage value, or a
          parallel-coordinate position.
        </p>
      )}

      {detailQuery.status === 'loading' && !details ? (
        <div className="mt-4">
          <LoadingBlock label="Loading comparison…" rows={5} />
        </div>
      ) : detailQuery.status === 'error' && detailQuery.error ? (
        <div className="mt-4">
          <ErrorBlock
            title="Could not build the comparison"
            error={detailQuery.error}
            onRetry={detailQuery.reload}
          />
        </div>
      ) : details ? (
        <div className="mt-4 overflow-x-auto border border-edge">
          <table
            className="w-full min-w-[880px] border-collapse text-left text-sm"
          >
            <caption className="sr-only">
              Side-by-side comparison of the selected PSI records
            </caption>
            <thead>
              <tr className="border-b border-edge-strong">
                <th scope="col" className={`${FIELD_HEAD} border-b border-edge-strong`}>
                  Field
                </th>
                {details.map((detail) => (
                  <th
                    key={detail.psi_id}
                    scope="col"
                    className="min-w-[16rem] px-3 py-2 text-left align-top"
                  >
                    <span className="block font-mono text-[10px] font-bold text-compare">
                      {detail.psi_id}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold leading-snug text-ink">
                      {detail.title}
                      {detail.acronym && detail.acronym !== detail.title && (
                        <span className="ml-1 text-ink-muted">
                          {detail.acronym}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(detail.psi_id)}
                      className="mt-1 text-[10px] font-semibold text-ink-dim hover:text-ink"
                    >
                      Remove from comparison
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Safety theme</th>
                {details.map((detail) => (
                  <td key={detail.psi_id} className={`${CELL} text-ink-muted`}>
                    {detail.safety_theme
                      ? THEME_LABELS[detail.safety_theme]
                      : 'Uncurated'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Fuel phases</th>
                {details.map((detail) => (
                  <td key={detail.psi_id} className={`${CELL} text-ink-muted`}>
                    {detail.fuel_phases.length > 0
                      ? detail.fuel_phases
                          .map((phase) => PHASE_LABELS[phase])
                          .join(', ')
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Project type</th>
                {details.map((detail) => (
                  <td key={detail.psi_id} className={`${CELL} text-ink-muted`}>
                    {humanize(detail.project_type)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Evidence class</th>
                {details.map((detail) => (
                  <td key={detail.psi_id} className={`${CELL} text-ink-muted`}>
                    {EVIDENCE_CLASS_LABELS[detail.evidence_class]}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Physical score</th>
                {details.map((detail) => {
                  const eligibility = rankEligibility(detail)
                  return (
                    <td key={detail.psi_id} className={CELL}>
                      <RankedCell
                        eligible={eligibility.eligible}
                        ranked={rankById.get(detail.psi_id) ?? null}
                        ineligibilityReason={eligibility.reason}
                      />
                    </td>
                  )
                })}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Coverage</th>
                {details.map((detail) => {
                  const eligibility = rankEligibility(detail)
                  const ranked = rankById.get(detail.psi_id) ?? null
                  return (
                    <td key={detail.psi_id} className={CELL}>
                      {eligibility.eligible && ranked ? (
                        <span className="font-mono text-xs text-ink">
                          {formatPercent(ranked.coverage)}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-dim">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Approach</th>
                {details.map((detail) => (
                  <td
                    key={detail.psi_id}
                    className={`${CELL} text-xs leading-relaxed whitespace-pre-line text-ink-muted`}
                  >
                    {detail.approach_text}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-edge/70">
                <th scope="row" className={FIELD_HEAD}>Key findings</th>
                {details.map((detail) => (
                  <td
                    key={detail.psi_id}
                    className={`${CELL} text-xs leading-relaxed whitespace-pre-line text-ink-muted`}
                  >
                    {detail.key_findings_text ??
                      'No key-findings text is available for this record.'}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={FIELD_HEAD}>Provenance</th>
                {details.map((detail) => {
                  const fields = FIELD_DEFINITIONS.map((definition) => ({
                    ...definition,
                    display: definition.value(detail),
                  })).filter(
                    (
                      definition,
                    ): definition is CuratedField => definition.display !== null,
                  )
                  return (
                    <td
                      key={detail.psi_id}
                      className={`${CELL} text-ink-muted`}
                    >
                      {fields.length > 0 ? (
                        <ul className="space-y-1.5">
                          {fields.map((field) => {
                            const provenance =
                              detail.provenance[field.key] ?? null
                            return (
                              <li
                                key={field.key}
                                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] leading-snug"
                              >
                                <span className="font-bold tracking-[0.06em] text-ink-dim uppercase">
                                  {field.label}
                                </span>
                                <span className="font-mono text-ink">
                                  {provenance ? field.display : 'Value withheld'}
                                </span>
                                {provenance ? (
                                  <a
                                    href={provenance.source_url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="font-semibold text-nav hover:underline"
                                  >
                                    {humanize(provenance.value_kind)} provenance
                                    <span aria-hidden="true"> ↗</span>
                                  </a>
                                ) : (
                                  <span className="text-danger">
                                    provenance missing — value withheld
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <span className="text-xs leading-relaxed">
                          No physical values are curated for this record.
                        </span>
                      )}
                      <a
                        href={detail.source_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-block text-[11px] font-semibold text-nav hover:underline"
                      >
                        Source: NASA PSI {detail.psi_id}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
