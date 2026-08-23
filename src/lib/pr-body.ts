/**
 * Turns a pull request description into something renderable.
 *
 * Provider descriptions are Markdown with raw HTML mixed in, and the worst
 * offenders are bots: a Dependabot body is one line of prose followed by
 * kilobytes of `<details><summary>Release notes</summary>…</details>`.
 * `react-markdown` does not render raw HTML (by design — it would be an
 * injection vector), so that content reached the screen as literal tags.
 *
 * So the body is split into segments before rendering: `<details>` blocks
 * become collapsed sections, and their HTML is converted to the Markdown
 * equivalent instead of being dumped or dropped.
 */

export type PrBodySegment =
  | { type: 'markdown'; content: string }
  | { type: 'details'; summary: string; content: string }

const ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
}

function decodeEntities(value: string): string {
  return value
    .replace(/&(?:lt|gt|amp|quot|#39|apos|nbsp|mdash|ndash|hellip);/g, (match) => ENTITIES[match] ?? match)
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
}

/**
 * A deliberately small HTML-to-Markdown pass: enough for what providers and
 * bots actually emit in a description (links, code spans, emphasis, lists,
 * headings, paragraphs). Anything else loses its tags and keeps its text.
 */
export function htmlToMarkdown(html: string): string {
  let out = html

  // Comments first: Dependabot hides machine directives in them.
  out = out.replace(/<!--[\s\S]*?-->/g, '')

  out = out.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
    const label = stripTags(text).trim()
    return label ? `[${label}](${href})` : href
  })
  out = out.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_m, text) => `\`${stripTags(text).trim()}\``)
  out = out.replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_m, text) => `**${stripTags(text).trim()}**`)
  out = out.replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_m, text) => `*${stripTags(text).trim()}*`)

  out = out.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level: string, text: string) => {
    return `\n\n${'#'.repeat(Number(level))} ${stripTags(text).trim()}\n\n`
  })

  out = out.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_m, text) => `\n- ${collapseSpaces(stripTags(text))}`)

  out = out.replace(/<br\s*\/?>/gi, '\n')
  out = out.replace(/<\/p>/gi, '\n\n')
  out = out.replace(/<\/(?:ul|ol|blockquote|div|table|tr)>/gi, '\n\n')

  out = stripTags(out)
  out = decodeEntities(out)

  return out
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '')
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

const DETAILS_RE = /<details\b[^>]*>([\s\S]*?)<\/details>/gi
const SUMMARY_RE = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i

/**
 * Splits a description into prose and collapsible sections, in document order.
 * Empty segments are dropped, so a body that is nothing but `<details>` blocks
 * produces no stray blank prose.
 */
export function parsePrBody(body: string | undefined | null): PrBodySegment[] {
  if (!body || !body.trim()) return []

  const segments: PrBodySegment[] = []
  let cursor = 0

  const pushMarkdown = (raw: string) => {
    const content = htmlToMarkdown(raw)
    if (content) segments.push({ type: 'markdown', content })
  }

  DETAILS_RE.lastIndex = 0
  let match = DETAILS_RE.exec(body)
  while (match) {
    pushMarkdown(body.slice(cursor, match.index))

    const inner = match[1]
    const summaryMatch = inner.match(SUMMARY_RE)
    const summary = summaryMatch ? collapseSpaces(stripTags(decodeEntities(summaryMatch[1]))) : 'Detalhes'
    const content = htmlToMarkdown(summaryMatch ? inner.replace(SUMMARY_RE, '') : inner)

    segments.push({ type: 'details', summary: summary || 'Detalhes', content })

    cursor = match.index + match[0].length
    match = DETAILS_RE.exec(body)
  }

  pushMarkdown(body.slice(cursor))

  return segments
}
