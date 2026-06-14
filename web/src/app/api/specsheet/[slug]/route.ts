// web/src/app/api/specsheet/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

// ── Helpers (identical to brochure) ───────────────────────────────────────────
function sanityImgUrl(ref: string, w = 600) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=70`
}
async function imgB64(ref: string | null, w = 600): Promise<string> {
  if (!ref) return ''
  try {
    const r = await fetch(sanityImgUrl(ref, w))
    if (!r.ok) return ''
    const buf = Buffer.from(await r.arrayBuffer())
    return `data:${r.headers.get('content-type')||'image/jpeg'};base64,${buf.toString('base64')}`
  } catch { return '' }
}
function getRef(o: any): string { return o?.asset?._ref || '' }
function fileCdn(id: string) {
  const b = id.replace('file-', ''), i = b.lastIndexOf('-')
  return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${b.slice(0,i)}.${b.slice(i+1)}`
}
function publicFileB64(relPath: string, mime = 'image/png'): string {
  try {
    const p = path.join(process.cwd(), 'public', relPath)
    if (!fs.existsSync(p)) return ''
    return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`
  } catch { return '' }
}

// Load fonts from fonts/ folder next to this route file (same as brochure)
function loadFontCss(): string {
  const fontDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'fonts')
  const map: [string, string, string, string][] = [
    ['Cormorant Garamond', '300', 'normal', 'Cormorant-Light.ttf'],
    ['Cormorant Garamond', '400', 'italic', 'Cormorant-Italic.ttf'],
    ['Cormorant Garamond', '600', 'normal', 'Cormorant-SemiBold.ttf'],
    ['DM Sans', '400', 'normal', 'DMSans-Reg.ttf'],
    ['DM Sans', '700', 'normal', 'DMSans-Bold.ttf'],
    ['DM Mono', '400', 'normal', 'DMMono-Regular.ttf'],
    ['DM Mono', '500', 'normal', 'DMMono-Medium.ttf'],
  ]
  let css = ''
  for (const [family, weight, style, fname] of map) {
    const p = path.join(fontDir, fname)
    if (fs.existsSync(p)) {
      const b64 = fs.readFileSync(p).toString('base64')
      css += `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url('data:font/truetype;base64,${b64}') format('truetype');}\n`
    }
  }
  const mwPath = path.join(process.cwd(), 'public', 'fonts', 'MagmaWave.otf')
  if (fs.existsSync(mwPath)) {
    const b64 = fs.readFileSync(mwPath).toString('base64')
    css += `@font-face{font-family:'MagmaWave';src:url('data:font/otf;base64,${b64}') format('opentype');}\n`
  }
  return css
}

const TECH_ICON_FILES: Record<string, string> = {
  'psysculpt':            'tech-icons/psysculpt.png',
  'xs-flow':              'tech-icons/xs-flow.png',
  'nano resonance':       'tech-icons/nano-resonance.png',
  'precisionxover array': 'tech-icons/precisionxover-array.png',
  'aeroframe chassis':    'tech-icons/aeroframe-chassis.png',
  'powerdense dynamics':  'tech-icons/powerdense-dynamics.png',
}
function techIconB64(badge: string): string {
  const key = badge.toLowerCase().replace(/™/g,'').replace(/\s+/g,' ').trim()
  for (const [k, file] of Object.entries(TECH_ICON_FILES)) {
    if (key.includes(k) || k.includes(key.split(' ')[0])) return publicFileB64(file)
  }
  return ''
}

// ── SVG Chart generators ───────────────────────────────────────────────────────
function svgFreqResponse(sensDb: number, fLow: number, fHigh: number, eq: any[]): string {
  const W=560, H=200, PL=40, PR=10, PT=10, PB=30
  const gw=W-PL-PR, gh=H-PT-PB
  const FMIN=20, FMAX=25000, DBMIN=60, DBMAX=110
  const fx=(f:number)=>PL+Math.log10(f/FMIN)/Math.log10(FMAX/FMIN)*gw
  const fy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const gridFs=[50,100,200,500,1000,2000,5000,10000,20000]
  const gridDBs=[70,80,90,100]
  let grid='', labels=''
  for(const f of gridFs){
    const x=fx(f).toFixed(1)
    grid+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="#1a1917" stroke-width="0.5"/>`
    labels+=`<text x="${x}" y="${PT+gh+12}" text-anchor="middle" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">${f>=1000?f/1000+'k':f}</text>`
  }
  for(const db of gridDBs){
    const y=fy(db).toFixed(1)
    grid+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="#1a1917" stroke-width="0.5"/>`
    labels+=`<text x="${PL-3}" y="${parseFloat(y)+3}" text-anchor="end" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">${db}</text>`
  }
  // Simplified frequency response curve
  const pts:string[]=[]
  const freqs=[...Array(200)].map((_,i)=>FMIN*Math.pow(FMAX/FMIN,i/199))
  for(const f of freqs){
    let db=sensDb
    if(f<fLow*1.5) db-=6*Math.log10(fLow*1.5/Math.max(f,1))
    if(f>fHigh*0.8) db-=4*Math.log10(f/(fHigh*0.8))
    db=Math.max(DBMIN+1,Math.min(DBMAX-1,db))
    pts.push(`${fx(f).toFixed(1)},${fy(db).toFixed(1)}`)
  }
  const fillPts=`${PL},${PT+gh} ${pts.join(' ')} ${PL+gw},${PT+gh}`
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="${W}" height="${H}" fill="#0e0e0d"/>
    ${grid}
    <polygon points="${fillPts}" fill="rgba(201,169,110,0.08)"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
    ${labels}
    <text x="${PL}" y="${H-2}" font-family="DM Mono,monospace" font-size="6" fill="#6b6760">Hz</text>
    <text x="${PL-28}" y="${PT+gh/2}" font-family="DM Mono,monospace" font-size="6" fill="#6b6760" transform="rotate(-90,${PL-28},${PT+gh/2})">dB SPL</text>
  </svg>`
}

function svgPolar(dirH: number, dirV: number): string {
  const W=560, H=220, CX=W/2, CY=H/2, R=90
  const rings=[R*0.33,R*0.66,R]
  let grid='', labels=''
  for(const r of rings){
    grid+=`<circle cx="${CX}" cy="${CY}" r="${r.toFixed(1)}" fill="none" stroke="#1a1917" stroke-width="0.5"/>`
  }
  for(let a=0;a<360;a+=30){
    const rad=a*Math.PI/180
    grid+=`<line x1="${CX}" y1="${CY}" x2="${(CX+R*Math.sin(rad)).toFixed(1)}" y2="${(CY-R*Math.cos(rad)).toFixed(1)}" stroke="#1a1917" stroke-width="0.5"/>`
  }
  const beamPoly=(bw:number,col:string,opacity:number)=>{
    const hw=bw/2*Math.PI/180
    const pts:string[]=[]
    for(let i=-90;i<=90;i+=2){
      const a=i*Math.PI/180
      const mag=Math.exp(-0.5*Math.pow(a/hw,2))
      pts.push(`${(CX+R*mag*Math.sin(a)).toFixed(1)},${(CY-R*mag*Math.cos(a)).toFixed(1)}`)
    }
    return `<polyline points="${CX},${CY} ${pts.join(' ')} ${CX},${CY}" fill="${col}" fill-opacity="${opacity}" stroke="${col}" stroke-width="1" stroke-opacity="0.8"/>`
  }
  labels+=`<text x="${CX}" y="${CY-R-6}" text-anchor="middle" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">0°</text>`
  labels+=`<text x="${CX+R+4}" y="${CY+3}" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">90°</text>`
  labels+=`<text x="${CX-R-4}" y="${CY+3}" text-anchor="end" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">-90°</text>`
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="${W}" height="${H}" fill="#0e0e0d"/>
    ${grid}
    ${beamPoly(dirH,'#c9a96e',0.12)}
    ${beamPoly(dirV,'#5b8db8',0.10)}
    <line x1="${CX}" y1="${PT||10}" x2="${CX}" y2="${H-10}" stroke="#2a2927" stroke-width="0.5"/>
    <line x1="10" y1="${CY}" x2="${W-10}" y2="${CY}" stroke="#2a2927" stroke-width="0.5"/>
    ${labels}
    <text x="16" y="${H-8}" font-family="DM Mono,monospace" font-size="7" fill="#c9a96e">■</text>
    <text x="24" y="${H-8}" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">H ${dirH}°</text>
    <text x="80" y="${H-8}" font-family="DM Mono,monospace" font-size="7" fill="#5b8db8">■</text>
    <text x="88" y="${H-8}" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">V ${dirV}°</text>
  </svg>`
}

function svgSPL(sens: number, powerRms: number, powerPeak: number): string {
  const W=560,H=200,PL=42,PR=10,PT=10,PB=30
  const gw=W-PL-PR, gh=H-PT-PB
  const DMIN=0.5, DMAX=20, DBMIN=50, DBMAX=120
  const dx=(d:number)=>PL+Math.log10(d/DMIN)/Math.log10(DMAX/DMIN)*gw
  const dy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const dists=[0.5,1,2,3,5,10,20]
  let grid='',labels=''
  for(const d of dists){
    const x=dx(d).toFixed(1)
    grid+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="#1a1917" stroke-width="0.5"/>`
    labels+=`<text x="${x}" y="${PT+gh+12}" text-anchor="middle" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">${d}m</text>`
  }
  for(const db of [60,70,80,90,100,110]){
    const y=dy(db).toFixed(1)
    grid+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="#1a1917" stroke-width="0.5"/>`
    labels+=`<text x="${PL-3}" y="${parseFloat(y)+3}" text-anchor="end" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">${db}</text>`
  }
  const curve=(pwr:number)=>{
    const pts=dists.map(d=>{
      const db=Math.min(DBMAX-1,Math.max(DBMIN+1,sens+10*Math.log10(pwr)-20*Math.log10(d)))
      return `${dx(d).toFixed(1)},${dy(db).toFixed(1)}`
    })
    return pts.join(' ')
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="${W}" height="${H}" fill="#0e0e0d"/>
    ${grid}
    <polyline points="${curve(powerRms)}" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
    <polyline points="${curve(powerPeak)}" fill="none" stroke="#dfc060" stroke-width="1" stroke-dasharray="5,2"/>
    ${labels}
    <text x="${PL+10}" y="${H-8}" font-family="DM Mono,monospace" font-size="7" fill="#c9a96e">— RMS (${powerRms}W)</text>
    <text x="${PL+110}" y="${H-8}" font-family="DM Mono,monospace" font-size="7" fill="#dfc060">– – Peak (${powerPeak}W)</text>
  </svg>`
}

function svgEQ(eq: any[]): string {
  const W=560,H=200,PL=40,PR=10,PT=10,PB=30
  const gw=W-PL-PR, gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBMIN=-20,DBMAX=10
  const fx=(f:number)=>PL+Math.log10(f/FMIN)/Math.log10(FMAX/FMIN)*gw
  const fy=(db:number)=>PT+gh/2-(db/(DBMAX-DBMIN))*gh
  let grid='',labels=''
  for(const f of [50,100,200,500,1000,2000,5000,10000,20000]){
    const x=fx(f).toFixed(1)
    grid+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="#1a1917" stroke-width="0.5"/>`
    labels+=`<text x="${x}" y="${PT+gh+12}" text-anchor="middle" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">${f>=1000?f/1000+'k':f}</text>`
  }
  for(const db of [-15,-10,-5,0,5]){
    const y=fy(db).toFixed(1)
    grid+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${db===0?'#2a2927':'#1a1917'}" stroke-width="${db===0?'0.8':'0.5'}"/>`
    labels+=`<text x="${PL-3}" y="${parseFloat(y)+3}" text-anchor="end" font-family="DM Mono,monospace" font-size="7" fill="#6b6760">${db>0?'+':''}${db}</text>`
  }
  if(!eq.length) {
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <rect width="${W}" height="${H}" fill="#0e0e0d"/>${grid}${labels}
      <line x1="${PL}" y1="${fy(0).toFixed(1)}" x2="${PL+gw}" y2="${fy(0).toFixed(1)}" stroke="#c9a96e" stroke-width="1.5"/>
    </svg>`
  }
  const freqs=[...Array(300)].map((_,i)=>FMIN*Math.pow(FMAX/FMIN,i/299))
  const total=freqs.map(f=>{
    let db=0
    for(const band of eq){
      if(band.type==='HP'){
        if(f<band.freq) db-=12*Math.log10(band.freq/f)
      } else if(band.gain!=null){
        const bw=band.q||1, ratio=f/band.freq
        const response=band.gain/(1+bw*Math.pow(Math.log10(ratio),2))
        db+=response
      }
    }
    return db
  })
  const pts=freqs.map((f,i)=>`${fx(f).toFixed(1)},${fy(Math.max(DBMIN+0.5,Math.min(DBMAX-0.5,total[i]))).toFixed(1)}`).join(' ')
  const fill=`${PL},${fy(0).toFixed(1)} ${pts} ${PL+gw},${fy(0).toFixed(1)}`
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="${W}" height="${H}" fill="#0e0e0d"/>
    ${grid}
    <polygon points="${fill}" fill="rgba(201,169,110,0.08)"/>
    <polyline points="${pts}" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
    ${labels}
    <line x1="${PL}" y1="${fy(0).toFixed(1)}" x2="${PL+gw}" y2="${fy(0).toFixed(1)}" stroke="#2a2927" stroke-width="0.8"/>
  </svg>`
}

