import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#141210',
        parchment: '#f6f1e7',
        marigold: '#e08a1e',
        henna: '#9c3d1e',
        indigo: '#2d3a6b',
        night: '#1b2340',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        hindi: ['var(--font-hindi)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
