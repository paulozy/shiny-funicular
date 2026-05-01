'use client'

import { CSSProperties, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'

interface RepoSearchBoxProps {
  repoId: string
  defaultBranch: string
  initialQuery?: string
  compact?: boolean
}

export function RepoSearchBox({
  repoId,
  defaultBranch,
  initialQuery = '',
  compact = false,
}: RepoSearchBoxProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const params = new URLSearchParams()
    params.set('q', trimmed)
    params.set('branch', defaultBranch)
    router.push(`/code/repositories/${repoId}/search?${params.toString()}`)
  }

  const formStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: compact ? 260 : 360,
    maxWidth: '42vw',
    padding: '4px 8px',
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    background: T.surface,
  }

  const inputStyle: CSSProperties = {
    border: 0,
    outline: 'none',
    background: 'transparent',
    color: T.ink,
    fontFamily: T.font,
    fontSize: 12.5,
    minWidth: 0,
    flex: 1,
  }

  const buttonStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    background: T.surfaceAlt,
    color: T.ink3,
    padding: '3px 5px',
    cursor: query.trim() ? 'pointer' : 'not-allowed',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <form style={formStyle} onSubmit={handleSubmit} role="search" aria-label="Buscar neste repositório">
      <MFIcon name="search" size={13} color={T.faint} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="pergunte sobre este repo..."
        aria-label="Pergunte sobre este repositório"
        style={inputStyle}
      />
      <button type="submit" disabled={!query.trim()} style={buttonStyle} aria-label="Buscar">
        <MFIcon name="arrow-right" size={12} color="currentColor" />
      </button>
    </form>
  )
}
