import { render, screen } from '@testing-library/react'
import { ScorecardCard } from './ScorecardCard'
import { Scorecard } from '@/lib/types/scorecard'

function makeScorecard(overrides: Partial<Scorecard> = {}): Scorecard {
  return {
    passing: 1,
    failing: 1,
    not_applicable: 1,
    total: 2,
    verdicts: [
      { check_id: 'a.pass', version: 1, title: 'Tem descrição', status: 'pass', reason: 'ok' },
      {
        check_id: 'b.fail',
        version: 1,
        title: 'Tem time responsável',
        status: 'fail',
        reason: 'Defina um time em Configurações.',
      },
      { check_id: 'c.na', version: 1, title: 'Webhook registrado', status: 'not_applicable', reason: 'sem URL pública' },
    ],
    ...overrides,
  }
}

describe('ScorecardCard', () => {
  it('renders a passing count, never a percentage or a grade', () => {
    render(<ScorecardCard scorecard={makeScorecard()} />)

    expect(screen.getByText('1 de 2')).toBeInTheDocument()
    // The removed AI score rendered as "n/100"; nothing here may resemble it.
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument()
  })

  // The card is a to-do list, so what needs doing has to come first.
  it('orders failing checks before passing ones', () => {
    render(<ScorecardCard scorecard={makeScorecard()} />)

    const titles = screen.getAllByRole('status').map((el) => el.textContent ?? '')
    expect(titles[0]).toContain('Tem time responsável')
  })

  it('shows the remediation text only for checks that are not passing', () => {
    render(<ScorecardCard scorecard={makeScorecard()} />)

    expect(screen.getByText(/Defina um time em Configurações/)).toBeInTheDocument()
    expect(screen.queryByText('ok')).not.toBeInTheDocument()
  })

  // A not-applicable check must not read as a failure — that distinction is the
  // reason a fresh catalog does not look like a wall of red.
  it('explains that not-applicable checks are outside the count', () => {
    render(<ScorecardCard scorecard={makeScorecard()} />)

    expect(screen.getByLabelText('Webhook registrado: não se aplica')).toBeInTheDocument()
    expect(screen.getByText(/não se aplicam a este repositório/)).toBeInTheDocument()
  })

  it('omits the not-applicable footnote when every check applied', () => {
    render(
      <ScorecardCard
        scorecard={makeScorecard({
          not_applicable: 0,
          total: 3,
          verdicts: makeScorecard().verdicts.filter((v) => v.status !== 'not_applicable'),
        })}
      />
    )

    expect(screen.queryByText(/não se aplicam/)).not.toBeInTheDocument()
  })

  it('renders nothing when the backend sent no scorecard', () => {
    const { container } = render(<ScorecardCard />)
    expect(container).toBeEmptyDOMElement()
  })
})
