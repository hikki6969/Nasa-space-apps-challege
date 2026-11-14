import type { RankedResult } from '../../api/types'
import { EVIDENCE_CLASS_LABELS } from '../../lib/labels'
import { formatPercent, formatScore, humanize } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { DimensionBreakdown } from './DimensionBreakdown'
import { MatchClassBadge } from './MatchClassBadge'

interface RankedResultCardProps {
  result: RankedResult
  rank: number
}

function Meter({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  const percent = Math.max(Math.min(value, 1), 0) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.1em] text-ink-dim uppercase">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold text-ink">
          {formatPercent(value)}
        </span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-space-700"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-nav"
          style={{ width: `${Math.max(percent, value > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] leading-snug text-ink-dim">{description}</p>
    </div>
  )
}

export function RankedResultCard({ result, rank }: RankedResultCardProps) {
  const requestedCount = result.dimensions.filter(
    (dimension) => dimension.requested,
  ).length
  const presentCount = result.dimensions.filter(
    (dimension) => dimension.requested && dimension.present,
  ).length

  return (
    <article
      className="surface-raised p-4 sm:p-5"
      aria-labelledby={`result-${result.psi_id}-title`}
    >
      <header className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-edge-strong bg-space-800 font-mono text-sm font-bold text-nav"
        >
          {String(rank).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="nav">{result.psi_id}</Badge>
            <MatchClassBadge matchClass={result.match_class} />
            <Badge tone="neutral">
              {EVIDENCE_CLASS_LABELS[result.evidence_class]}
            </Badge>
            {result.annotation_status === 'metadata_only' ? (
              <Badge tone="neutral">Metadata only · not ranked</Badge>
            ) : (
              <Badge tone="cyan">Source-extracted · provenance attached</Badge>
            )}
            {result.catalog_role === 'instrument_context' && (
              <Badge tone="compare">Instrument context</Badge>
            )}
          </div>
          <h3
            id={`result-${result.psi_id}-title`}
            className="mt-1.5 text-base font-semibold text-ink sm:text-lg"
          >
            {result.title}
            {result.acronym && result.acronym !== result.title && (
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {result.acronym}
              </span>
            )}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold tracking-[0.12em] text-ink-dim uppercase">
            Proximity score
          </p>
          <p className="font-mono text-2xl leading-none font-semibold text-nav">
            {formatScore(result.score)}
          </p>
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Meter
          label="Score"
          value={result.score}
          description="Weighted physical proximity over the requested dimensions. Ranks proximity; it does not establish applicability."
        />
        <Meter
          label="Coverage"
          value={result.coverage}
          description="Share of requested dimensions that carry a curated record value. Missing weights are not redistributed."
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-dim">
        Score = weighted similarity × √coverage over Q(S). {presentCount} of{' '}
        {requestedCount} requested dimensions carry a record value.
      </p>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        {result.justification}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section aria-labelledby={`result-${result.psi_id}-limits`}>
          <h4
            id={`result-${result.psi_id}-limits`}
            className="text-[11px] font-bold tracking-[0.1em] text-danger uppercase"
          >
            Limitations
          </h4>
          {result.limitations.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {result.limitations.map((limitation) => (
                <li
                  key={limitation}
                  className="flex gap-2 text-xs leading-relaxed text-ink-muted"
                >
                  <span aria-hidden="true" className="text-danger">
                    –
                  </span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-dim">
              No limitation was supplied. Treat a missing limitation as an
              evidence gap.
            </p>
          )}
        </section>

        <section aria-labelledby={`result-${result.psi_id}-prov`}>
          <h4
            id={`result-${result.psi_id}-prov`}
            className="text-[11px] font-bold tracking-[0.1em] text-compare uppercase"
          >
            Provenance pointers
          </h4>
          {result.provenance_refs.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {result.provenance_refs.map((reference) => (
                <li key={reference}>
                  <code className="rounded border border-edge bg-space-900 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                    {humanize(reference.replace('provenance.', ''))}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-dim">
              No provenance pointer was supplied.
            </p>
          )}
          <p className="mt-2 text-[11px] leading-snug text-ink-dim">
            Pointers identify the field-level annotation that supports each
            match. H1 supplies the verbatim source excerpt.
          </p>
        </section>
      </div>

      <section
        className="mt-4 rounded-tile border border-edge bg-space-900/55 p-3"
        aria-labelledby={`result-${result.psi_id}-dimensions`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4
            id={`result-${result.psi_id}-dimensions`}
            className="text-[11px] font-bold tracking-[0.1em] text-ink-muted uppercase"
          >
            Six-slot dimension breakdown
          </h4>
          <p className="text-[11px] text-ink-dim">
            Not requested · Missing · 0 similarity · Partial · Match
          </p>
        </div>
        <div className="mt-3">
          <DimensionBreakdown dimensions={result.dimensions} />
        </div>
      </section>
    </article>
  )
}
