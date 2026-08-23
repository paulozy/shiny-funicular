'use client'

import { CSSProperties, useEffect, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { apiFetch } from '@/lib/api/client'
import { PullRequestResponse } from '@/lib/types/pull_request'
import { RepoProvider } from '@/lib/types/repository'

interface DocPullRequestBannerProps {
  repoId?: string
  pullRequestNumber?: number
  pullRequestUrl?: string
  branch?: string
  /** The repository's host, so the banner names the right one. */
  provider?: RepoProvider
}

/**
 * Where the generated documentation went, and whether it is still waiting.
 *
 * Two links, and the order is the point. Reviewing the diff happens here — the
 * pull request page renders it and carries the approve / request-changes
 * actions — so that is the primary link. The provider link stays because the
 * platform cannot merge: there is no merge capability on `scm.Provider`, so the
 * last step of a documentation pull request only exists on the host. Dropping
 * that link would strand it.
 *
 * The state is fetched rather than stored. `doc_generations` records the pull
 * request's url and number at creation and nothing ever revisits them — the
 * webhook processor ignores `pull_request` events entirely — so the row cannot
 * say whether the thing was merged. Asking the host is the only answer that
 * cannot be stale, and the existing pull request endpoint already returns it.
 */
type PRState = 'loading' | 'open' | 'merged' | 'closed' | 'unknown'

export function DocPullRequestBanner({
  repoId,
  pullRequestNumber,
  pullRequestUrl,
  branch,
  provider,
}: DocPullRequestBannerProps) {
  const [state, setState] = useState<PRState>('loading')

  useEffect(() => {
    if (!pullRequestUrl || !repoId || !pullRequestNumber) {
      // Nothing to ask about. A generation from before the number was recorded
      // still gets the banner, just without a state.
      setState('unknown')
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const pr = await apiFetch<PullRequestResponse>(
          `/api/repositories/${repoId}/pull-requests/${pullRequestNumber}`
        )
        if (cancelled) return
        // `state` is only ever `open` or `closed` — the API never sends
        // `merged`, because that is how both hosts report it: closed, with
        // `merged_at` set. Reading the state alone would call a merged pull
        // request "fechada sem merge", which is the opposite of what happened.
        if (pr?.state === 'closed') {
          setState(pr.merged_at ? 'merged' : 'closed')
        } else if (pr?.state === 'merged') {
          // The type allows this and the API never sends it, but handling it
          // costs a line and treating a merged pull request as unknown would
          // leave the banner up — the exact bug being fixed.
          setState('merged')
        } else if (pr?.state === 'open') {
          setState('open')
        } else {
          setState('unknown')
        }
      } catch {
        // Never hide on uncertainty. A failed lookup means we do not know, and
        // hiding a pull request that is genuinely still waiting is worse than
        // showing one that has already landed.
        if (!cancelled) setState('unknown')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [repoId, pullRequestNumber, pullRequestUrl])

  if (!pullRequestUrl) return null

  // Merged means the documentation landed, and its content is already stored in
  // the app — so the call to action is spent and the banner is noise. This is
  // the case that used to persist forever.
  if (state === 'merged') return null

  // While the state is in flight the banner stays as it was. Flashing it away
  // and back would be worse than a moment of staleness.
  const closedUnmerged = state === 'closed'

  const bannerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    padding: '9px 14px',
    background: closedUnmerged ? T.warnBg : T.surfaceAlt,
    border: `1px solid ${closedUnmerged ? T.warnBorder : T.border}`,
    borderRadius: T.radius.card,
    fontSize: 12.5,
    color: closedUnmerged ? T.warn : T.ink2,
    marginBottom: 12,
  }

  const linkStyle: CSSProperties = { fontSize: 12, textDecoration: 'none' }

  // The in-app route needs both the repository and the number. A generation
  // from before the number was recorded still gets the provider link.
  const inAppHref =
    repoId && pullRequestNumber
      ? `/code/repositories/${repoId}/pull-requests/${pullRequestNumber}`
      : null

  return (
    <div style={bannerStyle}>
      <MFIcon name="pr" size={13} color={closedUnmerged ? T.warn : T.ai} />
      <span>
        {pullRequestNumber ? `PR #${pullRequestNumber}` : 'Pull request'}{' '}
        {/* A pull request closed without merging means the documentation never
            landed. Saying so beats a banner that reads as if it were still
            pending review. */}
        {closedUnmerged ? 'fechada sem merge — a documentação não foi aplicada' : openedIn(provider)}
      </span>
      {branch && !closedUnmerged && (
        <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink3 }}>branch: {branch}</span>
      )}
      <span style={{ flex: 1 }} />
      {inAppHref && (
        <Link href={inAppHref} style={{ ...linkStyle, color: T.accent700, fontWeight: 600 }}>
          Revisar aqui →
        </Link>
      )}
      <a
        href={pullRequestUrl}
        target="_blank"
        rel="noreferrer"
        style={{ ...linkStyle, color: T.ink3 }}
      >
        {/* Kept because merging is not something this platform can do. */}
        Abrir no provedor
      </a>
    </div>
  )
}

/**
 * Names the host rather than assuming one.
 *
 * This banner said "aberta no GitHub" unconditionally, which was wrong for
 * every GitLab repository — and GitLab has been a first-class provider since it
 * shipped. The whole phrase is built here so the fallback reads as Portuguese
 * instead of "aberto em no provedor".
 */
function openedIn(provider?: RepoProvider): string {
  switch (provider) {
    case 'github':
      return 'aberto no GitHub'
    case 'gitlab':
      return 'aberto no GitLab'
    default:
      return 'aberto no provedor'
  }
}
