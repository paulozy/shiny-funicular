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
    {
      label: 'Documentação',
      href: '/docs',
      matchPrefix: '/docs',
      forceActive: activeTab === 'docs',
    },
    // Graph is still a placeholder for the roadmap and renders as a disabled
    // tab with the "Em breve" tooltip until its route ships.
    { label: 'Grafo' },
  ]
  return <TabBar items={items} ariaLabel="Seções do Code Hub" />
}
