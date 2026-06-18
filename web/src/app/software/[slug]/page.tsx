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
              {/* Card hero — custom per app */}
              <div className="sw-card-hero" style={{background:'#000'}}>
                <div className="sw-card-hero-overlay" />
                <div className="sw-card-hero-top">
                  {platformIcon(app.platform)}
                  {app.status === 'coming-soon' && <span className="sw-badge-soon">Coming Soon</span>}
                </div>

                {/* XSCACE Controller — 3-phone stack */}
                {app._id === 'software-xscace-controller' && (
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {/* Back-left — Discovery */}
                    <div style={{position:'absolute',left:'14%',top:'16px',width:'80px',height:'164px',border:'1.5px solid #222',borderRadius:'12px',background:'#080808',overflow:'hidden',boxShadow:'0 0 0 1px #111, 0 8px 24px rgba(0,0,0,0.9)',opacity:0.6,transform:'translateX(-10px)',zIndex:1}}>
                      <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'22px',height:'2.5px',background:'#1a1a1a',borderRadius:'0 0 3px 3px'}}/>
                      <img src="https://cdn.sanity.io/images/7r0kq57d/production/81c82048f3755163cc091f6640619112d9138e7c-368x800.png?w=400&auto=format&q=85" alt="Discovery" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
                    </div>
                    {/* Back-right — EQ */}
                    <div style={{position:'absolute',right:'14%',top:'16px',width:'80px',height:'164px',border:'1.5px solid #222',borderRadius:'12px',background:'#080808',overflow:'hidden',boxShadow:'0 0 0 1px #111, 0 8px 24px rgba(0,0,0,0.9)',opacity:0.6,transform:'translateX(10px)',zIndex:1}}>
                      <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'22px',height:'2.5px',background:'#1a1a1a',borderRadius:'0 0 3px 3px'}}/>
                      <img src="https://cdn.sanity.io/images/7r0kq57d/production/82649b5de87330a015e6221c047fba3664b1f712-368x800.png?w=400&auto=format&q=85" alt="EQ" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
                    </div>
                    {/* Front-center — Device List */}
                    <div style={{position:'relative',width:'92px',height:'188px',border:'1.5px solid #2a2a2a',borderRadius:'14px',background:'#0a0a0a',overflow:'hidden',boxShadow:'0 0 0 1px #181818, 0 16px 48px rgba(0,0,0,0.95)',zIndex:2}}>
                      <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'26px',height:'3px',background:'#1a1a1a',borderRadius:'0 0 3px 3px'}}/>
                      <img src="https://cdn.sanity.io/images/7r0kq57d/production/ce08e3322ddd8d7a9a82aa678da646819d08f759-368x800.png?w=400&auto=format&q=85" alt="XSCACE Controller" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
                    </div>
                  </div>
                )}

                {/* Network Controller — laptop mockup */}
                {app._id === 'software-network-controller' && (
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:'12px'}}>
                    <div style={{width:'88%',display:'flex',flexDirection:'column',alignItems:'center'}}>
                      <div style={{width:'100%',background:'#080808',border:'1.5px solid #222',borderRadius:'6px 6px 0 0',overflow:'hidden',boxShadow:'0 0 0 1px #111'}}>
                        <div style={{height:'10px',background:'#0d0d0d',borderBottom:'1px solid #1a1a1a',display:'flex',alignItems:'center',paddingLeft:'8px',gap:'4px'}}>
                          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#1e1e1e'}}/>
                          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#1e1e1e'}}/>
                          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#1e1e1e'}}/>
                        </div>
                        <img src="https://cdn.sanity.io/images/7r0kq57d/production/886620094c00c68ad5e10fb34b4c2071a7dccfa1-2922x1912.png?w=800&auto=format&q=85" alt="Network Controller" style={{width:'100%',height:'148px',objectFit:'cover',objectPosition:'top',display:'block'}}/>
                      </div>
                      <div style={{width:'108%',height:'7px',background:'#111',borderRadius:'0 0 5px 5px'}}/>
                    </div>
                  </div>
                )}

                {/* Configurator — UI mockup SVG */}
                {app._id === 'software-system-builder' && (
                  <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
                    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
                      <rect width="400" height="220" fill="#050505"/>
                      <rect width="400" height="24" fill="#080808"/>
                      <circle cx="13" cy="12" r="4" fill="#1a1a1a"/><circle cx="26" cy="12" r="4" fill="#1a1a1a"/><circle cx="39" cy="12" r="4" fill="#1a1a1a"/>
                      <text x="200" y="16" fill="#2a2a2a" fontSize="7" fontFamily="monospace" textAnchor="middle">configurator.xscace.com</text>
                      <rect x="0" y="24" width="170" height="196" fill="#060606"/>
                      <rect x="0" y="24" width="170" height="196" fill="none" stroke="#0f0f0f" strokeWidth="0.5"/>
                      <rect x="10" y="34" width="130" height="24" rx="2" fill="#0f0f0f"/>
                      <text x="18" y="46" fill="#666" fontSize="6" fontFamily="monospace">I need speakers for my</text>
                      <text x="18" y="55" fill="#666" fontSize="6" fontFamily="monospace">living room, 5m × 7m</text>
                      <rect x="10" y="64" width="150" height="44" rx="2" fill="#0a0a0a"/>
                      <rect x="10" y="64" width="2.5" height="44" fill="#c9a96e" opacity="0.4"/>
                      <text x="19" y="76" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.8">XSCACE AI</text>
                      <text x="19" y="86" fill="#666" fontSize="5.5" fontFamily="monospace">For that room I'd suggest</text>
                      <text x="19" y="95" fill="#666" fontSize="5.5" fontFamily="monospace">2× Cane + Xylem 3 DSP</text>
                      <text x="19" y="104" fill="#666" fontSize="5.5" fontFamily="monospace">amplifier + Juniper sub.</text>
                      <rect x="10" y="190" width="142" height="20" rx="1" fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="0.5"/>
                      <text x="18" y="203" fill="#2a2a2a" fontSize="6" fontFamily="monospace">Ask about your space...</text>
                      <text x="140" y="203" fill="#c9a96e" fontSize="9" fontFamily="monospace">↑</text>
                      <rect x="170" y="24" width="230" height="196" fill="#050505"/>
                      <text x="182" y="38" fill="#c9a96e" fontSize="6" fontFamily="monospace" opacity="0.5">RECOMMENDED SETUP</text>
                      {[['Cane','Slim Array · ×2',44],['Xylem 3','DSP Amplifier · ×1',90],['Juniper','Subwoofer · ×1',136]].map(([n,t,y]: any) => (
                        <g key={n}>
                          <rect x="178" y={y} width="210" height="36" rx="1" fill="#080808" stroke="#111" strokeWidth="0.5"/>
                          <rect x="178" y={y} width="2.5" height="36" fill="#c9a96e" opacity="0.2"/>
                          <text x="188" y={y+14} fill="#ddd9d3" fontSize="8" fontFamily="serif">{n}</text>
                          <text x="188" y={y+25} fill="#444" fontSize="5.5" fontFamily="monospace">{t}</text>
                        </g>
                      ))}
                      <text x="178" y="200" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.4">Budget: ₹4.2L – ₹5.8L · View BOQ →</text>
                    </svg>
                  </div>
                )}
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
        {/* Configurator — static card, not in Sanity */}
        <Link href="https://configurator.xscace.com" target="_blank" className="sw-card">
          <div className="sw-card-hero" style={{background:'#000'}}>
            <div className="sw-card-hero-overlay" />
            <div className="sw-card-hero-top">
              <span className="sw-platforms">
                <span className="sw-pill">Web</span>
              </span>
            </div>
            <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
              <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
                <rect width="400" height="220" fill="#050505"/>
                <rect width="400" height="24" fill="#080808"/>
                <circle cx="13" cy="12" r="4" fill="#1a1a1a"/><circle cx="26" cy="12" r="4" fill="#1a1a1a"/><circle cx="39" cy="12" r="4" fill="#1a1a1a"/>
                <text x="200" y="16" fill="#2a2a2a" fontSize="7" fontFamily="monospace" textAnchor="middle">configurator.xscace.com</text>
                <rect x="0" y="24" width="170" height="196" fill="#060606"/>
                <rect x="0" y="24" width="170" height="196" fill="none" stroke="#0f0f0f" strokeWidth="0.5"/>
                <rect x="10" y="34" width="130" height="24" rx="2" fill="#0f0f0f"/>
                <text x="18" y="46" fill="#666" fontSize="6" fontFamily="monospace">I need speakers for my</text>
                <text x="18" y="55" fill="#666" fontSize="6" fontFamily="monospace">living room, 5m × 7m</text>
                <rect x="10" y="64" width="150" height="44" rx="2" fill="#0a0a0a"/>
                <rect x="10" y="64" width="2.5" height="44" fill="#c9a96e" opacity="0.4"/>
                <text x="19" y="76" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.8">XSCACE AI</text>
                <text x="19" y="86" fill="#666" fontSize="5.5" fontFamily="monospace">For that room I'd suggest</text>
                <text x="19" y="95" fill="#666" fontSize="5.5" fontFamily="monospace">2× Cane + Xylem 3 DSP</text>
                <text x="19" y="104" fill="#666" fontSize="5.5" fontFamily="monospace">amplifier + Juniper sub.</text>
                <rect x="10" y="190" width="142" height="20" rx="1" fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="0.5"/>
                <text x="18" y="203" fill="#2a2a2a" fontSize="6" fontFamily="monospace">Ask about your space...</text>
                <text x="140" y="203" fill="#c9a96e" fontSize="9" fontFamily="monospace">↑</text>
                <rect x="170" y="24" width="230" height="196" fill="#050505"/>
                <text x="182" y="38" fill="#c9a96e" fontSize="6" fontFamily="monospace" opacity="0.5">RECOMMENDED SETUP</text>
                <rect x="178" y="44" width="210" height="36" rx="1" fill="#080808" stroke="#111" strokeWidth="0.5"/>
                <rect x="178" y="44" width="2.5" height="36" fill="#c9a96e" opacity="0.2"/>
                <text x="188" y="58" fill="#ddd9d3" fontSize="8" fontFamily="serif">Cane</text>
                <text x="188" y="69" fill="#444" fontSize="5.5" fontFamily="monospace">Slim Array · ×2</text>
                <rect x="178" y="90" width="210" height="36" rx="1" fill="#080808" stroke="#111" strokeWidth="0.5"/>
                <rect x="178" y="90" width="2.5" height="36" fill="#c9a96e" opacity="0.2"/>
                <text x="188" y="104" fill="#ddd9d3" fontSize="8" fontFamily="serif">Xylem 3</text>
                <text x="188" y="115" fill="#444" fontSize="5.5" fontFamily="monospace">DSP Amplifier · ×1</text>
                <rect x="178" y="136" width="210" height="36" rx="1" fill="#080808" stroke="#111" strokeWidth="0.5"/>
                <rect x="178" y="136" width="2.5" height="36" fill="#c9a96e" opacity="0.2"/>
                <text x="188" y="150" fill="#ddd9d3" fontSize="8" fontFamily="serif">Juniper</text>
                <text x="188" y="161" fill="#444" fontSize="5.5" fontFamily="monospace">Subwoofer · ×1</text>
                <text x="178" y="200" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.4">Budget: ₹4.2L – ₹5.8L · View BOQ →</text>
              </svg>
            </div>
          </div>
          <div className="sw-card-body">
            <div className="sw-card-name">XSCACE System Builder</div>
            <div className="sw-card-tagline">AI-powered system configurator</div>
            <p className="sw-card-desc">Describe your space and listening goals. The AI recommends the right products, quantities, and wiring — with a full bill of quantities.</p>
            <ul className="sw-card-features">
              <li className="sw-card-feature"><span className="sw-feature-dot"/>Room-aware product recommendations</li>
              <li className="sw-card-feature"><span className="sw-feature-dot"/>Wiring diagram generation</li>
              <li className="sw-card-feature"><span className="sw-feature-dot"/>Exportable bill of quantities</li>
            </ul>
            <div className="sw-card-cta">
              <span className="sw-card-learn">Open Configurator →</span>
              <span className="sw-card-ver">Web App</span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
