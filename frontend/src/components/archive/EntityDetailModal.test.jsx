import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntityDetailModal from './EntityDetailModal';

describe('EntityDetailModal', () => {
  it('shows real nation fields and no fabricated GDP/military/culture data', () => {
    const nation = {
      id: 'kelkelia',
      name: 'Kelkelia',
      population: 500000,
      foundedYear: -100,
      politicalState: { governmentType: 'Monarchy', stability: 0.58, centralizedPower: 0.78 },
      currentLeader: { name: 'Queen of Kelkelia', title: 'Monarch' },
    };

    render(<EntityDetailModal entity={nation} type="nation" isOpen onClose={() => {}} />);

    expect(screen.getAllByText('Kelkelia').length).toBeGreaterThan(0);
    expect(screen.getByText('500,000')).toBeInTheDocument();
    expect(screen.getByText('58%')).toBeInTheDocument();
    // Old hardcoded fake values must never appear
    expect(screen.queryByText('113,663')).not.toBeInTheDocument();
    expect(screen.queryByText('2,847')).not.toBeInTheDocument();
    expect(screen.queryByText('Culture Composition')).not.toBeInTheDocument();
  });

  it('shows an honest "not tracked" state on the Economy tab instead of fake placeholder prose', () => {
    const nation = { id: 'kelkelia', name: 'Kelkelia', population: 500000 };
    render(<EntityDetailModal entity={nation} type="nation" isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Economy' }));

    expect(screen.getByText('Economy not tracked')).toBeInTheDocument();
    expect(
      screen.queryByText((text) => text.includes('Detailed ECONOMY snapshot records active'))
    ).not.toBeInTheDocument();
  });

  it('shows a not-tracked-at-this-level note on the Political tab for a region entity', () => {
    const region = { id: 'kelkelia-capital', name: 'Kelkelia Capital', population: 300000, urbanization: 0.7 };
    render(<EntityDetailModal entity={region} type="region" isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Political' }));

    expect(screen.getByText('Not tracked at this level')).toBeInTheDocument();
  });
});
