'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Products that have physical highlights
const PHYSICAL_HIGHLIGHT_IDS = [
  'prod-bonsai', 'prod-cane', 'prod-quadcane', 'prod-ghost2'
]

const PHYSICAL_HIGHLIGHTS: Record<string, { id: string; label: string; shortLabel: string; desc: string; spec: string }[]> = {
  default: [
    { id: 'screwless',  label: 'Screwless Body',         shortLabel: 'Screwless',   desc: 'Zero visible fasteners. The grille, frame and baffle are unified — nothing interrupts the surface. Pure architectural intent.', spec: 'Tool-free grille removal' },
    { id: 'holes',      label: '0.7mm Acoustic Holes',   shortLabel: '0.7mm Holes', desc: 'Each aperture is 0.7mm — small enough to be invisible at normal viewing distance, tuned acoustically to preserve high-frequency response at the grille.', spec: '0.7mm · CNC precision drilled' },
    { id: 'ral',        label: 'Custom RAL Colour',       shortLabel: 'Custom RAL',  desc: 'Any RAL colour, matched to your interior. The AeroFrame chassis accepts powder coat or wet paint — supplied primed for on-site finishing if preferred.', spec: 'Full RAL palette · MOQ 1 unit' },
    { id: 'marine',     label: 'Marine Treatable',        shortLabel: 'Marine',      desc: 'All internal components can be treated for marine and high-humidity environments. Suitable for pool surrounds, bathrooms, and outdoor-adjacent spaces.', spec: 'Optional marine treatment' },
    { id: 'nodraft',    label: 'Zero Draft Angle',        shortLabel: 'Zero Draft',  desc: 'The chassis is machined, not cast — so there is no draft angle. Every edge is perfectly straight. Flush with plaster or timber, with no visible gap.', spec: 'CNC machined · ±0.1mm tolerance' },
  ]
}

const TECH_HIGHLIGHTS: Record<string, { id: string; label: string; shortLabel: string; desc: string; spec: string; angle: [number, number] }> = {
  'Nano Resonance':       { id: 'nano',   label: 'Nano Resonance',       shortLabel: 'Nano Res.',    desc: 'A heavy cone mass lowers the driver\'s resonant frequency far below what cabinet volume alone could achieve — defying Hoffman\'s Iron Law in a 12mm depth.', spec: 'Fs < 80Hz · 12mm baffle depth', angle: [0, 0] },
  'PowerDense Dynamics':  { id: 'power',  label: 'PowerDense Dynamics',  shortLabel: 'PowerDense',   desc: 'A copper-silver composite voice coil dissipates heat more effectively than copper alone, allowing sustained high-power output in the confined chassis.', spec: 'Cu-Ag composite · Class-D optimised', angle: [15, -20] },
  'AeroFrame Chassis':    { id: 'aero',   label: 'AeroFrame Chassis',    shortLabel: 'AeroFrame',    desc: '6061 aerospace aluminium machined to act as a passive heatsink. The chassis conducts heat away from the voice coil without forced cooling.', spec: '6061-T6 Al · passive thermal management', angle: [-10, 40] },
  'PrecisionXover Array': { id: 'xover',  label: 'PrecisionXover Array', shortLabel: 'PrecisionXover', desc: 'Air-core inductors and polypropylene capacitors in a miniaturised crossover network, achieving ±0.5dB tolerance at the crossover point.', spec: '±0.5dB · air-core inductors', angle: [20, 180] },
  'XS-Flow':              { id: 'flow',   label: 'XS-Flow™',             shortLabel: 'XS-Flow',      desc: 'Micro-waveguides inside the enclosure control internal standing waves and channel airflow, extending low-frequency output in a 12mm cavity.', spec: '12mm depth · waveguide-loaded', angle: [-15, 0] },
}

interface Highlight {
  id: string
  label: string
  shortLabel: string
  desc: string
  spec: string
  angle?: [number, number]
  type: 'physical' | 'tech'
}

interface Props {
  productId: string
  productName: string
  modelUrl?: string
  badges: string[]
  heroImgUrl?: string | null
}

