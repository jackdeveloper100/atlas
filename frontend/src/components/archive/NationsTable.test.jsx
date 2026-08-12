import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NationsTable from './NationsTable';

const nations = [
  { id: 'kelkelia', name: 'Kelkelia', population: 500000, currentLeaderId: 'leader-1' },
  { id: 'corondel', name: 'Corondel', population: 450000, currentLeaderId: null },
];

const leaders = [{ id: 'leader-1', name: 'Queen of Kelkelia', nationId: 'kelkelia', title: 'Monarch' }];

describe('NationsTable', () => {
  it('reads governmentType from the politicalStates index, not the nation object', () => {
    const politicalStates = [{ nationId: 'kelkelia', governmentType: 'Monarchy' }];

    render(<NationsTable nations={nations} leaders={leaders} politicalStates={politicalStates} />);

    expect(screen.getByText('Monarchy')).toBeInTheDocument();
    // Corondel has no matching politicalState entry — must show an honest fallback, not a fabricated one
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(screen.queryByText('Sovereignty')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no nations', () => {
    render(<NationsTable nations={[]} leaders={[]} politicalStates={[]} />);
    expect(screen.getByText('No nations registered')).toBeInTheDocument();
  });
});
