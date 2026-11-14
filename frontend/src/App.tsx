import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react'
import { AppShell } from './components/layout/AppShell'
import { LoadingBlock } from './components/ui/States'
import {
  TABS,
  tabFromHash,
  type TabDefinition,
  type TabId,
} from './lib/tabs'

const PANELS: Record<TabId, LazyExoticComponent<ComponentType>> = {
  overview: lazy(() => import('./features/overview/OverviewPanel')),
  investigations: lazy(
    () => import('./features/investigations/InvestigationsPanel'),
  ),
  compare: lazy(() => import('./features/compare/ComparePanel')),
  'observed-map': lazy(
    () => import('./features/observed-map/ObservedMapPanel'),
  ),
  context: lazy(() => import('./features/context/ContextPanel')),
  qa: lazy(() => import('./features/qa/QaPanel')),
}

interface TabPanelProps {
  tab: TabDefinition
  active: boolean
  children: ReactNode
}

function TabPanel({ tab, active, children }: TabPanelProps) {
  return (
    <section
      id={`panel-${tab.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      tabIndex={0}
      hidden={!active}
      className="focus:outline-none"
    >
      <Suspense
        fallback={
          <LoadingBlock label={`Loading ${tab.shortLabel}…`} rows={3} />
        }
      >
        {children}
      </Suspense>
    </section>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromHash(window.location.hash),
  )
  const [visited, setVisited] = useState<Set<TabId>>(
    () => new Set([tabFromHash(window.location.hash)]),
  )

  const markVisited = useCallback((tab: TabId) => {
    setVisited((previous) => {
      if (previous.has(tab)) return previous
      const next = new Set(previous)
      next.add(tab)
      return next
    })
  }, [])

  useEffect(() => {
    const syncFromHash = () => {
      const next = tabFromHash(window.location.hash)
      setActiveTab(next)
      markVisited(next)
    }
    window.addEventListener('hashchange', syncFromHash)
    window.addEventListener('popstate', syncFromHash)
    return () => {
      window.removeEventListener('hashchange', syncFromHash)
      window.removeEventListener('popstate', syncFromHash)
    }
  }, [markVisited])

  useEffect(() => {
    const tab = TABS.find((candidate) => candidate.id === activeTab)
    document.title = tab
      ? `${tab.label} · FireSight`
      : 'FireSight · NASA PSI Fire Safety Evidence Synthesizer'
  }, [activeTab])

  const selectTab = useCallback(
    (tab: TabId) => {
      setActiveTab(tab)
      markVisited(tab)
      const nextHash = `#${tab}`
      if (window.location.hash !== nextHash) {
        window.history.pushState(null, '', nextHash)
      }
    },
    [markVisited],
  )

  return (
    <AppShell activeTab={activeTab} onSelectTab={selectTab}>
      {TABS.map((tab) => {
        if (!visited.has(tab.id)) return null
        const Panel = PANELS[tab.id]
        return (
          <TabPanel key={tab.id} tab={tab} active={tab.id === activeTab}>
            <Panel />
          </TabPanel>
        )
      })}
    </AppShell>
  )
}
