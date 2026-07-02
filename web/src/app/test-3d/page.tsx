'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const MODELS = [
  { id: 'prod-bonsai',     name: 'Bonsai',          file: 'bonsai-mini-slim-array-speaker.glb' },
  { id: 'prod-cane',       name: 'Cane',             file: 'cane-slim-array-speaker.glb' },
  { id: 'prod-ghost2',     name: 'Ghost 2.0',        file: 'ghost-2-0-slim-in-ceiling-speaker.glb' },
  { id: 'prod-acacia6-pw', name: 'Acacia 6 Powered', file: 'acacia-6-powered-subwoofer.glb' },
  { id: 'prod-quadcane',   name: 'QuadCane',         file: 'quadcane-slim-array-speaker.glb' },
  { id: 'prod-cedar',     name: 'Cedar',            file: 'cedar-slim-array-speaker.glb' },
  { id: 'prod-cane-ic',   name: 'Cane IC/IW',          file: 'cane-in-ceiling-in-wall-speaker.glb' },
  { id: 'prod-bonsai-ic', name: 'Bonsai IC/IW',       file: 'bonsai-in-ceiling-in-wall-speaker.glb' },
  { id: 'prod-aster6',    name: 'Aster 6 LCR',       file: 'aster-6-lcr-in-ceiling-speaker.glb' },
  { id: 'prod-aspen6',    name: 'Aspen 6',          file: 'aspen-6-in-ceiling-speaker.glb' },
  { id: 'prod-aspen8',    name: 'Aspen 8',          file: 'aspen-8-in-ceiling-speaker.glb' },
  { id: 'prod-air-mini',   name: 'Air Mini',          file: 'air-mini-streaming-amplifier.glb' },
  { id: 'prod-air-amp',    name: 'Air Amp',           file: 'air-amp-streaming-amplifier.glb' },
  { id: 'prod-xylem3',     name: 'Xylem 3',          file: 'xylem-3-dsp-amplifier.glb' },
  { id: 'prod-oak',        name: 'Oak',              file: 'oak-in-wall-home-cinema-speaker.glb' },
  { id: 'prod-willow',     name: 'Willow',           file: 'willow-in-wall-home-cinema-speaker.glb' },
  { id: 'prod-sage',       name: 'Sage',             file: 'sage-in-wall-speaker.glb' },
  { id: 'prod-bergenia',   name: 'Bergenia',         file: 'bergenia-in-wall-speaker.glb' },
  { id: 'prod-quadcane-ic', name: 'QuadCane IC/IW', file: 'quadcane-in-ceiling-in-wall-speaker.glb' },
]

