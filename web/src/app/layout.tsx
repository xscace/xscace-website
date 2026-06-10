import type { Metadata } from 'next'
import './globals.css'
import ClientScripts from './ClientScripts'

export const metadata: Metadata = {
  title: 'XSCACE — Size Defying Sound',
  description: 'XSCACE architectural speakers and amplifiers. Slim array, in-ceiling, in-wall, outdoor. Size Defying Sound.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        {/* Scroll wave - fixed right edge */}
        <canvas id="scroll-wave" style={{position: "fixed", right: "0", top: "0", width: "14px", height: "100vh", zIndex: "50", pointerEvents: "none", opacity: "0", transition: "opacity 1s"}} aria-hidden="true"></canvas>

        {/* Custom cursor */}
        <div id="cursor">
  <svg id="c-waves" width="160" height="160" viewBox="0 0 160 160" fill="none" style={{position: "absolute", overflow: "visible"}}>
    <path id="wp1" fill="none"/><path id="wp2" fill="none"/><path id="wp3" fill="none"/>
  </svg>
  <div id="c-ring"></div>
  <div id="c-dot"></div>
</div>

        {/* Ambient audio toggle */}
        <div className="audio-btn" id="audioBtn" title="Toggle ambient sound">
  <canvas id="audio-canvas" width="56" height="36"></canvas>
</div>

        {/* Navigation */}
        <nav className="nav" id="nav">
  <a href="/" className="logo">XSCACE</a>
  <div className="nav-links">
    <a href="/products" className="nav-l">Products</a>
    <a href="https://configurator.xscace.com" className="nav-l">System Builder</a>
    <a href="/journal" className="nav-l">Journal</a>
    <a href="/distributors" className="nav-l">Find Us</a>
    <a href="/about" className="nav-l">About</a>
  </div>
  <a href="/distributors" className="nav-cta">Find Us</a>
</nav>

        {/* Page content */}
        <main>{children}</main>

        {/* Footer */}
        <footer>
  <div><div className="f-logo">XSCACE</div><div className="f-tag">Architectural speakers and amplifiers engineered for spaces where being discreet and in one with the design is equally as important as performance.</div><div className="f-legal">© 2026 XSCACE Inc. All rights reserved.</div></div>
  <div><div className="f-h">Products</div><a href="/products/slim-array-series" className="f-l">Slim Array</a><a href="/products/in-ceiling-series" className="f-l">In-Ceiling</a><a href="/products/in-wall-series" className="f-l">In-Wall</a><a href="/products/outdoor-series" className="f-l">Outdoor</a><a href="/products/subwoofer-series" className="f-l">Subwoofers</a><a href="/products/amplifier-series" className="f-l">Amplifiers</a></div>
  <div><div className="f-h">Explore</div><a href="https://configurator.xscace.com" className="f-l">System Builder</a><a href="/technology" className="f-l">Technology</a><a href="/configurator" className="f-l">Resources</a><a href="/journal" className="f-l">Journal</a><a href="/distributors" className="f-l">About XSCACE</a></div>
  <div><div className="f-h">Contact</div><a href="/distributors" className="f-l">Find Us</a><a href="/about" className="f-l">Become a Distributor</a><a href="mailto:support@xscace.com" className="f-l">support@xscace.com</a><a href="https://wa.me/+15878853303" className="f-l">WhatsApp</a></div>
</footer>
        <div className="f-bot"><span>XSCACE · Size Defying Sound</span><span>Privacy · Terms · Distributor Login</span></div>

        {/* All global JS - cursor, audio, nav scroll, reveal */}
        <ClientScripts />
      </body>
    </html>
  )
}
