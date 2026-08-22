'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { Tag } from '@/components/ui/Tag'
import { MFIcon } from '@/components/icons/MFIcon'
import { DocMarkdownViewer } from '@/components/docs/DocMarkdownViewer'
import { OnboardingRunStep } from '@/lib/types/onboarding'

/**
 * Renders one step's content, dispatching on its kind.
 *
 * Everything referential arrives already resolved from the server, so this
 * component never fetches: a repository comes with its scorecard, a team with
 * its members and the repositories it answers for. The `unavailable` case is
 * handled first and deliberately — a step whose entity was deleted still
 * renders, saying so, rather than blanking out or breaking the flow.
 */

const noteStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: T.radius.card,
  border: `1px dashed ${T.border}`,
  background: T.surfaceAlt,
  color: T.ink3,
  fontSize: 13,
}

const listStyle: CSSProperties = { display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' }

const cardStyle: CSSProperties = {
  padding: '14px 16px',
  borderRadius: T.radius.card,
  border: `1px solid ${T.border}`,
  background: T.surface,
}

const labelStyle: CSSProperties = {
  fontSize: 11.5,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: T.faint,
  fontWeight: 600,
  marginBottom: 6,
}

const linkStyle: CSSProperties = { color: T.accent, textDecoration: 'none', fontWeight: 500 }

export function OnboardingStepBody({ step }: { step: OnboardingRunStep }) {
  // A dangling reference is the first thing checked: the platform knows the
  // entity is gone and says so, which beats an empty panel the reader has to
  // interpret.
  if (step.unavailable) {
    return (
      <div style={noteStyle} role="status">
        <MFIcon name="flag" size={13} color={T.ink3} /> {step.unavailable}
      </div>
    )
  }

  switch (step.kind) {
    case 'markdown':
      return <DocMarkdownViewer content={step.body ?? ''} />

    case 'repository': {
      const repo = step.resolved?.repository
      if (!repo) return null
      const languages = Object.keys(repo.metadata?.languages ?? {}).slice(0, 4)
      return (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href={`/code/repositories/${repo.id}`} style={{ ...linkStyle, fontSize: 14, fontWeight: 600 }}>
              {repo.name}
            </Link>
            <Tag>{repo.type}</Tag>
            {repo.owner_team ? <Tag variant="ok">{repo.owner_team.name}</Tag> : <Tag variant="warn">sem time</Tag>}
          </div>
          {repo.description && <p style={{ margin: '0 0 10px', fontSize: 13, color: T.ink3 }}>{repo.description}</p>}
          {languages.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {languages.map((language) => (
                <Tag key={language}>{language}</Tag>
              ))}
            </div>
          )}
          {repo.scorecard && (
            <div style={{ fontSize: 12.5, color: T.ink3 }}>
              {repo.scorecard.passing} de {repo.scorecard.total} checagens de maturidade passando
              {repo.scorecard.failing > 0 && (
                <span style={{ color: T.warn }}> · {repo.scorecard.failing} pendência(s)</span>
              )}
            </div>
          )}
          <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
            <Link href={`/code/repositories/${repo.id}`} style={linkStyle}>
              Abrir na IDP →
            </Link>
            <a href={repo.url} target="_blank" rel="noreferrer noopener" style={linkStyle}>
              Ver no provedor →
            </a>
          </div>
        </div>
      )
    }

    case 'team': {
      const team = step.resolved?.team
      if (!team) return null
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={cardStyle}>
            <div style={labelStyle}>Quem está no time</div>
            {team.members.length === 0 ? (
              <div style={{ fontSize: 13, color: T.ink3 }}>Ninguém neste time ainda.</div>
            ) : (
              <ul style={listStyle}>
                {team.members.map((member) => (
                  <li key={member.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{member.full_name || member.email}</span>
                    {member.role === 'lead' && <Tag variant="ok">lead</Tag>}
                    <span style={{ color: T.faint, fontSize: 12 }}>{member.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={cardStyle}>
            {/* The other half of "who answers for what": what this team owns. */}
            <div style={labelStyle}>Do que este time responde</div>
            {team.repositories.length === 0 ? (
              <div style={{ fontSize: 13, color: T.ink3 }}>Nenhum repositório atribuído a este time.</div>
            ) : (
              <ul style={listStyle}>
                {team.repositories.map((repo) => (
                  <li key={repo.id} style={{ fontSize: 13 }}>
                    <Link href={`/code/repositories/${repo.id}`} style={linkStyle}>
                      {repo.name}
                    </Link>
                    {repo.description && <span style={{ color: T.ink3 }}> — {repo.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
    }

    case 'doc': {
      const doc = step.resolved?.doc
      if (!doc) return null
      return <DocMarkdownViewer content={doc.content} />
    }

    case 'architecture': {
      const graph = step.resolved?.graph
      const nodes = graph?.nodes?.length ?? 0
      const edges = graph?.edges?.length ?? 0
      return (
        <div style={cardStyle}>
          <div style={labelStyle}>Mapa de relacionamentos</div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: T.ink3 }}>
            {nodes} repositório(s) e {edges} relação(ões) mapeadas.
          </p>
          {/* The interactive graph lives on its own page, which already handles
              layout and panning; sending the reader there beats a cramped copy. */}
          <Link href="/graph" style={linkStyle}>
            Abrir o mapa completo →
          </Link>
        </div>
      )
    }

    case 'glossary': {
      const terms = step.resolved?.terms ?? []
      return (
        <ul style={listStyle}>
          {terms.map((term) => (
            <li key={term.id} style={cardStyle}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{term.term}</div>
              <div style={{ fontSize: 13, color: T.ink3 }}>{term.definition}</div>
            </li>
          ))}
        </ul>
      )
    }

    case 'contacts': {
      const people = step.resolved?.people ?? []
      return (
        <ul style={listStyle}>
          {people.map((person) => (
            <li key={`${person.user_id}-${person.area}`} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{person.full_name || person.email}</span>
                {person.area && <Tag>{person.area}</Tag>}
              </div>
              {person.when_to_reach && (
                <div style={{ fontSize: 13, color: T.ink3 }}>{person.when_to_reach}</div>
              )}
              {person.email && (
                <a href={`mailto:${person.email}`} style={{ ...linkStyle, fontSize: 12.5 }}>
                  {person.email}
                </a>
              )}
            </li>
          ))}
        </ul>
      )
    }

    case 'checklist': {
      const items = step.config.items ?? []
      return (
        <ul style={listStyle}>
          {items.map((item, index) => (
            <li key={`${item.text}-${index}`} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <MFIcon name="check" size={12} color={T.faint} />
              <span>
                {item.text}
                {item.url && (
                  <>
                    {' '}
                    <a href={item.url} target="_blank" rel="noreferrer noopener" style={linkStyle}>
                      abrir
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )
    }

    case 'link':
      return (
        <div style={cardStyle}>
          <a href={step.config.url} target="_blank" rel="noreferrer noopener" style={linkStyle}>
            {step.config.label || step.config.url} →
          </a>
        </div>
      )

    case 'task':
      return (
        <div style={cardStyle}>
          {step.config.instructions && (
            <p style={{ margin: '0 0 10px', fontSize: 13.5 }}>{step.config.instructions}</p>
          )}
          {step.config.task_url && (
            <a href={step.config.task_url} target="_blank" rel="noreferrer noopener" style={linkStyle}>
              Abrir a tarefa →
            </a>
          )}
        </div>
      )

    case 'verified':
      return (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13.5, color: T.ink3 }}>
            {step.resolved?.verification?.description ??
              'A plataforma confirma este passo sozinha quando a condição acontecer.'}
          </p>
        </div>
      )

    default:
      return null
  }
}
