import type { ReactNode } from 'react'
import { useApiHandle } from '../../api'
import type { TabId } from '../../lib/tabs'
import { Badge } from '../ui/Badge'
import { TabNav } from './TabNav'

function BrandMark() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-10 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx="12" fill="#060b16" />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="#6db4ff"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <path
        d="M24 9c4.8 5.6 8 9.6 8 15.2A8 8 0 0 1 16 24.2C16 18.6 19.2 14.6 24 9Z"
        fill="#ffb224"
      />
      <path
        d="M24 20c2 2.4 3.2 4 3.2 6.4a3.2 3.2 0 0 1-6.4 0c0-2.4 1.2-4 3.2-6.4Z"
        fill="#fff4d6"
      />
      <circle cx="38" cy="15" r="2" fill="#45e0d0" />
    </svg>
  )
}

interface AppShellProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ activeTab, onSelectTab, children }: AppShellProps) {
  const { mode } = useApiHandle()

  return (
    <div className="flex min-h-dvh flex-col">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-edge/80 bg-space-950/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-3">
            <a
              href="#overview"
              onClick={(event) => {
                event.preventDefault()
                onSelectTab('overview')
              }}
              className="group flex min-w-0 items-center gap-3 rounded-lg"
              aria-label="FireSight — go to Overview"
            >
              <BrandMark />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="text-lg font-black tracking-[0.18em] text-ink uppercase">
                    FireSight
                  </span>
                  <span className="hidden text-[10px] font-bold tracking-[0.18em] text-flame uppercase sm:inline">
                    NASA PSI
                  </span>
                </span>
                <span className="hidden truncate text-xs text-ink-muted sm:block">
                  Fire Safety Evidence Synthesizer
                </span>
              </span>
            </a>

            <div className="flex shrink-0 items-center gap-2">
              {mode === 'mock' ? (
                <>
                  <Badge tone="flame">H0 mock data</Badge>
                  <span className="hidden text-xs text-ink-dim md:inline">
                    Not canonical NASA evidence
                  </span>
                </>
              ) : (
                <Badge tone="safe">Live API</Badge>
              )}
              <Badge tone="nav" className="hidden sm:inline-flex">
                Contract H0
              </Badge>
            </div>
          </div>

          <nav aria-label="Primary navigation">
            <TabNav activeTab={activeTab} onSelect={onSelectTab} />
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
      >
        <h1 className="sr-only">
          FireSight — NASA PSI Fire Safety Evidence Synthesizer
        </h1>
        {children}
      </main>

      <footer className="border-t border-edge/70 bg-space-950/70">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-5 text-xs text-ink-dim sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            FireSight · deterministic evidence synthesis · scores indicate
            physical proximity, not applicability.
          </p>
          <p>
            No fitted flammability model, probability, or validated boundary is
            presented.
          </p>
        </div>
      </footer>
    </div>
  )
}
