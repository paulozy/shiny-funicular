'use client'

import { CSSProperties } from 'react'
import { TabBar, TabBarItem } from '@/components/shell/TabBar'

export type CodeHubTab = 'repositories' | 'docs' | 'graph' | 'onboarding'

interface CodeHubTabBarProps {
  activeTab?: CodeHubTab
  style?: CSSProperties
}

export function CodeHubTabBar({ activeTab = 'repositories', style }: CodeHubTabBarProps) {
  const items: TabBarItem[] = [
    {
      label: 'Repositórios',
      href: '/',
      forceActive: activeTab === 'repositories',
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
    {
      label: 'Meu onboarding',
      href: '/onboarding',
      matchPrefix: '/onboarding',
      forceActive: activeTab === 'onboarding',
    },
  ]
  return <TabBar items={items} ariaLabel="Seções do Code Hub" flush style={style} />
}
