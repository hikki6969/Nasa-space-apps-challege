import type { InvestigationDetail } from '../../api'
import { useApi } from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge } from '../ui/Badge'
import { ErrorBlock, LoadingBlock } from '../ui/States'
import {
  EVIDENCE_CLASS_LABELS,
} from '../../lib/labels'
import { humanize } from '../../lib/format'
import { rankEligibility } from '../../lib/records'
import { FIELD_DEFINITIONS, type FieldDefinition } from './fieldDefinitions'

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) return value.map(cellText).join(', ')
  return JSON.stringify(value)
}

interface InvestigationDetailContentProps {
  detail: InvestigationDetail
  onClose?: () => void
}

/**
 * Presentational detail view. Every remote string is rendered as a React text
 * node; no HTML injection path is used anywhere in this component.
 */
export function InvestigationDetailContent({
  detail,
  onClose,
}: InvestigationDetailContentProps) {
  const eligibility = rankEligibility(detail)
  const headingId = `detail-heading-${detail.psi_id}`
  const provenanceId = `detail-provenance-${detail.psi_id}`
  const tablesId = `detail-tables-${detail.psi_id}`

  const fields = FIELD_DEFINITIONS.map((definition) => ({
    ...definition,
    display: definition.value(detail),
  })).filter(
    (definition): definition is FieldDefinition & { display: string } =>
      definition.display !== null,
  )

  return (
    <article
      aria-labelledby={headingId}
      className="mt-5 rounded-panel border border-edge-strong bg-space-950/60 p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="nav">{detail.psi_id}</Badge>
            <Badge tone="neutral">{humanize(detail.project_type)}</Badge>
            <Badge tone="neutral">
              {EVIDENCE_CLASS_LABELS[detail.evidence_class]}
            </Badge>
          </div>
          <h3
            id={headingId}
            className="mt-2 text-lg font-semibold text-ink"
          >
            {detail.title}
            {detail.acronym && detail.acronym !== detail.title && (
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {detail.acronym}
              </span>
            )}
          </h3>
          <p className="mt-1 text-xs text-ink-dim">
            {detail.research_area}
            {detail.doi ? ` · DOI ${detail.doi}` : ''}
            {detail.license ? ` · License ${detail.license}` : ''}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-edge-strong bg-space-800 px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-nav/60 hover:text-ink"
          >
            Close detail
          </button>
        )}
      </header>

      {!eligibility.eligible && (
        <p
          role="note"
          aria-label="Non-ranked record"
          className="mt-4 rounded-tile border border-flame/45 bg-flame/10 px-3 py-2 text-xs leading-relaxed text-ink-muted"
        >
          <span className="font-bold tracking-[0.1em] text-flame uppercase">
            Not ranked · {eligibility.reason}
          </span>{' '}
          This record is visible for catalog and provenance transparency. It is
          never a ranked candidate, a measured observation, or a table source.
        </p>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <section className="rounded-tile border border-edge bg-space-900/55 p-3">
          <h4 className="text-[11px] font-bold tracking-[0.1em] text-ink-muted uppercase">
            Objectives
          </h4>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
            {detail.objectives_text}
          </p>
        </section>
        <section className="rounded-tile border border-edge bg-space-900/55 p-3">
          <h4 className="text-[11px] font-bold tracking-[0.1em] text-ink-muted uppercase">
            Approach
          </h4>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
            {detail.approach_text}
          </p>
        </section>
        <section className="rounded-tile border border-edge bg-space-900/55 p-3">
          <h4 className="text-[11px] font-bold tracking-[0.1em] text-ink-muted uppercase">
            Key findings
          </h4>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
            {detail.key_findings_text ??
              'No key-findings text is available for this record.'}
          </p>
        </section>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <span className="font-bold tracking-[0.1em] text-ink-dim uppercase">
          Source
        </span>
        <a
          href={detail.source_url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-semibold text-nav hover:underline"
        >
          NASA PSI record {detail.psi_id}
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </p>

      <section
        aria-labelledby={provenanceId}
        className="mt-4 rounded-tile border border-edge bg-space-900/55 p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4
            id={provenanceId}
            className="text-[11px] font-bold tracking-[0.1em] text-ink-muted uppercase"
          >
            Field-level provenance
          </h4>
          <Badge tone="compare">{fields.length} curated field groups</Badge>
        </div>

        {fields.length > 0 ? (
          <ul className="mt-3 grid gap-2 xl:grid-cols-2">
            {fields.map((field) => {
              const provenance = detail.provenance[field.key] ?? null
              return (
                <li
                  key={field.key}
                  className="rounded-tile border border-edge bg-space-950/70 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase">
                      {field.label}
                    </span>
                    <span className="font-mono text-xs text-ink">
                      {provenance ? field.display : 'Value withheld'}
                    </span>
                  </div>

                  {provenance ? (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[10px] font-semibold tracking-[0.08em] text-compare uppercase">
                        {humanize(provenance.source_kind)} ·{' '}
                        {humanize(provenance.value_kind)}
                      </p>
                      <blockquote
                        cite={provenance.source_url}
                        className="border-l-2 border-edge-strong pl-2 text-[11px] leading-relaxed text-ink-muted"
                      >
                        {provenance.excerpt}
                      </blockquote>
                      {provenance.note && (
                        <p className="text-[11px] leading-snug text-ink-dim">
                          {provenance.note}
                        </p>
                      )}
                      <a
                        href={provenance.source_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-nav hover:underline"
                      >
                        Open provenance source
                        <span aria-hidden="true">↗</span>
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] leading-snug text-danger">
                      Provenance missing. The value is withheld because a value
                      without provenance is not treated as curated.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">
            No physical values are curated for this record. Metadata-only records
            remain catalog-visible but cannot contribute to a physical score.
          </p>
        )}
      </section>

      <section
        aria-labelledby={tablesId}
        className="mt-4 rounded-tile border border-edge bg-space-900/55 p-3"
      >
        <h4
          id={tablesId}
          className="text-[11px] font-bold tracking-[0.1em] text-ink-muted uppercase"
        >
          Experimental table preview
        </h4>

        {detail.experimental_tables.length > 0 ? (
          <div className="mt-3 space-y-4">
            {detail.experimental_tables.map((table) => {
              const previewRows = table.rows.slice(0, 5)
              return (
                <div
                  key={`${table.file_name}-${table.version}`}
                  className="rounded-tile border border-edge bg-space-950/70 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-ink">
                        {table.file_name}
                      </p>
                      <p className="text-[11px] text-ink-dim">
                        Version {table.version} · {table.rows.length} rows ·{' '}
                        {table.columns.length} columns
                      </p>
                    </div>
                    <a
                      href={table.download_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[11px] font-semibold text-nav hover:underline"
                    >
                      Download source table
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </div>

                  <div className="mt-2 overflow-x-auto">
                    <table
                      aria-label={`Table preview: ${table.file_name}`}
                      className="w-full border-collapse text-left text-xs"
                    >
                      <thead>
                        <tr>
                          {table.columns.map((column) => (
                            <th
                              key={column}
                              scope="col"
                              className="border-b border-edge-strong px-2 py-1.5 font-mono text-[10px] tracking-wide text-ink-dim uppercase"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {table.columns.map((column) => (
                              <td
                                key={column}
                                className="border-b border-edge px-2 py-1.5 font-mono text-[11px] text-ink-muted"
                              >
                                {cellText(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-1 text-[11px] text-ink-dim">
                    Showing {previewRows.length} of {table.rows.length} rows.
                    Table provenance: {table.provenance.excerpt}
                  </p>
                  <a
                    href={table.provenance.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] font-semibold text-nav hover:underline"
                  >
                    Open table provenance source
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">
            No experimental table is attached in this fixture. The detail view
            never manufactures a measured table for a metadata-only or
            instrument-context record.
          </p>
        )}
      </section>
    </article>
  )
}

interface InvestigationDetailViewProps {
  psiId: string
  onClose: () => void
}

export function InvestigationDetailView({
  psiId,
  onClose,
}: InvestigationDetailViewProps) {
  const api = useApi()
  const detailQuery = useAsyncData(
    (signal) => api.getInvestigation(psiId, { signal }),
    [api, psiId],
  )

  if (detailQuery.status === 'loading' && !detailQuery.data) {
    return <LoadingBlock label={`Loading ${psiId}…`} rows={3} />
  }

  if (detailQuery.status === 'error' && detailQuery.error) {
    return (
      <ErrorBlock
        title={`Could not load ${psiId}`}
        error={detailQuery.error}
        onRetry={detailQuery.reload}
      />
    )
  }

  if (!detailQuery.data) return null

  return (
    <InvestigationDetailContent
      detail={detailQuery.data}
      onClose={onClose}
    />
  )
}
