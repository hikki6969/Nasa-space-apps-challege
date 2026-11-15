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
      className={cn('surface frame p-5 sm:p-6', className)}
      aria-labelledby={title ? headingId : undefined}
    >
      {hasHeader && (
        <header className="mb-5 border-b border-edge pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0">
              {eyebrow && (
                <p className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.22em] text-ink-dim uppercase">
                  <span
                    aria-hidden="true"
                    className="inline-block size-1.5 bg-flame"
                  />
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
            {actions && (
              <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end lg:shrink-0">
                {actions}
              </div>
            )}
          </div>
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}
