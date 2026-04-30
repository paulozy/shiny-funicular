'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { OAuthButton } from '@/components/auth/OAuthButton'
import { apiFetch } from '@/lib/api/client'
import { T } from '@/lib/tokens'

interface LoginResponse {
  requires_organization_selection?: true
  organizations?: any[]
  error?: string
  message?: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [showOrgInput, setShowOrgInput] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<'github' | 'gitlab' | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'oauth_failed') {
      const reason = searchParams.get('reason')
      setError(reason ? decodeURIComponent(reason) : 'Autenticação OAuth falhou')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.requires_organization_selection) {
        sessionStorage.setItem('pending_orgs', JSON.stringify(response.organizations))
        router.push('/selecionar-organizacao')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'github' | 'gitlab') {
    setOauthProvider(provider)
    setShowOrgInput(true)
  }

  async function proceedWithOAuth() {
    if (!oauthProvider || !orgName) {
      setError('Nome da organização é obrigatório')
      return
    }

    window.location.href = `/auth/oauth/${oauthProvider}?organization_name=${encodeURIComponent(orgName)}`
  }

  const dividerStyle: CSSProperties = {
    textAlign: 'center' as const,
    color: T.faint,
    fontSize: '12px',
    margin: '20px 0',
    position: 'relative',
  }

  const dividerLineStyle: CSSProperties = {
    position: 'absolute' as const,
    top: '50%',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: T.border,
  }

  const dividerTextStyle: CSSProperties = {
    position: 'relative' as const,
    display: 'inline-block',
    backgroundColor: T.surface,
    padding: '0 8px',
  }

  const linkStyle: CSSProperties = {
    textAlign: 'center' as const,
    marginTop: '16px',
  }

  const linkTextStyle: CSSProperties = {
    fontSize: '13px',
    color: T.ink2,
  }

  if (showOrgInput && oauthProvider) {
    return (
      <AuthShell title={`Continuar com ${oauthProvider === 'github' ? 'GitHub' : 'GitLab'}`}>
        <Input
          label="Nome da organização"
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="ex: Minha Empresa"
          autoFocus
        />
        <Button
          variant="primary"
          onClick={proceedWithOAuth}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          Continuar
        </Button>
        <Button
          variant="default"
          onClick={() => {
            setShowOrgInput(false)
            setOauthProvider(null)
            setOrgName('')
          }}
          style={{ width: '100%' }}
        >
          Cancelar
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Acesse sua plataforma de desenvolvimento"
      footer={
        <div style={linkStyle}>
          <span style={linkTextStyle}>
            Não tem conta?{' '}
            <a href="/register" style={{ color: T.accent }}>
              Criar conta
            </a>
          </span>
        </div>
      }
    >
      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />

        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          Entrar
        </Button>
      </form>

      <div style={dividerStyle}>
        <div style={dividerLineStyle} />
        <div style={dividerTextStyle}>ou continue com</div>
      </div>

      <OAuthButton
        provider="github"
        onClick={() => handleOAuth('github')}
        disabled={loading}
      />

      <OAuthButton
        provider="gitlab"
        onClick={() => handleOAuth('gitlab')}
        disabled={loading}
      />
    </AuthShell>
  )
}
