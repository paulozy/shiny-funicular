import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/shell/AppShell'
import { StickyRepoTabBar } from '@/components/shell/StickyRepoTabBar'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'

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

  const repos = await backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null)

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo || !repos) {
    notFound()
  }

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[
        { label: 'Code', href: '/' },
        { label: repo.name, href: `/code/repositories/${repo.id}` },
      ]}
    >
      <StickyRepoTabBar repoId={repo.id} />
      {children}
    </AppShell>
  )
}
