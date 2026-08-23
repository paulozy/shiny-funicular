import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { RepositoryOverviewClient } from './RepositoryOverviewClient'
import { canSyncRepository } from '@/lib/permissions'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

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

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  // The layout already fetched the repo for the AppShell/TabBar; here we just
  // resolve the same repo for this route. The lookup is a cheap call against
  // /repositories?limit=100 so the cost is negligible.
  const repos = await listRepositories(accessToken)
  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  return <RepositoryOverviewClient repo={repo} canSync={canSyncRepository(user)} />
}
