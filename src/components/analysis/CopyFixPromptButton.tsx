'use client'

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'
import { buildFixPrompt } from '@/lib/fix-prompt'
import { CodeIssue } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

interface CopyFixPromptButtonProps {
  repo: RepositoryResponse
  issues: CodeIssue[]
  analysisCreatedAt?: string | null
}

/**
 * Generates a markdown prompt with the repo context + the analyzed issues so
 * the developer can paste it into Cursor / Claude Code / ChatGPT / Copilot
 * and ask for the fixes. The prompt is built client-side from data already
 * loaded for the page — no extra backend round-trip.
 *
 * Two affordances:
 * - Primary button copies straight to clipboard with a toast.
 * - "Ver prompt" opens a read-only modal so the user can inspect the
 *   generated text (and copy from there too).
 */
export function CopyFixPromptButton({ repo, issues, analysisCreatedAt }: CopyFixPromptButtonProps) {
  const [toast, setToast] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const result = buildFixPrompt({ repo, issues, analysisCreatedAt })

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.text)
      const sevSuffix = result.truncated
        ? ` · ${result.includedCount}/${result.totalCount} issues (severities menores cortadas)`
        : ` · ${result.includedCount} issues`
      setToast(`Prompt copiado${sevSuffix}`)
    } catch {
      setToast('Não foi possível copiar — abra "Ver prompt" e copie manualmente')
    }
  }, [result.text, result.truncated, result.includedCount, result.totalCount])

  if (issues.length === 0) return null

  const wrapStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  }

  const previewLinkStyle: CSSProperties = {
    appearance: 'none',
    background: 'transparent',
    border: 0,
    color: T.ink3,
    font: '500 12.5px ' + T.font,
    cursor: 'pointer',
    padding: '4px 2px',
  }

  const toastStyle: CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    background: T.ink,
    color: T.inkInverse,
    padding: '7px 11px',
    borderRadius: 6,
    fontSize: 12,
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 24px rgba(0,0,0,.18)',
    zIndex: 20,
  }

  return (
    <div style={wrapStyle}>
      <Button
        variant="primary"
        size="md"
        onClick={handleCopy}
        title={`Considera todas as ${issues.length} issues desta análise. Clipboard universal — funciona em Cursor, Claude Code, ChatGPT, Copilot.`}
      >
        <MFIcon name="sparkles" size={13} />
        Copiar prompt de fix
      </Button>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        style={previewLinkStyle}
        aria-haspopup="dialog"
      >
        Ver prompt
      </button>

      {toast && (
        <div style={toastStyle} role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {previewOpen && (
        <PromptPreviewModal
          text={result.text}
          onClose={() => setPreviewOpen(false)}
          onCopy={handleCopy}
        />
      )}
    </div>
  )
}

interface PromptPreviewModalProps {
  text: string
  onClose: () => void
  onCopy: () => void
}

function PromptPreviewModal({ text, onClose, onCopy }: PromptPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Open as a modal so the browser gives us focus management, ESC handling,
  // and an inert background for free. The matching .close() in the cleanup
  // ensures we don't leave a stale open <dialog> if the parent re-renders.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  const handleClose = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  // Strip the user-agent default styling so our inline styles can take over.
  // Browsers center <dialog open> automatically via inset:auto + margin:auto,
  // so we skip the manual flex overlay.
  const dialogStyle: CSSProperties = {
    background: T.surface,
    color: T.ink,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    maxWidth: 820,
    width: 'calc(100% - 48px)',
    maxHeight: '80vh',
    padding: 0,
    boxShadow: '0 24px 60px rgba(0,0,0,.28)',
  }

  const innerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'inherit',
  }

  const headerStyle: CSSProperties = {
    padding: '14px 18px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    margin: 0,
  }

  const preStyle: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '14px 18px',
    fontFamily: T.mono,
    fontSize: 12,
    color: T.ink2,
    background: T.surfaceAlt,
    margin: 0,
    whiteSpace: 'pre-wrap',
  }

  const footerStyle: CSSProperties = {
    padding: '12px 18px',
    borderTop: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  }

  const charCountStyle: CSSProperties = {
    fontSize: 11.5,
    color: T.faint,
    marginRight: 'auto',
  }

  return (
    <dialog
      ref={dialogRef}
      style={dialogStyle}
      onClose={onClose}
      aria-labelledby="prompt-modal-title"
      aria-describedby="prompt-modal-body"
    >
      <div style={innerStyle}>
        <div style={headerStyle}>
          <MFIcon name="sparkles" size={14} color={T.accent} />
          <h2 id="prompt-modal-title" style={titleStyle}>Prompt de fix</h2>
        </div>
        <pre id="prompt-modal-body" style={preStyle}>{text}</pre>
        <div style={footerStyle}>
          <span style={charCountStyle}>{text.length.toLocaleString('pt-BR')} caracteres</span>
          <Button variant="default" size="md" onClick={handleClose} autoFocus>
            Fechar
          </Button>
          <Button variant="primary" size="md" onClick={onCopy}>
            <MFIcon name="sparkles" size={13} />
            Copiar
          </Button>
        </div>
      </div>
    </dialog>
  )
}
