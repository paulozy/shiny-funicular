'use client'

import { CSSProperties, ReactNode, useCallback, useEffect, useState } from 'react'
import { UserInfo } from '@/lib/types/auth'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { DecisionQueue, buildDecisions } from '@/components/home/DecisionQueue'
import { RepositoryPanel } from '@/components/home/RepositoryPanel'
import { OnboardingSummaryCard } from '@/components/home/OnboardingSummaryCard'
import { NewRepoModal } from '@/components/home/NewRepoModal'
import { SetupChecklist } from '@/components/home/SetupChecklist'
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner'
import { ScopeFilter } from '@/components/home/ScopeFilter'
import { HomeScope } from '@/lib/home-scope'
import { Button } from '@/components/ui/Button'
import { canConfigureOrganization, canCreateRepository } from '@/lib/permissions'

interface HomeClientProps {
  user: UserInfo
  initialRepos: RepositoryListResponse | null
  orgConfig?: OrganizationConfigResponse | null
  /**
   * The dashboard's scope, and whether it can be offered at all.
   *
   * `initialRepos` arrives already narrowed, so everything derived from it —
   * the catalog, the decisions, the counters — follows the scope for free.
   * `orgIsEmpty` is judged on the *unscoped* catalog: an organization that owns
   * repositories none of my teams answer for is not an empty organization, and
   * must not be shown the first-run checklist.
   */
  scope?: HomeScope
  /**
   * Whether the viewer belongs to any team. Not a gate on the control — an
   * admin on no team must still be able to ask for "Meus times" — only on what
   * the empty result is allowed to say.
   */
  hasTeams?: boolean
  orgIsEmpty?: boolean
  /**
   * The review queue, streamed in by the server. It is a slot and not data
   * because listing pull requests means one upstream call per repository —
   * awaiting that before the first byte made the whole dashboard wait on the
   * slowest provider response.
   */
  reviewSlot?: ReactNode
}

/**
 * Why the scoped catalog came back empty, when it did.
 *
 * Without this the "Meus times" view is an unexplained blank, which reads as a
 * broken filter rather than as an answer.
 */
function emptyScopeReason(scope: HomeScope, hasTeams: boolean): string | undefined {
  if (scope !== 'mine') return undefined
  return hasTeams
    ? 'Nenhum repositório dos seus times. Veja toda a organização para o catálogo completo.'
    : 'Você não está em nenhum time. Peça a um admin para te adicionar, ou veja toda a organização.'
}

function standfirst(prs: number, decisions: number): string {
  if (prs === 0) {
    return 'Fila de revisão limpa. Bom momento para atacar as pendências de governança.'
  }
  const prPart = `${prs} ${prs === 1 ? 'PR espera' : 'PRs esperam'} sua revisão`
  const decisionPart =
    decisions === 0
      ? 'nenhuma pendência de governança segue aberta'
      : `${decisions} ${decisions === 1 ? 'pendência segue aberta' : 'pendências seguem abertas'}`
  return `${prPart} e ${decisionPart}.`
}

export function HomeClient({
  user,
  initialRepos,
  orgConfig,
  scope = 'all',
  hasTeams = false,
  orgIsEmpty,
  reviewSlot,
}: HomeClientProps) {
  const [repos, setRepos] = useState<RepositoryListResponse | null>(initialRepos)
  const [showNewRepoModal, setShowNewRepoModal] = useState(false)

  // Resync when the server sends a different catalog.
  //
  // `useState` reads its argument once, on mount. Changing the scope is a soft
  // navigation: the server re-renders and hands down a newly narrowed
  // `initialRepos`, but this component never unmounts, so without this the
  // state kept the *previous* list and the page ignored the filter until a full
  // reload. Locally added repositories are dropped here on purpose — the server
  // list that replaces them is the fresher truth.
  useEffect(() => {
    setRepos(initialRepos)
  }, [initialRepos])

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

  const isEmpty = orgIsEmpty ?? (repos === null || repos.total === 0)
  const mayCreateRepo = canCreateRepository(user)
  const mayConfigureOrg = canConfigureOrganization(user)
  const repositories = repos?.repositories ?? []
  const decisionCount = buildDecisions(repositories).length
  // From the catalog metadata the page already has — the standfirst must not
  // wait on the streamed queue.
  const openPrCount = repositories.reduce((sum, repo) => sum + (repo.metadata?.pr_count ?? 0), 0)

  const eyebrowStyle: CSSProperties = {
    fontSize: 11.5,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: T.faint,
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
    gap: 22,
    alignItems: 'start',
  }

  const columnStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  }

  const topRightContent = mayCreateRepo ? (
    <Button variant="primary" size="md" onClick={() => setShowNewRepoModal(true)}>
      Novo repositório
    </Button>
  ) : null

  const repoTotalLabel = `${repos?.total ?? 0} ${repos?.total === 1 ? 'repositório' : 'repositórios'}`

  return (
    <AppShell user={user} activeHub="code" codeTab="repositories" topRight={topRightContent}>
      {/* Above the branch on purpose: an organization with no repositories yet
          is exactly when someone is most likely to be onboarding, and inside
          the non-empty branch the banner would never reach them. */}
      <OnboardingBanner />

      {isEmpty ? (
        <SetupChecklist
          orgConfig={orgConfig}
          canConfigure={mayConfigureOrg}
          canImport={mayCreateRepo}
          onImportRepo={() => setShowNewRepoModal(true)}
        />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 24,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            <div>
              <div style={eyebrowStyle}>Code Hub · {repoTotalLabel}</div>
              <h1 style={{ fontSize: 28, margin: '6px 0 0' }}>Bom dia, {user.full_name}</h1>
            </div>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.55,
                color: T.ink3,
                margin: '0 0 3px',
                maxWidth: '44ch',
              }}
            >
              {standfirst(openPrCount, decisionCount)}
            </p>
            <div style={{ marginLeft: 'auto', paddingBottom: 3 }}>
              <ScopeFilter scope={scope} />
            </div>
          </div>

          <div style={gridStyle}>
            <div style={columnStyle}>
              {reviewSlot}
              <DecisionQueue repositories={repositories} />
            </div>

            <div style={columnStyle}>
              {repos && (
                <RepositoryPanel
                  repos={repos}
                  emptyReason={emptyScopeReason(scope, hasTeams)}
                />
              )}
              <OnboardingSummaryCard />
            </div>
          </div>
        </>
      )}

      <NewRepoModal
        isOpen={showNewRepoModal}
        onClose={() => setShowNewRepoModal(false)}
        onSuccess={handleRepoCreated}
      />
    </AppShell>
  )
}
