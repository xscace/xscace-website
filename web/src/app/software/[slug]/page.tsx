import { createClient } from '@sanity/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const sanity = createClient({
  projectId: '7r0kq57d', dataset: 'production',
  apiVersion: '2024-01-01', useCdn: true,
})

const P = '7r0kq57d', D = 'production'

function img(ref: string, w = 1200) {
  if (!ref) return ''
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${P}/${D}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=90`
}

export async function generateStaticParams() {
  const apps = await sanity.fetch(`*[_type=="software"]{slug}`)
  return apps.map((a: any) => ({ slug: a.slug?.current }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = await sanity.fetch(`*[_type=="software"&&slug.current==$slug][0]{seoTitle,seoDescription,name}`, { slug })
  if (!a) return { title: 'Software — XSCACE' }
  return { title: a.seoTitle || `${a.name} — XSCACE`, description: a.seoDescription || '' }
}

// Crisp icon SVGs
const ICONS: Record<string, string> = {
  wifi:    `<path d="M12 20h.01M8.5 16.5a5 5 0 017 0M5 13a9 9 0 0114 0M1.5 9.5a13.5 13.5 0 0121 0"/>`,
  volume:  `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>`,
  eq:      `<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>`,
  stream:  `<path d="M2.5 17a24.12 24.12 0 010-10M5.5 14a18 18 0 010-4"/><circle cx="12" cy="12" r="2"/><path d="M18.5 10a18 18 0 010 4M21.5 7a24.12 24.12 0 010 10"/>`,
  channel: `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
  preset:  `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
  timer:   `<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><line x1="9" y1="2" x2="15" y2="2"/>`,
  graph:   `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
  desktop: `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
}
function svgIcon(name: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||ICONS.wifi}</svg>`
}

// Map screenshot captions to feature indices for mobile app
const MOBILE_FEATURE_SHOTS: Record<number, string[]> = {
  0: ['Device List', 'Device Discovery'],          // Setup
  1: ['Device List'],                               // Volume & Balance
  2: ['X-Sense Auto EQ', 'X-Sense Auto EQ'],        // X-Sense AI
  3: ['Device List'],                               // AirPlay
  4: ['Rename Device'],                             // Channel Select
  5: ['Parametric EQ', 'Tonal EQ'],                 // EQ & Presets
}

// Map screenshot captions to feature indices for desktop app
const DESKTOP_FEATURE_SHOTS: Record<number, string[]> = {
  0: ['EQ Peaking, HS, LS Filters', 'Gain, Delay, Crossover Filters'],  // Live DSP
  1: ['Preset List'],                                                    // Factory Presets
  2: ['Auto Delay'],                                                     // Auto Delay
  3: ['Gain, Delay, Crossover Filters'],                                 // Channel Routing
  4: ['Frequency Overview'],                                             // Freq Graph
  5: ['Dashboard Overview'],                                             // Mac & Windows
}

