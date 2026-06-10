'use client'

import { useEffect, useRef, useState } from 'react'
import TechShowcase from './TechShowcase'

interface Product {
  _id: string
  productName: string
  productFullName?: string
  series?: string
  subCategory?: string
  powerType?: string
  tagline?: string
  shortDescription?: string
  longDescription?: string
  slug: { current: string }
  proprietaryTechBadges?: string
  skuBase?: string
  heroImage?: any
  galleryImages?: any[]
  lifestyleImages?: any[]
  dimensionDrawing?: any
  directivityPlotImage?: any
  heroVideo?: any
  model3dUrl?: string
  arViewLink?: string
  hasArView?: boolean
  powerRmsW?: number
  powerPeakW?: number
  impedanceOhms?: number
  sensitivityDb?: number
  freqLowHz?: number
  freqHighHz?: number
  freqQualifier?: string
  driverCount?: number
  driverSize?: string
  driverMaterial?: string
  tweeterCount?: number
  tweeterSize?: string
  totalPowerW?: number
  channelCount?: number
  ampClass?: string
  weightKg?: number
  heightMm?: number
  widthMm?: number
  depthMm?: number
  cutoutHeightMm?: number
  cutoutWidthMm?: number
  cutoutDiameterMm?: number
  requiredCavityDepthMm?: number
  mountingMethod?: string
  mountingMethods?: string[]
  paintableGrille?: boolean
  grilleMaterial?: string
  fireRating?: string
  tweeterAimable?: boolean
  inputs?: string
  outputs?: string
  wirelessConnectivity?: string
  eqProfileName?: string
  recommendedCrossoverHz?: number
  itemsInBox?: string[]
  recommendedRoomSize?: string
  positioningNote?: string
  cadFile?: any
  eqData?: string
  channelConfigurations?: string
  powerPerCh8OhmW?: number
  powerPerCh4OhmW?: number
  thdN?: string
  snrDb?: string
  freqResponse?: string
  inputImpedance?: string
  inputSensitivity?: string
  hasDsp?: boolean
  dspProcessorSpec?: string
  dspPresets?: string
  hasStreamer?: boolean
  streamingProtocols?: string
  protectionFeatures?: string
  diameterMm?: number
  housingMaterial?: string
  finish?: string
  colorsStandard?: string
  customRalAvailable?: boolean
  crossoverType?: string
  crossoverFrequency?: string
  ipRating?: string
  directivityHDeg?: number
  directivityVDeg?: number
  communicationPorts?: string
  rackMountable?: boolean
  rackUnitSize?: string
  lineTransformerCompatible?: boolean
  minRiggingHeight?: string
  minSpeakerSpacing?: string
  screwSize?: string
  wireGaugeRecommended?: string
  installationSteps?: string
  mountingBracketRequired?: boolean
  mountingBracketDimensions?: string
  wiringDiagramImage?: any
  cutoutTemplateImage?: any
  mobileAppName?: string
  desktopSoftwareName?: string
  desktopSoftwareUrl?: string
  compatibleControlSystems?: string
  recommendedPairingPrimary?: any
  recommendedPairingSecondary?: any
  compatibleAmplifiers?: any[]
  compatibleSubwoofers?: any[]
  compatibleSpeakers?: any[]
  category: { name: string; slug: { current: string } }
}

const TECH_MAP: Record<string, { label: string; desc: string }> = {
  'Nano Resonance':       { label: 'Nano Resonance',       desc: 'Heavy cone mass for ultra-low resonant frequency' },
  'PowerDense Dynamics':  { label: 'PowerDense Dynamics',  desc: 'Copper-silver composite voice coil' },
  'AeroFrame Chassis':    { label: 'AeroFrame Chassis',    desc: '6061 aerospace aluminium passive heatsink' },
  'PrecisionXover Array': { label: 'PrecisionXover Array', desc: 'Air-core inductors at ±0.5dB tolerance' },
  'XS-Flow':              { label: 'XS-Flow™',             desc: 'Micro-waveguides for controlled dispersion' },
  'PsySculpt':            { label: 'PsySculpt™',           desc: 'Fletcher-Munson equal-loudness DSP compensation' },
}

function getImageUrl(img: any, w = 1200): string | null {
  if (!img) return null
  // Handle direct asset ref
  const ref = img?.asset?._ref || img?._ref
  if (!ref) return null
  const clean = ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${clean}?w=${w}&auto=format`
}

function getFileUrl(file: any): string | null {
  if (!file?.asset?._ref) return null
  const ref = file.asset._ref.replace('file-', '').replace(/-([a-zA-Z0-9]+)$/, '.$1')
  return `https://cdn.sanity.io/files/7r0kq57d/production/${ref}`
}

