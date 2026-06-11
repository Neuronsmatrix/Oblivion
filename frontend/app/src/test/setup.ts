import '@testing-library/jest-dom/vitest';

// jsdom lacks IntersectionObserver, which the marketing scroll-story relies on.
if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error - minimal stub for tests
  globalThis.IntersectionObserver = IntersectionObserverStub;
}
