import { useApi, type ContextCard } from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { MockNotice } from '../../components/ui/MockNotice'
import { Panel } from '../../components/ui/Panel'
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from '../../components/ui/States'

const STATUS: Record<
  NonNullable<ContextCard['status']>,
  { tone: BadgeTone; label: string }
> = {
  anticipated_in_psi: { tone: 'flame', label: 'Anticipated in PSI' },
  active_program: { tone: 'nav', label: 'Active program' },
  instrument_context: { tone: 'compare', label: 'Instrument context' },
}

function ContextCardView({ card }: { card: ContextCard }) {
  const status = card.status ? STATUS[card.status] : null

  return (
    <article className="surface h-full p-4" aria-labelledby={`ctx-${card.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id={`ctx-${card.id}`}
          className="text-sm font-semibold text-ink sm:text-base"
        >
          {card.title}
        </h3>
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        {card.summary}
      </p>
      <p className="mt-3">
        <a
          href={card.source_url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs font-semibold text-nav hover:underline"
        >
          {card.source_label}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{card.link_kind.replace('_', ' ')}</Badge>
        <Badge tone="neutral">Context only</Badge>
      </p>
    </article>
  )
}

interface ContextSectionProps {
  eyebrow: string
  title: string
  description: string
  cards: ContextCard[]
}

function ContextSection({
  eyebrow,
  title,
  description,
  cards,
}: ContextSectionProps) {
  return (
    <Panel eyebrow={eyebrow} title={title} description={description}>
      {cards.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ContextCardView key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No context cards"
          description="This context group is empty in the current fixture."
        />
      )}
    </Panel>
  )
}

export default function ContextPanel() {
  const api = useApi()
  const contextQuery = useAsyncData(
    (signal) => api.getContext({ signal }),
    [api],
  )

  if (contextQuery.status === 'loading' && !contextQuery.data) {
    return <LoadingBlock label="Loading historical and program context…" rows={4} />
  }

  if (contextQuery.status === 'error' && contextQuery.error) {
    return (
      <ErrorBlock
        title="Could not load context cards"
        error={contextQuery.error}
        onRetry={contextQuery.reload}
      />
    )
  }

  const data = contextQuery.data
  if (!data) return null

  return (
    <div className="space-y-5">
      <Panel
        eyebrow="Historical & Earth applications"
        title="Context is separated from evidence"
        description="Incidents, NASA Spinoff applications, and program context explain why the evidence matters. None is a numerical ranking input, a measured observation, or a PSI record."
        actions={<Badge tone="compare">Context only</Badge>}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            [
              'Incidents',
              'Explanatory precedents. Never scored and never used as a claim about a completed investigation.',
            ],
            [
              'Earth applications',
              'Spinoff links are thematic unless the source explicitly establishes lineage.',
            ],
            [
              'Program context',
              'FM2, SoFIE, and FLARE sit outside the 24-record corpus. They cannot appear as measured observations.',
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-tile border border-edge bg-space-900/55 p-3"
            >
              <p className="text-[10px] font-bold tracking-[0.1em] text-ink-dim uppercase">
                {title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {text}
              </p>
            </div>
          ))}
        </div>
        <MockNotice notice={data.mock_notice} className="mt-3" />
      </Panel>

      <ContextSection
        eyebrow="Incidents"
        title="Historical fire-safety precedents"
        description="Official NASA incident references. Apollo 1, Mir, and Apollo 13 remain narrative context only."
        cards={data.incidents}
      />

      <ContextSection
        eyebrow="Spinoff"
        title="Earth applications"
        description="NASA Spinoff technologies are linked thematically unless a source establishes direct lineage."
        cards={data.spinoff}
      />

      <ContextSection
        eyebrow="Program context"
        title="Current and anticipated NASA combustion work"
        description="Program context has no evidence class or measured table. FM2 is anticipated in PSI; SoFIE and FLARE are active programs with no current record in the 24-record corpus."
        cards={data.program_context}
      />

      <ContextSection
        eyebrow="Instrument context"
        title="Retained but never ranked"
        description="PSI-47 is part of the exact accessions but is assigned the instrument_context role, so it cannot become a completed fire-safety evidence match."
        cards={data.instrument_context}
      />
    </div>
  )
}
