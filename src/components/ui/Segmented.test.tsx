import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Segmented } from './Segmented'

const options = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'hot' as const, label: 'Hot' },
  { value: 'pending' as const, label: 'Pendências' },
]

describe('Segmented', () => {
  it('exposes the options as a single radio group with the current value checked', () => {
    render(
      <Segmented
        name="filter"
        ariaLabel="Filtro de repositórios"
        options={options}
        value="hot"
        onChange={jest.fn()}
      />
    )

    expect(screen.getByRole('radiogroup', { name: 'Filtro de repositórios' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Hot' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Todos' })).not.toBeChecked()
  })

  it('reports the selected value', async () => {
    const onChange = jest.fn()
    render(<Segmented name="filter" options={options} value="all" onChange={onChange} />)

    // The real input is visually hidden (pointer-events: none, per the design
    // system); the label is the hit target, exactly as in the browser.
    await userEvent.click(screen.getByText('Pendências'))

    expect(onChange).toHaveBeenCalledWith('pending')
  })
})
