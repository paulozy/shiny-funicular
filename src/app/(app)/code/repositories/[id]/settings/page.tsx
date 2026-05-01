import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendGetRepositories } from '@/lib/api/repositories'
import { getDefaultSearchBranch } from '@/lib/search'
import { AppShell } from '@/components/shell/AppShell'
import { RepoSearchBox } from '@/components/search/RepoSearchBox'
import { CoPensador } from '@/components/home/CoPensador'
import { RepositorySettingsClient } from './RepositorySettingsClient'

interface RepositorySettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function RepositorySettingsPage({ params }: RepositorySettingsPageProps) {
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

  if (!repo) {
    notFound()
  }

  const branch = getDefaultSearchBranch(repo)

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: repo.name, href: `/code/repositories/${repo.id}` }, { label: 'configurações' }]}
      searchSlot={<RepoSearchBox repoId={repo.id} defaultBranch={branch} />}
      aiPanel={repos ? <CoPensador repos={repos} orgConfig={orgConfig} focusedRepo={repo} /> : undefined}
    >
      <RepositorySettingsClient
        repo={repo}
        orgConfig={orgConfig}
        canConfigureOrganization={user.role === 'admin'}
      />
    </AppShell>
  )
}
