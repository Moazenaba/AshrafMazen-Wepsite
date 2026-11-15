import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyNameFont } from './lib/applyNameFont';
import { storedSiteBundle } from './services/data/siteBundle';
import { bundleSettings } from './services/data/siteBundleRules';
import { reportError } from './lib/reportError';
import { isChunkError } from './components/ErrorBoundary';

// Failures nobody sees on the visitor's screen: written to the site's log (at most 5 per page load)
window.addEventListener('error', (event) => {
  if (event.error instanceof Error && isChunkError(event.error)) return;
  reportError('page-error', event.error ?? event.message, { file: event.filename, line: event.lineno });
});
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof Error && isChunkError(event.reason)) return;
  reportError('unhandled-rejection', event.reason);
});

// The name font saved on the last visit, before the first render (newer than the one the build wrote into the page)
const saved = storedSiteBundle();
if (saved) applyNameFont(bundleSettings(saved).banner_font);

createRoot(document.getElementById('root')!).render(<App />);
