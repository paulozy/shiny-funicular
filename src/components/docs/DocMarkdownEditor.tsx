'use client'

import { CSSProperties, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'
import '@uiw/react-md-editor/markdown-editor.css'

// `@uiw/react-md-editor` references `window` on import; we lazy-load it on
// the client only so the page still renders on the server.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface DocMarkdownEditorProps {
  initialContent: string
  saving?: boolean
  onSave: (content: string) => void
  onCancel: () => void
}

/**
 * Split markdown editor (raw + live preview) used to manually refine an
 * org doc after Claude has generated it. Saving triggers `onSave` which the
 * parent wires to PATCH /api/docs/:id — that creates a new version row
 * rather than mutating in place.
 *
 * Theme is read once on mount from `documentElement.dataset.theme` and
 * watched via a tiny MutationObserver so the editor follows the global
 * theme toggle without a full reload.
 */
export function DocMarkdownEditor({
  initialContent,
  saving = false,
  onSave,
  onCancel,
}: DocMarkdownEditorProps) {
  const [content, setContent] = useState<string>(initialContent)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readTheme())

  useEffect(() => {
    if (typeof document === 'undefined') return
    const observer = new MutationObserver(() => setTheme(readTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  // Keep state in sync if the parent swaps the doc currently being edited.
  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  const wrapperStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    flex: 1,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    borderBottom: `1px solid ${T.border}`,
    background: T.surfaceAlt,
  }

  return (
    <div style={wrapperStyle} data-color-mode={theme}>
      <div style={headerStyle}>
        <MFIcon name="doc" size={13} color={T.ink3} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>
          Editar manualmente
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Button variant="default" size="sm" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={() => onSave(content)} loading={saving}>
            Salvar nova versão
          </Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
        <MDEditor
          value={content}
          onChange={(next) => setContent(next ?? '')}
          height={500}
          preview="live"
          data-color-mode={theme}
        />
      </div>
    </div>
  )
}

function readTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
