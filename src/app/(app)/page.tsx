import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CSSProperties } from 'react'
import { backendGetMe } from '@/lib/api/auth'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { LogoutButton } from './LogoutButton'
import { T } from '@/lib/tokens'

async function getUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return null
  }

  try {
    return await backendGetMe(accessToken)
  } catch {
    return null
  }
}

export default async function HomePage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: T.bg,
    padding: '32px 24px',
  }

  const contentStyle: CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
  }

  const titleStyle: CSSProperties = {
    fontSize: '26px',
    fontWeight: 600,
    letterSpacing: '-0.015em',
    color: T.ink,
    marginBottom: '8px',
    marginTop: 0,
  }

  const subtitleStyle: CSSProperties = {
    fontSize: '13px',
    color: T.ink3,
    marginBottom: '24px',
  }

  const infoGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  }

  const infoCardStyle: CSSProperties = {
    padding: '14px 16px',
  }

  const infoLabelStyle: CSSProperties = {
    fontSize: '10.5px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: T.faint,
    marginBottom: '6px',
  }

  const infoValueStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: T.ink,
    marginBottom: '4px',
  }

  const infoSubStyle: CSSProperties = {
    fontSize: '12px',
    color: T.ink3,
    fontFamily: T.mono,
  }

  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Bem-vindo, {user.full_name}</h1>
        <p style={subtitleStyle}>Sua plataforma de desenvolvimento está pronta</p>

        <div style={infoGridStyle}>
          <Card style={infoCardStyle}>
            <div style={infoLabelStyle}>Usuário</div>
            <div style={infoValueStyle}>{user.full_name}</div>
            <div style={infoSubStyle}>{user.email}</div>
          </Card>

          <Card style={infoCardStyle}>
            <div style={infoLabelStyle}>Organização</div>
            <div style={infoValueStyle}>{user.organization?.name}</div>
            <div style={infoSubStyle}>{user.organization?.slug}</div>
          </Card>

          <Card style={infoCardStyle}>
            <div style={infoLabelStyle}>Papel</div>
            <div style={{ marginTop: '6px' }}>
              <Tag
                variant={
                  user.role === 'admin'
                    ? 'accent'
                    : user.role === 'maintainer'
                      ? 'ai'
                      : 'default'
                }
              >
                {user.role}
              </Tag>
            </div>
          </Card>

          <Card style={infoCardStyle}>
            <div style={infoLabelStyle}>ID</div>
            <div style={{ ...infoSubStyle, marginTop: '6px' }}>{user.id.slice(0, 8)}</div>
          </Card>
        </div>

        <div style={buttonContainerStyle}>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
