import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
import { getDefaultSearchBranch, normalizeMinScore, normalizeSearchLimit } from '@/lib/search'
import { RepositorySearchExperience } from './RepositorySearchExperience'

interface SearchPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    q?: string
    branch?: string
    limit?: string
    min_score?: string
  }>
}

export default async function RepositorySearchPage({ params, searchParams }: SearchPageProps) {
  const { id } = await params
  const queryParams = await searchParams
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const repos = await backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null)
  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const branch = queryParams.branch || getDefaultSearchBranch(repo)
  const q = queryParams.q || ''

  return (
    <RepositorySearchExperience
      repo={repo}
      initialQuery={q}
      initialBranch={branch}
      initialLimit={normalizeSearchLimit(queryParams.limit)}
      initialMinScore={normalizeMinScore(queryParams.min_score)}
    />
  )
}
