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

function ModelTest({ name, file }: { name: string; file: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('loading...')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let cancelled = false

    const run = async () => {
      try {
        await inject(`${CDN}/build/three.min.js`)
        const THREE = (window as any).THREE
        if (!THREE.GLTFLoader) {
          await inject(`${CDN}/examples/js/loaders/GLTFLoader.js`)
          await new Promise(r => setTimeout(r, 50))
        }
        if (!THREE.DRACOLoader) {
          await inject(`${CDN}/examples/js/loaders/DRACOLoader.js`)
          await new Promise(r => setTimeout(r, 50))
        }
        if (cancelled) return

        const W = el.clientWidth, H = el.clientHeight

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

        // Axis helper to show orientation
        const axes = new THREE.AxesHelper(1)
        scene.add(axes)

        const dracoLoader = new THREE.DRACOLoader()
        dracoLoader.setDecoderPath(`${CDN}/examples/js/libs/draco/`)
        const loader = new THREE.GLTFLoader()
        loader.setDRACOLoader(dracoLoader)

        const url = `/api/glb/${file}`
        setStatus(`fetching ${url}...`)

        loader.load(url, (gltf: any) => {
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

          const infoStr = `size: ${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)} | scale: ${scale.toFixed(3)} | meshes: ${model.children.length}`
          setInfo(infoStr)
          setStatus('✓ loaded')

          // Auto-rotate
          let angle = 0
          const animate = () => {
            if (cancelled) return
            requestAnimationFrame(animate)
            angle += 0.008
            model.rotation.y = angle
            renderer.render(scene, camera)
          }
          animate()
        },
        (prog: any) => {
          const pct = prog.total ? Math.round(prog.loaded / prog.total * 100) : '?'
          setStatus(`loading ${pct}%`)
        },
        (err: any) => {
          setStatus(`✗ ERROR: ${err?.message || err}`)
        })

      } catch(e: any) {
        setStatus(`✗ EXCEPTION: ${e?.message}`)
      }
    }

    run()
    return () => { cancelled = true }
  }, [file])

  return (
    <div style={{ marginBottom: 48, border: '1px solid #333', padding: 0 }}>
      <div style={{ padding: '10px 16px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', color: '#c9a96e', fontSize: 14 }}>{name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: status.startsWith('✓') ? '#4caf7d' : status.startsWith('✗') ? '#f44' : '#888' }}>{status}</span>
      </div>
      {info && <div style={{ padding: '4px 16px', background: '#0a0a0a', fontFamily: 'monospace', fontSize: 10, color: '#555' }}>{info}</div>}
      <div ref={mountRef} style={{ width: '100%', height: 320, background: '#050505' }} />
    </div>
  )
}

export default function Test3DPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '80px 40px 40px', color: '#fff' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#666', marginBottom: 32 }}>
        /test-3d — 3D model diagnostic. Red X = load error. Green ✓ = loaded. Axis helper shown (R=X, G=Y, B=Z).
      </div>
      {MODELS.map(m => <ModelTest key={m.file} name={m.name} file={m.file} />)}
    </div>
  )
}
