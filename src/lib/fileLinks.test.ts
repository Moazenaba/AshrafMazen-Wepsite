import { describe, expect, it } from 'vitest';
import { toPublicFileUrl } from './fileLinks';

const BASE = 'https://pub-123.r2.dev';

describe('public file address', () => {
  it('turns a site file link into the public address', () => {
    expect(toPublicFileUrl('/api/r2?file=branding%2Fhero%2Fa.jpeg', BASE)).toBe('https://pub-123.r2.dev/branding/hero/a.jpeg');
    expect(toPublicFileUrl('/api/r2?file=audio%2Fx.ogg', `${BASE}/`)).toBe('https://pub-123.r2.dev/audio/x.ogg');
    expect(toPublicFileUrl('https://ashraf-mazen.vercel.app/api/r2?file=library%2Fcovers%2Fc.png', BASE)).toBe('https://pub-123.r2.dev/library/covers/c.png');
  });

  it('keeps library PDFs on the site link (viewer and named download)', () => {
    expect(toPublicFileUrl('/api/r2?file=library%2Ffiles%2Fbook.pdf', BASE)).toBe('/api/r2?file=library%2Ffiles%2Fbook.pdf');
  });

  it('changes nothing without a public address, or for other links', () => {
    expect(toPublicFileUrl('/api/r2?file=audio%2Fx.ogg', '')).toBe('/api/r2?file=audio%2Fx.ogg');
    expect(toPublicFileUrl('https://i.ytimg.com/vi/x/mqdefault.jpg', BASE)).toBe('https://i.ytimg.com/vi/x/mqdefault.jpg');
    expect(toPublicFileUrl(null, BASE)).toBeNull();
    expect(toPublicFileUrl('', BASE)).toBe('');
  });

  it('refuses a key that tries to leave its folder', () => {
    expect(toPublicFileUrl('/api/r2?file=audio%2F..%2Fsecret', BASE)).toBe('/api/r2?file=audio%2F..%2Fsecret');
  });
});

describe('file key', () => {
  it('is the same for both forms of a link to one file', async () => {
    const { fileKeyOf } = await import('./fileLinks');
    expect(fileKeyOf('/api/r2?file=audio%2Fx.mp3', BASE)).toBe('audio/x.mp3');
    expect(fileKeyOf(`${BASE}/audio/x.mp3`, BASE)).toBe('audio/x.mp3');
    expect(fileKeyOf('https://example.com/audio/x.mp3', BASE)).toBeNull();
    expect(fileKeyOf('', BASE)).toBeNull();
  });
});
