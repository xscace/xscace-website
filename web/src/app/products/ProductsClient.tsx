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
  heroVideoUrl?: string | null
  fallbackImageUrl?: string | null
  model3dUrl?: string | null
}

interface Category {
  _id: string
  name: string
  slug: { current: string }
  order: number
}

interface SoftwareApp {
  _id: string
  name: string
  slug: { current: string }
  tagline?: string
  platform?: string
  status?: string
  heroImageUrl?: string
  appStoreUrl?: string
  playStoreUrl?: string
}

const FEATURED_IDS = ['prod-bonsai', 'prod-cane', 'prod-quadcane', 'prod-ghost2', 'prod-acacia6-pw', 'prod-xylem3']

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
function TiltCard({ children, className, onMouseEnter, onMouseLeave }: { children: React.ReactNode; className?: string; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
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
    <div ref={ref} className={className} onMouseMove={onMove}
      onMouseLeave={(e) => { onLeave(); onMouseLeave?.() }}
      onMouseEnter={() => onMouseEnter?.()}
      style={{ transition: 'transform .15s ease', willChange: 'transform' }}>
      {children}
    </div>
  )
}

// ── 3D MODEL VIEWER ──────────────────────────────────────────────────────────
const CDN3 = 'https://cdn.jsdelivr.net/npm/three@0.128.0'

// Per-product camera + lighting settings (from /test-3d calibration)
const MODEL_SETTINGS: Record<string, {
  cam: [number,number,number], rot: [number,number,number], fov: number,
  exposure: number, ambient: number, key: number, fill: number
}> = {
  'prod-bonsai':    { cam:[-0.12,0.84,3.27], rot:[0.108,-1.032,-1.542], fov:41, exposure:3.35, ambient:0,   key:0.1, fill:0.5 },
  'prod-cane':      { cam:[-0.08,0.34,3.03], rot:[0.248,-0.942,-1.502], fov:43, exposure:0.6,  ambient:1.1, key:2.4, fill:1.0 },
  'prod-ghost2':    { cam:[0,0,3],            rot:[0.308,0,0],           fov:51, exposure:0.4,  ambient:0.1, key:2.4, fill:0.8 },
  'prod-acacia6-pw':{ cam:[0,0.02,3.48],      rot:[-0.002,-0.732,0],    fov:53, exposure:0.9,  ambient:1.3, key:2.1, fill:0.5 },
  'prod-xylem3':    { cam:[-0.36,-0.55,3.77], rot:[-2.542,0.000,0.000], fov:40, exposure:1.15, ambient:0,   key:0.0, fill:1.0 },
  'prod-quadcane':  { cam:[0.04,-0.02,1.52],      rot:[0.268,-1.202,0.058],  fov:40, exposure:0.25, ambient:0,   key:1.4, fill:2.2 },
}
const DEFAULT_SETTINGS = { cam:[0,0,3.5] as [number,number,number], rot:[0,0,0] as [number,number,number], fov:40, exposure:1.4, ambient:0.5, key:3.0, fill:1.0 }

function inject3(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement('script')
    s.src = src; s.async = true
    s.onload = () => res()
    s.onerror = () => rej(new Error(`Failed: ${src}`))
    document.head.appendChild(s)
  })
}

// Single shared promise — all ModelViewers wait on the same load, no race
let threePromise: Promise<void> | null = null
function ensureThree(): Promise<void> {
  if (!threePromise) {
    threePromise = (async () => {
      await inject3(`${CDN3}/build/three.min.js`)
      await inject3(`${CDN3}/examples/js/loaders/GLTFLoader.js`)
      await inject3(`${CDN3}/examples/js/loaders/DRACOLoader.js`)
      await new Promise(r => setTimeout(r, 80))
    })()
  }
  return threePromise
}

// Preload as soon as module loads
if (typeof window !== 'undefined') {
  setTimeout(() => ensureThree().catch(() => {}), 200)
}

