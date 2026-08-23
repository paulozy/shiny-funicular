'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { MFIcon } from '@/components/icons/MFIcon'
import { copyText } from '@/lib/clipboard'
import { CoverageTokenWithSecret } from '@/lib/types/coverage'

interface CoverageTokenCreatedModalProps {
  // null hides the modal entirely. The plaintext token is intentionally
  // kept ONLY in the parent state for the lifetime of this modal so it
  // is cleared on close (parent sets state back to null).
  token: CoverageTokenWithSecret | null
  onClose: () => void
}

export function CoverageTokenCreatedModal({
  token,
  onClose,
}: CoverageTokenCreatedModalProps) {
  const [copiedToken, setCopiedToken] = useState(false)

  if (!token) return null

  const handleCopyToken = async () => {
    if (await copyText(token.token)) {
      setCopiedToken(true)
      window.setTimeout(() => setCopiedToken(false), 1200)
    }
  }
  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: T.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }
  const modalStyle: CSSProperties = {
    width: 600,
    maxHeight: '90vh',
    background: T.surface,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 12,
    boxShadow: T.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }
  const headerStyle: CSSProperties = {
    padding: '14px 16px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }
  const contentStyle: CSSProperties = {
    padding: '20px',
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  }
  const tokenRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: '8px 10px',
  }
  const tokenCodeStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12,
    flex: 1,
    overflow: 'auto',
    whiteSpace: 'nowrap',
    color: T.ink,
  }
  const footerStyle: CSSProperties = {
    padding: '12px 16px',
    borderTop: `1px solid ${T.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
  }
  const sectionLabelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: T.ink2,
    margin: 0,
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <MFIcon name="lock" size={14} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Token criado: {token.name}</span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.faint,
              fontSize: 20,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          <Alert variant="warn">
            Este token <strong>não será mostrado novamente</strong>. Copie agora e guarde
            como secret no seu CI.
          </Alert>

          <div>
            <p style={sectionLabelStyle}>Token de upload de cobertura</p>
            <div style={{ ...tokenRowStyle, marginTop: 6 }}>
              <code style={tokenCodeStyle}>{token.token}</code>
              <Button variant="default" onClick={handleCopyToken}>
                {copiedToken ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* The snippet used to be rendered here, GitHub-only and hardcoded to Go,
              and this modal is shown exactly once — so the instructions vanished
              the moment it closed. The panel on the settings page is now the one
              place that renders them, correct per provider and always reachable. */}
          <p style={{ fontSize: 12, color: T.ink2, margin: 0 }}>
            O snippet pronto para o seu CI está na seção{' '}
            <strong>Como configurar o CI</strong> desta mesma página, já com a URL do IDP e o
            ID do repositório preenchidos. Este é o único secret que você precisa criar:{' '}
            <code style={{ fontFamily: T.mono }}>IDP_COVERAGE_TOKEN</code>.
          </p>
        </div>

        <div style={footerStyle}>
          <Button variant="primary" onClick={onClose}>
            Já copiei, fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
