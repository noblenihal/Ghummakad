import type { Metadata, Viewport } from 'next'
import { Fraunces, Karla, IBM_Plex_Mono, Tiro_Devanagari_Hindi } from 'next/font/google'
import './globals.css'

// Self-hosted at build time by next/font — no runtime font CDN.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
})
const karla = Karla({ subsets: ['latin'], variable: '--font-body' })
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})
const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ['devanagari'],
  weight: '400',
  variable: '--font-hindi',
})

export const metadata: Metadata = {
  title: 'Ghummakad — Travel & Explore',
  description:
    'An AI local friend that helps you discover destinations and cultural experiences that match your vibe.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#2d5a6b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${karla.variable} ${plexMono.variable} ${tiroDevanagari.variable}`}
    >
      <body className="min-h-screen font-body antialiased">{children}</body>
    </html>
  )
}
