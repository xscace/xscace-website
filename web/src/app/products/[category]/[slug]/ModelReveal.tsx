'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const CONSTRAINTS = [
  {
    cross: '×', text: 'No visible fixings',
    desc: 'Every fastener is concealed. The grille, baffle and chassis unite as a single uninterrupted surface — nothing to catch the eye, nothing to break the plane.',
    angle: { y: 0, x: 0 },
    mode: 'normal',
  },
  {
    cross: '×', text: 'No draft angle',
    desc: 'CNC machined, not cast. Zero draft — every edge is geometrically perfect and flush. No taper, no step, no visible gap against the wall.',
    angle: { y: Math.PI * 0.38, x: 0 },
    mode: 'normal',
  },
  {
    cross: '×', text: 'No unnecessary pattern',
    desc: 'The only perforations are acoustic. Each 0.7mm aperture exists because sound requires it — not for decoration.',
    angle: { y: 0, x: 0.18 },
    mode: 'normal',
  },
  {
    cross: '×', text: 'No compromise on finish',
    desc: 'Anodised 6061 aerospace aluminium. The finish is applied under electrical current — it becomes part of the metal itself. Available in any RAL.',
    angle: { y: -Math.PI * 0.28, x: 0 },
    mode: 'fingerprint',
  },
  {
    cross: '→', text: 'Just material. Just line.',
    desc: 'When there is nothing to remove, design is complete. The Cane exists at the point where engineering and restraint arrive at the same answer.',
    angle: { y: Math.PI * 0.2, x: -0.1 },
    mode: 'normal',
    last: true,
  },
]

const FLAGSHIP_IDS = ['prod-bonsai', 'prod-cane', 'prod-quadcane', 'prod-ghost2']

interface Props {
  modelUrl?: string
  productName: string
  productId: string
}

// ── CLICK SOUND ───────────────────────────────────────────────────────────────
function playClick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / ctx.sampleRate
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 160) * (t < 0.002 ? 1 : 0.25)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'; f.frequency.value = 2400
    const g = ctx.createGain(); g.gain.value = 0.15
    src.connect(f); f.connect(g); g.connect(ctx.destination)
    src.start()
    setTimeout(() => ctx.close(), 300)
  } catch(e) {}
}

