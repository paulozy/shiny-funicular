import { CSSProperties } from 'react'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { T } from '@/lib/tokens'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

interface FileStubPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    path?: string
    branch?: string
    start_line?: string
    end_line?: string
  }>
}

export default async function RepositoryFileStubPage({ params, searchParams }: FileStubPageProps) {
  const { id } = await params
  const queryParams = await searchParams
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  const repos = await listRepositories(accessToken)
  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const branch = queryParams.branch || repo.metadata?.default_branch || 'main'
  const path = queryParams.path || 'arquivo'
  const lines =
    queryParams.start_line && queryParams.end_line
      ? `${queryParams.start_line}-${queryParams.end_line}`
      : queryParams.start_line || '-'

  const pageStyle: CSSProperties = {
    // Page padding comes from the app shell's content container.
  }

  const panelStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 18,
    maxWidth: 820,
  }

  return (
    <div style={pageStyle}>
      <div style={panelStyle}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: T.faint,
            marginBottom: 6,
          }}
        >
          Visualizador de arquivo em breve
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{path}</h1>
        <div style={{ marginTop: 10, fontSize: 13, color: T.ink3 }}>
          Branch <span style={{ fontFamily: T.mono }}>{branch}</span> · linhas{' '}
          <span style={{ fontFamily: T.mono }}>{lines}</span>
        </div>
      </div>
    </div>
  )
}
