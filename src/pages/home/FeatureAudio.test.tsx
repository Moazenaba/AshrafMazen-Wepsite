// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

const h = vi.hoisted(() => ({ playing: false, created: [] as { src: string; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; volume: number }[] }));
vi.mock('../../context/AudioContext', () => ({ useAudio: () => ({ playing: h.playing }) }));

class FakeAudio {
  volume = 1;
  play = vi.fn(async () => {});
  pause = vi.fn();
  constructor(public src: string) {
    h.created.push(this as never);
  }
}

import { FeatureAudio } from './FeatureAudio';

beforeEach(() => {
  h.playing = false;
  h.created.length = 0;
  vi.stubGlobal('Audio', FakeAudio);
});

describe('FeatureAudio', () => {
  it('plays nothing until the visitor taps, then plays quietly once', () => {
    render(<FeatureAudio url="https://x.test/a.mp3" />);
    expect(h.created).toHaveLength(0);
    fireEvent.click(window);
    fireEvent.click(window);
    expect(h.created).toHaveLength(1);
    expect(h.created[0].play).toHaveBeenCalled();
    expect(h.created[0].volume).toBeLessThan(1);
  });

  it('stops when the visitor leaves the page', () => {
    const view = render(<FeatureAudio url="https://x.test/a.mp3" />);
    fireEvent.click(window);
    view.unmount();
    expect(h.created[0].pause).toHaveBeenCalled();
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
