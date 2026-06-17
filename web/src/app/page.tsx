'use client'

import { useEffect, useRef, useState } from 'react'

// ── ALL HERO BG VIDEOS ────────────────────────────────────────────────────────
// Bonsai + Cane + QuadCane — hero videos + all product lifestyle/demo videos
// To add/change: update video files in Sanity, then update this list
const HERO_VIDEOS = [
  'https://cdn.sanity.io/files/7r0kq57d/production/9321462fead3edd96aea64e147d713d274fc4568.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/70bf09e2368c3984b6ee2922464725ab9441d943.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/628a00af0a0cc0bbf39d7d730d641355a98de406.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/2899cad532c1b67f191e6e933196cd113fca0a7d.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/f33c4f6bb9ed5c553f88047f302b5920f0fdaa1f-mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/c9587a4d945e0f8982ef1eea9ff96a979406d70c.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/d3c7a30e3214e23ae3a4503566c082a71e0facc0.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/1d57152b421a1555993648df55815475660ef2d6.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/c3090986b9beb1db9e1bda89f9426c11ff1c894b.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/d9519eb2abae08958f4f195848a348a3be3b5221.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/42f443cbc7cf157ba4ad2a09b237f20c53dcb0f0.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/1924210781dcd0b471b550ea9f6dc04d0a05dc11.mp4',
  'https://cdn.sanity.io/files/7r0kq57d/production/63225b7dd7a4abe2ab712f4f455ab077e28742bf.mp4',
]

// Shuffle array on load so every session starts at a different point
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SHUFFLED = shuffle(HERO_VIDEOS)

// ── FEATURED PRODUCTS ─────────────────────────────────────────────────────────
const FEATURED = [
  {
    href: '/products/slim-array-series/bonsai-mini-slim-array-speaker',
    badge: "World's Smallest",
    cat: 'Slim Array',
    name: 'Bonsai',
    spec: '40W · 86 dB · 300Hz–18KHz · 8Ω',
    videoUrl: 'https://cdn.sanity.io/files/7r0kq57d/production/9321462fead3edd96aea64e147d713d274fc4568.mp4',
    imageUrl: 'https://cdn.sanity.io/images/7r0kq57d/production/89581883d4b073a233ffeac08b3c62c213adf3a6-525x492.png?w=800&auto=format',
  },
  {
    href: '/products/slim-array-series/cane-slim-array-speaker',
    badge: '23mm Thin',
    cat: 'Slim Array',
    name: 'Cane',
    spec: '50W · 92 dB · 150Hz–20KHz · 8Ω',
    videoUrl: 'https://cdn.sanity.io/files/7r0kq57d/production/c9587a4d945e0f8982ef1eea9ff96a979406d70c.mp4',
    imageUrl: 'https://cdn.sanity.io/images/7r0kq57d/production/f143deb1faa4ec05c289b9481fbe22b806f5366c-3840x2160.png?w=800&auto=format',
  },
  {
    href: '/products/in-ceiling-series/ghost-2-0-slim-in-ceiling-speaker',
    badge: 'Award Winning',
    cat: 'In-Ceiling',
    name: 'Ghost 2.0',
    spec: '80W · 92 dB · 20Hz–20KHz · 4Ω',
    videoUrl: null,
    imageUrl: 'https://cdn.sanity.io/images/7r0kq57d/production/9139826855763d4eaaf092f3092587396989a9c2-1080x1350.png?w=800&auto=format',
  },
  {
    href: '/products/slim-array-series/quadcane-slim-array-speaker',
    badge: '21mm Thin',
    cat: 'Slim Array',
    name: 'QuadCane',
    spec: '100W · 104 dB · 150Hz–20KHz · 8Ω',
    videoUrl: 'https://cdn.sanity.io/files/7r0kq57d/production/d9519eb2abae08958f4f195848a348a3be3b5221.mp4',
    imageUrl: 'https://cdn.sanity.io/images/7r0kq57d/production/54e4d047eb5078a4aa6dd11592a43a60c6101b50-412x418.png?w=800&auto=format',
  },
]

