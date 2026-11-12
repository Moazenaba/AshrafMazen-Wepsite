// The round menu button floating over the page on phones. A tap opens the site menu (MobileMenuSheet); a drag
// moves it anywhere, and on release it settles against the nearer edge. The place is kept in this browser.
import React, { useEffect, useRef, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { DRAG_THRESHOLD, parsePosition, settle, topOf, type FloatPosition } from './floatingPosition';

const KEY = 'floating_menu_position';
const SIZE = 56;
const EDGE = 16;

function load(): FloatPosition {
  try {
    return parsePosition(localStorage.getItem(KEY));
  } catch {
    return parsePosition(null);
  }
}

export const FloatingMenuButton: React.FC<{ open: boolean; onOpen: () => void }> = ({ open, onOpen }) => {
  const [position, setPosition] = useState<FloatPosition>(load);
  const [height, setHeight] = useState(() => window.innerHeight);
  // While dragging: the button follows the finger (left/top in pixels)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // A drag ends with a click too: that click must not open the menu
  const dragged = useRef(false);

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    dragged.current = false;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < DRAG_THRESHOLD) return;
    s.moved = true;
    setDrag({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    start.current = null;
    if (!s?.moved) return;
    dragged.current = true;
    const next = settle(e.clientX, e.clientY, window.innerWidth, window.innerHeight, SIZE);
    setPosition(next);
    setDrag(null);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // private window: the place lasts this visit only
    }
  };

  const style: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y }
    : { top: topOf(position, height, SIZE), [position.side]: EDGE };

  return (
    <button
      type="button"
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onOpen();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        setDrag(null);
      }}
      aria-label="قائمة الموقع"
      aria-haspopup="dialog"
      aria-expanded={open}
      style={{ ...style, width: SIZE, height: SIZE, touchAction: 'none' }}
      className={`lg:hidden fixed z-40 rounded-full bg-mushaf text-gold-soft border-2 border-gold shadow-lg flex items-center justify-center select-none ${
        drag ? 'scale-110 cursor-grabbing' : 'transition-[top,left,right,transform] duration-200 ease-out active:scale-95'
      }`}
    >
      <LayoutGrid className="w-6 h-6" aria-hidden="true" />
    </button>
  );
};
