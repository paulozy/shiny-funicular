'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { CreateInviteResult } from '@/lib/types/organization-members'

interface InviteCreatedModalProps {
  /**
   * Visibility is driven entirely by this being non-null. The plaintext token
   * lives only in the parent's state for the lifetime of this modal — the API
   * stores a hash and will never return it again.
   */
  result: CreateInviteResult | null
  onClose: () => void
}

export function InviteCreatedModal({ result, onClose }: InviteCreatedModalProps) {
  if (!result) return null

  // Built client-side so it carries whatever host the admin is actually on.
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?invite=${encodeURIComponent(result.token)}`
      : `/register?invite=${result.token}`

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: T.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  }

  const cardStyle: CSSProperties = {
    width: 560,
    maxWidth: '92vw',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    display: 'flex',
    flexDirection: 'column',
  }

  const bodyStyle: CSSProperties = { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }

  const linkRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
  }

  return (
    <div style={overlayStyle} role="presentation">
      <div style={cardStyle} role="dialog" aria-modal="true" aria-label="Convite criado">
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <strong style={{ fontSize: 14 }}>Convite para {result.invite.email}</strong>
        </div>

        <div style={bodyStyle}>
          <Alert variant="warn">
            Este link não será mostrado novamente. Copie agora e envie para a pessoa —
            ele só pode ser usado uma vez e apenas por <strong>{result.invite.email}</strong>.
          </Alert>

          <div style={linkRowStyle}>
            <code
              style={{
                fontFamily: T.mono,
                fontSize: 12,
                color: T.ink,
                overflowWrap: 'anywhere',
                flex: 1,
              }}
            >
              {inviteLink}
            </code>
            <CopyButton text={inviteLink} label="Copiar link" />
          </div>

          <div style={{ fontSize: 12, color: T.ink3 }}>
            Papel: <strong>{result.invite.role}</strong> · expira em{' '}
            {new Date(result.invite.expires_at).toLocaleString('pt-BR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 16px',
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <Button variant="primary" size="md" onClick={onClose}>
            Já copiei, fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
