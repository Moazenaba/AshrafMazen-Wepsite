import { describe, expect, it } from 'vitest';
import { getYouTubeId, getYouTubeThumbnail } from './youtube';

const ID = 'loVFoAlqeCc';

describe('getYouTubeId (any kind of YouTube link)', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?feature=share&v=${ID}`],
    [`https://youtu.be/${ID}`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/live/${ID}`],
    [ID],
    [`  ${ID}  `],
  ])('finds the id in %s', (url) => expect(getYouTubeId(url)).toBe(ID));

  it.each([[''], ['https://example.com/video'], ['not a link'], ['https://www.youtube.com/watch?v=short']])('finds nothing in "%s"', (url) =>
    expect(getYouTubeId(url)).toBeNull()
  );
  it('copes with empty values', () => {
    expect(getYouTubeId(null)).toBeNull();
    expect(getYouTubeId(undefined)).toBeNull();
  });
});

describe('getYouTubeThumbnail', () => {
  it('builds the picture address from the id, and has none for a bad link', () => {
    expect(getYouTubeThumbnail(`https://youtu.be/${ID}`)).toContain(ID);
    expect(getYouTubeThumbnail('https://example.com')).toBeNull();
  });
});