// ── OVERLAY CANVAS (2D effects on 3D canvas) ──────────────────────────────────
function OverlayEffects({ mode, active, canvasW, canvasH, mouseX, mouseY }: {
  mode: string; active: boolean; canvasW: number; canvasH: number; mouseX: number; mouseY: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const fingerprintsRef = useRef<{ x: number; y: number; r: number; a: number; life: number }[]>([])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = canvasW
    canvas.height = canvasH
    if (!active) {
      cancelAnimationFrame(animRef.current)
      canvas.getContext('2d')?.clearRect(0, 0, canvasW, canvasH)
      return
    }
    const ctx = canvas.getContext('2d')!
    const W = canvasW, H = canvasH
    let t = 0

    // Centre of model in canvas space (approx)
    const CX = W * 0.48, CY = H * 0.48

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      t += 0.016


      if (mode === 'fingerprint') {
        // Fingerprint smudges appear near cursor, fade out
        // Add new fingerprint near mouse
        const mx = mouseX * W, my = mouseY * H
        const inModel = mx > W*0.3 && mx < W*0.7 && my > H*0.15 && my < H*0.85
        if (inModel && Math.random() < 0.06) {
          fingerprintsRef.current.push({
            x: mx + (Math.random()-0.5)*20,
            y: my + (Math.random()-0.5)*15,
            r: 8 + Math.random()*12,
            a: 0.12 + Math.random()*0.08,
            life: 1,
          })
        }

        // Draw + decay fingerprints
        fingerprintsRef.current = fingerprintsRef.current.filter(fp => fp.life > 0.01)
        fingerprintsRef.current.forEach(fp => {
          fp.life -= 0.006
          const a = fp.a * fp.life
          ctx.save()
          ctx.translate(fp.x, fp.y)
          ctx.rotate(fp.x * 0.03)
          // Fingerprint oval smudge
          ctx.beginPath()
          ctx.ellipse(0, 0, fp.r, fp.r * 0.55, 0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,245,220,${a * 0.4})`
          ctx.fill()
          // Ridge lines
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath()
            ctx.ellipse(0, i * 2.5, fp.r * 0.7, fp.r * 0.2, 0, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(255,245,220,${a * 0.5})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
          ctx.restore()
        })

        // Subtle text hint
        if (fingerprintsRef.current.length === 0) {
          ctx.font = '8px DM Mono, monospace'
          ctx.fillStyle = 'rgba(201,169,110,0.2)'
          ctx.textAlign = 'center'
          ctx.fillText('Move cursor over the surface', W * 0.46, H * 0.92)
          ctx.textAlign = 'left'
        }
      }


      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [mode, active, canvasW, canvasH, mouseX, mouseY])

  return (
    <canvas ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ModelReveal({ modelUrl, productName, productId }: Props) {
  const mountRef    = useRef<HTMLDivElement>(null)
  const [wire, setWire]         = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const [active, setActive]     = useState(0)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const [mouseNorm, setMouseNorm]   = useState({ x: 0.5, y: 0.5 }) // 0-1

  const rendererRef  = useRef<any>(null)
  const spotRef      = useRef<any>(null)
  const groupRef     = useRef<any>(null)
  const origMatsRef  = useRef<Map<any, any>>(new Map())
  const wireMatsRef  = useRef<Map<any, any>>(new Map())
  const animIdRef    = useRef<number>(0)
  const mouseRef     = useRef({ x: 0, y: 0 }) // -1 to 1
  const targetYRef   = useRef(0)
  const targetXRef   = useRef(0)
  const currentYRef  = useRef(0)
  const currentXRef  = useRef(0)
  const sceneRef     = useRef<any>(null)
  const cameraRef    = useRef<any>(null)

  const isFlag = FLAGSHIP_IDS.includes(productId)

  // ── Init Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el || !isFlag) return
    let cancelled = false

    const inject = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return }
      const s = document.createElement('script')
      s.src = src; s.onload = () => res(); s.onerror = rej
      document.head.appendChild(s)
    })

    const run = async () => {
      try {
  // Per-product calibrated settings
  const MODEL_SETTINGS: Record<string, {
    cam: [number,number,number], rot: [number,number,number], fov: number,
    exposure: number, ambient: number, key: number, fill: number
  }> = {
    'prod-bonsai':    { cam:[0.18,0.98,3],      rot:[0.158,-0.582,-1.572], fov:60, exposure:1.0,  ambient:0,   key:0.0, fill:0.2 },
    'prod-cane':      { cam:[-0.08,0.34,3.03], rot:[0.248,-0.942,-1.502], fov:43, exposure:0.6,  ambient:1.1, key:2.4, fill:1.0 },
    'prod-ghost2':    { cam:[-0.01,0,3],          rot:[0.318,-0.012,0.000],  fov:69, exposure:0.9,  ambient:0,   key:0.8, fill:0   },
    'prod-acacia6-pw':{ cam:[0,0,3],              rot:[0.000,-0.702,0.000],  fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
    'prod-xylem3':    { cam:[-0.01,-0.67,3],      rot:[-2.512,0.000,0.000],  fov:78, exposure:0.6,  ambient:0,   key:0.0, fill:1.6 },
    'prod-quadcane':  { cam:[0.18,-0.14,2.43],    rot:[2.308,1.588,-0.702],  fov:45, exposure:1.05, ambient:0,   key:0.0, fill:0.7 },
  }
  const s = (productId && MODEL_SETTINGS[productId]) ? MODEL_SETTINGS[productId]
    : { cam:[0,0,0.82] as [number,number,number], rot:[0,0,0] as [number,number,number], fov:28, exposure:0.75, ambient:0.04, key:0.08, fill:0.2 }


        if (!(window as any).THREE) await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js')
        if (!(window as any).THREE?.GLTFLoader) {
          await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js')
          await new Promise(r => setTimeout(r, 80))
        }
        if (!(window as any).THREE?.DRACOLoader) {
          await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js')
          await new Promise(r => setTimeout(r, 60))
        }
        if (!(window as any).THREE?.RGBELoader) {
          await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/RGBELoader.js')
          await new Promise(r => setTimeout(r, 60))
        }
        if (cancelled) return

        const THREE = (window as any).THREE
        const W = el.offsetWidth
        const H = el.offsetHeight || 600
        setCanvasSize({ w: W, h: H })

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = s.exposure
        renderer.setClearColor(0x000000, 1)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        el.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(s.fov, W / H, 0.01, 100)
        camera.position.set(...s.cam)
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // ── Lighting ──
        scene.add(new THREE.AmbientLight(0xffffff, s.ambient))

        const fill = new THREE.DirectionalLight(0xfff0dd, s.key)
        fill.position.set(2, 3, 2); scene.add(fill)
        const fillLeft = new THREE.DirectionalLight(0xc9a96e, s.fill)
        fillLeft.position.set(-2, 1, 1); scene.add(fillLeft)

        // Depth-creating underlight (fake AO)
        const under = new THREE.DirectionalLight(0x080808, 0.5)
        under.position.set(0, -3, 0.5); scene.add(under)

        const rim = new THREE.DirectionalLight(0xc9a96e, 0.2)
        rim.position.set(0, 0.5, -2); scene.add(rim)

        // Depth of field simulation: slight back light
        const back = new THREE.DirectionalLight(0xfff8ee, 0.05)
        back.position.set(0, 2, -1.5); scene.add(back)

        // Cursor spotlight
        const spot = new THREE.SpotLight(0xfff5e0, 0)
        spot.angle = Math.PI / 7
        spot.penumbra = 0.85
        spot.decay = 2.2
        spot.distance = 3.5
        scene.add(spot); scene.add(spot.target)
        spot.target.position.set(0, 0, 0)
        spotRef.current = spot

        // Contact shadow disc
        const sc = document.createElement('canvas')
        sc.width = 256; sc.height = 256
        const sctx = sc.getContext('2d')!
        const sg = sctx.createRadialGradient(128, 128, 8, 128, 128, 110)
        sg.addColorStop(0, 'rgba(0,0,0,0.7)')
        sg.addColorStop(0.5, 'rgba(0,0,0,0.25)')
        sg.addColorStop(1, 'rgba(0,0,0,0)')
        sctx.fillStyle = sg; sctx.fillRect(0, 0, 256, 256)
        const disc = new THREE.Mesh(
          new THREE.PlaneGeometry(0.6, 0.6),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
        )
        disc.rotation.x = -Math.PI / 2
        disc.position.y = -0.26
        scene.add(disc)

        // ── HDR Environment Map (studio lighting reflection) ──
        // Procedural HDR: simulate a studio with warm key + cool fill
        // We build it as a DataTexture so no external file needed
        const hdrSize = 128
        const hdrData = new Float32Array(hdrSize * hdrSize * 4)
        for (let y = 0; y < hdrSize; y++) {
          for (let x = 0; x < hdrSize; x++) {
            const nx = x / hdrSize  // 0-1 across equirect
            const ny = y / hdrSize
            // Azimuth and elevation
            const az = nx * Math.PI * 2
            const el = (ny - 0.5) * Math.PI
            // Key light: warm, upper left
            const dKey = Math.max(0, Math.cos(az - Math.PI * 1.3) * Math.cos(el - 0.5))
            // Fill: cool, right
            const dFill = Math.max(0, Math.cos(az - 0.2) * Math.cos(el - 0.1))
            // Floor: very dark warm
            const dFloor = Math.max(0, -Math.sin(el)) * 0.3
            // Ceiling: neutral cool
            const dCeil = Math.max(0, Math.sin(el)) * 0.15
            const i = (y * hdrSize + x) * 4
            hdrData[i]   = dKey * 0.9 + dFill * 0.15 + dFloor * 0.08 + 0.01  // R
            hdrData[i+1] = dKey * 0.7 + dFill * 0.18 + dFloor * 0.06 + 0.01 // G
            hdrData[i+2] = dKey * 0.45 + dFill * 0.25 + dCeil * 0.06 + 0.01 // B
            hdrData[i+3] = 1
          }
        }
        const envTex = new THREE.DataTexture(hdrData, hdrSize, hdrSize, THREE.RGBAFormat, THREE.FloatType)
        envTex.mapping = THREE.EquirectangularReflectionMapping
        envTex.needsUpdate = true
        scene.environment = envTex
        renderer.outputEncoding = THREE.LinearEncoding

        // ── Load GLB ──
        if (modelUrl) {
          let url = modelUrl
          if (modelUrl.includes('/models/')) url = `/api/glb/${modelUrl.split('/models/').pop()}`
          else if (!modelUrl.startsWith('http')) url = modelUrl.startsWith('/') ? modelUrl : `/${modelUrl}`

          const dracoLoader = new THREE.DRACOLoader()
          dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/')
          const gltfLoader = new THREE.GLTFLoader()
          gltfLoader.setDRACOLoader(dracoLoader)
          gltfLoader.load(url, (gltf: any) => {
            if (cancelled) return
            const model = gltf.scene
            const box = new THREE.Box3().setFromObject(model)
            const centre = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            model.position.sub(centre)
            model.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z))
            model.rotation.set(...s.rot)

            const group = new THREE.Group()
            group.add(model)
            scene.add(group)
            groupRef.current = group

            // Apply anodised aluminium material
            model.traverse((child: any) => {
              if (!child.isMesh) return
              origMatsRef.current.set(child, child.material)

              // ── Anodised aluminium normal map (brushed grain) ──
              const nmSize = 256
              const nmCanvas = document.createElement('canvas')
              nmCanvas.width = nmSize; nmCanvas.height = nmSize
              const nmCtx = nmCanvas.getContext('2d')!
              // Base neutral (128,128,255 = flat normal pointing out)
              nmCtx.fillStyle = 'rgb(128,128,255)'
              nmCtx.fillRect(0, 0, nmSize, nmSize)
              // Horizontal brushing grain — very fine, directional
              for (let i = 0; i < nmSize; i++) {
                const brightness = 128 + Math.floor((Math.random() - 0.5) * 18)
                const a = 0.06 + Math.random() * 0.08
                nmCtx.fillStyle = `rgba(${brightness},${brightness},255,${a})`
                const lineY = i
                const h = Math.random() < 0.15 ? 2 : 1
                nmCtx.fillRect(0, lineY, nmSize, h)
              }
              // Occasional cross-grain micro-scratch
              for (let i = 0; i < 12; i++) {
                const x = Math.random() * nmSize
                nmCtx.strokeStyle = `rgba(180,180,255,0.12)`
                nmCtx.lineWidth = 0.5
                nmCtx.beginPath()
                nmCtx.moveTo(x, 0); nmCtx.lineTo(x + (Math.random()-0.5)*8, nmSize)
                nmCtx.stroke()
              }
              const nmTex = new THREE.CanvasTexture(nmCanvas)
              nmTex.wrapS = THREE.RepeatWrapping
              nmTex.wrapT = THREE.RepeatWrapping
              nmTex.repeat.set(3, 12)  // repeat more vertically (tall speaker)

              const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0xb8955a),
                metalness: 0.88,
                roughness: 0.38,
                envMapIntensity: 0.55,  // subtle reflections
                normalMap: nmTex,
                normalScale: new THREE.Vector2(0.4, 0.4),  // subtle grain
              })
              child.material = mat
              child.castShadow = true

              wireMatsRef.current.set(child, new THREE.MeshBasicMaterial({
                color: new THREE.Color(0xc9a96e),
                wireframe: true,
                transparent: true,
                opacity: 0.3,
              }))
            })

            // reflection removed

            setLoaded(true)
          }, undefined, (e: any) => console.error('GLB:', e))
        } else {
          setLoaded(true)
        }

        // ── Animate ──
        const animate = () => {
          animIdRef.current = requestAnimationFrame(animate)

          // Smooth rotation
          currentYRef.current += (targetYRef.current - currentYRef.current) * 0.055
          currentXRef.current += (targetXRef.current - currentXRef.current) * 0.055
          if (groupRef.current) {
            groupRef.current.rotation.y = currentYRef.current
            groupRef.current.rotation.x = currentXRef.current
          }

          // Cursor spotlight
          const mx = mouseRef.current.x, my = mouseRef.current.y
          const dist = Math.sqrt(mx * mx + my * my)
          const intensity = 0.3 + Math.max(0, 1 - dist * 0.5) * 2.2
          if (spotRef.current) {
            spotRef.current.position.set(mx * 1.1, -my * 0.7 + 0.4, 1.2)
            spotRef.current.intensity = intensity
          }

          renderer.render(scene, camera)
        }
        animate()

      } catch(e) { console.error('ModelReveal:', e) }
    }

    run()

    // Global mouse tracking
    const onMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      }
      setMouseNorm({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      })
    }
    window.addEventListener('mousemove', onMouse)

    return () => {
      cancelled = true
      cancelAnimationFrame(animIdRef.current)
      window.removeEventListener('mousemove', onMouse)
      const r = rendererRef.current
      if (r?.domElement && el.contains(r.domElement)) { r.dispose(); el.removeChild(r.domElement) }
    }
  }, [modelUrl, isFlag])

  // Wireframe toggle
  useEffect(() => {
    groupRef.current?.traverse((child: any) => {
      if (!child.isMesh) return
      child.material = wire
        ? wireMatsRef.current.get(child) || child.material
        : origMatsRef.current.get(child) || child.material
    })
  }, [wire])

  const handleConstraint = (i: number) => {
    if (i !== active) playClick()
    setActive(i)
    targetYRef.current = CONSTRAINTS[i].angle.y
    targetXRef.current = CONSTRAINTS[i].angle.x
  }

  if (!isFlag) return null

  const current = CONSTRAINTS[active]

  return (
    <div className="mr-outer">

      {/* 3D left */}
      <div className="mr-left">
        <div ref={mountRef} className="mr-canvas-mount"/>

        {/* Overlay effects */}
        <OverlayEffects
          mode={current.mode}
          active={loaded}
          canvasW={canvasSize.w}
          canvasH={canvasSize.h}
          mouseX={mouseNorm.x}
          mouseY={mouseNorm.y}
        />

        {!loaded && (
          <div className="mr-loading"><div className="mr-loading-bar"/></div>
        )}

        {/* Controls */}
        <div className="mr-controls">
          <button
            className={`mr-wire-btn${wire ? ' active' : ''}`}
            onClick={() => { setWire(w => !w); playClick() }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="5" y1="0.5" x2="5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="0.7"/>
            </svg>
            {wire ? 'Solid' : 'Wireframe'}
          </button>
        </div>

        <div className="mr-cursor-hint">Move cursor to illuminate</div>
      </div>

      {/* Constraints right */}
      <div className="mr-right">
        <div className="mr-right-ey">Design Philosophy</div>
        <div className="mr-constraints">
          {CONSTRAINTS.map((c, i) => (
            <div key={i}
              className={`mr-constraint${active === i ? ' active' : ''}${c.last ? ' last' : ''}`}
              onMouseEnter={() => handleConstraint(i)}
              onClick={() => handleConstraint(i)}>
              <span className="mr-cx">{c.cross}</span>
              <div className="mr-ct-wrap">
                <span className="mr-ct">{c.text}</span>
                {active === i && <span className="mr-cd">{c.desc}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mr-counter">
          {String(active + 1).padStart(2, '0')} / {String(CONSTRAINTS.length).padStart(2, '0')}
        </div>
      </div>

    </div>
  )
}
