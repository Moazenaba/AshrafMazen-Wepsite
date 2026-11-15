import { describe, expect, it } from 'vitest';
import { looksLikeYoutubePage, parseLiveNow } from './_youtubeLive';

const SHEIKH = 'UCisGvsFtKyDU6NTFywaITzQ';
const OTHER = 'UCabcdefghijklmnopqrstuv';

// The part of a watch page the parser reads
const page = (over: { channelId?: string; videoId?: string; isLiveNow?: boolean | null; title?: string } = {}) => {
  const { channelId = SHEIKH, videoId = 'loVFoAlqeCc', isLiveNow = true, title = 'درس "مباشر" {الليلة}' } = over;
  const player = {
    videoDetails: { videoId, channelId, title, isLive: isLiveNow === true },
    microformat: { playerMicroformatRenderer: isLiveNow === null ? {} : { liveBroadcastDetails: { isLiveNow } } },
  };
  return `<html><script>var other = {"a":1};var ytInitialPlayerResponse = ${JSON.stringify(player)};var meta = document.createElement('meta');</script></html>`;
};

describe('parseLiveNow', () => {
  it('finds the live broadcast of the channel', () => {
    expect(parseLiveNow(page(), SHEIKH)).toEqual({ videoId: 'loVFoAlqeCc', title: 'درس "مباشر" {الليلة}' });
  });

  it('never accepts a live of another channel', () => {
    expect(parseLiveNow(page({ channelId: OTHER }), SHEIKH)).toBeNull();
  });

  it('does not count an ended or upcoming broadcast', () => {
    expect(parseLiveNow(page({ isLiveNow: false }), SHEIKH)).toBeNull();
    expect(parseLiveNow(page({ isLiveNow: null }), SHEIKH)).toBeNull();
  });

  it('reads the page whatever follows the player data', () => {
    const html = page().replace(';var meta = document.createElement(\'meta\');', ';</script><script>window.x = {"y":"}"};');
    expect(parseLiveNow(html, SHEIKH)?.videoId).toBe('loVFoAlqeCc');
  });

  it('answers null for anything that is not a watch page', () => {
    expect(parseLiveNow('<html>the channel page</html>', SHEIKH)).toBeNull();
    expect(parseLiveNow('var ytInitialPlayerResponse = {broken', SHEIKH)).toBeNull();
    expect(parseLiveNow('', SHEIKH)).toBeNull();
  });

  it('refuses a malformed video id or channel id', () => {
    expect(parseLiveNow(page({ videoId: 'x' }), SHEIKH)).toBeNull();
    expect(parseLiveNow(page(), 'not-a-channel')).toBeNull();
  });
});

describe('looksLikeYoutubePage', () => {
  it('is true for a page with player or page data and false for a consent or error page', () => {
    expect(looksLikeYoutubePage('var ytInitialPlayerResponse = {};')).toBe(true);
    expect(looksLikeYoutubePage('var ytInitialData = {};')).toBe(true);
    expect(looksLikeYoutubePage('<html>Before you continue to YouTube</html>')).toBe(false);
    expect(looksLikeYoutubePage('')).toBe(false);
  });
});
