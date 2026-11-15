// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import type { LiveView } from '../services/data/liveStreamRules';

let view: LiveView = { youtubeId: null, telegram: null, title: '' };
vi.mock('../hooks/useLiveStream', () => ({ useLiveStream: () => ({ view, loaded: true }) }));

import { LiveBanner } from './LiveBanner';

describe('LiveBanner', () => {
  beforeEach(() => {
    view = { youtubeId: null, telegram: null, title: '' };
  });

  it('renders nothing when nothing is live', () => {
    renderWithProviders(<LiveBanner />);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('offers the watch button for a YouTube live', () => {
    view = { youtubeId: 'abc12345678', telegram: null, title: 'درس' };
    renderWithProviders(<LiveBanner />);
    expect(screen.getByText('شاهد البث')).toBeInTheDocument();
  });

  it('shows only the Telegram button for a Telegram-only live', () => {
    view = { youtubeId: null, telegram: 'https://t.me/x', title: '' };
    renderWithProviders(<LiveBanner />);
    expect(screen.queryByText('شاهد البث')).toBeNull();
    expect(screen.getByText('ادخل البث على تليجرام')).toBeInTheDocument();
  });
});
