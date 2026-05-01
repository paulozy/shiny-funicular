import { CoPensador } from '@/components/home/CoPensador'
import { RepoSearchBox } from '@/components/search/RepoSearchBox'
import { AppShell } from '@/components/shell/AppShell'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendGetRepositories } from '@/lib/api/repositories'
import { getDefaultSearchBranch } from '@/lib/search'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
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

  const [repos, orgConfig] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    user.role === 'admin' ? backendGetOrganizationConfig(accessToken).catch(() => null) : Promise.resolve(null),
  ])
  const repo = repos?.repositories.find((item) => item.id === id)

  if (!repo || !repos) {
    notFound()
  }

  const branch = getDefaultSearchBranch(repo)

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: repo.name }]}
      searchSlot={<RepoSearchBox repoId={repo.id} defaultBranch={branch} />}
      aiPanel={<CoPensador repos={repos} orgConfig={orgConfig} focusedRepo={repo} />}
    >
      <RepositoryOverviewClient repo={repo} />
    </AppShell>
  )
}
