import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NationsTable from './NationsTable';

const nations = [
  { id: 'kelkelia', name: 'Kelkelia', population: 500000, governmentType: 'Monarchy', headOfStateId: 'leader-1' },
  { id: 'corondel', name: 'Corondel', population: 450000, governmentType: null, headOfStateId: null },
];

const leaders = [{ id: 'leader-1', name: 'Queen of Kelkelia', nationId: 'kelkelia', title: 'Monarch' }];

describe('NationsTable', () => {
  it('renders nation fields and handles unrecorded government type cleanly', () => {
    render(<NationsTable nations={nations} leaders={leaders} />);

    expect(screen.getByText('Monarchy')).toBeInTheDocument();
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
  });

  it('shows an empty state when there are no nations', () => {
    render(<NationsTable nations={[]} leaders={[]} />);
    expect(screen.getByText('No nations registered')).toBeInTheDocument();
  });
});
