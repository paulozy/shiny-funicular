import '@testing-library/jest-dom'

// jsdom does not implement ResizeObserver, but cmdk (used by CommandPalette)
// and a few Radix-style libraries require it. Provide a no-op polyfill so
// component tests can render without throwing.
class ResizeObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverPolyfill }).ResizeObserver =
    ResizeObserverPolyfill
}

// jsdom doesn't implement Element.scrollIntoView either. cmdk calls it when
// the active item changes — stub it as a no-op to keep tests green.
if (typeof window !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function noopScrollIntoView() {}
}
