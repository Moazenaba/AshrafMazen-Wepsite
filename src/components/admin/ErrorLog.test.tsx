// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorLogMissingError } from '../../services/data/errorEvents';

const h = vi.hoisted(() => ({ get: vi.fn(), clear: vi.fn() }));
vi.mock('../../services/data/errorEvents', async (orig) => {
  const real = await orig<typeof import('../../services/data/errorEvents')>();
  return { ...real, getErrorEvents: h.get, clearErrorEvents: h.clear };
});

import { ErrorLog } from './ErrorLog';

beforeEach(() => {
  h.get.mockReset();
});

describe('ErrorLog', () => {
  it('lists the events', async () => {
    h.get.mockResolvedValue([{ id: 1, at: '2026-11-16T10:00:00Z', source: 'browser', name: 'upload-failed', message: 'blocked', path: '/admin' }]);
    render(<ErrorLog />);
    expect(await screen.findByText('blocked')).toBeInTheDocument();
    expect(screen.getByText(/upload-failed/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /مسح الكل/ })).toBeInTheDocument();
  });

  it('says there are no errors when the list is empty', async () => {
    h.get.mockResolvedValue([]);
    render(<ErrorLog />);
    expect(await screen.findByText('لا توجد أخطاء مسجّلة')).toBeInTheDocument();
  });

  it('shows the hint to run the SQL file when the table is missing', async () => {
    h.get.mockRejectedValue(new ErrorLogMissingError('missing'));
    render(<ErrorLog />);
    expect(await screen.findByRole('alert')).toHaveTextContent('2026-11-16-error-events.sql');
  });
});
