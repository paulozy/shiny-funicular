'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { PullRequestDetailResponse } from '@/lib/types/pull_request'
import { DiffView } from '@/components/pull-requests/DiffView'
import { PullRequestBody } from '@/components/pull-requests/PullRequestBody'

interface PullRequestDetailClientProps {
  repoId: string
  prNumber: number
  initialDetail: PullRequestDetailResponse | null
  loadError: string | null
}

export function PullRequestDetailClient({
  repoId,
  initialDetail,
  loadError,
}: PullRequestDetailClientProps) {
  const detail = initialDetail
  const pr = detail?.pull_request

  /**
   * How big a change can be before its patch starts folded. Reviewing means
   * reading a handful of files closely — a 40-file pull request that opens
   * every patch at once is a scroll bar, not a review.
   */
  const AUTO_OPEN_MAX_FILES = 8
  const AUTO_OPEN_MAX_CHANGES = 120

  const [expandAll, setExpandAll] = useState<boolean | null>(null)

  const pageStyle: CSSProperties = {}
  const backLinkStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    color: T.ink3,
    textDecoration: 'none',
    marginBottom: 14,
  }
  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 16,
    marginBottom: 14,
  }
  const branchPillStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11.5,
    color: T.ink2,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: '2px 7px',
  }
  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  }

  if (loadError || !pr) {
    return (
      <div style={pageStyle}>
        <Link href={`/code/repositories/${repoId}/pull-requests`} style={backLinkStyle}>
          <MFIcon name="arrow-right" size={12} color={T.ink3} /> Voltar aos PRs
        </Link>
        <div style={{ ...cardStyle, borderColor: T.dangerBorder, background: T.dangerBg, color: T.danger }} role="alert">
          Não foi possível carregar este PR{loadError ? `: ${loadError}` : '.'}
        </div>
      </div>
    )
  }

  const files = detail?.files ?? []

  return (
    <div style={pageStyle}>
      <Link href={`/code/repositories/${repoId}/pull-requests`} style={backLinkStyle}>
        <MFIcon name="arrow-right" size={12} color={T.ink3} /> Voltar aos PRs
      </Link>

      {/* PR identity */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>#{pr.number}</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: T.ink }}>{pr.title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: T.ink3, flexWrap: 'wrap' }}>
          <span>por {pr.author_login}</span>
          <span style={{ color: T.faint }}>·</span>
          <span style={branchPillStyle}>{pr.head_branch}</span>
          <span style={{ color: T.faint }}>→</span>
          <span style={branchPillStyle}>{pr.base_branch}</span>
          {pr.changed_files !== null && (
            <>
              <span style={{ color: T.ok, fontWeight: 600 }}>+{pr.additions_count ?? 0}</span>
              <span style={{ color: T.danger, fontWeight: 600 }}>-{pr.deletions_count ?? 0}</span>
              <span>
                {pr.changed_files} arquivo{pr.changed_files === 1 ? '' : 's'}
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <a href={pr.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Button variant="default" size="md">
              <MFIcon name="arrow-right" size={13} />
              Abrir no provedor
            </Button>
          </a>
        </div>
      </div>

      {pr.body && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <MFIcon name="doc" size={14} color={T.accent} />
            Descrição
          </div>
          <PullRequestBody body={pr.body} />
        </div>
      )}

      {files.length > 0 ? (
        <div style={cardStyle}>
          <div style={{ ...sectionTitleStyle, marginBottom: 12 }}>
            <MFIcon name="code" size={14} color={T.accent} />
            Alterações ({files.length} arquivo{files.length === 1 ? '' : 's'})
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setExpandAll((current) => !(current ?? false))}
              style={{
                font: 'inherit',
                fontSize: 12.5,
                fontWeight: 500,
                background: 'none',
                border: 0,
                cursor: 'pointer',
                color: T.accent700,
              }}
            >
              {expandAll ? 'Recolher todos' : 'Expandir todos'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {files.map((file) => (
              <DiffView
                key={file.filename}
                file={file}
                defaultOpen={
                  expandAll ??
                  (files.length <= AUTO_OPEN_MAX_FILES && file.changes <= AUTO_OPEN_MAX_CHANGES)
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: T.faint }}>Nenhum diff disponível para este PR.</div>
        </div>
      )}
    </div>
  )
}
