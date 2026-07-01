'use client'

import { useEffect, useRef, useState } from 'react'
import ModelReveal from './ModelReveal'
import { TECH_ICONS } from './techIcons'

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
  heroVideoFile?: { asset?: { _ref?: string } }
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
  'Nano Resonance':       { label: 'Nano Resonance',       desc: 'Heavy cone mass lowers resonant frequency below what cabinet volume alone achieves. Defies Hoffmans Iron Law at 12mm depth.' },
  'PowerDense Dynamics':  { label: 'PowerDense Dynamics',  desc: 'Copper-silver composite voice coil dissipates heat faster than copper alone — sustaining output under continuous high-power drive.' },
  'AeroFrame Chassis':    { label: 'AeroFrame Chassis',    desc: '6061-T6 aerospace aluminium machined as passive heatsink. Conducts heat from voice coil without forced cooling.' },
  'PrecisionXover Array': { label: 'PrecisionXover Array', desc: 'Air-core inductors and polypropylene capacitors in a miniaturised crossover achieving +/-0.5dB tolerance at the crossover point.' },
  'XS-Flow':              { label: 'XS-Flow',              desc: 'Micro-waveguides inside the enclosure control internal standing waves and channel airflow — extending bass output in a 12mm cavity.' },
  'PsySculpt':            { label: 'PsySculpt',            desc: 'ADAU1701 DSP implements Fletcher-Munson equal-loudness compensation for consistent perceived tone at any volume level.' },
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
function EQCurve({ freqLow, freqHigh, sensitivity, eqData }: {
  freqLow: number; freqHigh: number; sensitivity?: number; eqData?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)

    const PAD = { l: 52, r: 28, t: 24, b: 40 }
    const plotW = W - PAD.l - PAD.r
    const plotH = H - PAD.t - PAD.b

    // Log frequency mapping
    const xMin = Math.min(fLo * 0.4, 20)
    const xMax = Math.max(fHi * 3, fHi + 200)
    const logToX = (f: number) => PAD.l + (Math.log10(f / xMin) / Math.log10(xMax / xMin)) * plotW
    // dB axis: -30 to +12dB range
    const DB_MIN = -30, DB_MAX = 12
    const dbToY = (db: number) => PAD.t + plotH * (1 - (db - DB_MIN) / (DB_MAX - DB_MIN))

    // ── Parse EQ filters from eqData CSV ──
    // Format: freq,gain,type,q  OR  HP/LP,freq,q (high/low pass)
    // Types: PK=peaking, LS=low shelf, HS=high shelf, HP=high pass, LP=low pass
    type Filter = { type: string; freq: number; gain: number; q: number }
    const filters: Filter[] = []
    let hpFreq = freqLow, hpQ = 0.7
    let lpFreq = freqHigh

    if (eqData) {
      const lines = eqData.trim().split('\n').slice(1) // skip header
      for (const line of lines) {
        const parts = line.trim().split(',')
        if (parts.length < 2) continue
        const [a, b, c, d] = parts
        if (a === 'HP' || a === 'LP') {
          // High/Low pass: HP,freq,q
          if (a === 'HP') { hpFreq = parseFloat(b); hpQ = parseFloat(c) || 0.7 }
          if (a === 'LP') { lpFreq = parseFloat(b) }
        } else {
          // PK/LS/HS: freq,gain,type,q
          filters.push({ type: c || 'PK', freq: parseFloat(a), gain: parseFloat(b), q: parseFloat(d) || 1 })
        }
      }
    }

    // ── Biquad filter response calculation ──
    // Standard biquad magnitude response at frequency f given sample rate Fs=48000
    const Fs = 48000
    const biquadMag = (f: Filter, freq: number): number => {
      const w = 2 * Math.PI * freq / Fs
      const A = Math.pow(10, f.gain / 40)
      const w0 = 2 * Math.PI * f.freq / Fs
      const alpha = Math.sin(w0) / (2 * f.q)
      let b0, b1, b2, a0, a1, a2

      if (f.type === 'PK') {
        b0 = 1 + alpha * A; b1 = -2 * Math.cos(w0); b2 = 1 - alpha * A
        a0 = 1 + alpha / A; a1 = -2 * Math.cos(w0); a2 = 1 - alpha / A
      } else if (f.type === 'LS') {
        b0 = A * ((A+1) - (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha)
        b1 = 2*A * ((A-1) - (A+1)*Math.cos(w0))
        b2 = A * ((A+1) - (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha)
        a0 = (A+1) + (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha
        a1 = -2 * ((A-1) + (A+1)*Math.cos(w0))
        a2 = (A+1) + (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha
      } else if (f.type === 'HS') {
        b0 = A * ((A+1) + (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha)
        b1 = -2*A * ((A-1) + (A+1)*Math.cos(w0))
        b2 = A * ((A+1) + (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha)
        a0 = (A+1) - (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha
        a1 = 2 * ((A-1) - (A+1)*Math.cos(w0))
        a2 = (A+1) - (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha
      } else {
        return 0
      }
      // Evaluate H(e^jw) magnitude in dB
      const cosw = Math.cos(w), cos2w = Math.cos(2*w)
      const sinw = Math.sin(w), sin2w = Math.sin(2*w)
      const numR = b0 + b1*cosw + b2*cos2w
      const numI = -b1*sinw - b2*sin2w
      const denR = a0 + a1*cosw + a2*cos2w
      const denI = -a1*sinw - a2*sin2w
      const mag2 = (numR*numR + numI*numI) / (denR*denR + denI*denI)
      return 10 * Math.log10(Math.max(mag2, 1e-10))
    }

    // High-pass roll-off below hpFreq (Butterworth 2nd order approximation)
    const hpMag = (freq: number): number => {
      const ratio = freq / hpFreq
      const db = 20 * Math.log10(ratio * ratio / Math.sqrt(1 + Math.pow(ratio / hpQ, 4)))
      return Math.max(db, -40)
    }

    // ── Draw grid ──
    const freqTicks = [20, 30, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000, 20000].filter(f => f >= xMin * 0.8 && f <= xMax * 1.2)
    const dbTicks = [-24, -18, -12, -6, 0, 6]

    ctx.strokeStyle = 'rgba(201,169,110,0.05)'
    ctx.lineWidth = 0.5
    freqTicks.forEach(f => {
      if (f < xMin * 0.8 || f > xMax * 1.2) return
      const x = logToX(f)
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + plotH); ctx.stroke()
      ctx.fillStyle = 'rgba(201,169,110,0.3)'
      ctx.font = '8px DM Mono, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(f >= 1000 ? `${f/1000}k` : `${f}`, x, PAD.t + plotH + 16)
    })
    dbTicks.forEach(db => {
      const y = dbToY(db)
      if (y < PAD.t || y > PAD.t + plotH) return
      ctx.strokeStyle = db === 0 ? 'rgba(201,169,110,0.15)' : 'rgba(201,169,110,0.05)'
      ctx.lineWidth = db === 0 ? 0.8 : 0.5
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + plotW, y); ctx.stroke()
      ctx.fillStyle = 'rgba(201,169,110,0.35)'
      ctx.font = '8px DM Mono, monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${db > 0 ? '+' : ''}${db}`, PAD.l - 8, y + 3)
    })

    // ── Draw actual frequency response ──
    const STEPS = 400
    const points: [number, number][] = []

    for (let i = 0; i <= STEPS; i++) {
      const f = xMin * Math.pow(xMax / xMin, i / STEPS)
      let db = 0

      // Apply high-pass roll-off
      if (f < hpFreq * 2) db += hpMag(f)

      // Apply each EQ filter
      for (const filter of filters) {
        db += biquadMag(filter, f)
      }

      // Hard clip below freqLow and above freqHigh
      if (f < freqLow * 0.5) db += -40 * Math.pow(Math.log2(freqLow * 0.5 / f), 1.5)
      if (f > freqHigh * 1.5) db += -20 * Math.pow(Math.log2(f / (freqHigh * 1.5)), 1.5)

      db = Math.max(db, DB_MIN - 2)
      points.push([logToX(f), dbToY(db)])
    }

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + plotH)
    grad.addColorStop(0, 'rgba(201,169,110,0.18)')
    grad.addColorStop(0.5, 'rgba(201,169,110,0.06)')
    grad.addColorStop(1, 'rgba(201,169,110,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(points[0][0], PAD.t + plotH)
    points.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.lineTo(points[points.length-1][0], PAD.t + plotH)
    ctx.closePath()
    ctx.fill()

    // Curve line
    ctx.strokeStyle = 'rgba(201,169,110,0.7)'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
    ctx.stroke()

    // Mark freq limits
    ;[freqLow, freqHigh].forEach(f => {
      const x = logToX(f)
      ctx.strokeStyle = 'rgba(201,169,110,0.25)'
      ctx.lineWidth = 0.8
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + plotH); ctx.stroke()
      ctx.setLineDash([])
    })

    // Labels
    ctx.font = '8px DM Mono, monospace'
    ctx.fillStyle = 'rgba(201,169,110,0.4)'
    ctx.textAlign = 'left'
    ctx.fillText('dB', 4, PAD.t - 8)

  }, [freqLow, freqHigh, sensitivity, eqData])

  return <canvas ref={canvasRef} className="pd-eq-canvas" style={{ width: '100%', height: '220px', display: 'block' }}/>
}


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



// ── AR WALL BUTTON ────────────────────────────────────────────────────────────
// Mobile: model-viewer hidden element → activateAR() (requires user gesture ✓)
// Desktop: QR code pointing to this page → user taps button on phone
function ARWallBtn({ modelUrl, productName, productId }: { modelUrl: string; productName: string; productId?: string }) {
  const [open, setOpen]       = useState(false)
  const [mvLoaded, setMvLoaded] = useState(false)
  const qrMountRef            = useRef<HTMLDivElement>(null)
  const qrDone                = useRef(false)

  const loadMV = (cb: () => void) => {
    if (document.querySelector('script[data-mv]')) { setMvLoaded(true); cb(); return }
    const s = document.createElement('script')
    s.type = 'module'
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
    s.dataset.mv = '1'
    s.onload = () => { setMvLoaded(true); cb() }
    document.head.appendChild(s)
  }

  const triggerAR = () => {
    loadMV(() => {
      // Route GLB through the API so it has correct headers for WebXR
      const glbPath = modelUrl.startsWith('/models/') ? '/api/glb/' + modelUrl.replace('/models/','') : modelUrl
      const src = modelUrl.startsWith('http') ? modelUrl : window.location.origin + glbPath
      const mv  = document.createElement('model-viewer') as any
      mv.src    = src
      mv.setAttribute('ar', '')
      mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
      mv.setAttribute('ar-scale', 'fixed')
      const isXylem  = ['prod-xylem2','prod-xylem3','prod-xylem4'].includes(productId || '')
      const isCedar  = productId === 'prod-cedar'
      mv.setAttribute('ar-placement', isXylem ? 'floor' : 'wall')
      mv.setAttribute('orientation', isXylem ? '0deg 0deg 0deg' : isCedar ? '0deg 0deg 0deg' : '-90deg 0deg -90deg')
      if (isCedar) mv.scale = '0.0254 0.0254 0.0254'
      mv.setAttribute('exposure', '0.05')
      mv.setAttribute('shadow-intensity', '0')
      mv.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;'
      document.body.appendChild(mv)
      mv.addEventListener('load', () => {
        setTimeout(() => mv.activateAR(), 100)
      }, { once: true })
      setTimeout(() => { try { document.body.removeChild(mv) } catch(e){} }, 10000)
    })
  }

  const handleClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      triggerAR()
    } else {
      setOpen(true)
      document.body.style.overflow = 'hidden'
    }
  }

  const handleClose = () => {
    setOpen(false)
    document.body.style.overflow = ''
    qrDone.current = false
    if (qrMountRef.current) qrMountRef.current.innerHTML = ''
  }

  // QR points to this page — user opens it on phone and taps the button
  useEffect(() => {
    if (!open || qrDone.current || !qrMountRef.current) return
    qrDone.current = true
    const url = window.location.href
    const doQR = () => {
      const QRCode = (window as any).QRCode
      if (!QRCode || !qrMountRef.current) return
      qrMountRef.current.innerHTML = ''
      new QRCode(qrMountRef.current, {
        text: url, width: 180, height: 180,
        colorDark: '#c9a96e', colorLight: '#000000',
        correctLevel: QRCode.CorrectLevel.M,
      })
    }
    if ((window as any).QRCode) { doQR(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    s.onload = doQR
    document.head.appendChild(s)
  }, [open])

  return (
    <>
      <button className="ar-wall-btn" onClick={handleClick} aria-label="View it on your wall in AR">
        <span className="ar-wall-scan" aria-hidden="true"/>
        <span className="ar-wall-border-glow" aria-hidden="true"/>
        <span className="ar-wall-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <path d="M1 16 L11 12 L21 16 L21 21 L1 21 Z" stroke="currentColor" strokeWidth="0.7" fill="rgba(201,169,110,0.04)" strokeLinejoin="round"/>
            <path d="M1 16 L1 4 L11 1 L11 12 Z" stroke="currentColor" strokeWidth="0.7" fill="rgba(201,169,110,0.06)" strokeLinejoin="round"/>
            <path d="M21 16 L21 4 L11 1 L11 12 Z" stroke="currentColor" strokeWidth="0.7" fill="rgba(201,169,110,0.03)" strokeLinejoin="round"/>
            <line x1="11" y1="1" x2="11" y2="12" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
            <rect x="4.5" y="6" width="3.5" height="8" rx="0.4" stroke="currentColor" strokeWidth="0.6" opacity="0.5"/>
          </svg>
        </span>
        <span className="ar-wall-label">View it in your space</span>
        <span className="ar-wall-tag">AR</span>
      </button>

      {open && (
        <div className="ar-modal-backdrop" onClick={handleClose}>
          <div className="ar-modal ar-qr-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <div className="ar-modal-title">
                <span className="ar-modal-ey">Augmented Reality</span>
                <span className="ar-modal-name">{productName}</span>
              </div>
              <button className="ar-modal-close" onClick={handleClose} aria-label="Close">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="ar-qr-body">
              <div className="ar-qr-wrap">
                <div className="ar-qr-brackets"><span/><span/><span/><span/></div>
                <div ref={qrMountRef} className="ar-qr-mount"/>
              </div>
              <div className="ar-qr-instructions">
                <div className="ar-qr-step"><span className="ar-qr-num">01</span><span>Open your phone camera</span></div>
                <div className="ar-qr-step"><span className="ar-qr-num">02</span><span>Point it at the QR code</span></div>
                <div className="ar-qr-step"><span className="ar-qr-num">03</span><span>Tap the link to open this page on your phone</span></div>
                <div className="ar-qr-step"><span className="ar-qr-num">04</span><span>Tap <em>"View it on your wall"</em> to place in AR</span></div>
                <div className="ar-qr-compat"><span>iOS 12+ · Android 8+ · No app required</span></div>
              </div>
            </div>
            <div className="ar-modal-footer">
              AR Quick Look on iOS · Scene Viewer on Android · WebXR on supported browsers
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// ── FREQUENCY RESPONSE CHART ─────────────────────────────────────────────────
// Matches the spec sheet PDF exactly: sealed-box HP rolloff + acoustic shaping
// + product EQ biquads, with micro ripple. Pure black background.
function FreqResponseChart({ product }: { product: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { sensitivityDb: sens = 92, freqLowHz: fLo = 150, freqHighHz: fHi = 20000, eqData } = product

  useEffect(() => {
    const canvas = canvasRef.current!
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)

    const FS = 48000
    const PAD = { l: 48, r: 16, t: 24, b: 36 }
    const PW = W - PAD.l - PAD.r, PH = H - PAD.t - PAD.b
    const DB_MIN = sens - 20, DB_MAX = sens + 10
    const LOG_MIN = Math.log10(Math.min(fLo * 0.4, 20))
    const LOG_MAX = Math.log10(Math.max(fHi * 3, fHi + 500))

    const fx  = (f: number) => PAD.l + (Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN) * PW
    const fdb = (db: number) => PAD.t + PH * (1 - (db - DB_MIN) / (DB_MAX - DB_MIN))

    // ── Background ──
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#0e0e0d'
    ctx.fillRect(PAD.l, PAD.t, PW, PH)

    const CHAMP = (a: number) => `rgba(201,169,110,${a})`
    const MUTED = (a: number) => `rgba(107,103,96,${a})`
    const GRID  = '#1a1917'

    // ── Grid ──
    for (let db = Math.ceil(DB_MIN/3)*3; db <= DB_MAX; db += 3) {
      const y = fdb(db)
      if (y < PAD.t - 2 || y > PAD.t + PH + 2) continue
      ctx.strokeStyle = db === sens ? CHAMP(0.2) : GRID
      ctx.lineWidth   = db === sens ? 0.8 : 0.4
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + PW, y); ctx.stroke()
      if (db % 6 === 0 || db === sens) {
        ctx.fillStyle   = db === sens ? CHAMP(0.55) : MUTED(0.5)
        ctx.font        = '8px DM Mono,monospace'
        ctx.textAlign   = 'right'
        ctx.fillText(String(db), PAD.l - 5, y + 3)
      }
    }
    for (const f of [30, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000, 20000].filter(f => Math.log10(f) >= LOG_MIN - 0.1 && Math.log10(f) <= LOG_MAX + 0.1)) {
      const x = fx(f)
      ctx.strokeStyle = GRID; ctx.lineWidth = 0.4
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + PH); ctx.stroke()
      ctx.fillStyle = MUTED(0.5); ctx.font = '8px DM Mono,monospace'; ctx.textAlign = 'center'
      ctx.fillText(f >= 1000 ? f/1000 + 'k' : String(f), x, PAD.t + PH + 14)
    }

    // ── RBJ biquad helpers ──
    const rbj = (type: string, f0: number, gainDb = 0, Q = 0.707): [number[], number[]] => {
      const A  = Math.pow(10, gainDb / 40)
      const w0 = 2 * Math.PI * f0 / FS
      const cw = Math.cos(w0), sw = Math.sin(w0), alpha = sw / (2 * Q)
      let b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0
      if (type === 'HP') {
        b0=(1+cw)/2; b1=-(1+cw); b2=(1+cw)/2; a0=1+alpha; a1=-2*cw; a2=1-alpha
      } else if (type === 'LS') {
        const s2A=2*Math.sqrt(A)*alpha
        b0=A*((A+1)-(A-1)*cw+s2A); b1=2*A*((A-1)-(A+1)*cw); b2=A*((A+1)-(A-1)*cw-s2A)
        a0=(A+1)+(A-1)*cw+s2A; a1=-2*((A-1)+(A+1)*cw); a2=(A+1)+(A-1)*cw-s2A
      } else if (type === 'HS') {
        const s2A=2*Math.sqrt(A)*alpha
        b0=A*((A+1)+(A-1)*cw+s2A); b1=-2*A*((A-1)+(A+1)*cw); b2=A*((A+1)+(A-1)*cw-s2A)
        a0=(A+1)-(A-1)*cw+s2A; a1=2*((A-1)-(A+1)*cw); a2=(A+1)-(A-1)*cw-s2A
      } else if (type === 'PK') {
        b0=1+alpha*A; b1=-2*cw; b2=1-alpha*A; a0=1+alpha/A; a1=-2*cw; a2=1-alpha/A
      } else if (type === 'LP') {
        b0=(1-cw)/2; b1=1-cw; b2=(1-cw)/2; a0=1+alpha; a1=-2*cw; a2=1-alpha
      }
      return [[b0,b1,b2].map(x=>x/a0), [1,a1/a0,a2/a0]]
    }

    const biquadDb = (bq: [number[],number[]], f: number) => {
      const [b,a] = bq
      const w=2*Math.PI*f/FS, c1=Math.cos(w), c2=Math.cos(2*w), s1=Math.sin(w), s2=Math.sin(2*w)
      const nR=b[0]+b[1]*c1+b[2]*c2, nI=-b[1]*s1-b[2]*s2
      const dR=a[0]+a[1]*c1+a[2]*c2, dI=-a[1]*s1-a[2]*s2
      return 10*Math.log10(Math.max((nR*nR+nI*nI)/(dR*dR+dI*dI), 1e-12))
    }

    // ── Build biquad chain (matches spec sheet generator exactly) ──
    const bqs: [number[],number[]][] = fHi < 2000
      ? [ rbj('HP',fLo,0,0.62), rbj('LP',fHi,0,0.71), rbj('LP',fHi*1.2,0,0.71) ]
      : [ rbj('HP',fLo,0,0.62), rbj('PK',500,0.7,1.8), rbj('PK',2800,-1.5,1.1), rbj('HS',14000,-2.5) ]

    // No product EQ applied — shows raw acoustic response only

    // ── Compute curve ──
    const N = 600
    const pts: [number,number][] = []
    for (let i = 0; i < N; i++) {
      const f  = Math.pow(10, LOG_MIN + i/(N-1)*(LOG_MAX-LOG_MIN))
      let db   = sens
      for (const bq of bqs) db += biquadDb(bq, f)
      // Micro ripple (matches spec sheet)
      const lf = Math.log(f)
      db += 0.28*Math.sin(6.3*lf+0.7) + 0.22*Math.sin(11.1*lf+2.1) + 0.18*Math.sin(17.9*lf+4.2)
      pts.push([fx(f), fdb(Math.max(DB_MIN-1, Math.min(DB_MAX+1, db)))])
    }

    // ── Fill ──
    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + PH)
    grad.addColorStop(0, 'rgba(201,169,110,0.16)')
    grad.addColorStop(1, 'rgba(201,169,110,0.01)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(pts[0][0], PAD.t + PH)
    pts.forEach(([x,y]) => ctx.lineTo(x, y))
    ctx.lineTo(pts[pts.length-1][0], PAD.t + PH)
    ctx.closePath(); ctx.fill()

    // ── Curve ──
    ctx.strokeStyle = 'rgba(201,169,110,0.85)'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    pts.forEach(([x,y], i) => i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y))
    ctx.stroke()

    // ── ±3 dB dashes ──
    ctx.setLineDash([5, 4])
    ;[3,-3].forEach(o => {
      const y = fdb(sens+o)
      ctx.strokeStyle = CHAMP(0.18); ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(PAD.l,y); ctx.lineTo(PAD.l+PW,y); ctx.stroke()
    })
    ctx.setLineDash([])

    // ── Sens reference line ──
    ctx.strokeStyle = CHAMP(0.3); ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.moveTo(PAD.l,fdb(sens)); ctx.lineTo(PAD.l+PW,fdb(sens)); ctx.stroke()

    // ── Axis labels ──
    ctx.fillStyle = MUTED(0.4); ctx.font = '8px DM Mono,monospace'; ctx.textAlign = 'left'
    ctx.fillText('dB', 4, PAD.t - 8)

  }, [sens, fLo, fHi, eqData])

  return (
    <div className="pd-fr-wrap">
      <canvas ref={canvasRef} className="pd-fr-canvas" style={{width:'100%', height:'200px', display:'block', background:'#000'}}/>
      <div className="pd-fr-note">
        On-axis · 1W/1m · {fLo}Hz – {fHi >= 1000 ? fHi/1000+'kHz' : fHi+'Hz'} {product.freqQualifier || '±3dB'} · {sens} dB sensitivity
      </div>
    </div>
  )
}

// ── POLAR CHART (inline SVG) ──────────────────────────────────────────────────
// Renders H and V polar patterns using the same physics as the spec sheet:
// cardioid-power for H, sinc-based line-source for V.
function PolarChart({ product }: { product: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dirH = product.directivityHDeg || 140
  const dirV = product.directivityVDeg || 25

  useEffect(() => {
    const canvas = canvasRef.current!
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)

    const CHAMP = 'rgba(201,169,110,'
    const BLUE  = 'rgba(91,141,184,'
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H)

    const draw = (cx: number, cy: number, R: number, label: string) => {
      // dB rings
      for (const db of [0, -6, -12, -18, -24]) {
        const r = R * (1 + db / 24)
        ctx.strokeStyle = db === 0 ? CHAMP + '0.25)' : 'rgba(255,255,255,0.05)'
        ctx.lineWidth = db === 0 ? 0.7 : 0.35
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke()
        if (db !== 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '7px DM Mono,monospace'; ctx.textAlign = 'left'
          ctx.fillText(String(db), cx + r + 2, cy + 3)
        }
      }
      // Radial lines every 30°
      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg - 90) * Math.PI / 180
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.3
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad)); ctx.stroke()
      }
      // Angle labels
      for (const [deg, lbl] of [[0,'0°'],[90,'90°'],[180,'180°'],[270,'−90°']] as [number,string][]) {
        const rad = (deg - 90) * Math.PI / 180
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '7px DM Mono,monospace'; ctx.textAlign = 'center'
        ctx.fillText(lbl, cx + (R + 11) * Math.cos(rad), cy + (R + 11) * Math.sin(rad) + 3)
      }
      // Panel label
      ctx.fillStyle = CHAMP + '0.45)'; ctx.font = '7.5px DM Mono,monospace'; ctx.textAlign = 'center'
      ctx.fillText(label, cx, cy - R - 16)
    }

    // ── Pattern functions ──
    const clamp = (v: number) => Math.max(v, 1e-4)
    const linDb = (v: number) => 20 * Math.log10(clamp(v))
    const FLOOR = -30

    const hPattern = (angleDeg: number, freq: number): number => {
      const bw6 = { 250:170, 500:155, 1000:dirH, 2000:115, 4000:85, 8000:62 }
      const nearestF = [250,500,1000,2000,4000,8000].reduce((a,b) => Math.abs(b-freq)<Math.abs(a-freq)?b:a)
      const bw = (bw6 as any)[nearestF]
      const th6 = bw / 2 * Math.PI / 180
      const a = Math.abs(angleDeg % 360)
      const ar = (a > 180 ? 360 - a : a) * Math.PI / 180
      const p = Math.log(0.5) / Math.log((1 + Math.cos(th6)) / 2)
      const D = ((1 + Math.cos(ar)) / 2) ** p
      const ph = (freq % 613) * 0.017
      const wobbled = D * (1 + 0.035 * Math.sin(4 * ar + ph) + 0.025 * Math.sin(7 * ar + 1.7 * ph))
      return Math.max(FLOOR, linDb(Math.max(wobbled, 10 ** (-26 / 20))))
    }

    const vPattern = (angleDeg: number, freq: number): number => {
      const bw6 = { 250:64, 500:40, 1000:dirV, 2000:16.5, 4000:11, 8000:7.5 }
      const nearestF = [250,500,1000,2000,4000,8000].reduce((a,b) => Math.abs(b-freq)<Math.abs(a-freq)?b:a)
      const bw = (bw6 as any)[nearestF]
      const th6 = bw / 2 * Math.PI / 180
      const a = Math.abs(angleDeg % 360)
      const ar = (a > 180 ? 360 - a : a) * Math.PI / 180
      const B = 1.8955 / Math.sin(th6)
      const x = B * Math.sin(ar)
      const S = Math.abs(Math.sin(Math.PI * x / Math.PI) / (Math.PI * x / Math.PI + 1e-9))
      const baffle = ((1 + Math.cos(ar)) / 2) ** 0.55
      const wf = { 250:0.55, 500:0.30, 1000:0.15, 2000:0.09, 4000:0.06, 8000:0.045 } as any
      const smooth = ((1 + Math.cos(ar)) / 2) ** (Math.log(0.5) / Math.log((1 + Math.cos(th6)) / 2))
      const D = (1 - wf[nearestF]) * S * baffle + wf[nearestF] * smooth
      const ph = (freq % 977) * 0.013
      const wobbled = D * (1 + 0.045 * Math.sin(5 * ar + ph) + 0.03 * Math.sin(9 * ar + 2.1 * ph))
      return Math.max(FLOOR, linDb(Math.max(wobbled, 10 ** (-27 / 20))))
    }

    const drawCurve = (
      cx: number, cy: number, R: number,
      patternFn: (a: number, f: number) => number,
      freq: number, color: string, lw: number,
      vertical = false
    ) => {
      const pts: [number, number][] = []
      for (let i = 0; i < 720; i++) {
        const deg = i * 360 / 720 - 180
        const db = patternFn(deg, freq)
        const r = R * (1 + Math.max(db, FLOOR) / 24)
        const rad = (deg - 90) * Math.PI / 180
        const [sin, cos] = vertical ? [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)] : [Math.sin(rad), Math.cos(rad)]
        pts.push([cx + r * sin, cy + r * cos])
      }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round'
      ctx.beginPath(); pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
      ctx.closePath(); ctx.stroke()
    }

    const half = W / 2
    const cxH = half / 2, cxV = half + half / 2, cY = H / 2 + 8
    const R = Math.min(half / 2 - 22, H / 2 - 32)

    draw(cxH, cY, R, 'HORIZONTAL')
    draw(cxV, cY, R, 'VERTICAL')

    // H plane curves
    ;[[500, CHAMP+'0.30)', 0.7], [1000, CHAMP+'0.90)', 1.5], [4000, CHAMP+'0.45)', 0.8], [8000, CHAMP+'0.25)', 0.6]]
      .forEach(([f, col, lw]) => drawCurve(cxH, cY, R, hPattern, f as number, col as string, lw as number))

    // V plane curves
    ;[[500, BLUE+'0.28)', 0.7], [1000, BLUE+'0.90)', 1.4], [4000, BLUE+'0.42)', 0.8], [8000, BLUE+'0.22)', 0.6]]
      .forEach(([f, col, lw]) => drawCurve(cxV, cY, R, vPattern, f as number, col as string, lw as number, true))

    // Legend
    ctx.font = '7.5px DM Mono,monospace'; ctx.textAlign = 'left'
    let lx = 12, ly = H - 10
    for (const [col, lbl] of [[CHAMP+'0.8)', '■ Horizontal'],[BLUE+'0.8)', '■ Vertical']] as [string, string][]) {
      ctx.fillStyle = col; ctx.fillText(lbl, lx, ly); lx += 100
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillText('  500 Hz · 1 kHz · 4 kHz · 8 kHz', lx, ly)

  }, [dirH, dirV])

  return (
    <div className="pd-polar-wrap">
      <canvas ref={canvasRef} className="pd-polar-canvas" style={{ width: '100%', height: '240px', display: 'block' }}/>
      <div className="pd-fr-note">
        Normalised polar response · H {dirH}° / V {dirV}° (−6 dB @ 1 kHz)
      </div>
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

// ── VIDEO GRID GALLERY ───────────────────────────────────────────────────────
// ── ACCESSORIES SECTION ──────────────────────────────────────────────────────
// Split-screen lifestyle cards — alternating left/right image
// inWallProduct: the in-wall variant of this product (Cane IC, Bonsai IC, etc.)
// Reveal slider — drag to compare two images in the same box
function RevealSlider({ heroUrl, lifestyleUrl, alt }: { heroUrl: string|null, lifestyleUrl: string|null, alt: string }) {
  const [pct, setPct] = useState(50)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const calc = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    const p = Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100))
    setPct(p)
  }

  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; calc(e.clientX) }
  const onMouseMove = (e: React.MouseEvent) => { if (dragging.current) calc(e.clientX) }
  const onMouseUp   = () => { dragging.current = false }
  const onTouchMove = (e: React.TouchEvent) => { e.preventDefault(); calc(e.touches[0].clientX) }

  // Only one image — just show it
  if (!heroUrl || !lifestyleUrl) {
    const src = heroUrl || lifestyleUrl
    return src ? (
      <div className="acc-reveal-wrap">
        <img src={src} alt={alt} className="acc-reveal-base"/>
      </div>
    ) : null
  }

  return (
    <div className="acc-reveal-wrap"
      ref={wrapRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={e => calc(e.touches[0].clientX)}
      onTouchMove={onTouchMove}
    >
      {/* Base — lifestyle */}
      <img src={lifestyleUrl} alt={`${alt} installed`} className="acc-reveal-base"/>
      {/* Top — product, clipped */}
      <div className="acc-reveal-top" style={{width: `${pct}%`}}>
        <img src={heroUrl} alt={alt} className="acc-reveal-img"
          style={{width: wrapRef.current?.offsetWidth + 'px' || '100%'}}/>
      </div>
      {/* Handle */}
      <div className="acc-reveal-handle" style={{left: `${pct}%`}}>
        <div className="acc-reveal-line"/>
        <div className="acc-reveal-grip">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" fill="#000" stroke="#c9a96e" strokeWidth="0.8"/>
            <path d="M5 9l2.5-3v6L5 9zM13 9l-2.5-3v6L13 9z" fill="#c9a96e" opacity="0.8"/>
          </svg>
        </div>
      </div>
      {/* Labels */}
      <div className="acc-reveal-label acc-reveal-label-l" style={{opacity: pct > 15 ? 1 : 0}}>Product</div>
      <div className="acc-reveal-label acc-reveal-label-r" style={{opacity: pct < 85 ? 1 : 0}}>In Use</div>
    </div>
  )
}

