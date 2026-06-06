'use client'

import { useEffect } from 'react'

export default function HomePage() {

  useEffect(() => {
    // Intersection observer for reveal animations
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))

    // Sec-h-wrap draw line observer
    const obs2 = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('drawn') })
    }, { threshold: 0.3 })
    document.querySelectorAll('.sec-h-wrap').forEach(el => obs2.observe(el))

    return () => { obs.disconnect(); obs2.disconnect() }
  }, [])

  return (
    <>
<canvas id="scroll-wave" style={{position: "fixed", right: "0", top: "0", width: "14px", height: "100vh", zIndex: "50", pointerEvents: "none", opacity: "0", transition: "opacity 1s"}} aria-hidden="true"></canvas>
<div id="cursor">
  <svg id="c-waves" width="160" height="160" viewBox="0 0 160 160" fill="none" style={{position: "absolute", overflow: "visible"}}>
    <path id="wp1" fill="none"/><path id="wp2" fill="none"/><path id="wp3" fill="none"/>
  </svg>
  <div id="c-ring"></div>
  <div id="c-dot"></div>
</div>

<div className="audio-btn" id="audioBtn" title="Toggle ambient sound">
  <canvas id="audio-canvas" width="56" height="36"></canvas>
</div>

<nav className="nav" id="nav">
  <a href="/" className="logo">XSCACE</a>
  <div className="nav-links">
    <a href="#" className="nav-l">Products</a>
    <a href="https://configurator.xscace.com" className="nav-l">System Builder</a>
    <a href="#" className="nav-l">Technology</a>
    <a href="#" className="nav-l">Resources</a>
    <a href="#" className="nav-l">Journal</a>
    <a href="#" className="nav-l">About</a>
  </div>
  <a href="#distributors" className="nav-cta">Find a Distributor</a>
</nav>

<section className="hero">
  <div className="hero-bg"></div>
  <div className="hero-grid"></div>
  
  <div className="hero-vid">
    <div className="hvid-play"></div>
    <div className="hvid-lbl">Video Direction</div>
    <div className="hvid-desc">Extreme close-up — slim array — slow motion — fade to black</div>
  </div>
  <div className="hero-content">
    <div className="h-ey">Precision Audio</div>
    <div className="h-title">Size<br /><em>Defying</em><br />Sound</div>
    <div className="h-sub">Architectural speakers and amplifiers engineered for spaces where being discreet and in one with the design is equally as important as performance.</div>
    <div className="h-btns">
      <div className="btn-prim">Explore Products</div>
      <div className="btn-ghost">Build Your System</div>
    </div>
  </div>
  
</section>

<div className="cat-strip reveal">
  <div className="cat-item"><div className="cat-n">Slim Array</div><div className="cat-c">04 products</div></div>
  <div className="cat-item"><div className="cat-n">In-Ceiling</div><div className="cat-c">04 products</div></div>
  <div className="cat-item"><div className="cat-n">In-Wall</div><div className="cat-c">07 products</div></div>
  <div className="cat-item"><div className="cat-n">Outdoor</div><div className="cat-c">03 products</div></div>
  <div className="cat-item"><div className="cat-n">Subwoofer</div><div className="cat-c">08 SKUs</div></div>
  <div className="cat-item" style={{borderRight: "none"}}><div className="cat-n">Amplifiers</div><div className="cat-c">08 products</div></div>
</div>

<section className="sec reveal">
  <div className="sec-hdr">
    <div><div className="sec-ey">Featured Products</div><div className="sec-h-wrap"><div className="sec-h">Precision in Every Form</div><div className="sec-draw-line"></div></div></div>
    <div className="sec-lnk">View all products</div>
  </div>
  <div className="prod-grid">
    <div className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Floating 45° — transparent BG</div></div><div className="p-badge">World&apos;s Smallest</div></div><div className="p-body"><div className="p-cat">Slim Array</div><div className="p-name">Bonsai</div><div className="p-spec">40W · 86 dB · 300Hz–18KHz · 8Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></div>
    <div className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Floating — side profile — transparent BG</div></div><div className="p-badge">23mm Thin</div></div><div className="p-body"><div className="p-cat">Slim Array</div><div className="p-name">Cane</div><div className="p-spec">50W · 92 dB · 150Hz–20KHz · 8Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></div>
    <div className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Installed flush — ceiling POV</div></div><div className="p-badge">Award Winning</div></div><div className="p-body"><div className="p-cat">In-Ceiling</div><div className="p-name">Ghost 2.0</div><div className="p-spec">80W · 92 dB · 20Hz–20KHz · 4Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></div>
    <div className="prod-card"><div className="prod-img"><div className="cm"><div className="cm-badge">Image / Video</div><div className="cm-lbl">Full length — perspective angle</div></div><div className="p-badge">21mm Thin</div></div><div className="p-body"><div className="p-cat">Slim Array</div><div className="p-name">QuadCane</div><div className="p-spec">100W · 104 dB · 150Hz–20KHz · 8Ω</div><div className="p-foot"><span className="p-arr p-arr-full">View →</span></div></div></div>
  </div>
</section>

<canvas className="wave-divider" id="wd1" height="28" aria-hidden="true" style={{display: "block", width: "100%", height: "28px"}}></canvas>

<section className="sec bg2 reveal">
  <div className="sec-ey">Proprietary Technology</div>
  <div className="sec-h-wrap"><div className="sec-h">The Science Behind the Sound</div><div className="sec-draw-line"></div></div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="6" stroke="#c9a96e" strokeWidth="1"/>
        <circle cx="18" cy="18" r="12" stroke="#c9a96e" strokeWidth="0.5" opacity="0.4"/>
        <circle cx="18" cy="18" r="17" stroke="#c9a96e" strokeWidth="0.5" opacity="0.2"/>
        <line x1="18" y1="6" x2="18" y2="2" stroke="#c9a96e" strokeWidth="1"/>
        <line x1="18" y1="30" x2="18" y2="34" stroke="#c9a96e" strokeWidth="1"/>
        <line x1="6" y1="18" x2="2" y2="18" stroke="#c9a96e" strokeWidth="1"/>
        <line x1="30" y1="18" x2="34" y2="18" stroke="#c9a96e" strokeWidth="1"/>
      </svg>
      <div className="t-name">Nano Resonance</div>
      <div className="t-desc">Ultra-compact motor structures paired with denser woofer cones lower the natural resonant frequency — allowing even our smallest speakers to deliver deep lows, crisp highs, and everything in between.</div>
      <a href="/technology#nano-resonance" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 18 L10 18 L14 8 L18 28 L22 8 L26 18 L34 18" stroke="#c9a96e" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="1.5" fill="#c9a96e"/>
      </svg>
      <div className="t-name">PrecisionXover Array</div>
      <div className="t-desc">Miniaturised crossover architecture engineered for ultra-slim form factors. High-tolerance components and a compact multilayer PCB deliver seamless frequency division and time alignment with surgical precision.</div>
      <a href="/technology#precision-xover" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4 L10 20 L17 20 L16 32 L26 16 L19 16 Z" stroke="#c9a96e" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
      <div className="t-name">PowerDense Dynamics</div>
      <div className="t-desc">High-gauss neodymium magnets, ultra-lightweight voice coils, and reinforced motor structures deliver remarkable SPL, clarity, and transient response — all within a minimal form factor.</div>
      <a href="/technology#powerdense" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="24" height="24" rx="3" stroke="#c9a96e" strokeWidth="1"/>
        <rect x="11" y="11" width="14" height="14" rx="2" stroke="#c9a96e" strokeWidth="0.5" opacity="0.5"/>
        <line x1="6" y1="14" x2="2" y2="14" stroke="#c9a96e" strokeWidth="1"/>
        <line x1="6" y1="22" x2="2" y2="22" stroke="#c9a96e" strokeWidth="1"/>
        <line x1="30" y1="14" x2="34" y2="14" stroke="#c9a96e" strokeWidth="1"/>
        <line x1="30" y1="22" x2="34" y2="22" stroke="#c9a96e" strokeWidth="1"/>
      </svg>
      <div className="t-name">AeroFrame Chassis</div>
      <div className="t-desc">Precision-engineered aluminium structures and thermally conductive composites transform the speaker body into an active thermal management system — maintaining performance under sustained high power.</div>
      <a href="/technology#aeroframe" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 26 Q10 26 12 18 Q14 10 20 10 Q26 10 28 18 Q30 26 36 26" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round"/>
        <path d="M2 20 Q8 20 10 16 Q12 12 18 12 Q24 12 26 16 Q28 20 34 20" stroke="#c9a96e" strokeWidth="0.5" opacity="0.4" strokeLinecap="round"/>
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
      <span className="n-link">Read more →</span>
    </div>
    <div className="news-card">
      <div className="news-img"><div className="news-img-inner"><span className="news-img-lbl">Image</span></div></div>
      <div className="n-date">2026</div>
      <div className="n-cat">New Product</div>
      <div className="n-title">Air Mini — Launched and Back in Stock</div>
      <div className="n-body">The Air Mini streaming amplifier is officially launched and available. Compact, powerful, and fully compatible with the XSCACE ecosystem — AirPlay 2, Bluetooth 5.0, Spotify Connect.</div>
      <span className="n-link">Read more →</span>
    </div>
    <div className="news-card">
      <div className="news-img"><div className="news-img-inner"><span className="news-img-lbl">Image</span></div></div>
      <div className="n-date">2026</div>
      <div className="n-cat">Coming Soon</div>
      <div className="n-title">XSCACE Xylem Series — Coming Soon</div>
      <div className="n-body">The Xylem DSP amplifier series is arriving. SigmaStudio-programmable, champagne chassis, Class D precision — 2, 3, and 4-channel configurations for the most demanding installations.</div>
      <span className="n-link">Read more →</span>
    </div>
  </div>
</section>

<canvas className="wave-divider" id="wd4" height="28" aria-hidden="true" style={{display: "block", width: "100%", height: "28px"}}></canvas>

<section className="dist-sec reveal" id="distributors">
  <div className="dist-ey">Global Distribution</div>
  <div className="dist-h">Find a Distributor</div>
  <div className="dist-sub">XSCACE products are available through authorised distributors worldwide. Contact your regional distributor for pricing, availability, and project support.</div>
  <div className="dist-grid">
    <div className="dist-card">
      <div className="dist-region">India</div>
      <div className="dist-name">Miantic AV</div>
      <div className="dist-contact"><a href="https://www.miantic.com" target="_blank">miantic.com</a><br /><a href="mailto:info@miantic.com">info@miantic.com</a><br />+91 9211 218 313</div>
      <span className="dist-web">Visit website →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">India — Delhi NCR</div>
      <div className="dist-name">Sound N Style</div>
      <div className="dist-contact"><a href="mailto:info@soundnstyle.in">info@soundnstyle.in</a><br />+91 9212 268 632</div>
      <span className="dist-web">Enquire →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">Philippines</div>
      <div className="dist-name">SmartAge</div>
      <div className="dist-contact"><a href="https://www.smartage.ph" target="_blank">smartage.ph</a><br />+63 917 187 2791</div>
      <span className="dist-web">Visit website →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">Middle East &amp; North Africa</div>
      <div className="dist-name">GES Equinox</div>
      <div className="dist-contact"><a href="https://geslb.com" target="_blank">geslb.com</a><br /><a href="mailto:info@geslb.com">info@geslb.com</a><br />+971 4 884 9593</div>
      <span className="dist-web">Visit website →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">Australia</div>
      <div className="dist-name">Avation</div>
      <div className="dist-contact"><a href="https://avation.com.au" target="_blank">avation.com.au</a><br /><a href="mailto:info@avation.com.au">info@avation.com.au</a><br />+61 7 5580 3300</div>
      <span className="dist-web">Visit website →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">UK &amp; Europe</div>
      <div className="dist-name">RGB Communications</div>
      <div className="dist-contact"><a href="https://www.rgbcomms.co.uk" target="_blank">rgbcomms.co.uk</a><br /><a href="mailto:sales@rgbcomms.co.uk">sales@rgbcomms.co.uk</a><br />+44 (0)1488 73366</div>
      <span className="dist-web">Visit website →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">USA — New York</div>
      <div className="dist-name">Pro Act</div>
      <div className="dist-contact"><a href="https://www.proactsales.com" target="_blank">proactsales.com</a><br /><a href="mailto:info@proactsales.com">info@proactsales.com</a><br />+1 516 352 7533</div>
      <span className="dist-web">Visit website →</span>
    </div>
    <div className="dist-card">
      <div className="dist-region">North America — Canada</div>
      <div className="dist-name">XSCACE Direct</div>
      <div className="dist-contact">3080 Young &amp; Lawrence<br />Toronto, ON, Canada<br /><a href="mailto:support@xscace.com">support@xscace.com</a><br /><a href="https://wa.me/+15878853303">+1 587 885 3303</a></div>
      <span className="dist-web">Get in touch →</span>
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

<footer>
  <div><div className="f-logo">XSCACE</div><div className="f-tag">Architectural speakers and amplifiers engineered for spaces where being discreet and in one with the design is equally as important as performance.</div><div className="f-legal">© 2026 XSCACE Inc. All rights reserved.</div></div>
  <div><div className="f-h">Products</div><a href="#" className="f-l">Slim Array</a><a href="#" className="f-l">In-Ceiling</a><a href="#" className="f-l">In-Wall</a><a href="#" className="f-l">Outdoor</a><a href="#" className="f-l">Subwoofers</a><a href="#" className="f-l">Amplifiers</a></div>
  <div><div className="f-h">Explore</div><a href="https://configurator.xscace.com" className="f-l">System Builder</a><a href="#" className="f-l">Technology</a><a href="#" className="f-l">Resources</a><a href="#" className="f-l">Journal</a><a href="#" className="f-l">About XSCACE</a></div>
  <div><div className="f-h">Contact</div><a href="#distributors" className="f-l">Find a Distributor</a><a href="#" className="f-l">Become a Distributor</a><a href="mailto:support@xscace.com" className="f-l">support@xscace.com</a><a href="https://wa.me/+15878853303" className="f-l">WhatsApp</a></div>
</footer>
<div className="f-bot"><span>XSCACE · Size Defying Sound</span><span>Privacy · Terms · Distributor Login</span></div>
    </>
  )
}
