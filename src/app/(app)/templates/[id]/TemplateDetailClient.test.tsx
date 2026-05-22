import { render, screen } from '@testing-library/react'
import { TemplateDetailClient } from './TemplateDetailClient'
import { UserInfo } from '@/lib/types/auth'
import { CodeTemplate } from '@/lib/types/template'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/templates/t-1',
}))

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn().mockResolvedValue({}),
}))

// TemplateFileViewer transitively imports shiki (ESM-only), which ts-jest cannot
// parse. The viewer is not relevant to the assertions in this suite — we only
// care about the status pill + tokens/files metadata gating — so stub it.
jest.mock('@/components/templates/TemplateFileViewer', () => ({
  TemplateFileViewer: () => null,
}))
jest.mock('@/components/templates/TemplateFileTree', () => ({
  TemplateFileTree: () => null,
}))

const baseUser: UserInfo = {
  id: 'u-1',
  email: 'u@example.com',
  full_name: 'User',
  role: 'admin',
  organization: { id: 'org-1', name: 'Org', slug: 'org', role: 'admin' },
}

const baseTemplate: CodeTemplate = {
  id: 't-1',
  organization_id: 'org-1',
  repository_id: null,
  prompt: 'Generate Next.js API',
  status: 'completed',
  files: [{ path: 'index.ts', content: 'export {}', language: 'typescript' }],
  summary: 'Next.js API scaffold',
  tokens_used: 1500,
  processing_ms: 8000,
  is_pinned: false,
  stack_snapshot: { languages: ['TypeScript'] },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('TemplateDetailClient', () => {
  it('does not render the files/tokens metadata line when the template is pending', () => {
    const pending: CodeTemplate = {
      ...baseTemplate,
      id: 't-pending',
      status: 'pending',
      tokens_used: undefined,
      processing_ms: undefined,
      files: undefined,
    }

    render(<TemplateDetailClient user={baseUser} template={pending} htmlByPath={{}} />)

    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.queryByText(/tokens/)).not.toBeInTheDocument()
    expect(screen.queryByText(/arquivos/)).not.toBeInTheDocument()
  })

  it('does not render the files/tokens metadata line when the template is generating', () => {
    const generating: CodeTemplate = {
      ...baseTemplate,
      id: 't-generating',
      status: 'generating',
      tokens_used: undefined,
      processing_ms: undefined,
      files: [],
    }

    render(<TemplateDetailClient user={baseUser} template={generating} htmlByPath={{}} />)

    expect(screen.getByText('Gerando…')).toBeInTheDocument()
    expect(screen.queryByText(/tokens/)).not.toBeInTheDocument()
    expect(screen.queryByText(/arquivos/)).not.toBeInTheDocument()
  })

  it('renders the files/tokens metadata line when the template is completed', () => {
    render(<TemplateDetailClient user={baseUser} template={baseTemplate} htmlByPath={{}} />)

    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('1 arquivos')).toBeInTheDocument()
    expect(screen.getByText('1.500 tokens')).toBeInTheDocument()
  })
})
