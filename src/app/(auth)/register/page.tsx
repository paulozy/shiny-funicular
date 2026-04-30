'use client'

import { useState, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { OAuthButton } from '@/components/auth/OAuthButton'
import { apiFetch } from '@/lib/api/client'
import { T } from '@/lib/tokens'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) {
      return 'Mínimo 8 caracteres'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPasswordError(null)

    const pwdError = validatePassword(password)
    if (pwdError) {
      setPasswordError(pwdError)
      return
    }

    setLoading(true)

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          organization_name: organizationName,
        }),
      })

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'github' | 'gitlab') {
    window.location.href = `/auth/oauth/${provider}?organization_name=${encodeURIComponent(organizationName || 'default')}`
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

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a usar sua plataforma de desenvolvimento"
      footer={
        <div style={linkStyle}>
          <span style={linkTextStyle}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: T.accent }}>
              Entrar
            </a>
          </span>
        </div>
      }
    >
      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Input
          label="Nome completo"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="João Silva"
          required
        />

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
          onChange={(e) => {
            setPassword(e.target.value)
            setPasswordError(null)
          }}
          placeholder="••••••••"
          hint="Mínimo 8 caracteres"
          error={passwordError || undefined}
          required
        />

        <Input
          label="Nome da organização"
          type="text"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="Minha Empresa"
          required
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          Criar conta
        </Button>
      </form>

      <div style={dividerStyle}>
        <div style={dividerLineStyle} />
        <div style={dividerTextStyle}>ou</div>
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
