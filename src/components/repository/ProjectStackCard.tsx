import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { Tag } from '@/components/ui/Tag'
import { MFIcon } from '@/components/icons/MFIcon'
import { colorForLanguage } from '@/lib/language-colors'

interface ProjectStackCardProps {
  languages?: Record<string, number>
  frameworks?: string[]
  topics?: string[]
}

const MAX_VISIBLE_LANGUAGES = 5

export function ProjectStackCard({ languages, frameworks, topics }: ProjectStackCardProps) {
  const entries = Object.entries(languages ?? {})
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, value]) => sum + value, 0)

  const segments = entries.map(([name, value]) => ({
    name,
    value,
    percent: total > 0 ? (value * 100) / total : 0,
    color: colorForLanguage(name),
  }))

  // Group everything beyond the top N into a single "Outros" entry so the
  // legend stays readable on repos with many languages.
  const visible = segments.slice(0, MAX_VISIBLE_LANGUAGES)
  const rest = segments.slice(MAX_VISIBLE_LANGUAGES)
  const restPercent = rest.reduce((sum, seg) => sum + seg.percent, 0)
  const legend = [
    ...visible.map((seg) => ({
      key: seg.name,
      label: seg.name,
      percent: seg.percent,
      color: seg.color,
    })),
    ...(restPercent > 0
      ? [
          {
            key: '__rest__',
            label: 'Outros',
            percent: restPercent,
            color: T.faint,
          },
        ]
      : []),
  ]

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  }

  const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
  }

  const barStyle: CSSProperties = {
    display: 'flex',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    background: T.surfaceAlt,
  }

  const legendStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px 14px',
    fontSize: 12,
    color: T.ink2,
  }

  const legendItemStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }

  const dotStyle = (color: string): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  })

  const subLabelStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    color: T.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  }

  const chipsStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  }

  const emptySubStyle: CSSProperties = {
    fontSize: 12,
    color: T.faint,
  }

  const hasLanguages = segments.length > 0
  const hasFrameworks = (frameworks?.length ?? 0) > 0
  const hasTopics = (topics?.length ?? 0) > 0
  const hasNothing = !hasLanguages && !hasFrameworks && !hasTopics

  return (
    <section style={cardStyle} aria-label="Stack do projeto">
      <div style={sectionHeaderStyle}>
        <MFIcon name="code" size={14} color={T.accent} />
        <span style={sectionTitleStyle}>Stack do projeto</span>
      </div>

      {hasNothing && (
        <div style={emptySubStyle}>Sem informações de stack detectadas.</div>
      )}

      {hasLanguages && (
        <div>
          <div style={subLabelStyle}>Linguagens</div>
          <div style={barStyle} role="img" aria-label="Distribuição de linguagens">
            {segments.map((seg) => (
              <div
                key={seg.name}
                title={`${seg.name} ${seg.percent.toFixed(1)}%`}
                style={{ flex: seg.percent, background: seg.color, minWidth: 2 }}
              />
            ))}
          </div>
          <div style={{ ...legendStyle, marginTop: 10 }}>
            {legend.map((item) => (
              <span key={item.key} style={legendItemStyle}>
                <span style={dotStyle(item.color)} />
                <span style={{ fontWeight: 500, color: T.ink }}>{item.label}</span>
                <span style={{ color: T.faint }}>{item.percent.toFixed(item.percent < 10 ? 1 : 0)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {!hasLanguages && !hasNothing && (
        <div>
          <div style={subLabelStyle}>Linguagens</div>
          <div style={emptySubStyle}>Sem linguagens detectadas.</div>
        </div>
      )}

      <div>
        <div style={subLabelStyle}>Frameworks</div>
        {hasFrameworks ? (
          <div style={chipsStyle}>
            {frameworks!.map((item) => (
              <Tag key={`fw-${item}`} variant="accent">
                {item}
              </Tag>
            ))}
          </div>
        ) : (
          <div style={emptySubStyle}>Sem frameworks detectados.</div>
        )}
      </div>

      <div>
        <div style={subLabelStyle}>Tópicos</div>
        {hasTopics ? (
          <div style={chipsStyle}>
            {topics!.map((item) => (
              <Tag key={`topic-${item}`}>{item}</Tag>
            ))}
          </div>
        ) : (
          <div style={emptySubStyle}>Sem tópicos detectados.</div>
        )}
      </div>
    </section>
  )
}
