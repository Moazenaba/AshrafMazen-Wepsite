// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/supabase', () => ({ hasStoredSession: () => false }));

const bundle = { updatedAt: '', settings: [], categories: [], series: [], lessons: [], social: [] };

async function fresh() {
  vi.resetModules();
  return import('./siteBundle');
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('seedIsStale', () => {
  it('is true when the page copy is in use and the fresh answer failed', async () => {
    document.body.innerHTML = `<script type="application/json" id="site-seed">${JSON.stringify(bundle)}</script>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    const mod = await fresh();
    expect(mod.storedSiteBundle()).not.toBeNull();
    await mod.loadSiteBundle();
    expect(mod.seedIsStale()).toBe(true);
  });

  it('is false when the fresh answer arrived', async () => {
    document.body.innerHTML = `<script type="application/json" id="site-seed">${JSON.stringify(bundle)}</script>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(bundle))));
    const mod = await fresh();
    mod.storedSiteBundle();
    await mod.loadSiteBundle();
    expect(mod.seedIsStale()).toBe(false);
  });

  it('is false when the copy came from this browser', async () => {
    localStorage.setItem('site_bundle_v1', JSON.stringify(bundle));
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    const mod = await fresh();
    mod.storedSiteBundle();
    await mod.loadSiteBundle();
    expect(mod.seedIsStale()).toBe(false);
  });
});
