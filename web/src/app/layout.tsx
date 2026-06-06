import type { Metadata } from 'next'
import './globals.css'
import ClientScripts from './ClientScripts'

export const metadata: Metadata = {
  title: 'XSCACE — Size Defying Sound',
  description: 'XSCACE architectural speakers and amplifiers. Slim array, in-ceiling, in-wall, outdoor. Discreet, in one with the design, and engineered for performance. Size Defying Sound.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <ClientScripts />
      </body>
    </html>
  )
}
