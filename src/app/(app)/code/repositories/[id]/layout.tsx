import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { CoPensador } from '@/components/home/CoPensador'
import { RepoSearchBox } from '@/components/search/RepoSearchBox'
import { AppShell } from '@/components/shell/AppShell'
import { StickyRepoTabBar } from '@/components/shell/StickyRepoTabBar'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendGetRepositories } from '@/lib/api/repositories'
import { getDefaultSearchBranch } from '@/lib/search'

interface RepoLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/**
 * Persistent shell for the per-repository scope.
 *
 * Next.js App Router reuses this layout across navigations between sibling
 * routes (`/[id]`, `/[id]/issues`, `/[id]/pull-requests`, ...), which means
 * the AppShell and the `RepoTabBar` never unmount when the user clicks
 * between tabs. The tabbar is wrapped in `StickyRepoTabBar` so it also stays
 * pinned to the top on long-scrolling sub-pages.
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

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const [repos, orgConfig] = await Promise.all([
    backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null),
    user.role === 'admin'
      ? backendGetOrganizationConfig(accessToken).catch(() => null)
      : Promise.resolve(null),
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
      breadcrumb={[
        { label: 'Code', href: '/' },
        { label: repo.name, href: `/code/repositories/${repo.id}` },
      ]}
      searchSlot={<RepoSearchBox repoId={repo.id} defaultBranch={branch} />}
      aiPanel={<CoPensador repos={repos} orgConfig={orgConfig} focusedRepo={repo} />}
    >
      <StickyRepoTabBar repoId={repo.id} />
      {children}
    </AppShell>
  )
}
