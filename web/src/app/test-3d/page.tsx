'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const MODELS = [
  { name: 'Bonsai', file: 'bonsai-mini-slim-array-speaker.glb' },
  { name: 'Cane', file: 'cane-slim-array-speaker.glb' },
  { name: 'Ghost 2.0', file: 'ghost-2-0-slim-in-ceiling-speaker.glb' },
  { name: 'Acacia 6 Powered', file: 'acacia-6-powered-subwoofer.glb' },
  { name: 'Xylem 3', file: 'xylem-3-dsp-amplifier.glb' },
]

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

const DEFAULT = {
  camX: 0, camY: 0, camZ: 3,
  rotX: 0, rotY: 0, rotZ: 0,
  exposure: 1.4, fov: 40,
  lightAmbient: 1.5, lightKey: 3.0, lightFill: 1.0,
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888', minWidth: 110 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#c9a96e', cursor: 'pointer' }}
      />
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#c9a96e', minWidth: 38, textAlign: 'right' }}>{value.toFixed(2)}</span>
    </div>
  )
}

function ModelTest({ name, file }: { name: string; file: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('loading...')
  const [info, setInfo] = useState('')
  const rendererRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const modelRef = useRef<any>(null)
  const frameRef = useRef<number>(0)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const modelRot = useRef({ x: 0, y: 0 })

  const [cfg, setCfg] = useState({ ...DEFAULT })
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg

  const updateScene = useCallback(() => {
    const c = cfgRef.current
    if (cameraRef.current) {
      cameraRef.current.position.set(c.camX, c.camY, c.camZ)
      cameraRef.current.fov = c.fov
      cameraRef.current.updateProjectionMatrix()
    }
    if (modelRef.current) {
      modelRef.current.rotation.set(c.rotX, c.rotY, c.rotZ)
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = c.exposure
    }
    const THREE = (window as any).THREE
    if (sceneRef.current && THREE) {
      sceneRef.current.children.forEach((child: any) => {
        if (child.isAmbientLight) child.intensity = c.lightAmbient
        if (child.isDirectionalLight && child.position.x > 0) child.intensity = c.lightKey
        if (child.isDirectionalLight && child.position.x < 0) child.intensity = c.lightFill
      })
    }
  }, [])

  const set = (key: keyof typeof DEFAULT) => (v: number) => {
    setCfg(prev => ({ ...prev, [key]: v }))
    setTimeout(updateScene, 0)
  }

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let cancelled = false

    const run = async () => {
      try {
        await ensureThree()
        if (cancelled) return
        const THREE = (window as any).THREE
        const W = el.clientWidth || 500, H = 380
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(W, H)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = cfg.exposure
        el.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene
        const camera = new THREE.PerspectiveCamera(cfg.fov, W / H, 0.01, 100)
        camera.position.set(cfg.camX, cfg.camY, cfg.camZ)
        cameraRef.current = camera

        scene.add(new THREE.AmbientLight(0xffffff, cfg.lightAmbient))
        const key = new THREE.DirectionalLight(0xffffff, cfg.lightKey)
        key.position.set(2, 3, 2); scene.add(key)
        const fill = new THREE.DirectionalLight(0xc9a96e, cfg.lightFill)
        fill.position.set(-2, 0, 1); scene.add(fill)
        scene.add(new THREE.AxesHelper(0.5))

        const dracoLoader = new THREE.DRACOLoader()
        dracoLoader.setDecoderPath(`${CDN}/examples/js/libs/draco/`)
        const loader = new THREE.GLTFLoader()
        loader.setDRACOLoader(dracoLoader)
        setStatus(`loading /api/glb/${file}...`)

        loader.load(`/api/glb/${file}`,
          (gltf: any) => {
            if (cancelled) return
            const model = gltf.scene
            const box = new THREE.Box3().setFromObject(model)
            const centre = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const scale = 2.0 / Math.max(size.x, size.y, size.z)
            model.scale.setScalar(scale)
            model.position.sub(centre.multiplyScalar(scale))
            scene.add(model)
            modelRef.current = model
            setInfo(`bbox: ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)} | scale: ${scale.toFixed(4)}`)
            setStatus('✓ loaded — drag to rotate')

            const animate = () => {
              if (cancelled) return
              frameRef.current = requestAnimationFrame(animate)
              renderer.render(scene, camera)
            }
            animate()
          },
          (prog: any) => { if (prog.total) setStatus(`${Math.round(prog.loaded / prog.total * 100)}%`) },
          (err: any) => setStatus(`✗ ${err?.message || err}`)
        )
      } catch(e: any) { setStatus(`✗ ${e?.message}`) }
    }
    run()
    return () => { cancelled = true; cancelAnimationFrame(frameRef.current) }
  }, [file])

  // Mouse drag to rotate
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !modelRef.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    modelRot.current.y += dx * 0.01
    modelRot.current.x += dy * 0.01
    modelRef.current.rotation.x = cfgRef.current.rotX + modelRot.current.x
    modelRef.current.rotation.y = cfgRef.current.rotY + modelRot.current.y
  }
  const onMouseUp = () => { isDragging.current = false }

  const copyConfig = () => {
    const c = cfgRef.current
    const rx = (cfgRef.current.rotX + modelRot.current.x).toFixed(3)
    const ry = (cfgRef.current.rotY + modelRot.current.y).toFixed(3)
    const txt = `${name}:\n  cam: (${c.camX}, ${c.camY}, ${c.camZ})\n  rot: (${rx}, ${ry}, ${c.rotZ.toFixed(3)})\n  fov: ${c.fov}\n  exposure: ${c.exposure}\n  ambient: ${c.lightAmbient} | key: ${c.lightKey} | fill: ${c.lightFill}`
    navigator.clipboard.writeText(txt).then(() => alert(`Copied!\n\n${txt}`))
  }

  const resetRot = () => {
    modelRot.current = { x: 0, y: 0 }
    if (modelRef.current) {
      modelRef.current.rotation.x = cfg.rotX
      modelRef.current.rotation.y = cfg.rotY
    }
  }

  const ok = status.startsWith('✓')
  const err = status.startsWith('✗')
  const borderColor = err ? '#f44' : ok ? '#4caf7d' : '#333'

  return (
    <div style={{ marginBottom: 56, border: `1px solid ${borderColor}` }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', color: '#c9a96e', fontSize: 14, fontWeight: 'bold' }}>{name}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: err ? '#f44' : ok ? '#4caf7d' : '#888' }}>{status}</span>
          <button onClick={resetRot} style={{ fontFamily: 'monospace', fontSize: 10, background: '#222', border: '1px solid #444', color: '#888', padding: '3px 10px', cursor: 'pointer' }}>Reset Rot</button>
          <button onClick={copyConfig} style={{ fontFamily: 'monospace', fontSize: 10, background: '#c9a96e', border: 'none', color: '#000', padding: '3px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Copy Config ↗</button>
        </div>
      </div>
      {info && <div style={{ padding: '4px 16px', background: '#0a0a0a', fontFamily: 'monospace', fontSize: 10, color: '#555' }}>{info}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px' }}>
        {/* Canvas */}
        <div
          ref={mountRef}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{ height: 380, background: '#050505', cursor: isDragging.current ? 'grabbing' : 'grab' }}
        />

        {/* Controls */}
        <div style={{ padding: '16px 14px', background: '#0d0d0d', borderLeft: '1px solid #1a1a1a', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#c9a96e', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Camera Position</div>
          <Slider label="cam X" value={cfg.camX} min={-5} max={5} step={0.01} onChange={set('camX')} />
          <Slider label="cam Y" value={cfg.camY} min={-5} max={5} step={0.01} onChange={set('camY')} />
          <Slider label="cam Z" value={cfg.camZ} min={0.1} max={10} step={0.01} onChange={set('camZ')} />
          <Slider label="FOV" value={cfg.fov} min={10} max={90} step={1} onChange={set('fov')} />

          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#c9a96e', letterSpacing: '0.15em', margin: '14px 0 10px', textTransform: 'uppercase' }}>Base Rotation</div>
          <Slider label="rot X" value={cfg.rotX} min={-Math.PI} max={Math.PI} step={0.01} onChange={set('rotX')} />
          <Slider label="rot Y" value={cfg.rotY} min={-Math.PI} max={Math.PI} step={0.01} onChange={set('rotY')} />
          <Slider label="rot Z" value={cfg.rotZ} min={-Math.PI} max={Math.PI} step={0.01} onChange={set('rotZ')} />

          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#c9a96e', letterSpacing: '0.15em', margin: '14px 0 10px', textTransform: 'uppercase' }}>Lighting</div>
          <Slider label="exposure" value={cfg.exposure} min={0} max={4} step={0.05} onChange={set('exposure')} />
          <Slider label="ambient" value={cfg.lightAmbient} min={0} max={5} step={0.1} onChange={set('lightAmbient')} />
          <Slider label="key light" value={cfg.lightKey} min={0} max={10} step={0.1} onChange={set('lightKey')} />
          <Slider label="fill light" value={cfg.lightFill} min={0} max={5} step={0.1} onChange={set('lightFill')} />
        </div>
      </div>
    </div>
  )
}

export default function Test3DPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '80px 32px 40px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', marginBottom: 32 }}>
        /test-3d — drag canvas to rotate · adjust sliders · click "Copy Config" to get values
      </div>
      {MODELS.map(m => <ModelTest key={m.file} {...m} />)}
    </div>
  )
}
