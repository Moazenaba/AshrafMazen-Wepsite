import { describe, expect, it } from 'vitest';
import { featureCardHtml, readFeature } from './prerenderFeature.mjs';

const row = (value) => [{ key: 'home_feature', value: JSON.stringify(value) }];

describe('prerendered featured card', () => {
  it('takes the picture from a YouTube link and links a site address as given', () => {
    const f = readFeature(row({ enabled: true, title: 'خطبة <الجمعة>', imageFrom: 'https://youtu.be/loVFoAlqeCc', videoUrl: '/lesson/abc' }));
    expect(f).toMatchObject({ image: 'https://i.ytimg.com/vi/loVFoAlqeCc/hqdefault.jpg', href: '/lesson/abc' });
    const html = featureCardHtml(f);
    expect(html).toContain('<h3 class="font-sans');
    expect(html).toContain('خطبة &lt;الجمعة&gt;');
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('href="/lesson/abc"');
  });

  it('writes nothing when the card is off, has no picture, or the setting is broken', () => {
    expect(readFeature(row({ enabled: false, imageUrl: '/x.jpg' }))).toBeNull();
    expect(readFeature(row({ enabled: true, title: 'x' }))).toBeNull();
    expect(readFeature([{ key: 'home_feature', value: '{bad' }])).toBeNull();
    expect(featureCardHtml(null)).toBe('');
  });
});
