// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { EMPTY_WELCOME } from '../services/data/welcomeSoundRules';
import { renderWithProviders } from '../test/render';

const h = vi.hoisted(() => ({ get: vi.fn(), created: [] as string[] }));
vi.mock('../services/data/siteContent', () => ({ getSiteContent: h.get }));

class FakeAudio {
  volume = 1;
  preload = '';
  duration = 5;
  onloadedmetadata: (() => void) | null = null;
  constructor(src?: string) {
    h.created.push(src ?? '(empty)');
  }
  removeAttribute() {}
  pause() {}
  set src(v: string) {
    h.created.push(v);
    queueMicrotask(() => this.onloadedmetadata?.());
  }
}

import { WelcomeSound } from './WelcomeSound';

beforeEach(() => {
  h.created.length = 0;
  sessionStorage.clear();
  vi.stubGlobal('Audio', FakeAudio);
});

const welcome = (over: object) => ({ welcome: { ...EMPTY_WELCOME, enabled: true, url: 'https://x.test/w.mp3', ...over } });

describe('WelcomeSound', () => {
  it('makes no request for a 60-second recording', async () => {
    h.get.mockResolvedValue(welcome({ seconds: 60 }));
    renderWithProviders(<WelcomeSound />);
    await waitFor(() => expect(h.get).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(h.created.filter((s) => s.includes('w.mp3'))).toEqual([]);
  });

  it('does not download the header of a recording whose short length is known', async () => {
    h.get.mockResolvedValue(welcome({ seconds: 8 }));
    renderWithProviders(<WelcomeSound />);
    await waitFor(() => expect(h.get).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(h.created.filter((s) => s.includes('w.mp3'))).toEqual([]);
  });

  it('still measures an old record that has no saved length', async () => {
    h.get.mockResolvedValue(welcome({}));
    renderWithProviders(<WelcomeSound />);
    await waitFor(() => expect(h.created.some((s) => s.includes('w.mp3'))).toBe(true));
  });
});