// ── OVERLAY ANIMATIONS ─────────────────────────────────────────────────────────
function OverlayAnimation({ highlightId, active }: { highlightId: string; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) {
      cancelAnimationFrame(animRef.current)
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      t += 0.016

      if (highlightId === 'screwless') {
        // Champagne perimeter scan lines
        const progress = (Math.sin(t * 0.8) + 1) / 2
        ctx.strokeStyle = `rgba(201,169,110,${0.15 + progress * 0.25})`
        ctx.lineWidth = 0.8
        ctx.setLineDash([8, 6])
        ctx.lineDashOffset = -t * 30
        // Draw a rounded rect around the product area
        const pad = W * 0.18
        const padV = H * 0.1
        ctx.beginPath()
        ctx.roundRect(pad, padV, W - pad * 2, H - padV * 2, 8)
        ctx.stroke()
        ctx.setLineDash([])
        // Corner accent lines
        const corners = [[pad, padV], [W-pad, padV], [pad, H-padV], [W-pad, H-padV]] as const
        corners.forEach(([cx, cy]) => {
          const dx = cx < W/2 ? 1 : -1
          const dy = cy < H/2 ? 1 : -1
          ctx.beginPath()
          ctx.strokeStyle = `rgba(201,169,110,${0.4 + progress * 0.3})`
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + dx * 20, cy)
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx, cy + dy * 20)
          ctx.stroke()
        })
      }

      else if (highlightId === 'holes') {
        // Ripple dots from grille center
        const cx = W * 0.5, cy = H * 0.42
        for (let ring = 0; ring < 4; ring++) {
          const phase = ((t * 0.6 + ring * 0.4) % 1)
          const r = phase * W * 0.28
          const alpha = (1 - phase) * 0.35
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(201,169,110,${alpha})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
        // Small dots on grille
        for (let i = -3; i <= 3; i++) {
          for (let j = -4; j <= 4; j++) {
            const px = cx + i * 14
            const py = cy + j * 10
            const dist = Math.sqrt(i*i*0.8 + j*j)
            if (dist > 4.5) continue
            const pulse = 0.3 + 0.4 * Math.sin(t * 2 + dist * 0.8)
            ctx.beginPath()
            ctx.arc(px, py, 1.2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(201,169,110,${pulse * 0.6})`
            ctx.fill()
          }
        }
      }

      else if (highlightId === 'ral') {
        // Subtle color wash — cycles through luxury colors
        const colors = [
          [180, 170, 160], // warm grey
          [140, 130, 120], // taupe
          [160, 155, 145], // cream grey
          [120, 130, 135], // cool blue-grey
          [150, 145, 130], // sage-ish
        ]
        const cycle = (t * 0.08) % colors.length
        const i = Math.floor(cycle)
        const blend = cycle - i
        const c1 = colors[i % colors.length]
        const c2 = colors[(i + 1) % colors.length]
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * blend)
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * blend)
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * blend)
        // Soft vignette color wash over model area
        const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.4)
        grad.addColorStop(0, `rgba(${r},${g},${b},0.12)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)
        // Color swatch line at bottom
        ctx.fillStyle = `rgba(${r},${g},${b},0.5)`
        ctx.fillRect(W*0.38, H*0.88, W*0.24, 2)
      }

      else if (highlightId === 'marine') {
        // Water droplets beading down
        const drops = [
          { x: 0.38, startY: 0.18, speed: 0.12, size: 4, delay: 0 },
          { x: 0.52, startY: 0.22, speed: 0.09, size: 3, delay: 0.4 },
          { x: 0.44, startY: 0.28, speed: 0.14, size: 5, delay: 0.8 },
          { x: 0.60, startY: 0.20, speed: 0.10, size: 3.5, delay: 1.2 },
          { x: 0.34, startY: 0.32, speed: 0.11, size: 4, delay: 0.2 },
        ]
        drops.forEach(d => {
          const phase = ((t * d.speed + d.delay) % 1)
          const x = W * d.x
          const y = H * (d.startY + phase * 0.55)
          const alpha = phase < 0.15 ? phase / 0.15 : phase > 0.85 ? (1 - phase) / 0.15 : 1
          // Droplet body
          ctx.beginPath()
          ctx.ellipse(x, y, d.size * 0.7, d.size, 0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(160,200,230,${alpha * 0.35})`
          ctx.fill()
          // Highlight
          ctx.beginPath()
          ctx.ellipse(x - d.size * 0.2, y - d.size * 0.3, d.size * 0.25, d.size * 0.3, -0.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`
          ctx.fill()
          // Trail
          if (phase > 0.1) {
            ctx.beginPath()
            ctx.moveTo(x, y - d.size)
            ctx.lineTo(x, y - d.size - phase * H * 0.08)
            ctx.strokeStyle = `rgba(160,200,230,${alpha * 0.12})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        })
      }

      else if (highlightId === 'nodraft') {
        // Perfect vertical lines along body edges
        const edgeX = [W * 0.26, W * 0.74]
        const progress = (Math.sin(t * 0.6) + 1) / 2
        edgeX.forEach((x, i) => {
          const delay = i * 0.5
          const p = Math.max(0, Math.min(1, (Math.sin(t * 0.6 + delay) + 1) / 2))
          // Main edge line
          ctx.beginPath()
          ctx.moveTo(x, H * 0.12)
          ctx.lineTo(x, H * 0.88)
          ctx.strokeStyle = `rgba(201,169,110,${0.1 + p * 0.25})`
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.stroke()
          // Measurement tick marks
          for (let tick = 0; tick <= 4; tick++) {
            const ty = H * (0.12 + tick * 0.19)
            const tickLen = tick % 2 === 0 ? 8 : 5
            const dir = i === 0 ? 1 : -1
            ctx.beginPath()
            ctx.moveTo(x, ty)
            ctx.lineTo(x + dir * tickLen, ty)
            ctx.strokeStyle = `rgba(201,169,110,${0.15 + p * 0.2})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        })
        // "90°" indicator
        const midX = W * 0.5
        ctx.font = `${9}px DM Mono, monospace`
        ctx.fillStyle = `rgba(201,169,110,${0.15 + progress * 0.2})`
        ctx.textAlign = 'center'
        ctx.fillText('90°', midX, H * 0.92)
        ctx.textAlign = 'left'
      }

      else if (highlightId === 'nano') {
        // Concentric rings from driver
        const cx = W * 0.5, cy = H * 0.44
        for (let ring = 0; ring < 5; ring++) {
          const phase = ((t * 0.5 + ring * 0.25) % 1)
          const r = 20 + phase * W * 0.32
          const alpha = (1 - phase) * 0.3
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(201,169,110,${alpha})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }

      else if (highlightId === 'power') {
        // Warm pulse from voice coil area
        const cx = W * 0.5, cy = H * 0.48
        const pulse = (Math.sin(t * 2.5) + 1) / 2
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.22)
        grad.addColorStop(0, `rgba(255,140,40,${0.08 + pulse * 0.1})`)
        grad.addColorStop(0.5, `rgba(201,169,110,${0.04 + pulse * 0.06})`)
        grad.addColorStop(1, 'rgba(201,169,110,0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)
      }

      else if (highlightId === 'aero') {
        // Heat shimmer lines rising
        for (let i = 0; i < 5; i++) {
          const x = W * (0.3 + i * 0.1)
          const phase = (t * 0.4 + i * 0.2) % 1
          const y = H * (0.85 - phase * 0.5)
          const alpha = phase < 0.2 ? phase / 0.2 : (1 - phase) * 1.25
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.bezierCurveTo(
            x + Math.sin(t + i) * 4, y - 20,
            x - Math.sin(t + i) * 4, y - 40,
            x + Math.sin(t * 1.3 + i) * 6, y - 60
          )
          ctx.strokeStyle = `rgba(201,169,110,${Math.max(0, alpha) * 0.18})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      else if (highlightId === 'xover') {
        // Crosshair at xover point
        const cx = W * 0.5, cy = H * 0.55
        const pulse = (Math.sin(t * 1.5) + 1) / 2
        // Horizontal
        ctx.beginPath()
        ctx.moveTo(cx - 40, cy)
        ctx.lineTo(cx + 40, cy)
        ctx.strokeStyle = `rgba(201,169,110,${0.12 + pulse * 0.15})`
        ctx.lineWidth = 0.7
        ctx.setLineDash([4, 3])
        ctx.stroke()
        // Vertical
        ctx.beginPath()
        ctx.moveTo(cx, cy - 30)
        ctx.lineTo(cx, cy + 30)
        ctx.stroke()
        ctx.setLineDash([])
        // Center dot
        ctx.beginPath()
        ctx.arc(cx, cy, 2 + pulse * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201,169,110,${0.4 + pulse * 0.3})`
        ctx.fill()
      }

      else if (highlightId === 'flow') {
        // Flowing lines through waveguide
        for (let i = 0; i < 4; i++) {
          const progress = ((t * 0.35 + i * 0.28) % 1)
          const x = W * (0.3 + progress * 0.4)
          const y = H * (0.35 + Math.sin(progress * Math.PI * 2 + i) * 0.08)
          const alpha = Math.sin(progress * Math.PI) * 0.3
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(201,169,110,${alpha})`
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [highlightId, active])

  return (
    <canvas
      ref={canvasRef}
      className="overlay-canvas"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.6s ease'
      }}
    />
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function TechShowcase({ productId, productName, modelUrl, badges, heroImgUrl }: Props) {
  const hasPhysical = PHYSICAL_HIGHLIGHT_IDS.includes(productId)

  // Build highlight list
  const highlights: Highlight[] = [
    ...(hasPhysical ? PHYSICAL_HIGHLIGHTS.default.map(h => ({ ...h, type: 'physical' as const })) : []),
    ...badges
      .filter(b => TECH_HIGHLIGHTS[b] && b !== 'PsySculpt')
      .map(b => ({ ...TECH_HIGHLIGHTS[b], type: 'tech' as const }))
  ]

  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [threeReady, setThreeReady] = useState(false)
  const mountRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<any>(null)
  const controlsRef = useRef<any>(null)
  const progressRef = useRef(0)
  const pauseTimerRef = useRef<NodeJS.Timeout>()

  // Load Three.js
  useEffect(() => {
    if ((window as any).THREE?.GLTFLoader) { setThreeReady(true); return }
    const injectScript = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return }
      const s = document.createElement('script')
      s.src = src; s.onload = () => res(); s.onerror = rej
      document.head.appendChild(s)
    })
    const run = async () => {
      if (!(window as any).THREE) await injectScript('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js')
      if (!(window as any).THREE?.GLTFLoader) {
        await injectScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js')
        await new Promise(r => setTimeout(r, 60))
      }
      if (!(window as any).THREE?.OrbitControls) {
        await injectScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js')
        await new Promise(r => setTimeout(r, 60))
      }
      setThreeReady(true)
    }
    run()
  }, [])

  // Init Three.js
  useEffect(() => {
    const el = mountRef.current
    if (!el || !threeReady || !modelUrl) return

    const THREE = (window as any).THREE
    let animId: number
    let renderer: any

    const W = el.offsetWidth, H = el.offsetHeight
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.toneMappingExposure = 1.2
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.01, 100)
    camera.position.set(0, 0.05, 0.65)
    cameraRef.current = camera

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const key = new THREE.DirectionalLight(0xfff5e0, 2.0)
    key.position.set(2, 3, 2); scene.add(key)
    const fill = new THREE.DirectionalLight(0xc9a96e, 0.35)
    fill.position.set(-2, 1, -1); scene.add(fill)

    const controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4
    controls.enableZoom = false
    controlsRef.current = controls

    // Resolve URL
    let resolvedUrl = modelUrl
    if (modelUrl.includes('/models/')) {
      resolvedUrl = `/models/${modelUrl.split('/models/').pop()}`
    }

    new THREE.GLTFLoader().load(resolvedUrl, (gltf: any) => {
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const centre = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      model.position.sub(centre)
      model.scale.setScalar(0.3 / Math.max(size.x, size.y, size.z))
      scene.add(model)
    })

    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      if (renderer?.domElement && el.contains(renderer.domElement)) {
        renderer.dispose(); el.removeChild(renderer.domElement)
      }
    }
  }, [threeReady, modelUrl])

  // Rotate to preset angle when highlight changes
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const h = highlights[active]
    if (h?.type === 'tech' && h.angle) {
      const [polar, azimuth] = h.angle
      controls.autoRotate = false
      controls.setAzimuthalAngle((azimuth * Math.PI) / 180)
      controls.setPolarAngle((90 + polar) * Math.PI / 180)
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => {
        controls.autoRotate = true
      }, 4000)
    } else {
      controls.autoRotate = true
    }
  }, [active])

  // Auto-advance with progress
  useEffect(() => {
    if (highlights.length === 0) return
    const DURATION = 5000
    const TICK = 50
    let elapsed = 0

    const timer = setInterval(() => {
      if (paused) return
      elapsed += TICK
      const p = Math.min(elapsed / DURATION, 1)
      setProgress(p)
      if (elapsed >= DURATION) {
        elapsed = 0
        setActive(a => (a + 1) % highlights.length)
      }
    }, TICK)

    return () => clearInterval(timer)
  }, [paused, highlights.length])

  const handleTabClick = (i: number) => {
    setActive(i)
    setProgress(0)
    setPaused(true)
    clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = setTimeout(() => setPaused(false), 8000)
  }

  if (highlights.length === 0 && !modelUrl) return null
  const current = highlights[active]

  return (
    <div className="ts-wrap">
      {/* 3D Viewer */}
      <div className="ts-viewer-wrap">
        <div ref={mountRef} className="ts-canvas"/>
        {!modelUrl && heroImgUrl && (
          <img src={heroImgUrl} alt={productName} className="ts-fallback-img"/>
        )}
        {current && <OverlayAnimation highlightId={current.id} active={true}/>}
        <div className="ts-drag-hint">Drag to rotate</div>
      </div>

      {/* Tab strip */}
      {highlights.length > 0 && (
        <div className="ts-tabs">
          {highlights.map((h, i) => (
            <button
              key={h.id}
              className={`ts-tab${active === i ? ' active' : ''}`}
              onClick={() => handleTabClick(i)}
            >
              <span className="ts-tab-label">{h.shortLabel}</span>
              {active === i && (
                <div
                  className="ts-tab-progress"
                  style={{ transform: `scaleX(${progress})` }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Info panel */}
      {current && (
        <div className="ts-info" key={current.id}>
          <div className="ts-info-left">
            <div className="ts-info-type">{current.type === 'physical' ? 'Design' : 'Technology'}</div>
            <div className="ts-info-name">{current.label}</div>
            <div className="ts-info-spec">{current.spec}</div>
          </div>
          <div className="ts-info-right">
            <div className="ts-info-desc">{current.desc}</div>
          </div>
        </div>
      )}
    </div>
  )
}
