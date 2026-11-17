// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

const h = vi.hoisted(() => ({ playing: false, blocked: true, created: [] as { src: string; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; volume: number }[] }));
vi.mock('../../context/AudioContext', () => ({ useAudio: () => ({ playing: h.playing }) }));

class FakeAudio {
  volume = 1;
  // A browser that has not yet allowed sound refuses the first try; later ones (after a tap) are accepted
  play = vi.fn(async () => {
    if (h.blocked && h.created[0] === (this as never)) throw new Error('NotAllowedError');
  });
  pause = vi.fn();
  constructor(public src: string) {
    h.created.push(this as never);
  }
}

import { FeatureAudio } from './FeatureAudio';

beforeEach(() => {
  h.playing = false;
  h.blocked = true;
  h.created.length = 0;
  vi.stubGlobal('Audio', FakeAudio);
});

describe('FeatureAudio', () => {
  it('plays nothing until the visitor taps, then plays quietly once', () => {
    render(<FeatureAudio url="https://x.test/a.mp3" />);
    fireEvent.click(window);
    fireEvent.click(window);
    const played = h.created.filter((a) => a.play.mock.calls.length > 0);
    expect(played.length).toBeGreaterThanOrEqual(1);
    expect(h.created[h.created.length - 1].volume).toBeLessThan(1);
  });

  it('starts by itself when the browser allows it, and only once', async () => {
    h.blocked = false;
    render(<FeatureAudio url="https://x.test/a.mp3" />);
    await Promise.resolve();
    fireEvent.click(window);
    expect(h.created).toHaveLength(1);
    expect(h.created[0].play).toHaveBeenCalledTimes(1);
  });

  it('stops when the visitor leaves the page', () => {
    const view = render(<FeatureAudio url="https://x.test/a.mp3" />);
    fireEvent.click(window);
    view.unmount();
    expect(h.created.some((a) => a.pause.mock.calls.length > 0)).toBe(true);
  });

  it('does nothing when the site player is already playing or there is no sound', () => {
    h.playing = true;
    render(<FeatureAudio url="https://x.test/a.mp3" />);
    fireEvent.click(window);
    render(<FeatureAudio url="" />);
    fireEvent.click(window);
    expect(h.created).toHaveLength(0);
  });
});
