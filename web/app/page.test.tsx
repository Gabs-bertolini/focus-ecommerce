import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('renders the welcome heading and navigation guidance', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: 'Bem-vindo ao Focus Ecommerce' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use o menu acima para navegar/)).toBeInTheDocument();
  });
});