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
  repoID: string
  onClose: () => void
}

export function CoverageTokenCreatedModal({
  token,
  repoID,
  onClose,
}: CoverageTokenCreatedModalProps) {
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  if (!token) return null

  const snippet = `# .github/workflows/coverage.yml — exemplo
- name: Upload coverage to IDP
  env:
    IDP_BASE_URL: \${{ secrets.IDP_BASE_URL }}
    IDP_REPOSITORY_ID: ${repoID}
    IDP_COVERAGE_TOKEN: \${{ secrets.IDP_COVERAGE_TOKEN }}
  run: |
    curl --fail-with-body -X POST \\
      "$IDP_BASE_URL/api/v1/repositories/$IDP_REPOSITORY_ID/coverage" \\
      -H "Authorization: Bearer $IDP_COVERAGE_TOKEN" \\
      -H "X-Coverage-Format: go" \\
      -H "X-Commit-SHA: $GITHUB_SHA" \\
      -H "X-Coverage-Branch: \${GITHUB_REF#refs/heads/}" \\
      -H "Content-Type: application/octet-stream" \\
      --data-binary @coverage.out`

  const handleCopyToken = async () => {
    if (await copyText(token.token)) {
      setCopiedToken(true)
      window.setTimeout(() => setCopiedToken(false), 1200)
    }
  }
  const handleCopySnippet = async () => {
    if (await copyText(snippet)) {
      setCopiedSnippet(true)
      window.setTimeout(() => setCopiedSnippet(false), 1200)
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
  const snippetStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 12,
    margin: 0,
    overflow: 'auto',
    whiteSpace: 'pre',
    maxHeight: 220,
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

          <div>
            <p style={sectionLabelStyle}>Exemplo no GitHub Actions</p>
            <pre style={{ ...snippetStyle, marginTop: 6 }}>{snippet}</pre>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="default" onClick={handleCopySnippet}>
                {copiedSnippet ? 'Copiado' : 'Copiar snippet'}
              </Button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: T.ink2, margin: 0 }}>
            Configure os secrets <code style={{ fontFamily: T.mono }}>IDP_BASE_URL</code> e{' '}
            <code style={{ fontFamily: T.mono }}>IDP_COVERAGE_TOKEN</code> no seu repositório
            do GitHub. O <code style={{ fontFamily: T.mono }}>IDP_REPOSITORY_ID</code> já
            está preenchido no snippet.
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
