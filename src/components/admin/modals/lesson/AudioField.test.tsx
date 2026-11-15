// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { AudioField } from './AudioField';
import { newLessonForm } from './lessonForm';

// Regression for REL-09: a url-typed field refused the site's own /api/r2 links and silently blocked saving.
describe('AudioField link input', () => {
  const form = { ...newLessonForm(null, 's1', []), audioInputType: 'url' as const, audioUrl: '/api/r2?file=audio%2Fx.ogg' };

  it('is a text field, not type=url', () => {
    const { container } = render(<AudioField form={form} update={() => {}} uploading={false} onFile={() => {}} />);
    expect(container.querySelector('input')!.type).toBe('text');
  });

  it('accepts a site link inside a form', () => {
    const { container } = render(
      <form>
        <AudioField form={form} update={() => {}} uploading={false} onFile={() => {}} />
      </form>,
    );
    expect(container.querySelector('form')!.checkValidity()).toBe(true);
  });
});
