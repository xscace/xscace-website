'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const CHAPTERS = [
  { id:'origin', index:'00', eyebrow:'The founding problem', title:"Invisible. But worth every penny.", body:"We founded XSCACE because architectural audio always demanded a compromise. Speakers were either discreet but sonically hollow, or acoustically excellent but visually intrusive. We wanted the speaker you never see — but one that makes you feel your money was well spent even when the music is off.", interact:'Drag to shift between the two worlds.', vec:'duality' },
  { id:'nano', index:'01', eyebrow:"Nano Resonance™ · Hoffman's Iron Law", title:'You can only choose two.', body:"Hoffman's Iron Law: in any speaker, you can only optimise two of three — low frequency response, efficiency, or small enclosure size. We chose to sacrifice efficiency deliberately, engineering a heavier cone mass to push the resonant frequency lower from a miniature enclosure.", interact:'Click two to keep — see what gets sacrificed.', vec:'hoffman' },
  { id:'powerdense', index:'02', eyebrow:'PowerDense Dynamics™ · Voice Coil Engineering', title:'Copper-silver composite. Thick gauge. No thermal compression.', body:"Lower efficiency means more power. More power means heat in the voice coil. We wound the coil from copper-silver composite wire — silver reduces resistive heating; copper provides structural mass. Heavy gauge handles sustained high-power without driver failure.", interact:'Drag power level — watch thermal build-up in the coil.', vec:'coil' },
  { id:'aeroframe', index:'03', eyebrow:'AeroFrame Chassis™ · Thermal Management', title:'The enclosure is the heatsink.', body:"Heat that cannot escape destroys drivers. We machined the chassis from 6061 aerospace aluminium with geometry designed as a passive heatsink. The enclosure itself draws heat away from the voice coil — it glows with thermal energy, then dissipates it through the body.", interact:'', vec:'heatsink' },
  { id:'xover', index:'04', eyebrow:'PrecisionXover Array™ · Crossover Network', title:'A crossover miniaturised to invisibility.', body:"Air-core inductors, polypropylene capacitors and metal-film resistors — hand-selected to ±0.5dB tolerance — miniaturised directly inside the speaker housing. Click each component to understand its role.", interact:'Click components to see their role.', vec:'xover' },
  { id:'xsflow', index:'05', eyebrow:'XS-Flow™ · Acoustic Waveguides', title:'12mm deep. Sound shaped from within.', body:"Our Bonsai speaker is just 12mm deep. Inside that enclosure, micro-waveguides redirect and phase-align the sound wave before it exits through the port — extending frequency response and controlling dispersion far beyond what the physical size suggests.", interact:'Watch sound emerge from the internal port and disperse.', vec:'xsflow' },
  { id:'psysculpt', index:'06', eyebrow:'PsySculpt™ · Psychoacoustic DSP', title:'Fletcher-Munson. In silicon. In real time.', body:"Human hearing is not linear. At low volumes, the ear perceives bass and treble as quieter. PsySculpt™ runs on the ADAU1701 DSP inside Xylem: Pre-Comp → Loudness L&H (LP@60Hz, HP@7kHz) → Post-Comp → Log-Decay Peak Detector → Dynamic Bass → DAC.", interact:'Toggle PsySculpt™ on/off. Drag volume to see the effect.', vec:'psysculpt' },
  { id:'upcoming', index:'→', eyebrow:"What's next", title:'Three things are coming.', body:"Xylem moves to general release. New PC and iOS controller software brings the full DSP to every platform. And for the first time — a designer powered speaker: all six chapters of physics built in, no external amplifier required.", interact:'', vec:'upcoming' },
]

// ── WAVE DIVIDER ───────────────────────────────────────────────────────────
function WaveDivider() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = 40
    canvas.width = W*dpr; canvas.height = H*dpr
    canvas.style.height = H+'px'; ctx.scale(dpr,dpr)
    let t = 0
    function draw() {
      ctx.clearRect(0,0,W,H)
      ctx.beginPath()
      for (let x=0;x<=W;x+=2) {
        const y = H/2+Math.sin(x*0.018+t)*3+Math.sin(x*0.034+t*0.7)*1.5
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
      }
      ctx.strokeStyle='rgba(201,169,110,0.18)'; ctx.lineWidth=1; ctx.stroke()
      t+=0.012; rafRef.current=requestAnimationFrame(draw)
    }
    draw()
    return ()=>cancelAnimationFrame(rafRef.current)
  },[])
  return <canvas ref={canvasRef} style={{width:'100%',height:'40px',display:'block'}} aria-hidden/>
}

