import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetPullRequest } from '@/lib/api/pull_requests'
import { canReviewPullRequest } from '@/lib/permissions'
import { PullRequestDetailClient } from './PullRequestDetailClient'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

interface PullRequestDetailPageProps {
  params: Promise<{ id: string; pr_number: string }>
}

export default async function PullRequestDetailPage({ params }: PullRequestDetailPageProps) {
  const { id, pr_number } = await params
  const prNumber = Number(pr_number)
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  if (!Number.isFinite(prNumber)) {
    notFound()
  }

  const [repos, detail] = await Promise.all([
    listRepositories(accessToken),
    backendGetPullRequest(accessToken, id, prNumber).catch((err) => ({ error: err as Error })),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const initialDetail = detail && 'pull_request' in detail ? detail : null
  const loadError = detail && 'error' in detail ? detail.error.message : null

  return (
    <PullRequestDetailClient
      repoId={id}
      prNumber={prNumber}
      initialDetail={initialDetail}
      loadError={loadError}
      canReview={canReviewPullRequest(user)}
      provider={repo.provider ?? repo.type}
    />
  )
}
