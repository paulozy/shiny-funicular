import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Trigger({ message = 'Issue #88 fechada' }: { message?: string }) {
  const { toast } = useToast()
  return (
    <button type="button" onClick={() => toast(message)}>
      disparar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    // No runOnlyPendingTimers: the provider clears its timer on unmount, and
    // firing it here would land a setState outside act().
    jest.useRealTimers()
  })

  it('shows the message and clears it once it expires', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.getByText('Issue #88 fechada')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(screen.queryByText('Issue #88 fechada')).not.toBeInTheDocument()
  })

  // The live region has to outlive the message, or assistive tech can miss the
  // announcement entirely.
  it('keeps a stable live region even when nothing is showing', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    )
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
  })

  it('replaces the previous message rather than stacking', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    function Two() {
      const { toast } = useToast()
      return (
        <>
          <button type="button" onClick={() => toast('primeira')}>
            um
          </button>
          <button type="button" onClick={() => toast('segunda')}>
            dois
          </button>
        </>
      )
    }
    render(
      <ToastProvider>
        <Two />
      </ToastProvider>
    )

    await user.click(screen.getByRole('button', { name: 'um' }))
    await user.click(screen.getByRole('button', { name: 'dois' }))

    expect(screen.queryByText('primeira')).not.toBeInTheDocument()
    expect(screen.getByText('segunda')).toBeInTheDocument()
  })

  // A confirmation is never load-bearing, so a component rendered without the
  // provider (a test, a story) must still work.
  it('is a no-op outside a provider', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<Trigger />)
    await user.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.queryByText('Issue #88 fechada')).not.toBeInTheDocument()
  })
})
