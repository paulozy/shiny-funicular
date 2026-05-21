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
