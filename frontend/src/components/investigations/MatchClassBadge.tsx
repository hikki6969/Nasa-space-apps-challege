import type { MatchClass } from '../../api/types'
import { MATCH_CLASS_LABELS } from '../../lib/labels'
import { Badge, type BadgeTone } from '../ui/Badge'

const TONES: Record<MatchClass, BadgeTone> = {
  direct_match: 'safe',
  partial_match: 'flame',
  contextual_only: 'compare',
  anticipated_in_psi: 'neutral',
}

const GLYPHS: Record<MatchClass, string> = {
  direct_match: '●',
  partial_match: '◐',
  contextual_only: '◇',
  anticipated_in_psi: '◷',
}

export function MatchClassBadge({ matchClass }: { matchClass: MatchClass }) {
  return (
    <Badge tone={TONES[matchClass]}>
      <span aria-hidden="true">{GLYPHS[matchClass]}</span>
      {MATCH_CLASS_LABELS[matchClass]}
    </Badge>
  )
}
