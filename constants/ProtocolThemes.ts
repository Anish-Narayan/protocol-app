export const PROTOCOL_THEMES = {
  scifi: {
    dark: true,
    colors: {
      background: '#030303',
      surface: '#0a0a0a',
      primary: '#22d3ee', // Neon Cyan
      primaryDim: 'rgba(34, 211, 238, 0.15)',
      danger: '#ef4444',  // Neon Red
      dangerDim: 'rgba(239, 68, 68, 0.15)',
      text: '#e5e5e5',
      textMuted: '#737373',
      border: '#083344',
      status: 'light-content'
    },
    roundness: 0, // Sharp corners
  },
  egypt: {
    dark: false,
    colors: {
      background: '#f0e6d2', // Papyrus
      surface: '#e6dac3',
      primary: '#b45309',    // Bronze/Gold
      primaryDim: 'rgba(180, 83, 9, 0.15)',
      danger: '#9f1239',     // Clay Red
      dangerDim: 'rgba(159, 18, 57, 0.15)',
      text: '#27272a',       // Ink
      textMuted: '#57534e',
      border: '#d6ceb8',
      status: 'dark-content'
    },
    roundness: 10, // Worn/Rounded corners
  }
};