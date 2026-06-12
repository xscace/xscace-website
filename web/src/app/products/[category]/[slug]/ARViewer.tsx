'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  modelUrl: string
  productName: string
  heroImgUrl?: string | null
}

// Detect platform
function getARMode(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export default function ARViewer({ modelUrl, productName, heroImgUrl }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [arMode] = useState<'ios' | 'android' | 'desktop'>(() =>
    typeof window !== 'undefined' ? getARMode() : 'desktop'
  )
  const [arSupported, setArSupported] = useState(false)
  const [activated, setActivated] = useState(false)
  const [entering, setEntering] = useState(false)

  // Load model-viewer script once
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.querySelector('script[data-mv]')) { setReady(true); return }
    const s = document.createElement('script')
    s.type = 'module'
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
    s.dataset.mv = '1'
    s.onload = () => setReady(true)
    document.head.appendChild(s)
  }, [])

  // Check AR support after model-viewer loads
  useEffect(() => {
    if (!ready) return
    if (arMode === 'ios') { setArSupported(true); return }
    if (arMode === 'android') { setArSupported(true); return }
    // Desktop — check WebXR
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then(s => setArSupported(s))
    }
  }, [ready, arMode])

  const handleActivate = () => {
    setEntering(true)
    setTimeout(() => { setActivated(true); setEntering(false) }, 400)
  }

  const fullModelUrl = modelUrl.startsWith('http')
    ? modelUrl
    : (typeof window !== 'undefined' ? window.location.origin : '') + modelUrl

  const arLabel = arMode === 'ios'
    ? 'View in Your Room — iOS AR Quick Look'
    : arMode === 'android'
    ? 'View in Your Room — Android AR'
    : 'View in AR — WebXR'

  return (
    <section className="ar-section">
      <div className="ar-header">
        <div className="pd-section-ey">Spatial Preview</div>
        <h2 className="pd-section-title">See it in <em>your space</em></h2>
        <p className="ar-sub">
          Place a photorealistic {productName} in your room at full scale.
          {arMode === 'ios' && ' Uses iOS AR Quick Look — no app required.'}
          {arMode === 'android' && ' Uses Android Scene Viewer — no app required.'}
          {arMode === 'desktop' && ' Drag to rotate. On mobile, tap to place in AR.'}
        </p>
      </div>

      <div className={`ar-stage${entering ? ' ar-entering' : ''}`} ref={wrapRef}>
        {/* Gate — show poster until user activates */}
        {!activated && (
          <div className="ar-gate" onClick={handleActivate}>
            {heroImgUrl && (
              <img src={heroImgUrl} alt={productName} className="ar-gate-img"/>
            )}
            <div className="ar-gate-overlay">
              <div className="ar-gate-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  {/* cube icon */}
                  <path d="M24 4L4 14v20l20 10 20-10V14L24 4z"
                    stroke="#c9a96e" strokeWidth="0.8" fill="none"/>
                  <path d="M4 14l20 10M24 24v20M44 14L24 24"
                    stroke="#c9a96e" strokeWidth="0.8"/>
                  {/* AR brackets */}
                  <path d="M2 12V2h10" stroke="#c9a96e" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M46 12V2H36" stroke="#c9a96e" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M2 36v10h10" stroke="#c9a96e" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M46 36v10H36" stroke="#c9a96e" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ar-gate-label">Load 3D Preview</div>
              <div className="ar-gate-hint">Click to load interactive model · {arSupported ? 'AR available' : '3D view'}</div>
            </div>
          </div>
        )}

        {/* model-viewer — rendered once activated */}
        {activated && ready && (
          <model-viewer
            src={fullModelUrl}
            alt={`3D model of ${productName}`}
            auto-rotate
            auto-rotate-delay="1000"
            rotation-per-second="12deg"
            camera-controls
            touch-action="pan-y"
            ar={arSupported ? '' : undefined}
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            shadow-intensity="0"
            exposure="0.85"
            style={{
              width: '100%',
              height: '100%',
              background: '#000',
              '--progress-bar-color': '#c9a96e',
              '--progress-mask': 'transparent',
            } as any}
          >
            {/* AR button slot */}
            {arSupported && (
              <button slot="ar-button" className="ar-launch-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                {arLabel}
              </button>
            )}

            {/* Loading slot */}
            <div slot="progress-bar" className="ar-progress-bar">
              <div className="ar-progress-fill"/>
            </div>
          </model-viewer>
        )}
      </div>

      {/* Bottom bar */}
      <div className="ar-bottom">
        <div className="ar-bottom-left">
          <span className="ar-bottom-tag">GLB · WebXR · AR Quick Look</span>
          <span className="ar-bottom-sep">·</span>
          <span className="ar-bottom-tag">No app required</span>
        </div>
        {arSupported && activated && (
          <div className="ar-bottom-right">
            Tap the AR button in the viewer to place in your room
          </div>
        )}
      </div>
    </section>
  )
}
