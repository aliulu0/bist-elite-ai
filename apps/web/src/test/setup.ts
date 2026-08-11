import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

globalThis.HTMLElement.prototype.scrollIntoView = vi.fn();

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 300 });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 300 });
