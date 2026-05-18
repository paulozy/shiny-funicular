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
    {
      label: 'Grafo',
      href: '/graph',
      matchPrefix: '/graph',
      forceActive: activeTab === 'graph',
    },
  ]
  return <TabBar items={items} ariaLabel="Seções do Code Hub" />
}
