import { describe, expect, it } from 'vitest';
import { EMPTY_FEATURE, featureTarget, isFeatureShown, parseHomeFeature, validateHomeFeature } from './homeFeatureRules';

const f = (over = {}) => ({ ...EMPTY_FEATURE, enabled: true, imageUrl: 'https://x/img.jpg', videoUrl: 'https://youtu.be/loVFoAlqeCc', ...over });

describe('home feature', () => {
  it('plays a YouTube link inside the site', () => {
    expect(featureTarget(f())).toEqual({ kind: 'internal', href: '/video/loVFoAlqeCc' });
    expect(featureTarget(f({ title: 'درس' })).href).toBe(`/video/loVFoAlqeCc?t=${encodeURIComponent('درس')}`);
  });

  it('keeps a site address inside the site and opens any other link outside', () => {
    expect(featureTarget(f({ videoUrl: '/lesson/1' }))).toEqual({ kind: 'internal', href: '/lesson/1' });
    expect(featureTarget(f({ videoUrl: 'https://vimeo.com/1' }))).toEqual({ kind: 'external', href: 'https://vimeo.com/1' });
  });

  it('shows only when on, with a picture and a video', () => {
    expect(isFeatureShown(f())).toBe(true);
    expect(isFeatureShown(f({ enabled: false }))).toBe(false);
    expect(isFeatureShown(f({ imageUrl: '' }))).toBe(false);
    expect(validateHomeFeature(f({ videoUrl: '' }))).toMatch(/رابط الفيديو/);
  });

  it('reads bad saved data as off', () => {
    expect(parseHomeFeature('{bad')).toEqual(EMPTY_FEATURE);
    expect(parseHomeFeature(null)).toEqual(EMPTY_FEATURE);
  });
});
