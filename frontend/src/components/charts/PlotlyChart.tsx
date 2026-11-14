import { useEffect, useRef, useState } from 'react'
import type {
  PlotlyConfig,
  PlotlyLayout,
  PlotlyTrace,
} from 'plotly.js-dist-min'
import { transparentConfig } from '../../lib/chartTheme'
import { cn } from '../../lib/cn'

type PlotlyDefault = typeof import('plotly.js-dist-min')['default']

let plotlyPromise: Promise<PlotlyDefault> | null = null

function loadPlotly(): Promise<PlotlyDefault> {
  plotlyPromise ??= import('plotly.js-dist-min').then((module) => module.default)
  return plotlyPromise
}

interface PlotlyChartProps {
  data: PlotlyTrace[]
  layout: PlotlyLayout
  config?: PlotlyConfig
  title: string
  className?: string
  minHeight?: number
}

export function PlotlyChart({
  data,
  layout,
  config,
  title,
  className,
  minHeight = 360,
}: PlotlyChartProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    setStatus('loading')
    setErrorMessage(null)

    loadPlotly()
      .then((plotly) => {
        if (disposed) return null
        return plotly.react(
          host,
          data,
          layout,
          { ...transparentConfig(), ...config } as PlotlyConfig,
        )
      })
      .then(() => {
        if (!disposed) setStatus('ready')
      })
      .catch((error: unknown) => {
        if (disposed) return
        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Chart rendering failed.',
        )
      })

    return () => {
      disposed = true
      loadPlotly()
        .then((plotly) => plotly.purge(host))
        .catch(() => {
          // The chart host is gone; nothing left to clean up.
        })
    }
  }, [data, layout, config])

  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof ResizeObserver === 'undefined') return

    let frame = 0
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        loadPlotly()
          .then((plotly) => plotly.Plots.resize(host))
          .catch(() => {
            // Plotly is not mounted yet; the next observation will retry.
          })
      })
    })
    observer.observe(host)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div className={cn('relative min-w-0', className)}>
      <p className="sr-only">{title}</p>
      <div
        ref={hostRef}
        aria-hidden="true"
        style={{ minHeight }}
        className="w-full"
      />
      {status === 'loading' && (
        <div
          className="absolute inset-0 grid place-items-center rounded-tile border border-edge bg-space-900/75"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm text-ink-muted">Rendering chart…</span>
        </div>
      )}
      {status === 'error' && (
        <div
          className="absolute inset-0 grid place-items-center rounded-tile border border-danger/40 bg-space-900/95 p-4 text-center"
          role="alert"
        >
          <div>
            <p className="font-semibold text-danger">Chart unavailable</p>
            <p className="mt-1 text-xs text-ink-muted">{errorMessage}</p>
            <p className="mt-2 text-xs text-ink-dim">
              The accessible data table below remains available.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
