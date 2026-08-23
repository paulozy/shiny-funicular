import { timeAgo } from './relative-time'

const now = new Date('2026-08-22T12:00:00.000Z')

describe('timeAgo', () => {
  it('collapses anything under a minute into "agora"', () => {
    expect(timeAgo('2026-08-22T11:59:30.000Z', now)).toBe('agora')
  })

  it('reads clock skew from the backend as "agora" instead of a negative age', () => {
    expect(timeAgo('2026-08-22T12:00:05.000Z', now)).toBe('agora')
  })

  it('abbreviates minutes, hours and days', () => {
    expect(timeAgo('2026-08-22T11:38:00.000Z', now)).toBe('há 22min')
    expect(timeAgo('2026-08-22T10:00:00.000Z', now)).toBe('há 2h')
    expect(timeAgo('2026-08-19T12:00:00.000Z', now)).toBe('há 3d')
  })

  it('switches to months and years for older timestamps', () => {
    expect(timeAgo('2026-06-22T12:00:00.000Z', now)).toBe('há 2 meses')
    expect(timeAgo('2026-07-20T12:00:00.000Z', now)).toBe('há 1 mês')
    expect(timeAgo('2024-08-22T12:00:00.000Z', now)).toBe('há 2a')
  })

  it('renders a dash when there is no usable timestamp', () => {
    expect(timeAgo(undefined, now)).toBe('—')
    expect(timeAgo('not-a-date', now)).toBe('—')
  })
})
