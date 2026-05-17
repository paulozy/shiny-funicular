'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserInfo } from '@/lib/types/auth'
import { apiFetch } from '@/lib/api/client'
import { CodeTemplate, GeneratedFile, isTerminalTemplateStatus } from '@/lib/types/template'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { TemplateFileTree } from '@/components/templates/TemplateFileTree'
import { TemplateFileViewer } from '@/components/templates/TemplateFileViewer'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'

interface TemplateDetailClientProps {
  user: UserInfo
  template: CodeTemplate
  htmlByPath: Record<string, string>
}

const POLL_INTERVAL_MS = 2500

export function TemplateDetailClient({
  user,
  template: initialTemplate,
  htmlByPath,
}: TemplateDetailClientProps) {
  const router = useRouter()
  const [template, setTemplate] = useState(initialTemplate)
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(
    initialTemplate.files?.[0] ?? null
  )
  const [pinning, setPinning] = useState(false)

  // Poll the template until it reaches a terminal state. When it does, we
  // refresh the page once so the server re-renders the Shiki highlights for
  // the newly generated files.
  useEffect(() => {
    if (isTerminalTemplateStatus(template.status)) return
    const handle = setInterval(async () => {
      try {
        const next = await apiFetch<CodeTemplate>(`/api/templates/${template.id}`, { method: 'GET' })
        setTemplate(next)
        if (isTerminalTemplateStatus(next.status)) {
          clearInterval(handle)
          // Re-hit the server to fetch pre-rendered Shiki HTML for the new files.
          router.refresh()
        }
      } catch {
        // tolerate transient errors
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(handle)
  }, [template.id, template.status, router])

  const togglePin = async () => {
    if (pinning) return
    const next = !template.is_pinned
    setPinning(true)
    try {
      const updated = await apiFetch<CodeTemplate>(`/api/templates/${template.id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: next }),
      })
      setTemplate(updated)
    } finally {
      setPinning(false)
    }
  }

  const isTerminal = isTerminalTemplateStatus(template.status)

  const headerStyle: CSSProperties = {
    padding: '16px 24px 12px',
    borderBottom: `1px solid ${T.border}`,
    background: T.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const titleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  }

  const titleStyle: CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    flex: 1,
    minWidth: 200,
  }

  const summaryStyle: CSSProperties = {
    fontSize: 13,
    color: T.ink3,
  }

  const statusPillStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: T.radius.tag,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    color:
      template.status === 'completed'
        ? T.ok
        : template.status === 'failed'
          ? T.danger
          : T.accent,
    fontSize: 11.5,
    fontWeight: 600,
  }

  const splitStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  }

  const displayName = template.name || template.summary?.split('\n')[0] || template.prompt

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[
        { label: 'Code', href: '/' },
        { label: 'Templates', href: '/templates' },
        { label: displayName.slice(0, 60) + (displayName.length > 60 ? '…' : '') },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>{displayName}</h1>
            <span style={statusPillStyle}>
              <MFIcon
                name={template.status === 'completed' ? 'check' : template.status === 'failed' ? 'x' : 'sparkles'}
                size={11}
                color="currentColor"
              />
              {template.status === 'completed'
                ? 'Concluído'
                : template.status === 'failed'
                  ? 'Falhou'
                  : template.status === 'generating'
                    ? 'Gerando…'
                    : 'Pendente'}
            </span>
            <Button
              variant={template.is_pinned ? 'primary' : 'default'}
              size="sm"
              onClick={togglePin}
              loading={pinning}
            >
              <MFIcon name="flag" size={11} />
              {template.is_pinned ? 'Fixado' : 'Fixar'}
            </Button>
          </div>
          {template.summary && (
            <div style={summaryStyle}>{template.summary}</div>
          )}
          {template.error_message && (
            <div
              style={{
                ...summaryStyle,
                color: T.danger,
                background: T.dangerBg,
                border: `1px solid ${T.dangerBorder}`,
                padding: '8px 12px',
                borderRadius: 6,
              }}
            >
              {template.error_message}
            </div>
          )}
          <div style={{ fontSize: 11, color: T.faint, display: 'flex', gap: 12 }}>
            <span>{template.files.length} arquivos</span>
            <span>{template.tokens_used.toLocaleString('pt-BR')} tokens</span>
            {template.model && <span>{template.model}</span>}
          </div>
        </div>

        {!isTerminal ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.faint,
              fontSize: 13,
              gap: 10,
            }}
          >
            <MFIcon name="sparkles" size={14} color={T.ai} />
            O template está sendo gerado. Esta página atualiza automaticamente.
          </div>
        ) : template.files.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.faint,
              fontSize: 13,
            }}
          >
            Nenhum arquivo foi gerado para este template.
          </div>
        ) : (
          <div style={splitStyle}>
            <TemplateFileTree
              files={template.files}
              activePath={activeFile?.path}
              onSelect={(file) => setActiveFile(file)}
            />
            <TemplateFileViewer file={activeFile} htmlByPath={htmlByPath} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
