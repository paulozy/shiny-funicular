import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonAvatar, SkeletonCard, SkeletonText } from './Skeleton'

describe('Skeleton primitives', () => {
  it('renders with default dimensions and accessible status role', () => {
    render(<Skeleton />)
    const node = screen.getByRole('status')
    expect(node).toHaveClass('skeleton', 'skeleton-shimmer')
    expect(node).toHaveAttribute('aria-label', 'Carregando…')
  })

  it('applies width and height overrides as inline styles', () => {
    render(<Skeleton width={120} height={20} />)
    const node = screen.getByRole('status')
    expect(node).toHaveStyle({ width: '120px', height: '20px' })
  })

  it('SkeletonText renders the requested number of lines', () => {
    render(<SkeletonText lines={4} />)
    expect(screen.getAllByRole('status')).toHaveLength(4)
  })

  it('SkeletonAvatar is round (50% radius)', () => {
    render(<SkeletonAvatar size={48} />)
    const node = screen.getByRole('status')
    expect(node).toHaveStyle({ width: '48px', height: '48px', borderRadius: '50%' })
  })

  it('SkeletonCard exposes a card-specific aria-label', () => {
    render(<SkeletonCard height={100} />)
    expect(screen.getByLabelText('Carregando card…')).toBeInTheDocument()
  })
})
