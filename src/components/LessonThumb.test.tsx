// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { LessonThumb } from './LessonThumb';

const img = (c: HTMLElement) => c.querySelector('img');

describe('LessonThumb', () => {
  it('shows the admin picture first', () => {
    const { container } = render(<LessonThumb imageUrl="https://x.test/a.jpg" youtubeUrl="https://youtu.be/dQw4w9WgXcQ" />);
    expect(img(container)?.getAttribute('src')).toContain('x.test/a.jpg');
  });

  it('falls back to the YouTube picture when the admin picture fails', () => {
    const { container } = render(<LessonThumb imageUrl="https://x.test/a.jpg" youtubeUrl="https://youtu.be/dQw4w9WgXcQ" />);
    fireEvent.error(img(container)!);
    expect(img(container)?.getAttribute('src')).toContain('ytimg.com');
  });

  it('shows the icon when there is no picture and no YouTube link', () => {
    const { container } = render(<LessonThumb />);
    expect(img(container)).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
