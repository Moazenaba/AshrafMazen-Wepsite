import { describe, expect, it } from 'vitest';
import { arrangeMenu, EMPTY_MENU, moveMenuItem, parseSideMenu, sideMenuItems, toggleMenuItem } from './sideMenuRules';

const items = sideMenuItems(
  [
    { id: 'c1', name: 'العقيدة', slug: 'aqeeda' },
    { id: 'c2', name: 'الخطب', slug: 'khutab' },
  ],
  [{ id: 'P1', title: 'شرح الأصول' }]
);
const keys = (list: { key: string }[]) => list.map((i) => i.key);

describe('side menu', () => {
  it('lists every lesson and reels first, then categories, then playlists', () => {
    expect(keys(items)).toEqual(['link:search', 'link:reels', 'cat:c1', 'cat:c2', 'pl:P1']);
    expect(items.find((i) => i.key === 'cat:c2')).toMatchObject({ label: 'خطب الجمعة', to: expect.stringContaining('/playlist/') });
  });

  it('follows the admin order; a new item keeps its place after the placed ones', () => {
    const config = { order: ['pl:P1', 'link:reels'], hidden: [] };
    expect(keys(arrangeMenu(items, config))).toEqual(['pl:P1', 'link:reels', 'link:search', 'cat:c1', 'cat:c2']);
  });

  it('leaves out hidden items, except in the editor', () => {
    const config = toggleMenuItem(EMPTY_MENU, 'link:reels');
    expect(keys(arrangeMenu(items, config))).not.toContain('link:reels');
    expect(keys(arrangeMenu(items, config, true))).toContain('link:reels');
    expect(toggleMenuItem(config, 'link:reels').hidden).toEqual([]);
  });

  it('moves one item a step', () => {
    const moved = moveMenuItem(EMPTY_MENU, items, 4, -1);
    expect(keys(arrangeMenu(items, moved))).toEqual(['link:search', 'link:reels', 'cat:c1', 'pl:P1', 'cat:c2']);
    expect(moveMenuItem(EMPTY_MENU, items, 0, -1)).toBe(EMPTY_MENU);
  });

  it('reads a broken setting as the built-in menu', () => {
    expect(parseSideMenu('{bad')).toEqual(EMPTY_MENU);
    expect(parseSideMenu(JSON.stringify({ order: ['a', 'a', 3], hidden: 'x' }))).toEqual({ order: ['a'], hidden: [] });
  });
});
