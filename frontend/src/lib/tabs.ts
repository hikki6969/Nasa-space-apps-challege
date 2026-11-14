export type TabId =
  | 'overview'
  | 'investigations'
  | 'compare'
  | 'observed-map'
  | 'context'
  | 'qa'

export interface TabDefinition {
  id: TabId
  label: string
  shortLabel: string
  description: string
}

export const TABS: TabDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortLabel: 'Overview',
    description: 'Corpus counts, distributions, and active-scenario coverage warnings.',
  },
  {
    id: 'investigations',
    label: 'Investigations',
    shortLabel: 'Investigations',
    description: 'Canonical scenarios, deterministic scores, and six-slot breakdowns.',
  },
  {
    id: 'compare',
    label: 'Compare',
    shortLabel: 'Compare',
    description: 'Two-to-four-record matrix and Plotly parallel coordinates.',
  },
  {
    id: 'observed-map',
    label: 'Observed Flammability Map',
    shortLabel: 'Observed map',
    description: 'Measured oxygen/flow points only. No fitted model or validated boundary.',
  },
  {
    id: 'context',
    label: 'Historical & Earth Applications',
    shortLabel: 'Context',
    description: 'Incidents, Spinoff, and program context kept outside ranking.',
  },
  {
    id: 'qa',
    label: 'PSI Intelligence / Q&A',
    shortLabel: 'Q&A',
    description: 'Bounded retrieval questions with linked PSI citations.',
  },
]

export const DEFAULT_TAB: TabId = 'overview'

export function isTabId(value: string): value is TabId {
  return TABS.some((tab) => tab.id === value)
}

export function tabFromHash(hash: string): TabId {
  const candidate = hash.replace(/^#/, '')
  return isTabId(candidate) ? candidate : DEFAULT_TAB
}
