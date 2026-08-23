import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { ReviewDecision } from '@/lib/types/pull_request'

interface ReviewStateBadgeProps {
  /**
   * The verdict. `null` or `undefined` means the host could not be asked and
   * the badge renders nothing — showing "não revisado" there would state a
   * fact nobody measured.
   */
  decision?: ReviewDecision | null
  approvedBy?: string[]
  changesRequestedBy?: string[]
  /** Hide the reviewer names, for tight spots like a list row. */
  compact?: boolean
}

/**
 * What the host currently records about this change request's review.
 *
 * It exists because submitting a verdict used to leave no trace: the approval
 * landed on GitHub, a toast appeared, and the screen looked exactly as it had
 * a second earlier. A toast is an event; this is the state.
 */
export function ReviewStateBadge({
  decision,
  approvedBy = [],
  changesRequestedBy = [],
  compact = false,
}: ReviewStateBadgeProps) {
  // Unknown and "nobody reviewed" both render nothing, but for different
  // reasons: the first because we cannot say, the second because "no reviews
  // yet" is the unremarkable default and does not deserve a badge.
  if (decision === null || decision === undefined || decision === '') return null

  const tone = {
    approved: { bg: T.okBg, fg: T.ok, label: 'Aprovado' },
    changes_requested: { bg: T.dangerBg, fg: T.danger, label: 'Mudanças solicitadas' },
    commented: { bg: T.surfaceAlt, fg: T.ink3, label: 'Comentado' },
  }[decision]

  const people = decision === 'changes_requested' ? changesRequestedBy : approvedBy
  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: tone.bg,
    color: tone.fg,
    borderRadius: 999,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  }

  return (
    <span style={badgeStyle}>
      {tone.label}
      {!compact && people.length > 0 && (
        <span style={{ fontWeight: 400, fontFamily: T.mono, fontSize: 11.5 }}>
          {people.map((login) => `@${login}`).join(', ')}
        </span>
      )}
    </span>
  )
}
