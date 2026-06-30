'use client'
import { useEffect, useRef, useState } from 'react'

const MODELS = [
  { id: 'prod-xylem3', name: 'Xylem 3 (shared GLB for Xylem 2/3/4)', file: 'xylem-3-dsp-amplifier.glb' },
]

function loadMV(cb: () => void) {
  if (document.querySelector('script[data-mv]')) { cb(); return }
  const s = document.createElement('script')
  s.type = 'module'
  s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
  s.dataset.mv = '1'
  s.onload = () => cb()
  document.head.appendChild(s)
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa', minWidth: 70 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#c9a96e', cursor: 'pointer' }}
      />
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#c9a96e', minWidth: 50, textAlign: 'right' }}>{value.toFixed(1)}°</span>
    </div>
  )
}

export default function ARCalibratorPage() {
  const [ready, setReady] = useState(false)
  const [roll, setRoll] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [yaw, setYaw] = useState(0)
  const [placement, setPlacement] = useState<'floor'|'wall'>('floor')
  const mvRef = useRef<any>(null)

  useEffect(() => { loadMV(() => setReady(true)) }, [])

  useEffect(() => {
    if (mvRef.current) {
      mvRef.current.orientation = `${roll}deg ${pitch}deg ${yaw}deg`
    }
  }, [roll, pitch, yaw])

  const model = MODELS[0]
  const src = `https://xscace.com/api/glb/${model.file}`

  const handleAR = () => {
    if (mvRef.current) {
      mvRef.current.activateAR()
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 16, marginBottom: 16, color: '#c9a96e' }}>AR Orientation Calibrator — {model.name}</h1>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 20, maxWidth: 480, lineHeight: 1.6 }}>
        Drag the sliders until the model sits correctly base-down, front facing you, in the preview below.
        Then tap &quot;View in AR&quot; on your phone to confirm in real AR — the same orientation string
        will be used. Copy the final values shown at the bottom once it looks right.
      </p>

      {ready && (
        // @ts-ignore
        <model-viewer
          ref={mvRef}
          src={src}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement={placement}
          ar-scale="fixed"
          camera-controls
          exposure="0.6"
          shadow-intensity="0"
          orientation={`${roll}deg ${pitch}deg ${yaw}deg`}
          style={{ width: '100%', maxWidth: 480, height: 360, background: '#111', display: 'block' }}
        >
          <button slot="ar-button" onClick={handleAR} style={{
            position: 'absolute', bottom: 16, right: 16,
            background: '#c9a96e', color: '#000', border: 'none',
            padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer',
          }}>View in AR</button>
        </model-viewer>
      )}

      <div style={{ marginTop: 20, maxWidth: 480 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setPlacement('floor')} style={{
            padding: '6px 14px', fontSize: 11, fontFamily: 'monospace',
            background: placement === 'floor' ? '#c9a96e' : '#222',
            color: placement === 'floor' ? '#000' : '#aaa', border: 'none', cursor: 'pointer',
          }}>floor</button>
          <button onClick={() => setPlacement('wall')} style={{
            padding: '6px 14px', fontSize: 11, fontFamily: 'monospace',
            background: placement === 'wall' ? '#c9a96e' : '#222',
            color: placement === 'wall' ? '#000' : '#aaa', border: 'none', cursor: 'pointer',
          }}>wall</button>
        </div>

        <Slider label="roll" value={roll} min={-180} max={180} step={0.5} onChange={setRoll} />
        <Slider label="pitch" value={pitch} min={-180} max={180} step={0.5} onChange={setPitch} />
        <Slider label="yaw" value={yaw} min={-180} max={180} step={0.5} onChange={setYaw} />

        <button onClick={() => { setRoll(0); setPitch(0); setYaw(0) }} style={{
          marginTop: 8, padding: '6px 14px', fontSize: 11, fontFamily: 'monospace',
          background: '#222', color: '#aaa', border: 'none', cursor: 'pointer',
        }}>Reset to 0,0,0</button>

        <div style={{ marginTop: 24, padding: 14, background: '#0a0a0a', border: '1px solid #222', fontFamily: 'monospace', fontSize: 12, color: '#c9a96e', whiteSpace: 'pre-wrap' }}>
{`ar-placement: '${placement}'
orientation: '${roll}deg ${pitch}deg ${yaw}deg'`}
        </div>
      </div>
    </div>
  )
}