// ── HERO BG VIDEO COMPONENT ───────────────────────────────────────────────────
// Two video elements cross-fade so there's never a black flash between clips.
// Each clip plays for a random 5–12s portion, then fades to the next.
function HeroBgVideo() {
  const [playlist] = useState(() => shuffle(HERO_VIDEOS))
  const [cursor, setCursor] = useState(0)       // which URL is "current"
  const [phase, setPhase] = useState<'a'|'b'>('a') // which element is showing
  const aRef = useRef<HTMLVideoElement>(null)
  const bRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Random clip duration 5–13 seconds
  const randomMs = () => 5000 + Math.random() * 8000

  // On mount: start A playing
  useEffect(() => {
    const a = aRef.current
    if (!a) return
    a.src = playlist[0]
    a.play().catch(() => {})
    scheduleNext(0, 'a')
    return () => clearTimeout(timerRef.current)
  }, [])

  function scheduleNext(idx: number, currentPhase: 'a'|'b') {
    timerRef.current = setTimeout(() => {
      const nextIdx = (idx + 1) % playlist.length
      const nextPhase = currentPhase === 'a' ? 'b' : 'a'
      const nextRef = nextPhase === 'a' ? aRef : bRef
      const v = nextRef.current
      if (!v) return
      // Preload next clip
      v.src = playlist[nextIdx]
      v.play().catch(() => {})
      // Swap which phase is visible (CSS transition handles the cross-fade)
      setPhase(nextPhase)
      setCursor(nextIdx)
      scheduleNext(nextIdx, nextPhase)
    }, randomMs())
  }

  const shared: React.CSSProperties = {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
    transition: 'opacity 1.2s ease',
  }

  return (
    <>
      <video ref={aRef} muted loop playsInline style={{ ...shared, opacity: phase === 'a' ? 1 : 0, zIndex: 1 }} />
      <video ref={bRef} muted loop playsInline style={{ ...shared, opacity: phase === 'b' ? 1 : 0, zIndex: 1 }} />
    </>
  )
}

// ── FEATURED CARD ─────────────────────────────────────────────────────────────
function FeaturedCard({ p }: { p: typeof FEATURED[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (hovered) { v.play().catch(() => {}) }
    else { v.pause(); v.currentTime = 0 }
  }, [hovered])

  return (
    <a
      href={p.href}
      className="prod-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="prod-img" style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>
        {p.imageUrl && (
          <img
            src={p.imageUrl}
            alt={p.name}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: (p.videoUrl && hovered) ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          />
        )}
        {p.videoUrl && (
          <video
            ref={videoRef}
            src={p.videoUrl}
            muted loop playsInline
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
        )}
        <div className="p-badge">{p.badge}</div>
      </div>
      <div className="p-body">
        <div className="p-cat">{p.cat}</div>
        <div className="p-name">{p.name}</div>
        <div className="p-spec">{p.spec}</div>
        <div className="p-foot">
          <span className="p-arr p-arr-full">View →</span>
        </div>
      </div>
    </a>
  )
}


