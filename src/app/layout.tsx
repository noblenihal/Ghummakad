import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ghummakad — travel like a wanderer',
  description:
    'An AI local friend that helps you discover destinations and cultural experiences that match your vibe.',
}

export const viewport: Viewport = {
  themeColor: '#e08a1e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
