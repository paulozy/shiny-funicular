import { render, screen, fireEvent } from '@testing-library/react'
import { CopyButton } from './CopyButton'
import { copyText } from '@/lib/clipboard'

jest.mock('@/lib/clipboard', () => ({ copyText: jest.fn() }))
const mockCopy = copyText as jest.MockedFunction<typeof copyText>

describe('CopyButton', () => {
  beforeEach(() => mockCopy.mockReset())

  it('copies the text and shows "Copiado" on success', async () => {
    mockCopy.mockResolvedValue(true)
    const onCopied = jest.fn()
    render(
      <CopyButton text="hello world" label="Copiar sugestão" announceLabel="Copiado: X" onCopied={onCopied} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copiar sugestão' }))

    expect(await screen.findByText('Copiado')).toBeInTheDocument()
    expect(mockCopy).toHaveBeenCalledWith('hello world')
    expect(onCopied).toHaveBeenCalledWith('Copiado: X')
  })

  it('shows "Falhou" when the copy fails', async () => {
    mockCopy.mockResolvedValue(false)
    render(<CopyButton text="x" label="Copiar" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(await screen.findByText('Falhou')).toBeInTheDocument()
  })
})
