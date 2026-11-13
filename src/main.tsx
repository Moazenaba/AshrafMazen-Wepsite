import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyNameFont } from './lib/applyNameFont';
import { storedSiteBundle } from './services/data/siteBundle';
import { bundleSettings } from './services/data/siteBundleRules';

// The name font saved on the last visit, before the first render (newer than the one the build wrote into the page)
const saved = storedSiteBundle();
if (saved) applyNameFont(bundleSettings(saved).banner_font);

createRoot(document.getElementById('root')!).render(<App />);