function ModelViewer({ src, hovered, productId }: { src: string; hovered: boolean; productId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const modelRef = useRef<any>(null)
  // Current rotation (lerped toward target)
  const curRot = useRef({ x: 0, y: 0 })
  // Target rotation — driven by mouse position
  const tgtRot = useRef({ x: 0, y: 0 })
  const baseRot = useRef({ x: 0, y: 0 })
  const isHoveredRef = useRef(false)

  const settings = (productId && MODEL_SETTINGS[productId]) ? MODEL_SETTINGS[productId] : DEFAULT_SETTINGS

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false

    const init = async () => {
      try {
        await ensureThree()
        if (cancelled) return
        const THREE = (window as any).THREE
        if (!THREE) return

        const card = canvas.closest('.feat-card-wrap') as HTMLElement
        const W = card ? card.offsetWidth : 300
        const H = Math.round(W * 1.25)

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H, false)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = settings.exposure

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(settings.fov, W / H, 0.01, 100)
        camera.position.set(...settings.cam)

        scene.add(new THREE.AmbientLight(0xffffff, settings.ambient))
        const key = new THREE.DirectionalLight(0xfff5e0, settings.key)
        key.position.set(2, 3, 2); scene.add(key)
        const fill = new THREE.DirectionalLight(0xc9a96e, settings.fill)
        fill.position.set(-2, 1, 1); scene.add(fill)

        const dracoLoader = new THREE.DRACOLoader()
        dracoLoader.setDecoderPath(`${CDN3}/examples/js/libs/draco/`)
        const loader = new THREE.GLTFLoader()
        loader.setDRACOLoader(dracoLoader)

        loader.load(src, (gltf: any) => {
          if (cancelled) return
          const model = gltf.scene
          const box = new THREE.Box3().setFromObject(model)
          const centre = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          model.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z))
          model.position.sub(centre.multiplyScalar(2.0 / Math.max(size.x, size.y, size.z)))
          model.rotation.set(...settings.rot)
          scene.add(model)
          modelRef.current = model
          // Set base rotation refs
          baseRot.current = { x: settings.rot[0], y: settings.rot[1] }
          curRot.current  = { x: settings.rot[0], y: settings.rot[1] }
          tgtRot.current  = { x: settings.rot[0], y: settings.rot[1] }

          const animate = () => {
            if (cancelled) return
            frameRef.current = requestAnimationFrame(animate)
            // Smooth lerp toward target
            curRot.current.x += (tgtRot.current.x - curRot.current.x) * 0.08
            curRot.current.y += (tgtRot.current.y - curRot.current.y) * 0.08
            model.rotation.x = curRot.current.x
            model.rotation.y = curRot.current.y
            renderer.render(scene, camera)
          }
          animate()
        }, undefined, (err: any) => console.warn('[3D]', src, err))

      } catch(e) { console.warn('[3D] init error', e) }
    }

    const t = setTimeout(init, 80)
    return () => { cancelled = true; clearTimeout(t); cancelAnimationFrame(frameRef.current) }
  }, [src, productId])

  // Sync hovered state to ref so event handlers can read it
  useEffect(() => {
    isHoveredRef.current = hovered
    if (!hovered) {
      // On leave — smoothly return to base rotation
      tgtRot.current = { x: baseRot.current.x, y: baseRot.current.y }
    }
  }, [hovered])

  // Mouse move — model follows pointer within card bounds
  const onMouseMove = (e: React.MouseEvent) => {
    if (!modelRef.current) return
    const r = e.currentTarget.getBoundingClientRect()
    // Map mouse to -1..1 within card
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
    // Offset from base rotation — ±0.35 rad range
    tgtRot.current = {
      x: baseRot.current.x + ny * -0.35,
      y: baseRot.current.y + nx * 0.45,
    }
  }

  const onMouseLeave = () => {
    tgtRot.current = { x: baseRot.current.x, y: baseRot.current.y }
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: hovered ? 'all' : 'none',
        zIndex: 3, display: 'block',
        cursor: 'crosshair',
        // Prevent WebGL clear colour showing before hover
        visibility: hovered ? 'visible' : 'hidden',
      }}
    />
  )
}

