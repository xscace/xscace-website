'use client'
import { useEffect, useRef, useState } from 'react'

// Same canvas size as the product detail page ModelReveal section
// mr-outer: min-height 660px, 3fr left col on ~1440px = ~860px wide
const CANVAS_W = 860
const CANVAS_H = 660

const MODELS = [
  { id: 'prod-bonsai',     name: 'Bonsai',           file: 'bonsai-mini-slim-array-speaker.glb' },
  { id: 'prod-cane',       name: 'Cane',              file: 'cane-slim-array-speaker.glb' },
  { id: 'prod-ghost2',     name: 'Ghost 2.0',         file: 'ghost-2-0-slim-in-ceiling-speaker.glb' },
  { id: 'prod-acacia6-pw', name: 'Acacia 6 Powered',  file: 'acacia-6-powered-subwoofer.glb' },
  { id: 'prod-xylem3',     name: 'Xylem 3',           file: 'xylem-3-dsp-amplifier.glb' },
  { id: 'prod-quadcane',   name: 'QuadCane',          file: 'quadcane-slim-array-speaker.glb' },
]

// Current baked-in settings for reference
const CURRENT: Record<string, any> = {
  'prod-bonsai':    { cam:[-0.12,0.84,3.27], rot:[0.108,-1.032,-1.542], fov:41, exposure:3.35, ambient:0,   key:0.1, fill:0.5 },
  'prod-cane':      { cam:[-0.08,0.34,3.03], rot:[0.248,-0.942,-1.502], fov:43, exposure:0.6,  ambient:1.1, key:2.4, fill:1.0 },
  'prod-ghost2':    { cam:[-0.01,0,3],        rot:[0.318,-0.012,0],      fov:69, exposure:0.9,  ambient:0,   key:0.8, fill:0   },
  'prod-acacia6-pw':{ cam:[0,0,3],            rot:[0,-0.702,0],          fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
  'prod-xylem3':    { cam:[-0.01,-0.67,3],    rot:[-2.512,0,0],          fov:78, exposure:0.6,  ambient:0,   key:0,   fill:1.6 },
  'prod-quadcane':  { cam:[0.18,-0.14,2.43],  rot:[2.308,1.588,-0.702],  fov:45, exposure:1.05, ambient:0,   key:0,   fill:0.7 },
}

const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0'

function inject(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = () => res(); s.onerror = rej
    document.head.appendChild(s)
  })
}

let threeReady: Promise<void> | null = null
function ensureThree(): Promise<void> {
  if (!threeReady) {
    threeReady = (async () => {
      await inject(`${CDN}/build/three.min.js`)
      await inject(`${CDN}/examples/js/loaders/GLTFLoader.js`)
      await inject(`${CDN}/examples/js/loaders/DRACOLoader.js`)
      await new Promise(r => setTimeout(r, 100))
    })()
  }
  return threeReady
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888', minWidth: 100 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#c9a96e', cursor: 'pointer' }}
      />
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#c9a96e', minWidth: 38, textAlign: 'right' }}>{value.toFixed(2)}</span>
    </div>
  )
}