// ── EQ CURVE ──────────────────────────────────────────────────────────────────
function EQCurve({ freqLow, freqHigh, sensitivity, eqData }: { freqLow: number; freqHigh: number; sensitivity?: number; eqData?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)

    const PAD = { l: 48, r: 24, t: 20, b: 36 }
    const plotW = W - PAD.l - PAD.r
    const plotH = H - PAD.t - PAD.b

    // Freq axis: 20Hz to 20kHz, log scale
    const logToX = (f: number) => PAD.l + (Math.log10(f / 20) / Math.log10(20000 / 20)) * plotW
    // dB axis: -30 to +6
    const dbToY = (db: number) => PAD.t + plotH - ((db + 30) / 36) * plotH

    // Grid lines
    ctx.strokeStyle = 'rgba(201,169,110,0.06)'
    ctx.lineWidth = 0.5
    ;[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach(f => {
      const x = logToX(f)
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + plotH); ctx.stroke()
      ctx.fillStyle = 'rgba(201,169,110,0.25)'
      ctx.font = '8px DM Mono, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(f >= 1000 ? `${f/1000}k` : `${f}`, x, PAD.t + plotH + 14)
    })
    ;[-20, -10, 0].forEach(db => {
      const y = dbToY(db)
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + plotW, y); ctx.stroke()
      ctx.fillStyle = 'rgba(201,169,110,0.25)'
      ctx.font = '8px DM Mono, monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${db}`, PAD.l - 6, y + 3)
    })

    // Generate a realistic-looking speaker response curve
    const points: [number, number][] = []
    const steps = 300
    for (let i = 0; i <= steps; i++) {
      const f = 20 * Math.pow(20000 / 20, i / steps)
      let db = 0

      // Roll-off below freqLow
      if (f < freqLow) {
        const octavesBelow = Math.log2(freqLow / f)
        db = -12 * octavesBelow * octavesBelow * 0.5
      }
      // Roll-off above freqHigh
      if (f > freqHigh) {
        const octavesAbove = Math.log2(f / freqHigh)
        db = -18 * octavesAbove * octavesAbove * 0.4
      }
      // Slight bass boost around 2x freqLow
      const bassBoostF = freqLow * 2.2
      if (f > freqLow * 0.8 && f < freqLow * 6) {
        const dist = Math.log2(f / bassBoostF)
        db += 2.5 * Math.exp(-dist * dist * 2)
      }
      // Very subtle midrange presence dip
      const dipF = 3000
      if (f > 800 && f < 8000) {
        const dist = Math.log2(f / dipF)
        db -= 1.2 * Math.exp(-dist * dist * 0.8)
      }
      // Tweeter peak near top end
      if (freqHigh > 10000) {
        const peakF = freqHigh * 0.7
        const dist = Math.log2(f / peakF)
        db += 1.5 * Math.exp(-dist * dist * 3)
      }
      // Noise floor clamp
      db = Math.max(db, -28)
      points.push([f, db])
    }

    // Fill under curve
    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + plotH)
    grad.addColorStop(0, 'rgba(201,169,110,0.12)')
    grad.addColorStop(1, 'rgba(201,169,110,0)')
    ctx.beginPath()
    ctx.moveTo(logToX(points[0][0]), dbToY(points[0][1]))
    points.forEach(([f, db]) => ctx.lineTo(logToX(f), dbToY(db)))
    ctx.lineTo(logToX(points[points.length-1][0]), PAD.t + plotH)
    ctx.lineTo(logToX(points[0][0]), PAD.t + plotH)
    ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()

    // Curve line
    ctx.beginPath()
    ctx.moveTo(logToX(points[0][0]), dbToY(points[0][1]))
    points.forEach(([f, db]) => ctx.lineTo(logToX(f), dbToY(db)))
    ctx.strokeStyle = '#c9a96e'; ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'; ctx.stroke()

    // Freq range markers
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = 'rgba(201,169,110,0.3)'; ctx.lineWidth = 0.8
    ;[freqLow, freqHigh].forEach(f => {
      const x = logToX(f)
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + plotH); ctx.stroke()
    })
    ctx.setLineDash([])

    // Labels
    ctx.fillStyle = 'rgba(201,169,110,0.6)'
    ctx.font = '8px DM Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${freqLow}Hz`, logToX(freqLow), PAD.t - 6)
    ctx.fillText(`${freqHigh >= 1000 ? freqHigh/1000 + 'kHz' : freqHigh + 'Hz'}`, logToX(freqHigh), PAD.t - 6)

  }, [freqLow, freqHigh, sensitivity])

  return <canvas ref={canvasRef} className="eq-canvas" style={{ width: '100%', height: '200px', display: 'block' }}/>
}

