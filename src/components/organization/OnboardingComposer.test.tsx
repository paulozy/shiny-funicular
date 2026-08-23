import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OnboardingComposer } from './OnboardingComposer'
import { OnboardingTemplate } from '@/lib/types/onboarding'

const apiFetch = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

const templates: OnboardingTemplate[] = [
  {
    id: 'backend',
    label: 'Dev backend',
    description: 'O caminho padrão de quem entra no backend',
    steps: [
      {
        kind: 'markdown',
        title: 'Leia antes de começar',
        body: '## Bem-vindo',
        config: {},
        is_required: true,
        estimated_minutes: 10,
      },
    ],
  },
]

const baseProps = {
  templates,
  repositories: [{ id: 'repo-1', label: 'web' }],
  teams: [{ id: 'team-1', label: 'Plataforma' }],
  docs: [],
  members: [{ id: 'user-1', label: 'Ana' }],
  candidates: [{ id: 'user-1', label: 'Ana' }],
  onClose: jest.fn(),
  onPublished: jest.fn(),
}

function fillNameAndAdvance(name = 'Dev backend — 30 dias') {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: name } })
  fireEvent.change(screen.getByLabelText('A partir de'), { target: { value: 'backend' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gerar rascunho' }))
}

describe('OnboardingComposer', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    baseProps.onPublished = jest.fn()
  })

  it('starts on the audience step and will not advance without a name', () => {
    render(<OnboardingComposer {...baseProps} />)

    expect(screen.getByRole('heading', { name: 'Para quem é este onboarding?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Começar do zero' })).toBeDisabled()
  })

  it('seeds the draft from the chosen template', () => {
    render(<OnboardingComposer {...baseProps} />)

    fillNameAndAdvance()

    expect(screen.getByText('Blocos da sua organização')).toBeInTheDocument()
    // The template's step is in the editor and in the preview column.
    expect(screen.getAllByDisplayValue('Leia antes de começar').length).toBeGreaterThan(0)
    expect(screen.getByText('1. Leia antes de começar')).toBeInTheDocument()
  })

  it('adds a step from the block library', () => {
    render(<OnboardingComposer {...baseProps} />)

    fillNameAndAdvance()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Repositório' }))

    expect(screen.getByText('2. Repositório')).toBeInTheDocument()
  })

  // Publishing is three server calls in order: create the flow, save the whole
  // step list, then assign whoever was ticked.
  it('creates the flow, saves the steps and assigns the selected people', async () => {
    apiFetch.mockImplementation((path: string) => {
      if (path === '/api/onboarding/flows') return Promise.resolve({ id: 'flow-9' })
      return Promise.resolve({})
    })

    render(<OnboardingComposer {...baseProps} />)

    fillNameAndAdvance()
    fireEvent.click(screen.getByRole('button', { name: 'Revisar e publicar' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar onboarding' }))

    await waitFor(() => expect(baseProps.onPublished).toHaveBeenCalledWith('flow-9'))

    const calls = apiFetch.mock.calls.map((call) => call[0])
    expect(calls).toEqual([
      '/api/onboarding/flows',
      '/api/onboarding/flows/flow-9/steps',
      '/api/onboarding/assignments',
    ])
    expect(JSON.parse(apiFetch.mock.calls[2][1].body)).toEqual({
      flow_id: 'flow-9',
      user_id: 'user-1',
    })
  })

  // Editing an existing flow must reuse its id — a fresh POST would orphan the
  // progress of everyone already in it.
  it('saves an existing flow in place instead of creating a new one', async () => {
    apiFetch.mockResolvedValue({})

    render(
      <OnboardingComposer
        {...baseProps}
        flow={{
          id: 'flow-1',
          name: 'Dev backend',
          steps: [{ id: 'step-1', kind: 'markdown', title: 'Leia', config: {}, is_required: true }],
        }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Revisar e publicar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar fluxo' }))

    await waitFor(() => expect(baseProps.onPublished).toHaveBeenCalledWith('flow-1'))
    expect(apiFetch.mock.calls.map((call) => call[0])).toEqual(['/api/onboarding/flows/flow-1/steps'])
  })
})
