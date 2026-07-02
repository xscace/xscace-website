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
        <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" rel="stylesheet"/>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#090909" />
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

        {/* Navigation — Software replaces the dead /journal link */}
        <nav className="nav" id="nav">
  <a href="/" className="logo">XSCACE</a>
  <div className="nav-links">
    <a href="/products" className="nav-l">Products</a>
    <a href="https://configurator.xscace.com" className="nav-l">System Builder</a>
    <a href="/software" className="nav-l">Software</a>
    <a href="/distributors" className="nav-l">Find Us</a>
    <a href="/about" className="nav-l">About</a>
  </div>
  <a href="/distributors" className="nav-cta">Find Us</a>
</nav>

        {/* Page content */}
        <main>{children}</main>

        {/* Footer — all links verified, dead routes removed, labels corrected */}
        <footer>
  <div>
    <div className="f-logo">XSCACE</div>
    <div className="f-tag">Architectural speakers and amplifiers engineered for spaces where being discreet and in one with the design is equally as important as performance.</div>
    <div className="f-legal">© 2026 XSCACE Inc. All rights reserved.</div>
  </div>
  <div>
    <div className="f-h">Products</div>
    <a href="/products/slim-array-series" className="f-l">Slim Array</a>
    <a href="/products/in-ceiling-series" className="f-l">In-Ceiling</a>
    <a href="/products/in-wall-series" className="f-l">In-Wall</a>
    <a href="/products/outdoor-series" className="f-l">Outdoor</a>
    <a href="/products/subwoofer-series" className="f-l">Subwoofers</a>
    <a href="/products/amplifier-series" className="f-l">Amplifiers</a>
  </div>
  <div>
    <div className="f-h">Software</div>
    <a href="/software/xscace-controller" className="f-l">XSCACE Controller</a>
    <a href="/software/network-controller" className="f-l">Network Controller</a>
    <a href="https://configurator.xscace.com" className="f-l">System Builder</a>
  </div>
  <div>
    <div className="f-h">Company</div>
    <a href="/about" className="f-l">About XSCACE</a>
    <a href="/distributors" className="f-l">Find a Distributor</a>
    <a href="/distributors" className="f-l">Become a Distributor</a>
    <a href="mailto:support@xscace.com" className="f-l">support@xscace.com</a>
  </div>
</footer>
        <div className="f-bot"><span>XSCACE · Size Defying Sound</span><span>© 2026 XSCACE Inc.</span></div>

        {/* All global JS - cursor, audio, nav scroll, reveal */}
        <ClientScripts />
      </body>
    </html>
  )
}