// ── 3D VIEWER ─────────────────────────────────────────────────────────────────
function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Always check if already loaded correctly first
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load: ${src}`))
    document.head.appendChild(s)
  })
}

function ModelViewer({ modelUrl, productName, arUrl }: { modelUrl: string; productName: string; arUrl?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading')

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let animId: number
    let renderer: any
    let cancelled = false

    const init = async () => {
      console.log('[3D] modelUrl:', modelUrl)
      try {
        const THREE_CORE = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'
        const GLTF_URL   = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'
        const ORBIT_URL  = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'

        // Step 1: core Three.js
        if (!(window as any).THREE) {
          await injectScript(THREE_CORE)
        }
        const THREE = (window as any).THREE
        if (!THREE) throw new Error('THREE not on window after load')

        // Step 2: GLTFLoader (attaches to window.THREE.GLTFLoader)
        if (!THREE.GLTFLoader) {
          await injectScript(GLTF_URL)
          // Give it a tick to execute
          await new Promise(r => setTimeout(r, 50))
        }
        console.log('[3D] GLTFLoader:', typeof THREE.GLTFLoader)
        if (!THREE.GLTFLoader) throw new Error('GLTFLoader still missing')

        // Step 3: OrbitControls (attaches to window.THREE.OrbitControls)
        if (!THREE.OrbitControls) {
          await injectScript(ORBIT_URL)
          await new Promise(r => setTimeout(r, 50))
        }

        if (cancelled) return

        const W = el.offsetWidth || 800
        const H = el.offsetHeight || 520

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.toneMappingExposure = 1.2
        el.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100)
        camera.position.set(0, 0.05, 0.6)

        scene.add(new THREE.AmbientLight(0xffffff, 0.5))
        const key = new THREE.DirectionalLight(0xfff5e0, 2.0)
        key.position.set(2, 3, 2); scene.add(key)
        const fill = new THREE.DirectionalLight(0xc9a96e, 0.4)
        fill.position.set(-2, 1, -1); scene.add(fill)

        const controls = new THREE.OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.06
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.5
        controls.minDistance = 0.1
        controls.maxDistance = 3

        // Strip any hardcoded domain — always serve GLB from current origin via /public/models/
        let resolvedUrl = modelUrl
        if (modelUrl.includes('/models/')) {
          // Extract just the filename and serve locally
          const filename = modelUrl.split('/models/').pop()
          resolvedUrl = `/models/${filename}`
        } else if (!modelUrl.startsWith('http')) {
          resolvedUrl = modelUrl.startsWith('/') ? modelUrl : `/${modelUrl}`
        }
        console.log('Loading GLB from:', resolvedUrl)

        new THREE.GLTFLoader().load(
          resolvedUrl,
          (gltf: any) => {
            if (cancelled) return
            const model = gltf.scene
            const box = new THREE.Box3().setFromObject(model)
            const centre = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            model.position.sub(centre)
            model.scale.setScalar(0.3 / Math.max(size.x, size.y, size.z))
            scene.add(model)
            setStatus('ready')
          },
          undefined,
          (err: any) => { console.error('GLB load error:', err); setStatus('error') }
        )

        const animate = () => {
          animId = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()

      } catch (e) {
        console.error('3D viewer error:', e)
        if (!cancelled) setStatus('error')
      }
    }

    init()
    return () => {
      cancelled = true
      cancelAnimationFrame(animId)
      if (renderer?.domElement && el.contains(renderer.domElement)) {
        renderer.dispose()
        el.removeChild(renderer.domElement)
      }
    }
  }, [modelUrl])

  const handleAR = () => {
    const glbUrl = arUrl || modelUrl || ''
    const full = glbUrl.startsWith('/') ? window.location.origin + glbUrl : glbUrl
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const a = Object.assign(document.createElement('a'), { href: full, rel: 'ar', download: 'model.glb' })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } else {
      window.location.href = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(full)}&mode=ar_preferred#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`
    }
  }

  return (
    <div className="model-viewer-wrap">
      <div ref={mountRef} className="model-canvas-wrap"/>
      {status === 'loading' && (
        <div className="model-loading"><div className="model-loading-dot"/><span>Loading model…</span></div>
      )}
      {status === 'error' && (
        <div className="model-loading"><span style={{color:'#333'}}>3D model unavailable</span></div>
      )}
      <div className="model-controls-hint">Drag to rotate · Scroll to zoom</div>
      {(arUrl || modelUrl) && (
        <button className="model-ar-btn" onClick={handleAR}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          View in AR
        </button>
      )}
    </div>
  )
}

