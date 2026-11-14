import { useRef, type KeyboardEvent } from 'react'
import { TABS, type TabId } from '../../lib/tabs'
import { cn } from '../../lib/cn'

interface TabNavProps {
  activeTab: TabId
  onSelect: (tab: TabId) => void
}

export function TabNav({ activeTab, onSelect }: TabNavProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  function focusAndSelect(index: number) {
    const bounded = (index + TABS.length) % TABS.length
    const tab = TABS[bounded]
    if (!tab) return
    onSelect(tab.id)
    buttonRefs.current[bounded]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        focusAndSelect(index + 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        focusAndSelect(index - 1)
        break
      case 'Home':
        event.preventDefault()
        focusAndSelect(0)
        break
      case 'End':
        event.preventDefault()
        focusAndSelect(TABS.length - 1)
        break
      default:
        break
    }
  }

  return (
    <div className="scrollbar-none -mb-px overflow-x-auto">
      <div
        role="tablist"
        aria-label="FireSight sections"
        aria-orientation="horizontal"
        className="flex min-w-max items-stretch gap-1"
      >
        {TABS.map((tab, index) => {
          const selected = tab.id === activeTab
          return (
            <button
              key={tab.id}
              ref={(element) => {
                buttonRefs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              title={tab.description}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'relative shrink-0 rounded-t-lg border border-b-0 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4',
                selected
                  ? 'border-edge-strong bg-space-800 text-ink'
                  : 'border-transparent text-ink-muted hover:bg-space-800/55 hover:text-ink',
              )}
            >
              <span aria-hidden="true" className="mr-1.5 font-mono text-[10px] text-nav">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-nav"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
