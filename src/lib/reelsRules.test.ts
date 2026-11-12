import { describe, expect, it } from 'vitest';
import { adminReels, parseReelsSettings, settingsFromAdmin, visibleReels, EMPTY_REELS } from './reelsRules';

const r = (id: string, title = id) => ({ id: id.padEnd(11, 'x'), title });

describe('reels', () => {
  it('shows YouTube shorts as they come when nothing is saved', () => {
    expect(visibleReels([r('a'), r('b')], EMPTY_REELS).map((x) => x.title)).toEqual(['a', 'b']);
  });

  it('keeps the admin order and puts new YouTube shorts first', () => {
    const settings = { items: [r('b'), r('a')], hidden: [], titles: {} };
    expect(visibleReels([r('c'), r('a'), r('b')], settings).map((x) => x.title)).toEqual(['c', 'b', 'a']);
    expect(adminReels([r('c'), r('a'), r('b')], settings).map((x) => x.fresh)).toEqual([true, false, false]);
  });

  it('never brings back a removed short', () => {
    const settings = settingsFromAdmin([r('a')], [r('b').id], {});
    expect(visibleReels([r('a'), r('b')], settings).map((x) => x.title)).toEqual(['a']);
  });

  it('keeps shorts the admin added even when YouTube no longer lists them', () => {
    const settings = { items: [r('z', 'added')], hidden: [], titles: {} };
    expect(visibleReels([], settings).map((x) => x.title)).toEqual(['added']);
  });

  it('uses the admin title', () => {
    const settings = settingsFromAdmin([r('a')], [], { [r('a').id]: ' new ' });
    expect(visibleReels([r('a')], settings)[0].title).toBe('new');
  });

  it('reads bad saved data as empty', () => {
    expect(parseReelsSettings('not json')).toEqual(EMPTY_REELS);
    expect(parseReelsSettings({ items: [{ id: 'bad' }] }).items).toEqual([]);
  });
});
