/**
 * Manual mock for `react-markdown`, which is shipped as ESM and otherwise
 * breaks Jest's ts-jest transformer (no transformIgnorePatterns configured).
 *
 * The real library produces full Markdown → React tree; we don't want to test
 * that here. This mock approximates the output enough for component tests:
 * - `#` headings become semantic <h1>/<h2> elements
 * - `|` lines become a <table> with header + body
 * - `**text**` becomes <strong>
 * - everything else renders as plain text inside a <div>
 *
 * If you need richer assertions in a future test, replace this mock with a
 * proper Jest transform for ESM `react-markdown`.
 */
import { ReactNode } from 'react'

interface ReactMarkdownProps {
  children: string
}

function inlineBold(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(<strong key={`b-${match.index}`}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

export default function ReactMarkdownMock({ children }: ReactMarkdownProps) {
  const lines = children.split('\n')
  const elements: ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,4}\s/.test(line)) {
      const level = (line.match(/^#+/) || ['#'])[0].length
      const text = line.replace(/^#+\s/, '')
      const Tag = `h${Math.min(level, 6)}` as 'h1' | 'h2' | 'h3' | 'h4'
      elements.push(<Tag key={i}>{inlineBold(text)}</Tag>)
      i++
      continue
    }
    if (line.startsWith('|') && lines[i + 1]?.match(/^\|\s*-+/)) {
      // Table block: header line + separator + body lines until blank/EOF
      const header = line.split('|').slice(1, -1).map((s) => s.trim())
      const bodyRows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].startsWith('|')) {
        bodyRows.push(lines[i].split('|').slice(1, -1).map((s) => s.trim()))
        i++
      }
      elements.push(
        <table key={`t-${i}`}>
          <thead>
            <tr>
              {header.map((cell, idx) => (
                <th key={idx}>{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    elements.push(<p key={i}>{inlineBold(line)}</p>)
    i++
  }
  return <div>{elements}</div>
}
