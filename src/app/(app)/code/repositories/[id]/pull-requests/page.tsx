import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { CoPensador } from '@/components/home/CoPensador'
import { RepoSearchBox } from '@/components/search/RepoSearchBox'
import { AppShell } from '@/components/shell/AppShell'
import { RepoTabBar } from '@/components/shell/RepoTabBar'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendListPullRequests } from '@/lib/api/pull_requests'
import { backendGetRepositories } from '@/lib/api/repositories'
import { getDefaultSearchBranch } from '@/lib/search'
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

  const [repos, orgConfig, prsResponse] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    user.role === 'admin'
      ? backendGetOrganizationConfig(accessToken).catch(() => null)
      : Promise.resolve(null),
    backendListPullRequests(accessToken, id).catch((err) => {
      // Backend returns 503 when the org has no GitHub token configured —
      // we surface that as "service unavailable" in the client rather than
      // a 404. Other errors collapse to "couldn't load".
      return { error: err as Error }
    }),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo || !repos) {
    notFound()
  }

  const branch = getDefaultSearchBranch(repo)

  const items =
    prsResponse && 'items' in prsResponse ? prsResponse.items : []
  const loadError =
    prsResponse && 'error' in prsResponse ? prsResponse.error.message : null

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[
        { label: 'Code', href: '/' },
        { label: repo.name, href: `/code/repositories/${repo.id}` },
        { label: 'Pull Requests' },
      ]}
      searchSlot={<RepoSearchBox repoId={repo.id} defaultBranch={branch} />}
      aiPanel={<CoPensador repos={repos} orgConfig={orgConfig} focusedRepo={repo} />}
    >
      <RepoTabBar repoId={repo.id} activeTab="pull-requests" />
      <PullRequestsClient items={items} repo={repo} loadError={loadError} />
    </AppShell>
  )
}
