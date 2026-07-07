import { render, screen, fireEvent } from '@testing-library/react'
import { PrSuggestionsCard } from './PrSuggestionsCard'
import { CodeIssue } from '@/lib/types/pull_request'
import { copyText } from '@/lib/clipboard'

jest.mock('@/lib/clipboard', () => ({ copyText: jest.fn().mockResolvedValue(true) }))
const mockCopy = copyText as jest.MockedFunction<typeof copyText>

const withSug: CodeIssue = {
  severity: 'critical', category: 'security', title: 'SQLi', description: 'd',
  file: 'a.go', line: 10, suggestion: 'Use params.',
}
const noSug: CodeIssue = { severity: 'info', category: 'style', title: 'Nit', description: 'd', file: 'b.go', line: 2 }

describe('PrSuggestionsCard', () => {
  beforeEach(() => mockCopy.mockClear())

  it('renders nothing when no finding has a suggestion', () => {
    const { container } = render(<PrSuggestionsCard issues={[noSug]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows only findings that have a suggestion, plus a copy-all', () => {
    render(<PrSuggestionsCard issues={[withSug, noSug]} />)
    expect(screen.getByText('SQLi')).toBeInTheDocument()
    expect(screen.queryByText('Nit')).not.toBeInTheDocument()
    expect(screen.getByText(/Sugestões da revisão \(1\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar tudo' })).toBeInTheDocument()
  })

  it('copies a paste-ready block for an individual suggestion', async () => {
    render(<PrSuggestionsCard issues={[withSug]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(await screen.findByText('Copiado')).toBeInTheDocument()
    expect(mockCopy).toHaveBeenCalledWith('`a.go:10` — SQLi\n\nUse params.')
  })
})