// ── CONTACT FORM ──────────────────────────────────────────────────────────────
function ContactForm() {
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', type: '', message: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/maqzzywo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          type: form.type,
          message: form.message,
        }),
      })
      if (res.ok) { setStatus('sent') }
      else { setStatus('error') }
    } catch { setStatus('error') }
  }

  return (
    <section className="contact-sec reveal">
      <div className="contact-inner">
        <div>
          <div className="sec-ey">Get in Touch</div>
          <div className="sec-h" style={{marginBottom:'18px'}}>Let's Talk<br />About Your Project</div>
          <p style={{fontSize:'12px',color:'#666660',lineHeight:'1.8',fontWeight:'300',maxWidth:'320px'}}>Whether you are specifying a home cinema, a commercial installation, or enquiring about distribution — we would love to hear from you.</p>
          <div className="contact-detail">
            <div className="cd-row"><span className="cd-lbl">Email</span><span className="cd-val">support@xscace.com</span></div>
            <div className="cd-row"><span className="cd-lbl">WhatsApp</span><span className="cd-val">+1 587 885 3303</span></div>
            <div className="cd-row"><span className="cd-lbl">Address</span><span className="cd-val">3080 Young &amp; Lawrence, Toronto, ON, Canada</span></div>
          </div>
        </div>
        {status === 'sent' ? (
          <div className="findus-sent">
            <div className="findus-sent-icon">✦</div>
            <div className="findus-sent-title">Message Sent</div>
            <div className="findus-sent-sub">We typically respond within one business day.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">First Name</label><input className="form-input" type="text" placeholder="First name" value={form.firstName} onChange={set('firstName')} required /></div>
              <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" type="text" placeholder="Last name" value={form.lastName} onChange={set('lastName')} required /></div>
            </div>
            <div className="form-row full">
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required /></div>
            </div>
            <div className="form-row full">
              <div className="form-group"><label className="form-label">Enquiry Type</label>
                <div className="form-select-wrap">
                  <select className="form-input" value={form.type} onChange={set('type')} required>
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
              <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" placeholder="Tell us about your project or enquiry..." value={form.message} onChange={set('message')} required></textarea></div>
            </div>
            {status === 'error' && <div className="findus-error">Something went wrong — please try again or email us directly.</div>}
            <button type="submit" className="form-submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
            <div className="contact-note">We typically respond within one business day.</div>
          </form>
        )}
      </div>
    </section>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
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
  <div className="hero-bg">
    <HeroBgVideo />
    {/* Top gradient — nav stays readable over video */}
    <div className="hero-top-fade" />
    {/* Static dark overlay — ensures text legibility */}
    <div className="hero-overlay" />
    {/* Bottom gradient — video merges into black section below */}
    <div className="hero-bottom-fade" />
  </div>
  <div className="hero-grid"></div>
  <div className="hero-content">
    <div className="h-ey">6 Patents</div>
    <div className="h-title">Size<br /><em>Defying</em><br />Sound</div>
    <div className="h-sub">Architectural speakers and amplifiers engineered for spaces where being discreet and in one with the design is equally as important as performance.</div>
    <div className="h-btns">
      <a href="/products" className="btn-prim">Explore Products</a>
      <a href="https://configurator.xscace.com" className="btn-ghost btn-ghost--dark">Build Your System</a>
    </div>
  </div>
</section>


<div className="scale-strip">
  <div className="scale-strip-ey">
    <em>Smaller than you'd expect</em>
  </div>
  <div className="scale-panels">
    <div className="scale-panel">
      <div className="scale-img-wrap">
        <img src="/bonsai-scale.png" alt="Bonsai speaker held between fingers" className="scale-img" />
      </div>
      <div className="scale-caption">
        <a href="/products/slim-array-series/bonsai-mini-slim-array-speaker" className="scale-name scale-name--link">Bonsai</a>
        <div className="scale-rule"></div>
        <div className="scale-spec">World&apos;s Smallest · 12mm Thin</div>
      </div>
    </div>
    <div className="scale-divider"></div>
    <div className="scale-panel">
      <div className="scale-img-wrap">
        <img src="/cane-scale.png" alt="Cane speaker held in hand" className="scale-img" />
      </div>
      <div className="scale-caption">
        <a href="/products/slim-array-series/cane-slim-array-speaker" className="scale-name scale-name--link">Cane</a>
        <div className="scale-rule"></div>
        <div className="scale-spec">Slim Array · 23mm Thin</div>
      </div>
    </div>
  </div>
</div>

<div className="cat-strip reveal">
  <a href="/products?cat=slim-array-series" className="cat-item"><div className="cat-n cat-n--champ">Slim Array</div><div className="cat-c">04 products</div></a>
  <a href="/products?cat=in-ceiling-series" className="cat-item"><div className="cat-n cat-n--champ">In-Ceiling</div><div className="cat-c">04 products</div></a>
  <a href="/products?cat=in-wall-series" className="cat-item"><div className="cat-n cat-n--champ">In-Wall</div><div className="cat-c">07 products</div></a>
  <a href="/products?cat=outdoor-series" className="cat-item"><div className="cat-n cat-n--champ">Outdoor</div><div className="cat-c">03 products</div></a>
  <a href="/products?cat=subwoofer-series" className="cat-item"><div className="cat-n cat-n--champ">Subwoofer</div><div className="cat-c">08 SKUs</div></a>
  <a href="/products?cat=amplifier-series" className="cat-item" style={{borderRight:'none'}}><div className="cat-n cat-n--champ">Amplifiers &amp; Streamers</div><div className="cat-c">09 products</div></a>
</div>

<section className="sec reveal">
  <div className="sec-hdr">
    <div><div className="sec-ey">Featured Products</div><div className="sec-h-wrap"><div className="sec-h">Precision in Every Form</div><div className="sec-draw-line"></div></div></div>
    <div className="sec-lnk">View all products</div>
  </div>
  <div className="prod-grid">
    {FEATURED.map(p => <FeaturedCard key={p.name} p={p} />)}
  </div>
</section>

<canvas className="wave-divider" id="wd1" height="28" aria-hidden="true" style={{display:'block',width:'100%',height:'28px'}}></canvas>

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
        <line x1="40" y1="40" x2="40" y2="24" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
        <line x1="40" y1="40" x2="40" y2="56" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
        <line x1="40" y1="40" x2="24" y2="40" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
        <line x1="40" y1="40" x2="56" y2="40" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
        <line x1="40" y1="24" x2="40" y2="8" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
        <line x1="56" y1="40" x2="72" y2="40" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
        <line x1="40" y1="56" x2="40" y2="72" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
        <line x1="24" y1="40" x2="8" y2="40" stroke="#c9a96e" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>
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
        <line x1="10" y1="52" x2="28" y2="42" stroke="#c9a96e" strokeWidth="1.3" strokeLinecap="round" opacity="0.75"/>
        <line x1="12" y1="60" x2="32" y2="48" stroke="#c9a96e" strokeWidth="1.1" strokeLinecap="round" opacity="0.6"/>
      </svg>
      <div className="t-name">AeroFrame Chassis</div>
      <div className="t-desc">Precision-engineered aluminium structures and thermally conductive composites transform the speaker body into an active thermal management system — maintaining performance under sustained high power.</div>
      <a href="/technology#aeroframe" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card">
      <div className="t-bar"></div>
      <svg className="t-icon" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M44 18 L24 18 Q16 18 16 26 L16 44 Q16 52 24 52 L44 52" stroke="#c9a96e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M42 26 L28 26 Q24 26 24 30 L24 40 Q24 44 28 44 L42 44" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55"/>
        <line x1="44" y1="18" x2="54" y2="18" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="62" cy="10" r="2.2" fill="#c9a96e" opacity="0.9"/>
        <line x1="44" y1="52" x2="54" y2="52" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="62" cy="60" r="2.2" fill="#c9a96e" opacity="0.9"/>
      </svg>
      <div className="t-name">XS-Flow</div>
      <div className="t-desc">Ultra-low turbulence port geometry developed through computational fluid dynamics. Eliminates port noise at high SPL without sacrificing bass extension or dynamic range.</div>
      <a href="/technology#xs-flow" className="t-lnk">Learn more →</a>
    </div>
    <div className="tech-card" style={{borderRight:'none'}}>
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

<canvas className="wave-divider" id="wd2" height="28" aria-hidden="true" style={{display:'block',width:'100%',height:'28px'}}></canvas>

<section className="setup-teaser reveal">
  <div className="setup-inner">
    <div className="setup-left">
      <div className="sec-ey">System Builder</div>
      <div className="sec-h-wrap"><div className="sec-h" style={{marginBottom:'20px'}}>Find Your<br />Perfect System</div><div className="sec-draw-line"></div></div>
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

<canvas className="wave-divider" id="wd3" height="28" aria-hidden="true" style={{display:'block',width:'100%',height:'28px'}}></canvas>

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

<canvas className="wave-divider" id="wd4" height="28" aria-hidden="true" style={{display:'block',width:'100%',height:'28px'}}></canvas>

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

<ContactForm />
    </>
  )
}
