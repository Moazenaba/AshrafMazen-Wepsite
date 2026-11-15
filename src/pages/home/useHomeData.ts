// Loads what the home page shows: the sciences, the featured, latest, most viewed and sermon lessons, and the site settings.
// The copy saved on the last visit draws the page at once; the one request to /api/site then brings it up to date.
// If that request fails (or an admin is signed in) the lists are read from the database one by one, as before.
import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_SETTINGS,
  getCategoriesWithPortalData,
  getFeaturedLessons,
  getKhutabLessons,
  getLatestLessons,
  getSiteSettings,
  getTopViewedLessons,
} from '../../services/dataService';
import { loadSiteBundle, storedSiteBundle } from '../../services/data/siteBundle';
import { bundleSettings, buildHomeLists, type HomeLists, type SiteBundle } from '../../services/data/siteBundleRules';
import type { SiteSettings } from '../../types';

const EMPTY: HomeLists = { categories: [], featuredList: [], latestList: [], viewedList: [], sermonList: [] };

// failed: nothing could be loaded and there is no saved copy to show
type HomeState = HomeLists & { settings: SiteSettings; loaded: boolean; failed: boolean };

const fromBundle = (bundle: SiteBundle): HomeState => ({ ...buildHomeLists(bundle), settings: bundleSettings(bundle), loaded: true, failed: false });

function initialState(): HomeState {
  const saved = storedSiteBundle();
  return saved ? fromBundle(saved) : { ...EMPTY, settings: DEFAULT_SITE_SETTINGS, loaded: false, failed: false };
}

async function loadOneByOne(): Promise<HomeState> {
  const settings = getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);
  try {
    const [categories, featuredList, latestList, viewedList, sermonList] = await Promise.all([
      getCategoriesWithPortalData(1),
      getFeaturedLessons(3),
      getLatestLessons(30),
      getTopViewedLessons(6),
      getKhutabLessons(8),
    ]);
    return { categories, featuredList, latestList, viewedList, sermonList, settings: await settings, loaded: true, failed: false };
  } catch (err) {
    console.error('Error loading home data:', err);
    return { ...EMPTY, settings: await settings, loaded: true, failed: true };
  }
}

export function useHomeData() {
  const [state, setState] = useState<HomeState>(initialState);

  useEffect(() => {
    let isMounted = true;
    loadSiteBundle()
      .then((bundle) => (bundle ? fromBundle(bundle) : loadOneByOne()))
      .then((next) => {
        if (isMounted) setState((prev) => (prev.loaded && next.latestList.length === 0 && prev.latestList.length > 0 ? prev : next));
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
