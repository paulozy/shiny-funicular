'use client'

import { CSSProperties, useEffect, useRef, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { CodeTemplate, isTerminalTemplateStatus } from '@/lib/types/template'
import { MFIcon } from '@/components/icons/MFIcon'

interface TemplateActionsMenuProps {
  template: CodeTemplate
  onDeleted: (templateId: string) => void
}

export function TemplateActionsMenu({ template, onDeleted }: TemplateActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const terminal = isTerminalTemplateStatus(template.status)
  const displayName = template.name || template.summary?.split('\n')[0] || template.prompt

  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setOpen((v) => !v)
  }

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!terminal) return
    setOpen(false)
    setError(null)
    setShowConfirm(true)
  }

  const handleConfirmCancel = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (deleting) return
    setShowConfirm(false)
  }

  const handleConfirmDelete = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (deleting) return
    setDeleting(true)
    setError(null)
    try {
      await apiFetch<void>(`/api/templates/${template.id}`, { method: 'DELETE' })
      onDeleted(template.id)
      setShowConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir template')
    } finally {
      setDeleting(false)
    }
  }

  const kebabButtonStyle: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    background: T.surface,
    color: T.ink3,
    width: 26,
    height: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }

  const menuStyle: CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    minWidth: 160,
    background: T.surfaceOverlay,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 8,
    boxShadow: T.shadow,
    padding: 4,
    zIndex: 10,
  }

  const menuItemStyle = (disabled: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    width: '100%',
    background: 'none',
    border: 'none',
    color: disabled ? T.faint : T.danger,
    fontSize: 12.5,
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 4,
  })

  return (
    <>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <button
          type="button"
          style={kebabButtonStyle}
          onClick={handleToggle}
          aria-label="Mais ações"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <MFIcon name="more" size={14} color="currentColor" />
        </button>
        {open && (
          <div role="menu" style={menuStyle}>
            <button
              type="button"
              role="menuitem"
              disabled={!terminal}
              onClick={handleDeleteClick}
              style={menuItemStyle(!terminal)}
              title={terminal ? undefined : 'Aguarde o template terminar de gerar'}
            >
              <MFIcon name="x" size={12} color="currentColor" />
              Excluir
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Excluir template"
          onClick={handleConfirmCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: T.overlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              background: T.surfaceOverlay,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 12,
              boxShadow: T.shadow,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Excluir template?</div>
            <div style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>
              <strong>&ldquo;{displayName}&rdquo;</strong> será removido da listagem. Esta ação não pode ser
              desfeita.
            </div>
            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: T.danger,
                  background: T.dangerBg,
                  border: `1px solid ${T.dangerBorder}`,
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={deleting}
                style={{
                  padding: '6px 12px',
                  fontSize: 12.5,
                  borderRadius: 6,
                  border: `1px solid ${T.borderStrong}`,
                  background: T.surface,
                  color: T.ink,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '6px 12px',
                  fontSize: 12.5,
                  borderRadius: 6,
                  border: 'none',
                  background: T.danger,
                  color: T.inkInverse,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                  fontWeight: 500,
                }}
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