// ── Page builders ──────────────────────────────────────────────────────────────
function pageHeader(name: string, pageNum: string) {
  return `<div class="ph"><span class="phl">XSCACE · ${name.toUpperCase()}</span><span class="phn">${pageNum}</span></div>`
}

function footer(num: number, total: number) {
  return `<div class="ft"><span class="ftl">XSCACE · xscace.com</span><span class="ftc"></span><span class="ftr">${num} / ${total}</span></div>`
}

function specRows(specs: Record<string,string>) {
  return Object.entries(specs).map(([l,v])=>
    `<div class="sr"><span class="sl">${l}</span><span class="sv">${v}</span></div>`
  ).join('')
}

const PT = 10  // needed in svgPolar fallback ref

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  try {
    // 1. Fetch product
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription, series, skuBase,
      sensitivityDb, powerRmsW, powerPeakW, impedanceOhms, splMaxDb, thdN,
      freqLowHz, freqHighHz, freqQualifier, directivityHDeg, directivityVDeg,
      heightMm, widthMm, depthMm, weightKg, driverDescription, crossoverType,
      housingMaterial, grilleMaterial, speakerWireConnector, wireGaugeRecommended,
      ipRating, mountingMethods, launchYear, eqData, eqProfileName, specConfidence,
      proprietaryTechBadges, heroImage,
      specSheetRef, specSheetHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // 2. Cache check
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.sensitivityDb}${P.depthMm}v1ts`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.specSheetRef && P.specSheetHash === h) {
      const cdn = fileCdn(P.specSheetRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) return NextResponse.redirect(cdn, 302)
    }

    // 3. Hero image
    const hero = await imgB64(getRef(P.heroImage), 500)

    // 4. Fonts
    const fontCss = loadFontCss()

    // 5. Parse EQ data
    const eq: any[] = []
    for (const line of (P.eqData || '').split('\n').slice(1)) {
      const p = line.trim().split(',')
      if (p.length < 2) continue
      if (p[0] === 'HP' || p[0] === 'LP') {
        eq.push({ type: p[0], freq: parseFloat(p[1]), gain: null, q: parseFloat(p[2]||'0.7') })
      } else {
        eq.push({ type: p[2]||'PK', freq: parseFloat(p[0]), gain: parseFloat(p[1]), q: parseFloat(p[3]||'1') })
      }
    }

    // 6. Tech badges
    const tech = (P.proprietaryTechBadges || '').split(',')
      .map((b:string) => b.trim().replace(/™/g,'').replace(/\s+/g,' ').trim()).filter(Boolean)
    const techData = tech.map((badge:string) => ({ name: badge, img: techIconB64(badge) }))

    // 7. Spec tables
    const sA: Record<string,string> = {}
    if (P.powerRmsW)       sA['Power RMS']    = `${P.powerRmsW}W`
    if (P.powerPeakW)      sA['Power Peak']   = `${P.powerPeakW}W`
    if (P.sensitivityDb)   sA['Sensitivity']  = `${P.sensitivityDb} dB`
    if (P.freqHighHz)      sA['Frequency']    = `${P.freqLowHz}Hz – ${Math.round(P.freqHighHz/1000)}kHz ${P.freqQualifier||''}`.trim()
    if (P.impedanceOhms)   sA['Impedance']    = `${P.impedanceOhms}Ω`
    if (P.splMaxDb)        sA['Max SPL']      = `${P.splMaxDb} dB`
    if (P.thdN)            sA['THD+N']        = P.thdN
    if (P.driverDescription) sA['Drivers']   = P.driverDescription
    if (P.crossoverType)   sA['Crossover']    = P.crossoverType
    if (P.directivityHDeg) sA['Directivity']  = `${P.directivityHDeg}° H × ${P.directivityVDeg}° V`

    const sP: Record<string,string> = {}
    if (P.heightMm)  sP['H × W × D']  = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
    if (P.weightKg)  sP['Weight']      = `${P.weightKg} kg`
    if (P.housingMaterial)      sP['Housing']   = P.housingMaterial
    if (P.grilleMaterial)       sP['Grille']    = P.grilleMaterial
    if (P.ipRating)             sP['IP Rating'] = P.ipRating
    if (P.mountingMethods)      sP['Mounting']  = P.mountingMethods
    if (P.speakerWireConnector) sP['Connector'] = P.speakerWireConnector
    if (P.wireGaugeRecommended) sP['Wire']      = P.wireGaugeRecommended

    // 8. Charts (inline SVG)
    const chartFR    = svgFreqResponse(P.sensitivityDb||90, P.freqLowHz||80, P.freqHighHz||20000, eq)
    const chartPolar = svgPolar(P.directivityHDeg||140, P.directivityVDeg||25)
    const chartSPL   = svgSPL(P.sensitivityDb||90, P.powerRmsW||1, P.powerPeakW||1)
    const chartEQ    = svgEQ(eq)

    // 9. Tech descriptions
    const TECH_DESC: Record<string,string> = {
      'psysculpt':            'Built on the ADAU1701 DSP, PsySculpt implements a psychoacoustically aware EQ curve based on Fletcher-Munson equal-loudness contours, applying dynamic pre-compensation so tonal balance stays consistent from background listening levels to concert SPL.',
      'xs-flow':              'Micro-waveguide geometry is precision-machined into the internal face of each enclosure. XS-Flow channels the rearward acoustic wave around the magnet structure, reducing compression and harmonic distortion at high excursion.',
      'nano resonance':       'By engineering an intentionally heavy cone mass, Nano Resonance forces the natural resonant frequency well below the target passband, allowing genuine low-frequency extension from an enclosure only 12-23mm deep.',
      'precisionxover array': 'Each crossover network is assembled with air-core inductors, polypropylene film capacitors and metal-film resistors. Component matching is held to +/-0.5 dB for inaudible channel-to-channel variation.',
      'aeroframe chassis':    '6061 aerospace-grade aluminium is machined to form the speaker structural chassis, acting as a passive heatsink that draws heat away from the voice coil through direct thermal coupling to the body.',
      'powerdense dynamics':  'The voice coil is wound with a copper-silver composite conductor, allowing significantly higher continuous power in the same former diameter, raising the thermal ceiling without increasing coil mass or inductance.',
    }

    const techRows = techData.map(({name, img}:{name:string,img:string}) => {
      const key = name.toLowerCase().replace(/\s+/g,' ')
      let desc = ''
      for (const [k,d] of Object.entries(TECH_DESC)) {
        if (key.includes(k) || k.includes(key.split(' ')[0])) { desc=d; break }
      }
      return `<div class="tr">
        <div class="ti">${img ? `<img src="${img}" class="timg">` : `<div class="tph"></div>`}</div>
        <div class="td">
          <div class="tn">${name}</div>
          <div class="tdesc">${desc}</div>
        </div>
      </div>`
    }).join('')

    // 10. Build HTML — 5 pages
    // Page 1: Cover | Page 2: Specs | Page 3: Freq+Polar | Page 4: SPL+EQ | Page 5: Tech
    const TOTAL = 5
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:210mm}
.page{width:210mm;min-height:297mm;position:relative;background:#090909;page-break-after:always;display:flex;flex-direction:column}
.page:last-child{page-break-after:auto}

/* ── Cover ── */
.cvr{position:relative;width:210mm;height:297mm;overflow:hidden}
.cvr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35}
.cvr-grad{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(9,9,9,0) 0%,rgba(9,9,9,.7) 50%,#090909 100%)}
.cvr-top{position:absolute;top:0;left:0;right:0;height:3px;background:#c9a96e}
.cvr-bot{position:absolute;bottom:0;left:0;right:0;height:3px;background:#c9a96e}
.cvr-content{position:absolute;bottom:0;left:0;right:0;padding:0 18mm 16mm}
.cvr-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:14px;color:#c9a96e;letter-spacing:.06em;margin-bottom:6px}
.cvr-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:56px;color:#eeebe5;line-height:1;margin-bottom:6px}
.cvr-tag{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-style:italic;color:#c9a96e;margin-bottom:16px}
.cvr-rule{height:1px;background:rgba(201,169,110,.4);margin-bottom:16px}
.cvr-stats{display:flex;gap:20px;margin-bottom:16px}
.cvr-stat{display:flex;flex-direction:column}
.cvr-sv{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;color:#c9a96e;line-height:1}
.cvr-sl{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.2em;color:#7a776f;margin-top:3px;text-transform:uppercase}
.cvr-meta{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;letter-spacing:.1em;text-transform:uppercase}

/* ── Page chrome ── */
.top-bar{height:3px;background:#c9a96e;flex-shrink:0}
.bot-bar{height:3px;background:#c9a96e;flex-shrink:0;margin-top:auto}
.ph{display:flex;justify-content:space-between;padding:8px 18mm 6px;border-bottom:.3px solid rgba(255,255,255,.04);flex-shrink:0}
.phl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phn{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835}
.ft{display:flex;justify-content:space-between;padding:6px 18mm 8px;border-top:.3px solid rgba(255,255,255,.04);flex-shrink:0;margin-top:auto}
.ftl,.ftr{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f}

/* ── Specs page ── */
.pg-body{padding:10px 18mm 0;flex:1;display:flex;flex-direction:column}
.pg-h{font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:300;color:#eeebe5;margin-bottom:12px;line-height:1}
.sg{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:3px;margin:8px 0 3px}
.sr{display:flex;justify-content:space-between;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.sl{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.sv{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right;max-width:58%}
.specs-cols{display:flex;gap:12px;flex:1}
.specs-col{flex:1}

/* ── Chart pages ── */
.chart-wrap{margin:6px 18mm;background:#0e0e0d;border:.4px solid rgba(201,169,110,.07);overflow:hidden;flex-shrink:0}
.chart-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:300;color:#eeebe5;padding:8px 18mm 2px}
.chart-sub{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;padding:0 18mm 4px}

/* ── Tech page ── */
.tr{display:flex;gap:10px;padding:8px 0;border-bottom:.3px solid rgba(255,255,255,.06)}
.tr:last-child{border-bottom:none}
.ti{flex-shrink:0;width:10mm;display:flex;align-items:flex-start;padding-top:1px}
.timg{width:10mm;height:10mm;object-fit:contain}
.tph{width:10mm;height:10mm;background:rgba(201,169,110,.08);border:.4px solid rgba(201,169,110,.2);border-radius:1px}
.td{flex:1}
.tn{font-family:'DM Sans',Helvetica,sans-serif;font-weight:700;font-size:8px;color:#c9a96e;margin-bottom:3px}
.tdesc{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.55}
</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cvr">
    <div class="cvr-top"></div>
    ${hero ? `<img src="${hero}" class="cvr-img">` : ''}
    <div class="cvr-grad"></div>
    <div class="cvr-content">
      <div class="cvr-brand">XSCACE</div>
      <div class="cvr-name">${P.productName}</div>
      <div class="cvr-tag">${P.tagline || ''}</div>
      <div class="cvr-rule"></div>
      <div class="cvr-stats">
        ${[
          P.powerRmsW    ? {v:`${P.powerRmsW}W`,        l:'Power RMS'}    : null,
          P.sensitivityDb? {v:`${P.sensitivityDb}dB`,    l:'Sensitivity'}  : null,
          P.impedanceOhms? {v:`${P.impedanceOhms}Ω`,    l:'Impedance'}    : null,
          P.depthMm      ? {v:`${P.depthMm}mm`,          l:'Depth'}        : null,
        ].filter(Boolean).map((s:any)=>
          `<div class="cvr-stat"><div class="cvr-sv">${s.v}</div><div class="cvr-sl">${s.l}</div></div>`
        ).join('')}
      </div>
      <div class="cvr-meta">${P.series || ''} · ${P.skuBase || ''} · ${P.specConfidence || 'Lab Verified'}</div>
    </div>
    <div class="cvr-bot"></div>
  </div>
</div>

<!-- PAGE 2: SPECIFICATIONS -->
<div class="page">
  <div class="top-bar"></div>
  ${pageHeader(P.productName, `01 — ${TOTAL}`)}
  <div class="pg-body">
    <div class="pg-h">Technical Specifications</div>
    <div class="specs-cols">
      <div class="specs-col">
        <div class="sg">Acoustic</div>${specRows(sA)}
      </div>
      <div class="specs-col">
        <div class="sg">Physical</div>${specRows(sP)}
      </div>
    </div>
  </div>
  ${footer(2, TOTAL)}
  <div class="bot-bar"></div>
</div>

<!-- PAGE 3: FREQUENCY RESPONSE + DIRECTIVITY -->
<div class="page">
  <div class="top-bar"></div>
  ${pageHeader(P.productName, `02 — ${TOTAL}`)}
  <div class="chart-title">Frequency Response</div>
  <div class="chart-sub">On-axis · 1W / 1m · anechoic · ${P.freqLowHz}Hz – ${Math.round((P.freqHighHz||20000)/1000)}kHz ${P.freqQualifier||''}</div>
  <div class="chart-wrap" style="height:155px">${chartFR}</div>
  <div class="chart-title">Directivity</div>
  <div class="chart-sub">H ${P.directivityHDeg}° / V ${P.directivityVDeg}° · –6 dB points</div>
  <div class="chart-wrap" style="height:155px">${chartPolar}</div>
  ${footer(3, TOTAL)}
  <div class="bot-bar"></div>
</div>

<!-- PAGE 4: SPL vs DISTANCE + EQ -->
<div class="page">
  <div class="top-bar"></div>
  ${pageHeader(P.productName, `03 — ${TOTAL}`)}
  <div class="chart-title">SPL vs Distance</div>
  <div class="chart-sub">Inverse square law · Ref: ${P.sensitivityDb}dB @ 1m/1W · Max: ${P.powerPeakW}W</div>
  <div class="chart-wrap" style="height:155px">${chartSPL}</div>
  <div class="chart-title">Recommended EQ</div>
  <div class="chart-sub">Profile: ${P.eqProfileName || 'Default'} · RBJ biquad cascade · fs = 48kHz</div>
  <div class="chart-wrap" style="height:155px">${chartEQ}</div>
  ${footer(4, TOTAL)}
  <div class="bot-bar"></div>
</div>

<!-- PAGE 5: PROPRIETARY TECHNOLOGIES -->
<div class="page">
  <div class="top-bar"></div>
  ${pageHeader(P.productName, `04 — ${TOTAL}`)}
  <div class="pg-body">
    <div class="pg-h">Proprietary Technologies</div>
    <div class="sg">Exclusive engineering innovations inside every XSCACE product</div>
    ${techRows}
  </div>
  ${footer(5, TOTAL)}
  <div class="bot-bar"></div>
</div>

</body></html>`

    // 11. Puppeteer — identical to brochure
    const puppeteer = (await import('puppeteer-core')).default
    const chromium  = (await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode = false

    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--single-process', '--disable-gpu'],
      executablePath: await chromium.executablePath(
        process.env.CHROMIUM_PACK_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar'
      ),
      headless: true,
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.emulateMediaType('print')
    const pdf = Buffer.from(await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    }))
    await browser.close()

    // 12. Upload + cache
    if (process.env.SANITY_API_TOKEN && pdf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g,'_')}_SpecSheet.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          { method:'POST', headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/pdf' }, body:pdf }
        )
        if (up.ok) {
          const {document:doc} = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method:'POST',
            headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/json' },
            body: JSON.stringify({mutations:[{patch:{id:P._id,set:{specSheetRef:doc._id,specSheetHash:h,specSheet:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})
          })
        }
      } catch(e){ console.error('[specsheet] cache failed',e) }
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="XSCACE_${slug}_SpecSheet.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-cache',
      }
    })
  } catch(err:any) {
    console.error('[specsheet]', err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
