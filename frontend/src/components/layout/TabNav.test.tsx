import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TabNav } from './TabNav'
import type { TabId } from '../../lib/tabs'

function Harness() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  return <TabNav activeTab={activeTab} onSelect={setActiveTab} />
}

describe('TabNav', () => {
  it('exposes WAI-ARIA tabs with a roving tabindex', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(6)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('tabindex', '0')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')
    expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-overview')

    await user.click(tabs[1]!)
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveFocus()
    expect(tabs[0]).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection with Arrow keys, Home, and End', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const tabs = screen.getAllByRole('tab')
    await user.tab()
    expect(tabs[0]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{End}')
    expect(tabs[5]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[5]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveFocus()
  })
})