// Current baked settings — pre-loaded so you can see the exact production view
const CURRENT: Record<string, any> = {
  'prod-air-mini':  { cam:[0,0,3.91],        rot:[0.138,-6.482,0],       fov:40, exposure:1.4,  ambient:0.1, key:0.7, fill:0   },
  'prod-bonsai':    { cam:[0.18,0.84,3],      rot:[0.018,-0.582,-1.572], fov:49, exposure:1.0,  ambient:0,   key:0.0, fill:0.2 },
  'prod-cane':      { cam:[-0.08,0.34,3.03],  rot:[0.248,-0.942,-1.502], fov:43, exposure:0.6,  ambient:1.1, key:2.4, fill:1.0 },
  'prod-ghost2':    { cam:[-0.01,0,3],         rot:[0.318,-0.012,0],      fov:69, exposure:0.9,  ambient:0,   key:0.8, fill:0   },
  'prod-acacia6-pw':{ cam:[0,0,3],             rot:[0,-0.702,0],          fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
  'prod-quadcane':  { cam:[0.18,-0.14,2.43],   rot:[2.308,1.588,-0.702],  fov:45, exposure:1.05, ambient:0,   key:0,   fill:0.7 },
  'prod-cedar':     { cam:[-0.08,0.56,3.03],   rot:[0.138,-0.792,-1.502], fov:49, exposure:0.25, ambient:0,   key:2.0, fill:0.7 },
  'prod-cane-ic':   { cam:[-0.08,0.34,3.03],    rot:[0.248,-0.942,-1.502], fov:43, exposure:0.6,  ambient:1.1, key:2.4, fill:1.0 },
  'prod-bonsai-ic': { cam:[0.18,0.84,3],       rot:[0.018,-0.582,-1.572], fov:49, exposure:1.0,  ambient:0,   key:0.0, fill:0.2 },
  'prod-aster6':    { cam:[0,0,3],             rot:[0,-0.702,0],          fov:72, exposure:0.85, ambient:0,   key:2.5, fill:0.5 },
  'prod-aspen6':    { cam:[0,0,3],             rot:[0,-0.702,0],          fov:72, exposure:0.85, ambient:0,   key:2.5, fill:0.5 },
  'prod-aspen8':    { cam:[0,0,3],             rot:[0,-0.702,0],          fov:72, exposure:0.85, ambient:0,   key:2.5, fill:0.5 },
  'prod-xylem3':    { cam:[-0.01,-0.67,3],     rot:[-2.512,0,0],          fov:78, exposure:0.6,  ambient:0,   key:0,   fill:1.6 },
  'prod-oak':       { cam:[0,0,3],             rot:[0,-0.502,0],          fov:65, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-willow':    { cam:[0,0,3],             rot:[0,-0.502,0],          fov:65, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-sage':      { cam:[0,0,3],             rot:[0,-0.502,0],          fov:65, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-bergenia':  { cam:[0,0,3],             rot:[0,-0.502,0],          fov:72, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-quadcane-ic': { cam:[-0.08,0.56,3.03], rot:[0.138,-0.792,-1.502], fov:49, exposure:0.25, ambient:0,  key:2.0, fill:0.7 },
}

function buildHDR(THREE: any) {
  const hdrSize = 128
  const hdrData = new Float32Array(hdrSize * hdrSize * 4)
  for (let y = 0; y < hdrSize; y++) {
    for (let x = 0; x < hdrSize; x++) {
      const nx = x / hdrSize, ny = y / hdrSize
      const az = nx * Math.PI * 2
      const el = (ny - 0.5) * Math.PI
      const dKey  = Math.max(0, Math.cos(az - Math.PI * 1.3) * Math.cos(el - 0.5))
      const dFill = Math.max(0, Math.cos(az - 0.2) * Math.cos(el - 0.1))
      const dFloor = Math.max(0, -Math.sin(el)) * 0.3
      const dCeil  = Math.max(0,  Math.sin(el)) * 0.15
      const i = (y * hdrSize + x) * 4
      hdrData[i]   = dKey * 0.9 + dFill * 0.15 + dFloor * 0.08 + 0.01
      hdrData[i+1] = dKey * 0.7 + dFill * 0.18 + dFloor * 0.06 + 0.01
      hdrData[i+2] = dKey * 0.45 + dFill * 0.25 + dCeil  * 0.06 + 0.01
      hdrData[i+3] = 1
    }
  }
  const tex = new THREE.DataTexture(hdrData, hdrSize, hdrSize, THREE.RGBAFormat, THREE.FloatType)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.needsUpdate = true
  return tex
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

function loadModelViewer(): Promise<void> {
  if ((window as any).__mvLoaded) return Promise.resolve()
  return new Promise((res) => {
    if (document.querySelector('script[data-mv]')) {
      const check = setInterval(() => {
        if (customElements.get('model-viewer')) { clearInterval(check); res() }
      }, 50)
      return
    }
    const s = document.createElement('script')
    s.type = 'module'
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
    s.dataset.mv = '1'
    s.onload = () => {
      const check = setInterval(() => {
        if (customElements.get('model-viewer')) { clearInterval(check); (window as any).__mvLoaded = true; res() }
      }, 50)
    }
    document.head.appendChild(s)
  })
}

// AR orientation panel — uses <model-viewer>'s native orientation attribute directly.
// This is a DIFFERENT coordinate system from the three.js panel above (different axis
// convention + rotation order), so values from one panel do NOT transfer to the other.
// Always read the AR config from THIS panel when setting up AR placement.
function ARTest({ id, name, file }: { id: string; name: string; file: string }) {
  const [ready, setReady] = useState(false)
  const [roll, setRoll] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [yaw, setYaw] = useState(0)
  const [placement, setPlacement] = useState<'floor' | 'wall'>('floor')
  const [scale, setScale] = useState(1)
  const mvElRef = useRef<any>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    loadModelViewer().then(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready || !wrapRef.current) return
    wrapRef.current.innerHTML = ''
    const mv = document.createElement('model-viewer') as any
    mv.src = `/api/glb/${file}`
    mv.setAttribute('ar', '')
    mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
    mv.setAttribute('ar-placement', placement)
    mv.setAttribute('ar-scale', 'fixed')
    mv.setAttribute('camera-controls', '')
    mv.setAttribute('shadow-intensity', '0')
    mv.setAttribute('exposure', '0.8')
    mv.style.cssText = 'width:100%;height:100%;display:block;background:#000;'
    mv.orientation = `${roll}deg ${pitch}deg ${yaw}deg`
    mv.scale = `${scale} ${scale} ${scale}`
    wrapRef.current.appendChild(mv)
    mvElRef.current = mv
  }, [ready, file, placement])

  useEffect(() => {
    if (mvElRef.current) {
      mvElRef.current.orientation = `${roll}deg ${pitch}deg ${yaw}deg`
    }
  }, [roll, pitch, yaw])

  useEffect(() => {
    if (mvElRef.current) {
      mvElRef.current.scale = `${scale} ${scale} ${scale}`
    }
  }, [scale])

  const handleAR = () => { if (mvElRef.current) mvElRef.current.activateAR() }

  const copyARConfig = () => {
    const txt = `${name} — AR orientation:\n  ar-placement: '${placement}'\n  orientation: '${roll}deg ${pitch}deg ${yaw}deg'\n  scale: ${scale}`
    navigator.clipboard.writeText(txt).then(() => alert(`Copied!\n\n${txt}`))
  }

  const resetAR = () => { setRoll(0); setPitch(0); setYaw(0); setScale(1) }

  return (
    <div style={{ marginBottom: 56, border: '1px solid #c9a96e' }}>
      <div style={{ padding: '10px 16px', background: '#1a1606', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', color: '#c9a96e', fontSize: 14, fontWeight: 'bold' }}>{name} — AR ORIENTATION (model-viewer)</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{ready ? '✓ ready' : 'loading model-viewer...'}</span>
          <button onClick={resetAR} style={{ fontFamily: 'monospace', fontSize: 10, background: '#222', border: '1px solid #444', color: '#888', padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
          <button onClick={copyARConfig} style={{ fontFamily: 'monospace', fontSize: 10, background: '#c9a96e', border: 'none', color: '#000', padding: '3px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Copy AR Config ↗</button>
        </div>
      </div>
      <div style={{ padding: '4px 16px', background: '#0a0a0a', fontFamily: 'monospace', fontSize: 10, color: '#a08850' }}>
        This is model-viewer&apos;s own orientation system — degrees, different axis convention from the panel above. Drag in the preview to orbit the CAMERA (not the model); use the sliders below to rotate the MODEL itself, and &quot;View in AR&quot; on a phone to confirm in real AR.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', minHeight: 440 }}>
        <div ref={wrapRef} style={{ background: '#000' }} />

        <div style={{ padding: '16px 14px', background: '#0d0d0d', borderLeft: '1px solid #1a1a1a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setPlacement('floor')} style={{
              flex: 1, padding: '6px 0', fontSize: 10, fontFamily: 'monospace',
              background: placement === 'floor' ? '#c9a96e' : '#222',
              color: placement === 'floor' ? '#000' : '#aaa', border: 'none', cursor: 'pointer',
            }}>floor</button>
            <button onClick={() => setPlacement('wall')} style={{
              flex: 1, padding: '6px 0', fontSize: 10, fontFamily: 'monospace',
              background: placement === 'wall' ? '#c9a96e' : '#222',
              color: placement === 'wall' ? '#000' : '#aaa', border: 'none', cursor: 'pointer',
            }}>wall</button>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#c9a96e', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>AR Orientation (deg)</div>
          <Slider label="roll" value={roll} min={-180} max={180} step={0.5} onChange={setRoll} />
          <Slider label="pitch" value={pitch} min={-180} max={180} step={0.5} onChange={setPitch} />
          <Slider label="yaw" value={yaw} min={-180} max={180} step={0.5} onChange={setYaw} />
          <Slider label="scale" value={scale} min={0.1} max={3} step={0.05} onChange={setScale} />

          <button onClick={handleAR} style={{
            marginTop: 14, width: '100%', padding: '10px 0', fontFamily: 'monospace', fontSize: 11,
            background: '#c9a96e', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold',
          }}>View in AR (phone only)</button>

          <div style={{ marginTop: 18, padding: 12, background: '#000', border: '1px solid #222', fontFamily: 'monospace', fontSize: 10, color: '#c9a96e', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
{`placement: '${placement}'
orientation: '${roll}deg ${pitch}deg ${yaw}deg'
scale: ${scale}`}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelTest({ id, name, file }: { id: string; name: string; file: string }) {
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

  const def = CURRENT[id] || { cam:[0,0,3], rot:[0,0,0], fov:40, exposure:1.4, ambient:0.5, key:3, fill:1 }
  const [cfg, setCfg] = useState({ ...DEFAULT,
    camX: def.cam[0], camY: def.cam[1], camZ: def.cam[2],
    rotX: def.rot[0], rotY: def.rot[1], rotZ: def.rot[2],
    fov: def.fov, exposure: def.exposure,
    lightAmbient: def.ambient, lightKey: def.key, lightFill: def.fill,
  })
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
        const W = el.offsetWidth, H = el.offsetHeight
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(W, H)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = cfg.exposure
        renderer.setClearColor(0x000000, 1)
        renderer.shadowMap.enabled = true
        renderer.outputEncoding = THREE.LinearEncoding
        el.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene
        scene.environment = buildHDR(THREE)
        const camera = new THREE.PerspectiveCamera(cfg.fov, W / H, 0.01, 100)
        camera.position.set(cfg.camX, cfg.camY, cfg.camZ)
        cameraRef.current = camera

        scene.add(new THREE.AmbientLight(0xffffff, cfg.lightAmbient))
        const key = new THREE.DirectionalLight(0xffffff, cfg.lightKey)
        key.position.set(2, 3, 2); scene.add(key)
        const fill = new THREE.DirectionalLight(0xc9a96e, cfg.lightFill)
        fill.position.set(-2, 0, 1); scene.add(fill)
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

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', minHeight: 660 }}>
        {/* Canvas — same layout as product detail page (mr-outer 3fr col) */}
        <div
          ref={mountRef}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{ background: '#000', cursor: isDragging.current ? 'grabbing' : 'grab' }}
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

const AR_MODELS = MODELS.filter(m => ['prod-air-mini', 'prod-air-amp', 'prod-xylem3', 'prod-cedar'].includes(m.id))

export default function Test3DPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '80px 32px 40px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', marginBottom: 32 }}>
        /test-3d — same layout &amp; HDR as product detail page · pre-loaded with current settings · drag to rotate
      </div>
      {MODELS.map(m => (
        <div key={m.file}>
          <ModelTest {...m} />
          {AR_MODELS.some(am => am.file === m.file) && (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#c9a96e', margin: '-32px 0 32px', letterSpacing: '0.1em' }}>
                ↓ AR-SPECIFIC ORIENTATION PANEL FOR {m.name.toUpperCase()} — separate coordinate system, see note below ↓
              </div>
              <ARTest {...m} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}