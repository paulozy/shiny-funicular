'use client'

import { CSSProperties } from 'react'
import { TabBar, TabBarItem } from '@/components/shell/TabBar'

// `graph` is gone: the graph lives under the Arquitetura hub now, because it is a
// domain of its own rather than a view of the code catalog.
export type CodeHubTab = 'repositories' | 'docs' | 'onboarding'

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
      label: 'Meu onboarding',
      href: '/onboarding',
      matchPrefix: '/onboarding',
      forceActive: activeTab === 'onboarding',
    },
  ]
  return <TabBar items={items} ariaLabel="Seções do Code Hub" flush style={style} />
}