export default async function SoftwareDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const app = await sanity.fetch(`*[_type=="software"&&slug.current==$slug][0]{
    _id, name, slug, tagline, shortDescription, platform, status, version,
    appStoreUrl, playStoreUrl, downloadUrlMac, downloadUrlWindows,
    heroImage, screenshots[]{caption,"ref":image.asset._ref}, features,
    "compatibleProducts":compatibleProducts[]->{productName,slug,category->{slug}}
  }`, { slug })

  if (!app) notFound()

  const isMobile  = app.platform?.includes('ios') || app.platform?.includes('android')
  const isDesktop = app.platform?.includes('mac') || app.platform?.includes('windows')
  const isSoon    = app.status === 'coming-soon'

  // Index screenshots by caption for easy lookup
  const shotByCaption: Record<string, string> = {}
  for (const s of (app.screenshots || [])) {
    if (s.caption && s.ref) shotByCaption[s.caption] = s.ref
  }

  // Hero screenshots: pick 2 best for mobile, 1 wide for desktop
  const heroShots = isMobile
    ? ['Device List', 'X-Sense Auto EQ']
        .map(c => shotByCaption[c]).filter(Boolean).slice(0, 2)
    : ['Dashboard Overview', 'Device Discovery List']
        .map(c => shotByCaption[c]).filter(Boolean).slice(0, 1)

  // Feature-to-screenshot mapping
  const featureShots = isMobile ? MOBILE_FEATURE_SHOTS : DESKTOP_FEATURE_SHOTS

  return (
    <div className="sdp2">

      {/* ══════════════════════════════════════════════════════
          HERO — split: text left, phone/laptop mockups right
      ══════════════════════════════════════════════════════ */}
      <section className="sdp2-hero">
        {/* Left: text + CTAs */}
        <div className="sdp2-hero-left">
          <div className="sdp2-eyebrow">
            {isMobile ? 'iOS & Android' : 'macOS & Windows'}
            {app.version && <span className="sdp2-ver">v{app.version}</span>}
          </div>
          <h1 className="sdp2-title">{app.name}</h1>
          <p className="sdp2-tagline">{app.tagline}</p>
          <p className="sdp2-desc">{app.shortDescription}</p>

          {!isSoon ? (
            <div className="sdp2-ctas">
              {app.appStoreUrl && (
                <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp2-store-btn">
                  {/* Apple logo */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span>
                    <span className="sdp2-store-sub">Download on the</span>
                    <span className="sdp2-store-name">App Store</span>
                  </span>
                </a>
              )}
              {app.playStoreUrl && (
                <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp2-store-btn">
                  {/* Google Play logo */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo">
                    <path d="M3.18 23.76c.35.2.74.24 1.12.12L14.31 12 3.3.12C2.92 0 2.53.04 2.18.24c-.7.4-1.18 1.16-1.18 2v19.52c0 .84.48 1.6 1.18 2zm4.37-11.9l2.27-2.27 7.63 4.41-9.9-2.14zM19.44 10c-.55-.32-9.82-5.67-9.82-5.67L5.87 8.07 18.5 12l.94-.54zM5.87 15.93l3.75 3.74s9.27-5.36 9.82-5.68l-.94-.54-12.63 2.48z"/>
                  </svg>
                  <span>
                    <span className="sdp2-store-sub">Get it on</span>
                    <span className="sdp2-store-name">Google Play</span>
                  </span>
                </a>
              )}
              {app.downloadUrlMac && (
                <a href={app.downloadUrlMac} className="sdp2-store-btn">
                  {/* Apple logo */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span>
                    <span className="sdp2-store-sub">Download for</span>
                    <span className="sdp2-store-name">macOS</span>
                  </span>
                </a>
              )}
              {app.downloadUrlWindows && (
                <a href={app.downloadUrlWindows} className="sdp2-store-btn sdp2-store-btn--ghost">
                  {/* Windows logo */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo">
                    <path d="M3 3h8v8H3zm10 0h8v8h-8zm-10 10h8v8H3zm10 0h8v8h-8z"/>
                  </svg>
                  <span>
                    <span className="sdp2-store-sub">Download for</span>
                    <span className="sdp2-store-name">Windows</span>
                  </span>
                </a>
              )}
            </div>
          ) : (
            <div className="sdp2-soon">Coming Soon</div>
          )}
        </div>

        {/* Right: phone or laptop mockups */}
        <div className="sdp2-hero-right">
          {isMobile && heroShots.length > 0 && (
            <div className="sdp2-phones">
              {heroShots.map((ref, i) => (
                <div key={i} className={`sdp2-phone ${i === 1 ? 'sdp2-phone--back' : 'sdp2-phone--front'}`}>
                  <div className="sdp2-phone-frame">
                    <div className="sdp2-phone-notch" />
                    <img src={img(ref, 600)} alt="App screenshot" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {isDesktop && heroShots.length > 0 && (
            <div className="sdp2-laptop">
              <div className="sdp2-laptop-screen">
                <img src={img(heroShots[0], 1200)} alt="App screenshot" />
              </div>
              <div className="sdp2-laptop-base">
                <div className="sdp2-laptop-notch" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES — full bleed alternating, screenshot matched
      ══════════════════════════════════════════════════════ */}
      {app.features && app.features.length > 0 && (
        <section className="sdp2-features">
          <div className="sdp2-features-eyebrow">Features</div>
          {app.features.map((f: any, i: number) => {
            // Find best matching screenshot
            const captionMatches = featureShots[i] || []
            let shotRef = ''
            for (const cap of captionMatches) {
              if (shotByCaption[cap]) { shotRef = shotByCaption[cap]; break }
            }
            const shotUrl = shotRef ? img(shotRef, 900) : ''
            const isEven = i % 2 === 0

            return (
              <div key={i} className={`sdp2-feat ${isEven ? 'sdp2-feat--a' : 'sdp2-feat--b'}`}>
                {/* Text */}
                <div className="sdp2-feat-text">
                  <div className="sdp2-feat-n">0{i + 1}</div>
                  <div className="sdp2-feat-icon" dangerouslySetInnerHTML={{ __html: svgIcon(f.icon) }} />
                  <h3 className="sdp2-feat-title">{f.title}</h3>
                  <p className="sdp2-feat-desc">{f.description}</p>
                </div>
                {/* Screenshot */}
                <div className="sdp2-feat-visual">
                  {shotUrl ? (
                    isMobile ? (
                      <div className="sdp2-phone-frame sdp2-phone-frame--feat">
                        <div className="sdp2-phone-notch" />
                        <img src={shotUrl} alt={f.title} />
                      </div>
                    ) : (
                      <div className="sdp2-win-frame">
                        <div className="sdp2-win-bar">
                          <span/><span/><span/>
                        </div>
                        <img src={shotUrl} alt={f.title} />
                      </div>
                    )
                  ) : (
                    <div className="sdp2-feat-placeholder">
                      <div className="sdp2-feat-placeholder-icon" dangerouslySetInnerHTML={{ __html: svgIcon(f.icon) }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          WORKS WITH
      ══════════════════════════════════════════════════════ */}
      {app.compatibleProducts && app.compatibleProducts.length > 0 && (
        <section className="sdp2-compat">
          <div className="sdp2-compat-label">Works with</div>
          <div className="sdp2-compat-chips">
            {app.compatibleProducts.map((p: any, i: number) => (
              <a key={i} href={`/products/${p.category?.slug?.current}/${p.slug?.current}`} className="sdp2-chip">
                {p.productName}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════════ */}
      {!isSoon && (
        <section className="sdp2-bottom">
          <div className="sdp2-bottom-name">{app.name}</div>
          <div className="sdp2-bottom-platform">{isMobile ? 'iOS & Android' : 'macOS & Windows'} · Free</div>
          <div className="sdp2-bottom-btns">
            {app.appStoreUrl    && <a href={app.appStoreUrl}    target="_blank" rel="noopener noreferrer" className="sdp2-store-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <span><span className="sdp2-store-sub">App Store</span><span className="sdp2-store-name">iOS</span></span>
            </a>}
            {app.playStoreUrl   && <a href={app.playStoreUrl}   target="_blank" rel="noopener noreferrer" className="sdp2-store-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo"><path d="M3.18 23.76c.35.2.74.24 1.12.12L14.31 12 3.3.12C2.92 0 2.53.04 2.18.24c-.7.4-1.18 1.16-1.18 2v19.52c0 .84.48 1.6 1.18 2zm4.37-11.9l2.27-2.27 7.63 4.41-9.9-2.14zM19.44 10c-.55-.32-9.82-5.67-9.82-5.67L5.87 8.07 18.5 12l.94-.54zM5.87 15.93l3.75 3.74s9.27-5.36 9.82-5.68l-.94-.54-12.63 2.48z"/></svg>
              <span><span className="sdp2-store-sub">Google Play</span><span className="sdp2-store-name">Android</span></span>
            </a>}
            {app.downloadUrlMac && <a href={app.downloadUrlMac}  className="sdp2-store-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <span><span className="sdp2-store-sub">Download for</span><span className="sdp2-store-name">macOS</span></span>
            </a>}
            {app.downloadUrlWindows && <a href={app.downloadUrlWindows} className="sdp2-store-btn sdp2-store-btn--ghost">
              <svg viewBox="0 0 24 24" fill="currentColor" className="sdp2-store-logo"><path d="M3 3h8v8H3zm10 0h8v8h-8zm-10 10h8v8H3zm10 0h8v8h-8z"/></svg>
              <span><span className="sdp2-store-sub">Download for</span><span className="sdp2-store-name">Windows</span></span>
            </a>}
          </div>
        </section>
      )}

    </div>
  )
}
