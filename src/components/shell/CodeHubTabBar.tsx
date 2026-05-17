'use client'

import { TabBar, TabBarItem } from '@/components/shell/TabBar'

interface CodeHubTabBarProps {
  activeTab?: 'repositories' | 'templates' | 'docs' | 'graph'
}

export function CodeHubTabBar({ activeTab = 'repositories' }: CodeHubTabBarProps) {
  const items: TabBarItem[] = [
    {
      label: 'Repositórios',
      href: '/',
      forceActive: activeTab === 'repositories',
    },
    {
      label: 'Templates',
      href: '/templates',
      matchPrefix: '/templates',
      forceActive: activeTab === 'templates',
    },
    // Documentation and Graph are still placeholders for the roadmap. They
    // render as disabled tabs with the "Em breve" tooltip until their routes
    // ship.
    { label: 'Documentação' },
    { label: 'Grafo' },
  ]
  return <TabBar items={items} ariaLabel="Seções do Code Hub" />
}
