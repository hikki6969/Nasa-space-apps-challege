import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  useApi,
  type AnnotationStatus,
  type CatalogRole,
  type DataStatus,
  type EvidenceClass,
  type FuelPhase,
  type InvestigationSummary,
  type ProjectType,
  type RankedResult,
  type SafetyTheme,
} from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge } from '../ui/Badge'
import { EmptyState, ErrorBlock, LoadingBlock } from '../ui/States'
import {
  EVIDENCE_CLASS_LABELS,
  PHASE_LABELS,
  THEME_LABELS,
} from '../../lib/labels'
import { formatPercent, formatScore, humanize } from '../../lib/format'
import { rankEligibility } from '../../lib/records'
import { InvestigationDetailView } from './InvestigationDetailView'

interface FilterState {
  theme: '' | SafetyTheme
  phase: '' | FuelPhase
  projectType: '' | ProjectType
  evidenceClass: '' | EvidenceClass
  dataStatus: '' | DataStatus
  annotationStatus: '' | AnnotationStatus
  catalogRole: '' | CatalogRole
}

const EMPTY_FILTERS: FilterState = {
  theme: '',
  phase: '',
  projectType: '',
  evidenceClass: '',
  dataStatus: '',
  annotationStatus: '',
  catalogRole: '',
}

type SortKey =
  | 'title_asc'
  | 'title_desc'
  | 'score_desc'
  | 'score_asc'
  | 'coverage_desc'
  | 'coverage_asc'

const SELECT_CLASS =
  'mt-1 w-full rounded-md border border-edge-strong bg-space-950 px-2 py-1.5 text-xs text-ink focus:border-nav/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]'

function optionsFromLabels<Key extends string>(
  labels: Record<Key, string>,
  anyLabel: string,
): Array<{ value: string; label: string }> {
  return [
    { value: '', label: anyLabel },
    ...Object.entries<string>(labels).map(([value, label]) => ({ value, label })),
  ]
}

const THEME_OPTIONS = optionsFromLabels(THEME_LABELS, 'Any theme')
const PHASE_OPTIONS = optionsFromLabels(PHASE_LABELS, 'Any phase')
const EVIDENCE_OPTIONS = optionsFromLabels(
  EVIDENCE_CLASS_LABELS,
  'Any evidence class',
)
const PROJECT_OPTIONS = [
  { value: '', label: 'Any project type' },
  { value: 'microgravity', label: 'Microgravity' },
  { value: 'ground', label: 'Ground' },
]
const DATA_STATUS_OPTIONS = [
  { value: '', label: 'Any data status' },
  { value: 'complete', label: 'Complete' },
  { value: 'partial', label: 'Partial' },
]
const ANNOTATION_OPTIONS = [
  { value: '', label: 'Any annotation status' },
  { value: 'source_cited', label: 'Source-cited' },
  { value: 'metadata_only', label: 'Metadata only' },
]
const ROLE_OPTIONS = [
  { value: '', label: 'Any catalog role' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'instrument_context', label: 'Instrument context' },
]
const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'score_desc', label: 'Physical score — high to low' },
  { value: 'score_asc', label: 'Physical score — low to high' },
  { value: 'coverage_desc', label: 'Coverage — high to low' },
  { value: 'coverage_asc', label: 'Coverage — low to high' },
]

