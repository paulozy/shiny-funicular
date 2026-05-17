'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'

export interface CommandPaletteAction {
  id: string
  label: string
  icon?: string
  onSelect: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  actions?: CommandPaletteAction[]
}

export function CommandPalette({ open, onClose, actions = [] }: CommandPaletteProps) {
  const router = useRouter()
  const [repos, setRepos] = useState<RepositoryResponse[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)

  // Lazy-load the org repositories the first time the palette opens. We keep
  // them cached for the lifetime of the AppShell mount — switching orgs forces
  // a full page reload elsewhere, so this is safe.
  useEffect(() => {
    if (!open || repos.length > 0 || loadingRepos) return

    setLoadingRepos(true)
    setReposError(null)

    fetch('/api/repositories?limit=100&offset=0', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`status ${response.status}`)
        const data = (await response.json()) as RepositoryListResponse
        setRepos(data.repositories ?? [])
      })
      .catch(() => setReposError('Não foi possível carregar repositórios'))
      .finally(() => setLoadingRepos(false))
  }, [open, repos.length, loadingRepos])

  // Close on escape (cmdk already handles this internally, but we ensure the
  // outer overlay click also closes the palette).
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const navigateAndClose = (path: string) => {
    onClose()
    router.push(path)
  }

  const runActionAndClose = (action: CommandPaletteAction) => {
    onClose()
    action.onSelect()
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: T.overlay,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '14vh',
    zIndex: 1000,
  }

  const paletteStyle: CSSProperties = {
    width: 'min(620px, 92vw)',
    background: T.surfaceOverlay,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    boxShadow: T.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
  }

  const inputWrapperStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderBottom: `1px solid ${T.border}`,
  }

  const inputStyle: CSSProperties = {
    flex: 1,
    appearance: 'none',
    border: 0,
    outline: 'none',
    background: 'transparent',
    color: T.ink,
    fontSize: 14,
    fontFamily: T.font,
  }

  const listStyle: CSSProperties = {
    overflow: 'auto',
    padding: 6,
  }

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 13,
    color: T.ink,
    cursor: 'pointer',
    userSelect: 'none',
  }

  const headingStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
    padding: '10px 10px 6px',
  }

  const emptyStyle: CSSProperties = {
    padding: '16px 10px',
    fontSize: 12.5,
    color: T.faint,
    textAlign: 'center',
  }

  const kbdStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 10.5,
    padding: '1px 6px',
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    background: T.surfaceAlt,
    color: T.ink3,
    marginLeft: 'auto',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      style={overlayStyle}
      onMouseDown={(event) => {
        // Only close when the click is on the backdrop, not inside the palette.
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <Command
        label="Paleta de comandos"
        style={paletteStyle}
        // cmdk handles arrow-key navigation, enter to select, and filtering.
      >
        <div style={inputWrapperStyle}>
          <MFIcon name="search" size={14} color={T.ink3} />
          <Command.Input
            placeholder="Buscar rotas, repositórios e ações…"
            style={inputStyle}
            autoFocus
          />
          <span style={kbdStyle}>Esc</span>
        </div>

        <Command.List style={listStyle}>
          <Command.Empty style={emptyStyle}>Nenhum resultado.</Command.Empty>

          <Command.Group heading="Navegar" style={{ padding: 0 }}>
            <div style={headingStyle}>Navegar</div>
            <Command.Item
              value="code-hub home repositórios"
              onSelect={() => navigateAndClose('/')}
              style={itemStyle}
            >
              <MFIcon name="code" size={13} color={T.ink3} />
              Code Hub
            </Command.Item>
            <Command.Item
              value="settings configurações organização"
              onSelect={() => navigateAndClose('/settings')}
              style={itemStyle}
            >
              <MFIcon name="gear" size={13} color={T.ink3} />
              Configurações da organização
            </Command.Item>
          </Command.Group>

          {actions.length > 0 && (
            <Command.Group>
              <div style={headingStyle}>Ações</div>
              {actions.map((action) => (
                <Command.Item
                  key={action.id}
                  value={action.label}
                  onSelect={() => runActionAndClose(action)}
                  style={itemStyle}
                >
                  {action.icon && <MFIcon name={action.icon} size={13} color={T.ink3} />}
                  {action.label}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group>
            <div style={headingStyle}>
              Repositórios{loadingRepos ? ' · carregando…' : reposError ? ` · ${reposError}` : ''}
            </div>
            {repos.map((repo) => (
              <Command.Item
                key={repo.id}
                value={`${repo.name} ${repo.full_name ?? ''} ${repo.provider}`}
                onSelect={() => navigateAndClose(`/code/repositories/${repo.id}`)}
                style={itemStyle}
              >
                <MFIcon name="box" size={13} color={T.ink3} />
                <span style={{ fontFamily: T.mono }}>{repo.name}</span>
                <span style={{ color: T.faint, fontSize: 11.5 }}>{repo.provider}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
