import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/shell/AppShell'
import { RepoTabBar } from '@/components/shell/RepoTabBar'
import { RepositoryHeader } from '@/components/repository/RepositoryHeader'
import { knownOpenIssueCount } from '@/lib/repo-metrics'
import { canSyncRepository } from '@/lib/permissions'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

interface RepoLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/**
 * Persistent shell for the per-repository scope.
 *
 * Next.js App Router reuses this layout across navigations between sibling
 * routes (`/[id]`, `/[id]/files`, `/[id]/pull-requests`, ...), which means the
 * AppShell, the repository header and the tab row never unmount when the user
 * clicks between tabs.
 *
 * Each `page.tsx` below is responsible only for its own server-side data
 * fetch and rendering its client component — no more AppShell/RepoTabBar
 * duplication.
 */
export default async function RepoLayout({ children, params }: RepoLayoutProps) {
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

  const repos = await listRepositories(accessToken)

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo || !repos) {
    notFound()
  }

  return (
    <AppShell user={user} activeHub="code">
      <RepositoryHeader repo={repo} canSync={canSyncRepository(user)} />
      <RepoTabBar
        repoId={repo.id}
        prCount={repo.metadata?.pr_count}
        issueCount={knownOpenIssueCount(repo.metadata)}
        contributorCount={repo.metadata?.contributors}
      />
      {children}
    </AppShell>
  )
}
