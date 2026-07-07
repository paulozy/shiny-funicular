import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetPullRequest } from '@/lib/api/pull_requests'
import { backendGetRepositories } from '@/lib/api/repositories'
import { PullRequestDetailClient } from './PullRequestDetailClient'

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

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  if (!Number.isFinite(prNumber)) {
    notFound()
  }

  const [repos, detail] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
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
    />
  )
}
