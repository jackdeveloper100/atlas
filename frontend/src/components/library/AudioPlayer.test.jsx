import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AudioPlayer from './AudioPlayer';

describe('AudioPlayer', () => {
  it('renders audio player controls with play button and progress slider', () => {
    render(<AudioPlayer src="https://example.com/audio.mp3" initialPositionSeconds={15} />);

    // Play/Pause button aria-label
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();

    // Seek range slider
    const seekInput = screen.getByRole('slider', { name: /seek/i });
    expect(seekInput).toBeInTheDocument();
  });
});
