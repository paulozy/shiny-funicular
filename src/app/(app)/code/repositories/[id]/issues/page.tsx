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
    backendListAnalyses(accessToken, id, { limit: 20, offset: 0 }).catch(() => null),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const latestReview: CodeAnalysis | null =
    analysesResponse?.analyses.find(
      (a) => a.type === 'code_review' && a.status === 'completed'
    ) ?? null

  return <IssuesClient analysis={latestReview} repo={repo} />
}
