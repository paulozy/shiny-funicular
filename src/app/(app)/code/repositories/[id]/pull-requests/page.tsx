import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendListPullRequests } from '@/lib/api/pull_requests'
import { canReviewPullRequest } from '@/lib/permissions'
import { PullRequestsClient } from './PullRequestsClient'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

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

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  const [repos, prsResponse] = await Promise.all([
    listRepositories(accessToken),
    backendListPullRequests(accessToken, id).catch((err) => {
      // Backend returns 503 when the org has no token for this repository's provider —
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

  return (
    <PullRequestsClient
      items={items}
      repo={repo}
      loadError={loadError}
      canReview={canReviewPullRequest(user)}
    />
  )
}
