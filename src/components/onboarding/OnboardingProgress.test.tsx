import { render, screen } from '@testing-library/react'
import { OnboardingProgress } from './OnboardingProgress'

describe('OnboardingProgress', () => {
  it('reports read progress and required progress separately', () => {
    render(<OnboardingProgress done={2} total={6} requiredRemaining={1} totalMinutes={45} />)

    expect(screen.getByText('2 de 6 passos')).toBeInTheDocument()
    expect(screen.getByText(/1 obrigatório\(s\) pendente/)).toBeInTheDocument()
    expect(screen.getByText(/≈45 min/)).toBeInTheDocument()
  })

  it('says the flow is satisfied once nothing required is pending', () => {
    // A flow can be complete with optional steps untouched. Reporting a single
    // percentage would send people chasing 100% for no reason.
    render(<OnboardingProgress done={4} total={6} requiredRemaining={0} />)

    expect(screen.getByText('4 de 6 passos')).toBeInTheDocument()
    expect(screen.getByText(/tudo que era obrigatório está feito/)).toBeInTheDocument()
  })

  it('exposes progress to assistive technology', () => {
    render(<OnboardingProgress done={3} total={9} requiredRemaining={2} />)

    const bar = screen.getByRole('progressbar', { name: 'Progresso do onboarding' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '9')
  })

  it('does not divide by zero on an empty flow', () => {
    render(<OnboardingProgress done={0} total={0} requiredRemaining={0} />)
    expect(screen.getByText('0 de 0 passos')).toBeInTheDocument()
  })
})
