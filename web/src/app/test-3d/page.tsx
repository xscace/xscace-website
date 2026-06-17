'use client'
import { useEffect, useRef, useState } from 'react'

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

// Load Three.js once — shared promise so all models wait on the same load
let threeReady: Promise<void> | null = null
function ensureThree(): Promise<void> {
  if (!threeReady) {
    threeReady = (async () => {
      await inject(`${CDN}/build/three.min.js`)
      await inject(`${CDN}/examples/js/loaders/GLTFLoader.js`)
      await inject(`${CDN}/examples/js/loaders/DRACOLoader.js`)
      await new Promise(r => setTimeout(r, 100)) // let scripts initialise
    })()
  }
  return threeReady
}

function ModelTest({ name, file }: { name: string; file: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('waiting...')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let cancelled = false
    let frameId = 0

    const run = async () => {
      try {
        setStatus('loading Three.js...')
        await ensureThree()
        if (cancelled) return

        const THREE = (window as any).THREE
        setStatus('THREE ready, loading model...')

        const W = el.clientWidth || 400
        const H = 320

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(W, H)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.4
        el.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 100)
        camera.position.set(0, 0, 3)

        scene.add(new THREE.AmbientLight(0xffffff, 1.5))
        const key = new THREE.DirectionalLight(0xffffff, 3)
        key.position.set(2, 3, 2); scene.add(key)
        const fill = new THREE.DirectionalLight(0xc9a96e, 1)
        fill.position.set(-2, 0, 1); scene.add(fill)
        scene.add(new THREE.AxesHelper(1))

        const dracoLoader = new THREE.DRACOLoader()
        dracoLoader.setDecoderPath(`${CDN}/examples/js/libs/draco/`)
        const loader = new THREE.GLTFLoader()
        loader.setDRACOLoader(dracoLoader)

        const url = `/api/glb/${file}`
        setStatus(`fetching ${url}...`)

        loader.load(url,
          (gltf: any) => {
            if (cancelled) return
            const model = gltf.scene
            const box = new THREE.Box3().setFromObject(model)
            const centre = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 2.0 / maxDim
            model.scale.setScalar(scale)
            model.position.sub(centre.multiplyScalar(scale))
            scene.add(model)
            setInfo(`bbox: ${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)} | scale: ${scale.toFixed(3)}`)
            setStatus('✓ loaded')
            let angle = 0
            const animate = () => {
              if (cancelled) return
              frameId = requestAnimationFrame(animate)
              angle += 0.008; model.rotation.y = angle
              renderer.render(scene, camera)
            }
            animate()
          },
          (prog: any) => {
            if (prog.total) setStatus(`loading ${Math.round(prog.loaded / prog.total * 100)}%`)
          },
          (err: any) => setStatus(`✗ ${err?.message || JSON.stringify(err)}`)
        )
      } catch(e: any) {
        setStatus(`✗ EXCEPTION: ${e?.message}`)
      }
    }

    run()
    return () => { cancelled = true; cancelAnimationFrame(frameId) }
  }, [file])

  const ok = status.startsWith('✓')
  const err = status.startsWith('✗')

  return (
    <div style={{ marginBottom: 40, border: `1px solid ${err ? '#f44' : ok ? '#4caf7d' : '#333'}` }}>
      <div style={{ padding: '10px 16px', background: '#111', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', color: '#c9a96e', fontSize: 14, fontWeight: 'bold' }}>{name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: err ? '#f44' : ok ? '#4caf7d' : '#888' }}>{status}</span>
      </div>
      {info && <div style={{ padding: '4px 16px', background: '#0a0a0a', fontFamily: 'monospace', fontSize: 10, color: '#555' }}>{info}</div>}
      <div ref={mountRef} style={{ width: '100%', height: 320, background: '#050505' }} />
    </div>
  )
}

export default function Test3DPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '80px 40px 40px' }}>
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', marginBottom: 32 }}>
        /test-3d — Three.js loaded once shared across all models. Axis: R=X G=Y B=Z
      </p>
      {MODELS.map(m => <ModelTest key={m.file} {...m} />)}
    </div>
  )
}
