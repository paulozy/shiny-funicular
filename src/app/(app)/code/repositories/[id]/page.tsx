import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
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

  // The layout already fetched the repo for the AppShell/TabBar; here we just
  // resolve the same repo for this route. The lookup is a cheap call against
  // /repositories?limit=100 so the cost is negligible.
  const repos = await backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null)
  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  return <RepositoryOverviewClient repo={repo} />
}
