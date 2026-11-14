import { useMemo, useState } from 'react'
import {
  useApi,
  type CatalogResponse,
  type ContextResponse,
  type RankResponse,
  type Scenario,
} from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge } from '../../components/ui/Badge'
import { BarList } from '../../components/ui/BarList'
import { MockNotice } from '../../components/ui/MockNotice'
import { Panel } from '../../components/ui/Panel'
import { StatTile } from '../../components/ui/StatTile'
import { ErrorBlock, LoadingBlock } from '../../components/ui/States'
import { GapBanner } from '../../components/investigations/GapBanner'
import { MatchClassBadge } from '../../components/investigations/MatchClassBadge'
import { DIMENSION_LABELS } from '../../lib/labels'
import {
  formatPercent,
  formatScore,
  humanize,
} from '../../lib/format'

interface OverviewData {
  catalog: CatalogResponse
  scenarios: Scenario[]
  context: ContextResponse
  ranks: Record<string, RankResponse>
}

/**
 * Coverage warnings are derived from the API's ranked result set for the active
 * scenario. They describe missing record values; they never redistribute the
 * missing dimension weight or imply zero similarity.
 */
function coverageWarningsFor(rank: RankResponse): string[] {
  const requestedCount = rank.requested_dimensions.length

  if (rank.results.length === 0) {
    return [
      'No completed record carries any requested dimension, so no physical coverage exists for this scenario.',
    ]
  }

  const warnings = rank.results.flatMap((result) => {
    const present = result.dimensions.filter(
      (dimension) => dimension.requested && dimension.present,
    ).length
    if (present >= requestedCount) return []
    const missing = result.dimensions
      .filter((dimension) => dimension.requested && !dimension.present)
      .map((dimension) => DIMENSION_LABELS[dimension.name])
    const suffix =
      missing.length > 0 ? `; missing ${missing.join(', ')}` : ''
    return [
      `${result.acronym ?? result.title} carries ${present} of ${requestedCount} requested dimensions${suffix}.`,
    ]
  })

  return warnings.length > 0
    ? warnings
    : [
        `All ${rank.results.length} ranked ${
          rank.results.length === 1 ? 'record covers' : 'records cover'
        } every requested dimension (${requestedCount} of ${requestedCount}).`,
      ]
}

