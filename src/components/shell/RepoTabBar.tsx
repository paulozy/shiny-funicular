'use client'

import { TabBar, TabBarItem } from '@/components/shell/TabBar'

interface RepoTabBarProps {
  repoId: string
  /** Shown next to the Pull requests tab, as in the v3 mockup. */
  prCount?: number
  /** Generations available for this repository, shown on the Documentação tab. */
  docCount?: number
  /**
   * Open issues and contributors, from the synced repository metadata.
   *
   * Both are `omitempty` on the backend, so a repository with none — or one
   * that has never synced — sends no key and the tab renders without a count,
   * exactly as `prCount` already does. Defaulting to 0 would claim a measured
   * zero for a repository nobody has looked at.
   */
  issueCount?: number
  contributorCount?: number
  /**
   * Optional fallback when the current pathname does not match any tab — useful
   * for nested routes where the pathname points at a sub-path of a tab.
   */
  activeTab?: 'overview' | 'docs' | 'pull-requests' | 'issues' | 'people' | 'settings'
}

export function RepoTabBar({
  repoId,
  prCount,
  docCount,
  issueCount,
  contributorCount,
  activeTab,
}: RepoTabBarProps) {
  const base = `/code/repositories/${repoId}`
  const items: TabBarItem[] = [
    {
      label: 'Visão geral',
      href: base,
      forceActive: activeTab === 'overview',
    },
    {
      label: docCount === undefined ? 'Documentação' : `Documentação · ${docCount}`,
      href: `${base}/docs`,
      matchPrefix: `${base}/docs`,
      forceActive: activeTab === 'docs',
    },
    {
      label: prCount === undefined ? 'Pull requests' : `Pull requests · ${prCount}`,
      href: `${base}/pull-requests`,
      matchPrefix: `${base}/pull-requests`,
      forceActive: activeTab === 'pull-requests',
    },
    {
      label: issueCount === undefined ? 'Issues' : `Issues · ${issueCount}`,
      href: `${base}/issues`,
      matchPrefix: `${base}/issues`,
      forceActive: activeTab === 'issues',
    },
    {
      label:
        contributorCount === undefined
          ? 'Contribuidores'
          : `Contribuidores · ${contributorCount}`,
      href: `${base}/people`,
      matchPrefix: `${base}/people`,
      forceActive: activeTab === 'people',
    },
    {
      label: 'Configurações',
      href: `${base}/settings`,
      matchPrefix: `${base}/settings`,
      forceActive: activeTab === 'settings',
    },
  ]
  return <TabBar items={items} ariaLabel="Seções do repositório" variant="prominent" />
}
