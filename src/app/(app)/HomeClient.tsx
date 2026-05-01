'use client'

import { CSSProperties, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserInfo } from '@/lib/types/auth'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { MetricStrip } from '@/components/home/MetricStrip'
import { RepositoryGrid } from '@/components/home/RepositoryGrid'
import { CoPensador } from '@/components/home/CoPensador'
import { NewRepoModal } from '@/components/home/NewRepoModal'
import { OnboardingTutorial } from '@/components/home/OnboardingTutorial'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'

interface HomeClientProps {
  user: UserInfo
  initialRepos: RepositoryListResponse | null
  orgConfig?: OrganizationConfigResponse | null
}

export function HomeClient({ user, initialRepos, orgConfig }: HomeClientProps) {
  const router = useRouter()
  const [repos, setRepos] = useState<RepositoryListResponse | null>(initialRepos)
  const [showNewRepoModal, setShowNewRepoModal] = useState(false)

  const handleRepoCreated = useCallback((newRepo: RepositoryResponse) => {
    setRepos((prev) => {
      if (!prev) return null
      return {
        ...prev,
        repositories: [newRepo, ...prev.repositories],
        total: prev.total + 1,
      }
    })
  }, [])

  const handleShowNewRepoModal = useCallback(() => {
    setShowNewRepoModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowNewRepoModal(false)
  }, [])

  const isEmpty = repos === null || repos.total === 0

  const contentStyle: CSSProperties = {
    padding: '20px 24px 28px',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 14,
    marginBottom: 18,
  }

  const eyebrowStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
    marginBottom: 4,
  }

  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    margin: 0,
  }

  const topRightContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {user.role === 'admin' && (
        <Button variant="default" size="md" onClick={() => router.push('/settings')}>
          <MFIcon name="gear" size={12} />
          Configurações
        </Button>
      )}
      <Button variant="primary" size="md" onClick={handleShowNewRepoModal}>
        <MFIcon name="plus" size={11} />
        Novo repo
      </Button>
    </div>
  )

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: isEmpty ? 'Onboarding' : 'todos os repositórios' }]}
      topRight={topRightContent}
      aiPanel={!isEmpty && repos ? <CoPensador repos={repos} orgConfig={orgConfig} /> : undefined}
    >
      {isEmpty ? (
        <OnboardingTutorial orgConfig={orgConfig} canConfigure={user.role === 'admin'} onImportRepo={handleShowNewRepoModal} />
      ) : (
        <div style={contentStyle}>
          <div style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>Code Hub · {repos?.total || 0} repos</div>
              <h1 style={titleStyle}>Bom dia, {user.full_name}</h1>
            </div>
            <div style={{ flex: 1 }} />
          </div>

          {repos && (
            <>
              <MetricStrip repos={repos} />
              <RepositoryGrid repos={repos} showCreateModal={handleShowNewRepoModal} />
            </>
          )}
        </div>
      )}

      <NewRepoModal isOpen={showNewRepoModal} onClose={handleCloseModal} onSuccess={handleRepoCreated} />
    </AppShell>
  )
}
