// Where the floating menu button sits: against the left or right edge, at a height the visitor dragged it to.
// Kept as the side and a fraction of the screen height, so it stays in place when the phone turns. No screen here.

export interface FloatPosition {
  side: 'left' | 'right';
  // 0 = top of the free area, 1 = its bottom
  y: number;
}

// Free area: below the top bar, above the bottom (the sound bar and the phone's own bar live there)
export const TOP_GAP = 80;
export const BOTTOM_GAP = 96;
export const DEFAULT_POSITION: FloatPosition = { side: 'right', y: 1 };
// A press that moves less than this is a tap, not a drag
export const DRAG_THRESHOLD = 8;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1);

// Where a drag let go: the nearer edge, and the height as a fraction of the free area
export function settle(centerX: number, centerY: number, width: number, height: number, size: number): FloatPosition {
  const free = Math.max(1, height - TOP_GAP - BOTTOM_GAP - size);
  return { side: centerX < width / 2 ? 'left' : 'right', y: clamp01((centerY - size / 2 - TOP_GAP) / free) };
}

// The pixel top of the button for a stored position on this screen
export function topOf(position: FloatPosition, height: number, size: number): number {
  const free = Math.max(0, height - TOP_GAP - BOTTOM_GAP - size);
  return TOP_GAP + clamp01(position.y) * free;
}

export function parsePosition(raw: string | null): FloatPosition {
  try {
    const data = raw ? JSON.parse(raw) : null;
    if (data && (data.side === 'left' || data.side === 'right')) return { side: data.side, y: clamp01(Number(data.y)) };
  } catch {
    // a broken value: back to the corner
  }
  return DEFAULT_POSITION;
}
