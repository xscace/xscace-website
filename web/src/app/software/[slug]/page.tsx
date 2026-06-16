import { createClient } from '@sanity/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const client = createClient({
  projectId: '7r0kq57d',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

function sanityImgUrl(ref: string, w = 1200) {
  if (!ref) return ''
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${hash}-${dims}.${ext}?w=${w}&auto=format&q=85`
}

export async function generateStaticParams() {
  const apps = await client.fetch(`*[_type=="software"]{slug}`)
  return apps.map((a: any) => ({ slug: a.slug?.current }))
}

export async function generateMetadata({ params }: { params: Promise<{slug: string}> }): Promise<Metadata> {
  const { slug } = await params
  const app = await client.fetch(
    `*[_type=="software"&&slug.current==$slug][0]{seoTitle,seoDescription,name}`,
    { slug }
  )
  if (!app) return { title: 'Software — XSCACE' }
  return {
    title: app.seoTitle || `${app.name} — XSCACE`,
    description: app.seoDescription || '',
  }
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 20h.01M8.5 16.5a5 5 0 017 0M5 13a9 9 0 0114 0M1.5 9.5a13.5 13.5 0 0121 0"/>
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>
    </svg>
  ),
  eq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  stream: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2.5 17a24.12 24.12 0 010-10"/>
      <path d="M5.5 14a18.09 18.09 0 010-4"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M18.5 10a18.09 18.09 0 010 4"/>
      <path d="M21.5 7a24.12 24.12 0 010 10"/>
    </svg>
  ),
  channel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  preset: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  timer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/><line x1="9" y1="2" x2="15" y2="2"/>
    </svg>
  ),
  graph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  desktop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
}

export default async function SoftwarePage({ params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  const app = await client.fetch(`*[_type=="software"&&slug.current==$slug][0]{
    _id, name, slug, tagline, shortDescription, platform, status, version, latestReleaseDate,
    appStoreUrl, playStoreUrl, downloadUrlMac, downloadUrlWindows,
    heroImage, deviceMockup, screenshots, features,
    "compatibleProducts": compatibleProducts[]->{productName, slug, category->{slug}}
  }`, { slug })

  if (!app) notFound()

  const heroRef = app.heroImage?.asset?._ref
  const heroUrl = heroRef ? sanityImgUrl(heroRef, 1600) : ''
  const isMobile = app.platform?.includes('ios') || app.platform?.includes('android')
  const isComingSoon = app.status === 'coming-soon'

  return (
    <div className="sdp-page">
      {/* Hero */}
      <section className="sdp-hero" style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : {}}>
        <div className="sdp-hero-overlay" />
        <div className="sdp-hero-content">
          <div className="sdp-eyebrow">
            {isMobile ? 'iOS & Android' : 'macOS & Windows'}
            {app.version && <span className="sdp-ver">v{app.version}</span>}
          </div>
          <h1 className="sdp-name">{app.name}</h1>
          <p className="sdp-tagline">{app.tagline}</p>

          {/* Download / store CTAs */}
          {!isComingSoon && (
            <div className="sdp-ctas">
              {app.appStoreUrl && (
                <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp-store-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp-store-icon"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </a>
              )}
              {app.playStoreUrl && (
                <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" className="sdp-store-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp-store-icon"><path d="M3.18 23.76c.35.2.74.24 1.12.12L14.31 12 3.3.12C2.92 0 2.53.04 2.18.24c-.7.4-1.18 1.16-1.18 2v19.52c0 .84.48 1.6 1.18 2zm4.37-11.9l2.27-2.27 7.63 4.41-9.9-2.14zM19.44 10c-.55-.32-9.82-5.67-9.82-5.67L5.87 8.07 18.5 12l.94-.54zM5.87 15.93l3.75 3.74s9.27-5.36 9.82-5.68l-.94-.54-12.63 2.48z"/></svg>
                  Google Play
                </a>
              )}
              {app.downloadUrlMac && (
                <a href={app.downloadUrlMac} className="sdp-store-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp-store-icon"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  Download for Mac
                </a>
              )}
              {app.downloadUrlWindows && (
                <a href={app.downloadUrlWindows} className="sdp-store-btn sdp-store-btn--sec">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sdp-store-icon"><path d="M3 3h8v8H3zm10 0h8v8h-8zm-10 10h8v8H3zm10 0h8v8h-8z"/></svg>
                  Download for Windows
                </a>
              )}
            </div>
          )}
          {isComingSoon && (
            <div className="sdp-soon-badge">Coming Soon</div>
          )}
        </div>
      </section>

      {/* Description */}
      <section className="sdp-about">
        <div className="sdp-about-inner">
          <p className="sdp-desc">{app.shortDescription}</p>
        </div>
      </section>

      <div className="sdp-rule" />

      {/* Features grid */}
      {app.features && app.features.length > 0 && (
        <section className="sdp-features">
          <div className="sdp-section-label">Features</div>
          <div className="sdp-features-grid">
            {app.features.map((f: any, i: number) => (
              <div key={i} className="sdp-feature">
                <div className="sdp-feature-icon">
                  {FEATURE_ICONS[f.icon] || FEATURE_ICONS.wifi}
                </div>
                <div className="sdp-feature-title">{f.title}</div>
                <div className="sdp-feature-desc">{f.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="sdp-rule" />

      {/* Screenshots */}
      {app.screenshots && app.screenshots.length > 0 && (
        <section className="sdp-screenshots">
          <div className="sdp-section-label">Screenshots</div>
          <div className="sdp-screenshots-row">
            {app.screenshots.map((s: any, i: number) => {
              const ref = s.image?.asset?._ref
              if (!ref) return null
              return (
                <div key={i} className="sdp-screenshot">
                  <img src={sanityImgUrl(ref, 600)} alt={s.caption || `Screenshot ${i+1}`} />
                  {s.caption && <div className="sdp-screenshot-cap">{s.caption}</div>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Compatible products */}
      {app.compatibleProducts && app.compatibleProducts.length > 0 && (
        <>
          <div className="sdp-rule" />
          <section className="sdp-compat">
            <div className="sdp-section-label">Compatible Products</div>
            <div className="sdp-compat-list">
              {app.compatibleProducts.map((p: any) => (
                <a
                  key={p._id}
                  href={`/products/${p.category?.slug?.current}/${p.slug?.current}`}
                  className="sdp-compat-item"
                >
                  {p.productName}
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Bottom CTA */}
      <section className="sdp-bottom">
        {!isComingSoon && (
          <div className="sdp-bottom-ctas">
            {app.appStoreUrl && <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="btn-prim" style={{color:'#000'}}>Download on App Store</a>}
            {app.playStoreUrl && <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" className="btn-prim" style={{color:'#000'}}>Get it on Google Play</a>}
            {app.downloadUrlMac && <a href={app.downloadUrlMac} className="btn-prim" style={{color:'#000'}}>Download for Mac</a>}
            {app.downloadUrlWindows && <a href={app.downloadUrlWindows} className="btn-sec">Download for Windows</a>}
          </div>
        )}
        {isComingSoon && (
          <div className="sdp-soon-note">This software is currently in development. Check back soon.</div>
        )}
      </section>
    </div>
  )
}
