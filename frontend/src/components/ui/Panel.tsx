import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PanelProps {
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function Panel({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: PanelProps) {
  const headingId = useId()
  const hasHeader = Boolean(eyebrow || title || description || actions)

  return (
    <section
      className={cn('surface p-5 sm:p-6', className)}
      aria-labelledby={title ? headingId : undefined}
    >
      {hasHeader && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[11px] font-bold tracking-[0.16em] text-nav uppercase">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                id={headingId}
                className="text-lg font-semibold tracking-tight text-ink sm:text-xl"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 max-w-3xl text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}