function searchHaystack(
  record: InvestigationSummary,
  detailText: Record<string, string>,
): string {
  return [
    record.psi_id,
    record.title,
    record.acronym ?? '',
    record.research_area,
    record.fuel ?? '',
    ...record.hardware,
    record.safety_theme ? THEME_LABELS[record.safety_theme] : '',
    EVIDENCE_CLASS_LABELS[record.evidence_class],
    // Objectives/approach/findings are not part of the summary payload;
    // the lazy per-record detail fetch populates this cache on first search.
    detailText[record.psi_id] ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

function matchesFilters(
  record: InvestigationSummary,
  filters: FilterState,
): boolean {
  if (filters.theme && record.safety_theme !== filters.theme) return false
  if (filters.phase && !record.fuel_phases.includes(filters.phase)) return false
  if (filters.projectType && record.project_type !== filters.projectType) {
    return false
  }
  if (
    filters.evidenceClass &&
    record.evidence_class !== filters.evidenceClass
  ) {
    return false
  }
  if (filters.dataStatus && record.data_status !== filters.dataStatus) {
    return false
  }
  if (
    filters.annotationStatus &&
    record.annotation_status !== filters.annotationStatus
  ) {
    return false
  }
  if (filters.catalogRole && record.catalog_role !== filters.catalogRole) {
    return false
  }
  return true
}

function sortRecords(
  records: InvestigationSummary[],
  sort: SortKey,
  rankById: Map<string, RankedResult>,
): InvestigationSummary[] {
  const byTitleAsc = (left: InvestigationSummary, right: InvestigationSummary) =>
    left.title.localeCompare(right.title) || left.psi_id.localeCompare(right.psi_id)

  if (sort === 'title_asc') return [...records].sort(byTitleAsc)
  if (sort === 'title_desc') {
    return [...records].sort((left, right) => byTitleAsc(right, left))
  }

  const key = sort.startsWith('score') ? 'score' : 'coverage'
  const descending = sort.endsWith('desc')
  // Rank eligibility: records with no rank result (metadata-only,
  // instrument-context, or not in the active ranking) always sort after
  // ranked records — never interleaved with misleading numeric claims.
  return [...records].sort((left, right) => {
    const leftRank = rankById.get(left.psi_id)
    const rightRank = rankById.get(right.psi_id)
    const leftValue = leftRank ? leftRank[key] : null
    const rightValue = rightRank ? rightRank[key] : null

    if (leftValue === null && rightValue === null) return byTitleAsc(left, right)
    if (leftValue === null) return 1
    if (rightValue === null) return -1
    const delta = descending ? rightValue - leftValue : leftValue - rightValue
    return delta !== 0 ? delta : byTitleAsc(left, right)
  })
}

interface CatalogExplorerProps {
  rankedResults: RankedResult[]
  scenarioName: string | null
  compareIds: string[]
  onToggleCompare: (psiId: string) => void
  onOpenCompare: () => void
}

export function CatalogExplorer({
  rankedResults,
  scenarioName,
  compareIds,
  onToggleCompare,
  onOpenCompare,
}: CatalogExplorerProps) {
  const api = useApi()
  const baseId = useId()
  const catalogQuery = useAsyncData(
    (signal) => api.getCatalog({ signal }),
    [api],
  )

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('title_asc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Objectives/approach/findings text is not in the summary payload; cache it
  // per record the first time a search term appears.
  const [detailText, setDetailText] = useState<Record<string, string>>({})
  const loadingDetailText = useRef<Set<string>>(new Set())

  const rankById = useMemo(
    () =>
      new Map(rankedResults.map((result) => [result.psi_id, result])),
    [rankedResults],
  )

  const records = useMemo(
    () => catalogQuery.data?.records ?? [],
    [catalogQuery.data],
  )

  useEffect(() => {
    const term = search.trim()
    if (!term) return
    const missing = records.filter(
      (record) =>
        detailText[record.psi_id] === undefined &&
        !loadingDetailText.current.has(record.psi_id),
    )
    if (missing.length === 0) return
    for (const record of missing) loadingDetailText.current.add(record.psi_id)

    let cancelled = false
    void Promise.all(
      missing.map((record) =>
        api
          .getInvestigation(record.psi_id)
          .then(
            (detail) =>
              [
                record.psi_id,
                [detail.objectives_text, detail.approach_text, detail.key_findings_text ?? ''].join(' '),
              ] as const,
            () => [record.psi_id, ''] as const,
          ),
      ),
    ).then((entries) => {
      if (cancelled) return
      setDetailText((previous) => ({
        ...previous,
        ...Object.fromEntries(entries),
      }))
    })
    return () => {
      cancelled = true
    }
  }, [api, records, search, detailText])

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = records.filter((record) => {
      if (!matchesFilters(record, filters)) return false
      if (term && !searchHaystack(record, detailText).includes(term)) {
        return false
      }
      return true
    })
    return sortRecords(filtered, sort, rankById)
  }, [records, filters, search, sort, rankById, detailText])

  const activeFilterCount =
    (search.trim() !== '' ? 1 : 0) +
    (Object.keys(filters) as Array<keyof FilterState>).filter(
      (key) => filters[key] !== '',
    ).length
  const filtersActive = activeFilterCount > 0

  function updateFilter<Key extends keyof FilterState>(
    key: Key,
    value: FilterState[Key],
  ) {
    setFilters((previous) => ({ ...previous, [key]: value }))
  }

  function clearFilters() {
    setSearch('')
    setFilters(EMPTY_FILTERS)
    setSort('title_asc')
  }

  if (catalogQuery.status === 'loading' && !catalogQuery.data) {
    return <LoadingBlock label="Loading the 24-record catalog…" rows={6} />
  }

  if (catalogQuery.status === 'error' && catalogQuery.error) {
    return (
      <ErrorBlock
        title="Could not load the catalog"
        error={catalogQuery.error}
        onRetry={catalogQuery.reload}
      />
    )
  }

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="surface p-5 sm:p-6"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold tracking-[0.16em] text-nav uppercase">
            Catalog explorer
          </p>
          <h2
            id={`${baseId}-heading`}
            className="text-lg font-semibold tracking-tight text-ink sm:text-xl"
          >
            All 24 PSI records
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            Search and filter every accession, then open the detail view for
            objectives, approach, findings, source links, field-level provenance,
            and any table preview. Only source-cited evidence records can carry a
            physical score.
          </p>
        </div>
        <Badge tone="compare">Catalog, not a shortlist</Badge>
      </header>

      <div className="mt-4 rounded-tile border border-edge bg-space-900/55 p-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor={`${baseId}-search`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Search catalog
            </label>
            <input
              id={`${baseId}-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, PSI ID, acronym, fuel, hardware…"
              className="mt-1 w-full rounded-md border border-edge-strong bg-space-950 px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-dim focus:border-nav/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            />
          </div>

          <div>
            <label
              htmlFor={`${baseId}-theme`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Safety theme
            </label>
            <select
              id={`${baseId}-theme`}
              value={filters.theme}
              onChange={(event) =>
                updateFilter('theme', event.target.value as FilterState['theme'])
              }
              className={SELECT_CLASS}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-phase`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Fuel phase
            </label>
            <select
              id={`${baseId}-phase`}
              value={filters.phase}
              onChange={(event) =>
                updateFilter('phase', event.target.value as FilterState['phase'])
              }
              className={SELECT_CLASS}
            >
              {PHASE_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-project`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Project type
            </label>
            <select
              id={`${baseId}-project`}
              value={filters.projectType}
              onChange={(event) =>
                updateFilter(
                  'projectType',
                  event.target.value as FilterState['projectType'],
                )
              }
              className={SELECT_CLASS}
            >
              {PROJECT_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-evidence`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Evidence class
            </label>
            <select
              id={`${baseId}-evidence`}
              value={filters.evidenceClass}
              onChange={(event) =>
                updateFilter(
                  'evidenceClass',
                  event.target.value as FilterState['evidenceClass'],
                )
              }
              className={SELECT_CLASS}
            >
              {EVIDENCE_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-data-status`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Data status
            </label>
            <select
              id={`${baseId}-data-status`}
              value={filters.dataStatus}
              onChange={(event) =>
                updateFilter(
                  'dataStatus',
                  event.target.value as FilterState['dataStatus'],
                )
              }
              className={SELECT_CLASS}
            >
              {DATA_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-annotation`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Annotation status
            </label>
            <select
              id={`${baseId}-annotation`}
              value={filters.annotationStatus}
              onChange={(event) =>
                updateFilter(
                  'annotationStatus',
                  event.target.value as FilterState['annotationStatus'],
                )
              }
              className={SELECT_CLASS}
            >
              {ANNOTATION_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-role`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Catalog role
            </label>
            <select
              id={`${baseId}-role`}
              value={filters.catalogRole}
              onChange={(event) =>
                updateFilter(
                  'catalogRole',
                  event.target.value as FilterState['catalogRole'],
                )
              }
              className={SELECT_CLASS}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-sort`}
              className="text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase"
            >
              Sort by
            </label>
            <select
              id={`${baseId}-sort`}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className={SELECT_CLASS}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p aria-live="polite" className="text-xs text-ink-muted">
            Showing <span className="font-mono text-ink">{visibleRecords.length}</span>{' '}
            of <span className="font-mono text-ink">{records.length}</span> catalog
            records
          </p>
          {activeFilterCount > 0 && (
            <Badge tone="nav">{activeFilterCount} active</Badge>
          )}
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-edge-strong bg-space-800 px-2.5 py-1 text-xs font-semibold text-ink-muted hover:border-nav/60 hover:text-ink"
            >
              Clear search and filters
            </button>
          )}
          {sort !== 'title_asc' && rankedResults.length === 0 && (
            <span className="text-xs text-flame">
              No active ranking. Score and coverage sorts fall back to title.
            </span>
          )}
          <span className="text-xs text-ink-dim">
            Ranking column: {scenarioName ? `Scenario ${scenarioName}` : 'no active scenario'}
          </span>
          <button
            type="button"
            onClick={onOpenCompare}
            disabled={compareIds.length < 2}
            title={
              compareIds.length < 2
                ? 'Select at least two records to compare'
                : `Compare ${compareIds.length} selected records`
            }
            className="rounded-md border border-compare/50 bg-compare/10 px-3 py-1.5 text-xs font-semibold text-compare hover:bg-compare/20 disabled:cursor-not-allowed disabled:border-edge disabled:bg-space-900/40 disabled:text-ink-dim"
          >
            Compare selected ({compareIds.length})
          </button>
        </div>
      </div>

      {visibleRecords.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table
            aria-label="Catalog records"
            className="w-full border-collapse text-left text-sm"
          >
            <thead>
              <tr>
                {[
                  'Record',
                  'Status',
                  'Theme',
                  'Phase',
                  'Project',
                  'Evidence class',
                  'Ranking',
                  'Compare',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="border-b border-edge-strong px-2 py-2 text-[10px] font-bold tracking-[0.1em] text-ink-dim uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => {
                const eligibility = rankEligibility(record)
                const ranked = rankById.get(record.psi_id) ?? null
                const selected = selectedId === record.psi_id
                return (
                  <tr
                    key={record.psi_id}
                    className={
                      selected
                        ? 'bg-nav/10 align-top'
                        : 'align-top hover:bg-space-800/40'
                    }
                  >
                    <th scope="row" className="border-b border-edge px-2 py-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedId(record.psi_id)}
                        aria-expanded={selected}
                        className="min-w-0 text-left"
                      >
                        <span className="block font-mono text-[10px] font-bold text-nav">
                          {record.psi_id}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-ink">
                          {record.title}
                        </span>
                        {record.acronym && record.acronym !== record.title && (
                          <span className="block text-[11px] text-ink-dim">
                            {record.acronym}
                          </span>
                        )}
                      </button>
                    </th>
                    <td className="border-b border-edge px-2 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          tone={
                            record.annotation_status === 'source_cited'
                              ? 'safe'
                              : 'flame'
                          }
                        >
                          {record.annotation_status === 'source_cited'
                            ? 'Source-cited'
                            : 'Metadata only'}
                        </Badge>
                        <Badge
                          tone={
                            record.data_status === 'complete' ? 'nav' : 'neutral'
                          }
                        >
                          {humanize(record.data_status)}
                        </Badge>
                        {record.catalog_role === 'instrument_context' && (
                          <Badge tone="compare">Instrument context</Badge>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-edge px-2 py-2.5 text-xs text-ink-muted">
                      {record.safety_theme
                        ? THEME_LABELS[record.safety_theme]
                        : 'Uncurated'}
                    </td>
                    <td className="border-b border-edge px-2 py-2.5 text-xs text-ink-muted">
                      {record.fuel_phases.length > 0
                        ? record.fuel_phases
                            .map((phase) => PHASE_LABELS[phase])
                            .join(', ')
                        : '—'}
                    </td>
                    <td className="border-b border-edge px-2 py-2.5 text-xs text-ink-muted">
                      {humanize(record.project_type)}
                    </td>
                    <td className="border-b border-edge px-2 py-2.5 text-xs text-ink-muted">
                      {EVIDENCE_CLASS_LABELS[record.evidence_class]}
                    </td>
                    <td className="border-b border-edge px-2 py-2.5">
                      {!eligibility.eligible ? (
                        <Badge
                          tone={
                            eligibility.reason === 'instrument context'
                              ? 'compare'
                              : 'flame'
                          }
                        >
                          Not ranked · {eligibility.reason}
                        </Badge>
                      ) : ranked ? (
                        <span className="font-mono text-xs">
                          <span className="text-nav">
                            {formatScore(ranked.score)}
                          </span>
                          <span className="text-ink-dim">
                            {' '}
                            · {formatPercent(ranked.coverage)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-ink-dim">
                          Not in active ranking
                        </span>
                      )}
                    </td>
                    <td className="border-b border-edge px-2 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(record.psi_id)}
                        disabled={
                          !compareIds.includes(record.psi_id) &&
                          compareIds.length >= 4
                        }
                        onChange={() => onToggleCompare(record.psi_id)}
                        aria-label={`Mark ${record.psi_id} for comparison`}
                        className="size-4 accent-[var(--accent-cyan)]"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No catalog record matches these filters"
            description="Clear the search or filters to return to all 24 accessions. Filtering never changes the corpus itself."
          />
        </div>
      )}

      <div id={selectedId ? `catalog-detail-${selectedId}` : undefined}>
        {selectedId && (
          <InvestigationDetailView
            psiId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </section>
  )
}
