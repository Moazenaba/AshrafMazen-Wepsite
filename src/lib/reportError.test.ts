// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  return (await import('./reportError')).reportError;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('reportError', () => {
  it('sends one report through sendBeacon', async () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const reportError = await fresh();
    reportError('page-crash', new Error('boom'), { a: 1 });
    expect(beacon).toHaveBeenCalledTimes(1);
    expect((beacon.mock.calls[0] as unknown[])[0]).toBe('/api/log');
  });

  it('stops after 5 reports', async () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const reportError = await fresh();
    for (let i = 0; i < 9; i++) reportError('x', 'y');
    expect(beacon).toHaveBeenCalledTimes(5);
  });

  it('falls back to fetch and never throws when sendBeacon is missing', async () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true });
    const f = vi.fn(async () => new Response(''));
    vi.stubGlobal('fetch', f);
    const reportError = await fresh();
    expect(() => reportError('x', 'y')).not.toThrow();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('never throws even when sending fails', async () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: () => {
        throw new Error('blocked');
      },
      configurable: true,
    });
    const reportError = await fresh();
    expect(() => reportError('x', 'y')).not.toThrow();
  });
});
