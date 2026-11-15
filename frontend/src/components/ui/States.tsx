import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface LoadingBlockProps {
  label?: string
  rows?: number
  className?: string
}

export function LoadingBlock({
  label = 'Loading evidence…',
  rows = 3,
  className,
}: LoadingBlockProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-sm text-ink-muted">{label}</p>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-tile border border-edge bg-space-800/70 motion-reduce:animate-none"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

interface ErrorBlockProps {
  title?: string
  error: Error
  onRetry?: () => void
  className?: string
}

export function ErrorBlock({
  title = 'Could not load this evidence',
  error,
  onRetry,
  className,
}: ErrorBlockProps) {
  return (
    <div
      className={cn(
        'rounded-tile border border-danger/45 bg-danger/10 p-4',
        className,
      )}
      role="alert"
    >
      <p className="font-semibold text-danger">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{error.message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-[2px] border border-edge-strong bg-space-700 px-3 py-1.5 text-sm font-semibold text-ink hover:border-nav/60 hover:text-nav"
        >
          Retry request
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-tile border border-dashed border-edge-strong/80 bg-space-900/40 p-5 text-center',
        className,
      )}
    >
      <p className="font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xl text-sm text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  )
}
