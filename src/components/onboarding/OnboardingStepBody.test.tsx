import { render, screen } from '@testing-library/react'
import { OnboardingStepBody } from './OnboardingStepBody'
import { OnboardingRunStep } from '@/lib/types/onboarding'

function step(overrides: Partial<OnboardingRunStep>): OnboardingRunStep {
  return {
    id: 'step-1',
    position: 0,
    kind: 'markdown',
    title: 'Passo',
    config: {},
    is_required: true,
    completion_mode: 'auto',
    ...overrides,
  }
}

describe('OnboardingStepBody', () => {
  it('explains a reference that no longer exists instead of rendering nothing', () => {
    render(
      <OnboardingStepBody
        step={step({ kind: 'repository', unavailable: 'Este repositório não existe mais.' })}
      />
    )
    // The reader gets an explanation rather than an empty panel they have to
    // interpret — and the step still exists in the flow.
    expect(screen.getByRole('status')).toHaveTextContent('Este repositório não existe mais.')
  })

  it('shows a repository with its owning team and scorecard', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'repository',
          resolved: {
            repository: {
              id: 'repo-1',
              name: 'owner/serviço',
              description: 'o serviço de pagamentos',
              url: 'https://github.com/owner/servico',
              type: 'github',
              metadata: { languages: { Go: 90, SQL: 10 } },
              owner_team: { id: 'team-1', name: 'Pagamentos' },
              scorecard: { passing: 6, failing: 2, total: 8, verdicts: [] },
            },
          },
        })}
      />
    )

    expect(screen.getByText('owner/serviço')).toBeInTheDocument()
    expect(screen.getByText('Pagamentos')).toBeInTheDocument()
    expect(screen.getByText(/6 de 8 checagens/)).toBeInTheDocument()
    expect(screen.getByText(/2 pendência/)).toBeInTheDocument()
  })

  it('warns when a repository has no owning team', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'repository',
          resolved: {
            repository: {
              id: 'repo-1',
              name: 'owner/orfao',
              url: 'https://github.com/owner/orfao',
              type: 'github',
              owner_team: null,
            },
          },
        })}
      />
    )
    // "Who answers for this" is the question the onboarding exists to answer,
    // so an unowned repository has to say so rather than stay silent.
    expect(screen.getByText('sem time')).toBeInTheDocument()
  })

  it('answers both halves of a team step: who is in it and what it owns', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'team',
          resolved: {
            team: {
              id: 'team-1',
              name: 'Pagamentos',
              slug: 'pagamentos',
              members: [
                { user_id: 'u1', full_name: 'Ana', email: 'ana@e.test', role: 'lead' },
                { user_id: 'u2', full_name: 'Beto', email: 'beto@e.test', role: 'member' },
              ],
              repositories: [{ id: 'repo-1', name: 'owner/pagamentos' }],
            },
          },
        })}
      />
    )

    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('lead')).toBeInTheDocument()
    expect(screen.getByText('owner/pagamentos')).toBeInTheDocument()
  })

  it('says a team owns nothing rather than showing an empty list', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'team',
          resolved: {
            team: { id: 'team-1', name: 'Novo', slug: 'novo', members: [], repositories: [] },
          },
        })}
      />
    )
    expect(screen.getByText(/Nenhum repositório atribuído/)).toBeInTheDocument()
    expect(screen.getByText(/Ninguém neste time ainda/)).toBeInTheDocument()
  })

  it('renders glossary terms with their definitions', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'glossary',
          resolved: {
            terms: [{ id: 't1', term: 'SLO', definition: 'Objetivo de nível de serviço' }],
          },
        })}
      />
    )
    expect(screen.getByText('SLO')).toBeInTheDocument()
    expect(screen.getByText('Objetivo de nível de serviço')).toBeInTheDocument()
  })

  it('keeps a contact whose area is known even after they left', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'contacts',
          resolved: {
            people: [
              { user_id: 'u9', full_name: '(saiu da organização)', area: 'Deploy', when_to_reach: 'esteira travada' },
            ],
          },
        })}
      />
    )
    // Knowing that someone owns deploys is still useful; dropping the row would
    // leave the newcomer with no idea who to look for.
    expect(screen.getByText('Deploy')).toBeInTheDocument()
    expect(screen.getByText('esteira travada')).toBeInTheDocument()
  })

  it('renders a checklist as items, not as a claim of completion', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'checklist',
          config: { items: [{ text: 'Instalar dependências' }, { text: 'Rodar os testes' }] },
        })}
      />
    )
    expect(screen.getByText('Instalar dependências')).toBeInTheDocument()
    expect(screen.getByText('Rodar os testes')).toBeInTheDocument()
  })

  it('describes what a verified step will check', () => {
    render(
      <OnboardingStepBody
        step={step({
          kind: 'verified',
          resolved: {
            verification: {
              check: 'first_change_request',
              description: 'A plataforma confirma quando você abrir seu primeiro pull request.',
            },
          },
        })}
      />
    )
    expect(screen.getByText(/A plataforma confirma quando/)).toBeInTheDocument()
  })
})
