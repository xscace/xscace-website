'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

interface Product {
  _id: string
  productName: string
  productFullName: string
  series: string
  subCategory: string
  powerType: string
  tagline: string
  slug: { current: string }
  heroImage?: any
  proprietaryTechBadges?: string
  powerRmsW?: number
  sensitivityDb?: number
  freqLowHz?: number
  freqHighHz?: number
  impedanceOhms?: number
  totalPowerW?: number
  channelCount?: number
  weightKg?: number
  category: { name: string; slug: { current: string } }
}

interface Category {
  _id: string
  name: string
  slug: { current: string }
  order: number
}

const FEATURED_IDS = ['prod-bonsai', 'prod-cane', 'prod-ghost2', 'prod-quadcane', 'prod-acacia6-pw', 'prod-acacia10-pw']

const BADGE_MAP: Record<string, string> = {
  'prod-bonsai':"World's Smallest",'prod-cane':'23mm Thin','prod-quadcane':'21mm Thin',
  'prod-cedar':'Wide Dispersion','prod-ghost2':'Award Winning','prod-aspen6':'2-Way',
  'prod-aspen8':'8" Driver','prod-aster6':'Aimable Tweeter','prod-bonsai-ic':'Flush Look',
  'prod-cane-ic':'Flush Look','prod-quadcane-ic':'Flush Look','prod-oak':'3-Way In-Wall',
  'prod-willow':'3-Way In-Wall','prod-sage':'Titanium Dome','prod-bergenia':'2-Way',
  'prod-camphor6':'IPX66 Rated','prod-camphor8':'IPX66 Rated','prod-spirea':'All Mounts Incl.',
  'prod-banyan-pith':'Dual 12" + DSP','prod-banyan-canopy':'Line Array',
  'prod-acacia6-pw':'200W Powered','prod-acacia10-pw':'300W Powered',
  'prod-juniper':'25Hz Extension','prod-air-mini':'Streaming Only','prod-air-amp':'Streaming + Amp',
  'prod-lucifer4':'1000W · 4ch','prod-lucifer8':'2000W · 8ch',
  'prod-xylem2':'2ch DSP','prod-xylem3':'3ch DSP','prod-xylem4':'4ch DSP',
}

function getImageUrl(heroImage: any): string | null {
  if (!heroImage?.asset?._ref) return null
  const ref = heroImage.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${ref}`
}

function getSpec(p: Product): string {
  if (p.totalPowerW) return [p.totalPowerW + 'W', p.channelCount ? p.channelCount + 'ch' : ''].filter(Boolean).join(' · ')
  const parts: string[] = []
  if (p.powerRmsW) parts.push(p.powerRmsW + 'W')
  if (p.sensitivityDb) parts.push(p.sensitivityDb + 'dB')
  if (p.freqLowHz && p.freqHighHz) parts.push(p.freqLowHz + '–' + p.freqHighHz + 'Hz')
  if (p.impedanceOhms) parts.push(p.impedanceOhms + 'Ω')
  return parts.join(' · ')
}

// ── 3D TILT ───────────────────────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateZ(3px)`
  }
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0)' }
  return (
    <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform .15s ease', willChange: 'transform' }}>
      {children}
    </div>
  )
}