// ── FEATURED CARD ─────────────────────────────────────────────────────────────
function FeaturedCard({ p }: { p: Product }) {
  const imgUrl = getImageUrl(p.heroImage)
  const badge = BADGE_MAP[p._id]
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)
  const has3d = !!p.model3dUrl

  useEffect(() => {
    const v = videoRef.current
    if (!v || has3d) return
    if (hovered) { v.play().catch(() => {}) }
    else { v.pause(); v.currentTime = 0 }
  }, [hovered, has3d])

  return (
    <div
      className={`feat-card-wrap${hovered ? ' feat-card-wrap--active' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`} className="feat-card">
        <div className="feat-card-img" style={{ position: 'relative', overflow: 'hidden', background: hovered && has3d ? '#000' : 'transparent', transition: 'background 0.4s ease' }}>

          {/* Hero image — always visible at rest */}
          {imgUrl && (
            <img src={imgUrl} alt={p.productName} style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: (hovered && has3d) ? 0 : (p.heroVideoUrl && hovered && !has3d) ? 0 : 1,
              transition: 'opacity 0.5s ease',
              zIndex: 1,
            }}/>
          )}
          {!imgUrl && !has3d && <div className="feat-card-img-placeholder" style={{zIndex:1}}><span>{p.productName[0]}</span></div>}

          {/* Video hover — only for non-3D cards */}
          {p.heroVideoUrl && !has3d && (
            <video ref={videoRef} src={p.heroVideoUrl} muted loop playsInline style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.4s ease', zIndex: 2,
            }}/>
          )}

          {/* 3D canvas — invisible and pointer-events:none until hovered */}
          {has3d && (
            <ModelViewer src={`/api/glb/${p.model3dUrl!.split('/').pop()}`} hovered={hovered} productId={p._id} />
          )}

          {badge && <div className="feat-badge" style={{position:'absolute',top:14,left:14,zIndex:20}}>{badge}</div>}
        </div>

        <div className="feat-card-body">
          <div className="feat-card-cat">{p.series || p.subCategory}</div>
          <div className="feat-card-name">{p.productName}</div>
          {p.tagline && <div className="feat-card-tag">{p.tagline}</div>}
          {getSpec(p) && <div className="feat-card-spec">{getSpec(p)}</div>}
          <div className="feat-card-cta">
            {has3d && hovered ? 'Move cursor to explore →' : 'View Product →'}
          </div>
        </div>
      </a>
    </div>
  )
}

// ── SOFTWARE SECTION ──────────────────────────────────────────────────────────
const PLATFORM_LABEL: Record<string, string> = {
  'ios-android': 'iOS & Android',
  'mac-windows': 'macOS & Windows',
  'ios': 'iOS', 'android': 'Android', 'mac': 'macOS', 'windows': 'Windows',
}

