import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendListIssues } from '@/lib/api/issues'
import { canCloseIssue } from '@/lib/permissions'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'
import { IssuesClient } from './IssuesClient'

interface IssuesPageProps {
  params: Promise<{ id: string }>
}

export default async function IssuesPage({ params }: IssuesPageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  const [repos, issuesResponse] = await Promise.all([
    listRepositories(accessToken),
    // A missing provider token is a 503, not a 404 — surface it as "could not
    // load" rather than pretending the repository has no issues.
    backendListIssues(accessToken, id).catch((err) => ({ error: err as Error })),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const items = 'items' in issuesResponse ? issuesResponse.items : []
  const loadError = 'error' in issuesResponse ? issuesResponse.error.message : null

  return (
    <IssuesClient
      repoId={id}
      items={items}
      canClose={canCloseIssue(user)}
      loadError={loadError}
    />
  )
}
