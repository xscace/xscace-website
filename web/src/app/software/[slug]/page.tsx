import { createClient } from '@sanity/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const client = createClient({
  projectId: '7r0kq57d',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

function sanityImgUrl(ref: string, w = 1600) {
  if (!ref) return ''
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${hash}-${dims}.${ext}?w=${w}&auto=format&q=90`
}

export async function generateStaticParams() {
  const apps = await client.fetch(`*[_type=="software"]{slug}`)
  return apps.map((a: any) => ({ slug: a.slug?.current }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const app = await client.fetch(`*[_type=="software"&&slug.current==$slug][0]{seoTitle,seoDescription,name}`, { slug })
  if (!app) return { title: 'Software — XSCACE' }
  return { title: app.seoTitle || `${app.name} — XSCACE`, description: app.seoDescription || '' }
}

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

function icon(name: string) {
  const d = ICONS[name] || ICONS.wifi
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
}

export default async function SoftwareDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const app = await client.fetch(`*[_type=="software"&&slug.current==$slug][0]{
    _id, name, slug, tagline, shortDescription, platform, status, version, latestReleaseDate,
    appStoreUrl, playStoreUrl, downloadUrlMac, downloadUrlWindows,
    heroImage, deviceMockup, screenshots[]{image, caption}, features,
    "compatibleProducts": compatibleProducts[]->{productName, slug, category->{slug}}
  }`, { slug })

  if (!app) notFound()

  const heroRef  = app.heroImage?.asset?._ref
  const heroUrl  = heroRef ? sanityImgUrl(heroRef, 1800) : ''
  const isMobile = app.platform?.includes('ios') || app.platform?.includes('android')
  const isDesktop = app.platform?.includes('mac') || app.platform?.includes('windows')
  const isSoon   = app.status === 'coming-soon'

  const platformLabel = isMobile ? 'iOS & Android' : 'macOS & Windows'

  return (
    <div className="sdp">

      {/* ── HERO ── */}
      <section className="sdp-hero" style={heroUrl ? { '--hero-bg': `url(${heroUrl})` } as React.CSSProperties : {}}>
        <div className="sdp-hero-bg" />
        <div className="sdp-hero-inner">
          <div className="sdp-eyebrow">
            <span>{platformLabel}</span>
            {app.version && <span className="sdp-ver">v{app.version}</span>}
          </div>
          <h1 className="sdp-title">{app.name}</h1>
          <p className="sdp-tagline">{app.tagline}</p>
          {!isSoon ? (
            <div className="sdp-ctas">
              {app.appStoreUrl && (
                <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp-btn sdp-btn--fill">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </a>
              )}
              {app.playStoreUrl && (
                <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp-btn sdp-btn--fill">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3.18 23.76c.35.2.74.24 1.12.12L14.31 12 3.3.12C2.92 0 2.53.04 2.18.24c-.7.4-1.18 1.16-1.18 2v19.52c0 .84.48 1.6 1.18 2zm4.37-11.9l2.27-2.27 7.63 4.41-9.9-2.14zM19.44 10c-.55-.32-9.82-5.67-9.82-5.67L5.87 8.07 18.5 12l.94-.54zM5.87 15.93l3.75 3.74s9.27-5.36 9.82-5.68l-.94-.54-12.63 2.48z"/></svg>
                  Google Play
                </a>
              )}
              {app.downloadUrlMac && (
                <a href={app.downloadUrlMac} className="sdp-btn sdp-btn--fill">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  Download for Mac
                </a>
              )}
              {app.downloadUrlWindows && (
                <a href={app.downloadUrlWindows} className="sdp-btn sdp-btn--ghost">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 3h8v8H3zm10 0h8v8h-8zm-10 10h8v8H3zm10 0h8v8h-8z"/></svg>
                  Download for Windows
                </a>
              )}
            </div>
          ) : (
            <div className="sdp-soon">Coming Soon</div>
          )}
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="sdp-intro">
        <p className="sdp-intro-text">{app.shortDescription}</p>
      </section>

      {/* ── FEATURES — Apple-style: each feature full-width, alternating, scroll-pinned feel ── */}
      {app.features && app.features.length > 0 && (
        <section className="sdp-features">
          <div className="sdp-features-label">Features</div>

          {app.features.map((f: any, i: number) => {
            const isEven = i % 2 === 0
            const screenshotRef = app.screenshots?.[i]?.image?.asset?._ref
            const screenshotUrl = screenshotRef ? sanityImgUrl(screenshotRef, 800) : ''
            return (
              <div key={i} className={`sdp-feature-block ${isEven ? 'sdp-feature-block--a' : 'sdp-feature-block--b'}`}>
                {/* Text side */}
                <div className="sdp-feature-text">
                  <div className="sdp-feature-num">0{i + 1}</div>
                  <div className="sdp-feature-icon" dangerouslySetInnerHTML={{ __html: icon(f.icon) }} />
                  <h3 className="sdp-feature-title">{f.title}</h3>
                  <p className="sdp-feature-desc">{f.description}</p>
                </div>
                {/* Visual side — screenshot if available, else abstract graphic */}
                <div className="sdp-feature-visual">
                  {screenshotUrl ? (
                    <div className={`sdp-feature-mockup ${isMobile ? 'sdp-feature-mockup--phone' : 'sdp-feature-mockup--desktop'}`}>
                      <img src={screenshotUrl} alt={f.title} />
                    </div>
                  ) : (
                    <div className="sdp-feature-abstract">
                      <div className="sdp-feature-abstract-icon" dangerouslySetInnerHTML={{ __html: icon(f.icon) }} />
                      <div className="sdp-feature-abstract-name">{f.title}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ── SCREENSHOTS STRIP ── */}
      {app.screenshots && app.screenshots.length > 0 && (
        <section className="sdp-shots">
          <div className="sdp-shots-label">Screenshots</div>
          <div className="sdp-shots-row">
            {app.screenshots.map((s: any, i: number) => {
              const ref = s.image?.asset?._ref
              if (!ref) return null
              return (
                <div key={i} className={`sdp-shot ${isMobile ? 'sdp-shot--phone' : 'sdp-shot--desktop'}`}>
                  <img src={sanityImgUrl(ref, 700)} alt={s.caption || `Screenshot ${i + 1}`} />
                  {s.caption && <div className="sdp-shot-cap">{s.caption}</div>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── COMPATIBLE PRODUCTS ── */}
      {app.compatibleProducts && app.compatibleProducts.length > 0 && (
        <section className="sdp-compat">
          <div className="sdp-compat-label">Works with</div>
          <div className="sdp-compat-list">
            {app.compatibleProducts.map((p: any, i: number) => (
              <a
                key={i}
                href={`/products/${p.category?.slug?.current}/${p.slug?.current}`}
                className="sdp-compat-chip"
              >
                {p.productName}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── BOTTOM CTA ── */}
      {!isSoon && (
        <section className="sdp-bottom-cta">
          <div className="sdp-bottom-inner">
            <div className="sdp-bottom-title">{app.name}</div>
            <div className="sdp-bottom-sub">{platformLabel} · Free</div>
            <div className="sdp-bottom-btns">
              {app.appStoreUrl && <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp-btn sdp-btn--fill">App Store</a>}
              {app.playStoreUrl && <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp-btn sdp-btn--fill">Google Play</a>}
              {app.downloadUrlMac && <a href={app.downloadUrlMac} className="sdp-btn sdp-btn--fill">Download Mac</a>}
              {app.downloadUrlWindows && <a href={app.downloadUrlWindows} className="sdp-btn sdp-btn--ghost">Download Windows</a>}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
