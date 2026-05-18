import { render, screen } from '@testing-library/react'
import { DocMarkdownViewer } from './DocMarkdownViewer'

describe('DocMarkdownViewer', () => {
  it('renders headings and paragraphs from markdown source', () => {
    render(<DocMarkdownViewer content={'# Title\n\nFirst paragraph with **bold**.'} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText(/First paragraph with/)).toBeInTheDocument()
    expect(screen.getByText('bold').tagName.toLowerCase()).toBe('strong')
  })

  it('supports GFM tables via remark-gfm', () => {
    const md = [
      '| Col | Value |',
      '| --- | --- |',
      '| a | 1 |',
      '| b | 2 |',
    ].join('\n')
    render(<DocMarkdownViewer content={md} />)

    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(screen.getByText('Col')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('shows an empty-state placeholder when content is blank', () => {
    render(<DocMarkdownViewer content="" />)
    expect(screen.getByText(/não foi gerada/i)).toBeInTheDocument()
  })
})
