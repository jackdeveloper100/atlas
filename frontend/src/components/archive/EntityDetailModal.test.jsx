import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntityDetailModal from './EntityDetailModal';

describe('EntityDetailModal', () => {
  it('shows real nation fields and no fabricated GDP/military/culture fallback data', () => {
    const nation = {
      id: 'kelkelia',
      name: 'Kelkelia',
      population: 500000,
      governmentType: 'Monarchy',
    };

    render(<EntityDetailModal entity={nation} type="nation" isOpen onClose={() => {}} />);

    expect(screen.getAllByText('Kelkelia').length).toBeGreaterThan(0);
    // Fabricated fallback values must never appear
    expect(screen.queryByText('113,663')).not.toBeInTheDocument();
    expect(screen.queryByText('2,847')).not.toBeInTheDocument();
  });

  it('shows an honest empty state on tabs without metrics', () => {
    const nation = { id: 'kelkelia', name: 'Kelkelia' };
    render(<EntityDetailModal entity={nation} type="nation" isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Economy' }));

    expect(screen.getByText('No telemetry available')).toBeInTheDocument();
  });
});
