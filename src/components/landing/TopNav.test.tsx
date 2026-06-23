import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNav from './TopNav';

vi.mock('../../lib/scroll', () => ({ scrollToSection: vi.fn() }));
import { scrollToSection } from '../../lib/scroll';

const renderNav = () => render(<MemoryRouter><TopNav /></MemoryRouter>);

describe('TopNav', () => {
  it('muestra el logo Urban Drive', () => {
    renderNav();
    expect(screen.getByAltText(/urban drive/i)).toBeInTheDocument();
  });

  it('al click en un enlace de nav hace smooth-scroll a la sección', () => {
    renderNav();
    fireEvent.click(screen.getByRole('button', { name: /funciones/i }));
    expect(scrollToSection).toHaveBeenCalledWith('#features');
  });
});
