import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { CoPensador } from '@/components/home/CoPensador'
import { RepoSearchBox } from '@/components/search/RepoSearchBox'
import { AppShell } from '@/components/shell/AppShell'
import { RepoTabBar } from '@/components/shell/RepoTabBar'
import { backendGetMe } from '@/lib/api/auth'
import { backendListAnalyses } from '@/lib/api/analysis'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendGetRepositories } from '@/lib/api/repositories'
import { getDefaultSearchBranch } from '@/lib/search'
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

  const [repos, orgConfig, analysesResponse] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    user.role === 'admin'
      ? backendGetOrganizationConfig(accessToken).catch(() => null)
      : Promise.resolve(null),
    backendListAnalyses(accessToken, id, { limit: 20, offset: 0 }).catch(() => null),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo || !repos) {
    notFound()
  }

  const branch = getDefaultSearchBranch(repo)

  // Pick the most recent completed code_review analysis. Backend already
  // returns them ordered DESC, so we just take the first match.
  const latestReview: CodeAnalysis | null =
    analysesResponse?.analyses.find(
      (a) => a.type === 'code_review' && a.status === 'completed'
    ) ?? null

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[
        { label: 'Code', href: '/' },
        { label: repo.name, href: `/code/repositories/${repo.id}` },
        { label: 'Alertas' },
      ]}
      searchSlot={<RepoSearchBox repoId={repo.id} defaultBranch={branch} />}
      aiPanel={<CoPensador repos={repos} orgConfig={orgConfig} focusedRepo={repo} />}
    >
      <RepoTabBar repoId={repo.id} activeTab="issues" />
      <IssuesClient analysis={latestReview} repo={repo} />
    </AppShell>
  )
}
