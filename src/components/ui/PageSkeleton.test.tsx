import { render, screen } from '@testing-library/react'
import { PageSkeleton, PageSkeletonVariant } from './PageSkeleton'

describe('PageSkeleton', () => {
  it('marks itself busy for assistive tech', () => {
    const { container } = render(<PageSkeleton variant="grid" />)
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite')
  })

  it('renders the header (eyebrow + title placeholders) by default', () => {
    render(<PageSkeleton variant="grid" />)
    // 2 header skeletons (eyebrow + title) + 6 cards = 8 status nodes.
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(8)
  })

  it('hides the header when hideHeader is set', () => {
    const { rerender } = render(<PageSkeleton variant="grid" />)
    const withHeader = screen.getAllByRole('status').length

    rerender(<PageSkeleton variant="grid" hideHeader />)
    const withoutHeader = screen.getAllByRole('status').length

    expect(withoutHeader).toBeLessThan(withHeader)
  })

  // Each variant must render *something* — the count differs but a non-empty
  // tree is the minimum contract. Snapshot tests would be brittle here.
  it.each<PageSkeletonVariant>(['grid', 'split', 'list', 'detail'])(
    'renders body content for variant=%s',
    (variant) => {
      const { container } = render(<PageSkeleton variant={variant} />)
      expect(container.firstChild).toBeInTheDocument()
      expect(screen.getAllByRole('status').length).toBeGreaterThan(2)
    }
  )
})