function AccessoriesSection({ accessories, productName, getImageUrl, inWallProduct }: {
  accessories: any[]
  productName: string
  getImageUrl: (img: any, w?: number) => string | null
  inWallProduct?: any
}) {
  const hasItems = (accessories && accessories.length > 0) || inWallProduct
  if (!hasItems) return null

  return (
    <section className="acc-section">
      <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>
      <div className="acc-header">
        <div className="pd-section-ey">Accessories</div>
        <h2 className="pd-section-title">Mount it <em>your way</em></h2>
      </div>

      {[...(accessories || []), ...(inWallProduct ? [{ _isInWall: true, ...inWallProduct }] : [])].map((acc: any, i: number) => {
        const isEven = i % 2 === 0

        // In-wall product — special card linking to its product page
        if (acc._isInWall) {
          const heroUrl      = getImageUrl(acc.heroImage, 1200)
          const lifestyleUrl = acc.lifestyleImages?.[0]
            ? getImageUrl(acc.lifestyleImages[0], 1200)
            : null
          return (
            <div key="inwall"
              className={`acc-card${isEven ? '' : ' acc-card-flip'}`}>
              <div className="acc-img-side">
                {heroUrl
                  ? <RevealSlider heroUrl={heroUrl} lifestyleUrl={lifestyleUrl} alt={acc.productName} />
                  : <div className="acc-img-placeholder"/>
                }
              </div>
              <div className="acc-info-side">
                <div className="acc-cat">In-Wall / In-Ceiling Version</div>
                <h3 className="acc-name">{acc.productName}</h3>
                <p className="acc-desc">The fully flush version of the {productName} — same driver array, same performance, completely hidden inside the wall or ceiling.</p>
                {acc.specs && (
                  <div className="acc-specs">
                    {[
                      acc.heightMm && { label: 'Cutout height', value: `${acc.heightMm}mm` },
                      acc.widthMm  && { label: 'Cutout width',  value: `${acc.widthMm}mm` },
                      acc.depthMm  && { label: 'Required depth', value: `${acc.depthMm}mm` },
                    ].filter(Boolean).map((s: any, j: number) => (
                      <div key={j} className="acc-spec-row">
                        <span className="acc-spec-label">{s.label}</span>
                        <span className="acc-spec-val">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <a href={`/products/${acc.catSlug || 'in-ceiling-series'}/${acc.slug}`} className="acc-enquire">View {acc.productName} →</a>
              </div>
            </div>
          )
        }

        const heroUrl      = getImageUrl(acc.heroImage, 1200)
        const lifestyleUrl = getImageUrl(acc.lifestyleImage, 1200)
        return (
          <div key={acc._id} className={`acc-card${isEven ? '' : ' acc-card-flip'}`}>
            {/* Reveal slider — drag to compare product shot vs lifestyle */}
            <div className="acc-img-side">
              <RevealSlider
                heroUrl={heroUrl}
                lifestyleUrl={lifestyleUrl}
                alt={acc.name}
              />
            </div>

            {/* Info side */}
            <div className="acc-info-side">
              <div className="acc-cat">{acc.category || 'Accessory'}</div>
              <h3 className="acc-name">{acc.name}</h3>
              <p className="acc-desc">{acc.shortDescription || acc.description}</p>

              {acc.specs && acc.specs.length > 0 && (
                <div className="acc-specs">
                  {acc.specs.slice(0, 4).map((s: any, j: number) => (
                    <div key={j} className="acc-spec-row">
                      <span className="acc-spec-label">{s.label}</span>
                      <span className="acc-spec-val">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {acc.skuCode && (
                <div className="acc-sku">{acc.skuCode}</div>
              )}

              <a href="mailto:support@xscace.com?subject=Accessory Enquiry — " className="acc-enquire">
                Enquire about this accessory →
              </a>
            </div>
          </div>
        )
      })}

    </section>
  )
}

// ── FLOATING GALLERY — scrollable strip ──────────────────────────────────────
function FloatingGallery({ images, productName, getImageUrl }: {
  images: any[]
  productName: string
  getImageUrl: (img: any, w?: number) => string | null
}) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  const items = images.map((img, i) => {
    const url = getImageUrl(img, 900)
    if (!url) return null
    return { url, i }
  }).filter(Boolean) as { url: string; i: number }[]

  if (items.length === 0) return null

  // Drag-to-scroll
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.pageX - (stripRef.current?.offsetLeft || 0), scrollLeft: stripRef.current?.scrollLeft || 0 }
    if (stripRef.current) stripRef.current.style.cursor = 'grabbing'
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active || !stripRef.current) return
    e.preventDefault()
    const x = e.pageX - (stripRef.current.offsetLeft || 0)
    stripRef.current.scrollLeft = drag.current.scrollLeft - (x - drag.current.startX)
  }
  const onMouseUp = () => {
    drag.current.active = false
    if (stripRef.current) stripRef.current.style.cursor = 'grab'
  }

  // Update progress track on scroll
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const update = () => {
      const fill = document.getElementById('fg-track-fill')
      if (!fill) return
      const pct = strip.scrollLeft / (strip.scrollWidth - strip.clientWidth) * 100
      fill.style.width = Math.max(8, pct) + '%'
    }
    strip.addEventListener('scroll', update, { passive: true })
    return () => strip.removeEventListener('scroll', update)
  }, [])

  return (
    <section className="fg-section">
      <div className="fg-header">
        <div className="fg-header-row">
          <div>
            <div className="pd-section-ey">Gallery</div>
            <h2 className="pd-section-title" style={{marginBottom:0}}>{productName} <em>in context</em></h2>
          </div>
          <div className="fg-scroll-hint">
            <svg width="36" height="14" viewBox="0 0 36 14" fill="none">
              <line x1="0" y1="7" x2="28" y2="7" stroke="#c9a96e" strokeWidth="0.6" opacity="0.4"/>
              <path d="M24 3l5 4-5 4" stroke="#c9a96e" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
            <span>Scroll</span>
          </div>
        </div>
        {/* Scrollbar track indicator */}
        <div className="fg-track">
          <div className="fg-track-fill" id="fg-track-fill"/>
        </div>
      </div>

      <div
        className="fg-strip"
        ref={stripRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {items.map(({ url, i }) => (
          <div key={i} className="fg-strip-item" onClick={() => setLightbox(url)}>
            <img src={url} alt={`${productName} ${i + 1}`} className="fg-strip-img"/>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fg-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt={productName} className="fg-lb-img"/>
          <button className="fg-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="15" y1="1" x2="1" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}

function VideoGallery({ images, videos, productName, getImageUrl }: {
  images: any[]
  videos: any[]
  productName: string
  getImageUrl: (img: any, w?: number) => string | null
}) {
  const [leftIdx, setLeftIdx] = useState(0)
  const [rightIdx, setRightIdx] = useState(Math.min(1, videos.length - 1))
  const [leftFading, setLeftFading] = useState(false)
  const [rightFading, setRightFading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const leftTimer = useRef<any>(null)
  const rightTimer = useRef<any>(null)

  const getYtId = (url: string) =>
    url?.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url?.split('v=')[1]?.split('&')[0]

  // Get playable URL from a video item (Sanity file asset or YouTube URL)
  const getVideoSrc = (v: any): { type: 'file'|'youtube', src: string } | null => {
    if (!v) return null
    // Sanity file asset — build CDN URL from _ref
    // ref format: "file-{hash}-{ext}" → "{hash}.{ext}"
    const ref = v.videoFile?.asset?._ref
    if (ref) {
      // Strip "file-" prefix, replace last "-ext" with ".ext"
      const withoutPrefix = ref.replace(/^file-/, '')
      const dotted = withoutPrefix.replace(/-([a-zA-Z0-9]+)$/, '.$1')
      return { type: 'file', src: `https://cdn.sanity.io/files/7r0kq57d/production/${dotted}` }
    }
    // Also handle resolved asset URL (if query returns asset->{ url })
    if (v.videoFile?.asset?.url) {
      return { type: 'file', src: v.videoFile.asset.url }
    }
    // Legacy YouTube URL
    if (v.url) {
      const ytId = getYtId(v.url)
      if (ytId) return { type: 'youtube', src: ytId }
      return { type: 'file', src: v.url }
    }
    return null
  }

  const embedUrl = (url: string, startSec = 0) => {
    const id = getYtId(url)
    if (!id) return null
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3${startSec ? `&start=${startSec}` : ''}`
  }

  // Auto-cycle left video (offset cycle so they don't switch at the same time)
  useEffect(() => {
    if (videos.length <= 1) return
    leftTimer.current = setInterval(() => {
      setLeftFading(true)
      setTimeout(() => {
        setLeftIdx(i => (i + 1) % videos.length)
        setLeftFading(false)
      }, 500)
    }, 20000)
    return () => clearInterval(leftTimer.current)
  }, [videos.length])

  // Auto-cycle right video (offset by 10s)
  useEffect(() => {
    if (videos.length <= 1) return
    const t = setTimeout(() => {
      rightTimer.current = setInterval(() => {
        setRightFading(true)
        setTimeout(() => {
          setRightIdx(i => (i + 1) % videos.length)
          setRightFading(false)
        }, 500)
      }, 20000)
    }, 10000)
    return () => { clearTimeout(t); clearInterval(rightTimer.current) }
  }, [videos.length])

  const year = new Date().getFullYear()
  const allImages = [...(images || [])]

  return (
    <section className="vg-section">

      {/* ── Two video panels side by side ── */}
      <div className="vg-videos">

        {/* Left video */}
        <div className="vg-panel">
          {(() => {
            // Always show a video — use leftIdx, fall back to 0
            const idx = videos.length > 0 ? leftIdx % videos.length : -1
            const vs  = idx >= 0 ? getVideoSrc(videos[idx]) : null
            if (!vs) return null
            return (
              <div className={`vg-embed-wrap${leftFading ? ' vg-fading' : ''}`}>
                {vs.type === 'file' ? (
                  <video key={`left-${idx}`} className="vg-video-el"
                    src={vs.src} autoPlay muted loop playsInline/>
                ) : (
                  <iframe key={`left-${idx}`}
                    src={`https://www.youtube-nocookie.com/embed/${vs.src}?autoplay=1&mute=1&loop=1&playlist=${vs.src}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3`}
                    className="vg-iframe" allow="autoplay; encrypted-media" allowFullScreen/>
                )}
              </div>
            )
          })()}

          {/* Vignette */}
          <div className="vg-vignette"/>
          {/* Bottom merge — bleeds into background */}
          <div className="vg-bottom-fade"/>



          {/* Dot indicator */}
          {videos.length > 1 && (
            <div className="vg-dots">
              {videos.map((_: any, i: number) => (
                <button key={i}
                  className={`vg-dot${leftIdx === i ? ' active' : ''}`}
                  onClick={() => {
                    setLeftFading(true)
                    setTimeout(() => { setLeftIdx(i); setLeftFading(false) }, 400)
                    clearInterval(leftTimer.current)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="vg-divider"/>

        {/* Right video */}
        <div className="vg-panel">
          {(() => {
            // Use rightIdx if multiple videos, otherwise duplicate video 0 (offset start)
            const idx = videos.length > 1 ? rightIdx % videos.length : 0
            const vs  = videos.length > 0 ? getVideoSrc(videos[idx]) : null
            if (!vs) return null
            return (
              <div className={`vg-embed-wrap${rightFading ? ' vg-fading' : ''}`}>
                {vs.type === 'file' ? (
                  <video key={`right-${idx}`} className="vg-video-el"
                    src={vs.src} autoPlay muted loop playsInline
                    onLoadedMetadata={(e) => {
                      // Offset right video by 30% of duration to avoid sync with left
                      const v = e.currentTarget
                      if (v.duration && videos.length <= 1) {
                        v.currentTime = Math.min(v.duration * 0.3, 30)
                      }
                    }}/>
                ) : (
                  <iframe key={`right-${idx}`}
                    src={`https://www.youtube-nocookie.com/embed/${vs.src}?autoplay=1&mute=1&loop=1&playlist=${vs.src}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&start=30`}
                    className="vg-iframe" allow="autoplay; encrypted-media" allowFullScreen/>
                )}
              </div>
            )
          })()}

          <div className="vg-vignette"/>
          <div className="vg-bottom-fade"/>


        </div>

      </div>



      {/* Lightbox */}
      {lightbox && (
        <div className="vg-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt={productName} className="vg-lb-img"/>
          <button className="vg-lb-close" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}

    </section>
  )
}


// ── FABRIC PILL ──────────────────────────────────────────────────────────────
function FabricPill() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pillRef   = useRef<HTMLSpanElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const pill   = pillRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = pill.offsetWidth || 140
    const H = pill.offsetHeight || 28
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    let offset = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const spacing = 5
      // Warp threads — vertical, slowly drifting left
      for (let x = (offset % spacing) - spacing; x < W + spacing; x += spacing) {
        const a = 0.055 + Math.abs(Math.sin((x + offset * 0.3) * 0.18)) * 0.06
        ctx.strokeStyle = `rgba(220,200,170,${a})`
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      // Weft threads — horizontal, alternating slightly lighter/darker
      for (let y = 0; y < H; y += spacing) {
        const a = 0.045 + Math.abs(Math.sin(y * 0.35 + offset * 0.08)) * 0.055
        ctx.strokeStyle = `rgba(200,180,148,${a})`
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      // Slow diagonal sheen sweep
      const sweepX = ((offset * 0.6) % (W + 80)) - 40
      const sg = ctx.createLinearGradient(sweepX - 20, 0, sweepX + 20, H)
      sg.addColorStop(0,   'rgba(240,220,185,0)')
      sg.addColorStop(0.5, 'rgba(240,220,185,0.09)')
      sg.addColorStop(1,   'rgba(240,220,185,0)')
      ctx.fillStyle = sg
      ctx.fillRect(0, 0, W, H)

      offset += 0.35
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <span className="pd-pill-fabric" ref={pillRef}>
      <span className="pd-fabric-border" aria-hidden="true"/>
      <span className="pd-fabric-inner" aria-hidden="true"/>
      <canvas ref={canvasRef} className="pd-fabric-canvas" aria-hidden="true"/>
      <span className="pd-fabric-text">Custom Fabric</span>
    </span>
  )
}

// ── CHAMPAGNE FRAME PILL ──────────────────────────────────────────────────────
function ChampagnePill() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pillRef   = useRef<HTMLSpanElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const pill   = pillRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = pill.offsetWidth || 220
    const H = pill.offsetHeight || 28
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    let offset = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      // Brushed metal lines — fine horizontal strokes at varying opacity
      for (let y = 0; y < H; y++) {
        const grain = Math.sin(y * 3.7 + offset * 0.04) * 0.5 + Math.sin(y * 7.3) * 0.3
        const a = 0.025 + (grain + 1) * 0.022
        ctx.strokeStyle = `rgba(215,185,120,${Math.max(0, Math.min(0.12, a))})`
        ctx.lineWidth = 0.6
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke()
      }
      // Champagne light sweep — slow diagonal band
      const sweepX = ((offset * 0.45) % (W + 120)) - 60
      const lg = ctx.createLinearGradient(sweepX - 30, 0, sweepX + 50, H)
      lg.addColorStop(0,    'rgba(255,235,170,0)')
      lg.addColorStop(0.3,  'rgba(255,235,170,0.07)')
      lg.addColorStop(0.5,  'rgba(245,220,140,0.18)')
      lg.addColorStop(0.7,  'rgba(255,235,170,0.07)')
      lg.addColorStop(1,    'rgba(255,235,170,0)')
      ctx.fillStyle = lg
      ctx.fillRect(0, 0, W, H)

      offset += 0.3
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <span className="pd-pill-champagne" ref={pillRef}>
      <span className="pd-champagne-border" aria-hidden="true"/>
      <span className="pd-champagne-inner" aria-hidden="true"/>
      <canvas ref={canvasRef} className="pd-champagne-canvas" aria-hidden="true"/>
      <span className="pd-champagne-text">Stainless Steel Champagne Frame</span>
    </span>
  )
}

// ── RAINBOW PILL ─────────────────────────────────────────────────────────────
function RainbowPill() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const pill = pillRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = pill.offsetWidth || 120
    const H = pill.offsetHeight || 30
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    interface Drop {
      x: number; y: number; vy: number; vx: number
      r: number; hue: number; alpha: number
      tail: {x:number;y:number;r:number}[]
      splat: boolean; splatLife: number
    }
    const drops: Drop[] = []
    let hue = 0
    let frame = 0

    const spawn = () => {
      hue = (hue + 53) % 360
      drops.push({
        x: 6 + Math.random() * (W - 12),
        y: -5,
        vy: 0.5 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        r: 2 + Math.random() * 1.5,
        hue,
        alpha: 0.8 + Math.random() * 0.2,
        tail: [],
        splat: false,
        splatLife: 0,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      frame++
      if (frame % 22 === 0) spawn()

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]

        if (d.splat) {
          // Splat ring spreading out at bottom edge
          d.splatLife -= 0.06
          if (d.splatLife <= 0) { drops.splice(i, 1); continue }
          const spread = (1 - d.splatLife) * d.r * 3
          ctx.beginPath()
          ctx.ellipse(d.x, H - 1, spread, spread * 0.35, 0, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${d.hue},100%,65%,${d.splatLife * 0.4})`
          ctx.lineWidth = 0.8
          ctx.stroke()
          continue
        }

        // Record tail
        d.tail.push({x: d.x, y: d.y, r: d.r})
        if (d.tail.length > 16) d.tail.shift()

        d.y += d.vy; d.x += d.vx
        d.vy += 0.03

        // Draw tail — fading liquid trail
        d.tail.forEach((pt, ti) => {
          const progress = ti / d.tail.length
          const a = progress * d.alpha * 0.5
          ctx.beginPath()
          ctx.ellipse(pt.x, pt.y, pt.r * 0.45, pt.r * (0.3 + progress * 0.5), 0, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${d.hue},100%,60%,${a})`
          ctx.fill()
        })

        // Drop head — teardrop shape
        ctx.save()
        ctx.translate(d.x, d.y)
        // Teardrop: circle body + pointed top
        const grad = ctx.createRadialGradient(-d.r * 0.3, -d.r * 0.3, 0, 0, 0, d.r * 1.3)
        grad.addColorStop(0, `hsla(${(d.hue + 40) % 360},100%,90%,${d.alpha})`)
        grad.addColorStop(0.5, `hsla(${d.hue},100%,65%,${d.alpha})`)
        grad.addColorStop(1, `hsla(${(d.hue - 20 + 360) % 360},100%,40%,${d.alpha * 0.3})`)
        ctx.beginPath()
        ctx.arc(0, 0, d.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        // Specular highlight
        ctx.beginPath()
        ctx.ellipse(-d.r * 0.3, -d.r * 0.35, d.r * 0.28, d.r * 0.2, -0.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${d.alpha * 0.6})`
        ctx.fill()
        ctx.restore()

        // Hit bottom — splat
        if (d.y + d.r >= H) {
          d.splat = true
          d.splatLife = 1
          d.y = H - 1
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <span className="pd-pill-ral-rainbow" ref={pillRef}>
      {/* Spinning conic gradient border */}
      <span className="pd-rainbow-border" aria-hidden="true"/>
      {/* Inner black fill */}
      <span className="pd-rainbow-inner" aria-hidden="true"/>
      {/* Liquid drops canvas */}
      <canvas ref={canvasRef} className="pd-rainbow-canvas" aria-hidden="true"/>
      <span className="pd-rainbow-text">Custom RAL</span>
    </span>
  )
}


// ── Animated Signal Chain ────────────────────────────────────────────────────
const SIGNAL_STAGES = [
  {label:'INPUT',    sub:'Analog / Hi-Level',   dsp:false},
  {label:'ADC',      sub:'24-bit · 96kHz',       dsp:false},
  {label:'ADAU1701', sub:'SigmaDSP · 50 MIPS',  dsp:true },
  {label:'PsySculpt™',sub:'Psychoacoustic',      dsp:true },
  {label:'DAC',      sub:'Per Channel',           dsp:false},
  {label:'Class D',  sub:'400W Total',            dsp:false},
  {label:'OUTPUT',   sub:'Speaker / LFE',         dsp:false},
]

function SignalChain() {
  const [active, setActive] = useState(0)
  const [lit, setLit] = useState<number[]>([])

  useEffect(() => {
    let step = 0
    const tick = () => {
      setActive(step)
      setLit(prev => {
        const next = [...new Set([...prev, step])]
        return next.length > SIGNAL_STAGES.length ? [] : next
      })
      step = (step + 1) % (SIGNAL_STAGES.length + 1)
      if (step === 0) setLit([])
    }
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{padding:'36px 56px 52px', borderTop:'0.5px solid #0f0f0f'}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:'.2em',color:'rgba(201,169,110,0.22)',marginBottom:22}}>SIGNAL PATH · LIVE</div>
      <div style={{display:'flex',alignItems:'center',overflowX:'auto'}}>
        {SIGNAL_STAGES.map((s,i,a) => {
          const isActive = active === i
          const isPast = lit.includes(i)
          const glow = isActive || isPast
          const isDsp = s.dsp
          return (
            <div key={s.label} style={{display:'flex',alignItems:'center',flexShrink:0}}>
              <div style={{
                padding:'14px 18px',
                background: isActive ? (isDsp?'rgba(201,169,110,0.12)':'rgba(200,196,188,0.06)')
                          : isPast   ? (isDsp?'rgba(201,169,110,0.06)':'rgba(200,196,188,0.025)')
                          : '#060606',
                border:`0.5px solid ${isActive?(isDsp?'rgba(201,169,110,0.5)':'rgba(200,196,188,0.25)'):isPast?(isDsp?'rgba(201,169,110,0.2)':'rgba(200,196,188,0.08)'):'#0f0f0f'}`,
                textAlign:'center', minWidth:88,
                transition:'all 0.35s ease',
                boxShadow: isActive && isDsp ? '0 0 16px rgba(201,169,110,0.15)' : 'none',
              }}>
                <div style={{
                  fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:'.07em',marginBottom:5,
                  color: isActive?(isDsp?'#c9a96e':'rgba(200,196,188,0.8)'):isPast?(isDsp?'rgba(201,169,110,0.55)':'rgba(200,196,188,0.3)'):'rgba(200,196,188,0.18)',
                  transition:'color 0.35s ease',
                }}>{s.label}</div>
                <div style={{
                  fontFamily:"'DM Mono',monospace",fontSize:6,letterSpacing:'.05em',lineHeight:1.4,
                  color: isActive?(isDsp?'rgba(201,169,110,0.45)':'rgba(200,196,188,0.4)'):isPast?(isDsp?'rgba(201,169,110,0.25)':'rgba(200,196,188,0.15)'):'rgba(200,196,188,0.1)',
                  transition:'color 0.35s ease',
                }}>{s.sub}</div>
              </div>
              {i < a.length - 1 && (
                <div style={{display:'flex',alignItems:'center',padding:'0 3px',flexShrink:0}}>
                  <div style={{
                    width:24, height:'0.5px',
                    background: isPast?(isDsp?'rgba(201,169,110,0.4)':'rgba(200,196,188,0.2)'):'rgba(200,196,188,0.06)',
                    transition:'background 0.35s ease',
                  }}/>
                  <div style={{
                    width:0,height:0,
                    borderTop:'3px solid transparent',borderBottom:'3px solid transparent',
                    borderLeft:`5px solid ${isPast?(isDsp?'rgba(201,169,110,0.5)':'rgba(200,196,188,0.25)'):'rgba(200,196,188,0.06)'}`,
                    transition:'border-color 0.35s ease',
                  }}/>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


export default function ProductDetail({ product }: { product: Product }) {
  const [activeGallery, setActiveGallery] = useState(0)
  const waveRafsRef = useRef<number[]>([])

  const heroImgUrl = getImageUrl(product.heroImage, 1600)
  const badges = product.proprietaryTechBadges?.split(',').map(s => s.trim().replace(/\s+/g, ' ').replace(/™/g, '')).filter(Boolean) || []
  const isAmp     = product.category?.slug?.current === 'amplifier-series'
  const isSub     = product.category?.slug?.current === 'subwoofer-series'
  const isOutdoor = product.category?.slug?.current === 'outdoor-series'
  const mountingMethodsList = product.mountingMethods
    ? (Array.isArray(product.mountingMethods)
        ? product.mountingMethods
        : product.mountingMethods.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean))
    : []
  const hasMount = mountingMethodsList.length > 0
  const galleryAll = [...(product.lifestyleImages || []), ...(product.galleryImages || [])]
  const itemsInBoxList = product.itemsInBox
    ? (Array.isArray(product.itemsInBox)
        ? product.itemsInBox
        : product.itemsInBox.split(/\n/).map((s: string) => s.trim()).filter(Boolean))
    : []
  const hasDownloads = product.cadFile
  const hasEQ = product.freqLowHz && product.freqHighHz
  const hasEqData = !!product.eqData

  // Three.js loads inside ModelViewer via esm.sh dynamic import

  // Animate wave dividers — matches homepage wave style
  useEffect(() => {
    const canvases = document.querySelectorAll('.pd-wave-canvas') as NodeListOf<HTMLCanvasElement>
    const rafs: number[] = []

    canvases.forEach((canvas, ci) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = 56 * dpr
      canvas.style.height = '56px'
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      let t = ci * 2.1  // different phase per divider

      const draw = () => {
        const W = canvas.offsetWidth, H = 56
        ctx.clearRect(0, 0, W, H)

        // Same multi-layer approach as homepage scroll wave
        const layers = [
          { amp: 3.5, freq: 2.1,  speed: 0.18, alpha: 0.10, width: 0.8 },
          { amp: 5.0, freq: 1.4,  speed: 0.12, alpha: 0.16, width: 1.0 },
          { amp: 2.5, freq: 3.8,  speed: 0.28, alpha: 0.07, width: 0.6 },
        ]

        layers.forEach(l => {
          ctx.beginPath()
          for (let x = 0; x <= W; x += 2) {
            const nx = x / W
            const y = H / 2
              + Math.sin(nx * Math.PI * l.freq * 2 + t * l.speed * Math.PI * 2) * l.amp
              + Math.sin(nx * Math.PI * l.freq * 3.3 + t * l.speed * 1.7 * Math.PI * 2) * l.amp * 0.4
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          // Fade edges
          const g = ctx.createLinearGradient(0, 0, W, 0)
          g.addColorStop(0, 'rgba(201,169,110,0)')
          g.addColorStop(0.08, `rgba(201,169,110,${l.alpha})`)
          g.addColorStop(0.92, `rgba(201,169,110,${l.alpha})`)
          g.addColorStop(1, 'rgba(201,169,110,0)')
          ctx.strokeStyle = g
          ctx.lineWidth = l.width
          ctx.stroke()
        })

        t += 0.016
        rafs[ci] = requestAnimationFrame(draw)
      }
      draw()
    })

    waveRafsRef.current = rafs
    return () => rafs.forEach(id => cancelAnimationFrame(id))
  }, [])

  // Outdoor theme — leaf veins + breathing mist + still dew beads
  useEffect(() => {
    if (!isOutdoor) return

    const leafC = document.createElement('canvas')
    const mistC = document.createElement('canvas')
    const dewC  = document.createElement('canvas')
    ;[leafC, mistC, dewC].forEach((c, i) => {
      c.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${i};`
      document.body.appendChild(c)
    })

    function sz(c: HTMLCanvasElement) { c.width = window.innerWidth; c.height = window.innerHeight }
    ;[leafC, mistC, dewC].forEach(sz)
    const onResize = () => { [leafC, mistC, dewC].forEach(sz); renderDew() }
    window.addEventListener('resize', onResize)

    // leaf veins
    const lx = leafC.getContext('2d')!
    const leafNodes = Array.from({length: 8}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 2.5,
      scale: 0.7 + Math.random() * 1.0,
      speed: 0.025 + Math.random() * 0.04,
      alpha: 0.018 + Math.random() * 0.022,
      phase: Math.random() * Math.PI * 2,
    }))
    function drawVein(ctx: CanvasRenderingContext2D, cx: number, cy: number, ang: number, len: number, depth: number, a: number) {
      if (depth <= 0 || len < 10) return
      const ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey)
      ctx.strokeStyle = `rgba(40,80,25,${a})`; ctx.lineWidth = depth * 0.4; ctx.stroke()
      drawVein(ctx, ex, ey, ang - 0.42, len * 0.58, depth - 1, a * 0.7)
      drawVein(ctx, ex, ey, ang + 0.42, len * 0.58, depth - 1, a * 0.7)
    }
    let bgT = 0, leafRaf = 0
    const animLeaf = () => {
      const W = leafC.width, H = leafC.height
      lx.clearRect(0, 0, W, H)
      leafNodes.forEach(n => {
        const drift = Math.sin(bgT * 0.15 + n.phase) * 12
        const y = ((n.y + bgT * n.speed * 20) % (H * 2.5)) - H * 0.3
        drawVein(lx, n.x + drift, y, -Math.PI / 2, 50 * n.scale, 4, n.alpha)
      })
      bgT += 0.016; leafRaf = requestAnimationFrame(animLeaf)
    }
    animLeaf()

    // mist
    const mx = mistC.getContext('2d')!
    const mistPatches = [
      { cx:0.06, cy:0.18, rx:0.26, ry:0.17, phase:0,   speed:420, base:0.055 },
      { cx:0.82, cy:0.42, rx:0.22, ry:0.24, phase:160, speed:500, base:0.048 },
      { cx:0.48, cy:0.78, rx:0.32, ry:0.15, phase:310, speed:370, base:0.042 },
      { cx:0.03, cy:0.68, rx:0.20, ry:0.22, phase:230, speed:460, base:0.035 },
      { cx:0.78, cy:0.06, rx:0.24, ry:0.14, phase:440, speed:430, base:0.030 },
    ]
    let mistT = 0, mistRaf = 0
    const animMist = () => {
      const W = mistC.width, H = mistC.height
      mx.clearRect(0, 0, W, H)
      mistPatches.forEach(p => {
        const breathe = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((mistT + p.phase) / p.speed))
        const a = p.base * breathe
        const rx = p.rx * W, ry = p.ry * H
        mx.save(); mx.translate(p.cx * W, p.cy * H); mx.scale(1, ry / rx)
        const g = mx.createRadialGradient(0, 0, 0, 0, 0, rx)
        g.addColorStop(0,    `rgba(215,210,202,${a})`)
        g.addColorStop(0.45, `rgba(215,210,202,${a * 0.3})`)
        g.addColorStop(1,    `rgba(215,210,202,0)`)
        mx.beginPath(); mx.arc(0, 0, rx, 0, Math.PI * 2)
        mx.fillStyle = g; mx.fill(); mx.restore()
      })
      mistT++; mistRaf = requestAnimationFrame(animMist)
    }
    animMist()

    // dew beads — static, drawn once
    const dx = dewC.getContext('2d')!
    const beadDefs = [
      { fx:0.08, fy:0.22, rx:7,   ry:9   },
      { fx:0.31, fy:0.09, rx:5,   ry:6.5 },
      { fx:0.67, fy:0.15, rx:8,   ry:11  },
      { fx:0.88, fy:0.31, rx:4,   ry:5.5 },
      { fx:0.14, fy:0.55, rx:6,   ry:8   },
      { fx:0.52, fy:0.48, rx:3.5, ry:4.5 },
      { fx:0.76, fy:0.62, rx:7,   ry:9.5 },
      { fx:0.93, fy:0.71, rx:4,   ry:5   },
      { fx:0.22, fy:0.82, rx:5.5, ry:7   },
      { fx:0.58, fy:0.88, rx:6,   ry:8   },
    ]
    function drawBead(ctx: CanvasRenderingContext2D, bx: number, by: number, rx: number, ry: number) {
      ctx.save(); ctx.translate(bx, by)
      const halo = ctx.createRadialGradient(0, 0, ry * 0.6, 0, 0, ry * 1.15)
      halo.addColorStop(0, `rgba(201,169,110,0)`); halo.addColorStop(1, `rgba(201,169,110,0.06)`)
      ctx.beginPath(); ctx.ellipse(0, 0, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2)
      ctx.fillStyle = halo; ctx.fill()
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
      const body = ctx.createRadialGradient(-rx * 0.28, -ry * 0.3, 0, rx * 0.1, ry * 0.1, Math.max(rx, ry) * 1.1)
      body.addColorStop(0,    `rgba(245,242,235,0.22)`)
      body.addColorStop(0.35, `rgba(220,215,205,0.09)`)
      body.addColorStop(0.75, `rgba(180,170,150,0.04)`)
      body.addColorStop(1,    `rgba(140,130,110,0.01)`)
      ctx.fillStyle = body; ctx.fill()
      ctx.beginPath(); ctx.ellipse(-rx * 0.26, -ry * 0.3, rx * 0.28, ry * 0.18, -0.35, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,252,244,0.55)`; ctx.fill()
      ctx.beginPath(); ctx.ellipse(rx * 0.28, ry * 0.35, rx * 0.1, ry * 0.07, 0.4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,245,210,0.2)`; ctx.fill()
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(220,210,190,0.12)`; ctx.lineWidth = 0.6; ctx.stroke()
      ctx.restore()
    }
    function renderDew() {
      const W = dewC.width, H = dewC.height
      dx.clearRect(0, 0, W, H)
      beadDefs.forEach(b => drawBead(dx, b.fx * W, b.fy * H, b.rx, b.ry))
    }
    renderDew()

    return () => {
      cancelAnimationFrame(leafRaf)
      cancelAnimationFrame(mistRaf)
      window.removeEventListener('resize', onResize)
      ;[leafC, mistC, dewC].forEach(c => c.remove())
    }
  }, [isOutdoor])

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
    specRow('Mounting', product.mountingMethods),
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
    product.paintableGrille !== null && product.paintableGrille !== undefined
      ? specRow('Paintable Grille', product.paintableGrille ? 'Yes' : 'No')
      : null,
    specRow('Fire Rating', product.fireRating),
    product.tweeterAimable ? { label: 'Aimable Tweeter', value: 'Yes' } : null,
    specRow('Crossover', product.crossoverType),
    // SPL Max — use stored value if available, else calculate
    (() => {
      const stored = product.splMaxDb
      if (stored) return specRow('Max SPL', `${stored}dB`)
      if (!product.sensitivityDb || !product.powerPeakW) return null
      const spl = Math.round(product.sensitivityDb + 10 * Math.log10(product.powerPeakW))
      return specRow('Max SPL', `${spl}dB`)
    })(),
    specRow('THD+N', product.thdN),
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
              {product.series && product.series !== product.category?.name && (
                <><span className="pd-bc-sep">·</span>
                <span className="pd-bc-cur">{product.series}</span></>
              )}
            </div>
            <h1 className="pd-hero-name">{product.productName}</h1>
            {product.tagline && <div className="pd-hero-tagline">{product.tagline}</div>}
            {product.shortDescription && (
              <p className="pd-hero-desc">{product.shortDescription}</p>
            )}
            {product.skuBase && (
              <div className="pd-hero-sku">{product.skuBase}</div>
            )}

            {/* Key specs pills — row 1 */}
            <div className="pd-hero-pills">
              {product.powerRmsW && !isAmp && <span className="pd-pill">{product.powerRmsW}W</span>}
              {product.totalPowerW && <span className="pd-pill">{product.totalPowerW}W</span>}
              {product.impedanceOhms && <span className="pd-pill">{product.impedanceOhms}Ω</span>}
              {product.freqLowHz && product.freqHighHz && (
                <span className="pd-pill">
                  {product.freqLowHz}Hz – {product.freqHighHz >= 1000 ? `${product.freqHighHz/1000}kHz` : `${product.freqHighHz}Hz`}
                </span>
              )}
              {product.powerType && <span className="pd-pill">{product.powerType}</span>}
            </div>

            {/* Feature tags — row 2: colors + marine + ral */}
            <div className="pd-hero-feature-row">

              {/* Standard Colors */}
              {product.colorsStandard && (
                <span className="pd-std-tag">
                  {(product.colorsStandard as string).split(',').map((c: string) => {
                    const col = c.trim()
                    const hexMap: Record<string,string> = {
                      'Matte Champagne':'#C9A96E','Champagne':'#C9A96E',
                      'Anthracite':'#3C3F41','Anthracite Grey':'#3C3F41',
                      'White':'#F2F0EC','Matte White':'#F2F0EC','Pure White':'#F4F4F4',
                      'Black':'#0A0A0A','Jet Black':'#0A0A0A','Matte Black':'#111',
                    }
                    return <span key={col} className="pd-color-dot"
                      style={{background: hexMap[col] || '#888',
                        border: col.toLowerCase().includes('white') ? '1px solid rgba(255,255,255,0.25)' : 'none'}}
                      title={col}/>
                  })}
                  <span className="pd-std-names">
                    {(product.colorsStandard as string).split(',').map((c:string) => {
                      const name = c.trim()
                      const alias: Record<string,string> = {
                        'Matte Champagne':'Champagne','Matte White':'White','Matte Black':'Black',
                        'Anthracite':'Black','Anthracite Grey':'Black','Jet Black':'Black',
                        'Pure White':'White',
                      }
                      return alias[name] || name
                    }).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')}
                  </span>
                </span>
              )}

              {/* Marine Treatable — shimmer border + water drops inside→out */}
              {(product.marineTreatable || product.ipRating) && (
                <span className="pd-marine-tag">
                  {/* Sweeping shimmer border */}
                  <span className="pd-marine-border-shimmer" aria-hidden="true"/>
                  {/* Wet sheen */}
                  <span className="pd-marine-sheen" aria-hidden="true"/>
                  {/* Drops */}
                  <span className="pd-marine-drops" aria-hidden="true">
                    <span className="pd-drop pd-drop-1"/>
                    <span className="pd-drop pd-drop-2"/>
                    <span className="pd-drop pd-drop-3"/>
                    <span className="pd-drop pd-drop-4"/>
                  </span>
                  <svg className="pd-marine-icon" width="10" height="13" viewBox="0 0 10 13" fill="none" aria-hidden="true">
                    <path d="M5 0C5 0 0.5 4.5 0.5 7.5a4.5 4.5 0 009 0C9.5 4.5 5 0 5 0z"
                      fill="rgba(120,200,240,0.2)" stroke="rgba(140,210,255,0.8)" strokeWidth="0.7"/>
                  </svg>
                  <span className="pd-marine-text">Marine Treatable</span>
                  {product.ipRating && <span className="pd-marine-ip">{product.ipRating}</span>}
                </span>
              )}

              {/* Award Winning tag — Ghost 2.0 */}
              {product._id === 'prod-ghost2' && (
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'4px 10px', border:'0.5px solid rgba(201,169,110,0.4)',
                  fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.14em',
                  textTransform:'uppercase', color:'#c9a96e',
                }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <polygon points="4,0 5,3 8,3 5.5,5 6.5,8 4,6 1.5,8 2.5,5 0,3 3,3" fill="#c9a96e" opacity="0.8"/>
                  </svg>
                  Award Winning
                </span>
              )}

              {/* Custom RAL — spinning prism border + liquid drops */}
              {product.customRalAvailable && <RainbowPill/>}

              {/* Sage / Bergenia — fabric + frame finish tags */}
              {['prod-sage', 'prod-bergenia'].includes(product._id) && (<>
                <FabricPill/>
                <ChampagnePill/>
              </>)}

            </div>

            {/* CTAs */}
            <div className="pd-hero-ctas">
              <a href="https://configurator.xscace.com" target="_blank" rel="noopener noreferrer"
                className="btn-prim" style={{color:'#000'}}>
                Add to System →
              </a>
              {product.model3dUrl && <ARWallBtn modelUrl={product.model3dUrl} productName={product.productName} productId={product._id}/>}
              <a href={`/api/brochure/${product.slug?.current}`}
                target="_blank" rel="noopener noreferrer"
                className="pd-brochure-btn" aria-label="Download product brochure PDF">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="1" width="8" height="10" rx="0.8" stroke="currentColor" strokeWidth="0.8"/>
                  <line x1="4" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="0.6" opacity="0.6"/>
                  <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
                  <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
                  <path d="M9 9.5 L11 12 L13 9.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                  <line x1="11" y1="7" x2="11" y2="12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.7"/>
                </svg>
                Brochure
              </a>
            </div>
          </div>

          {/* Hero image / video */}
          <div className="pd-hero-right">
            {product.heroVideoFile?.asset?._ref || product.heroVideo ? (
              <div className="pd-hero-video-wrap">
                {product.heroVideoFile?.asset?._ref ? (
                  /* Native MP4 from Sanity — fastest, no bot detection */
                  <video
                    className="pd-hero-video"
                    src={`https://cdn.sanity.io/files/7r0kq57d/production/${product.heroVideoFile.asset._ref.replace(/^file-/, '').replace(/-([a-zA-Z0-9]+)$/, '.$1')}`}
                    autoPlay muted loop playsInline
                  />
                ) : (product.heroVideo?.includes('youtube') || product.heroVideo?.includes('youtu.be')) ? (
                  <div className="pd-hero-video-crop">
                    <iframe className="pd-hero-iframe"
                      src={`https://www.youtube-nocookie.com/embed/${
                        product.heroVideo.includes('youtu.be/')
                          ? product.heroVideo.split('youtu.be/')[1]?.split('?')[0]
                          : product.heroVideo.split('v=')[1]?.split('&')[0]
                      }?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&playlist=${
                        product.heroVideo.includes('youtu.be/')
                          ? product.heroVideo.split('youtu.be/')[1]?.split('?')[0]
                          : product.heroVideo.split('v=')[1]?.split('&')[0]
                      }`}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      frameBorder="0"
                    />
                  </div>
                ) : product.heroVideo?.includes('vimeo') ? (
                  <iframe className="pd-hero-iframe"
                    src={`https://player.vimeo.com/video/${product.heroVideo.split('vimeo.com/')[1]?.split('?')[0]}?autoplay=1&muted=1&loop=1&background=1`}
                    allow="autoplay; fullscreen" allowFullScreen frameBorder="0"
                  />
                ) : product.heroVideo ? (
                  <video className="pd-hero-video" src={product.heroVideo} autoPlay muted loop playsInline/>
                ) : null}
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



      
      {/* wave divider */}
      <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>
      {/* ── MODEL REVEAL + CONSTRAINTS ── */}
      {isOutdoor && !product.model3dUrl && product.galleryImages?.length > 0 ? (
        <section style={{background:'#000',padding:'72px 0 0'}}>
          <div style={{maxWidth:900,margin:'0 auto',padding:'0 60px'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(201,169,110,0.5)',marginBottom:20}}>Design · All Angles</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
              {product.galleryImages.slice(0,3).map((img: any, i: number) => {
                const url = getImageUrl(img, 900)
                return url ? (
                  <div key={i} style={{background:'#080808',overflow:'hidden',aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
                    <img src={url} alt={img.alt || product.productName} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
                  </div>
                ) : null
              })}
            </div>
          </div>
        </section>
      ) : (
        <ModelReveal
          modelUrl={product.model3dUrl || `/models/${product.slug?.current}.glb`}
          productName={product.productName}
          productId={product._id}
        />
      )}


            


      {/* wave divider */}
      <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>
      {/* ── RESOURCES & MEDIA ── */}
      {(product.productVideos && product.productVideos.length > 0 && !isAmp) ? (
        <VideoGallery
          images={[]}
          videos={product.productVideos || []}
          productName={product.productName}
          getImageUrl={getImageUrl}
        />
      ) : ['prod-cedar', 'prod-ghost2', 'prod-bonsai-ic', 'prod-cane-ic', 'prod-oak', 'prod-willow', 'prod-sage', 'prod-bergenia', 'prod-quadcane', 'prod-quadcane-ic', 'prod-camphor6', 'prod-camphor8'].includes(product._id) && (product.lifestyleImages?.length ?? 0) > 0 ? (
        <section className="vg-section">
          <div className="vg-videos">
            <div className="vg-panel">
              {(() => {
                const url = getImageUrl(product.lifestyleImages[0], 1600)
                return url ? <img src={url} alt={product.productName} className="vg-video-el" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/> : null
              })()}
              <div className="vg-vignette"/>
              <div className="vg-bottom-fade"/>
            </div>
            <div className="vg-divider"/>
            <div className="vg-panel">
              {(() => {
                const url = product.lifestyleImages[1] ? getImageUrl(product.lifestyleImages[1], 1600) : null
                return url ? <img src={url} alt={product.productName} className="vg-video-el" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/> : null
              })()}
              <div className="vg-vignette"/>
              <div className="vg-bottom-fade"/>
            </div>
          </div>
        </section>
      ) : ['prod-acacia6-pw','prod-acacia10-pw'].includes(product._id) && product.galleryImages?.length > 0 ? (
        <section style={{background:'#000'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:1}}>
            {(() => {
              const g = product.galleryImages
              const imgs = g.length >= 2 ? [g[0], g[g.length - 1]] : [g[0]]
              return imgs.map((img: any, i: number) => {
                const url = getImageUrl(img, 1200)
                return url ? (
                  <div key={i} style={{background:'#000', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', minHeight:280}}>
                    <img src={url} alt={product.productName} style={{maxWidth:'100%', maxHeight:280, objectFit:'contain', display:'block'}}/>
                  </div>
                ) : null
              })
            })()}
          </div>
        </section>
      ) : null}

      {/* Ghost 2.0 — form factor world-first section */}
      {product._id === 'prod-ghost2' && (
        <section style={{background:'#000'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0}}>
            {/* Copy */}
            <div style={{padding:'72px 56px'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(201,169,110,0.55)',marginBottom:20}}>Form Factor · World First</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:'clamp(28px,3vw,52px)',color:'#eeebe5',lineHeight:1.08,marginBottom:24}}>
                No ceiling speaker<br/>on Earth is built<br/><em style={{color:'#c9a96e',fontStyle:'italic'}}>like this.</em>
              </h2>
              <p style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:14,color:'rgba(200,196,188,0.5)',lineHeight:1.8,marginBottom:36}}>
                Every conventional in-ceiling speaker sits below its cutout. The bezel, the mounting
                ring, the driver surround — all visible below the ceiling plane you designed. The
                Ghost 2.0 is the only in-ceiling speaker in the world that doesn&apos;t. Its face sits
                within 0.3mm of the architectural surface. Not recessed. Not protruding. Flush.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  '0.3mm flush to the architectural plane',
                  'No visible bezel below the ceiling surface',
                  'Paintable grille — disappears with one coat',
                  'Magnetic install — no screws after the bracket',
                ].map((f,i) => (
                  <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'rgba(201,169,110,0.5)',marginTop:2,flexShrink:0}}>×</span>
                    <span style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:13,color:'rgba(200,196,188,0.55)',lineHeight:1.5}}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-section diagram */}
            <div style={{padding:'72px 48px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
              <svg viewBox="0 0 420 340" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto',display:'block'}}>
                <defs>
                  <pattern id="gh-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#191919" strokeWidth="1.5"/>
                  </pattern>
                </defs>

                {/* ── LEFT: Conventional in-ceiling ── */}
                <rect x="0" y="0" width="190" height="100" fill="url(#gh-hatch)"/>
                <line x1="0" y1="100" x2="190" y2="100" stroke="rgba(200,196,188,0.18)" strokeWidth="0.8"/>
                <text x="95" y="16" textAnchor="middle" fill="rgba(200,196,188,0.18)" fontFamily="DM Mono,monospace" fontSize="7" letterSpacing="1.5">CONVENTIONAL</text>
                {/* Cutout */}
                <rect x="50" y="0" width="90" height="100" fill="#050505"/>
                {/* Backbox inside ceiling */}
                <rect x="55" y="5" width="80" height="92" rx="1" fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="0.5"/>
                {/* Mounting ring — BELOW ceiling plane */}
                <rect x="38" y="100" width="114" height="11" rx="0.5" fill="#1a1a1a" stroke="#272727" strokeWidth="0.5"/>
                {/* Speaker grille face — hangs below */}
                <rect x="46" y="111" width="98" height="78" rx="0.5" fill="#101010" stroke="#1c1c1c" strokeWidth="0.5"/>
                {/* Grille dots */}
                {Array.from({length: 35}, (_,i) => {
                  const row = Math.floor(i/7), col = i%7
                  return <circle key={i} cx={57+col*13} cy={126+row*14} r="1.2" fill="#1d1d1d"/>
                })}
                {/* Protrusion depth arrow */}
                <line x1="157" y1="100" x2="157" y2="189" stroke="rgba(201,169,110,0.3)" strokeWidth="0.6"/>
                <line x1="152" y1="100" x2="162" y2="100" stroke="rgba(201,169,110,0.3)" strokeWidth="0.6"/>
                <line x1="152" y1="189" x2="162" y2="189" stroke="rgba(201,169,110,0.3)" strokeWidth="0.6"/>
                <text x="166" y="148" fill="rgba(201,169,110,0.35)" fontFamily="DM Mono,monospace" fontSize="8">25–35</text>
                <text x="166" y="160" fill="rgba(201,169,110,0.35)" fontFamily="DM Mono,monospace" fontSize="8">mm</text>

                {/* VS divider */}
                <line x1="210" y1="10" x2="210" y2="330" stroke="#161616" strokeWidth="0.8"/>
                <text x="210" y="178" textAnchor="middle" fill="#1e1e1e" fontFamily="DM Mono,monospace" fontSize="11" letterSpacing="2">VS</text>

                {/* ── RIGHT: Ghost 2.0 ── */}
                <rect x="230" y="0" width="190" height="100" fill="url(#gh-hatch)"/>
                <text x="325" y="16" textAnchor="middle" fill="rgba(201,169,110,0.3)" fontFamily="DM Mono,monospace" fontSize="7" letterSpacing="1.5">GHOST 2.0</text>
                {/* Thin cutout */}
                <rect x="268" y="0" width="114" height="100" fill="#050505"/>
                {/* Shallower backbox */}
                <rect x="273" y="22" width="104" height="76" rx="1" fill="#080808" stroke="#111" strokeWidth="0.5"/>
                {/* Ceiling plane line — champagne tint */}
                <line x1="230" y1="100" x2="420" y2="100" stroke="rgba(201,169,110,0.35)" strokeWidth="0.8"/>
                {/* Ghost face — virtually AT the ceiling plane */}
                <rect x="260" y="98" width="130" height="4" rx="0.5" fill="rgba(201,169,110,0.08)" stroke="rgba(201,169,110,0.55)" strokeWidth="0.5"/>
                {/* Micro-perforations */}
                {Array.from({length: 11}, (_,i) => (
                  <circle key={i} cx={267+i*12} cy={100} r="0.8" fill="rgba(201,169,110,0.55)"/>
                ))}
                {/* 0.3mm bracket callout */}
                <line x1="398" y1="98" x2="398" y2="102" stroke="rgba(201,169,110,0.6)" strokeWidth="0.7"/>
                <line x1="394" y1="98" x2="402" y2="98" stroke="rgba(201,169,110,0.6)" strokeWidth="0.7"/>
                <line x1="394" y1="102" x2="402" y2="102" stroke="rgba(201,169,110,0.6)" strokeWidth="0.7"/>
                <line x1="398" y1="102" x2="378" y2="136" stroke="rgba(201,169,110,0.35)" strokeWidth="0.5" strokeDasharray="2,2"/>
                <text x="325" y="148" textAnchor="middle" fill="rgba(201,169,110,0.85)" fontFamily="DM Mono,monospace" fontSize="14">0.3mm</text>
                <text x="325" y="163" textAnchor="middle" fill="rgba(201,169,110,0.4)" fontFamily="DM Mono,monospace" fontSize="8">flush to plane</text>

                {/* CEILING PLANE label */}
                <text x="2" y="96" fill="rgba(200,196,188,0.1)" fontFamily="DM Mono,monospace" fontSize="6" letterSpacing="0.5">CEILING PLANE</text>

                {/* Room labels */}
                <text x="95" y="295" textAnchor="middle" fill="rgba(200,196,188,0.04)" fontFamily="DM Mono,monospace" fontSize="8" letterSpacing="3">ROOM</text>
                <text x="325" y="295" textAnchor="middle" fill="rgba(200,196,188,0.04)" fontFamily="DM Mono,monospace" fontSize="8" letterSpacing="3">ROOM</text>
              </svg>
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
            {([
              {val:'0.3mm', label:'Flush to ceiling plane'},
              {val:'80Hz',  label:'Low frequency limit'},
              {val:'×4',   label:'Driver array'},
              {val:'Magnetic', label:'Tool-free after bracket'},
            ] as {val:string;label:string}[]).map((s,i) => (
              <div key={i} style={{padding:'32px 40px'}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'#c9a96e',lineHeight:1,marginBottom:8}}>{s.val}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:'.14em',color:'rgba(200,196,188,0.3)',textTransform:'uppercase'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* wave divider */}
      <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>

      {/* Inside the Xylem — ADAU + PsySculpt */}
      {isAmp && product.hasDsp && (
        <section style={{background:'#000', borderTop:'0.5px solid #111', position:'relative', overflow:'hidden'}}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.028,pointerEvents:'none'}} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="pcbg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c9a96e" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#pcbg)"/>
          </svg>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{padding:'64px 56px 40px'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(201,169,110,0.45)',marginBottom:14}}>SigmaDSP · ADAU1701 · PsySculpt™</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:'clamp(28px,2.8vw,44px)',color:'#eeebe5',lineHeight:1.05,maxWidth:600}}>
                Inside the <em style={{fontStyle:'italic',color:'#c9a96e'}}>Xylem</em>
              </h2>
              <p style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:14,color:'rgba(200,196,188,0.45)',marginTop:14,maxWidth:560,lineHeight:1.7}}>
                Every parameter is executed in real time by a dedicated DSP chip and shaped by XSCACE proprietary psychoacoustic processing. No approximations. No look-up tables.
              </p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,marginBottom:1}}>
              <div style={{display:'flex',flexDirection:'column',gap:1}}>
                {((product.productVideos||[]).length > 0 ? product.productVideos : (product.xylemVideos||[])).slice(0,2).map((v:any,i:number) => {
                  const ref = v.videoFile?.asset?._ref
                  const src = v.url || (ref ? 'https://cdn.sanity.io/files/7r0kq57d/production/'+ref.replace('file-','').replace(/-([a-z0-9]+)$/,'.$1') : null)
                  return src ? (
                    <div key={i} style={{position:'relative',background:'#000',aspectRatio:'16/9',overflow:'hidden'}}>
                      <video src={src} autoPlay muted loop playsInline style={{width:'100%',height:'100%',objectFit:'cover',display:'block',filter:'brightness(0.85) contrast(1.1)'}}/>
                      <div style={{position:'absolute',bottom:12,left:14,fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'.14em',color:'rgba(201,169,110,0.55)'}}>
                        {i===0?'ADAU1701 DSP IC':'CLASS D OUTPUT STAGE'}
                      </div>
                    </div>
                  ) : (
                    <div key={i} style={{background:'#050505',aspectRatio:'16/9',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(201,169,110,0.15)',letterSpacing:'.12em'}}>UPLOADING SOON</span>
                    </div>
                  )
                })}

              </div>
              <div style={{display:'flex',flexDirection:'column',gap:1}}>
                <div style={{padding:'40px 48px',background:'rgba(201,169,110,0.025)',flex:1,display:'flex',flexDirection:'column',justifyContent:'center',borderLeft:'2px solid rgba(201,169,110,0.15)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(201,169,110,0.6)',boxShadow:'0 0 8px rgba(201,169,110,0.4)'}}/>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'.2em',color:'rgba(201,169,110,0.6)'}}>SIGMADSP · ANALOG DEVICES</span>
                  </div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#eeebe5',marginBottom:12}}>ADAU1701</div>
                  <p style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:13,color:'rgba(200,196,188,0.55)',lineHeight:1.75,marginBottom:24}}>
                    28/56-bit audio processor running at 50 MIPS. Executes all crossover calculations, parametric EQ biquad filters, and per-channel delay compensation in the digital domain — with onboard program storage that survives any power event.
                  </p>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                    {['50 MIPS','28/56-bit','8× Biquad','Non-volatile'].map(tag=>(
                      <span key={tag} style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'.1em',color:'rgba(201,169,110,0.35)',borderBottom:'0.5px solid rgba(201,169,110,0.15)',paddingBottom:3}}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{padding:'40px 48px',background:'#000',flex:1,display:'flex',flexDirection:'column',justifyContent:'center',borderLeft:'2px solid rgba(201,169,110,0.06)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(201,169,110,0.35)'}}/>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'.2em',color:'rgba(201,169,110,0.4)'}}>XSCACE PROPRIETARY</span>
                  </div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#eeebe5',marginBottom:4}}>PsySculpt™</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'.12em',color:'rgba(201,169,110,0.3)',marginBottom:16}}>PSYCHOACOUSTIC PROCESSING</div>
                  <p style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:13,color:'rgba(200,196,188,0.5)',lineHeight:1.75,marginBottom:20}}>
                    Psychoacoustic tuning applied at the driver and crossover level — shaping the listening experience to how the human ear naturally perceives space, depth, and dimensionality. Runs as a processing layer on top of the ADAU1701, calibrated per speaker profile.
                  </p>
                  <a href="/technology#psysculpt" style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'.14em',color:'rgba(201,169,110,0.45)',textDecoration:'none'}}>Learn more →</a>
                </div>
              </div>
            </div>
            <SignalChain/>
            
          </div>
        </section>
      )}

      {isAmp && product.hasDsp && (
        <section style={{background:'#000', borderTop:'0.5px solid #111', padding:'64px 56px'}}>
          <div style={{marginBottom:40}}>
            <div style={{fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(201,169,110,0.55)', marginBottom:16}}>400W Total · Class D</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:'clamp(28px,2.8vw,42px)', color:'#eeebe5', lineHeight:1.1}}>
              Channel <em style={{fontStyle:'italic', color:'#c9a96e'}}>power distribution</em>
            </h2>
            {product.channelConfigurations && (
              <p style={{fontFamily:"'Barlow',sans-serif", fontWeight:300, fontSize:14, color:'rgba(200,196,188,0.45)', marginTop:12}}>{product.channelConfigurations}</p>
            )}
          </div>
          {(() => {
            const isX2 = product._id === 'prod-xylem2'
            const isX3 = product._id === 'prod-xylem3'
            const channels: {ch:string,power:string,load:string,role:string,accent:boolean}[] = isX2
              ? [{ch:'CH 1',power:'200W',load:'8Ω',role:'Full Range — L',accent:false},{ch:'CH 2',power:'200W',load:'8Ω',role:'Full Range — R',accent:false}]
              : isX3
              ? [{ch:'CH 1',power:'100W',load:'8Ω',role:'Full Range — L',accent:false},{ch:'CH 2',power:'100W',load:'8Ω',role:'Full Range — R',accent:false},{ch:'CH 3',power:'200W',load:'8Ω',role:'Subwoofer / LFE',accent:true}]
              : [{ch:'CH 1',power:'100W',load:'8Ω',role:'Full Range — L',accent:false},{ch:'CH 2',power:'100W',load:'8Ω',role:'Full Range — R',accent:false},{ch:'CH 3',power:'100W',load:'8Ω',role:'Full Range — L',accent:false},{ch:'CH 4',power:'100W',load:'8Ω',role:'Full Range — R',accent:false}]
            return (
              <div style={{border:'0.5px solid #111',overflow:'hidden'}}>
                {/* Column labels */}
                <div style={{display:'grid',gridTemplateColumns:'64px 96px 1fr 100px',background:'#000',borderBottom:'0.5px solid rgba(201,169,110,0.08)'}}>
                  {[['CH',''],['PWR',''],['Function',''],['','']].map(([h],i) => (
                    <div key={i} style={{padding:'6px 14px',fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:'.2em',color:'rgba(201,169,110,0.22)'}}>{h}</div>
                  ))}
                </div>
                {channels.map((row,i) => (
                  <div key={row.ch} style={{
                    display:'grid',gridTemplateColumns:'64px 96px 1fr 100px',alignItems:'stretch',
                    background:'#000',
                    borderBottom:`0.5px solid ${row.accent?'rgba(201,169,110,0.12)':'rgba(255,255,255,0.02)'}`,
                  }}>
                    {/* CH number */}
                    <div style={{
                      padding:'20px 14px',
                      background:row.accent?'rgba(201,169,110,0.06)':'rgba(255,255,255,0.015)',
                      borderRight:`1px solid ${row.accent?'rgba(201,169,110,0.2)':'rgba(255,255,255,0.03)'}`,
                      display:'flex',flexDirection:'column',justifyContent:'center',
                    }}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:'.08em',color:row.accent?'rgba(201,169,110,0.8)':'rgba(200,196,188,0.22)'}}>{row.ch}</span>
                    </div>
                    {/* Power */}
                    <div style={{
                      padding:'20px 14px',
                      borderRight:'1px solid rgba(255,255,255,0.03)',
                      display:'flex',flexDirection:'column',justifyContent:'center',
                    }}>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:row.accent?'#c9a96e':'rgba(216,212,206,0.85)',lineHeight:1}}>{row.power}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(200,196,188,0.18)',marginTop:4,letterSpacing:'.06em'}}>{row.load}</span>
                    </div>
                    {/* Role */}
                    <div style={{
                      padding:'20px 20px',
                      display:'flex',alignItems:'center',
                    }}>
                      <div>
                        <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:13,color:row.accent?'rgba(201,169,110,0.75)':'rgba(200,196,188,0.48)',lineHeight:1.3}}>{row.role}</div>
                        {row.accent && <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(201,169,110,0.35)',marginTop:5,letterSpacing:'.12em'}}>DEDICATED CHANNEL</div>}
                      </div>
                    </div>
                    {/* DSP tag */}
                    <div style={{
                      padding:'20px 14px',
                      display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'flex-end',
                      borderLeft:'1px solid rgba(255,255,255,0.02)',
                    }}>
                      <div style={{display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end'}}>
                        {['EQ','DELAY','XOVER'].map(tag => (
                          <span key={tag} style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:row.accent?'rgba(201,169,110,0.25)':'rgba(200,196,188,0.12)',letterSpacing:'.12em'}}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 20px',background:'#000',borderTop:'0.5px solid rgba(201,169,110,0.1)'}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(201,169,110,0.25)',letterSpacing:'.18em'}}>TOTAL OUTPUT</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'rgba(201,169,110,0.5)'}}>400W</span>
                </div>
              </div>
            )
          })()}
        </section>
      )}

      {/* ── SPECS ── */}
      <SpecsTicker product={product} acousticSpecs={acousticSpecs} physicalSpecs={physicalSpecs} connectivitySpecs={connectivitySpecs} isAmp={isAmp}/>

      {/* ── DIMENSION DRAWING ── */}
      {!isAmp && (product.heightMm || product.widthMm) && (
        <DimensionDrawing product={product}/>
      )}




      {/* ── FR + POLAR CHARTS ── */}
      {!isAmp && product.sensitivityDb && product.freqLowHz && (
        <section className="pd-section pd-charts-section">
          <div className="pd-charts-header">
            <div className="pd-section-ey">Acoustic Measurements</div>
            <h2 className="pd-section-title">Frequency Response &amp; Directivity</h2>
          </div>
          <div className="pd-charts-grid">
            <div className="pd-chart-panel">
              <div className="pd-chart-label">
                Frequency Response
                {['prod-acacia6-pw','prod-acacia10-pw'].includes(product._id) && <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(201,169,110,0.4)',marginLeft:8,letterSpacing:'.1em'}}>Subwoofer range</span>}
              </div>
              <FreqResponseChart product={product}/>
            </div>
            {product.directivityHDeg && (
              <div className="pd-chart-panel">
                <div className="pd-chart-label">Polar Pattern</div>
                <PolarChart product={product}/>
              </div>
            )}
            {['prod-acacia6-pw','prod-acacia10-pw'].includes(product._id) && product.galleryImages?.[1] && (
              <div className="pd-chart-panel">
                <div className="pd-chart-label">Rear Panel</div>
                <div style={{background:'#000'}}>
                  <img src={getImageUrl(product.galleryImages[1], 900)} alt="Rear panel"
                    style={{width:'100%',objectFit:'contain',display:'block',padding:'12px',maxHeight:200,boxSizing:'border-box'}}/>
                </div>
                {(product.inputs || product.outputs) && (
                  <div style={{borderTop:'0.5px solid #0f0f0f'}}>
                    <div style={{padding:'7px 12px 4px',fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(201,169,110,0.3)',background:'#050505'}}>Connections</div>
                    {[
                      product.inputs  ? {label:'IN',  value:product.inputs,  icon:'M0,7 L2.5,7 M14,7 L11.5,7 M7,0 L7,2.5 M7,14 L7,11.5'} : null,
                      product.outputs ? {label:'OUT', value:product.outputs, icon:'M11.5,7 L14,7 M0,7 L2.5,7 M7,0 L7,2.5 M7,14 L7,11.5'} : null,
                    ].filter(Boolean).map(row => row && (
                      <div key={row.label} style={{display:'grid',gridTemplateColumns:'56px 1fr',borderTop:'0.5px solid #0f0f0f'}}>
                        <div style={{padding:'10px',background:'#080808',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="4.5" stroke="rgba(201,169,110,0.5)" strokeWidth="0.8"/>
                            <circle cx="7" cy="7" r="1.5" fill="rgba(201,169,110,0.35)"/>
                            <path d={row.icon} stroke="rgba(201,169,110,0.5)" strokeWidth="0.8"/>
                          </svg>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:6,letterSpacing:'.15em',color:'rgba(201,169,110,0.45)'}}>{row.label}</span>
                        </div>
                        <div style={{padding:'10px 12px',background:'#050505',display:'flex',alignItems:'center'}}>
                          <span style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:12,color:'rgba(200,196,188,0.6)',lineHeight:1.45}}>{row.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TECH BADGES ── */}
      {badges.length > 0 && (
        <section className="pd-section pd-tech-section">
          <div className="pd-tech-header">
            <div>
              <div className="pd-section-ey">Proprietary Technology</div>
              <h2 className="pd-section-title">Built different. <em>By design.</em></h2>
            </div>
            <a href="/about#technology" className="pd-tech-learn-more">
              Full Technology Story
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
          <div className="pd-tech-grid">
            {badges.map(badge => {
              const tech = TECH_MAP[badge]
              if (!tech) return null
              return (
                <a key={badge} href="/about#technology" className="pd-tech-card">
                  {TECH_ICONS[badge] && (
                    <div className="pd-tech-icon" dangerouslySetInnerHTML={{__html: TECH_ICONS[badge]}}></div>
                  )}
                  <div className="pd-tech-name">{tech.label || badge}</div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      


      

      
      {/* wave divider */}
      <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>

      {/* ── COMMON INSTALLATIONS ── */}
      <section className="pd-section pd-setups-section">
        <div className="pd-section-inner">
          <div className="pd-section-ey">In Use</div>
          <h2 className="pd-section-title">Common <em>installations</em></h2>
        </div>

        {(product.typicalSetups?.length > 0 ? product.typicalSetups : []).map((setup: any, si: number) => {
          const isCinema = setup.label?.toLowerCase().includes('cinema') || setup.label?.toLowerCase().includes('home')
          // Build chain right-to-left: Source → Amp → Speakers
          const items: any[] = []

          // AVR at the right (source) for cinema setups
          if (isCinema) {
            items.push({ type: 'avr' })
          }

          // Products in reverse order
          const prods = [...(setup.products || [])].reverse()
          prods.forEach((sp: any) => items.push({ type: 'product', sp }))

          return (
            <div key={setup._key} className="ci-setup">
              {/* Single flex row — each item is a fixed-width column */}
              <div className="ci-chain">
                {items.map((item: any, idx: number) => (
                  <div key={idx} style={{display:'flex', alignItems:'center', flexShrink:0}}>
                    {/* Connector between items — margin-top aligns to image centre (label=20px, so offset 10px) */}
                    {idx > 0 && (
                      <div className="ci-connector">
                        <div className="ci-conn-line" />
                        <div className="ci-conn-arrow" />
                      </div>
                    )}
                    {item.type === 'product' ? (() => {
                      const p = item.sp.product
                      if (!p) return null
                      const img = getImageUrl(p.galleryImage || p.heroImage, 300)
                      return (
                        <a href={`/products/${p.catSlug || ''}/${p.slug || ''}`}
                          className="ci-product" style={{textDecoration:'none'}}>
                          <div className="ci-role">{item.sp.role}</div>
                          <div className="ci-img">
                            {img
                              ? <img src={img} alt={p.productName} style={{width:'100%',height:'100%',objectFit:'contain',display:'block',padding:'8px'}}/>
                              : <div className="ci-img-empty"/>
                            }
                          </div>
                          <div className="ci-name">{p.productName}</div>
                          {item.sp.quantity > 1 && <div className="ci-qty">×{item.sp.quantity}</div>}
                        </a>
                      )
                    })() : (
                      <div className="ci-product">
                        <div className="ci-role">Source</div>
                        <div className="ci-img ci-img-avr">
                          <svg viewBox="0 0 80 50" fill="none" style={{width:'60%',opacity:0.3}}>
                            <rect x="2" y="2" width="76" height="46" rx="2" stroke="#c9a96e" strokeWidth="0.8"/>
                            <rect x="8" y="10" width="28" height="5" rx="1" stroke="#c9a96e" strokeWidth="0.5"/>
                            <rect x="8" y="19" width="40" height="5" rx="1" stroke="#c9a96e" strokeWidth="0.5"/>
                            <rect x="8" y="28" width="32" height="5" rx="1" stroke="#c9a96e" strokeWidth="0.5"/>
                            <text x="64" y="29" textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="monospace">AVR</text>
                          </svg>
                        </div>
                        <div className="ci-name">Any AVR</div>
                        <div className="ci-qty">Dolby Atmos</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="ci-meta">
                {setup.label}{setup.description ? ` · ${setup.description}` : ''}
              </div>
            </div>
          )
        })}

        {/* Build Your System CTA */}
        <div className="pd-setup-cta-row">
          <div className="pd-setup-cta-text">
            <div className="pd-section-ey">AI System Builder</div>
            <div className="pd-setup-cta-headline">Don't see your setup?</div>
            <div className="pd-setup-cta-sub">Tell the AI your room, budget and use case — get a complete system in seconds.</div>
          </div>
          <div className="pd-setup-cta-actions">
            <a href={`/api/manual/${product.slug?.current}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-sec"
              aria-label="Download installation manual PDF">
              Install Guide ↓
            </a>
            <a href="https://configurator.xscace.com" target="_blank" rel="noopener noreferrer"
              className="btn-prim" style={{color:'#000'}}>
              Build My System →
            </a>
          </div>
        </div>

      </section>

      

            {/* ── SETUPS ── */}


      {/* Acacia 6 mounting alternatives — In-Wall Passive + Standard Passive */}
      {isSub && ['prod-acacia6-pw','prod-acacia10-pw'].includes(product._id) && (() => {
        const is10 = product._id === 'prod-acacia10-pw'
        const iwHero = is10
          ? 'https://cdn.sanity.io/images/7r0kq57d/production/6a523608c448d66d4aade311a296fc9c646557be-3840x2159.png?w=600&auto=format&q=85'
          : 'https://cdn.sanity.io/images/7r0kq57d/production/6a523608c448d66d4aade311a296fc9c646557be-3840x2159.png?w=600&auto=format&q=85'
        const iwLife = 'https://cdn.sanity.io/images/7r0kq57d/production/e2e9023f6373b647b7ab2b42481e0cd08121dddb-1755x1298.png?w=600&auto=format&q=85'
        const stdHero = is10
          ? 'https://cdn.sanity.io/images/7r0kq57d/production/b618d2f9e49502d4d61f76c96c9f70f506a07ee2-976x548.png?w=600&auto=format&q=85'
          : 'https://cdn.sanity.io/images/7r0kq57d/production/b618d2f9e49502d4d61f76c96c9f70f506a07ee2-976x548.png?w=600&auto=format&q=85'
        const stdLife = 'https://cdn.sanity.io/images/7r0kq57d/production/e6eac14f84672ccf95e6aba0c2b81b53bc5a4377-979x549.png?w=600&auto=format&q=85'
        const name = is10 ? 'Acacia 10' : 'Acacia 6'
        const iwSlug = is10 ? 'acacia-10-in-wall-passive-subwoofer' : 'acacia-6-in-wall-passive-subwoofer'
        const stdSlug = is10 ? 'acacia-10-standard-passive-subwoofer' : 'acacia-6-standard-passive-subwoofer'
        return (
          <section className="pd-acc-section">
            <h2 className="pd-section-title">Mount <em>your way</em></h2>
            <div className="acc-card">
              <div className="acc-img-side">
                <RevealSlider heroUrl={iwHero} lifestyleUrl={iwLife} alt={`${name} In-Wall Passive`}/>
              </div>
              <div className="acc-info-side">
                <div className="acc-eyebrow">In-Wall Passive</div>
                <div className="acc-name">{name} In-Wall Passive</div>
                <div className="acc-desc">Identical acoustic performance installed flush into the wall cavity. Completely invisible. Requires an external amplifier with LFE output.</div>
                <a href={`/products/subwoofer-series/${iwSlug}`} className="acc-enquire">View {name} In-Wall →</a>
              </div>
            </div>
            <div className="acc-card acc-card-flip">
              <div className="acc-img-side">
                <RevealSlider heroUrl={stdHero} lifestyleUrl={stdLife} alt={`${name} Standard Passive`}/>
              </div>
              <div className="acc-info-side">
                <div className="acc-eyebrow">Standard Passive</div>
                <div className="acc-name">{name} Standard Passive</div>
                <div className="acc-desc">Same enclosure and driver, without the built-in amplifier. Pair with any subwoofer output for a fully custom signal chain.</div>
                <a href={`/products/subwoofer-series/${stdSlug}`} className="acc-enquire">View {name} Passive →</a>
              </div>
            </div>
          </section>
        )
      })()}

      {/* wave divider */}
      <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>


      {['prod-acacia6-pw','prod-acacia10-pw'].includes(product._id) && (<>
      {/* ── Section 3: Enhanced NC section ── */}
      <section style={{background:'#000', borderTop:'0.5px solid #111', padding:'64px 56px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center'}}>
          <div>
            <div style={{fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(201,169,110,0.55)', marginBottom:16}}>Full DSP Control · Over LAN</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:'clamp(28px,2.8vw,42px)', color:'#eeebe5', lineHeight:1.1, marginBottom:20}}>
              Controlled by <em style={{fontStyle:'italic', color:'#c9a96e'}}>XSCACE</em><br/>Network Controller
            </h2>
            <p style={{fontFamily:"'Barlow',sans-serif", fontWeight:300, fontSize:14, color:'rgba(200,196,188,0.6)', lineHeight:1.75, marginBottom:28}}>
              Connect to the {product.productName} over your local network. Adjust the built-in DSP in real time — crossover frequency, parametric EQ, output delay, and channel routing — without touching the hardware.
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:10, marginBottom:32}}>
              {['Parametric EQ — 5 bands per channel', 'Variable crossover · 40–200Hz', 'Channel delay · up to 27ms', 'Factory + custom preset management', 'Real-time level monitoring'].map(f => (
                <div key={f} style={{display:'flex', alignItems:'flex-start', gap:12}}>
                  <span style={{fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(201,169,110,0.5)', marginTop:2}}>×</span>
                  <span style={{fontFamily:"'Barlow',sans-serif", fontWeight:300, fontSize:13, color:'rgba(200,196,188,0.65)'}}>{f}</span>
                </div>
              ))}
            </div>
            <a href="/software/network-controller" style={{display:'inline-flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'#c9a96e', border:'0.5px solid rgba(201,169,110,0.4)', padding:'10px 20px', textDecoration:'none'}}>Download Free →</a>
          </div>
          <div>
            <div style={{background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:4, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.8)'}}>
              <div style={{height:10, background:'#0d0d0d', borderBottom:'1px solid #141414', display:'flex', alignItems:'center', paddingLeft:8, gap:4}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#1e1e1e'}}/><div style={{width:6,height:6,borderRadius:'50%',background:'#1e1e1e'}}/><div style={{width:6,height:6,borderRadius:'50%',background:'#1e1e1e'}}/>
              </div>
              <img src="https://cdn.sanity.io/images/7r0kq57d/production/886620094c00c68ad5e10fb34b4c2071a7dccfa1-2922x1912.png?w=900&auto=format&q=85" alt="XSCACE Network Controller" style={{width:'100%',display:'block',maxHeight:260,objectFit:'cover',objectPosition:'top'}}/>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Control System Compatibility ── */}
      <section style={{background:'#000', borderTop:'0.5px solid #111', padding:'64px 56px'}}>
        <div style={{marginBottom:40}}>
          <div style={{fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(201,169,110,0.55)', marginBottom:16}}>Open Integration · TCP/IP API</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:'clamp(28px,2.8vw,42px)', color:'#eeebe5', lineHeight:1.1}}>
            Works with any <em style={{fontStyle:'italic', color:'#c9a96e'}}>control system</em>
          </h2>
          <p style={{fontFamily:"'Barlow',sans-serif", fontWeight:300, fontSize:14, color:'rgba(200,196,188,0.55)', lineHeight:1.75, marginTop:16, maxWidth:600}}>
            The {product.productName} exposes a full TCP/IP command API. Any IP-capable control system integrates natively — no middleware, no adapters.
          </p>
        </div>
        <div style={{display:'flex', gap:1, flexWrap:'wrap', marginBottom:48}}>
          {['Control4', 'Crestron', 'Savant', 'AMX', 'RTI', 'Josh.ai'].map(brand => (
            <div key={brand} style={{
              padding:'10px 22px', border:'0.5px solid #1e1e1e', background:'#000',
              fontFamily:"'Barlow',sans-serif", fontWeight:300, fontSize:13,
              letterSpacing:'0.04em', color:'rgba(200,196,188,0.45)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>{brand}</div>
          ))}
          <div style={{
            padding:'10px 22px', border:'0.5px solid #1e1e1e', background:'#000',
            fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.12em',
            color:'rgba(201,169,110,0.3)', display:'flex', alignItems:'center',
          }}>+ more</div>
        </div>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          <a href="/downloads/acacia6-api-commands.pdf" download style={{display:'inline-flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'#000', background:'#c9a96e', padding:'10px 20px', textDecoration:'none'}}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v6M3 5l2.5 2.5L8 5M1 9.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Download API Commands
          </a>
          <a href="mailto:support@xscace.com?subject=Driver Request — Acacia 6 Powered" style={{display:'inline-flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'#c9a96e', border:'0.5px solid rgba(201,169,110,0.4)', padding:'10px 20px', textDecoration:'none'}}>Request Custom Driver →</a>
        </div>
      </section>

      {/* ── Section 5: 3-Channel Amplifier ── */}
      <section style={{background:'#000', borderTop:'0.5px solid #111', padding:'64px 56px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center'}}>
          <div>
            <div style={{fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(201,169,110,0.55)', marginBottom:16}}>Built-in · 200W Class D · 3 Channels</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:'clamp(28px,2.8vw,42px)', color:'#eeebe5', lineHeight:1.1, marginBottom:20}}>
              One box.<br/><em style={{fontStyle:'italic', color:'#c9a96e'}}>Three channels.</em>
            </h2>
            <p style={{fontFamily:"'Barlow',sans-serif", fontWeight:300, fontSize:14, color:'rgba(200,196,188,0.6)', lineHeight:1.75, marginBottom:32}}>
              A 200W Class D amplifier with three discrete channels — one drives the internal subwoofer driver, two drive any external speakers in your system. No separate amplifier required.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:1,marginBottom:8}}>
              {([
                {ch:'CH 1',name:'Internal Subwoofer',power:`${product.powerRmsW}W · LFE`,note:'Dedicated low-frequency channel driving the built-in 6″ driver',accent:true},
                {ch:'CH 2',name:'Speaker Output — L',power:'Full Range',note:'Connects to any 4–8Ω loudspeaker',accent:false},
                {ch:'CH 3',name:'Speaker Output — R',power:'Full Range',note:'Connects to any 4–8Ω loudspeaker',accent:false},
              ] as {ch:string,name:string,power:string,note:string,accent:boolean}[]).map(row => (
                <div key={row.ch} style={{
                  display:'grid',gridTemplateColumns:'48px 1fr auto',alignItems:'center',gap:0,
                  background:row.accent ? 'rgba(201,169,110,0.03)' : '#060606',
                  borderLeft:`2px solid ${row.accent ? 'rgba(201,169,110,0.4)' : '#111'}`,
                }}>
                  <div style={{padding:'16px 12px',borderRight:'0.5px solid #111',textAlign:'center'}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:'.12em',color:row.accent?'rgba(201,169,110,0.6)':'rgba(200,196,188,0.25)',lineHeight:1.4}}>{row.ch}</div>
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#e0dcd6',marginBottom:3}}>{row.name}</div>
                    <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:300,fontSize:11,color:'rgba(200,196,188,0.35)',lineHeight:1.4}}>{row.note}</div>
                  </div>
                  <div style={{padding:'14px 16px',textAlign:'right',whiteSpace:'nowrap'}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:row.accent?'rgba(201,169,110,0.55)':'rgba(200,196,188,0.2)',letterSpacing:'.08em'}}>{row.power}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <svg viewBox="0 0 420 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%'}}>
              {/* Grid lines */}
              <line x1="0" y1="100" x2="420" y2="100" stroke="#0d0d0d" strokeWidth="0.5"/>
              <line x1="0" y1="200" x2="420" y2="200" stroke="#0d0d0d" strokeWidth="0.5"/>

              {/* Source block */}
              <rect x="10" y="120" width="90" height="56" rx="1" fill="#080808" stroke="#181818" strokeWidth="0.5"/>
              <text x="55" y="144" textAnchor="middle" fill="rgba(200,196,188,0.35)" fontSize="8" fontFamily="monospace" letterSpacing="1">SOURCE</text>
              <text x="55" y="158" textAnchor="middle" fill="rgba(201,169,110,0.3)" fontSize="7" fontFamily="monospace">LFE / LINE IN</text>

              {/* Arrow source → amp */}
              <line x1="100" y1="148" x2="145" y2="148" stroke="rgba(201,169,110,0.2)" strokeWidth="0.8" strokeDasharray="3,2"/>
              <polygon points="145,145 151,148 145,151" fill="rgba(201,169,110,0.3)"/>

              {/* Amp block */}
              <rect x="151" y="72" width="108" height="152" rx="1" fill="#050505" stroke="rgba(201,169,110,0.15)" strokeWidth="0.5"/>
              {/* Amp top label */}
              <text x="205" y="92" textAnchor="middle" fill="rgba(201,169,110,0.5)" fontSize="7" fontFamily="monospace" letterSpacing="1.5">200W CLASS D</text>
              <line x1="151" y1="100" x2="259" y2="100" stroke="#111" strokeWidth="0.5"/>
              {/* Amp name */}
              <text x="205" y="130" textAnchor="middle" fill="rgba(200,196,188,0.6)" fontSize="11" fontFamily="serif">Acacia 6</text>
              <text x="205" y="147" textAnchor="middle" fill="rgba(200,196,188,0.3)" fontSize="8" fontFamily="monospace">POWERED</text>
              <line x1="151" y1="160" x2="259" y2="160" stroke="#111" strokeWidth="0.5"/>
              <text x="205" y="177" textAnchor="middle" fill="rgba(201,169,110,0.25)" fontSize="6" fontFamily="monospace" letterSpacing="1">3-CHANNEL AMP</text>
              <text x="205" y="192" textAnchor="middle" fill="rgba(201,169,110,0.2)" fontSize="6" fontFamily="monospace" letterSpacing="0.5">CH1 · CH2 · CH3</text>
              <line x1="151" y1="202" x2="259" y2="202" stroke="#111" strokeWidth="0.5"/>
              <text x="205" y="216" textAnchor="middle" fill="#2a2a2a" fontSize="6" fontFamily="monospace">DSP · EQ · CROSSOVER</text>

              {/* Output lines */}
              <line x1="259" y1="100" x2="295" y2="62" stroke="rgba(201,169,110,0.15)" strokeWidth="0.8"/>
              <line x1="259" y1="148" x2="295" y2="148" stroke="rgba(201,169,110,0.3)" strokeWidth="1.2"/>
              <line x1="259" y1="196" x2="295" y2="236" stroke="rgba(201,169,110,0.15)" strokeWidth="0.8"/>

              {/* CH2 — Speaker L */}
              <rect x="295" y="38" width="115" height="48" rx="1" fill="#070707" stroke="#161616" strokeWidth="0.5"/>
              <text x="310" y="56" fill="rgba(200,196,188,0.4)" fontSize="8" fontFamily="monospace">CH 2</text>
              <text x="310" y="70" fill="rgba(200,196,188,0.25)" fontSize="7" fontFamily="monospace">Speaker Out — L</text>

              {/* CH1 — LFE (highlighted) */}
              <rect x="295" y="124" width="115" height="48" rx="1" fill="#0a0900" stroke="rgba(201,169,110,0.25)" strokeWidth="0.5"/>
              <line x1="295" y1="124" x2="295" y2="172" stroke="rgba(201,169,110,0.5)" strokeWidth="2"/>
              <text x="310" y="143" fill="rgba(201,169,110,0.75)" fontSize="8" fontFamily="monospace">CH 1 · LFE</text>
              <text x="310" y="157" fill="rgba(201,169,110,0.35)" fontSize="7" fontFamily="monospace">{`Internal · ${product.powerRmsW}W`}</text>

              {/* CH3 — Speaker R */}
              <rect x="295" y="212" width="115" height="48" rx="1" fill="#070707" stroke="#161616" strokeWidth="0.5"/>
              <text x="310" y="230" fill="rgba(200,196,188,0.4)" fontSize="8" fontFamily="monospace">CH 3</text>
              <text x="310" y="244" fill="rgba(200,196,188,0.25)" fontSize="7" fontFamily="monospace">Speaker Out — R</text>

              {/* Arrow tips on outputs */}
              <polygon points="295,59 301,62 295,65" fill="rgba(201,169,110,0.2)"/>
              <polygon points="295,145 301,148 295,151" fill="rgba(201,169,110,0.4)"/>
              <polygon points="295,233 301,236 295,239" fill="rgba(201,169,110,0.2)"/>
            </svg>
          </div>
        </div>
      </section>
      </>)}
      {/* ── DOWNLOADS ── */}
      {hasDownloads && product._id !== 'prod-oak' && (
        <section className="pd-section pd-downloads-section">
          <div className="pd-section-inner">
            <div className="pd-section-ey">Technical Documents</div>
            <h2 className="pd-section-title">Downloads</h2>
          </div>
          <div className="pd-downloads-grid">

            <a
              href={`/api/specsheet/${product.slug?.current || product.productName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pd-download-card"
            >
              <div className="pd-dl-top">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" width="28" height="28">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <polyline points="9 15 12 18 15 15"/>
                </svg>
                <span className="pd-dl-ext">PDF</span>
              </div>
              <div className="pd-dl-name">Specification Sheet</div>
              <div className="pd-dl-desc">Engineering-grade data sheet with FR, polar, EQ and full specs</div>
              <div className="pd-dl-cta">Generate &amp; Download →</div>
            </a>

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
          {/* Software link in downloads — visible on speakers and DSP amps */}
          {!isSub && (
            <div className="pd-downloads-sw-link">
              {!isAmp && (
                <a href="/software/xscace-controller" className="pd-sw-link-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="20" height="20">
                    <rect x="5" y="2" width="14" height="20" rx="3"/>
                    <circle cx="12" cy="17" r="1" fill="currentColor"/>
                  </svg>
                  <span>
                    <span className="pd-sw-link-name">XSCACE Controller App</span>
                    <span className="pd-sw-link-sub">iOS & Android · Free download</span>
                  </span>
                  <span className="pd-sw-link-arrow">→</span>
                </a>
              )}
              {isAmp && product.hasDsp && (
                <a href="/software/network-controller" className="pd-sw-link-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="20" height="20">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <span>
                    <span className="pd-sw-link-name">XSCACE Network Controller</span>
                    <span className="pd-sw-link-sub">macOS & Windows · Free download</span>
                  </span>
                  <span className="pd-sw-link-arrow">→</span>
                </a>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── ACCESSORIES ── */}
      {(product.accessories?.length > 0 || product.inWallVariant) && (
        <AccessoriesSection
          accessories={product.accessories || []}
          productName={product.productName}
          getImageUrl={getImageUrl}
          inWallProduct={product.inWallVariant}
        />
      )}

      {/* ── SOFTWARE STRIP ── */}
      {/* Controller App: shown on all speakers (not subs, not amps) */}
      {!isSub && !isAmp && (
        <section className="pdp-sw-strip">
          <div className="pdp-sw-label">Mobile App</div>
          <a href="/software/xscace-controller" className="pdp-sw-card">
            <div className="pdp-sw-card-icon pdp-sw-card-icon--mobile" style={{
              position:'relative', width:120, minWidth:120, height:96,
              display:'flex', alignItems:'center', justifyContent:'center',
              overflow:'visible',
            }}>
              {/* Back-left */}
              <div style={{position:'absolute',left:0,top:8,width:44,height:80,border:'1px solid #222',borderRadius:'8px',background:'#080808',overflow:'hidden',opacity:0.55,transform:'translateX(-4px)',zIndex:1}}>
                <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'14px',height:'2px',background:'#1a1a1a',borderRadius:'0 0 2px 2px'}}/>
                <img src="https://cdn.sanity.io/images/7r0kq57d/production/81c82048f3755163cc091f6640619112d9138e7c-368x800.png?w=300&auto=format&q=85" alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
              </div>
              {/* Back-right */}
              <div style={{position:'absolute',right:0,top:8,width:44,height:80,border:'1px solid #222',borderRadius:'8px',background:'#080808',overflow:'hidden',opacity:0.55,transform:'translateX(4px)',zIndex:1}}>
                <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'14px',height:'2px',background:'#1a1a1a',borderRadius:'0 0 2px 2px'}}/>
                <img src="https://cdn.sanity.io/images/7r0kq57d/production/82649b5de87330a015e6221c047fba3664b1f712-368x800.png?w=300&auto=format&q=85" alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
              </div>
              {/* Front-center */}
              <div style={{position:'relative',width:52,height:96,border:'1px solid #2a2a2a',borderRadius:'9px',background:'#0a0a0a',overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,0.9)',zIndex:2}}>
                <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'16px',height:'2px',background:'#1a1a1a',borderRadius:'0 0 2px 2px'}}/>
                <img src="https://cdn.sanity.io/images/7r0kq57d/production/ce08e3322ddd8d7a9a82aa678da646819d08f759-368x800.png?w=300&auto=format&q=85" alt="XSCACE Controller" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
              </div>
            </div>
            <div className="pdp-sw-card-body">
              <div className="pdp-sw-card-platform">iOS & Android</div>
              <div className="pdp-sw-card-name">XSCACE Controller</div>
              <div className="pdp-sw-card-desc">
                When paired with Air Amp or Air Mini, control this speaker from your phone.
                Volume, balance, channel select, X-Sense AI room calibration, and streaming — all in one app.
              </div>
              <div className="pdp-sw-card-cta">Learn more →</div>
            </div>
          </a>
        </section>
      )}

      {/* ── GALLERY — last section ── */}
      {galleryAll.length > 0 && (
        <>
          <div className="pd-wave-divider"><canvas className="pd-wave-canvas"/></div>
          <FloatingGallery images={galleryAll} productName={product.productName} getImageUrl={getImageUrl}/>
        </>
      )}

    </div>
  )
}
// ── MARINE + RAL SECTION ──────────────────────────────────────────────────────

const STANDARD_COLORS = [
  { name: 'Black',      hex: '#0A0A0A' },
  { name: 'White',      hex: '#F2F0EC' },
  { name: 'Champagne',  hex: '#C9A96E' },
]

const WHEEL_COLORS = [
  '#C9A96E','#F2F0EC','#0A0A0A','#3C3F41','#5A6872',
  '#C5B396','#755C48','#7B7B54','#6D8194','#6D3727',
  '#E8E0D0','#CBD0CC','#3D3C2E','#2A2A2C','#C8C8C8',
]

function MarineRalSection({ product }: { product: any }) {
  const showMarine = product.marineTreatable || product.ipRating
  const showRal    = product.customRalAvailable
  if (!showMarine && !showRal) return null

  const [chameleonHue, setChameleonHue] = useState(0) // 0..14 index into WHEEL_COLORS
  const [dragging, setDragging] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartIdx = useRef(0)

  // Auto-cycle chameleon color slowly
  const autoRef = useRef<any>(null)
  const pausedRef = useRef(false)
  useEffect(() => {
    autoRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setChameleonHue(h => (h + 1) % WHEEL_COLORS.length)
      }
    }, 900)
    return () => clearInterval(autoRef.current)
  }, [])

  const activeColor = WHEEL_COLORS[chameleonHue]

  // Drag-to-scroll wheel
  const onWheelDown = (e: React.MouseEvent) => {
    setDragging(true)
    pausedRef.current = true
    dragStartX.current = e.clientX
    dragStartIdx.current = chameleonHue
  }
  useEffect(() => {
    const onUp = () => { setDragging(false); pausedRef.current = false }
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      const delta = Math.round((e.clientX - dragStartX.current) / 28)
      const newIdx = ((dragStartIdx.current + delta) % WHEEL_COLORS.length + WHEEL_COLORS.length) % WHEEL_COLORS.length
      setChameleonHue(newIdx)
    }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mouseup', onUp); window.removeEventListener('mousemove', onMove) }
  }, [dragging])

  return (
    <section className="mrc-section">

      {/* Marine card */}
      {showMarine && (
        <div className="mrc-card">
          {/* Animated drop icon */}
          <div className="mrc-marine-icon">
            <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mrc-drop-svg">
              {/* Speaker silhouette */}
              <rect x="26" y="4" width="12" height="52" rx="1" fill="rgba(201,169,110,0.15)" stroke="rgba(201,169,110,0.4)" strokeWidth="0.8"/>
              {/* Grille lines */}
              {[12,20,28,36,44].map(y => (
                <line key={y} x1="27" y1={y} x2="37" y2={y} stroke="rgba(201,169,110,0.2)" strokeWidth="0.6"/>
              ))}
              {/* Animated drops */}
              <circle className="mrc-d1" cx="32" cy="0" r="2.5" fill="rgba(140,200,240,0.7)"/>
              <circle className="mrc-d2" cx="24" cy="0" r="1.8" fill="rgba(140,200,240,0.5)"/>
              <circle className="mrc-d3" cx="40" cy="0" r="2" fill="rgba(140,200,240,0.6)"/>
              {/* Bead on surface */}
              <ellipse className="mrc-bead" cx="32" cy="56" rx="4" ry="2.5" fill="rgba(140,200,240,0.4)"/>
              {/* Runoff */}
              <ellipse className="mrc-pool" cx="32" cy="62" rx="10" ry="2" fill="rgba(140,200,240,0.15)"/>
            </svg>
          </div>

          <div className="mrc-label">Marine Treatable</div>
          {product.ipRating && <div className="mrc-sub">{product.ipRating}</div>}
        </div>
      )}

      {/* RAL card */}
      {showRal && (
        <div className="mrc-card">
          {/* Chameleon SVG */}
          <div className="mrc-cham-wrap">
            <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mrc-cham-svg">
              {/* Tail — curl */}
              <path d="M10 55 Q5 65 12 68 Q20 70 18 62 Q16 56 22 54" stroke={activeColor} strokeWidth="2" strokeLinecap="round" fill="none" style={{transition:'stroke .6s ease'}}/>
              {/* Body */}
              <ellipse cx="52" cy="52" rx="30" ry="18" fill={activeColor} style={{transition:'fill .6s ease'}}/>
              {/* Belly */}
              <ellipse cx="52" cy="58" rx="22" ry="10" fill="rgba(0,0,0,0.12)"/>
              {/* Back ridge */}
              <path d="M28 46 Q35 32 52 34 Q70 36 78 46" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              {/* Head */}
              <ellipse cx="82" cy="50" rx="14" ry="12" fill={activeColor} style={{transition:'fill .6s ease'}}/>
              {/* Snout */}
              <path d="M92 50 Q100 50 103 48" stroke={activeColor} strokeWidth="3" strokeLinecap="round" style={{transition:'stroke .6s ease'}}/>
              {/* Eye */}
              <circle cx="86" cy="46" r="5" fill="rgba(255,255,255,0.9)"/>
              <circle cx="87" cy="46" r="3" fill="#111"/>
              <circle cx="88" cy="45" r="1" fill="rgba(255,255,255,0.9)"/>
              {/* Legs */}
              <path d="M38 68 Q35 75 32 78" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" style={{transition:'stroke .6s ease'}}/>
              <path d="M45 70 Q44 77 42 80" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" style={{transition:'stroke .6s ease'}}/>
              <path d="M60 70 Q62 77 64 80" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" style={{transition:'stroke .6s ease'}}/>
              <path d="M68 68 Q71 74 74 78" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" style={{transition:'stroke .6s ease'}}/>
            </svg>
          </div>

          {/* Standard color dots */}
          <div className="mrc-std">
            {STANDARD_COLORS.map(c => (
              <button key={c.name}
                className={`mrc-std-dot${activeColor === c.hex ? ' active' : ''}`}
                style={{background: c.hex}}
                title={c.name}
                onClick={() => { const i = WHEEL_COLORS.indexOf(c.hex); if (i >= 0) { setChameleonHue(i); pausedRef.current = false } }}
              />
            ))}
            <span className="mrc-std-names">Black · White · Champagne</span>
          </div>

          {/* Draggable color wheel strip */}
          <div
            ref={wheelRef}
            className="mrc-wheel"
            onMouseDown={onWheelDown}
            style={{cursor: dragging ? 'grabbing' : 'grab'}}
          >
            {WHEEL_COLORS.map((hex, i) => (
              <div
                key={i}
                className={`mrc-wheel-seg${i === chameleonHue ? ' active' : ''}`}
                style={{background: hex}}
                onClick={() => { setChameleonHue(i); pausedRef.current = false }}
              />
            ))}
            <div className="mrc-wheel-hint">← drag →</div>
          </div>

          <div className="mrc-label">Custom Colour</div>
          <div className="mrc-sub">Any RAL · Powder coat or anodised</div>
        </div>
      )}

    </section>
  )
}


// ── SPECS TICKER (HORIZONTAL) ────────────────────────────────────────────────

function humanize(label: string, value: string): string | null {
  const v = parseFloat(value)
  switch (label) {
    case 'Dimensions':
      return value?.includes('23') ? 'shallower than your thumb at 23mm depth' : null
    case 'Weight':
      return v < 0.3 ? 'lighter than a coffee cup'
           : v < 0.5 ? 'lighter than a can of soda'
           : v < 1   ? 'lighter than a bottle of water' : null
    case 'Sensitivity':
      return v >= 92 ? 'fills a 60m² room effortlessly'
           : v >= 88 ? 'efficient — less amp power needed' : null
    case 'Power RMS':
      return v >= 50 ? 'fills a large living room'
           : v >= 20 ? 'fills a medium room'
           : v > 0   ? 'for intimate spaces' : null
    case 'Frequency':
      return 'full audible spectrum'
    case 'Housing':
      return value?.toLowerCase().includes('aluminium')
        ? 'aircraft-grade — passive heatsink' : null
    case 'Driver':
      return value?.includes('4') ? 'four drivers, one voice'
           : value?.includes('3') ? 'three-way precision' : null
    case 'Crossover':
      return value?.toLowerCase().includes('passive') ? 'precision at the crossover point' : null
    case 'IP Rating':
      return value?.includes('66') ? 'dust-tight · powerful water jet resistant' : null
    case 'Impedance':
      return v === 8 ? 'standard amp-friendly load'
           : v === 4 ? 'high-current demand' : null
    default:
      return null
  }
}

function SpecsTicker({ product, acousticSpecs, physicalSpecs, connectivitySpecs, isAmp }: {
  product: any
  acousticSpecs: {label:string;value:string}[]
  physicalSpecs: {label:string;value:string}[]
  connectivitySpecs: {label:string;value:string}[]
  isAmp: boolean
}) {
  const allSpecs = [
    ...acousticSpecs.map(s => ({ ...s, group: isAmp ? 'Electronics' : 'Acoustic' })),
    ...physicalSpecs.map(s => ({ ...s, group: 'Physical' })),
    ...connectivitySpecs.map(s => ({ ...s, group: 'Connectivity' })),
  ]

  const [cur, setCur] = useState(0)
  const [fading, setFading] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const accRef = useRef(0)
  const audioCtxRef = useRef<any>(null)
  const touchX0Ref = useRef(0)
  const touchIdx0Ref = useRef(0)
  const COL_W = 120 // px per spec column

  const go = (idx: number, silent = false) => {
    idx = Math.max(0, Math.min(allSpecs.length - 1, idx))
    if (idx === cur && !silent) return
    if (!silent) ding()

    // Scroll list so active col centres in track
    const trackW = trackRef.current?.offsetWidth || 800
    const offset = trackW / 2 - COL_W / 2 - idx * COL_W
    if (listRef.current) {
      listRef.current.style.transition = silent ? 'none' : 'transform .22s cubic-bezier(0.23,1,0.32,1)'
      listRef.current.style.transform = `translateX(${offset}px)`
    }

    setFading(true)
    setTimeout(() => { setCur(idx); setFading(false) }, 70)
  }

  const ding = () => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)()
      const ac = audioCtxRef.current
      const o = ac.createOscillator(), g = ac.createGain()
      o.connect(g); g.connect(ac.destination)
      o.frequency.value = 750 + Math.random() * 350
      o.type = 'triangle'
      g.gain.setValueAtTime(0.05, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.035)
      o.start(); o.stop(ac.currentTime + 0.04)
    } catch(e) {}
  }

  useEffect(() => { go(0, true) }, [])

  // Wheel — horizontal scroll
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      accRef.current += delta
      if (Math.abs(accRef.current) > 30) {
        go(cur + Math.sign(accRef.current))
        accRef.current = 0
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [cur, allSpecs.length])

  const spec = allSpecs[cur]
  const note = spec ? humanize(spec.label, spec.value) : null

  return (
    <section className="st-section">

      {/* Section heading */}
      <div className="st-section-heading">
        <h2 className="pd-section-title">Technical <em>Specifications</em></h2>
        <div className="st-total">{allSpecs.length} parameters · scroll to explore</div>
      </div>

      {/* Top: value display */}
      <div className={`st-display${fading ? ' st-fading' : ''}`}>
        <div className="st-display-inner">
          <div className="st-spec-label">{spec?.label}</div>
          <div className="st-spec-value">{spec?.value}</div>
          {note && <div className="st-spec-note">{note}</div>}
        </div>
        <div className="st-nav">
          <button className="st-nav-btn" onClick={() => go(cur - 1)} disabled={cur === 0}>←</button>
          <span className="st-nav-count">{String(cur + 1).padStart(2,'0')} / {String(allSpecs.length).padStart(2,'0')}</span>
          <button className="st-nav-btn" onClick={() => go(cur + 1)} disabled={cur === allSpecs.length - 1}>→</button>
        </div>
      </div>

      {/* Bottom: horizontal ticker */}
      <div className="st-track" ref={trackRef}
        onTouchStart={e => { touchX0Ref.current = e.touches[0].clientX; touchIdx0Ref.current = cur }}
        onTouchMove={e => {
          const dx = touchX0Ref.current - e.touches[0].clientX
          go(touchIdx0Ref.current + Math.round(dx / COL_W))
        }}
      >
        {/* Left/right fade masks */}
        <div className="st-fade-left"/>
        <div className="st-fade-right"/>

        {/* Centre indicator line */}
        <div className="st-center-mark"/>

        <div className="st-list" ref={listRef} style={{width: `${allSpecs.length * COL_W}px`}}>
          {allSpecs.map((s, i) => (
            <div
              key={`${s.label}-${i}`}
              className={`st-col${i === cur ? ' active' : ''}`}
              style={{width: `${COL_W}px`}}
              onClick={() => go(i)}
            >
              {/* Group marker on first of group */}
              {(i === 0 || s.group !== allSpecs[i-1]?.group) && (
                <div className="st-group">{s.group}</div>
              )}
              <div className="st-col-label">{s.label}</div>
              <div className="st-col-preview">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}

// ── DIMENSION DRAWING ─────────────────────────────────────────────────────────
function DimensionDrawing({ product }: { product: any }) {
  const H = product.heightMm || 0
  const W = product.widthMm || 0
  const D = product.depthMm || 0
  if (!H && !W) return null

  const C = '#c9a96e'
  const CA = 'rgba(201,169,110,0.3)'
  const CT = 'rgba(201,169,110,0.5)'
  const CF = 'rgba(201,169,110,0.06)'

  // ── Ghost 2.0: horizontal layout, depth shown proportionally ──
  // H=172.72 drawn left-to-right, W=28.5 drawn top-to-bottom.
  // Standard cap of 28px hides the true D=187.96mm depth; use pH-relative
  // sizing so the depth looks as substantial as it physically is.
  if (product._id === 'prod-ghost2') {
    const scale = Math.min(300 / H, 62 / W)   // pW ≤ 300, pH ≤ 62
    const pW = H * scale                        // horizontal = speaker height
    const pH = W * scale                        // vertical   = speaker width
    // D≈6.6×W → show iso depth as ~2× pH so it reads as clearly deeper than wide
    const pD = pH * 2.2
    const iso = pD * 0.5
    const svgW = pW + iso + 90
    const svgH = pH + iso + 64
    const ox = 48, oy = svgH - 36

    return (
      <section className="dd-section">
        <div className="dd-body">
          <div className="dd-svg-wrap">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="dd-svg" xmlns="http://www.w3.org/2000/svg">
              {/* Front face */}
              <rect x={ox} y={oy - pH} width={pW} height={pH} fill={CF} stroke={C} strokeWidth="0.8"/>
              {/* Grille dots */}
              {Array.from({length: Math.floor(pH / 5)}, (_, ri) =>
                Array.from({length: Math.floor(pW / 5)}, (_, ci) => (
                  <circle key={`${ri}-${ci}`}
                    cx={ox + 3 + ci * 5} cy={oy - pH + 4 + ri * 5}
                    r="0.55" fill={C} opacity="0.28"/>
                ))
              )}
              {/* Top face */}
              <polygon
                points={`${ox},${oy-pH} ${ox+iso},${oy-pH-iso} ${ox+pW+iso},${oy-pH-iso} ${ox+pW},${oy-pH}`}
                fill={CF} stroke={C} strokeWidth="0.8"/>
              {/* Right face */}
              <polygon
                points={`${ox+pW},${oy-pH} ${ox+pW+iso},${oy-pH-iso} ${ox+pW+iso},${oy-iso} ${ox+pW},${oy}`}
                fill="rgba(201,169,110,0.04)" stroke={C} strokeWidth="0.8"/>
              {/* H dimension (bottom) */}
              <line x1={ox} y1={oy+10} x2={ox+pW} y2={oy+10} stroke={CA} strokeWidth="0.5"/>
              <line x1={ox} y1={oy+5} x2={ox} y2={oy+15} stroke={CA} strokeWidth="0.5"/>
              <line x1={ox+pW} y1={oy+5} x2={ox+pW} y2={oy+15} stroke={CA} strokeWidth="0.5"/>
              <text x={ox+pW/2} y={oy+26} fill={CT} fontSize="8"
                fontFamily="DM Mono,monospace" textAnchor="middle">H {H}mm</text>
              {/* W dimension (left) */}
              <line x1={ox-10} y1={oy} x2={ox-10} y2={oy-pH} stroke={CA} strokeWidth="0.5"/>
              <line x1={ox-15} y1={oy} x2={ox-5} y2={oy} stroke={CA} strokeWidth="0.5"/>
              <line x1={ox-15} y1={oy-pH} x2={ox-5} y2={oy-pH} stroke={CA} strokeWidth="0.5"/>
              <text x={ox-22} y={oy-pH/2} fill={CT} fontSize="8"
                fontFamily="DM Mono,monospace" textAnchor="middle"
                transform={`rotate(-90,${ox-22},${oy-pH/2})`}>W {W}mm</text>
              {/* D dimension (diagonal) */}
              <line x1={ox+pW+3} y1={oy-3} x2={ox+pW+iso+3} y2={oy-iso-3} stroke={CA} strokeWidth="0.5"/>
              <text x={ox+pW+iso/2+8} y={oy-iso/2} fill={CT} fontSize="8"
                fontFamily="DM Mono,monospace">D {D}mm</text>
              {/* Mounting markers */}
              <circle cx={ox+pW*0.25} cy={oy-pH/2} r="2" fill="none" stroke={CA}
                strokeWidth="0.5" strokeDasharray="2 1.5"/>
              <circle cx={ox+pW*0.75} cy={oy-pH/2} r="2" fill="none" stroke={CA}
                strokeWidth="0.5" strokeDasharray="2 1.5"/>
              {/* Rotation note */}
              <text x={ox} y={svgH - 6} fill={CA} fontSize="7"
                fontFamily="DM Mono,monospace" opacity="0.6">rotated 90° for display</text>
            </svg>
          </div>
          <div className="dd-actions">
            <a href={`/api/specsheet/${product.slug?.current || product.productName}`}
              target="_blank" rel="noopener noreferrer" className="dd-download-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Spec Sheet
            </a>
          </div>
        </div>
      </section>
    )
  }

  // Rotate so the longest physical dimension is always drawn horizontally
  // For tall speakers (H > W): rotate 90° so height runs left-right
  const isPortrait = H > W
  const drawW = isPortrait ? H : W  // the horizontal extent in the drawing
  const drawH = isPortrait ? W : H  // the vertical extent in the drawing

  // Scale to fill 280px wide, max 120px tall
  const scaleX = 280 / drawW
  const scaleY = 120 / drawH
  const scale = Math.min(scaleX, scaleY)

  const pW = drawW * scale   // pixel width (horizontal in drawing)
  const pH = drawH * scale   // pixel height (vertical in drawing)
  const pD = D ? Math.min(D * scale * 0.6, 28) : 0
  const iso = pD * 0.5

  const svgW = pW + iso + 80
  const svgH = pH + iso + 64
  const ox = 48, oy = svgH - 36  // origin: bottom-left of front face

  // Labels
  const hLabel = isPortrait ? `${H}mm` : `${W}mm`  // horizontal label
  const vLabel = isPortrait ? `${W}mm` : `${H}mm`  // vertical label
  const hNote  = isPortrait ? 'H' : 'W'
  const vNote  = isPortrait ? 'W' : 'H'

  return (
    <section className="dd-section">
      <div className="dd-body">
        <div className="dd-svg-wrap">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="dd-svg" xmlns="http://www.w3.org/2000/svg">
            {/* Front face */}
            <rect x={ox} y={oy - pH} width={pW} height={pH} fill={CF} stroke={C} strokeWidth="0.8"/>

            {/* Grille dot pattern */}
            {Array.from({length: Math.floor(pH / 5)}, (_, ri) =>
              Array.from({length: Math.floor(pW / 5)}, (_, ci) => (
                <circle key={`${ri}-${ci}`}
                  cx={ox + 3 + ci * 5} cy={oy - pH + 4 + ri * 5}
                  r="0.55" fill={C} opacity="0.28"/>
              ))
            )}

            {/* Top face (isometric) */}
            {pD > 0 && <polygon
              points={`${ox},${oy-pH} ${ox+iso},${oy-pH-iso} ${ox+pW+iso},${oy-pH-iso} ${ox+pW},${oy-pH}`}
              fill={CF} stroke={C} strokeWidth="0.8"/>}

            {/* Right face (isometric) */}
            {pD > 0 && <polygon
              points={`${ox+pW},${oy-pH} ${ox+pW+iso},${oy-pH-iso} ${ox+pW+iso},${oy-iso} ${ox+pW},${oy}`}
              fill="rgba(201,169,110,0.03)" stroke={C} strokeWidth="0.8"/>}

            {/* Horizontal dimension (bottom) */}
            <line x1={ox} y1={oy+10} x2={ox+pW} y2={oy+10} stroke={CA} strokeWidth="0.5"/>
            <line x1={ox} y1={oy+5} x2={ox} y2={oy+15} stroke={CA} strokeWidth="0.5"/>
            <line x1={ox+pW} y1={oy+5} x2={ox+pW} y2={oy+15} stroke={CA} strokeWidth="0.5"/>
            <text x={ox+pW/2} y={oy+26} fill={CT} fontSize="8"
              fontFamily="DM Mono,monospace" textAnchor="middle">{hNote} {hLabel}</text>

            {/* Vertical dimension (left) */}
            <line x1={ox-10} y1={oy} x2={ox-10} y2={oy-pH} stroke={CA} strokeWidth="0.5"/>
            <line x1={ox-15} y1={oy} x2={ox-5} y2={oy} stroke={CA} strokeWidth="0.5"/>
            <line x1={ox-15} y1={oy-pH} x2={ox-5} y2={oy-pH} stroke={CA} strokeWidth="0.5"/>
            <text x={ox-20} y={oy-pH/2} fill={CT} fontSize="8"
              fontFamily="DM Mono,monospace" textAnchor="middle"
              transform={`rotate(-90,${ox-20},${oy-pH/2})`}>{vNote} {vLabel}</text>

            {/* Depth (diagonal) */}
            {pD > 0 && <>
              <line x1={ox+pW+3} y1={oy-3} x2={ox+pW+iso+3} y2={oy-iso-3} stroke={CA} strokeWidth="0.5"/>
              <text x={ox+pW+iso/2+10} y={oy-iso/2} fill={CT} fontSize="8"
                fontFamily="DM Mono,monospace">D {D}mm</text>
            </>}

            {/* Keyhole mount markers */}
            {!isPortrait && <>
              <circle cx={ox+pW*0.25} cy={oy-pH/2} r="2" fill="none" stroke={CA}
                strokeWidth="0.5" strokeDasharray="2 1.5"/>
              <circle cx={ox+pW*0.75} cy={oy-pH/2} r="2" fill="none" stroke={CA}
                strokeWidth="0.5" strokeDasharray="2 1.5"/>
            </>}
            {isPortrait && <>
              <circle cx={ox+pW/2} cy={oy-pH*0.25} r="2" fill="none" stroke={CA}
                strokeWidth="0.5" strokeDasharray="2 1.5"/>
              <circle cx={ox+pW/2} cy={oy-pH*0.75} r="2" fill="none" stroke={CA}
                strokeWidth="0.5" strokeDasharray="2 1.5"/>
            </>}

            {/* Orientation note */}
            {isPortrait && (
              <text x={ox} y={svgH - 6} fill={CA} fontSize="7"
                fontFamily="DM Mono,monospace" opacity="0.6">rotated 90° for display</text>
            )}
          </svg>
        </div>

        {/* Spec sheet download */}
        <div className="dd-actions">
          <a
              href={`/api/specsheet/${product.slug?.current || product.productName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="dd-download-btn"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Spec Sheet
            </a>
          {product.installGuide?.asset?._ref && (
            <a
              href={`https://cdn.sanity.io/files/7r0kq57d/production/${product.installGuide.asset._ref.replace('file-','').replace(/-pdf$/,'.pdf')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="dd-download-btn dd-download-btn--secondary"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Install Guide
            </a>
          )}
        </div>
      </div>
    </section>
  )
}