// ── CALLOUT ANNOTATIONS (for when no 3D model) ───────────────────────────────
function AnnotatedImage({ imgUrl, productName, badges }: { imgUrl: string; productName: string; badges: string[] }) {
  const annotations = badges.slice(0, 4).map((badge, i) => {
    const positions = [
      { x: '22%', y: '35%', lx: '5%',  ly: '28%', align: 'right' as const },
      { x: '75%', y: '30%', lx: '82%', ly: '22%', align: 'left' as const },
      { x: '30%', y: '70%', lx: '5%',  ly: '68%', align: 'right' as const },
      { x: '72%', y: '65%', lx: '82%', ly: '68%', align: 'left' as const },
    ]
    return { ...positions[i], badge }
  })

  return (
    <div className="annotated-img-wrap">
      <img src={imgUrl} alt={productName} className="annotated-img"/>
      <svg className="annotated-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {annotations.map((a, i) => {
          const isLeft = a.align === 'left'
          const lx = parseFloat(a.lx)
          const ly = parseFloat(a.ly)
          const px = parseFloat(a.x)
          const py = parseFloat(a.y)
          return (
            <g key={i}>
              <circle cx={px} cy={py} r="0.8" fill="#c9a96e" opacity="0.8"/>
              <line
                x1={px} y1={py} x2={lx} y2={ly}
                stroke="#c9a96e" strokeWidth="0.2" opacity="0.5"
                strokeDasharray="1 0.5"/>
              <line
                x1={lx} y1={ly} x2={isLeft ? lx + 12 : lx - 12} y2={ly}
                stroke="#c9a96e" strokeWidth="0.2" opacity="0.5"/>
            </g>
          )
        })}
      </svg>
      {annotations.map((a, i) => (
        <div key={i} className="annotated-label"
          style={{
            left: a.align === 'left' ? `calc(${a.lx} + 13%)` : undefined,
            right: a.align === 'right' ? `calc(${100 - parseFloat(a.lx)}% + 13%)` : undefined,
            top: a.ly,
            textAlign: a.align,
          }}>
          <div className="annotated-label-text">{TECH_MAP[a.badge]?.label || a.badge}</div>
          <div className="annotated-label-desc">{TECH_MAP[a.badge]?.desc}</div>
        </div>
      ))}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ProductDetail({ product }: { product: Product }) {
  const [activeGallery, setActiveGallery] = useState(0)

  const heroImgUrl = getImageUrl(product.heroImage, 1600)
  const badges = product.proprietaryTechBadges?.split(',').map(s => s.trim()).filter(Boolean) || []
  const isAmp = product.category?.slug?.current === 'amplifier-series'
  const isSub = product.category?.slug?.current === 'subwoofer-series'
  const mountingMethodsList = product.mountingMethods
    ? (Array.isArray(product.mountingMethods)
        ? product.mountingMethods
        : product.mountingMethods.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean))
    : []
  const hasMount = mountingMethodsList.length > 0
  const galleryAll = [...(product.galleryImages || []), ...(product.lifestyleImages || [])]
  const itemsInBoxList = product.itemsInBox
    ? (Array.isArray(product.itemsInBox)
        ? product.itemsInBox
        : product.itemsInBox.split(/\n/).map((s: string) => s.trim()).filter(Boolean))
    : []
  const hasDownloads = product.cadFile
  const hasEQ = product.freqLowHz && product.freqHighHz
  const hasEqData = !!product.eqData

  // Three.js loads inside ModelViewer via esm.sh dynamic import

  // Spec rows helper
  const specRow = (label: string, value: any, unit = '') =>
    value != null ? { label, value: `${value}${unit}` } : null

  const acousticSpecs = [
    specRow('Power RMS', product.powerRmsW, 'W'),
    specRow('Power Peak', product.powerPeakW, 'W'),
    specRow('Total Power', product.totalPowerW, 'W'),
    specRow('Channels', product.channelCount),
    specRow('Amp Class', product.ampClass),
    specRow('Impedance', product.impedanceOhms, 'Ω'),
    specRow('Sensitivity', product.sensitivityDb, 'dB'),
    product.freqLowHz && product.freqHighHz
      ? { label: 'Frequency', value: `${product.freqLowHz}Hz – ${product.freqHighHz >= 1000 ? product.freqHighHz/1000 + 'kHz' : product.freqHighHz + 'Hz'}${product.freqQualifier ? ' ' + product.freqQualifier : ''}` }
      : null,
    specRow('Driver', product.driverSize ? `${product.driverCount || 1} × ${product.driverSize}` : product.driverCount),
    specRow('Driver Material', product.driverMaterial),
    specRow('Tweeter', product.tweeterSize ? `${product.tweeterCount || 1} × ${product.tweeterSize}` : null),
  ].filter(Boolean) as { label: string; value: string }[]

  const physicalSpecs = [
    product.heightMm && product.widthMm && product.depthMm
      ? { label: 'Dimensions', value: `${product.heightMm} × ${product.widthMm} × ${product.depthMm} mm` }
      : null,
    product.diameterMm ? { label: 'Diameter', value: `${product.diameterMm} mm` } : null,
    specRow('Weight', product.weightKg, 'kg'),
    specRow('Housing', product.housingMaterial),
    specRow('Finish', product.finish),
    specRow('Colours', product.colorsStandard),
    product.customRalAvailable ? { label: 'Custom RAL', value: 'Available' } : null,
    specRow('Power Type', product.powerType),
    specRow('IP Rating', product.ipRating),
    specRow('Mounting', product.mountingMethod),
    product.cutoutHeightMm && product.cutoutWidthMm
      ? { label: 'Cutout', value: `${product.cutoutHeightMm} × ${product.cutoutWidthMm} mm` }
      : null,
    product.cutoutDiameterMm
      ? { label: 'Cutout Ø', value: `${product.cutoutDiameterMm} mm` }
      : null,
    specRow('Cavity Depth', product.requiredCavityDepthMm, 'mm'),
    product.paintableGrille != null
      ? { label: 'Paintable Grille', value: product.paintableGrille ? 'Yes' : 'No' }
      : null,
    specRow('Grille Material', product.grilleMaterial),
    specRow('Fire Rating', product.fireRating),
    product.tweeterAimable ? { label: 'Aimable Tweeter', value: 'Yes' } : null,
    specRow('Crossover', product.crossoverType),
    specRow('IP Rating', product.ipRating),
  ].filter(Boolean) as { label: string; value: string }[]

  // Electronics / connectivity specs (amplifiers)
  const connectivitySpecs = [
    specRow('Inputs', product.inputs),
    specRow('Outputs', product.outputs),
    specRow('Wireless', product.wirelessConnectivity),
    specRow('Network', product.networkProtocol),
    specRow('Control', product.controlProtocol),
    specRow('DSP', product.dspProcessorSpec),
    specRow('Streaming', product.streamingProtocols),
    specRow('THD+N', product.thdN),
    specRow('SNR', product.snrDb),
    specRow('Protection', product.protectionFeatures),
    product.rackMountable ? { label: 'Rack Mount', value: product.rackUnitSize || 'Yes' } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="pd-page">


      

      {/* ── HERO ── */}
      <section className="pd-hero">
        <div className="pd-hero-content">
          <div className="pd-hero-left">
            <div className="pd-breadcrumb">
              <a href="/products" className="pd-bc-link">Products</a>
              <span className="pd-bc-sep">·</span>
              <a href={`/products?cat=${product.category?.slug?.current}`} className="pd-bc-link">
                {product.category?.name}
              </a>
            </div>
            <div className="pd-hero-series">{product.series || product.subCategory}</div>
            <h1 className="pd-hero-name">{product.productName}</h1>
            {product.productFullName && product.productFullName !== product.productName && (
              <div className="pd-hero-fullname">{product.productFullName}</div>
            )}
            {product.tagline && <div className="pd-hero-tagline">{product.tagline}</div>}

            {/* Key specs pills */}
            <div className="pd-hero-pills">
              {product.powerRmsW && <span className="pd-pill">{product.powerRmsW}W</span>}
              {product.totalPowerW && <span className="pd-pill">{product.totalPowerW}W</span>}
              {product.impedanceOhms && <span className="pd-pill">{product.impedanceOhms}Ω</span>}
              {product.sensitivityDb && <span className="pd-pill">{product.sensitivityDb}dB</span>}
              {product.freqLowHz && product.freqHighHz && (
                <span className="pd-pill">
                  {product.freqLowHz}Hz – {product.freqHighHz >= 1000 ? product.freqHighHz/1000 + 'kHz' : product.freqHighHz + 'Hz'}
                </span>
              )}
              {product.powerType && <span className="pd-pill">{product.powerType}</span>}
            </div>

            {/* CTAs */}
            <div className="pd-hero-ctas">
              <a href="https://configurator.xscace.com" target="_blank" rel="noopener noreferrer"
                className="btn-prim" style={{color:'#000'}}>
                Add to System →
              </a>
              {product.specSheet && (
                <a href={getFileUrl(product.specSheet) || '#'} target="_blank" rel="noopener noreferrer"
                  className="pd-ghost-btn">
                  Spec Sheet ↓
                </a>
              )}
            </div>
          </div>

          {/* Hero image / video */}
          <div className="pd-hero-right">
            {product.heroVideo ? (
              <div className="pd-hero-video-wrap">
                {(product.heroVideo.includes('youtube') || product.heroVideo.includes('youtu.be')) ? (
                  <iframe className="pd-hero-iframe"
                    src={`https://www.youtube.com/embed/${
                      product.heroVideo.includes('youtu.be/')
                        ? product.heroVideo.split('youtu.be/')[1]?.split('?')[0]
                        : product.heroVideo.split('v=')[1]?.split('&')[0]
                    }?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playlist=${
                      product.heroVideo.includes('youtu.be/')
                        ? product.heroVideo.split('youtu.be/')[1]?.split('?')[0]
                        : product.heroVideo.split('v=')[1]?.split('&')[0]
                    }`}
                    allow="autoplay; fullscreen" allowFullScreen frameBorder="0"
                  />
                ) : product.heroVideo.includes('vimeo') ? (
                  <iframe className="pd-hero-iframe"
                    src={`https://player.vimeo.com/video/${product.heroVideo.split('vimeo.com/')[1]?.split('?')[0]}?autoplay=1&muted=1&loop=1&background=1`}
                    allow="autoplay; fullscreen" allowFullScreen frameBorder="0"
                  />
                ) : (
                  <video className="pd-hero-video" src={product.heroVideo} autoPlay muted loop playsInline/>
                )}
              </div>
            ) : heroImgUrl ? (
              <img src={heroImgUrl} alt={product.productName} className="pd-hero-img"/>
            ) : (
              <div className="pd-hero-img-empty">
                <span>{product.productName[0]}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      

            {/* ── WOW: TECH SHOWCASE ── */}
      <section className="pd-section pd-wow-section">
        <TechShowcase
          productId={product._id}
          productName={product.productName}
          modelUrl={product.model3dUrl || `/models/${product.slug?.current}.glb`}
          badges={badges}
          heroImgUrl={heroImgUrl}
        />
      </section>

      {/* ── TECH BADGES ── */}
      {badges.length > 0 && (
        <section className="pd-section pd-tech-section">
          <div className="pd-section-inner">
            <div className="pd-section-ey">Proprietary Technology</div>
            <h2 className="pd-section-title">Built different. <em>By design.</em></h2>
          </div>
          <div className="pd-tech-grid">
            {badges.map(badge => {
              const tech = TECH_MAP[badge]
              return (
                <div key={badge} className="pd-tech-card">
                  <div className="pd-tech-bar"/>
                  <div className="pd-tech-name">{tech?.label || badge}</div>
                  <div className="pd-tech-desc">{tech?.desc || ''}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      

      {/* ── EQ CURVE ── */}
      {hasEQ && (
        <section className="pd-section pd-eq-section">
          <div className="pd-section-inner">
            <div className="pd-section-ey">Frequency Response</div>
            <h2 className="pd-section-title">
              {product.freqLowHz}Hz – {product.freqHighHz! >= 1000
                ? product.freqHighHz! / 1000 + 'kHz'
                : product.freqHighHz + 'Hz'}
              {product.freqQualifier && <em> {product.freqQualifier}</em>}
            </h2>
          </div>
          <div className="pd-eq-wrap">
            <EQCurve
              freqLow={product.freqLowHz!}
              freqHigh={product.freqHighHz!}
              sensitivity={product.sensitivityDb}
              eqData={product.eqData}
            />
          </div>
        </section>
      )}

      

      {/* ── SETUPS ── */}
      <section className="pd-section pd-setups-section">
        <div className="pd-section-inner">
          <div className="pd-section-ey">In Use</div>
          <h2 className="pd-section-title">Common <em>installations</em></h2>
        </div>
        <div className="pd-setups-grid">

          {/* Living Room */}
          <div className="pd-setup-card">
            <div className="pd-setup-label">Stereo / Living Room</div>
            <div className="pd-setup-chain">
              <div className="pd-setup-product">
                <div className="pd-setup-product-img">
                  {heroImgUrl
                    ? <img src={heroImgUrl} alt={product.productName}/>
                    : <div className="pd-setup-product-ph">{product.productName[0]}</div>
                  }
                </div>
                <div className="pd-setup-product-name">{product.productName}</div>
                <div className="pd-setup-product-qty">× 2</div>
              </div>
              {product.powerType === 'Passive' && (
                <>
                  <div className="pd-setup-arrow">+</div>
                  <div className="pd-setup-product">
                    <div className="pd-setup-product-img pd-setup-product-img-dark">
                      <svg viewBox="0 0 40 28" fill="none" width="32">
                        <rect x="2" y="2" width="36" height="24" rx="1" stroke="#c9a96e" strokeWidth="0.8"/>
                        {[0,1,2,3].map(i=><rect key={i} x={6+i*8} y={8} width={5} height={8+i*2} rx="0.5" fill="#c9a96e" opacity={0.2+i*0.1}/>)}
                      </svg>
                    </div>
                    <div className="pd-setup-product-name">Xylem DSP</div>
                    <div className="pd-setup-product-qty">Amplifier</div>
                  </div>
                </>
              )}
              {product.recommendedPairingPrimary && [product.recommendedPairingPrimary].slice(0,1).map((p: any) => {
                const pImg = getImageUrl(p.heroImage, 200)
                return (
                  <div key={p._id} className="pd-setup-arrow-group">
                    <div className="pd-setup-arrow">+</div>
                    <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`}
                      className="pd-setup-product pd-setup-product-link">
                      <div className="pd-setup-product-img">
                        {pImg ? <img src={pImg} alt={p.productName}/> : <div className="pd-setup-product-ph">{p.productName[0]}</div>}
                      </div>
                      <div className="pd-setup-product-name">{p.productName}</div>
                      <div className="pd-setup-product-qty">{p.series || 'Paired product'}</div>
                    </a>
                  </div>
                )
              })}
            </div>
            <div className="pd-setup-note">
              {product.powerType === 'Passive' ? 'Requires external amplification · ' : 'Self-powered · '}
              {product.recommendedCrossoverHz ? `Crossover at ${product.recommendedCrossoverHz}Hz` : 'Full-range'}
            </div>
          </div>

          {/* Home Cinema */}
          <div className="pd-setup-card">
            <div className="pd-setup-label">Home Cinema · 5.1</div>
            <div className="pd-setup-chain">
              <div className="pd-setup-product">
                <div className="pd-setup-product-img">
                  {heroImgUrl
                    ? <img src={heroImgUrl} alt={product.productName}/>
                    : <div className="pd-setup-product-ph">{product.productName[0]}</div>
                  }
                </div>
                <div className="pd-setup-product-name">{product.productName}</div>
                <div className="pd-setup-product-qty">× 5</div>
              </div>
              {product.compatibleSubwoofers?.slice(0,1).map((p: any) => {
                const pImg = getImageUrl(p.heroImage, 200)
                return (
                  <div key={p._id} className="pd-setup-arrow-group">
                    <div className="pd-setup-arrow">+</div>
                    <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`}
                      className="pd-setup-product pd-setup-product-link">
                      <div className="pd-setup-product-img">
                        {pImg ? <img src={pImg} alt={p.productName}/> : <div className="pd-setup-product-ph">{p.productName[0]}</div>}
                      </div>
                      <div className="pd-setup-product-name">{p.productName}</div>
                      <div className="pd-setup-product-qty">Subwoofer</div>
                    </a>
                  </div>
                )
              })}
              {!product.compatibleSubwoofers?.length && (
                <div className="pd-setup-arrow-group">
                  <div className="pd-setup-arrow">+</div>
                  <div className="pd-setup-product">
                    <div className="pd-setup-product-img pd-setup-product-img-dark">
                      <svg viewBox="0 0 32 32" fill="none" width="24">
                        <rect x="2" y="2" width="28" height="28" rx="1" stroke="#c9a96e" strokeWidth="0.8"/>
                        <circle cx="16" cy="16" r="8" stroke="#c9a96e" strokeWidth="0.7" opacity="0.5"/>
                        <circle cx="16" cy="16" r="3" fill="#c9a96e" opacity="0.3"/>
                      </svg>
                    </div>
                    <div className="pd-setup-product-name">Juniper</div>
                    <div className="pd-setup-product-qty">Subwoofer</div>
                  </div>
                </div>
              )}
              {product.compatibleAmplifiers?.slice(0,1).map((p: any) => {
                const pImg = getImageUrl(p.heroImage, 200)
                return (
                  <div key={p._id} className="pd-setup-arrow-group">
                    <div className="pd-setup-arrow">+</div>
                    <a href={`/products/${p.category?.slug?.current}/${p.slug?.current}`}
                      className="pd-setup-product pd-setup-product-link">
                      <div className="pd-setup-product-img">
                        {pImg ? <img src={pImg} alt={p.productName}/> : <div className="pd-setup-product-ph">{p.productName[0]}</div>}
                      </div>
                      <div className="pd-setup-product-name">{p.productName}</div>
                      <div className="pd-setup-product-qty">Amplifier</div>
                    </a>
                  </div>
                )
              })}
              {!product.compatibleAmplifiers?.length && product.powerType === 'Passive' && (
                <div className="pd-setup-arrow-group">
                  <div className="pd-setup-arrow">+</div>
                  <div className="pd-setup-product">
                    <div className="pd-setup-product-img pd-setup-product-img-dark">
                      <svg viewBox="0 0 40 28" fill="none" width="32">
                        <rect x="2" y="2" width="36" height="24" rx="1" stroke="#c9a96e" strokeWidth="0.8"/>
                        {[0,1,2,3].map(i=><rect key={i} x={6+i*8} y={8} width={5} height={8+i*2} rx="0.5" fill="#c9a96e" opacity={0.2+i*0.1}/>)}
                      </svg>
                    </div>
                    <div className="pd-setup-product-name">Xylem DSP</div>
                    <div className="pd-setup-product-qty">Amplifier</div>
                  </div>
                </div>
              )}
            </div>
            <div className="pd-setup-note">
              Phantom centre · All channels driven by Xylem DSP
              {product.recommendedCrossoverHz ? ` · High-pass at ${product.recommendedCrossoverHz}Hz` : ''}
            </div>
          </div>

        </div>
      </section>

      

      {/* ── RIGGING & MOUNTS ── */}
      {hasMount && (
        <section className="pd-section pd-mounts-section">
          <div className="pd-section-inner">
            <div className="pd-section-ey">Mounting Options</div>
            <h2 className="pd-section-title">Every <em>configuration</em></h2>
          </div>

          {/* Installation diagram images from Sanity */}
          {product.installationDiagramImages && product.installationDiagramImages.length > 0 && (
            <div className="pd-install-diagrams">
              {product.installationDiagramImages.map((img: any, i: number) => {
                const url = getImageUrl(img, 800)
                if (!url) return null
                return (
                  <div key={i} className="pd-install-diagram">
                    <img src={url} alt={`${product.productName} installation ${i + 1}`}/>
                    {img.alt && <div className="pd-install-diagram-label">{img.alt}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Mount method cards */}
          <div className="pd-mounts-grid">
            {mountingMethodsList.map((method: string) => (
              <div key={method} className="pd-mount-card">
                <div className="pd-mount-icon">
                  <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
                    {method.toLowerCase().includes('corner') ? (
                      <>
                        <path d="M4 4 L44 4 L44 44" stroke="#c9a96e" strokeWidth="1" opacity="0.4"/>
                        <rect x="30" y="4" width="8" height="16" rx="1" fill="rgba(201,169,110,0.1)" stroke="#c9a96e" strokeWidth="0.7"/>
                      </>
                    ) : method.toLowerCase().includes('floor') || method.toLowerCase().includes('stand') ? (
                      <>
                        <line x1="24" y1="40" x2="24" y2="16" stroke="#c9a96e" strokeWidth="1" opacity="0.4"/>
                        <rect x="16" y="4" width="16" height="14" rx="1" fill="rgba(201,169,110,0.1)" stroke="#c9a96e" strokeWidth="0.7"/>
                        <line x1="12" y1="40" x2="36" y2="40" stroke="#c9a96e" strokeWidth="1" opacity="0.4"/>
                      </>
                    ) : method.toLowerCase().includes('ceiling') ? (
                      <>
                        <line x1="24" y1="4" x2="24" y2="18" stroke="#c9a96e" strokeWidth="1" opacity="0.4"/>
                        <circle cx="24" cy="28" r="10" fill="rgba(201,169,110,0.08)" stroke="#c9a96e" strokeWidth="0.7"/>
                        <circle cx="24" cy="28" r="4" fill="rgba(201,169,110,0.15)"/>
                      </>
                    ) : (
                      <>
                        <rect x="4" y="16" width="8" height="16" rx="1" fill="rgba(201,169,110,0.1)" stroke="#c9a96e" strokeWidth="0.7"/>
                        <rect x="16" y="12" width="16" height="24" rx="1" fill="rgba(201,169,110,0.08)" stroke="#c9a96e" strokeWidth="0.7"/>
                      </>
                    )}
                  </svg>
                </div>
                <div className="pd-mount-name">{method}</div>
              </div>
            ))}
          </div>

          {/* Cutout dimensions */}
          {(product.cutoutHeightMm || product.cutoutDiameterMm) && (
            <div className="pd-mount-dims">
              <div className="pd-spec-col-title">Cutout Dimensions</div>
              {product.cutoutDiameterMm && (
                <div className="pd-spec-row">
                  <span className="pd-spec-label">Diameter</span>
                  <span className="pd-spec-value">{product.cutoutDiameterMm}mm</span>
                </div>
              )}
              {product.cutoutHeightMm && product.cutoutWidthMm && (
                <div className="pd-spec-row">
                  <span className="pd-spec-label">H × W</span>
                  <span className="pd-spec-value">{product.cutoutHeightMm} × {product.cutoutWidthMm}mm</span>
                </div>
              )}
              {product.requiredCavityDepthMm && (
                <div className="pd-spec-row">
                  <span className="pd-spec-label">Cavity depth</span>
                  <span className="pd-spec-value">{product.requiredCavityDepthMm}mm</span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      

      {/* ── DOWNLOADS ── */}
      {hasDownloads && (
        <section className="pd-section pd-downloads-section">
          <div className="pd-section-inner">
            <div className="pd-section-ey">Technical Documents</div>
            <h2 className="pd-section-title">Downloads</h2>
          </div>
          <div className="pd-downloads-grid">

            {product.specSheet && (() => {
              const url = getFileUrl(product.specSheet)
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="pd-download-card">
                  <div className="pd-dl-top">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" width="28" height="28">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <polyline points="9 15 12 18 15 15"/>
                    </svg>
                    <span className="pd-dl-ext">PDF</span>
                  </div>
                  <div className="pd-dl-name">Product Brochure</div>
                  <div className="pd-dl-desc">Full specifications, features and technical data</div>
                  <div className="pd-dl-cta">Download →</div>
                </a>
              ) : null
            })()}

            {product.installGuide && (() => {
              const url = getFileUrl(product.installGuide)
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="pd-download-card">
                  <div className="pd-dl-top">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" width="28" height="28">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="8" y1="13" x2="16" y2="13"/>
                      <line x1="8" y1="17" x2="16" y2="17"/>
                      <line x1="8" y1="9" x2="10" y2="9"/>
                    </svg>
                    <span className="pd-dl-ext">PDF</span>
                  </div>
                  <div className="pd-dl-name">Installation Manual</div>
                  <div className="pd-dl-desc">Step-by-step installation and setup guide</div>
                  <div className="pd-dl-cta">Download →</div>
                </a>
              ) : null
            })()}

            {product.cadFile && (() => {
              const url = getFileUrl(product.cadFile)
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="pd-download-card">
                  <div className="pd-dl-top">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" width="28" height="28">
                      <rect x="3" y="3" width="18" height="18" rx="1"/>
                      <path d="M3 9h18M9 21V9"/>
                    </svg>
                    <span className="pd-dl-ext">DWG</span>
                  </div>
                  <div className="pd-dl-name">CAD Drawing</div>
                  <div className="pd-dl-desc">AutoCAD file for architectural and technical drawings</div>
                  <div className="pd-dl-cta">Download →</div>
                </a>
              ) : null
            })()}

          </div>
        </section>
      )}

    </div>
  )
}