'use client'

import { useEffect, useState, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { Alert } from '@/components/ui/Alert'
import { Tag } from '@/components/ui/Tag'
import { apiFetch } from '@/lib/api/client'
import { OrganizationInfo } from '@/lib/types/auth'
import { T } from '@/lib/tokens'

export default function SelectOrganizationPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pending = sessionStorage.getItem('pending_orgs')
    if (!pending) {
      router.push('/login')
      return
    }

    try {
      const orgs = JSON.parse(pending)
      setOrganizations(orgs)
    } catch {
      router.push('/login')
    }
  }, [router])

  async function handleSelect(orgId: string) {
    setSelected(orgId)
    setError(null)
    setLoading(true)

    try {
      await apiFetch('/api/auth/select-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId }),
      })

      sessionStorage.removeItem('pending_orgs')
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Erro ao selecionar organização')
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const orgRowStyle: CSSProperties = {
    textAlign: 'left',
    cursor: loading ? 'progress' : 'pointer',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    font: 'inherit',
    color: 'inherit',
    transition: 'background-color .15s ease, border-color .15s ease',
  }

  const orgNameStyle: CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: '15px',
    color: T.ink,
  }

  const orgSlugStyle: CSSProperties = {
    display: 'block',
    fontFamily: T.mono,
    fontSize: '12px',
    color: T.faint,
    marginTop: '2px',
  }

  if (organizations.length === 0) {
    return null
  }

  return (
    <AuthShell
      variant="centered"
      title="Selecionar organização"
      subtitle="Você pertence a mais de uma organização."
    >
      {error && <Alert variant="danger">{error}</Alert>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {organizations.map((org) => (
          <button
            key={org.id}
            type="button"
            disabled={loading}
            onClick={() => handleSelect(org.id)}
            style={{
              ...orgRowStyle,
              backgroundColor: selected === org.id ? T.accentBg : T.surface,
              borderColor: selected === org.id ? T.accent : T.border,
            }}
          >
            <span>
              <span style={orgNameStyle}>{org.name}</span>
              <span style={orgSlugStyle}>{org.slug}</span>
            </span>
            <span style={{ flex: 1 }} />
            <Tag variant={org.role === 'admin' ? 'accent' : 'default'}>{org.role}</Tag>
            <span style={{ color: T.faint }} aria-hidden="true">
              {selected === org.id && loading ? '…' : '→'}
            </span>
          </button>
        ))}
      </div>
    </AuthShell>
  )
}
