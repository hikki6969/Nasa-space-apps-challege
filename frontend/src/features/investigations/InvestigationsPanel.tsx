import { useCallback, useState } from 'react'
import { useApi, type Scenario, type ScenarioInputs } from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge } from '../../components/ui/Badge'
import { MockNotice } from '../../components/ui/MockNotice'
import { Panel } from '../../components/ui/Panel'
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from '../../components/ui/States'
import { DimensionStatusLegend } from '../../components/investigations/DimensionBreakdown'
import { CatalogExplorer } from '../../components/investigations/CatalogExplorer'
import { CompareDrawer } from '../../components/investigations/CompareDrawer'
import { GapBanner } from '../../components/investigations/GapBanner'
import { RankedResultCard } from '../../components/investigations/RankedResultCard'
import { ScenarioControls } from '../../components/investigations/ScenarioControls'
import { ScenarioInputsList } from '../../components/investigations/ScenarioInputsList'
import { formatScenarioInput, humanize } from '../../lib/format'

function summarizeInputs(inputs: ScenarioInputs): string {
  const fields: Array<
    [
      string,
      Parameters<typeof formatScenarioInput>[0],
      number | string | null,
    ]
  > = [
    ['Oxygen', 'oxygen', inputs.oxygen_fraction],
    ['Pressure', 'pressure', inputs.pressure_psia],
    ['Gravity', 'gravity', inputs.gravity_g],
    ['Flow', 'flow', inputs.flow_velocity_cms],
    ['Phase', 'phase', inputs.fuel_phase],
    ['Theme', 'theme', inputs.safety_theme],
  ]
  return fields
    .map(([label, key, value]) => `${label}: ${formatScenarioInput(key, value)}`)
    .join(' · ')
}

function ScenarioWorkbench({ scenarios }: { scenarios: Scenario[] }) {
  const api = useApi()
  const initialInputs: ScenarioInputs = scenarios[0]
    ? scenarios[0].inputs
    : {
        oxygen_fraction: null,
        pressure_psia: null,
        gravity_g: null,
        flow_velocity_cms: null,
        fuel_phase: null,
        safety_theme: null,
      }
  const [rankedInputs, setRankedInputs] = useState(initialInputs)
  const [requestNonce, setRequestNonce] = useState(0)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const toggleCompare = useCallback((psiId: string) => {
    setCompareIds((previous) => {
      if (previous.includes(psiId)) {
        return previous.filter((id) => id !== psiId)
      }
      if (previous.length >= 4) return previous
      return [...previous, psiId]
    })
  }, [])

  const removeCompare = useCallback((psiId: string) => {
    setCompareIds((previous) => previous.filter((id) => id !== psiId))
  }, [])

  const clearCompare = useCallback(() => {
    setCompareIds([])
    setCompareOpen(false)
  }, [])

  const rankQuery = useAsyncData(
    (signal) => api.rank({ scenario: rankedInputs }, { signal }),
    [api, requestNonce],
  )

  const handleRank = useCallback((inputs: ScenarioInputs) => {
    setRankedInputs(inputs)
    setRequestNonce((value) => value + 1)
  }, [])

  const rank = rankQuery.data
  const rankLoading = rankQuery.status === 'loading'
  const rankedScenario = rank?.scenario_id
    ? (scenarios.find((scenario) => scenario.id === rank.scenario_id) ?? null)
    : null

  return (
    <div className="space-y-5">
      <ScenarioControls
        scenarios={scenarios}
        rankedInputs={rankedInputs}
        onRank={handleRank}
      />

      <Panel
        eyebrow="Submitted scenario"
        title="Inputs behind the current results"
        description="This read-only summary always matches the last ranked request. Draft edits above are not reflected until you select Rank scenario."
      >
        <ScenarioInputsList inputs={rankedInputs} />
      </Panel>

      {rankQuery.status === 'error' && rankQuery.error ? (
        <ErrorBlock
          title="Ranking failed for this scenario"
          error={rankQuery.error}
          onRetry={rankQuery.reload}
        />
      ) : rankLoading ? (
        <LoadingBlock label="Ranking completed evidence…" rows={3} />
      ) : rank ? (
        <section aria-labelledby="ranked-results-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="ranked-results-heading"
                className="text-lg font-semibold text-ink"
              >
                Ranked investigations
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {rank.results.length} result
                {rank.results.length === 1 ? '' : 's'} · requested set Q(S):{' '}
                {rank.requested_dimensions.length > 0
                  ? rank.requested_dimensions.map(humanize).join(' · ')
                  : 'none (no physical score)'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="nav">Score 0–1</Badge>
              <Badge tone="compare">Coverage 0–1</Badge>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ink-dim">
            <span className="font-bold tracking-[0.1em] uppercase">
              Ranked against
            </span>{' '}
            {summarizeInputs(rankedInputs)}
          </p>

          <GapBanner statement={rank.gap_statement} />

          <DimensionStatusLegend />

          {rank.results.length > 0 ? (
            <ol aria-label="Ranked results" className="space-y-4">
              {rank.results.map((result, index) => (
                <li key={result.psi_id}>
                  <RankedResultCard result={result} rank={index + 1} />
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="No completed record is eligible for this requested set"
              description="A record needs at least one present requested dimension to be ranked. The gap statement above is the honest result."
            />
          )}

          <MockNotice notice={rank.mock_notice} />
        </section>
      ) : null}

      <CatalogExplorer
        rankedResults={rank?.results ?? []}
        scenarioName={rankedScenario?.name ?? null}
        compareIds={compareIds}
        onToggleCompare={toggleCompare}
        onOpenCompare={() => setCompareOpen(true)}
      />

      {compareOpen && compareIds.length >= 1 && (
        <CompareDrawer
          ids={compareIds}
          rankedResults={rank?.results ?? []}
          scenarioName={rankedScenario?.name ?? null}
          onRemove={removeCompare}
          onClear={clearCompare}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  )
}

export default function InvestigationsPanel() {
  const api = useApi()
  const scenarioQuery = useAsyncData(
    (signal) => api.getScenarios({ signal }),
    [api],
  )

  if (scenarioQuery.status === 'loading' && !scenarioQuery.data) {
    return <LoadingBlock label="Loading canonical scenarios…" rows={4} />
  }

  if (scenarioQuery.status === 'error' && scenarioQuery.error) {
    return (
      <ErrorBlock
        title="Could not load the canonical scenarios"
        error={scenarioQuery.error}
        onRetry={scenarioQuery.reload}
      />
    )
  }

  const scenarios = scenarioQuery.data?.scenarios ?? []

  if (scenarios.length === 0) {
    return (
      <EmptyState
        title="No canonical scenarios are available"
        description="The H0 mock adapter serves four scenario fixtures. Connect the H2 backend for arbitrary scenario inputs."
      />
    )
  }

  return <ScenarioWorkbench scenarios={scenarios} />
}
