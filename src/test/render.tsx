import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AudioProvider } from '../context/AudioContext';

export function renderWithProviders(ui: React.ReactElement, { route = '/' }: { route?: string } = {}) {
  return render(
    <ThemeProvider>
      <AudioProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AudioProvider>
    </ThemeProvider>,
  );
}