function SoftwareSection({ software }: { software: SoftwareApp[] }) {
  return (
    <div className="sw-section products-section" id="software">
      <div className="products-sec-header">
        <div className="products-sec-ey">Software & Apps</div>
        <h2 className="products-sec-title">The XSCACE <em>Ecosystem</em></h2>
      </div>
      <div className="sw-grid">

        {/* Apps from Sanity — each links to its dedicated software page */}
        {software.map(app => {
          const slug = app.slug?.current
          const href = slug ? `/software/${slug}` : '#'
          const platform = app.platform ? (PLATFORM_LABEL[app.platform] || app.platform) : ''
          const isMobile = app.platform?.includes('ios') || app.platform?.includes('android')
          return (
            <a key={app._id} href={href} className="sw-card sw-card--img">
              {/* Hero image fills card top */}
              <div className="sw-card-img">
                {app.heroImageUrl
                  ? <img src={app.heroImageUrl} alt={app.name} />
                  : (
                    <div className="sw-card-img-placeholder">
                      <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                        {isMobile ? (
                          <>
                            <rect x="14" y="4" width="20" height="40" rx="3" stroke="#c9a96e" strokeWidth="1.2"/>
                            <circle cx="24" cy="39" r="2" stroke="#c9a96e" strokeWidth="0.8"/>
                          </>
                        ) : (
                          <>
                            <rect x="4" y="8" width="40" height="28" rx="2" stroke="#c9a96e" strokeWidth="1.2"/>
                            <line x1="14" y1="36" x2="34" y2="36" stroke="#c9a96e" strokeWidth="1.2"/>
                            <rect x="18" y="36" width="12" height="5" stroke="#c9a96e" strokeWidth="1.2"/>
                          </>
                        )}
                      </svg>
                    </div>
                  )
                }
                <div className="sw-card-img-overlay" />
              </div>
              {/* Card text */}
              <div className="sw-card-body">
                <div className="sw-platforms">
                  {platform && <span className="sw-platform">{platform}</span>}
                  {app.status === 'coming-soon' && (
                    <span className="sw-platform sw-platform--soon">Coming Soon</span>
                  )}
                </div>
                <div className="sw-card-name">{app.name}</div>
                {app.tagline && <div className="sw-card-tag">{app.tagline}</div>}
                <div className="sw-card-ctas">
                  <span className="sw-cta-btn">Learn More →</span>
                </div>
              </div>
            </a>
          )
        })}

        {/* Configurator — static card, external link */}
        <a href="https://configurator.xscace.com" target="_blank" rel="noopener noreferrer" className="sw-card sw-card--img">
          <div className="sw-card-img sw-card-img--conf">
            <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
              <rect width="320" height="200" fill="#090909"/>
              {/* Wiring diagram representing the configurator */}
              <line x1="40" y1="100" x2="100" y2="100" stroke="#c9a96e" strokeWidth="0.8" opacity="0.4"/>
              <line x1="100" y1="100" x2="100" y2="55" stroke="#c9a96e" strokeWidth="0.8" opacity="0.35"/>
              <line x1="100" y1="55" x2="210" y2="55" stroke="#c9a96e" strokeWidth="0.8" opacity="0.35"/>
              <line x1="100" y1="100" x2="210" y2="100" stroke="#c9a96e" strokeWidth="0.8" opacity="0.4"/>
              <line x1="100" y1="100" x2="100" y2="145" stroke="#c9a96e" strokeWidth="0.8" opacity="0.35"/>
              <line x1="100" y1="145" x2="210" y2="145" stroke="#c9a96e" strokeWidth="0.8" opacity="0.35"/>
              <line x1="210" y1="55" x2="280" y2="55" stroke="#c9a96e" strokeWidth="0.8" opacity="0.3"/>
              <line x1="210" y1="100" x2="280" y2="78" stroke="#c9a96e" strokeWidth="0.8" opacity="0.3"/>
              <line x1="210" y1="100" x2="280" y2="122" stroke="#c9a96e" strokeWidth="0.8" opacity="0.3"/>
              <line x1="210" y1="145" x2="280" y2="145" stroke="#c9a96e" strokeWidth="0.8" opacity="0.3"/>
              {([[40,100],[100,55],[100,100],[100,145],[210,55],[210,100],[210,145],[280,55],[280,78],[280,122],[280,145]] as [number,number][]).map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#090909" stroke="#c9a96e" strokeWidth={i===0?1:0.7} opacity={i===0?0.9:0.5}/>
              ))}
              <text x="26" y="90" fill="#c9a96e" fontSize="6.5" fontFamily="monospace" opacity="0.6">SOURCE</text>
              <text x="88" y="47" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.45">AMP</text>
              <text x="198" y="47" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.45">SPEAKER</text>
              <text x="198" y="92" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.45">SPEAKER</text>
              <text x="198" y="137" fill="#c9a96e" fontSize="5.5" fontFamily="monospace" opacity="0.45">SPEAKER</text>
              <text x="126" y="97" fill="#c9a96e" fontSize="7" fontFamily="monospace" opacity="0.25">AI CONFIGURED</text>
            </svg>
            <div className="sw-card-img-overlay" />
          </div>
          <div className="sw-card-body">
            <div className="sw-platforms">
              <span className="sw-platform">Web · AI</span>
            </div>
            <div className="sw-card-name">System Builder</div>
            <div className="sw-card-tag">Describe your space. Get a complete system.</div>
            <div className="sw-card-ctas">
              <span className="sw-cta-btn">Open Builder →</span>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({ p, delay }: { p: Product; delay: number }) {
  const imgUrl = getImageUrl(p.heroImage)
  const badge = BADGE_MAP[p._id]
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (hovered) { v.play().catch(() => {}) }
    else { v.pause(); v.currentTime = 0 }
  }, [hovered])

  // Show fallback image on hover if no video
  const showFallback = hovered && !p.heroVideoUrl && !!p.fallbackImageUrl

  return (
    <TiltCard className="pc-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`} className="pc">
        <div className="pc-img" style={{position:'relative',overflow:'hidden'}}>
          {/* Hero image — fades out on hover if video available */}
          {imgUrl
            ? <img src={imgUrl} alt={p.productName} style={{
                position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
                opacity:(p.heroVideoUrl && hovered) || showFallback ? 0 : 1,
                transition:'opacity 0.35s ease'
              }}/>
            : <div className="pc-placeholder"><div className="pc-ph-badge">Image pending</div></div>
          }
          {/* Fallback lifestyle/gallery image — fades in on hover when no video */}
          {p.fallbackImageUrl && !p.heroVideoUrl && (
            <img src={p.fallbackImageUrl} alt={p.productName} style={{
              position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
              opacity:showFallback ? 1 : 0, transition:'opacity 0.35s ease'
            }}/>
          )}
          {/* Hero video — plays on hover */}
          {p.heroVideoUrl && (
            <video ref={videoRef} src={p.heroVideoUrl} muted loop playsInline style={{
              position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
              opacity:hovered ? 1 : 0, transition:'opacity 0.35s ease'
            }}/>
          )}
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
export default function ProductsClient({
  products,
  categories,
  software = [],
}: {
  products: Product[]
  categories: Category[]
  software?: SoftwareApp[]
}) {
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

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.05 })
    gridRef.current?.querySelectorAll('.pc-wrap').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [catalogue])

  useEffect(() => {
    const sections = ['featured', 'software', 'catalogue']
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
    }, { rootMargin: '-40% 0px -55% 0px' })
    sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="products-pg">

      <aside className="products-sidenav">
        <div className="sidenav-logo">
          <div className="sidenav-label">Products</div>
        </div>
        <div className="sidenav-links">
          <div className="sidenav-section-label">Highlights</div>
          <button className={`sidenav-link${activeSection === 'featured' ? ' active' : ''}`}
            onClick={() => scrollTo('featured')}>Featured</button>
          <button className={`sidenav-link${activeSection === 'software' ? ' active' : ''}`}
            onClick={() => scrollTo('software')}>Software & Apps</button>
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

      <div className="products-main" ref={mainRef}>

        <div className="products-pg-hero">
          <div className="products-pg-ey">Full Catalogue · {products.length} Products</div>
          <h1 className="products-pg-title">Products</h1>
          <p className="products-pg-sub">Architectural speakers and amplifiers engineered for spaces where sound should be felt, not seen.</p>
        </div>

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

        <canvas className="wave-divider" id="pd-wd1" height="28" aria-hidden="true" style={{display:'block',width:'100%',height:'28px'}}></canvas>

        <SoftwareSection software={software} />

        <canvas className="wave-divider" id="pd-wd2" height="28" aria-hidden="true" style={{display:'block',width:'100%',height:'28px'}}></canvas>

        <div className="catalogue-section products-section" id="catalogue">
          <div className="products-sec-header">
            <div className="products-sec-ey">Full Catalogue</div>
            <h2 className="catalogue-title">Every <em>product</em></h2>
          </div>
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
