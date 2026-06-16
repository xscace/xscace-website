import { createClient } from '@sanity/client'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Software — XSCACE',
  description: 'XSCACE software apps: XSCACE Controller for iOS & Android, and XSCACE Network Controller for Mac & Windows DSP configuration.',
}

const client = createClient({
  projectId: '7r0kq57d',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

function sanityImgUrl(ref: string, w = 800) {
  if (!ref) return ''
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${hash}-${dims}.${ext}?w=${w}&auto=format&q=85`
}

export default async function SoftwarePage() {
  const apps = await client.fetch(`*[_type=="software"] | order(name asc) {
    _id, name, slug, tagline, shortDescription, platform, status, version,
    heroImage, deviceMockup, features[0..2]
  }`)

  const platformLabel = (p: string) => {
    const map: Record<string, string> = {
      'ios': 'iOS',
      'android': 'Android',
      'ios-android': 'iOS & Android',
      'mac': 'macOS',
      'windows': 'Windows',
      'mac-windows': 'macOS & Windows',
    }
    return map[p] || p
  }

  const platformIcon = (p: string) => {
    if (p === 'ios-android') return (
      <span className="sw-platforms">
        <span className="sw-pill">iOS</span>
        <span className="sw-pill">Android</span>
      </span>
    )
    if (p === 'mac-windows') return (
      <span className="sw-platforms">
        <span className="sw-pill">macOS</span>
        <span className="sw-pill">Windows</span>
      </span>
    )
    return <span className="sw-platforms"><span className="sw-pill">{platformLabel(p)}</span></span>
  }

  return (
    <div className="sw-page">
      {/* Hero */}
      <section className="sw-hero">
        <div className="sw-hero-inner">
          <div className="sw-eyebrow">Software</div>
          <h1 className="sw-title">Control your sound.</h1>
          <p className="sw-subtitle">
            XSCACE software bridges the gap between your amplifier&apos;s capability and your space&apos;s potential.
            Stream, configure, calibrate — all from your device.
          </p>
        </div>
      </section>

      <div className="sw-divider" />

      {/* App cards */}
      <section className="sw-grid">
        {apps.map((app: any) => {
          const heroRef = app.heroImage?.asset?._ref
          const heroUrl = heroRef ? sanityImgUrl(heroRef, 1600) : ''
          const isMobile = app.platform?.includes('ios') || app.platform?.includes('android')

          return (
            <Link href={`/software/${app.slug?.current}`} key={app._id} className="sw-card">
              {/* Card hero */}
              <div className="sw-card-hero" style={heroUrl ? { backgroundImage: `url(${heroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                <div className="sw-card-hero-overlay" />
                <div className="sw-card-hero-top">
                  {platformIcon(app.platform)}
                  {app.status === 'coming-soon' && <span className="sw-badge-soon">Coming Soon</span>}
                </div>
                {/* App icon placeholder */}
                <div className={`sw-app-icon ${isMobile ? 'sw-app-icon--mobile' : 'sw-app-icon--desktop'}`}>
                  {isMobile ? (
                    <svg viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="2" width="24" height="36" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="20" cy="33" r="2" fill="currentColor"/>
                      <line x1="15" y1="6" x2="25" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 40 40" fill="none">
                      <rect x="2" y="6" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="12" y1="34" x2="28" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="20" y1="30" x2="20" y2="34" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Card content */}
              <div className="sw-card-body">
                <div className="sw-card-name">{app.name}</div>
                <div className="sw-card-tagline">{app.tagline}</div>
                <p className="sw-card-desc">{app.shortDescription}</p>
                {app.features && app.features.length > 0 && (
                  <ul className="sw-card-features">
                    {app.features.map((f: any, i: number) => (
                      <li key={i} className="sw-card-feature">
                        <span className="sw-feature-dot" />
                        {f.title}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="sw-card-cta">
                  <span className="sw-card-learn">Learn more →</span>
                  {app.version && <span className="sw-card-ver">v{app.version}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
