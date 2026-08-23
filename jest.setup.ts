import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

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

// jsdom 20 ships HTMLDialogElement but not showModal/close. The modals in this
// app use the native <dialog> API; polyfill the two methods so component tests
// can render and close dialogs without throwing.
if (typeof window !== 'undefined' && typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '')
    }
  }
  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}

// The App Router hooks throw outside a router provider ("invariant expected app
// router to be mounted"), and shared components legitimately use them — the
// review actions call `router.refresh()` so a submitted verdict is re-read
// instead of leaving a stale badge on screen.
//
// A default mock lives here rather than in each suite because the requirement
// is environmental, not behavioural: a component under test should not have to
// know it is being rendered without a router. A suite that wants to assert on
// navigation still overrides this with its own `jest.mock`.
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: jest.fn(),
  redirect: jest.fn(),
}))
