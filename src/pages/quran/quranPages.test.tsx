// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { renderWithProviders } from '../../test/render';

const moshaf = (id: number, list: string, server = 'https://server1.mp3quran.net/husary/') => ({ id, name: `مصحف ${id}`, server, rewaya_id: 1, surah_list: list, surah_total: 3 });
const catalog = {
  reciters: [
    { id: 1, name: 'محمود الحصري', moshaf: [moshaf(10, '1,2,3', 'https://server1.mp3quran.net/audio/mahmoud-husary/r1')] },
    { id: 2, name: 'مشاري العفاسي', moshaf: [moshaf(20, '1,2'), moshaf(21, '3')] },
  ],
  surahs: [
    { id: 1, name: 'الفاتحة' },
    { id: 2, name: 'البقرة' },
    { id: 3, name: 'آل عمران' },
  ],
  riwayat: [{ id: 1, name: 'حفص' }],
  loading: false,
  failed: false,
};
const sync = vi.hoisted(() => ({ value: { level: 'none', text: [], words: [], ayahs: [], loading: false } as any }));
const player = vi.hoisted(() => ({ play: vi.fn(), seek: vi.fn(), toggle: vi.fn() }));

vi.mock('./useQuranCatalog', async (orig) => ({ ...(await orig<typeof import('./useQuranCatalog')>()), useQuranCatalog: () => catalog }));
vi.mock('./RadiosList', () => ({ RadiosList: () => <p>إذاعات</p> }));
vi.mock('./reader/useSurahSync', () => ({ useSurahSync: () => sync.value }));
vi.mock('../../context/AudioContext', async (orig) => {
  const real = await orig<typeof import('../../context/AudioContext')>();
  return { ...real, useAudio: () => ({ track: null, playing: false, time: 0, rate: 1, setRate: vi.fn(), ...player }) };
});

import { QuranPage } from '../QuranPage';
import { QuranReciterPage } from '../QuranReciterPage';
import { QuranReader } from './reader/QuranReader';
import { ReaderText } from './reader/ReaderText';

beforeEach(() => {
  player.play.mockReset();
  player.seek.mockReset();
  sync.value = { level: 'none', text: [], words: [], ayahs: [], loading: false };
  localStorage.clear();
});

describe('QuranPage', () => {
  it('switches tabs and filters the reciters by a search word', async () => {
    renderWithProviders(<QuranPage />);
    expect(screen.getByText('محمود الحصري')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('ابحث باسم القارئ'), 'العفاسي');
    expect(screen.queryByText('محمود الحصري')).toBeNull();
    expect(screen.getByText('مشاري العفاسي')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'السور' }));
    expect(screen.getByRole('link', { name: /البقرة/ })).toHaveAttribute('href', expect.stringContaining('/quran/read/'));
    await userEvent.click(screen.getByRole('tab', { name: 'الإذاعات' }));
    expect(screen.getByText('إذاعات')).toBeInTheDocument();
  });
});

describe('QuranReciterPage', () => {
  it('lists only the surahs of the chosen moshaf', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/quran/reciter/:id" element={<QuranReciterPage />} />
      </Routes>,
      { route: '/quran/reciter/2' },
    );
    expect(screen.getByRole('link', { name: /الفاتحة/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /آل عمران/ })).toBeNull();
    await userEvent.selectOptions(screen.getByRole('combobox'), '21');
    expect(screen.getByRole('link', { name: /آل عمران/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /الفاتحة/ })).toBeNull();
  });
});

describe('QuranReader', () => {
  const open = () =>
    renderWithProviders(
      <Routes>
        <Route path="/quran/read/:reciterId/:moshafId/:surah" element={<QuranReader />} />
      </Routes>,
      { route: '/quran/read/1/10/2' },
    );

  it('with no synchronised text it says so and still has a play button', async () => {
    open();
    expect(await screen.findByText('النص المتزامن غير متاح لهذه التلاوة الآن.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'تشغيل' }));
    expect(player.play).toHaveBeenCalledWith(expect.objectContaining({ id: 'quran:10:2', src: expect.stringContaining('002.mp3') }), undefined);
  });

  it('shows the basmalah as its own line and the font size buttons work', async () => {
    sync.value = { level: 'ayah', text: [{ ayah: 1, words: [{ position: 1, text: 'الم' }] }], words: [], ayahs: [[1, 0, 1000]], loading: false };
    open();
    expect(await screen.findByText(/بِسْمِ ٱللَّهِ/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'تكبير الخط' }));
    expect(localStorage.getItem('quran_font_size')).toBe('34');
  });
});

describe('ReaderText', () => {
  it('a click on a word seeks to its start', async () => {
    const onSeek = vi.fn();
    const text = [{ ayah: 1, words: [{ position: 1, text: 'بِسْمِ' }, { position: 2, text: 'ٱللَّهِ' }] }];
    const words: [number, number, number, number][] = [[1, 1, 0, 400], [1, 2, 1500, 2000]];
    renderWithProviders(
      <ReaderText surah={1} text={text} words={words} level="word" fontSize={30} wordNodes={{ current: [] }} ayahNodes={{ current: new Map() }} onSeek={onSeek} ayahStarts={new Map([[1, 0]])} />,
    );
    await userEvent.click(within(document.body).getByText('ٱللَّهِ'));
    expect(onSeek).toHaveBeenCalledWith(1.5);
  });
});

describe('the highlight loop', () => {
  it('changes classes on nodes and never sets React state per frame', () => {
    const source = readFileSync('src/pages/quran/reader/useHighlight.ts', 'utf8');
    expect(source).toContain('requestAnimationFrame');
    expect(source).not.toMatch(/useState|setState/);
    expect(source).toContain('classList.add');
  });
});
