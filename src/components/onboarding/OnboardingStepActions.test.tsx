import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingStepActions } from './OnboardingStepActions'
import { OnboardingRunStep } from '@/lib/types/onboarding'

/**
 * These tests are about honesty, not layout. The completion mode comes from the
 * server, and the action bar is where a UI would be tempted to imply the
 * platform checked something it only watched someone click.
 */

function step(overrides: Partial<OnboardingRunStep> = {}): OnboardingRunStep {
  return {
    id: 'step-1',
    position: 0,
    kind: 'markdown',
    title: 'Bem-vindo',
    config: {},
    is_required: true,
    completion_mode: 'acknowledge',
    ...overrides,
  }
}

const noop = () => {}

describe('OnboardingStepActions', () => {
  it('asks for an acknowledgement on required reading', () => {
    render(<OnboardingStepActions step={step()} busy={false} onMark={noop} onVerify={noop} />)
    expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument()
  })

  it('says a self-reported step is marked by the person, not verified', () => {
    render(
      <OnboardingStepActions
        step={step({ kind: 'task', completion_mode: 'self_reported' })}
        busy={false}
        onMark={noop}
        onVerify={noop}
      />
    )
    expect(screen.getByRole('button', { name: 'Marcar como feito' })).toBeInTheDocument()
    expect(screen.getByText(/marcado por você/i)).toBeInTheDocument()
  })

  it('offers verification instead of self-marking on a verified step', async () => {
    const onVerify = jest.fn()
    const onMark = jest.fn()
    render(
      <OnboardingStepActions
        step={step({ kind: 'verified', completion_mode: 'verified' })}
        busy={false}
        onMark={onMark}
        onVerify={onVerify}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))
    expect(onVerify).toHaveBeenCalledTimes(1)
    // A verified step must not be markable by hand — that is the whole point of
    // it being verified.
    expect(onMark).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Pular' })).not.toBeInTheDocument()
  })

  it('shows what a verification found', () => {
    render(
      <OnboardingStepActions
        step={step({ kind: 'verified', completion_mode: 'verified' })}
        busy={false}
        onMark={noop}
        onVerify={noop}
        verification={{ passed: true, pending: false, how: 'Encontramos owner/repo#7, aberto por @octocat.' }}
      />
    )
    expect(screen.getByText(/owner\/repo#7/)).toBeInTheDocument()
  })

  it('does not paint a pending verification as a failure', () => {
    render(
      <OnboardingStepActions
        step={step({ kind: 'verified', completion_mode: 'verified' })}
        busy={false}
        onMark={noop}
        onVerify={noop}
        verification={{
          passed: false,
          pending: true,
          how: 'Entre uma vez com github para a plataforma reconhecer seu usuário lá.',
        }}
      />
    )
    // The distinction the backend is careful about has to survive rendering:
    // "we could not look" is not "you did not do it".
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/Entre uma vez com github/)
    expect(status).not.toHaveTextContent(/não/i)
  })

  it('sends the skip reason along with the skip', async () => {
    const onMark = jest.fn()
    render(<OnboardingStepActions step={step()} busy={false} onMark={onMark} onVerify={noop} />)

    await userEvent.click(screen.getByRole('button', { name: 'Pular' }))
    await userEvent.type(screen.getByLabelText('Motivo para pular'), 'já sei isso')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onMark).toHaveBeenCalledWith('skipped', 'já sei isso')
  })

  it('reports a step already done', () => {
    render(
      <OnboardingStepActions
        step={step({ status: 'done', note: 'anotei' })}
        busy={false}
        onMark={noop}
        onVerify={noop}
      />
    )
    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText(/anotei/)).toBeInTheDocument()
  })
})