export default function OverviewPanel() {
  const api = useApi()
  const [activeScenarioId, setActiveScenarioId] = useState('A')

  const overview = useAsyncData<OverviewData>(async (signal) => {
    const [catalog, scenariosResponse, context] = await Promise.all([
      api.getCatalog({ signal }),
      api.getScenarios({ signal }),
      api.getContext({ signal }),
    ])

    const rankEntries = await Promise.all(
      scenariosResponse.scenarios.map(async (scenario) => {
        const rank = await api.rank({ scenario: scenario.inputs }, { signal })
        return [scenario.id, rank] as const
      }),
    )

    return {
      catalog,
      scenarios: scenariosResponse.scenarios,
      context,
      ranks: Object.fromEntries(rankEntries),
    }
  }, [api])

  const data = overview.data

  const activeScenario =
    data?.scenarios.find((scenario) => scenario.id === activeScenarioId) ??
    data?.scenarios[0] ??
    null

  const activeRank = activeScenario
    ? (data?.ranks[activeScenario.id] ?? null)
    : null

  const topResults = useMemo(
    () => activeRank?.results.slice(0, 3) ?? [],
    [activeRank],
  )

  const coverageWarnings = useMemo(
    () => (activeRank ? coverageWarningsFor(activeRank) : []),
    [activeRank],
  )

  if (overview.status === 'loading' && !data) {
    return <LoadingBlock label="Loading catalog overview…" rows={5} />
  }

  if (overview.status === 'error' && overview.error) {
    return (
      <ErrorBlock
        title="Could not load the catalog overview"
        error={overview.error}
        onRetry={overview.reload}
      />
    )
  }

  if (!data) return null

  const { catalog, context, scenarios } = data
  const counts = catalog.counts
  const curatedShare = counts.total > 0 ? counts.curated / counts.total : 0
  const rankedEvidence = counts.total - counts.instrument_context
  const allCovered = coverageWarnings.every((warning) =>
    warning.startsWith('All '),
  )

  return (
    <div className="space-y-5">
      <Panel
        eyebrow="Evidence overview"
        title="A small, exact corpus — not a predictive model"
        description="FireSight ranks completed NASA PSI combustion investigations against crew-fire scenarios and shows the evidence behind every score. Corpus counts come from the frozen 24-record catalog."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="safe">24-record filter</Badge>
            <Badge tone="compare">Deterministic</Badge>
          </div>
        }
      >
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatTile
            label="Catalog records"
            value={counts.total}
            hint="Measured-accession ledger. Anticipated FM2 is excluded."
            tone="nav"
          />
          <StatTile
            label="Completed"
            value={counts.complete}
            hint="data_status = complete"
            tone="safe"
          />
          <StatTile
            label="Curated"
            value={counts.curated}
            hint={`${formatPercent(curatedShare)} carry verified field annotations`}
            tone="safe"
          />
          <StatTile
            label="Metadata only"
            value={counts.metadata_only}
            hint="Catalog-visible; no physical score"
            tone="flame"
          />
          <StatTile
            label="Instrument context"
            value={counts.instrument_context}
            hint="PSI-47 is retained but never ranked"
            tone="compare"
          />
          <StatTile
            label="Anticipated"
            value={counts.anticipated}
            hint="FM2 program context; outside the measured catalog"
            tone="danger"
          />
        </dl>

        <p
          role="note"
          aria-label="Count interpretation"
          className="mt-3 rounded-tile border border-edge bg-space-900/55 px-3 py-2 text-xs leading-relaxed text-ink-muted"
        >
          Counts describe different axes, not disjoint buckets: completed and
          curated are separate status dimensions, and instrument context overlaps
          both. The {counts.anticipated} anticipated entr
          {counts.anticipated === 1 ? 'y is' : 'ies are'} FM2 program context,
          not a measured observation, and {counts.anticipated === 1 ? 'is' : 'are'}{' '}
          excluded from the catalog total, distributions, ranking, and observed
          map.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-tile border border-edge bg-space-900/55 p-4">
            <h3 className="text-sm font-semibold text-ink">
              Evidence-class distribution
            </h3>
            <div className="mt-3">
              <BarList
                label="Evidence class distribution"
                buckets={catalog.distributions.evidence_class}
                total={counts.total}
                emptyLabel="No evidence-class values are curated."
              />
            </div>
          </div>
          <div className="rounded-tile border border-edge bg-space-900/55 p-4">
            <h3 className="text-sm font-semibold text-ink">
              Primary safety-theme distribution
            </h3>
            <div className="mt-3">
              <BarList
                label="Safety theme distribution"
                buckets={catalog.distributions.safety_theme}
                total={counts.total}
                emptyLabel="No safety themes are curated."
              />
            </div>
          </div>
          <div className="rounded-tile border border-edge bg-space-900/55 p-4">
            <h3 className="text-sm font-semibold text-ink">
              Hardware / facility distribution
            </h3>
            <div className="mt-3">
              <BarList
                label="Hardware distribution"
                buckets={catalog.distributions.hardware}
                total={counts.total}
                emptyLabel="No hardware fields are curated."
              />
            </div>
          </div>
          <div className="rounded-tile border border-edge bg-space-900/55 p-4">
            <h3 className="text-sm font-semibold text-ink">
              Data-availability distribution
            </h3>
            <div className="mt-3">
              <BarList
                label="Data status distribution"
                buckets={catalog.distributions.data_status}
                total={counts.total}
                emptyLabel="No data-status values are available."
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-dim">
          Snapshot digest:{' '}
          <code className="font-mono text-ink-muted">
            {catalog.snapshot_sha256}
          </code>{' '}
          · four canonical scenarios are available in the Investigations tab.
        </p>

        <MockNotice notice={catalog.mock_notice} className="mt-3" />
      </Panel>

      <Panel
        eyebrow="Corpus boundary"
        title="PSI evidence and historical context stay separate"
        description="Historical incidents, NASA Spinoff applications, and program context explain why the evidence matters. They are counted separately and are never added to measured PSI evidence totals."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div
            role="group"
            aria-label="PSI evidence counts"
            className="rounded-tile border border-nav/40 bg-nav/5 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">
                PSI evidence corpus
              </h3>
              <Badge tone="nav">Measured / catalog</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Counted from <code className="font-mono">GET /api/catalog</code>.
              Instrument context is inside the catalog but excluded from ranked
              evidence.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <StatTile
                label="Ranked evidence candidates"
                value={rankedEvidence}
                hint="Catalog records minus instrument context"
                tone="nav"
              />
              <StatTile
                label="Verified field sets"
                value={counts.curated}
                hint="annotation_status = verified"
                tone="safe"
              />
              <StatTile
                label="Metadata only"
                value={counts.metadata_only}
                hint="No physical score"
                tone="flame"
              />
              <StatTile
                label="Instrument context"
                value={counts.instrument_context}
                hint="Never ranked or plotted"
                tone="compare"
              />
            </dl>
          </div>

          <div
            role="group"
            aria-label="Historical and Spinoff context counts"
            className="rounded-tile border border-compare/40 bg-compare/5 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">
                Historical &amp; Spinoff context
              </h3>
              <Badge tone="compare">Context only</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Counted from <code className="font-mono">GET /api/context</code>.
              These {context.incidents.length + context.spinoff.length} historical
              and Earth-application entries are never added to PSI evidence
              counts.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <StatTile
                label="Incidents"
                value={context.incidents.length}
                hint="Apollo 1, Mir, Apollo 13"
                tone="compare"
              />
              <StatTile
                label="Spinoff applications"
                value={context.spinoff.length}
                hint="Thematic Earth applications"
                tone="compare"
              />
              <StatTile
                label="Program context"
                value={context.program_context.length}
                hint="FM2, SoFIE, FLARE"
                tone="compare"
              />
              <StatTile
                label="Anticipated in PSI"
                value={counts.anticipated}
                hint="FM2 only; no measured table"
                tone="flame"
              />
            </dl>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-dim">
          The two groups are not summed. A context card can never become a ranked
          candidate, a measured observation, or a PSI evidence count.
        </p>

        <MockNotice notice={context.mock_notice} className="mt-3" />
      </Panel>

      <Panel
        eyebrow={
          activeScenario
            ? `Active scenario · ${activeScenario.short_name} — ${activeScenario.name}`
            : 'Active scenario'
        }
        title="Top completed evidence"
        description={
          activeScenario
            ? activeScenario.summary
            : 'No canonical scenario is present in the scenario fixture.'
        }
        actions={
          <Badge tone={activeRank && activeRank.results.length > 0 ? 'flame' : 'danger'}>
            Evidence gap
          </Badge>
        }
      >
        <div
          role="group"
          aria-label="Active overview scenario"
          className="flex flex-wrap gap-2"
        >
          {scenarios.map((scenario) => {
            const active = scenario.id === activeScenario?.id
            return (
              <button
                key={scenario.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveScenarioId(scenario.id)}
                className={
                  active
                    ? 'rounded-md border border-nav/70 bg-nav/20 px-3 py-1.5 text-xs font-semibold text-ink'
                    : 'rounded-md border border-edge-strong bg-space-800 px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-nav/60 hover:text-ink'
                }
              >
                {scenario.short_name} · {scenario.name}
              </button>
            )
          })}
        </div>

        {activeRank ? (
          <div className="mt-4 space-y-4">
            <GapBanner statement={activeRank.gap_statement} />

            {topResults.length > 0 ? (
              <ol className="space-y-2">
                {topResults.map((result, index) => (
                  <li
                    key={result.psi_id}
                    className="rounded-tile border border-edge bg-space-900/55 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-dim">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate text-sm font-semibold text-ink">
                          {result.acronym ?? result.title}
                        </span>
                        <Badge tone="nav">{result.psi_id}</Badge>
                        <MatchClassBadge matchClass={result.match_class} />
                      </div>
                      <span className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-ink-dim">
                          coverage {formatPercent(result.coverage)}
                        </span>
                        <span className="text-sm text-nav">
                          {formatScore(result.score)}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {result.justification}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-muted">
                No ranked result is available for this scenario fixture.
              </p>
            )}

            <section
              aria-labelledby="overview-coverage-heading"
              className="rounded-tile border border-edge bg-space-900/55 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="overview-coverage-heading"
                  className="text-sm font-semibold text-ink"
                >
                  Coverage warnings
                </h3>
                <Badge tone={allCovered ? 'safe' : 'flame'}>
                  {allCovered ? 'Full coverage' : 'Incomplete coverage'}
                </Badge>
              </div>
              <ul className="mt-2 space-y-1.5">
                {coverageWarnings.map((warning) => (
                  <li
                    key={warning}
                    className="flex gap-2 text-xs leading-relaxed text-ink-muted"
                  >
                    <span aria-hidden="true" className="text-flame">
                      !
                    </span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-xs text-ink-dim">
              Requested dimensions:{' '}
              {activeRank.requested_dimensions.length > 0
                ? activeRank.requested_dimensions.map(humanize).join(' · ')
                : 'none (no physical score)'}
              . Full six-slot breakdowns live in the Investigations tab.
            </p>

            <MockNotice notice={activeRank.mock_notice} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">
            No rank response is available for this scenario. The mock adapter
            serves only the four canonical scenarios.
          </p>
        )}
      </Panel>

      <Panel
        eyebrow="Integrity notes"
        title="What this view will not claim"
        description="These constraints are part of the evidence contract, not UI polish."
      >
        <ul className="space-y-2.5">
          {catalog.warnings.map((warning) => (
            <li
              key={warning}
              className="flex gap-2 rounded-tile border border-edge bg-space-900/50 px-3 py-2 text-xs leading-relaxed text-ink-muted"
            >
              <span aria-hidden="true" className="text-flame">
                !
              </span>
              <span>{warning}</span>
            </li>
          ))}
          <li className="flex gap-2 rounded-tile border border-edge bg-space-900/50 px-3 py-2 text-xs leading-relaxed text-ink-muted">
            <span aria-hidden="true" className="text-compare">
              i
            </span>
            <span>
              Scores rank physical proximity only. They are not a probability of
              ignition, a flammability boundary, or an applicability judgement.
            </span>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
