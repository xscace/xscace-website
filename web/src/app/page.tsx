'use client'

import { useEffect } from 'react'

export default function HomePage() {

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    const obs2 = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('drawn') })
    }, { threshold: 0.3 })
    document.querySelectorAll('.sec-h-wrap').forEach(el => obs2.observe(el))
    return () => { obs.disconnect(); obs2.disconnect() }
  }, [])

  return (
    <>
<section className="hero">
  <div className="hero-bg"></div>
  <div className="hero-grid"></div>
  
  <div className="hero-vid">
    <div className="hvid-play"></div>
    <div className="hvid-lbl">Video Direction</div>
    <div className="hvid-desc">Extreme close-up — slim array — slow motion — fade to black</div>
  </div>
  <div className="hero-content">
    <div className="h-ey">6 Patents</div>
    <div className="h-title">Size<br /><em>Defying</em><br />Sound</div>
    <div className="h-sub">Architectural speakers and amplifiers engineered for spaces where being discreet and in one with the design is equally as important as performance.</div>
    <div className="h-btns">
      <a href="/products" className="btn-prim">Explore Products</a>
      <a href="https://configurator.xscace.com" className="btn-ghost">Build Your System</a>
    </div>
  </div>
  
</section>

<div className="cat-strip reveal">
  <a href="/products?cat=slim-array-series" className="cat-item"><div className="cat-n">Slim Array</div><div className="cat-c">04 products</div></a>
  <a href="/products?cat=in-ceiling-series" className="cat-item"><div className="cat-n">In-Ceiling</div><div className="cat-c">04 products</div></a>
  <a href="/products?cat=in-wall-series" className="cat-item"><div className="cat-n">In-Wall</div><div className="cat-c">07 products</div></a>
  <a href="/products?cat=outdoor-series" className="cat-item"><div className="cat-n">Outdoor</div><div className="cat-c">03 products</div></a>
  <a href="/products?cat=subwoofer-series" className="cat-item"><div className="cat-n">Subwoofer</div><div className="cat-c">08 SKUs</div></a>
  <a href="/products?cat=amplifier-series" className="cat-item" style={{borderRight: "none"}}><div className="cat-n">Amplifiers &amp; Streamers</div><div className="cat-c">09 products</div></a>
</div>

<section className="sec reveal">
  <div className="sec-hdr">
    <div><div className="sec-ey">Featured Products</div><div className="sec-h-wrap"><div className="sec-h">Precision in Every Form</div><div className="sec-draw-line"></div></div></div>
    <div className="sec-lnk">View all products</div>
  </div>
  <div className="prod-grid">
    <a href="/products/slim-array-series/bonsai-mini-slim-array-speaker" className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Floating 45° — transparent BG</div></div><div className="p-badge">World&apos;s Smallest</div></div><div className="p-body"><div className="p-cat">Slim Array</div><div className="p-name">Bonsai</div><div className="p-spec">40W · 86 dB · 300Hz–18KHz · 8Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></a>
    <a href="/products/slim-array-series/cane-slim-array-speaker" className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Floating — side profile — transparent BG</div></div><div className="p-badge">23mm Thin</div></div><div className="p-body"><div className="p-cat">Slim Array</div><div className="p-name">Cane</div><div className="p-spec">50W · 92 dB · 150Hz–20KHz · 8Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></a>
    <a href="/products/in-ceiling-series/ghost-2-0-slim-in-ceiling-speaker" className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Installed flush — ceiling POV</div></div><div className="p-badge">Award Winning</div></div><div className="p-body"><div className="p-cat">In-Ceiling</div><div className="p-name">Ghost 2.0</div><div className="p-spec">80W · 92 dB · 20Hz–20KHz · 4Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></a>
    <a href="/products/slim-array-series/quadcane-slim-array-speaker" className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Full length — perspective angle</div></div><div className="p-badge">21mm Thin</div></div><div className="p-body"><div className="p-cat">Slim Array</div><div className="p-name">QuadCane</div><div className="p-spec">100W · 104 dB · 150Hz–20KHz · 8Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></a>
  </div>
</section>

<canvas className="wave-divider" id="wd1" height="28" aria-hidden="true" style={{display: "block", width: "100%", height: "28px"}}></canvas>

<section className="sec bg2 reveal">
  <div className="sec-ey">Proprietary Technology</div>
  <div className="sec-h-wrap"><div className="sec-h">The Science Behind the Sound</div><div className="sec-draw-line"></div></div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 80 95" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M36 16 L36 42 C36 56 28 66 12 74" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M38 12 L38 44 C38 56 34 64 24 70" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M40 10 L40 60 C40 66 40 70 40 74" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M42 12 L42 44 C42 56 46 64 56 70" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <path d="M44 16 L44 42 C44 56 52 66 68 74" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  <circle cx="40" cy="82" r="3.5" fill="#c9a96e" opacity="0.9"/>
  <circle cx="40" cy="82" r="6.5" fill="none" stroke="#c9a96e" strokeWidth="0.6" opacity="0.3"/>
</svg>
      <div className="t-name">Nano Resonance</div>
      <div className="t-desc">Ultra-compact motor structures paired with denser woofer cones lower the natural resonant frequency — allowing even our smallest speakers to deliver deep lows, crisp highs, and everything in between.</div>
      <a href="/technology#nano-resonance" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="46" x2="20" y2="30" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="26" y1="52" x2="26" y2="24" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="32" y1="58" x2="32" y2="18" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="37" y1="62" x2="37" y2="14" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="43" y1="62" x2="43" y2="14" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="48" y1="58" x2="48" y2="18" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="54" y1="52" x2="54" y2="24" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="60" y1="46" x2="60" y2="30" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
</svg>
      <div className="t-name">PrecisionXover Array</div>
      <div className="t-desc">Miniaturised crossover architecture engineered for ultra-slim form factors. High-tolerance components and a compact multilayer PCB deliver seamless frequency division and time alignment with surgical precision.</div>
      <a href="/technology#precision-xover" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <div className="t-name">PowerDense Dynamics</div>
      <div className="t-desc">High-gauss neodymium magnets, ultra-lightweight voice coils, and reinforced motor structures deliver remarkable SPL, clarity, and transient response — all within a minimal form factor.</div>
      <a href="/technology#powerdense" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 40 L62 14 L46 44 Z" stroke="#c9a96e" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(201,169,110,0.05)"/>
  <path d="M46 44 L62 14 L52 50 Z" stroke="#c9a96e" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(201,169,110,0.08)"/>
  <line x1="62" y1="14" x2="46" y2="44" stroke="#c9a96e" strokeWidth="0.8" opacity="0.5"/>
  <line x1="10" y1="52" x2="28" y2="42" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" opacity="0.75"/>
  <line x1="12" y1="60" x2="32" y2="48" stroke="#c9a96e" strokeWidth="1.1" strokeLinecap="round" opacity="0.6"/>
  <line x1="18" y1="66" x2="36" y2="54" stroke="#c9a96e" strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
  <line x1="8"  y1="44" x2="22" y2="37" stroke="#c9a96e" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
  <line x1="24" y1="70" x2="40" y2="60" stroke="#c9a96e" strokeWidth="0.7" strokeLinecap="round" opacity="0.35"/>
</svg>
      <div className="t-name">AeroFrame Chassis</div>
      <div className="t-desc">Precision-engineered aluminium structures and thermally conductive composites transform the speaker body into an active thermal management system — maintaining performance under sustained high power.</div>
      <a href="/technology#aeroframe" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <div className="t-name">XS-Flow</div>
      <div className="t-desc">Ultra-low turbulence port geometry developed through computational fluid dynamics. Eliminates port noise at high SPL without sacrificing bass extension or dynamic range.</div>
      <a href="/technology#xs-flow" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card" style={{borderRight: "none"}}>
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 18 Q6 10 10 14 Q14 18 18 10 Q22 2 26 10 Q30 18 32 14 Q34 10 36 18" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round"/>
        <path d="M4 24 Q8 20 12 24 Q16 28 20 22 Q24 16 28 22 Q30 26 34 22" stroke="#c9a96e" strokeWidth="0.5" opacity="0.35" strokeLinecap="round"/>
      </svg>
      <div className="t-name">PsySculpt</div>
      <div className="t-desc">Psychoacoustic tuning applied at the driver and crossover level — shaping the listening experience to how the human ear naturally perceives space, depth, and dimensionality.</div>
      <a href="/technology#psysculpt" className="t-lnk">Learn more →</a>
    </div>
  </div>
  <div className="waveform-scrubber">
    <div className="ws-label">Hear the Frequency Range — hover to explore, click to play</div>
    <div className="ws-wrap" id="wsWrap">
      <canvas className="ws-canvas" id="wsCanvas"></canvas>
    </div>
    <div className="ws-info-row">
      <div className="ws-freq" id="wsFreq">— kHz</div>
      <div className="ws-desc" id="wsDesc">Hover anywhere on the waveform to explore frequencies</div>
    </div>
    <div className="ws-play-btn" id="wsPlay">
      <span className="ws-play-dot" id="wsPlayDot"></span>
      <span id="wsPlayLabel">Play tone</span>
    </div>
  </div>

</section>

<canvas className="wave-divider" id="wd2" height="28" aria-hidden="true" style={{display: "block", width: "100%", height: "28px"}}></canvas>

<section className="setup-teaser reveal">
  <div className="setup-inner">
    <div className="setup-left">
      <div className="sec-ey">System Builder</div>
      <div className="sec-h-wrap"><div className="sec-h" style={{marginBottom: "20px"}}>Find Your<br />Perfect System</div><div className="sec-draw-line"></div></div>
      <div className="setup-points">
        <div className="setup-point"><span className="sp-dot"></span><span>Tell it your room size and application</span></div>
        <div className="setup-point"><span className="sp-dot"></span><span>Get a matched XSCACE system instantly</span></div>
        <div className="setup-point"><span className="sp-dot"></span><span>Download a full bill of quantities</span></div>
        <div className="setup-point"><span className="sp-dot"></span><span>Ask the AI expert any question</span></div>
        <div className="setup-point"><span className="sp-dot"></span><span>Works for home, commercial &amp; outdoor</span></div>
      </div>
      <a href="https://configurator.xscace.com" target="_blank" className="setup-cta-btn">Open System Builder →</a>
    </div>
    <div className="configurator-preview">
      <div className="cfg-chrome">
        <div className="cfg-bar">
          <div className="cfg-dots"><span></span><span></span><span></span></div>
          <div className="cfg-url">configurator.xscace.com</div>
        </div>
        <div className="cfg-body">
          <div className="cfg-sidebar">
            <div className="cfg-logo">XSCACE</div>
            <div className="cfg-ai-badge">AI System Expert <span className="cfg-online">● Online</span></div>
            <div className="cfg-field-group">
              <div className="cfg-field-label">Room Area (m²)</div>
              <div className="cfg-field-input">45</div>
            </div>
            <div className="cfg-field-group">
              <div className="cfg-field-label">Application</div>
              <div className="cfg-field-input cfg-select">Home Theatre (Dolby &amp; DTS)</div>
            </div>
            <div className="cfg-field-group">
              <div className="cfg-field-label">Budget (USD)</div>
              <div className="cfg-field-input cfg-select">High End ($40K–$100K)</div>
            </div>
            <div className="cfg-find-btn">Find My System →</div>
          </div>
          <div className="cfg-main">
            <div className="cfg-chat-msg cfg-ai">Tell me about your space and I will suggest the perfect XSCACE system.</div>
            <div className="cfg-chips">
              <div className="cfg-chip">Home Cinema</div>
              <div className="cfg-chip">Commercial</div>
              <div className="cfg-chip">Outdoor</div>
            </div>
            <div className="cfg-tabs">
              <div className="cfg-tab cfg-tab-active">Products</div>
              <div className="cfg-tab">BOQ</div>
              <div className="cfg-tab">Wiring</div>
            </div>
            <div className="cfg-product-row">
              <div className="cfg-prod-dot"></div>
              <div className="cfg-prod-info"><div className="cfg-prod-name">Ghost 2.0 × 5</div><div className="cfg-prod-sub">Slim In-Ceiling Speaker</div></div>
            </div>
            <div className="cfg-product-row">
              <div className="cfg-prod-dot"></div>
              <div className="cfg-prod-info"><div className="cfg-prod-name">Juniper × 1</div><div className="cfg-prod-sub">12" Powered Subwoofer</div></div>
            </div>
            <div className="cfg-product-row">
              <div className="cfg-prod-dot"></div>
              <div className="cfg-prod-info"><div className="cfg-prod-name">Root 4 × 1</div><div className="cfg-prod-sub">DSP Amplifier</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<canvas className="wave-divider" id="wd3" height="28" aria-hidden="true" style={{display: "block", width: "100%", height: "28px"}}></canvas>

<section className="sec bg2 reveal">
  <div className="sec-hdr">
    <div><div className="sec-ey">Latest</div><div className="sec-h-wrap"><div className="sec-h">News &amp; Announcements</div><div className="sec-draw-line"></div></div></div>
    <div className="sec-lnk">View journal</div>
  </div>
  <div className="news-grid">
    <div className="news-card">
      <div className="news-img"><div className="news-img-inner"><span className="news-img-lbl">Image</span></div></div>
      <div className="n-date">2026</div>
      <div className="n-cat">New Finish</div>
      <div className="n-title">Acacia 6 &amp; 10 Now Available in Stainless Steel</div>
      <div className="n-body">The Acacia subwoofer range — in-wall and standard passive — is now offered in a premium brushed stainless steel finish, complementing high-end residential and commercial interiors.</div>
      <a href="/journal" className="n-link">Read more →</a>
    </div>
    <div className="news-card">
      <div className="news-img"><div className="news-img-inner"><span className="news-img-lbl">Image</span></div></div>
      <div className="n-date">2026</div>
      <div className="n-cat">New Product</div>
      <div className="n-title">Air Mini — Launched and Back in Stock</div>
      <div className="n-body">The Air Mini streaming amplifier is officially launched and available. Compact, powerful, and fully compatible with the XSCACE ecosystem — AirPlay 2, Bluetooth 5.0, Spotify Connect.</div>
      <a href="/journal" className="n-link">Read more →</a>
    </div>
    <div className="news-card">
      <div className="news-img"><div className="news-img-inner"><span className="news-img-lbl">Image</span></div></div>
      <div className="n-date">2026</div>
      <div className="n-cat">Coming Soon</div>
      <div className="n-title">XSCACE Xylem Series — Coming Soon</div>
      <div className="n-body">The Xylem DSP amplifier series is arriving. SigmaStudio-programmable, champagne chassis, Class D precision — 2, 3, and 4-channel configurations for the most demanding installations.</div>
      <a href="/journal" className="n-link">Read more →</a>
    </div>
  </div>
</section>

<canvas className="wave-divider" id="wd4" height="28" aria-hidden="true" style={{display: "block", width: "100%", height: "28px"}}></canvas>

<section className="findus-sec reveal">
  <div className="findus-sec-inner">
    <div>
      <div className="findus-sec-ey">Global Presence</div>
      <div className="findus-sec-h">Where to <em>Find Us</em></div>
      <div className="findus-sec-sub">
        XSCACE is available through authorised distributors across seven regions worldwide —
        India, UK, Europe, Middle East, Philippines, Australia, and North America.
      </div>
    </div>
    <div className="findus-sec-cta">
      <a href="/distributors" className="btn-prim">Find a Distributor →</a>
      <a href="mailto:support@xscace.com" className="btn-ghost">Direct Enquiry →</a>
    </div>
  </div>
</section>

<section className="contact-sec reveal">
  <div className="contact-inner">
    <div>
      <div className="sec-ey">Get in Touch</div>
      <div className="sec-h" style={{marginBottom: "18px"}}>Let's Talk<br />About Your Project</div>
      <p style={{fontSize: "12px", color: "#666660", lineHeight: "1.8", fontWeight: "300", maxWidth: "320px"}}>Whether you are specifying a home cinema, a commercial installation, or enquiring about distribution — we would love to hear from you.</p>
      <div className="contact-detail">
        <div className="cd-row"><span className="cd-lbl">Email</span><span className="cd-val">support@xscace.com</span></div>
        <div className="cd-row"><span className="cd-lbl">WhatsApp</span><span className="cd-val">+1 587 885 3303</span></div>
        <div className="cd-row"><span className="cd-lbl">Address</span><span className="cd-val">3080 Young &amp; Lawrence, Toronto, ON, Canada</span></div>
      </div>
    </div>
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">First Name</label><input className="form-input" type="text" placeholder="First name" /></div>
        <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" type="text" placeholder="Last name" /></div>
      </div>
      <div className="form-row full">
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="your@email.com" /></div>
      </div>
      <div className="form-row full">
        <div className="form-group"><label className="form-label">Enquiry Type</label>
          <div className="form-select-wrap">
            <select className="form-input" defaultValue="">
              <option value="" disabled>Select enquiry type</option>
              <option>Residential Project</option>
              <option>Commercial Project</option>
              <option>Distribution Enquiry</option>
              <option>Technical Support</option>
              <option>Press &amp; Media</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>
      <div className="form-row full">
        <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" placeholder="Tell us about your project or enquiry..."></textarea></div>
      </div>
      <button type="submit" className="form-submit">Send Message</button>
      <div className="contact-note">We typically respond within one business day.</div>
    </form>
  </div>
</section>
    </>
  )
}
