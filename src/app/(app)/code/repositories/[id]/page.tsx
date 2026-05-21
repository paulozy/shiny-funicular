import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendListAnalyses } from '@/lib/api/analysis'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
import { CodeAnalysis } from '@/lib/types/analysis'
import { RepositoryOverviewClient } from './RepositoryOverviewClient'

interface RepositoryOverviewPageProps {
  params: Promise<{ id: string }>
}

export default async function RepositoryOverviewPage({ params }: RepositoryOverviewPageProps) {
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

  // Layout already fetched the repo for AppShell/TabBar; here we fetch only
  // the data this specific route consumes (latest completed code_review
  // analysis powers the "Alertas críticos" widget). The repo lookup is a
  // cheap call against /repositories?limit=100 so the cost is negligible.
  const [repos, analysesResponse] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    backendListAnalyses(accessToken, id, { limit: 5, offset: 0 }).catch(() => null),
  ])
  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const latestAnalysis: CodeAnalysis | null =
    analysesResponse?.analyses.find(
      (a) => a.type === 'code_review' && a.status === 'completed'
    ) ?? null

  return <RepositoryOverviewClient repo={repo} latestAnalysis={latestAnalysis} />
}
