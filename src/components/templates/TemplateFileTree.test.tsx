import { fireEvent, render, screen } from '@testing-library/react'
import { TemplateFileTree } from './TemplateFileTree'
import { GeneratedFile } from '@/lib/types/template'

const files: GeneratedFile[] = [
  { path: 'package.json', content: '{}', language: 'json' },
  { path: 'src/index.ts', content: 'export {}', language: 'typescript' },
  { path: 'src/server/app.ts', content: '// app', language: 'typescript' },
]

describe('TemplateFileTree', () => {
  it('renders top-level files and directories with directories sorted first', () => {
    render(<TemplateFileTree files={files} onSelect={() => undefined} />)

    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText('package.json')).toBeInTheDocument()
    // src/index.ts only shows when the directory is expanded (which it is by default).
    expect(screen.getByText('index.ts')).toBeInTheDocument()
  })

  it('toggles directory expansion when clicked', () => {
    render(<TemplateFileTree files={files} onSelect={() => undefined} />)

    const srcRow = screen.getByText('src').closest('button')!
    expect(srcRow).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(srcRow)
    expect(srcRow).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('index.ts')).not.toBeInTheDocument()
  })

  it('invokes onSelect with the GeneratedFile when a leaf is clicked', () => {
    const onSelect = jest.fn()
    render(<TemplateFileTree files={files} onSelect={onSelect} />)

    fireEvent.click(screen.getByText('package.json'))

    expect(onSelect).toHaveBeenCalledWith(files[0])
  })
})
