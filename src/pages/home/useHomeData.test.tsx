// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ saved: null as any, loadBundle: vi.fn() }));

vi.mock('../../services/data/siteBundle', () => ({ storedSiteBundle: () => h.saved, loadSiteBundle: h.loadBundle }));
vi.mock('../../services/dataService', async (orig) => {
  const real = await orig<typeof import('../../services/dataService')>();
  const fail = () => Promise.reject(new Error('down'));
  return {
    ...real,
    getSiteSettings: fail,
    getCategoriesWithPortalData: fail,
    getFeaturedLessons: fail,
    getKhutabLessons: fail,
    getLatestLessons: fail,
    getTopViewedLessons: fail,
  };
});

import { useHomeData } from './useHomeData';

const lesson = { id: 'l1', series_id: 's1', lesson_number: 1, title: 'درس', status: 'published', published_at: '2026-01-01', views: 1 };
const bundle = { updatedAt: '', settings: [], categories: [{ id: 'c1', name: 'ق', slug: 'q', sort_order: 1 }], series: [{ id: 's1', category_id: 'c1', title: 's', sort_order: 1 }], lessons: [lesson], social: [] };

beforeEach(() => {
  h.saved = null;
  h.loadBundle.mockReset().mockResolvedValue(null);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useHomeData', () => {
  it('is failed when the bundle and the direct queries fail and nothing is saved', async () => {
    const { result } = renderHook(() => useHomeData());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.failed).toBe(true);
  });

  it('shows the saved copy, not failed, when the fresh load fails', async () => {
    h.saved = bundle;
    const { result } = renderHook(() => useHomeData());
    expect(result.current.latestList).toHaveLength(1);
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.failed).toBe(false);
    expect(result.current.latestList).toHaveLength(1);
  });
});
