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
      <rect width="48" height="48" rx="4" fill="#151a22" />
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="47"
        rx="3.5"
        fill="none"
        stroke="#424c5e"
      />
      <path
        d="M5 13V5h8M43 13V5h-8M5 35v8h8M43 35v8h-8"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      <path
        d="M24 12c4.4 5.2 7.4 8.9 7.4 14.1A7.4 7.4 0 0 1 16.6 26.1C16.6 20.9 19.6 17.2 24 12Z"
        fill="#f59e0b"
      />
      <path
        d="M24 20.5c1.9 2.2 3 3.8 3 6a3 3 0 0 1-6 0c0-2.2 1.1-3.8 3-6Z"
        fill="#fff4d6"
      />
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
      <div className="hazard" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-edge bg-space-950/92 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-3">
            <a
              href="#overview"
              onClick={(event) => {
                event.preventDefault()
                onSelectTab('overview')
              }}
              className="group flex min-w-0 items-center gap-3 rounded-[2px]"
              aria-label="FireSight — go to Overview"
            >
              <BrandMark />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="text-lg font-black tracking-[0.18em] text-ink uppercase">
                    FireSight
                  </span>
                  <span className="hidden font-mono text-[10px] font-bold tracking-[0.2em] text-flame uppercase sm:inline">
                    NASA PSI
                  </span>
                </span>
                <span className="hidden truncate font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase sm:block">
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

      <footer className="border-t border-edge bg-space-950/70">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-5 font-mono text-[10px] leading-relaxed tracking-wide text-ink-dim sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="text-flame/80">FIRESIGHT</span> · DETERMINISTIC
            EVIDENCE SYNTHESIS · SCORES INDICATE PHYSICAL PROXIMITY, NOT
            APPLICABILITY.
          </p>
          <p>
            NO FITTED FLAMMABILITY MODEL, PROBABILITY, OR VALIDATED BOUNDARY
            IS PRESENTED.
          </p>
        </div>
      </footer>
    </div>
  )
}
