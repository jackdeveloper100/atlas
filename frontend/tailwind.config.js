/** @type {import('tailwindcss').Config} */

/**
 * tailwind.config.js
 *
 * All design tokens sourced from DESIGN.md.
 * This file is the single source of truth for Tailwind.
 * Never hardcode a colour, font, or spacing value in component files.
 */

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // ── Spacing additions for DESIGN.md ─────────────────────────
      spacing: {
        '18': '72px',
        '28': '112px',
      },
      // ── Colour tokens (DESIGN.md Master Color System) ───────────────────
      colors: {
        ground:        '#FFFFFF', // Page background
        paper:         '#FFFFFF', // Cards, panels, inputs
        rule:          '#E5E5E5', // Dividers and subtle borders
        ink: {
          DEFAULT:     '#1B1B1B', // Text/headings
          muted:       '#6B6B6B', // Descriptions, metadata
          faint:       '#999999', // Disabled/secondary metadata
        },
        'cover-gray':   '#D9D9D9', // Library artwork preview
        'hero-gray':    '#D9D9D9', // Landing hero background
        'dark-panel':   '#383838', // Dark execution panels
        accent: {
          DEFAULT:     '#000000', // Active states, primary buttons (Black)
          hover:       '#2A2A28', // Pressed/hover state
          soft:        '#F5F5F5', // Soft fills
        },
        danger:        '#A3281C', // Destructive actions, errors
        warning:       '#8A6516', // Warnings
        success:       '#2D6A4F', // Confirmations
      },

      // ── Font families (DESIGN.md typography) ───────────────────────────
      fontFamily: {
        sans:  ['Satoshi', 'sans-serif'],        // UI, headlines, buttons, labels
        serif: ['Newsreader', 'Georgia', 'serif'], // Prose only — long-form text
        mono:  ['"IBM Plex Mono"', 'monospace'],  // Data, years, figures, IDs
      },

      // ── Font sizes with DESIGN.md scale ────────────────────────────────
      fontSize: {
        'caption': ['13px', { lineHeight: '1.4' }],
        'small':   ['14px', { lineHeight: '1.45' }],
        'data':    ['15px', { lineHeight: '1.4' }],
        'body':    ['16px', { lineHeight: '1.5' }],
        'body-long': ['18px', { lineHeight: '1.7' }],
        'subhead': ['20px', { lineHeight: '1.3' }],
        'heading': ['28px', { lineHeight: '1.2' }],
        'title':   ['40px', { lineHeight: '1.1' }],
        'display': ['64px', { lineHeight: '1.02' }],
        'year':    ['80px', { lineHeight: '1.0' }],
        // Mobile overrides applied via responsive prefix (see globals.css)
      },

      // ── Font weights ────────────────────────────────────────────────────
      fontWeight: {
        normal:    '400',
        medium:    '500',
        semibold:  '600',
        bold:      '700',
      },

      // ── Letter spacing (DESIGN.md: display/title use -0.02em) ──────────
      letterSpacing: {
        tight:   '-0.02em',  // display, title
        normal:  '0em',
        eyebrow: '0.08em',   // caption-size eyebrow labels only
      },

      // ── Border radius (DESIGN.md shape rules) ──────────────────────────
      borderRadius: {
        'none':  '0px',
        'card':  '12px',     // Cards, panels, inputs, search
        'full':  '9999px',   // Buttons, chips, badges
      },

      // ── Box shadow (DESIGN.md: no shadows except floating elements) ─────
      boxShadow: {
        'none':    'none',
        'float':   '0 4px 16px rgba(17,17,16,0.08)', // Dropdowns, modals only
      },

      // ── Max widths ──────────────────────────────────────────────────────
      maxWidth: {
        'prose':   '68ch',   // DESIGN.md: max content width for prose
        'content': '1280px', // Desktop content container
      },

      // ── Transitions (DESIGN.md: 150ms hover, 200ms entrance) ───────────
      transitionDuration: {
        'hover':   '150ms',
        'enter':   '200ms',
      },
    },
  },
  plugins: [],
}
