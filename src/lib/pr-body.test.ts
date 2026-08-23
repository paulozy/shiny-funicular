import { htmlToMarkdown, parsePrBody } from './pr-body'

describe('htmlToMarkdown', () => {
  it('keeps links as markdown links', () => {
    expect(htmlToMarkdown('<p>See <a href="https://x.dev/a">the notes</a>.</p>')).toBe(
      'See [the notes](https://x.dev/a).'
    )
  })

  it('converts code, emphasis, headings and list items', () => {
    const html =
      '<h2>v10.8.0</h2><ul><li><code>2fee9bb</code> feat: export <strong>ConfigObject</strong></li></ul>'

    expect(htmlToMarkdown(html)).toBe('## v10.8.0\n\n- `2fee9bb` feat: export **ConfigObject**')
  })

  it('drops the machine-only comments bots leave behind', () => {
    expect(htmlToMarkdown('a<!-- dependabot-automerge-start -->b')).toBe('ab')
  })

  it('decodes entities so escaped markup reads as text', () => {
    expect(htmlToMarkdown('<p>use &lt;div&gt; &amp; friends</p>')).toBe('use <div> & friends')
  })

  it('never leaves a bare tag on screen', () => {
    expect(htmlToMarkdown('<blockquote><p>quoted</p></blockquote>')).toBe('quoted')
  })
})

describe('parsePrBody', () => {
  it('returns nothing for an empty body', () => {
    expect(parsePrBody('')).toEqual([])
    expect(parsePrBody(undefined)).toEqual([])
  })

  it('leaves plain markdown untouched as a single segment', () => {
    expect(parsePrBody('Bumps eslint from 9 to 10.')).toEqual([
      { type: 'markdown', content: 'Bumps eslint from 9 to 10.' },
    ])
  })

  // The Dependabot shape: one line of prose, then a wall of release notes that
  // has to collapse instead of flooding the page.
  it('splits <details> blocks out of the prose, keeping document order', () => {
    const body = [
      'Bumps eslint from 9.39.4 to 10.8.0.',
      '<details>',
      '<summary>Release notes</summary>',
      '<p>Sourced from <a href="https://x.dev/releases">releases</a>.</p>',
      '</details>',
      'Dependabot will resolve conflicts.',
    ].join('\n')

    expect(parsePrBody(body)).toEqual([
      { type: 'markdown', content: 'Bumps eslint from 9.39.4 to 10.8.0.' },
      {
        type: 'details',
        summary: 'Release notes',
        content: 'Sourced from [releases](https://x.dev/releases).',
      },
      { type: 'markdown', content: 'Dependabot will resolve conflicts.' },
    ])
  })

  it('handles several details blocks and names an unlabelled one', () => {
    const body = '<details><p>one</p></details><details><summary>Commits</summary><p>two</p></details>'

    expect(parsePrBody(body)).toEqual([
      { type: 'details', summary: 'Detalhes', content: 'one' },
      { type: 'details', summary: 'Commits', content: 'two' },
    ])
  })
})
