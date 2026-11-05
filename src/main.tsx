import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The font stylesheet loads without blocking the first paint (a plain <link> in the page would block it)
const fonts = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
if (fonts) {
  fonts.media = 'print';
  const show = () => { fonts.media = 'all'; };
  fonts.addEventListener('load', show, { once: true });
  setTimeout(show, 3000);
}

createRoot(document.getElementById('root')!).render(<App />);