// ── FEATURED CARD ─────────────────────────────────────────────────────────────
function FeaturedCard({ p }: { p: Product }) {
  const imgUrl = getImageUrl(p.heroImage)
  const badge = BADGE_MAP[p._id]
  return (
    <TiltCard className="feat-card-wrap">
      <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`} className="feat-card">
        <div className="feat-card-img">
          {imgUrl
            ? <img src={imgUrl} alt={p.productName}/>
            : <div className="feat-card-img-placeholder"><span>{p.productName[0]}</span></div>
          }
          {badge && <div className="feat-badge">{badge}</div>}
        </div>
        <div className="feat-card-body">
          <div className="feat-card-cat">{p.series || p.subCategory}</div>
          <div className="feat-card-name">{p.productName}</div>
          {p.tagline && <div className="feat-card-tag">{p.tagline}</div>}
          {getSpec(p) && <div className="feat-card-spec">{getSpec(p)}</div>}
          <div className="feat-card-cta">View Product →</div>
        </div>
      </a>
    </TiltCard>
  )
}

// ── SOFTWARE SECTION ──────────────────────────────────────────────────────────
function SoftwareSection() {
  const apps = [
    {
      name: 'XSCACE Network Controller',
      sub: 'Desktop Application',
      desc: 'Full DSP control for XSCACE Power Amplifiers. EQ, crossover, delay, and preset management — from your Mac or PC.',
      platforms: ['macOS', 'Windows'],
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="sw-icon">
          <rect x="6" y="8" width="36" height="26" rx="2" stroke="#c9a96e" strokeWidth="1.2"/>
          <line x1="14" y1="34" x2="34" y2="34" stroke="#c9a96e" strokeWidth="1.2"/>
          <rect x="19" y="34" width="10" height="5" rx="0" stroke="#c9a96e" strokeWidth="1.2"/>
          {[0,1,2,3].map(i => <rect key={i} x={10+i*8} y={14} width="5" height={8+i*3} rx="0.5" fill="#c9a96e" opacity={0.25+i*0.15}/>)}
        </svg>
      ),
      cta: { label: 'Download', href: 'https://github.com/XSCACE/xscace-releases/releases/latest' },
    },
    {
      name: 'XSCACE Controller',
      sub: 'iOS & Android App',
      desc: 'Control your XSCACE streamers from your phone. Source switching, volume, EQ, and X-Sense AI auto-calibration.',
      platforms: ['iOS', 'Android'],
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="sw-icon">
          <rect x="14" y="4" width="20" height="40" rx="3" stroke="#c9a96e" strokeWidth="1.2"/>
          <circle cx="24" cy="39" r="2" stroke="#c9a96e" strokeWidth="0.8" opacity="0.5"/>
          <line x1="20" y1="8" x2="28" y2="8" stroke="#c9a96e" strokeWidth="1" opacity="0.4"/>
          {[0,1,2].map(i => <line key={i} x1="18" y1={16+i*6} x2={24+i*3} y2={16+i*6} stroke="#c9a96e" strokeWidth="0.8" opacity={0.6-i*0.15}/>)}
        </svg>
      ),
      cta: { label: 'App Store', href: 'https://apps.apple.com' },
      cta2: { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.xscace.controller' },
    },
    {
      name: 'XSCACE AI Configurator',
      sub: 'Web Application',
      desc: 'Describe your space. Our AI designs the perfect XSCACE system — complete equipment list, layout, and spec sheet.',
      platforms: ['Browser'],
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="sw-icon">
          <rect x="6" y="10" width="36" height="28" rx="2" stroke="#c9a96e" strokeWidth="1.2"/>
          <rect x="6" y="10" width="36" height="7" rx="2" fill="#c9a96e" opacity="0.07"/>
          <circle cx="24" cy="28" r="7" stroke="#c9a96e" strokeWidth="0.8" opacity="0.45"/>
          <circle cx="24" cy="28" r="2.5" fill="#c9a96e" opacity="0.5"/>
          {[0,1,2,3].map(i => {
            const a = (i/4)*Math.PI*2
            return <line key={i} x1={24+Math.cos(a)*7} y1={28+Math.sin(a)*7}
              x2={24+Math.cos(a)*11} y2={28+Math.sin(a)*11}
              stroke="#c9a96e" strokeWidth="0.8" opacity="0.3"/>
          })}
        </svg>
      ),
      cta: { label: 'Open Configurator', href: 'https://configurator.xscace.com' },
    },
  ]

  return (
    <div className="sw-section products-section" id="software">
      <div className="products-sec-header">
        <div className="products-sec-ey">Software & Apps</div>
        <h2 className="products-sec-title">The XSCACE <em>Ecosystem</em></h2>
      </div>
      <div className="sw-grid">
        {apps.map(app => (
          <div key={app.name} className="sw-card">
            <div className="sw-card-top">
              {app.icon}
              <div className="sw-platforms">
                {app.platforms.map(p => <span key={p} className="sw-platform">{p}</span>)}
              </div>
            </div>
            <div className="sw-card-sub">{app.sub}</div>
            <div className="sw-card-name">{app.name}</div>
            <div className="sw-card-desc">{app.desc}</div>
            <div className="sw-card-ctas">
              <a href={app.cta.href} target="_blank" rel="noopener noreferrer" className="sw-cta-btn">{app.cta.label} →</a>
              {'cta2' in app && app.cta2 && (
                <a href={app.cta2.href} target="_blank" rel="noopener noreferrer" className="sw-cta-btn sw-cta-ghost">{app.cta2.label} →</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({ p, delay }: { p: Product; delay: number }) {
  const imgUrl = getImageUrl(p.heroImage)
  const badge = BADGE_MAP[p._id]
  return (
    <TiltCard className="pc-wrap">
      <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`} className="pc">
        <div className="pc-img">
          {imgUrl
            ? <img src={imgUrl} alt={p.productName}/>
            : <div className="pc-placeholder"><div className="pc-ph-badge">Image pending</div></div>
          }
          {badge && <div className="pc-badge">{badge}</div>}
        </div>
        <div className="pc-body">
          <div className="pc-cat">{p.series || p.subCategory}</div>
          <div className="pc-name">{p.productName}</div>
          {p.tagline && <div className="pc-tagline">{p.tagline}</div>}
          {getSpec(p) && <div className="pc-spec">{getSpec(p)}</div>}
          <div className="pc-foot">
            {p.powerType && p.category?.slug?.current !== 'amplifier-series' && (
              <span className="pc-type">{p.powerType}</span>
            )}
            <span className="pc-arr">View →</span>
          </div>
        </div>
      </a>
    </TiltCard>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ProductsClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const searchParams = useSearchParams()
  const [activeFilter, setActiveFilter] = useState(() => searchParams.get('cat') || 'all')
  const [gridVisible, setGridVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('featured')
  const gridRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const featured = FEATURED_IDS.map(id => products.find(p => p._id === id)).filter(Boolean) as Product[]
  const catalogue = products.filter(p => activeFilter === 'all' || p.category?.slug?.current === activeFilter)

  const handleFilter = (slug: string) => {
    setGridVisible(false)
    setTimeout(() => {
      setActiveFilter(slug)
      window.history.replaceState({}, '', slug === 'all' ? '/products' : `/products?cat=${slug}`)
      setGridVisible(true)
    }, 180)
  }

  useEffect(() => { setTimeout(() => setGridVisible(true), 100) }, [])

  // Reveal cards on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.05 })
    gridRef.current?.querySelectorAll('.pc-wrap').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [catalogue])

  // Scroll spy for side nav
  useEffect(() => {
    const sections = ['featured', 'software', 'catalogue']
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(e.target.id)
      })
    }, { rootMargin: '-40% 0px -55% 0px' })
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="products-pg">

      {/* ── SIDE NAV ── */}
      <aside className="products-sidenav">
        <div className="sidenav-logo">
          <div className="sidenav-label">Products</div>
        </div>
        <div className="sidenav-links">
          <div className="sidenav-section-label">Highlights</div>
          <button className={`sidenav-link${activeSection === 'featured' ? ' active' : ''}`}
            onClick={() => scrollTo('featured')}>
            Featured
          </button>
          <button className={`sidenav-link${activeSection === 'software' ? ' active' : ''}`}
            onClick={() => scrollTo('software')}>
            Software & Apps
          </button>
          <div className="sidenav-divider"/>
          <div className="sidenav-section-label">Catalogue</div>
          <button className={`sidenav-link${activeSection === 'catalogue' && activeFilter === 'all' ? ' active' : ''}`}
            onClick={() => { handleFilter('all'); scrollTo('catalogue') }}>
            All Products
            <span className="sidenav-link-count">{products.length}</span>
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category?.slug?.current === cat.slug.current).length
            if (!count) return null
            const isActive = activeSection === 'catalogue' && activeFilter === cat.slug.current
            return (
              <button key={cat._id}
                className={`sidenav-link${isActive ? ' active' : ''}`}
                onClick={() => { handleFilter(cat.slug.current); scrollTo('catalogue') }}>
                {cat.name.replace(' Series', '').replace(' Set', '')}
                <span className="sidenav-link-count">{count}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="products-main" ref={mainRef}>

        {/* Hero */}
        <div className="products-pg-hero">
          <div className="products-pg-ey">Full Catalogue · {products.length} Products</div>
          <h1 className="products-pg-title">Products</h1>
          <p className="products-pg-sub">Architectural speakers and amplifiers engineered for spaces where sound should be felt, not seen.</p>
        </div>

        {/* Featured */}
        <div className="feat-section products-section" id="featured">
          <div className="products-sec-header">
            <div className="products-sec-ey">Featured</div>
            <h2 className="products-sec-title">Defining the <em>range</em></h2>
          </div>
          <div className="feat-grid">
            {featured.length > 0
              ? featured.map(p => <FeaturedCard key={p._id} p={p}/>)
              : FEATURED_IDS.map(id => (
                  <div key={id} className="feat-card-wrap">
                    <div className="feat-card feat-card-skeleton">
                      <div className="feat-card-img" style={{aspectRatio:'4/5',background:'#0c0c0c',borderBottom:'1px solid #141414'}}/>
                      <div className="feat-card-body">
                        <div className="feat-skeleton-line" style={{width:'55%'}}/>
                        <div className="feat-skeleton-line" style={{width:'35%',height:'8px',marginTop:'8px'}}/>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Software */}
        <SoftwareSection />

        {/* Catalogue */}
        <div className="catalogue-section products-section" id="catalogue">
          <div className="products-sec-header">
            <div className="products-sec-ey">Full Catalogue</div>
            <h2 className="catalogue-title">Every <em>product</em></h2>
          </div>

          {/* Grid */}
          <div ref={gridRef} className="catalogue-grid"
            style={{ opacity: gridVisible ? 1 : 0, transition: 'opacity .18s ease' }}>
            {catalogue.map((p, i) => <ProductCard key={p._id} p={p} delay={i * 30}/>)}
            {catalogue.length === 0 && <div className="cat-empty">No products in this category.</div>}
          </div>
        </div>

      </div>
    </div>
  )
}
