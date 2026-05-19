'use client'

import { TabBar, TabBarItem } from '@/components/shell/TabBar'

interface RepoTabBarProps {
  repoId: string
  /**
   * Optional fallback when the current pathname does not match any tab — useful
   * for nested routes (e.g. `/code/repositories/:id/files?path=...`) where the
   * pathname still points at `/files`.
   */
  activeTab?: 'overview' | 'files' | 'search' | 'issues' | 'pull-requests' | 'settings'
}

export function RepoTabBar({ repoId, activeTab }: RepoTabBarProps) {
  const base = `/code/repositories/${repoId}`
  const items: TabBarItem[] = [
    {
      label: 'Visão geral',
      href: base,
      forceActive: activeTab === 'overview',
    },
    {
      label: 'Arquivos',
      href: `${base}/files`,
      matchPrefix: `${base}/files`,
      forceActive: activeTab === 'files',
    },
    {
      label: 'Alertas',
      href: `${base}/issues`,
      matchPrefix: `${base}/issues`,
      forceActive: activeTab === 'issues',
    },
    {
      label: 'Pull Requests',
      href: `${base}/pull-requests`,
      matchPrefix: `${base}/pull-requests`,
      forceActive: activeTab === 'pull-requests',
    },
    {
      label: 'Buscar',
      href: `${base}/search`,
      matchPrefix: `${base}/search`,
      forceActive: activeTab === 'search',
    },
    {
      label: 'Configurações',
      href: `${base}/settings`,
      matchPrefix: `${base}/settings`,
      forceActive: activeTab === 'settings',
    },
  ]
  return <TabBar items={items} ariaLabel="Seções do repositório" />
}
