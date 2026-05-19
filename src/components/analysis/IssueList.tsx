'use client'

import { CSSProperties, useMemo, useState } from 'react'
import { T } from '@/lib/tokens'
import { CodeIssue, SeverityLevel } from '@/lib/types/analysis'
import { IssueCard } from './IssueCard'

interface IssueListProps {
  issues: CodeIssue[]
  repoId: string
}

const severityOrder: SeverityLevel[] = ['critical', 'error', 'warning', 'info']

const severityLabel: Record<SeverityLevel, string> = {
  critical: 'Crítico',
  error: 'Erro',
  warning: 'Aviso',
  info: 'Info',
}

export function IssueList({ issues, repoId }: IssueListProps) {
  const [activeSeverities, setActiveSeverities] = useState<Set<SeverityLevel>>(
    () => new Set(severityOrder)
  )
  const [query, setQuery] = useState('')

  const countsBySeverity = useMemo(() => {
    const counts: Record<SeverityLevel, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
    }
    for (const issue of issues) {
      const severity = severityOrder.includes(issue.severity) ? issue.severity : 'info'
      counts[severity]++
    }
    return counts
  }, [issues])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return issues.filter((issue) => {
      if (!activeSeverities.has(issue.severity)) return false
      if (!normalizedQuery) return true
      const haystack = [issue.title, issue.description, issue.category, issue.file]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [issues, activeSeverities, query])

  const grouped = useMemo(() => {
    const map: Record<SeverityLevel, CodeIssue[]> = {
      critical: [],
      error: [],
      warning: [],
      info: [],
    }
    for (const issue of filtered) {
      const severity = severityOrder.includes(issue.severity) ? issue.severity : 'info'
      map[severity].push(issue)
    }
    return map
  }, [filtered])

  const toggleSeverity = (severity: SeverityLevel) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev)
      if (next.has(severity)) {
        next.delete(severity)
      } else {
        next.add(severity)
      }
      return next
    })
  }

  const toolbarStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  }

  const filterButtonStyle = (active: boolean, severity: SeverityLevel): CSSProperties => {
    const accent =
      severity === 'critical' || severity === 'error'
        ? T.danger
        : severity === 'warning'
        ? T.warn
        : T.faint
    return {
      appearance: 'none',
      border: `1px solid ${active ? accent : T.border}`,
      background: active ? T.surface : T.surfaceAlt,
      color: active ? T.ink : T.ink3,
      padding: '6px 11px',
      borderRadius: T.radius.button,
      font: '500 12.5px ' + T.font,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }
  }

  const searchStyle: CSSProperties = {
    flex: 1,
    minWidth: 200,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    padding: '7px 11px',
    font: '400 12.5px ' + T.font,
    outline: 'none',
  }

  const groupHeaderStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: T.ink3,
    margin: '14px 0 8px',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  }

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  const emptyStyle: CSSProperties = {
    padding: 24,
    textAlign: 'center',
    color: T.faint,
    fontSize: 13,
    border: `1px dashed ${T.border}`,
    borderRadius: T.radius.card,
    background: T.surfaceAlt,
  }

  if (issues.length === 0) {
    return <div style={emptyStyle}>Nenhum alerta encontrado nessa análise.</div>
  }

  const totalFiltered = filtered.length

  return (
    <div>
      <div style={toolbarStyle}>
        {severityOrder.map((severity) => (
          <button
            key={severity}
            type="button"
            style={filterButtonStyle(activeSeverities.has(severity), severity)}
            onClick={() => toggleSeverity(severity)}
            aria-pressed={activeSeverities.has(severity)}
          >
            {severityLabel[severity]} · {countsBySeverity[severity]}
          </button>
        ))}
        <input
          type="search"
          placeholder="Buscar por título, descrição ou arquivo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={searchStyle}
          aria-label="Buscar alertas"
        />
      </div>

      {totalFiltered === 0 ? (
        <div style={emptyStyle}>
          Nenhum alerta corresponde aos filtros atuais.
        </div>
      ) : (
        severityOrder.map((severity) => {
          const items = grouped[severity]
          if (items.length === 0) return null
          return (
            <section key={severity}>
              <h2 style={groupHeaderStyle}>
                {severityLabel[severity]} ({items.length})
              </h2>
              <div style={listStyle}>
                {items.map((issue, idx) => (
                  <IssueCard
                    key={issue.id ?? `${severity}-${idx}`}
                    issue={issue}
                    repoId={repoId}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
