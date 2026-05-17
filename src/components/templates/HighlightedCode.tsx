import { CSSProperties } from 'react'
import { codeToHtml } from 'shiki'
import { T } from '@/lib/tokens'

// Subset of Shiki bundled languages we expect to receive from template files.
// Anything outside this set falls back to plaintext (no highlight). We keep
// the value as `string` (not `BundledLanguage`) so we can include 'plaintext',
// which is Shiki's special non-grammar passthrough.
const SUPPORTED_LANGS = new Set<string>([
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'scss',
  'markdown', 'md', 'yaml', 'yml', 'toml', 'go', 'python', 'rust', 'java',
  'kotlin', 'swift', 'ruby', 'php', 'sql', 'shell', 'bash', 'dockerfile',
  'plaintext',
])

function normalizeLanguage(lang: string | undefined): string {
  if (!lang) return 'plaintext'
  const lower = lang.toLowerCase()
  const alias: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    py: 'python',
    rb: 'ruby',
    sh: 'shell',
  }
  const resolved = alias[lower] ?? lower
  return SUPPORTED_LANGS.has(resolved) ? resolved : 'plaintext'
}

/**
 * Server-only helper that renders code to a syntax-highlighted HTML string
 * using Shiki. Two themes are emitted at once (light + dark) so the same HTML
 * works for both via CSS toggling (see globals.css `.shiki-host`).
 */
export async function highlightCodeToHtml(code: string, language?: string): Promise<string> {
  const lang = normalizeLanguage(language)
  try {
    return await codeToHtml(code, {
      lang,
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
    })
  } catch {
    return await codeToHtml(code, {
      lang: 'plaintext',
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    })
  }
}

interface HighlightedCodeProps {
  code: string
  language?: string
}

/**
 * RSC convenience component that wraps `highlightCodeToHtml` and renders the
 * resulting markup. Useful when you want to inline highlighted code in another
 * RSC; in client components, fetch the HTML via the page (server) and feed it
 * back through `<HighlightedCodeHtml>` instead.
 */
export async function HighlightedCode({ code, language }: HighlightedCodeProps) {
  const html = await highlightCodeToHtml(code, language)
  return <HighlightedCodeHtml html={html} />
}

interface HighlightedCodeHtmlProps {
  html: string
}

/**
 * Client-safe renderer for Shiki HTML strings produced server-side. Accepts a
 * trusted HTML payload (Shiki output) and injects it via dangerouslySetInnerHTML.
 */
export function HighlightedCodeHtml({ html }: HighlightedCodeHtmlProps) {
  const wrapperStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12.5,
    lineHeight: 1.55,
    overflow: 'auto',
  }
  return (
    <div
      className="shiki-host"
      style={wrapperStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
