import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { CheckStatus, Scorecard } from '@/lib/types/scorecard'

interface ScorecardCardProps {
  scorecard?: Scorecard
}

const STATUS_ICON: Record<CheckStatus, { name: string; color: string }> = {
  pass: { name: 'check', color: T.ok },
  fail: { name: 'x', color: T.danger },
  // No neutral glyph in the icon set; a dimmed chevron reads as 'skipped'
  // without implying pass or fail.
  not_applicable: { name: 'chevron-right', color: T.faint },
}

/**
 * Renders the checks and a passing count. There is intentionally no score, no
 * percentage and no letter grade: with a handful of checks a number invites
 * comparison between teams and says nothing about what to do next, which is
 * the whole point of the card.
 */
export function ScorecardCard({ scorecard }: ScorecardCardProps) {
  if (!scorecard) return null

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12.5,
  }

  // Failing checks first — the card is a to-do list, so what needs doing goes
  // where the eye lands.
  const order: Record<CheckStatus, number> = { fail: 0, pass: 1, not_applicable: 2 }
  const verdicts = [...scorecard.verdicts].sort((a, b) => order[a.status] - order[b.status])

  const allDone = scorecard.failing === 0 && scorecard.total > 0

  return (
    <section style={cardStyle} aria-label="Conformidade do repositório">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: T.ink, margin: 0 }}>Conformidade</h2>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: allDone ? T.ok : T.ink3, fontWeight: 600 }}>
          {scorecard.passing} de {scorecard.total}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {verdicts.map((verdict) => {
          const icon = STATUS_ICON[verdict.status]
          return (
            <div
              key={verdict.check_id}
              style={rowStyle}
              role="status"
              aria-label={`${verdict.title}: ${verdict.status === 'pass' ? 'ok' : verdict.status === 'fail' ? 'pendente' : 'não se aplica'}`}
            >
              <span style={{ marginTop: 1, flexShrink: 0 }}>
                <MFIcon name={icon.name} size={12} color={icon.color} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: verdict.status === 'not_applicable' ? T.faint : T.ink,
                    fontWeight: verdict.status === 'fail' ? 600 : 400,
                  }}
                >
                  {verdict.title}
                </div>
                {verdict.status !== 'pass' && (
                  <div style={{ color: T.ink3, fontSize: 11.5, lineHeight: 1.45, marginTop: 1 }}>
                    {verdict.reason}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {scorecard.not_applicable > 0 && (
        <div style={{ fontSize: 11, color: T.faint, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          {scorecard.not_applicable} verificação(ões) não se aplicam a este repositório e ficam
          fora da contagem.
        </div>
      )}
    </section>
  )
}
