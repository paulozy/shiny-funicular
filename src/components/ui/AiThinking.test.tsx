import { act, render, screen } from '@testing-library/react'
import { AiThinking } from './AiThinking'

describe('AiThinking', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the first message immediately', () => {
    render(<AiThinking messages={['First', 'Second', 'Third']} intervalMs={1000} />)
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('cycles to the next message after the interval', () => {
    render(<AiThinking messages={['First', 'Second', 'Third']} intervalMs={1000} />)
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('stops on the last message (does not loop)', () => {
    render(<AiThinking messages={['First', 'Second']} intervalMs={1000} />)
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })

  it('exposes role="status" with a friendly aria-label', () => {
    render(<AiThinking messages={['Anything']} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Carregando')
  })

  it('omits the skeleton when showSkeleton is false', () => {
    const { container } = render(
      <AiThinking messages={['Anything']} showSkeleton={false} />
    )
    // The skeleton block has 4 children divs with shimmer animation. Without
    // skeleton, the only child of the wrapping div is the headline.
    expect(container.querySelectorAll('div[style*="background-position"]').length).toBe(0)
  })
})
