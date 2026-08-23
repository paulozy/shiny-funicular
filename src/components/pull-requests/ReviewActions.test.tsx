import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ReviewActions, reviewErrorMessage } from './ReviewActions'

const toast = jest.fn()
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast }),
}))

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('ReviewActions', () => {
  beforeEach(() => {
    toast.mockReset()
    global.fetch = jest.fn()
  })

  it('renders nothing when the viewer cannot review', () => {
    render(<ReviewActions repoId="r1" number={42} provider="github" />)
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
  })

  it('offers both verdicts on GitHub', () => {
    render(<ReviewActions repoId="r1" number={42} provider="github" canReview />)
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar mudanças' })).toBeInTheDocument()
  })

  // GitLab has no portable "request changes" — the control is hidden rather
  // than offered and guaranteed to fail.
  it('hides "request changes" on GitLab', () => {
    render(<ReviewActions repoId="r1" number={42} provider="gitlab" canReview />)
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar mudanças' })).not.toBeInTheDocument()
  })

  it('posts the verdict and reports success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(204, null))
    const onReviewed = jest.fn()

    render(
      <ReviewActions repoId="r1" number={42} provider="github" canReview onReviewed={onReviewed} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))

    await waitFor(() => expect(onReviewed).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/repositories/r1/pull-requests/42/approve',
      expect.objectContaining({ method: 'POST' })
    )
    expect(toast).toHaveBeenCalledWith('PR #42 aprovado')
  })

  // The reason the whole change exists: the refusal must be legible, and must
  // not blame the organization's token, which is working fine.
  it('explains a self-review refusal instead of blaming the token', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(409, {
        error: 'self_review',
        message: 'this change request was opened by @paulozy, the identity this organization\'s token belongs to',
      })
    )

    render(<ReviewActions repoId="r1" number={42} provider="github" canReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))

    await waitFor(() => expect(toast).toHaveBeenCalled())
    expect(toast.mock.calls[0][0]).toContain('@paulozy')
    expect(toast.mock.calls[0][0]).not.toContain('não respondeu')
  })

  it('disables the verdicts when the backend says the viewer cannot review', () => {
    render(
      <ReviewActions
        repoId="r1"
        number={42}
        provider="github"
        canReview
        blockedReason="self_authored"
      />
    )

    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Solicitar mudanças' })).toBeDisabled()
    expect(screen.getByText(/Você abriu este PR/)).toBeInTheDocument()
  })

  // An unknown reason still came from a backend that knows something we do not.
  // Re-enabling the button would offer an action known not to work.
  it('still disables the verdicts for an unrecognized reason', () => {
    render(
      <ReviewActions repoId="r1" number={42} provider="github" canReview blockedReason="something_new" />
    )
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled()
  })

  it('treats a null reason as reviewable', () => {
    render(<ReviewActions repoId="r1" number={42} provider="github" canReview blockedReason={null} />)
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeEnabled()
  })
})

describe('reviewErrorMessage', () => {
  it('prefers the host\'s own words for a refusal it does not recognize', async () => {
    const message = await reviewErrorMessage(
      jsonResponse(409, { error: 'provider_rejected', message: 'No commits between main and feature' })
    )
    expect(message).toBe('No commits between main and feature')
  })

  it('falls back when a 409 carries no message', async () => {
    const message = await reviewErrorMessage(jsonResponse(409, { error: 'provider_rejected' }))
    expect(message).toContain('recusou')
  })

  // 503 keeps its old meaning, and that is the point: after the backend change
  // it is reserved for a host that genuinely could not answer.
  it('still blames the token on a real outage', async () => {
    const message = await reviewErrorMessage(jsonResponse(503, { error: 'provider_unavailable' }))
    expect(message).toContain('token da organização')
  })

  it('maps the permission and unsupported cases', async () => {
    expect(await reviewErrorMessage(jsonResponse(403, {}))).toContain('permissão')
    expect(await reviewErrorMessage(jsonResponse(501, {}))).toContain('não suporta')
  })

  it('survives a response with no JSON body', async () => {
    const broken = {
      ok: false,
      status: 409,
      json: async () => {
        throw new Error('not json')
      },
    } as unknown as Response

    expect(await reviewErrorMessage(broken)).toContain('recusou')
  })
})
describe('ReviewActions message', () => {
  beforeEach(() => {
    toast.mockReset()
    global.fetch = jest.fn()
  })

  // The complaint that prompted this: "solicitar mudanças" sent an empty body,
  // so the author was told to change something with no indication of what.
  it('refuses to request changes with no message, and shows why', () => {
    render(<ReviewActions repoId="r1" number={42} provider="github" canReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar mudanças' }))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/Escreva o que precisa mudar/)
    // The requirement has to be actionable, not just refused — the composer
    // opens so there is somewhere to type.
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('sends the typed message when requesting changes', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(204, null))

    render(<ReviewActions repoId="r1" number={42} provider="github" canReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar mudanças' }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'pull_requests.go — falta tratar token ausente' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar mudanças' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({
      body: 'pull_requests.go — falta tratar token ausente',
    })
  })

  // Approving needs no message: "looks good" is a complete thought.
  it('approves with no message', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(204, null))

    render(<ReviewActions repoId="r1" number={42} provider="github" canReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({ body: '' })
  })

  it('carries an optional note along with an approval', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(204, null))

    render(<ReviewActions repoId="r1" number={42} provider="github" canReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'boa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({ body: 'boa' })
  })

  it('offers no composer when the PR cannot be reviewed', () => {
    render(
      <ReviewActions repoId="r1" number={42} provider="github" canReview blockedReason="self_authored" />
    )
    expect(screen.queryByRole('button', { name: 'Comentar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
