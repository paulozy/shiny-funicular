'use client'

import { CSSProperties, ReactNode } from 'react'
import { T } from '@/lib/tokens'
import { DocTemplate } from '@/lib/types/docs'

interface DocTemplateCardProps {
  template: DocTemplate
  selected: boolean
  onSelect: () => void
  /**
   * Extra content rendered inside the card, below the description.
   *
   * The two galleries differ in a way that matters: the org modal picks *one*
   * template and can afford a preview pane beside the list, while the repo
   * modal picks *several* types and has nowhere to put a preview — the detail
   * has to live on the card itself. So this component owns the shared chrome
   * and lets each caller decide how much detail belongs inside it.
   */
  children?: ReactNode
  /** Rendered on the right of the title row — a status badge, typically. */
  trailing?: ReactNode
}

/**
 * One template in a documentation gallery.
 *
 * Extracted from the org modal when the repo modal needed the same treatment.
 * The repo modal used to list bare checkboxes labelled with the raw slug
 * (`adr`, `service_doc`), which told the reader nothing about what a generation
 * would produce.
 */
export function DocTemplateCard({
  template,
  selected,
  onSelect,
  children,
  trailing,
}: DocTemplateCardProps) {
  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    width: '100%',
    textAlign: 'left',
    font: 'inherit',
    cursor: 'pointer',
    padding: '11px 13px',
    borderRadius: T.radius.card,
    border: `1px solid ${selected ? T.accent : T.border}`,
    background: selected ? T.accentBg : T.surface,
    // The selected border is 1px like the unselected one so picking a card
    // does not shift the layout of the ones below it.
    boxShadow: selected ? `inset 0 0 0 1px ${T.accent}` : 'none',
  }

  return (
    <button type="button" style={cardStyle} onClick={onSelect} aria-pressed={selected}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{template.label}</span>
        <span style={{ flex: 1 }} />
        {trailing}
      </span>
      <span style={{ fontSize: 11.5, color: T.ink3, lineHeight: 1.45 }}>
        {template.description}
      </span>
      {children}
    </button>
  )
}

/**
 * The sections a document will contain, and the file it lands on.
 *
 * Kept beside the card rather than inside it because only the repo gallery
 * shows this inline — the org gallery renders the same information in its
 * preview pane, with room for more of it.
 */
export function DocTemplateDetail({ template }: { template: DocTemplate }) {
  const labelStyle: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
  }

  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 3 }}>
      {template.output_path && (
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={labelStyle}>Arquivo</span>
          <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink2 }}>
            {template.output_path}
          </span>
        </span>
      )}
      {template.sections.length > 0 && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={labelStyle}>Estrutura</span>
          <span style={{ fontSize: 11.5, color: T.ink3, lineHeight: 1.5 }}>
            {template.sections.join(' · ')}
          </span>
        </span>
      )}
    </span>
  )
}
