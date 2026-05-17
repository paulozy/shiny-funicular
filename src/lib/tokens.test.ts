import { T } from './tokens'

describe('design tokens', () => {
  it('exposes the new dark-mode-friendly surface layers', () => {
    expect(T.surfaceElevated).toBe('var(--color-surface-elevated)')
    expect(T.surfaceOverlay).toBe('var(--color-surface-overlay)')
  })

  it('exposes provider color tokens so dark mode can override them', () => {
    expect(T.providerGithub).toBe('var(--color-provider-github)')
    expect(T.providerGitlab).toBe('var(--color-provider-gitlab)')
    expect(T.providerGitea).toBe('var(--color-provider-gitea)')
  })

  it('keeps inverse ink for high-contrast button text on inked backgrounds', () => {
    expect(T.inkInverse).toBe('var(--color-ink-inverse)')
  })
})
