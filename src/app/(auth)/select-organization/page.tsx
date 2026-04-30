'use client'

import { useEffect, useState, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
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

  const orgCardStyle: CSSProperties = {
    padding: '14px 16px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    backgroundColor: T.surface,
  }

  const orgNameStyle: CSSProperties = {
    fontSize: '13.5px',
    fontWeight: 600,
    color: T.ink,
    marginBottom: '4px',
    fontFamily: T.mono,
  }

  const orgSlugStyle: CSSProperties = {
    fontSize: '12px',
    color: T.faint,
    fontFamily: T.mono,
    marginBottom: '8px',
  }

  const orgFooterStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  if (organizations.length === 0) {
    return null
  }

  return (
    <AuthShell title="Selecionar organização" subtitle="Você pertence a múltiplas organizações">
      {error && <Alert variant="danger">{error}</Alert>}

      <div style={{ marginBottom: '20px' }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            style={{
              ...orgCardStyle,
              backgroundColor: selected === org.id ? T.accentBg : T.surface,
              borderColor: selected === org.id ? T.accent : T.border,
            }}
            onClick={() => !loading && handleSelect(org.id)}
          >
            <div style={orgNameStyle}>{org.name}</div>
            <div style={orgSlugStyle}>{org.slug}</div>
            <div style={orgFooterStyle}>
              <Tag variant={org.role === 'admin' ? 'accent' : 'default'}>
                {org.role}
              </Tag>
              {selected === org.id && loading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <path d="M22 12a10 10 0 1 1-20 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AuthShell>
  )
}
