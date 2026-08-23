'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
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
 * Where the generated documentation went.
 *
 * Two links, and the order is the point. Reviewing the diff happens here — the
 * pull request page renders it and carries the approve / request-changes
 * actions — so that is the primary link. The provider link stays because the
 * platform cannot merge: there is no merge capability on `scm.Provider`, so the
 * last step of a documentation pull request only exists on the host. Dropping
 * that link would strand it.
 *
 * Same pairing the pull request drawer already uses ("Ver alterações" next to
 * "Abrir no provedor").
 */
export function DocPullRequestBanner({
  repoId,
  pullRequestNumber,
  pullRequestUrl,
  branch,
  provider,
}: DocPullRequestBannerProps) {
  if (!pullRequestUrl) return null

  const bannerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    padding: '9px 14px',
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    fontSize: 12.5,
    color: T.ink2,
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
      <MFIcon name="pr" size={13} color={T.ai} />
      <span>
        {pullRequestNumber ? `PR #${pullRequestNumber}` : 'Pull request'} {openedIn(provider)}
      </span>
      {branch && (
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
