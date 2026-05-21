import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendListPullRequests } from '@/lib/api/pull_requests'
import { backendGetRepositories } from '@/lib/api/repositories'
import { PullRequestsClient } from './PullRequestsClient'

interface PullRequestsPageProps {
  params: Promise<{ id: string }>
}

export default async function PullRequestsPage({ params }: PullRequestsPageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const [repos, prsResponse] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    backendListPullRequests(accessToken, id).catch((err) => {
      // Backend returns 503 when the org has no GitHub token configured —
      // we surface that as "service unavailable" in the client rather than
      // a 404. Other errors collapse to "couldn't load".
      return { error: err as Error }
    }),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const items = prsResponse && 'items' in prsResponse ? prsResponse.items : []
  const loadError =
    prsResponse && 'error' in prsResponse ? prsResponse.error.message : null

  return <PullRequestsClient items={items} repo={repo} loadError={loadError} />
}
