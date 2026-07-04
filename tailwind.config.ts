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
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
