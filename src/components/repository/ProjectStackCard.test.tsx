import { render, screen } from '@testing-library/react'
import { ProjectStackCard } from './ProjectStackCard'

describe('ProjectStackCard', () => {
  it('renders empty state when nothing is detected', () => {
    render(<ProjectStackCard />)
    expect(
      screen.getByText('Sem informações de stack detectadas.')
    ).toBeInTheDocument()
  })

  it('shows the top languages in descending order with percentages', () => {
    render(
      <ProjectStackCard
        languages={{ TypeScript: 8000, Go: 2000 }}
      />
    )
    const ts = screen.getByText('TypeScript')
    const go = screen.getByText('Go')
    expect(ts).toBeInTheDocument()
    expect(go).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()

    // TypeScript should come first
    expect(ts.compareDocumentPosition(go) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('groups languages beyond top 5 into "Outros"', () => {
    render(
      <ProjectStackCard
        languages={{
          A: 300,
          B: 250,
          C: 200,
          D: 150,
          E: 100,
          F: 50,
          G: 30,
        }}
      />
    )
    expect(screen.getByText('Outros')).toBeInTheDocument()
  })

  it('renders frameworks as accent chips and topics as default chips', () => {
    render(
      <ProjectStackCard
        frameworks={['Next.js', 'React']}
        topics={['idp', 'ai']}
      />
    )
    expect(screen.getByText('Next.js')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('idp')).toBeInTheDocument()
    expect(screen.getByText('ai')).toBeInTheDocument()
  })

  it('shows individual empty states when only some sections are populated', () => {
    render(<ProjectStackCard languages={{ Go: 100 }} />)
    expect(screen.getByText('Sem frameworks detectados.')).toBeInTheDocument()
    expect(screen.getByText('Sem tópicos detectados.')).toBeInTheDocument()
  })

  it('renders the languages bar as an img with descriptive aria-label', () => {
    render(<ProjectStackCard languages={{ Go: 100 }} />)
    expect(screen.getByRole('img', { name: /distribuição de linguagens/i })).toBeInTheDocument()
  })
})