function ModelTest({ id, name, file }: { id: string; name: string; file: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('loading...')
  const rendererRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const modelRef = useRef<any>(null)
  const frameRef = useRef<number>(0)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const dragRot = useRef({ x: 0, y: 0 })

  const def = CURRENT[id] || { cam:[0,0,3], rot:[0,0,0], fov:40, exposure:1.4, ambient:0.5, key:3, fill:1 }
  const [cfg, setCfg] = useState({
    camX: def.cam[0], camY: def.cam[1], camZ: def.cam[2],
    rotX: def.rot[0], rotY: def.rot[1], rotZ: def.rot[2],
    fov: def.fov, exposure: def.exposure,
    ambient: def.ambient, key: def.key, fill: def.fill,
  })
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg

  useEffect(() => {
    const el = mountRef.current; if (!el) return
    let cancelled = false

    const run = async () => {
      try {
        await ensureThree(); if (cancelled) return
        const THREE = (window as any).THREE

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(CANVAS_W, CANVAS_H)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = cfg.exposure
        el.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene(); sceneRef.current = scene
        const camera = new THREE.PerspectiveCamera(cfg.fov, CANVAS_W / CANVAS_H, 0.01, 100)
        camera.position.set(cfg.camX, cfg.camY, cfg.camZ)
        cameraRef.current = camera

        const ambLight = new THREE.AmbientLight(0xffffff, cfg.ambient); scene.add(ambLight)
        const keyLight = new THREE.DirectionalLight(0xfff5e0, cfg.key); keyLight.position.set(2,3,2); scene.add(keyLight)
        const fillLight = new THREE.DirectionalLight(0xc9a96e, cfg.fill); fillLight.position.set(-2,1,1); scene.add(fillLight)

        const dracoLoader = new THREE.DRACOLoader()
        dracoLoader.setDecoderPath(`${CDN}/examples/js/libs/draco/`)
        const loader = new THREE.GLTFLoader(); loader.setDRACOLoader(dracoLoader)

        setStatus('loading model...')
        loader.load(`/api/glb/${file}`, (gltf: any) => {
          if (cancelled) return
          const model = gltf.scene
          const box = new THREE.Box3().setFromObject(model)
          const centre = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          model.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z))
          model.position.sub(centre.multiplyScalar(2.0 / Math.max(size.x, size.y, size.z)))
          model.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ)
          scene.add(model); modelRef.current = model
          dragRot.current = { x: cfg.rotX, y: cfg.rotY }
          setStatus('✓ loaded — drag to rotate')

          const animate = () => {
            if (cancelled) return
            frameRef.current = requestAnimationFrame(animate)
            // Apply live cfg changes
            const c = cfgRef.current
            camera.position.set(c.camX, c.camY, c.camZ)
            camera.fov = c.fov; camera.updateProjectionMatrix()
            renderer.toneMappingExposure = c.exposure
            scene.children.forEach((ch: any) => {
              if (ch.isAmbientLight) ch.intensity = c.ambient
              if (ch.isDirectionalLight && ch.position.x > 0) ch.intensity = c.key
              if (ch.isDirectionalLight && ch.position.x < 0) ch.intensity = c.fill
            })
            renderer.render(scene, camera)
          }
          animate()
        }, undefined, (err: any) => setStatus(`✗ ${err?.message || err}`))
      } catch(e: any) { setStatus(`✗ ${e?.message}`) }
    }
    run()
    return () => { cancelled = true; cancelAnimationFrame(frameRef.current) }
  }, [file])

  const set = (key: string) => (v: number) => setCfg(p => ({ ...p, [key]: v }))

  const onMouseDown = (e: React.MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; e.preventDefault() }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !modelRef.current) return
    const dx = e.clientX - lastMouse.current.x; const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    dragRot.current.y += dx * 0.01; dragRot.current.x += dy * 0.01
    modelRef.current.rotation.x = dragRot.current.x; modelRef.current.rotation.y = dragRot.current.y
  }
  const onMouseUp = () => { isDragging.current = false }

  const copyConfig = () => {
    const c = cfgRef.current
    const rx = (dragRot.current.x).toFixed(3); const ry = (dragRot.current.y).toFixed(3)
    const txt = `${name}:\n  cam: (${c.camX}, ${c.camY}, ${c.camZ})\n  rot: (${rx}, ${ry}, ${c.rotZ.toFixed(3)})\n  fov: ${c.fov}\n  exposure: ${c.exposure}\n  ambient: ${c.ambient} | key: ${c.key} | fill: ${c.fill}`
    navigator.clipboard.writeText(txt).then(() => alert(`Copied!\n\n${txt}`))
  }

  const ok = status.startsWith('✓'); const err = status.startsWith('✗')

  return (
    <div style={{ marginBottom: 64, border: `0.5px solid ${err ? '#f44' : ok ? '#4caf7d' : '#1a1a1a'}` }}>
      <div style={{ padding: '10px 16px', background: '#0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', color: '#c9a96e', fontSize: 13, fontWeight: 'bold' }}>{name}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: err ? '#f44' : ok ? '#4caf7d' : '#888' }}>{status}</span>
          <button onClick={() => { dragRot.current = { x: cfg.rotX, y: cfg.rotY }; if (modelRef.current) { modelRef.current.rotation.x = cfg.rotX; modelRef.current.rotation.y = cfg.rotY } }} style={{ fontFamily: 'monospace', fontSize: 10, background: '#111', border: '0.5px solid #333', color: '#666', padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
          <button onClick={copyConfig} style={{ fontFamily: 'monospace', fontSize: 10, background: '#c9a96e', border: 'none', color: '#000', padding: '3px 12px', cursor: 'pointer', fontWeight: 'bold' }}>Copy Config ↗</button>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Canvas — exact product page size */}
        <div ref={mountRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{ width: CANVAS_W, height: CANVAS_H, background: '#000', flexShrink: 0, cursor: 'grab' }} />

        {/* Controls */}
        <div style={{ flex: 1, padding: '16px 14px', background: '#060606', borderLeft: '0.5px solid #111', overflowY: 'auto', minWidth: 220 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#c9a96e', letterSpacing: '.15em', marginBottom: 10 }}>CAMERA</div>
          <Slider label="cam X" value={cfg.camX} min={-5} max={5} step={0.01} onChange={set('camX')} />
          <Slider label="cam Y" value={cfg.camY} min={-5} max={5} step={0.01} onChange={set('camY')} />
          <Slider label="cam Z" value={cfg.camZ} min={0.1} max={10} step={0.01} onChange={set('camZ')} />
          <Slider label="FOV" value={cfg.fov} min={10} max={90} step={1} onChange={set('fov')} />
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#c9a96e', letterSpacing: '.15em', margin: '12px 0 10px' }}>BASE ROTATION</div>
          <Slider label="rot X" value={cfg.rotX} min={-Math.PI*2} max={Math.PI*2} step={0.01} onChange={set('rotX')} />
          <Slider label="rot Y" value={cfg.rotY} min={-Math.PI*2} max={Math.PI*2} step={0.01} onChange={set('rotY')} />
          <Slider label="rot Z" value={cfg.rotZ} min={-Math.PI} max={Math.PI} step={0.01} onChange={set('rotZ')} />
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#c9a96e', letterSpacing: '.15em', margin: '12px 0 10px' }}>LIGHTING</div>
          <Slider label="exposure" value={cfg.exposure} min={0} max={5} step={0.05} onChange={set('exposure')} />
          <Slider label="ambient" value={cfg.ambient} min={0} max={5} step={0.05} onChange={set('ambient')} />
          <Slider label="key" value={cfg.key} min={0} max={10} step={0.1} onChange={set('key')} />
          <Slider label="fill" value={cfg.fill} min={0} max={5} step={0.05} onChange={set('fill')} />
          <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#444', marginTop: 16, lineHeight: 1.5 }}>
            Canvas: {CANVAS_W}×{CANVAS_H}px<br/>
            Matches mr-outer 3fr col at 1440px
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Test3DPdPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '80px 32px 40px', overflowX: 'auto' }}>
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', marginBottom: 8 }}>
        /test-3d-pd — canvas matches product detail page ModelReveal ({CANVAS_W}×{CANVAS_H}px)
      </p>
      <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#333', marginBottom: 32 }}>
        Pre-loaded with current baked settings. Drag to rotate, adjust sliders, Copy Config to capture.
      </p>
      {MODELS.map(m => <ModelTest key={m.file} {...m} />)}
    </div>
  )
}