// ── ABOUT HERO — before/after image cards ─────────────────────────────────
function AboutHero() {
  return (
    <div className="hero-v2-layout">
      <div className="hero-v2-text">
        <div className="about-hero-ey">Toronto, Canada · Est. 2018</div>
        <h1 className="about-hero-statement">
          Your architect spent months on that wall.
          <em> We spent years making sure nothing ruins it.</em>
        </h1>
        <div className="about-hero-sub">
          Six patents. 34 products. Seven global regions — built on a single conviction.
        </div>
        <a href="/products" className="btn-prim" style={{marginTop:'8px',display:'inline-block'}}>
          Explore Products →
        </a>
      </div>
      <div className="hero-v2-cards">
        <div className="hv-card hv-before">
          <div className="hv-card-label hv-before-label">
            <span className="hv-label-dot hv-dot-bad"/>Before
          </div>
          <div className="hv-img-slot hv-before-img">
            <div className="hv-img-placeholder">
              <div className="hv-img-label">Standard Install</div>
              <div className="hv-img-sub">Image from Sanity</div>
            </div>
          </div>
          <div className="hv-card-caption">
            <div className="hv-caption-main">Standard speaker</div>
            <div className="hv-caption-sub">Bulky · Visually dominant · Disrupts the room</div>
          </div>
        </div>
        <div className="hv-card hv-after">
          <div className="hv-card-label hv-after-label">
            <span className="hv-label-dot hv-dot-good"/>After
          </div>
          <div className="hv-img-slot hv-after-img">
            <div className="hv-img-placeholder">
              <div className="hv-img-label">XSCACE Install</div>
              <div className="hv-img-sub">Image from Sanity</div>
            </div>
          </div>
          <div className="hv-card-caption">
            <div className="hv-caption-main">XSCACE installed</div>
            <div className="hv-caption-sub">23mm · Invisible · Room intact</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TECH ICONS ─────────────────────────────────────────────────────────────
const TechIconNano = () => (
  <svg className="chapter-tech-icon" viewBox="0 0 80 95" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M36 16 L36 42 C36 56 28 66 12 74" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M38 12 L38 44 C38 56 34 64 24 70" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M40 10 L40 60 C40 66 40 70 40 74" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M42 12 L42 44 C42 56 46 64 56 70" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M44 16 L44 42 C44 56 52 66 68 74" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <circle cx="40" cy="82" r="3.5" fill="#c9a96e" opacity="0.9"/>
  <circle cx="40" cy="82" r="6.5" fill="none" stroke="#c9a96e" strokeWidth="0.6" opacity="0.3"/>
</svg>
)
const TechIconCoil = () => (
  <svg className="chapter-tech-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="40.0" y1="24.0" x2="40.0" y2="8.0" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="43.1" y1="24.3" x2="45.5" y2="12.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="46.1" y1="25.2" x2="52.2" y2="10.4" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="48.9" y1="26.7" x2="55.6" y2="16.7" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="51.3" y1="28.7" x2="62.6" y2="17.4" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="53.3" y1="31.1" x2="63.3" y2="24.4" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="54.8" y1="33.9" x2="69.6" y2="27.8" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="55.7" y1="36.9" x2="67.5" y2="34.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="56.0" y1="40.0" x2="72.0" y2="40.0" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="55.7" y1="43.1" x2="67.5" y2="45.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="54.8" y1="46.1" x2="69.6" y2="52.2" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="53.3" y1="48.9" x2="63.3" y2="55.6" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="51.3" y1="51.3" x2="62.6" y2="62.6" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="48.9" y1="53.3" x2="55.6" y2="63.3" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="46.1" y1="54.8" x2="52.2" y2="69.6" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="43.1" y1="55.7" x2="45.5" y2="67.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="40.0" y1="56.0" x2="40.0" y2="72.0" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="36.9" y1="55.7" x2="34.5" y2="67.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="33.9" y1="54.8" x2="27.8" y2="69.6" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="31.1" y1="53.3" x2="24.4" y2="63.3" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="28.7" y1="51.3" x2="17.4" y2="62.6" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="26.7" y1="48.9" x2="16.7" y2="55.6" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="25.2" y1="46.1" x2="10.4" y2="52.2" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="24.3" y1="43.1" x2="12.5" y2="45.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="24.0" y1="40.0" x2="8.0" y2="40.0" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="24.3" y1="36.9" x2="12.5" y2="34.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="25.2" y1="33.9" x2="10.4" y2="27.8" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="26.7" y1="31.1" x2="16.7" y2="24.4" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="28.7" y1="28.7" x2="17.4" y2="17.4" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="31.1" y1="26.7" x2="24.4" y2="16.7" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="33.9" y1="25.2" x2="27.8" y2="10.4" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
  <line x1="36.9" y1="24.3" x2="34.5" y2="12.5" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
  <line x1="40" y1="40" x2="40" y2="24" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
  <line x1="40" y1="40" x2="40" y2="56" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
  <line x1="40" y1="40" x2="24" y2="40" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
  <line x1="40" y1="40" x2="56" y2="40" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
</svg>
)
const TechIconHeatsink = () => (
  <svg className="chapter-tech-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 40 L62 14 L46 44 Z" stroke="#c9a96e" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(201,169,110,0.05)"/>
  <path d="M46 44 L62 14 L52 50 Z" stroke="#c9a96e" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(201,169,110,0.08)"/>
  <line x1="62" y1="14" x2="46" y2="44" stroke="#c9a96e" strokeWidth="0.8" opacity="0.5"/>
  <line x1="10" y1="52" x2="28" y2="42" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" opacity="0.75"/>
  <line x1="12" y1="60" x2="32" y2="48" stroke="#c9a96e" strokeWidth="1.1" strokeLinecap="round" opacity="0.6"/>
  <line x1="18" y1="66" x2="36" y2="54" stroke="#c9a96e" strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
  <line x1="8"  y1="44" x2="22" y2="37" stroke="#c9a96e" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
  <line x1="24" y1="70" x2="40" y2="60" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.35"/>
</svg>
)
const TechIconXover = () => (
  <svg className="chapter-tech-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="46" x2="20" y2="30" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="26" y1="52" x2="26" y2="24" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="32" y1="58" x2="32" y2="18" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="37" y1="62" x2="37" y2="14" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="43" y1="62" x2="43" y2="14" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="48" y1="58" x2="48" y2="18" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="54" y1="52" x2="54" y2="24" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="60" y1="46" x2="60" y2="30" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
</svg>
)
const TechIconXSFlow = () => (
  <svg className="chapter-tech-icon" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M44 18 L24 18 Q16 18 16 26 L16 44 Q16 52 24 52 L44 52"
    stroke="#c9a96e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  <path d="M42 26 L28 26 Q24 26 24 30 L24 40 Q24 44 28 44 L42 44"
    stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55"/>
  <line x1="44" y1="18" x2="54" y2="18" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round"/>
  <line x1="54" y1="18" x2="60" y2="12" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round"/>
  <circle cx="62" cy="10" r="2.2" fill="#c9a96e" opacity="0.9"/>
  <line x1="54" y1="18" x2="64" y2="18" stroke="#c9a96e" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
  <circle cx="67" cy="18" r="1.8" fill="#c9a96e" opacity="0.7"/>
  <line x1="44" y1="52" x2="54" y2="52" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round"/>
  <line x1="54" y1="52" x2="60" y2="58" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round"/>
  <circle cx="62" cy="60" r="2.2" fill="#c9a96e" opacity="0.9"/>
  <line x1="44" y1="35" x2="58" y2="35" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round" opacity="0.8"/>
  <circle cx="61" cy="35" r="1.8" fill="#c9a96e" opacity="0.75"/>
</svg>
)
const TechIconPsySculpt = () => (
  <svg className="chapter-tech-icon" viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 16
    C24 16 17 21 17 29
    C13 30 13 37 17 39
    C16 45 21 50 28 50
    C30 55 38 56 42 53
    C50 57 60 52 60 43
    C64 41 64 33 60 31
    C61 23 54 16 46 17
    C43 14 36 14 32 16 Z"
    stroke="#c9a96e" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
  <line x1="6"  y1="28" x2="20" y2="28" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
  <line x1="4"  y1="36" x2="18" y2="36" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
  <line x1="6"  y1="44" x2="20" y2="44" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
  <circle cx="6" cy="28" r="1.4" fill="#c9a96e" opacity="0.7"/>
  <circle cx="4" cy="36" r="1.4" fill="#c9a96e" opacity="0.7"/>
  <circle cx="6" cy="44" r="1.4" fill="#c9a96e" opacity="0.7"/>
  <line x1="34" y1="26" x2="34" y2="46" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.85"/>
  <line x1="40" y1="22" x2="40" y2="50" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.95"/>
  <line x1="46" y1="28" x2="46" y2="44" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.8"/>
</svg>
)
const CHAPTER_ICONS: Record<string,React.ReactNode> = {
  nano:<TechIconNano/>, powerdense:<TechIconCoil/>, aeroframe:<TechIconHeatsink/>,
  xover:<TechIconXover/>, xsflow:<TechIconXSFlow/>, psysculpt:<TechIconPsySculpt/>,
}

// ── INTERACTIVE VECTORS ────────────────────────────────────────────────────
function VecDuality({ size }: { size: number }) {
  const [pos, setPos] = useState(0.5)
  const dragging = useRef(false)
  const W = size, H = Math.round(size * 0.52)
  const splitX = W * pos
  const hiddenOp = Math.max(0.05, 1 - pos * 1.4)
  const visibleOp = Math.min(1, pos * 1.4)
  const spkH = H*0.78, spkW = W*0.055, spkY = (H-spkH)/2

  const onMouseDown = () => { dragging.current = true }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos(Math.max(0.05, Math.min(0.95, (e.clientX-r.left)/r.width)))
  }
  const onMouseUp = () => { dragging.current = false }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos(Math.max(0.05, Math.min(0.95, (e.touches[0].clientX-r.left)/r.width)))
  }

  return (
    <div className="vec-wrap" style={{cursor:'ew-resize'}}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onTouchStart={onMouseDown} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        <rect x="0" y="0" width={+splitX.toFixed(1)} height={H} fill="#0d0d0d"/>
        {[0.15,0.3,0.45,0.6,0.75,0.9].map((f,i)=>(
          <line key={i} x1="0" y1={+(H*f).toFixed(1)} x2={+splitX.toFixed(1)} y2={+(H*f).toFixed(1)} stroke="#c9a96e" strokeWidth="0.3" opacity="0.05"/>
        ))}
        <g clipPath="url(#left-clip)" opacity={hiddenOp}>
          <rect x={+(splitX/2-spkW/2).toFixed(1)} y={+spkY.toFixed(1)} width={+spkW.toFixed(1)} height={+spkH.toFixed(1)} rx="2" fill="none" stroke="#c9a96e" strokeWidth="0.6" strokeDasharray="3 4"/>
          <circle cx={+( splitX/2).toFixed(1)} cy={+(H/2).toFixed(1)} r={+(spkW*0.3).toFixed(1)} fill="none" stroke="#c9a96e" strokeWidth="0.5" strokeDasharray="2 3"/>
        </g>
        {[1,2,3,4].map(i=>{
          const wr=i*spkW*0.9
          const alpha=+(Math.max(0,0.35-i*0.07)*hiddenOp).toFixed(3)
          return <path key={i} d={`M ${+(splitX/2-wr).toFixed(1)} ${+(H/2-wr*1.4).toFixed(1)} A ${+wr.toFixed(1)} ${+(wr*1.4).toFixed(1)} 0 0 0 ${+(splitX/2-wr).toFixed(1)} ${+(H/2+wr*1.4).toFixed(1)}`} fill="none" stroke="#c9a96e" strokeWidth="0.7" opacity={alpha} clipPath="url(#left-clip)"/>
        })}
        <text x={+(splitX*0.5).toFixed(1)} y={+(H-10).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="9" fontFamily="DM Mono,monospace" letterSpacing="2" opacity={+(hiddenOp*0.8).toFixed(2)}>HIDDEN</text>
        <line x1={+splitX.toFixed(1)} y1="4" x2={+splitX.toFixed(1)} y2={+(H-4).toFixed(1)} stroke="#c9a96e" strokeWidth="1" opacity="0.5"/>
        <rect x={+(splitX-14).toFixed(1)} y={+(H/2-10).toFixed(1)} width="28" height="20" rx="3" fill="#0a0a0a" stroke="#c9a96e" strokeWidth="0.8" opacity="0.95"/>
        <text x={+splitX.toFixed(1)} y={+(H/2+5).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="9" fontFamily="DM Mono,monospace" opacity="0.7">↔</text>
        <rect x={+splitX.toFixed(1)} y="0" width={+(W-splitX).toFixed(1)} height={H} fill="#070707"/>
        <g clipPath="url(#right-clip)" opacity={visibleOp}>
          <rect x={+(W*0.5+(W*0.5-splitX)*0.1-spkW/2).toFixed(1)} y={+spkY.toFixed(1)} width={+spkW.toFixed(1)} height={+spkH.toFixed(1)} rx="2.5" fill="rgba(201,169,110,0.06)" stroke="#c9a96e" strokeWidth="1.2"/>
          <circle cx={+(W*0.5+(W*0.5-splitX)*0.1).toFixed(1)} cy={+(H/2).toFixed(1)} r={+(spkW*0.3).toFixed(1)} fill="none" stroke="#c9a96e" strokeWidth="0.8"/>
          <circle cx={+(W*0.5+(W*0.5-splitX)*0.1).toFixed(1)} cy={+(H/2).toFixed(1)} r={+(spkW*0.1).toFixed(1)} fill="#c9a96e" opacity="0.4"/>
        </g>
        <text x={+(splitX+(W-splitX)*0.5).toFixed(1)} y={+(H-10).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="9" fontFamily="DM Mono,monospace" letterSpacing="2" opacity={+(visibleOp*0.8).toFixed(2)}>TANGIBLE</text>
      </svg>
      <div style={{textAlign:'center',fontSize:'9px',letterSpacing:'.12em',color:'rgba(201,169,110,0.35)',fontFamily:'DM Mono,monospace',marginTop:'8px',textTransform:'uppercase'}}>← drag to reveal the speaker →</div>
    </div>
  )
}

function VecHoffman({ size }: { size: number }) {
  const [chosen, setChosen] = useState<number[]>([])
  const W = size, H = Math.round(size * 0.58)
  const options = [
    { label:'EXTENDED FREQ', sub:'Low Frequency Response',
      icon:(x:number,cy:number,active:boolean)=>(
        <g>
          <path d={`M ${x-20} ${cy} Q ${x-10} ${cy-13} ${x} ${cy} Q ${x+10} ${cy+13} ${x+20} ${cy}`} fill="none" stroke="#c9a96e" strokeWidth={active?2:0.9} opacity={active?0.95:0.45}/>
          <path d={`M ${x-20} ${cy+7} Q ${x-10} ${cy-6} ${x} ${cy+7} Q ${x+10} ${cy+20} ${x+20} ${cy+7}`} fill="none" stroke="#c9a96e" strokeWidth={active?0.9:0.4} opacity={active?0.5:0.2}/>
        </g>
      )},
    { label:'COMPACT', sub:'Small Enclosure',
      icon:(x:number,cy:number,active:boolean)=>(
        <g>
          <rect x={x-6} y={cy-17} width="12" height="34" rx="2" fill={active?'rgba(201,169,110,0.12)':'none'} stroke="#c9a96e" strokeWidth={active?1.6:0.8} opacity={active?0.95:0.45}/>
          <circle cx={x} cy={cy} r="3.5" fill="none" stroke="#c9a96e" strokeWidth={active?1:0.5} opacity={active?0.8:0.35}/>
          <circle cx={x} cy={cy} r="1.2" fill="#c9a96e" opacity={active?0.8:0.3}/>
        </g>
      )},
    { label:'EFFICIENT', sub:'High Sensitivity',
      icon:(x:number,cy:number,active:boolean)=>(
        <g>
          <polygon points={`${x+5},${cy-17} ${x-6},${cy+2} ${x+2},${cy+2} ${x-5},${cy+17} ${x+9},${cy-3} ${x+1},${cy-3}`}
            fill={active?'rgba(201,169,110,0.15)':'none'} stroke="#c9a96e" strokeWidth={active?1.6:0.8} strokeLinejoin="round" opacity={active?0.95:0.45}/>
        </g>
      )},
  ]
  const results: Record<string,{sacrifice:string;xscace:boolean}> = {
    '0,1':{sacrifice:'LOW EFFICIENCY',xscace:true},
    '0,2':{sacrifice:'LARGE ENCLOSURE',xscace:false},
    '1,2':{sacrifice:'WEAK BASS EXTENSION',xscace:false},
  }
  const toggle=(i:number)=>setChosen(prev=>prev.includes(i)?prev.filter(x=>x!==i):prev.length>=2?[prev[prev.length-1],i]:[...prev,i])
  const key=chosen.slice().sort().join(',')
  const result=chosen.length===2?results[key]:null
  const sacrificed=chosen.length===2?options.find((_,i)=>!chosen.includes(i)):null

  return (
    <div className="vec-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        <text x={+(W/2).toFixed(1)} y="16" textAnchor="middle" fill="#c9a96e" fontSize="9" fontFamily="DM Mono,monospace" opacity="0.4" letterSpacing="1">CHOOSE TWO TO KEEP</text>
        {options.map((opt,i)=>{
          const x=W*(0.18+i*0.32), isChosen=chosen.includes(i), isSac=chosen.length===2&&!isChosen
          const boxY=H*0.1, boxH=H*0.56, boxW=W*0.26
          return (
            <g key={i} style={{cursor:'pointer'}} onClick={()=>toggle(i)}>
              <rect x={+(x-boxW/2).toFixed(1)} y={+boxY.toFixed(1)} width={+boxW.toFixed(1)} height={+boxH.toFixed(1)} rx="3"
                fill={isChosen?'rgba(201,169,110,0.1)':'rgba(201,169,110,0.02)'}
                stroke="#c9a96e" strokeWidth={isChosen?1.4:isSac?0.3:0.5}
                strokeDasharray={isSac?'4 3':'none'} opacity={isSac?0.25:1}/>
              <g opacity={isSac?0.2:1}>{opt.icon(+(x).toFixed(0) as any, +(boxY+boxH*0.38).toFixed(0) as any, isChosen)}</g>
              <text x={+x.toFixed(1)} y={+(boxY+boxH*0.72).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" letterSpacing="0.5" opacity={isSac?0.2:isChosen?0.95:0.6}>{opt.label}</text>
              <text x={+x.toFixed(1)} y={+(boxY+boxH*0.86).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="7" fontFamily="DM Mono,monospace" opacity={isSac?0.1:0.3}>{opt.sub}</text>
              {isSac&&<text x={+x.toFixed(1)} y={+(boxY+boxH+14).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.7">✗ SACRIFICED</text>}
              {isChosen&&<text x={+x.toFixed(1)} y={+(boxY+boxH+14).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.55">✓ KEPT</text>}
            </g>
          )
        })}
        {result&&(
          <g>
            <rect x={+(W*0.08).toFixed(1)} y={+(H*0.78).toFixed(1)} width={+(W*0.84).toFixed(1)} height={+(H*0.19).toFixed(1)} rx="2"
              fill={result.xscace?'rgba(201,169,110,0.08)':'rgba(60,60,60,0.05)'} stroke="#c9a96e" strokeWidth={result.xscace?0.8:0.3} opacity="0.8"/>
            <text x={+(W/2).toFixed(1)} y={+(H*0.86).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.4">SACRIFICE: {sacrificed?.label}</text>
            <text x={+(W/2).toFixed(1)} y={+(H*0.94).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="9" fontFamily="DM Mono,monospace" letterSpacing="1" opacity={result.xscace?0.95:0.7}>{result.xscace?'← XSCACE CHOSE THIS · LOW EFFICIENCY':result.sacrifice}</text>
          </g>
        )}
        {chosen.length<2&&<text x={+(W/2).toFixed(1)} y={+(H*0.88).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.2">{chosen.length===0?'↑ click two boxes to keep':'↑ pick one more'}</text>}
      </svg>
    </div>
  )
}

function VecCoil({ size }: { size: number }) {
  const [power, setPower] = useState(0.3)
  const dragging = useRef(false)
  const W = size, H = Math.round(size * 0.6)
  const heat = Math.pow(power, 1.4)
  const cx = W*0.42, r = H*0.28
  const coilColor = heat>0.7?`rgba(255,${Math.round(120-heat*60)},30,`:'rgba(201,169,110,'
  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current) return
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - el.top
    setPower(Math.max(0, Math.min(1, 1 - y / el.height)))
  }, [])
  return (
    <div className="vec-wrap" style={{cursor:'ns-resize'}}
      onMouseDown={()=>{dragging.current=true}} onMouseMove={onMove}
      onMouseUp={()=>{dragging.current=false}} onMouseLeave={()=>{dragging.current=false}}
      onTouchStart={()=>{dragging.current=true}} onTouchMove={onMove} onTouchEnd={()=>{dragging.current=false}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        <ellipse cx={+cx.toFixed(1)} cy={+(H/2-r*1.2).toFixed(1)} rx={+(r*0.72).toFixed(1)} ry={+(r*0.22).toFixed(1)} fill="#0a0a0a" stroke="#c9a96e" strokeWidth="0.6" opacity="0.5"/>
        {[...Array(14)].map((_,i)=>{
          const y=H/2-r+(i/13)*r*2; const front=i%2===0
          return <ellipse key={i} cx={+cx.toFixed(1)} cy={+y.toFixed(1)} rx={+(r*0.72).toFixed(1)} ry={+(r*0.14).toFixed(1)} fill="none" stroke={front?`${coilColor}${0.2+heat*0.7})`:`${coilColor}${0.1+heat*0.2})`} strokeWidth={front?1.2:0.5} strokeDasharray={front?'none':'30 15'}/>
        })}
        <ellipse cx={+cx.toFixed(1)} cy={+(H/2+r*1.2).toFixed(1)} rx={+(r*0.72).toFixed(1)} ry={+(r*0.22).toFixed(1)} fill="#0a0a0a" stroke="#c9a96e" strokeWidth="0.6" opacity="0.4"/>
        <line x1={+(cx+r*0.72).toFixed(1)} y1={+(H/2).toFixed(1)} x2={+(W*0.75).toFixed(1)} y2={+(H*0.35).toFixed(1)} stroke="#c9a96e" strokeWidth="0.5" opacity="0.35"/>
        <text x={+(W*0.76).toFixed(1)} y={+(H*0.32).toFixed(1)} fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.7">Cu + Ag</text>
        {[0,1,2,3].map(i=>{
          const hx=W*0.7+i*W*0.06; const op=Math.max(0,heat-i*0.18)
          return <g key={i} opacity={op}>
            <path d={`M ${+hx.toFixed(1)} ${+(H*0.82).toFixed(1)} Q ${+(hx+5).toFixed(1)} ${+(H*0.52).toFixed(1)} ${+hx.toFixed(1)} ${+(H*0.2).toFixed(1)}`} fill="none" stroke={heat>0.6?'rgba(255,100,30,0.7)':'rgba(201,169,110,0.7)'} strokeWidth="0.7"/>
            <polygon points={`${+hx.toFixed(1)},${+(H*0.17).toFixed(1)} ${+(hx-3).toFixed(1)},${+(H*0.24).toFixed(1)} ${+(hx+3).toFixed(1)},${+(H*0.24).toFixed(1)}`} fill={heat>0.6?'rgba(255,100,30,0.8)':'rgba(201,169,110,0.8)'}/>
          </g>
        })}
        <rect x={+(W*0.88).toFixed(1)} y={+(H*0.1).toFixed(1)} width="10" height={+(H*0.8).toFixed(1)} rx="2" fill="none" stroke="#c9a96e" strokeWidth="0.5" opacity="0.25"/>
        <rect x={+(W*0.88).toFixed(1)} y={+(H*0.1+H*0.8*(1-power)).toFixed(1)} width="10" height={+(H*0.8*power).toFixed(1)} rx="1" fill={heat>0.7?'rgba(255,80,20,0.5)':'rgba(201,169,110,0.4)'}/>
        <text x={+(cx).toFixed(1)} y={+(H-6).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.6">{heat>0.7?'THERMAL OVERLOAD — Ag+Cu RESISTS':heat>0.3?'POWERDENSE DYNAMICS™':'DRAG ↕ TO INCREASE POWER'}</text>
      </svg>
    </div>
  )
}

function VecHeatsink({ size }: { size: number }) {
  const tRef = useRef(0); const rafRef = useRef(0); const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio||1,2)
    const W=size, H=Math.round(size*0.6)
    canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.scale(dpr,dpr)
    function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath()}
    function draw(){
      ctx.clearRect(0,0,W,H); tRef.current+=0.007
      const t=tRef.current, cycle=(t%(Math.PI*2)), heat=Math.sin(cycle-Math.PI/2)*0.5+0.5
      const sw=W*0.09,sh=H*0.78,sx=W*0.5-sw/2,sy=H*0.5-sh/2
      const rv=Math.round(heat<0.5?201+(255-201)*(heat*2):255)
      const gv=Math.round(heat<0.5?169-(169-80)*(heat*2):80-80*(heat-0.5)*2)
      const bv=Math.round(heat<0.5?110-110*(heat*2):0)
      const col=`rgb(${rv},${gv},${bv})`
      const grd=ctx.createRadialGradient(W*0.5,H*0.5,4,W*0.5,H*0.5,W*0.35)
      grd.addColorStop(0,`rgba(${rv},${gv},${bv},${0.08+heat*0.15})`); grd.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=grd; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle=col; ctx.lineWidth=heat>0.5?1.6:1.0; ctx.globalAlpha=0.75+heat*0.2
      rr(ctx,sx,sy,sw,sh,3); ctx.fillStyle=`rgba(${rv},${gv},${bv},${0.04+heat*0.08})`; ctx.fill(); ctx.stroke()
      ctx.globalAlpha=1
      ctx.beginPath(); ctx.arc(sx+sw/2,H*0.5,sw*0.28,0,Math.PI*2); ctx.strokeStyle=col; ctx.lineWidth=0.8; ctx.globalAlpha=0.5; ctx.stroke(); ctx.globalAlpha=1
      if(heat>0.15){for(let i=0;i<Math.round(heat*16);i++){const side=i%4,prog=((t*1.8+i*0.47)%1),dist=prog*W*0.22*heat;let px=0,py=0;if(side===0){px=sx-dist;py=sy+Math.random()*sh}else if(side===1){px=sx+sw+dist;py=sy+Math.random()*sh}else if(side===2){px=sx+Math.random()*sw;py=sy-dist*0.5}else{px=sx+Math.random()*sw;py=sy+sh+dist*0.3};ctx.beginPath();ctx.arc(+px.toFixed(1),+py.toFixed(1),1.5,0,Math.PI*2);ctx.fillStyle=col;ctx.globalAlpha=(1-prog)*heat*0.6;ctx.fill();ctx.globalAlpha=1}}
      ctx.font='8px DM Mono, monospace'; ctx.textAlign='center'; ctx.fillStyle=col; ctx.globalAlpha=0.6
      ctx.fillText(heat>0.65?'ABSORBING HEAT':heat>0.25?'DISSIPATING THROUGH CHASSIS':'6061 AEROSPACE ALUMINIUM',W*0.5,H*0.94)
      ctx.globalAlpha=1; ctx.textAlign='left'
      rafRef.current=requestAnimationFrame(draw)
    }
    draw()
    return ()=>cancelAnimationFrame(rafRef.current)
  },[size])
  return <div className="vec-wrap"><canvas ref={canvasRef} style={{display:'block',width:'100%'}} aria-hidden/></div>
}

function VecXover({ size }: { size: number }) {
  const [selected, setSelected] = useState<string|null>(null)
  const W=size, H=Math.round(size*0.65), hy=H*0.28, ly=H*0.72, jx=W*0.22
  const info: Record<string,string> = {
    inductor:'AIR-CORE INDUCTOR — blocks highs, passes lows. Air core eliminates magnetic distortion.',
    cap:'POLYPROPYLENE CAP — blocks lows, passes highs. Film dielectric, zero microphonics.',
    resistor:'METAL-FILM RESISTOR — precision attenuation. ±0.5dB, 300% current headroom.',
    junction:'SIGNAL JUNCTION — full-range signal splits to HP and LP paths simultaneously.',
  }
  const C='#c9a96e'
  return (
    <div className="vec-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        <text x="6" y={+(H*0.51).toFixed(1)} fill={C} fontSize="8" fontFamily="DM Mono,monospace" opacity="0.5">IN</text>
        <line x1="22" y1={+(H*0.5).toFixed(1)} x2={+jx.toFixed(1)} y2={+(H*0.5).toFixed(1)} stroke={C} strokeWidth="1.2" opacity="0.7"/>
        <circle cx={+jx.toFixed(1)} cy={+(H*0.5+2).toFixed(1)} r="6" fill="#000" opacity="0.4"/>
        <circle cx={+jx.toFixed(1)} cy={+(H*0.5).toFixed(1)} r="6" fill={selected==='junction'?'rgba(201,169,110,0.15)':'rgba(9,9,9,0.95)'} stroke={C} strokeWidth="1.3" style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='junction'?null:'junction')}/>
        <circle cx={+jx.toFixed(1)} cy={+(H*0.5).toFixed(1)} r="2.5" fill={C} opacity="0.9"/>
        <line x1={+jx.toFixed(1)} y1={+(H*0.5).toFixed(1)} x2={+(jx+14).toFixed(1)} y2={+hy.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <line x1={+(jx+14).toFixed(1)} y1={+hy.toFixed(1)} x2={+(W*0.33).toFixed(1)} y2={+hy.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <g style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='inductor'?null:'inductor')}>
          {[0,1,2,3,4].map(i=><path key={i} d={`M ${+(W*0.33+i*18).toFixed(1)} ${+hy.toFixed(1)} a 9 6 0 0 1 18 0`} fill="rgba(201,169,110,0.05)" stroke={C} strokeWidth={selected==='inductor'?1.4:0.9} opacity={selected==='inductor'?0.9:0.65}/>)}
        </g>
        <line x1={+(W*0.33+90).toFixed(1)} y1={+hy.toFixed(1)} x2={+(W-18).toFixed(1)} y2={+hy.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <circle cx={+(W-18).toFixed(1)} cy={+hy.toFixed(1)} r="4" fill={C} opacity="0.9"/>
        <text x={+(W-10).toFixed(1)} y={+(hy+4).toFixed(1)} fill={C} fontSize="9" fontFamily="DM Mono,monospace" opacity="0.9">HP</text>
        <line x1={+jx.toFixed(1)} y1={+(H*0.5).toFixed(1)} x2={+(jx+14).toFixed(1)} y2={+ly.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <line x1={+(jx+14).toFixed(1)} y1={+ly.toFixed(1)} x2={+(W*0.34).toFixed(1)} y2={+ly.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <g style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='cap'?null:'cap')}>
          <line x1={+(W*0.34).toFixed(1)} y1={+(ly-12).toFixed(1)} x2={+(W*0.34).toFixed(1)} y2={+(ly+12).toFixed(1)} stroke={C} strokeWidth={selected==='cap'?2.5:1.8} opacity={selected==='cap'?0.9:0.7}/>
          <line x1={+(W*0.34+8).toFixed(1)} y1={+(ly-12).toFixed(1)} x2={+(W*0.34+8).toFixed(1)} y2={+(ly+12).toFixed(1)} stroke={C} strokeWidth={selected==='cap'?2.5:1.8} opacity={selected==='cap'?0.9:0.7}/>
        </g>
        <line x1={+(W*0.34+8).toFixed(1)} y1={+ly.toFixed(1)} x2={+(W*0.53).toFixed(1)} y2={+ly.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <g style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='resistor'?null:'resistor')}>
          <rect x={+(W*0.53).toFixed(1)} y={+(ly-9).toFixed(1)} width="34" height="18" rx="2" fill={selected==='resistor'?'rgba(201,169,110,0.1)':'rgba(201,169,110,0.03)'} stroke={C} strokeWidth={selected==='resistor'?1.3:0.7} opacity={selected==='resistor'?0.9:0.6}/>
          {[4,10,16,22,28].map((bx,i)=><rect key={i} x={+(W*0.53+bx).toFixed(1)} y={+(ly-9).toFixed(1)} width="3" height="18" fill={C} opacity={[0.5,0.15,0.5,0.3,0.5][i]}/>)}
        </g>
        <line x1={+(W*0.53+34).toFixed(1)} y1={+ly.toFixed(1)} x2={+(W-18).toFixed(1)} y2={+ly.toFixed(1)} stroke={C} strokeWidth="0.8" opacity="0.6"/>
        <circle cx={+(W-18).toFixed(1)} cy={+ly.toFixed(1)} r="4" fill={C} opacity="0.9"/>
        <text x={+(W-10).toFixed(1)} y={+(ly+4).toFixed(1)} fill={C} fontSize="9" fontFamily="DM Mono,monospace" opacity="0.9">LP</text>
        <text x={+(W/2).toFixed(1)} y={+(H*0.96).toFixed(1)} textAnchor="middle" fill={C} fontSize="8" fontFamily="DM Mono,monospace" opacity={selected&&info[selected]?0.7:0.2}>{selected&&info[selected]?info[selected].split(' — ')[0]:'CLICK COMPONENTS TO IDENTIFY'}</text>
      </svg>
    </div>
  )
}

function VecXSFlow({ size }: { size: number }) {
  const tRef=useRef(0); const rafRef=useRef(0); const canvasRef=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!
    const dpr=Math.min(window.devicePixelRatio||1,2)
    const W=size, H=Math.round(size*0.6)
    canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.scale(dpr,dpr)
    function draw(){
      ctx.clearRect(0,0,W,H); tRef.current+=0.022; const t=tRef.current
      const ew=W*0.08,eh=H*0.76,ex=W*0.12,ey=(H-eh)/2
      ctx.strokeStyle='rgba(201,169,110,0.55)'; ctx.lineWidth=1; ctx.fillStyle='rgba(201,169,110,0.03)'
      ctx.strokeRect(ex,ey,ew,eh); ctx.fillRect(ex,ey,ew,eh)
      ctx.font='7px DM Mono, monospace'; ctx.fillStyle='rgba(201,169,110,0.4)'; ctx.textAlign='center'
      ctx.fillText('12mm',ex+ew/2,ey-6); ctx.textAlign='left'
      ctx.beginPath(); ctx.arc(ex+ew/2,ey+eh*0.15,ew*0.22,0,Math.PI*2); ctx.strokeStyle='rgba(201,169,110,0.55)'; ctx.lineWidth=0.8; ctx.stroke()
      ctx.beginPath(); ctx.arc(ex+ew/2,ey+eh*0.15,ew*0.09,0,Math.PI*2); ctx.fillStyle='rgba(201,169,110,0.25)'; ctx.fill()
      const tlX=ex+ew*0.2,tlW=ew*0.6,folds=4,segH=eh*0.65/folds,tlStartY=ey+eh*0.3
      ctx.strokeStyle='rgba(201,169,110,0.22)'; ctx.lineWidth=0.5; ctx.setLineDash([2,2])
      for(let s=0;s<folds;s++){const y1=tlStartY+s*segH,y2=tlStartY+(s+1)*segH,fr=s%2===1;ctx.beginPath();ctx.moveTo(fr?tlX+tlW:tlX,y1);ctx.lineTo(fr?tlX+tlW:tlX,y2);ctx.stroke();if(s<folds-1){ctx.beginPath();ctx.moveTo(tlX,y2);ctx.lineTo(tlX+tlW,y2);ctx.stroke()}}
      ctx.setLineDash([])
      for(let p=0;p<4;p++){const prog=((t*0.5+p/4)%1),totalLen=folds*segH+(folds-1)*tlW,pos=prog*totalLen;let px=tlX,py=tlStartY,cum=0;for(let s=0;s<folds;s++){if(pos<cum+segH){const f=(pos-cum)/segH;px=s%2===1?tlX+tlW:tlX;py=tlStartY+s*segH+f*segH;break}cum+=segH;if(s<folds-1&&pos<cum+tlW){const f=(pos-cum)/tlW;py=tlStartY+(s+1)*segH;px=s%2===0?tlX+f*tlW:tlX+tlW-f*tlW;break}cum+=tlW};const alpha=Math.sin(prog*Math.PI)*0.7;ctx.beginPath();ctx.arc(+px.toFixed(1),+py.toFixed(1),2,0,Math.PI*2);ctx.fillStyle=`rgba(201,169,110,${alpha})`;ctx.fill()}
      const portW=ew*0.55,portH=4,portX=ex+(ew-portW)/2,portY=ey+eh-1
      ctx.fillStyle='#000'; ctx.fillRect(+portX.toFixed(1),portY,+portW.toFixed(1),portH)
      ctx.strokeStyle='rgba(201,169,110,0.8)'; ctx.lineWidth=0.8; ctx.strokeRect(+portX.toFixed(1),portY,+portW.toFixed(1),portH)
      const portCX=ex+ew/2,portCY=portY+portH+2,maxWaveR=W-ex-ew-8
      for(let w=0;w<5;w++){const prog=((t*0.7+w/5)%1),wr=prog*maxWaveR,wa=(1-prog)*0.55,da=(45+prog*15)*Math.PI/180;ctx.beginPath();ctx.arc(+portCX.toFixed(1),+portCY.toFixed(1),+wr.toFixed(1),Math.PI*0.5-da,Math.PI*0.5+da);ctx.strokeStyle=`rgba(201,169,110,${wa})`;ctx.lineWidth=0.8;ctx.stroke()}
      ctx.textAlign='center'; ctx.fillStyle='rgba(201,169,110,0.45)'; ctx.font='8px DM Mono, monospace'
      ctx.fillText('XS-FLOW™ · EXTENDED RESPONSE',W/2,H-4); ctx.textAlign='left'
      rafRef.current=requestAnimationFrame(draw)
    }
    draw(); return ()=>cancelAnimationFrame(rafRef.current)
  },[size])
  return <div className="vec-wrap"><canvas ref={canvasRef} style={{display:'block',width:'100%',margin:'0 auto'}} aria-hidden/></div>
}

function VecPsySculpt({ size }: { size: number }) {
  const [on, setOn] = useState(true)
  const [volume, setVolume] = useState(0.4)
  const dragging = useRef(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const W=size, H=Math.round(size*0.7)
  const pad={l:36,r:20,t:16,b:56}
  const iW=W-pad.l-pad.r, iH=H-pad.t-pad.b
  const base:Array<[number,number]>=[[20,74],[50,62],[100,54],[200,46],[500,34],[1000,28],[2000,28],[4000,26],[8000,30],[16000,42]]
  const logMin=Math.log10(20),logMax=Math.log10(20000)
  const xOf=(f:number)=>pad.l+((Math.log10(f)-logMin)/(logMax-logMin))*iW
  const yOf=(db:number)=>pad.t+(1-Math.max(0,db-18)/62)*iH
  const bf=on?(1-volume):0
  const comp=base.map(([f,db])=>[f,db-Math.abs(Math.log10(f/1000))/Math.log10(20000/1000)*bf*16] as [number,number])
  const toPath=(pts:Array<[number,number]>)=>'M '+pts.map(([f,db])=>`${xOf(f).toFixed(1)},${yOf(db).toFixed(1)}`).join(' L ')
  const onMove=useCallback((e:React.MouseEvent|React.TouchEvent)=>{
    if(!dragging.current||!sliderRef.current)return
    const el=sliderRef.current.getBoundingClientRect()
    const x=('touches' in e?e.touches[0].clientX:e.clientX)-el.left
    setVolume(Math.max(0.05,Math.min(1,x/el.width)))
  },[])
  const chain=['PRE·COMP','L·H\n60/7k','POST·COMP','PEAK\nDET','DYN\nBASS','DAC']
  return (
    <div className="vec-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        {[25,50,75].map(p=><line key={p} x1={pad.l} y1={pad.t+p/100*iH} x2={W-pad.r} y2={pad.t+p/100*iH} stroke="#c9a96e" strokeWidth="0.3" opacity="0.07"/>)}
        <line x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b} stroke="#c9a96e" strokeWidth="0.5" opacity="0.2"/>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H-pad.b} stroke="#c9a96e" strokeWidth="0.5" opacity="0.15"/>
        <path d={toPath(base)} fill="none" stroke="#c9a96e" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.25"/>
        <path d={toPath(comp)} fill="none" stroke="#c9a96e" strokeWidth={on?1.8:0.7} opacity={on?0.85:0.3}/>
        {on&&bf>0.05&&<path d={toPath(comp)+' L '+[...base].reverse().map(([f,db])=>`${xOf(f).toFixed(1)},${yOf(db).toFixed(1)}`).join(' L ')+' Z'} fill="#c9a96e" fillOpacity={bf*0.07}/>}
        {[[20,'20'],[100,'100'],[1000,'1k'],[10000,'10k'],[20000,'20k']].map(([f,lbl])=><text key={String(f)} x={+xOf(Number(f)).toFixed(1)} y={H-pad.b+10} textAnchor="middle" fill="#c9a96e" fontSize="7" fontFamily="DM Mono,monospace" opacity="0.25">{lbl}</text>)}
        <line x1={+(W-pad.r-50).toFixed(1)} y1={+(pad.t+6).toFixed(1)} x2={+(W-pad.r-36).toFixed(1)} y2={+(pad.t+6).toFixed(1)} stroke="#c9a96e" strokeWidth="1.8" opacity="0.85"/>
        <text x={+(W-pad.r-33).toFixed(1)} y={+(pad.t+9).toFixed(1)} fill="#c9a96e" fontSize="7" fontFamily="DM Mono,monospace" opacity="0.7">PSYSCULPT™</text>
        <line x1={+(W-pad.r-50).toFixed(1)} y1={+(pad.t+18).toFixed(1)} x2={+(W-pad.r-36).toFixed(1)} y2={+(pad.t+18).toFixed(1)} stroke="#c9a96e" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.4"/>
        <text x={+(W-pad.r-33).toFixed(1)} y={+(pad.t+21).toFixed(1)} fill="#c9a96e" fontSize="7" fontFamily="DM Mono,monospace" opacity="0.25">UNCOMPENSATED</text>
        {chain.map((lbl,i)=>{const bw=(iW-(chain.length-1)*4)/chain.length,bx=pad.l+i*(bw+4),by=H-pad.b+26,lines=lbl.split('\n');return<g key={i}>{i>0&&<line x1={+(bx-2).toFixed(1)} y1={+(by+9).toFixed(1)} x2={+bx.toFixed(1)} y2={+(by+9).toFixed(1)} stroke="#c9a96e" strokeWidth="0.5" opacity={on?0.5:0.15}/>}<rect x={+bx.toFixed(1)} y={+by.toFixed(1)} width={+bw.toFixed(1)} height="18" fill={on?'rgba(201,169,110,0.07)':'rgba(201,169,110,0.02)'} stroke="#c9a96e" strokeWidth={on?0.7:0.3} opacity={on?0.8:0.3}/>{lines.map((line,li)=><text key={li} x={+(bx+bw/2).toFixed(1)} y={+(by+7+li*8).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="5.5" fontFamily="DM Mono,monospace" opacity={on?0.7:0.25}>{line}</text>)}</g>})}
      </svg>
      <div className="ps-controls">
        <div className="ps-slider-outer" ref={sliderRef}
          onMouseDown={()=>{dragging.current=true}} onMouseMove={onMove}
          onMouseUp={()=>{dragging.current=false}} onMouseLeave={()=>{dragging.current=false}}
          onTouchStart={()=>{dragging.current=true}} onTouchMove={onMove} onTouchEnd={()=>{dragging.current=false}}>
          <div className="ps-slider-label">VOLUME</div>
          <div className="ps-slider-track">
            <div className="ps-slider-fill" style={{width:`${volume*100}%`}}/>
            <div className="ps-slider-thumb" style={{left:`${volume*100}%`}}/>
          </div>
          <div className="ps-slider-label">{Math.round(volume*100)}%</div>
        </div>
        <button className={`ps-toggle ${on?'on':'off'}`} onClick={()=>setOn(v=>!v)}>
          <span className="ps-toggle-label">PSYSCULPT™</span>
          <span className={`ps-toggle-pill ${on?'on':''}`}><span className="ps-toggle-knob"/></span>
          <span className="ps-toggle-state">{on?'ON':'OFF'}</span>
        </button>
      </div>
    </div>
  )
}

function VecUpcoming({ size }: { size: number }) {
  const [hovered, setHovered] = useState<number|null>(null)
  const W=size, H=Math.round(size*0.6)
  const items=[
    {label:'XYLEM',sub:'DSP AMPLIFIER',desc:'4ch · PsySculpt™ · General release',solid:true},
    {label:'PC + iOS',sub:'CONTROLLER',desc:'Full DSP · X-Sense AI · Every platform',solid:true},
    {label:'DESIGNER|SPEAKER',sub:'POWERED',desc:'All 6 chapters built in · One cable',solid:false},
  ]
  const bw=W*0.24,bh=H*0.55
  return (
    <div className="vec-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',cursor:'pointer'}}>
        <text x={+(W/2).toFixed(1)} y="14" textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" opacity="0.35" letterSpacing="3">COMING</text>
        <line x1="30" y1="18" x2={+(W/2-36).toFixed(1)} y2="18" stroke="#c9a96e" strokeWidth="0.4" opacity="0.15"/>
        <line x1={+(W/2+36).toFixed(1)} y1="18" x2={+(W-30).toFixed(1)} y2="18" stroke="#c9a96e" strokeWidth="0.4" opacity="0.15"/>
        {items.map((p,i)=>{
          const bx=W*0.05+i*(W*0.32),by=H*0.14,isH=hovered===i,op=p.solid?(isH?1:0.75):(isH?0.65:0.38)
          return <g key={i} opacity={op} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
            <rect x={+(bx+3).toFixed(1)} y={+(by+3).toFixed(1)} width={+bw.toFixed(1)} height={+bh.toFixed(1)} rx="2" fill="#000" opacity="0.5"/>
            <rect x={+bx.toFixed(1)} y={+by.toFixed(1)} width={+bw.toFixed(1)} height={+bh.toFixed(1)} rx="2" fill={isH?'rgba(201,169,110,0.1)':'rgba(201,169,110,0.04)'} stroke="#c9a96e" strokeWidth={isH?1.2:0.7} strokeDasharray={p.solid?'none':'5 3'}/>
            <polygon points={`${+bx.toFixed(1)},${+by.toFixed(1)} ${+(bx+bw).toFixed(1)},${+by.toFixed(1)} ${+(bx+bw+8).toFixed(1)},${+(by-7).toFixed(1)} ${+(bx+8).toFixed(1)},${+(by-7).toFixed(1)}`} fill="rgba(201,169,110,0.08)" stroke="#c9a96e" strokeWidth="0.5" strokeDasharray={p.solid?'none':'5 3'} opacity="0.7"/>
            <polygon points={`${+(bx+bw).toFixed(1)},${+by.toFixed(1)} ${+(bx+bw+8).toFixed(1)},${+(by-7).toFixed(1)} ${+(bx+bw+8).toFixed(1)},${+(by+bh-7).toFixed(1)} ${+(bx+bw).toFixed(1)},${+(by+bh).toFixed(1)}`} fill="rgba(201,169,110,0.03)" stroke="#c9a96e" strokeWidth="0.5" strokeDasharray={p.solid?'none':'5 3'} opacity="0.5"/>
            {!p.solid&&<text x={+(bx+bw/2).toFixed(1)} y={+(by+bh*0.5).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="20" fontFamily="Cormorant,serif" opacity="0.2">?</text>}
            {p.label.split('|').map((line,li)=><text key={li} x={+(bx+bw/2).toFixed(1)} y={+(by+bh+14+li*10).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="8" fontFamily="DM Mono,monospace" letterSpacing="0.5" opacity="0.75">{line}</text>)}
            <text x={+(bx+bw/2).toFixed(1)} y={+(by+bh+(p.label.includes('|')?36:26)).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="7" fontFamily="DM Mono,monospace" opacity="0.35">{p.sub}</text>
            {isH&&<text x={+(bx+bw/2).toFixed(1)} y={+(H-5).toFixed(1)} textAnchor="middle" fill="#c9a96e" fontSize="7" fontFamily="DM Mono,monospace" opacity="0.6">{p.desc}</text>}
          </g>
        })}
      </svg>
    </div>
  )
}

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / 1400, 1)
          setCount(Math.round((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <div ref={ref} className="stat-num">{count}{suffix}</div>
}

const VEC_MAP: Record<string,(s:number)=>JSX.Element> = {
  duality:s=><VecDuality size={s}/>, hoffman:s=><VecHoffman size={s}/>, coil:s=><VecCoil size={s}/>,
  heatsink:s=><VecHeatsink size={s}/>, xover:s=><VecXover size={s}/>, xsflow:s=><VecXSFlow size={s}/>,
  psysculpt:s=><VecPsySculpt size={s}/>, upcoming:s=><VecUpcoming size={s}/>,
}

export default function AboutPage() {
  const [vecSize, setVecSize] = useState(460)
  const vecRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:0.08})
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el))
    const ro=new ResizeObserver(entries=>{setVecSize(Math.max(260,Math.min(520,entries[0].contentRect.width)))})
    if(vecRef.current)ro.observe(vecRef.current)
    return()=>{obs.disconnect();ro.disconnect()}
  },[])
  return (
    <div className="about-page">
      <section className="about-hero-v2"><AboutHero/></section>
      <WaveDivider/>
      <section className="about-philosophy-section">
        <div className="about-section-ey reveal" style={{marginBottom:'40px'}}>Design philosophy</div>
        <div className="about-philosophy-grid">
          {[
            {title:'Invisible by design.',body:'The best speaker is one you never think about. Not because it performs poorly — because it performs so naturally that your brain stops registering it as a device and starts experiencing it as a room.'},
            {title:'Constraint as invention.',body:'We do not make thin speakers because thin is fashionable. We make them because the constraint forced us to invent. Every patent exists because of a problem we refused to accept.'},
            {title:'The room is the product.',body:'We design for a living room, a corridor, a courtyard at dusk — not an anechoic chamber. PsySculpt™ exists because human hearing is not flat. And neither is life.'},
            {title:'Made to be forgotten.',body:'Six patents, 34 products, seven regions. None of it matters unless, when someone walks into a room with XSCACE in it, they simply feel that the room sounds right.'},
          ].map((p,i)=>(
            <div key={i} className="phil-card reveal">
              <div className="phil-rule"/>
              <div className="phil-title">{p.title}</div>
              <div className="phil-body">{p.body}</div>
            </div>
          ))}
        </div>
      </section>
      <WaveDivider/>
      <section className="about-chapters-wrap" ref={vecRef}>
        <div className="about-section-ey reveal" style={{padding:'56px 56px 0'}}>Origin &amp; Technology · How XSCACE was built</div>
        {CHAPTERS.map((ch,i)=>(
          <div key={ch.id} className={`chapter-full reveal ${i%2===0?'even':'odd'}`}>
            <div className="chapter-full-left">
              <div className="chapter-full-index-row">
                <div className="chapter-full-index">{ch.index}</div>
                {CHAPTER_ICONS[ch.id]&&<div className="chapter-icon-box">{CHAPTER_ICONS[ch.id]}</div>}
              </div>
              <div className="chapter-full-eyebrow">{ch.eyebrow}</div>
              <h2 className="chapter-full-title">{ch.title}</h2>
              <p className="chapter-full-body">{ch.body}</p>
              {ch.interact&&<div className="chapter-interact-hint">↗ {ch.interact}</div>}
            </div>
            <div className="chapter-full-right">{VEC_MAP[ch.vec]?VEC_MAP[ch.vec](vecSize):null}</div>
          </div>
        ))}
      </section>
      <WaveDivider/>
      <section className="about-cta reveal">
        <div className="about-cta-inner">
          <div className="about-cta-h">Ready to hear the difference?</div>
          <div className="about-cta-sub">Find your nearest authorised distributor or configure your system online.</div>
          <div className="about-cta-btns">
            <a href="/distributors" className="btn-prim">Find a Distributor</a>
            <a href="https://configurator.xscace.com" className="btn-ghost">Build Your System</a>
          </div>
        </div>
      </section>
    </div>
  )
}
