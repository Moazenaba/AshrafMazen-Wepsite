import { describe, expect, it, vi } from 'vitest';
import { render, withNameFont, withSiteSeed } from './prerenderParts.mjs';

const SHELL = `<!doctype html><html lang="ar" dir="rtl"><head>
<title>x</title>
<meta name="description" content="d" />
<meta property="og:title" content="t" />
<meta property="og:description" content="d" />
<meta name="twitter:title" content="t" />
<meta name="twitter:description" content="d" />
<meta property="og:url" content="u" />
<link rel="canonical" href="u" />
<link rel="preload" id="name-font-preload" href="/fonts/old.woff2" />
</head><body><div id="root"></div></body></html>`;
const site = { siteUrl: 'https://site.test', verification: '' };

describe('render', () => {
  it('gives a page its own title and canonical address', () => {
    const html = render(SHELL, { path: '/lesson/a', title: 'درس', description: 'وصف' }, site);
    expect(html).toContain('<title>درس</title>');
    expect(html).toContain('<link rel="canonical" href="https://site.test/lesson/a"');
  });

  it('escapes < in a title', () => {
    const html = render(SHELL, { path: '/', title: 'a <script> b', description: 'd' }, site);
    expect(html).toContain('<title>a &lt;script&gt; b</title>');
    expect(html).not.toContain('<title>a <script>');
  });

  it('drops the canonical link for the fallback shell', () => {
    const html = render(SHELL, { path: '/', title: 't', description: 'd', noCanonical: true }, site);
    expect(html).not.toContain('rel="canonical"');
  });

  it('keeps a $ pattern in a title as written', () => {
    expect(render(SHELL, { path: '/', title: 'سعر $& كامل', description: 'd' }, site)).toContain('<title>سعر $&amp; كامل</title>');
  });
});

describe('withNameFont', () => {
  it('falls back to the default font for an unknown id', () => {
    const html = withNameFont('<html lang="ar"><link rel="preload" id="name-font-preload" href="/old" /></html>', 'nope');
    expect(html).toContain('--name-font');
    expect(html).not.toContain('href="/old"');
  });
});

describe('withSiteSeed', () => {
  it('writes the seed once, and never lets it close the script early', async () => {
    const html = await withSiteSeed(SHELL, async () => ({ title: 'x </script><b>y' }));
    expect(html.match(/id="site-seed"/g)).toHaveLength(1);
    const inner = html.split('id="site-seed">')[1].split('</script>')[0];
    expect(inner).not.toContain('</script');
    expect(JSON.parse(inner).title).toBe('x </script><b>y');
  });

  it('leaves the page unchanged when the data cannot be read', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = await withSiteSeed(SHELL, async () => {
      throw new Error('offline');
    });
    expect(html).toBe(SHELL);
  });

  it('writes nothing when the seed is over the size limit', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = await withSiteSeed(SHELL, async () => ({ big: 'x'.repeat(100) }), 50);
    expect(html).toBe(SHELL);
  });
});
