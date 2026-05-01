'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface SearchFiltersProps {
  branch: string
  limit: number
  minScore: number
  language: string
  languages: string[]
  loading?: boolean
  onBranchChange: (value: string) => void
  onLimitChange: (value: number) => void
  onMinScoreChange: (value: number) => void
  onLanguageChange: (value: string) => void
  onApply: () => void
}

export function SearchFilters({
  branch,
  limit,
  minScore,
  language,
  languages,
  loading,
  onBranchChange,
  onLimitChange,
  onMinScoreChange,
  onLanguageChange,
  onApply,
}: SearchFiltersProps) {
  const barStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
    padding: '11px 12px',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    marginBottom: 14,
  }

  const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }

  const labelStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    color: T.faint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  const controlStyle: CSSProperties = {
    height: 30,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    font: `12.5px ${T.font}`,
    padding: '0 9px',
  }

  const buttonStyle: CSSProperties = {
    height: 30,
    border: 0,
    borderRadius: T.radius.button,
    background: T.ink,
    color: '#fff',
    font: `500 12.5px ${T.font}`,
    padding: '0 12px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.65 : 1,
  }

  return (
    <div style={barStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Branch</span>
        <input
          value={branch}
          onChange={(event) => onBranchChange(event.target.value)}
          style={{ ...controlStyle, width: 150 }}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Limite</span>
        <select
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          style={{ ...controlStyle, width: 92 }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Score min.</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={minScore}
          onChange={(event) => onMinScoreChange(Number(event.target.value))}
          style={{ ...controlStyle, width: 92 }}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Linguagem</span>
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          style={{ ...controlStyle, width: 150 }}
        >
          <option value="">Todas</option>
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={onApply} disabled={loading} style={buttonStyle}>
        Aplicar
      </button>
    </div>
  )
}
