import { useState, type FormEvent } from 'react'
import { useApi } from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { Badge } from '../../components/ui/Badge'
import { MockNotice } from '../../components/ui/MockNotice'
import { Panel } from '../../components/ui/Panel'
import { ErrorBlock, LoadingBlock } from '../../components/ui/States'

const PRESETS: Array<{ label: string; question: string }> = [
  {
    label: 'Oxygen context',
    question:
      'Which investigations address high-oxygen flammability, and does any record directly cover the 30% O₂ lunar-habitat scenario?',
  },
  {
    label: 'Detection evidence',
    question: 'What detection evidence exists, and is DAFT a ranked result?',
  },
  {
    label: 'Droplet suppression',
    question: 'Which records provide droplet suppression evidence?',
  },
  {
    label: 'Scope guard',
    question: 'Can you analyse rocket-engine propellant combustion stability?',
  },
]

export default function QaPanel() {
  const api = useApi()
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const answerQuery = useAsyncData(
    (signal) =>
      submitted
        ? api.ask({ question: submitted }, { signal })
        : Promise.resolve(null),
    [api, submitted, nonce],
  )

  function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed) return
    setDraft(trimmed)
    setSubmitted(trimmed)
    setNonce((value) => value + 1)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask(draft)
  }

  const answer = answerQuery.data
  const loading = answerQuery.status === 'loading'

  return (
    <div className="space-y-5">
      <Panel
        eyebrow="PSI intelligence / Q&A"
        title="Bounded questions with linked PSI citations"
        description="Answers come from the frozen 24-record corpus and template scope rules. FireSight does not answer rocket-engine or propellant-combustion questions."
        actions={<Badge tone="compare">Cited templates</Badge>}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="qa-question"
              className="text-xs font-bold tracking-[0.12em] text-ink-dim uppercase"
            >
              Question
            </label>
            <textarea
              id="qa-question"
              name="question"
              rows={3}
              maxLength={500}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about oxygen conditions, detection, droplet suppression, or the observed test domain…"
              className="mt-1.5 w-full resize-y rounded-tile border border-edge bg-space-900 px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-nav/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-dim">
              {draft.length}/500 characters · answers are rendered as plain
              text, never injected HTML.
            </p>
            <button
              type="submit"
              disabled={draft.trim().length === 0 || loading}
              className="shrink-0 rounded-[2px] border border-nav/60 bg-nav/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-nav/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Retrieving…' : 'Ask FireSight'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <p className="fs-micro text-ink-dim">
            Preset questions
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => ask(preset.question)}
                disabled={loading}
                className="rounded-[2px] border border-edge-strong bg-space-800 px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-compare/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {answerQuery.status === 'error' && answerQuery.error ? (
        <ErrorBlock
          title="The question could not be answered"
          error={answerQuery.error}
          onRetry={answerQuery.reload}
        />
      ) : loading ? (
        <LoadingBlock label="Retrieving cited evidence…" rows={2} />
      ) : answer ? (
        <Panel
          eyebrow={answer.status === 'answered' ? 'Answer' : 'Out of scope'}
          title={
            answer.status === 'answered'
              ? 'Template answer with citations'
              : 'This question is refused'
          }
          description={
            answer.status === 'answered'
              ? 'Every claim is limited to the committed corpus and the cited fields below.'
              : 'The question falls outside the committed spacecraft fire-safety evidence corpus.'
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge tone={answer.status === 'answered' ? 'safe' : 'danger'}>
                {answer.status === 'answered' ? 'Answered' : 'Refused'}
              </Badge>
              <Badge
                tone={answer.scope === 'in_scope' ? 'nav' : 'danger'}
              >
                {answer.scope === 'in_scope' ? 'In scope' : 'Out of scope'}
              </Badge>
            </div>
          }
          className={
            answer.status === 'refused' ? 'border-danger/40' : undefined
          }
        >
          <p className="text-sm leading-relaxed text-ink">{answer.answer}</p>

          <div className="mt-4">
            <h3 className="fs-micro text-ink-dim">
              Citations
            </h3>
            {answer.citations.length > 0 ? (
              <ul className="mt-1.5 space-y-2">
                {answer.citations.map((citation) => (
                  <li
                    key={`${citation.psi_id}-${citation.field}`}
                    className="rounded-tile border border-edge bg-space-900/55 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="nav">{citation.psi_id}</Badge>
                      <span className="text-xs font-semibold text-ink">
                        {citation.title}
                      </span>
                    </div>
                    {citation.field && citation.value && (
                      <p className="mt-1 text-xs text-ink-muted">
                        <span className="font-mono text-[10px] text-compare">
                          {citation.field}
                        </span>{' '}
                        · {citation.value}
                      </p>
                    )}
                    <a
                      href={citation.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-nav hover:underline"
                    >
                      NASA PSI record <span aria-hidden="true">↗</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-ink-dim">
                No PSI citation is attached to this answer.
              </p>
            )}
          </div>

          {answer.matched_psi_ids.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="fs-micro text-ink-dim">
                Matched records
              </span>
              {answer.matched_psi_ids.map((psiId) => (
                <Badge key={psiId} tone="compare">
                  {psiId}
                </Badge>
              ))}
            </p>
          )}

          {answer.limitations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[10px] font-bold tracking-[0.1em] text-danger uppercase">
                Limitations
              </h3>
              <ul className="mt-1.5 space-y-1">
                {answer.limitations.map((limitation) => (
                  <li
                    key={limitation}
                    className="flex gap-2 text-xs leading-relaxed text-ink-muted"
                  >
                    <span aria-hidden="true" className="text-danger">
                      –
                    </span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <MockNotice notice={answer.mock_notice} className="mt-4" />
        </Panel>
      ) : (
        <Panel title="How this bounded Q&A behaves">
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>
              Answers cite exact PSI IDs and fields. The mock adapter uses H0
              template fixtures; the H2 backend supplies canonical wording.
            </li>
            <li>
              Rocket-engine, propellant, and combustion-instability questions
              are refused rather than answered from outside the corpus.
            </li>
            <li>
              Detection evidence is never presented as flame-spread evidence,
              and no answer claims a validated flammability boundary.
            </li>
          </ul>
        </Panel>
      )}
    </div>
  )
}
