import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendListAnalyses } from '@/lib/api/analysis'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
import { CodeAnalysis } from '@/lib/types/analysis'
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

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const [repos, analysesResponse] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    backendListAnalyses(accessToken, id, {
      type: 'code_review',
      status: 'completed',
      limit: 5,
      offset: 0,
    }).catch(() => null),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  // Filter out PR-scoped analyses; the issues page is repo-wide.
  // pull_request_id can be undefined (repo-wide) or a number (PR-scoped).
  const latestReview: CodeAnalysis | null =
    analysesResponse?.analyses.find((a) => !a.pull_request_id) ?? null

  return <IssuesClient analysis={latestReview} repo={repo} />
}
