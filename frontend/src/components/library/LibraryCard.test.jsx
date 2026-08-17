import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LibraryCard from './LibraryCard';

describe('LibraryCard', () => {
  it('renders audio track metadata and AUDIO RECORD tag correctly', () => {
    const audioItem = {
      id: 'test-audio-1',
      title: 'The Great Awakening',
      description: 'Historical audio narrative',
      duration_seconds: 180,
      item_type: 'audio',
      metadata: {
        category: 'Political',
        subtitle: 'Year 100',
      },
    };

    render(
      <MemoryRouter>
        <LibraryCard item={audioItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('The Great Awakening')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
    expect(screen.getByText('AUDIO RECORD')).toBeInTheDocument();
    expect(screen.getByText('Historical audio narrative')).toBeInTheDocument();
    expect(screen.queryByText('VIDEO RECORD')).not.toBeInTheDocument();
  });
});
