import { describe, expect, it } from 'vitest';
import { EMPTY_FEATURE, featureStatus, featureTarget, isFeatureShown, parseHomeFeature, validateHomeFeature, withUploadedImage } from './homeFeatureRules';

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
    // No picture and a video that gives no first frame (not YouTube): nothing to show. A YouTube video gives its own frame.
    expect(isFeatureShown(f({ imageUrl: '', videoUrl: '/lesson/abc' }))).toBe(false);
    expect(isFeatureShown(f({ imageUrl: '', videoUrl: 'https://youtu.be/loVFoAlqeCc' }))).toBe(true);
    // A picture alone is enough: the video link is optional (without one the card has no button)
    expect(isFeatureShown(f({ videoUrl: '' }))).toBe(true);
    expect(validateHomeFeature(f({ videoUrl: '' }))).toBeNull();
    expect(validateHomeFeature(f({ imageUrl: '', videoUrl: '/lesson/abc' }))).toMatch(/صورة/);
  });

  it('reads bad saved data as off', () => {
    expect(parseHomeFeature('{bad')).toEqual(EMPTY_FEATURE);
    expect(parseHomeFeature(null)).toEqual(EMPTY_FEATURE);
  });

  it('says why the card is or is not shown', () => {
    expect(featureStatus(f())).toBe('shown');
    expect(featureStatus(f({ enabled: false }))).toBe('off');
    expect(featureStatus(f({ imageUrl: '', videoUrl: '/lesson/abc' }))).toBe('no-image');
    expect(featureStatus(f({ videoUrl: '' }))).toBe('shown');
  });

  it('switches the card on when a picture is uploaded and the video link is there', () => {
    const off = f({ enabled: false, imageUrl: '' });
    expect(withUploadedImage(off, '/api/r2?file=x.jpeg')).toMatchObject({ enabled: true, imageUrl: '/api/r2?file=x.jpeg' });
    expect(withUploadedImage({ ...off, videoUrl: '' }, '/api/r2?file=x.jpeg').enabled).toBe(true);
  });
});
