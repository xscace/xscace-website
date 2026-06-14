// web/src/app/api/specsheet/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

// ── Utilities ─────────────────────────────────────────────────────────────────
function fileCdn(id: string) {
  const b = id.replace('file-',''), i = b.lastIndexOf('-')
  return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${b.slice(0,i)}.${b.slice(i+1)}`
}
function publicFileB64(relPath: string, mime='image/png'): string {
  try {
    const p = path.join(process.cwd(),'public',relPath)
    if (!fs.existsSync(p)) return ''
    return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`
  } catch { return '' }
}
function loadFontCss(): string {
  const fontDir = path.join(path.dirname(new URL(import.meta.url).pathname),'fonts')
  const map: [string,string,string,string][] = [
    ['Cormorant Garamond','300','normal','Cormorant-Light.ttf'],
    ['Cormorant Garamond','400','italic','Cormorant-Italic.ttf'],
    ['Cormorant Garamond','600','normal','Cormorant-SemiBold.ttf'],
    ['DM Sans','400','normal','DMSans-Reg.ttf'],
    ['DM Sans','700','normal','DMSans-Bold.ttf'],
    ['DM Mono','400','normal','DMMono-Regular.ttf'],
    ['DM Mono','500','normal','DMMono-Medium.ttf'],
  ]
  let css = ''
  for (const [family,weight,style,fname] of map) {
    const p = path.join(fontDir,fname)
    if (fs.existsSync(p)) css += `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url('data:font/truetype;base64,${fs.readFileSync(p).toString('base64')}') format('truetype');}\n`
  }
  const mw = path.join(process.cwd(),'public','fonts','MagmaWave.otf')
  if (fs.existsSync(mw)) css += `@font-face{font-family:'MagmaWave';src:url('data:font/otf;base64,${fs.readFileSync(mw).toString('base64')}') format('opentype');}\n`
  return css
}
const TECH_ICON_FILES: Record<string,string> = {
  'psysculpt':'tech-icons/psysculpt.png','xs-flow':'tech-icons/xs-flow.png',
  'nano resonance':'tech-icons/nano-resonance.png','precisionxover array':'tech-icons/precisionxover-array.png',
  'aeroframe chassis':'tech-icons/aeroframe-chassis.png','powerdense dynamics':'tech-icons/powerdense-dynamics.png',
}
function techIconB64(badge: string): string {
  const key = badge.toLowerCase().replace(/™/g,'').replace(/\s+/g,' ').trim()
  for (const [k,file] of Object.entries(TECH_ICON_FILES))
    if (key.includes(k)||k.includes(key.split(' ')[0])) return publicFileB64(file)
  return ''
}
async function imgB64(ref: string|null, w=600): Promise<string> {
  if (!ref) return ''
  try {
    const b=ref.replace(/^image-/,'').split('-'), ext=b.pop()!, dims=b.pop()!, hash=b.join('-')
    const r = await fetch(`https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=80`)
    if (!r.ok) return ''
    return `data:${r.headers.get('content-type')||'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
  } catch { return '' }
}
function getRef(o: any): string { return o?.asset?._ref||'' }

// ── RBJ Biquad ────────────────────────────────────────────────────────────────
function biquadCoefs(kind: string, f0: number, gainDb: number, Q: number, fs=48000): number[] {
  const A=Math.pow(10,gainDb/40), w0=2*Math.PI*f0/fs, cw=Math.cos(w0), sw=Math.sin(w0), alpha=sw/(2*Q)
  let b0=1,b1=0,b2=0,a0=1,a1=0,a2=0
  if (kind==='HP'){b0=(1+cw)/2;b1=-(1+cw);b2=(1+cw)/2;a0=1+alpha;a1=-2*cw;a2=1-alpha}
  else if (kind==='LP'){b0=(1-cw)/2;b1=(1-cw);b2=(1-cw)/2;a0=1+alpha;a1=-2*cw;a2=1-alpha}
  else if (kind==='PK'){b0=1+alpha*A;b1=-2*cw;b2=1-alpha*A;a0=1+alpha/A;a1=-2*cw;a2=1-alpha/A}
  else if (kind==='LS'){const s=2*Math.sqrt(A)*alpha;b0=A*((A+1)-(A-1)*cw+s);b1=2*A*((A-1)-(A+1)*cw);b2=A*((A+1)-(A-1)*cw-s);a0=(A+1)+(A-1)*cw+s;a1=-2*((A-1)+(A+1)*cw);a2=(A+1)+(A-1)*cw-s}
  else if (kind==='HS'){const s=2*Math.sqrt(A)*alpha;b0=A*((A+1)+(A-1)*cw+s);b1=-2*A*((A-1)+(A+1)*cw);b2=A*((A+1)+(A-1)*cw-s);a0=(A+1)-(A-1)*cw+s;a1=2*((A-1)-(A+1)*cw);a2=(A+1)-(A-1)*cw-s}
  return [b0/a0,b1/a0,b2/a0,1,a1/a0,a2/a0]
}
function biquadMagDb(coefs: number[], f: number, fs=48000): number {
  const [b0,b1,b2,,a1,a2]=coefs, w=2*Math.PI*f/fs
  const rh=b0+b1*Math.cos(w)+b2*Math.cos(2*w), ih=-b1*Math.sin(w)-b2*Math.sin(2*w)
  const rd=1+a1*Math.cos(w)+a2*Math.cos(2*w), id=-a1*Math.sin(w)-a2*Math.sin(2*w)
  return 10*Math.log10(Math.max((rh*rh+ih*ih)/(rd*rd+id*id),1e-30))
}

// ── Smooth bezier path (Catmull-Rom → cubic bezier) ──────────────────────────
// This is exactly the same algorithm as the product page canvas charts
function catmullRomPath(pts: [number,number][], tension=0.5): string {
  if (pts.length<2) return ''
  let d=`M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
  for (let i=0;i<pts.length-1;i++) {
    const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)]
    const cp1x=p1[0]+(p2[0]-p0[0])*tension/3
    const cp1y=p1[1]+(p2[1]-p0[1])*tension/3
    const cp2x=p2[0]-(p3[0]-p1[0])*tension/3
    const cp2y=p2[1]-(p3[1]-p1[1])*tension/3
    d+=` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  return d
}

// Log-frequency x mapping
function logX(f: number, fMin: number, fMax: number, w: number, offX=0): number {
  return offX+Math.log10(f/fMin)/Math.log10(fMax/fMin)*w
}

// ── CHART COLORS ──────────────────────────────────────────────────────────────
const CH='#c9a96e', CH2='rgba(201,169,110,0.08)', BLU='#5b8db8', GRID='#151412', GRID2='#1e1c1a', MUTED='#6b6760', BG='#0c0b0a'

// ── FREQ RESPONSE ─────────────────────────────────────────────────────────────
function chartFreqResponse(sens: number, fLow: number, fHigh: number, eq: any[]): string {
  const W=1120,H=480,PL=52,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBMIN=58,DBMAX=108
  const fx=(f:number)=>PL+logX(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const cy=(db:number)=>Math.max(PT+1,Math.min(PT+gh-1,fy(db)))

  // 800 log-spaced frequencies for very smooth curve
  const N=800
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))

  // Acoustic response model
  // Low-end: 12dB/oct Butterworth rolloff centred at fLow
  // High-end: gentle air absorption rolloff above fHigh
  // Baffle step: +1.5dB around 600Hz-2kHz for wall-mount speaker
  const acousticDb=(f:number)=>{
    let db=sens
    // Low end 2nd-order high-pass at fLow
    const normLo=f/fLow
    db+=10*Math.log10(Math.pow(normLo,4)/(1+Math.pow(normLo,4)))
    // Gentle high end rolloff
    if(f>fHigh*0.7){
      const normHi=f/fHigh
      db-=Math.max(0,10*Math.log10(1+Math.pow(normHi*0.9,4)))
    }
    // Slight baffle step / room interaction peak
    if(f>300&&f<4000){
      const peak=Math.exp(-0.5*Math.pow(Math.log(f/900)/Math.log(3),2))
      db+=1.2*peak
    }
    return db
  }

  // Apply EQ filters
  const filterCoefsList = eq.map(b=>{
    if(b.type==='HP') return biquadCoefs('HP',b.freq,0,b.q||0.707)
    if(b.type==='LP') return biquadCoefs('LP',b.freq,0,b.q||0.707)
    return biquadCoefs(b.type||'PK',b.freq,b.gain||0,b.q||1)
  })

  const totalDb=(f:number)=>{
    let db=acousticDb(f)
    for(const c of filterCoefsList) db+=biquadMagDb(c,f)
    return db
  }

  // Sample points — every 4th for path, all for fill
  const pts: [number,number][] = freqs.map(f=>[fx(f),cy(totalDb(f))])
  // Subsample to ~200 points for smoother bezier (too many points = overfitting)
  const step=Math.max(1,Math.floor(pts.length/200))
  const sampled: [number,number][] = pts.filter((_,i)=>i%step===0||i===pts.length-1)

  const curvePath=catmullRomPath(sampled)
  const fillPath=`${curvePath} L${(PL+gw).toFixed(1)},${(PT+gh).toFixed(1)} L${PL},${(PT+gh).toFixed(1)} Z`

  // Grid
  const gridFs=[20,30,50,100,200,500,1000,2000,5000,10000,20000]
  const gridDBs=[60,65,70,75,80,85,90,95,100,105]
  let gridSvg=''
  for(const f of gridFs){
    const x=fx(f).toFixed(1)
    const isMajor=f===20||f===100||f===1000||f===10000
    gridSvg+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    const lbl=f>=1000?`${f/1000}k`:String(f)
    gridSvg+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${lbl}</text>`
  }
  for(const db of gridDBs){
    const y=fy(db).toFixed(1)
    const isMajor=db%10===0
    gridSvg+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    if(isMajor) gridSvg+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db}</text>`
  }

  // Sensitivity reference dashed
  const sensY=fy(sens).toFixed(1)

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="clip-fr"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${gridSvg}
  <g clip-path="url(#clip-fr)">
    <path d="${fillPath}" fill="${CH2}"/>
    <line x1="${PL}" y1="${sensY}" x2="${PL+gw}" y2="${sensY}" stroke="${CH}" stroke-width="0.6" stroke-dasharray="8,5" opacity="0.35"/>
    <path d="${curvePath}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Hz</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB SPL</text>
  <text x="${PL+gw}" y="${parseFloat(sensY)-6}" text-anchor="end" fill="${CH}" fill-opacity="0.5" font-size="10" font-family="DM Mono,monospace">${sens} dB ref</text>
</svg>`
}

// ── POLAR DIRECTIVITY ─────────────────────────────────────────────────────────
function chartPolar(dirH: number, dirV: number): string {
  const W=1120,H=520,CX=W/2,CY=H/2+10,R=210
  const toR=(d:number)=>d*Math.PI/180

  // Gaussian beam at given half-angle bandwidth (-6dB points)
  // sigma = bw/(2*sqrt(2*ln(2))) for true -6dB Gaussian
  const beamPath=(bwDeg: number, col: string, fillOp: number, strokeOp: number, sw: number)=>{
    const sigma=bwDeg/2/1.1775  // convert -6dB half-angle to gaussian sigma
    const pts: string[]=[]
    // Front hemisphere 180 degrees
    for(let i=0;i<=360;i++){
      const deg=i-180
      const rad=toR(deg)
      const mag=Math.exp(-0.5*Math.pow(deg/sigma,2))
      const r=R*Math.max(0,mag)
      pts.push(`${(CX+r*Math.sin(rad)).toFixed(2)},${(CY-r*Math.cos(rad)).toFixed(2)}`)
    }
    return `<path d="M ${pts.join(' L ')} Z" fill="${col}" fill-opacity="${fillOp}" stroke="${col}" stroke-width="${sw}" stroke-opacity="${strokeOp}" stroke-linejoin="round"/>`
  }

  // Multi-frequency overlay: 500Hz (widest), 1kHz, 2kHz, 4kHz, 8kHz (narrowest)
  // Beamwidth narrows with frequency — approx proportional to sqrt(1000/f)
  const hFreqs=[{f:8000,factor:0.35},{f:4000,factor:0.5},{f:2000,factor:0.65},{f:1000,factor:1.0}]
  const vFreqs=[{f:4000,factor:0.4},{f:1000,factor:1.0}]

  let beams=''
  for(const {factor} of hFreqs.slice().reverse()){
    const bw=Math.min(170,dirH*Math.sqrt(factor))
    beams+=beamPath(bw,CH,0.04,0.3,0.6)
  }
  // Main 1kHz H beam
  beams+=beamPath(dirH,CH,0.14,0.95,2.2)
  // V beams (blue)
  for(const {factor} of vFreqs.slice().reverse()){
    const bw=Math.min(170,dirV*Math.sqrt(factor))
    beams+=beamPath(bw,BLU,0.03,0.25,0.5)
  }
  beams+=beamPath(dirV,BLU,0.10,0.85,1.6)

  // Grid rings
  let gridSvg=''
  for(const r of [R*0.25,R*0.5,R*0.75,R]){
    gridSvg+=`<circle cx="${CX}" cy="${CY}" r="${r.toFixed(1)}" fill="none" stroke="${GRID2}" stroke-width="0.6"/>`
    if(r<R){
      const dbLabel=Math.round(-20*Math.log10(R/r))
      gridSvg+=`<text x="${(CX+r+4).toFixed(1)}" y="${(CY+3).toFixed(1)}" fill="${MUTED}" font-size="9" font-family="DM Mono,monospace">${dbLabel}dB</text>`
    }
  }
  for(let a=0;a<360;a+=30){
    const rad=toR(a)
    gridSvg+=`<line x1="${CX.toFixed(1)}" y1="${CY.toFixed(1)}" x2="${(CX+R*Math.sin(rad)).toFixed(1)}" y2="${(CY-R*Math.cos(rad)).toFixed(1)}" stroke="${GRID}" stroke-width="0.5"/>`
  }
  // Axis labels
  gridSvg+=`<text x="${CX}" y="${CY-R-10}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">0°</text>`
  gridSvg+=`<text x="${CX+R+14}" y="${CY+4}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">90°</text>`
  gridSvg+=`<text x="${CX-R-14}" y="${CY+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">−90°</text>`

  // Legend
  const legY=H-16
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${gridSvg}
  ${beams}
  <line x1="${CX}" y1="${CY-R-6}" x2="${CX}" y2="${CY+R+6}" stroke="${GRID2}" stroke-width="0.7"/>
  <rect x="40" y="${legY-9}" width="26" height="2.5" fill="${CH}"/>
  <text x="72" y="${legY+1}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">H ${dirH}° (−6dB, 1 kHz)</text>
  <rect x="320" y="${legY-9}" width="20" height="2.5" fill="${BLU}"/>
  <text x="346" y="${legY+1}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">V ${dirV}° (−6dB, 1 kHz)</text>
  <text x="${W-40}" y="${legY+1}" text-anchor="end" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Gaussian beam model · multi-frequency overlay</text>
</svg>`
}

// ── SPL vs DISTANCE ───────────────────────────────────────────────────────────
function chartSPL(sens: number, powerRms: number, powerPeak: number): string {
  const W=1120,H=480,PL=54,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const DMIN=0.3,DMAX=25,DBMIN=48,DBMAX=128
  const dx=(d:number)=>PL+logX(d,DMIN,DMAX,gw)
  const dy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const cy=(db:number)=>Math.max(PT+1,Math.min(PT+gh-1,dy(db)))

  const dists=[0.3,0.5,0.75,1,1.5,2,3,4,5,6,8,10,12,15,20,25]
  const splAt=(d:number,pwr:number)=>sens+10*Math.log10(pwr)-20*Math.log10(d)

  // Grid
  let gridSvg=''
  for(const d of [0.5,1,2,5,10,20]){
    const x=dx(d).toFixed(1)
    gridSvg+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${GRID2}" stroke-width="0.8"/>`
    gridSvg+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${d}m</text>`
  }
  for(const db of [60,70,80,90,100,110,120]){
    const y=dy(db).toFixed(1)
    gridSvg+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${db===90||db===100?GRID2:GRID}" stroke-width="${db===90||db===100?'0.8':'0.4'}"/>`
    gridSvg+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db}</text>`
  }

  // Curve points
  const rmsP: [number,number][]=dists.map(d=>[dx(d),cy(splAt(d,powerRms))])
  const peakP: [number,number][]=dists.map(d=>[dx(d),cy(splAt(d,powerPeak))])

  const rmsCurve=catmullRomPath(rmsP,0.4)
  const peakCurve=catmullRomPath(peakP,0.4)
  const rmsFill=`${rmsCurve} L${(PL+gw).toFixed(1)},${(PT+gh).toFixed(1)} L${PL},${(PT+gh).toFixed(1)} Z`

  const splRms=Math.round(splAt(1,powerRms))
  const splPeak=Math.round(splAt(1,powerPeak))

  // Hearing damage ref
  const damageY=dy(85).toFixed(1)

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="clip-spl"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${gridSvg}
  <g clip-path="url(#clip-spl)">
    <line x1="${PL}" y1="${damageY}" x2="${PL+gw}" y2="${damageY}" stroke="${CH}" stroke-width="0.7" stroke-dasharray="10,6" opacity="0.2"/>
    <path d="${rmsFill}" fill="${CH2}"/>
    <path d="${rmsCurve}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${peakCurve}" fill="none" stroke="#dfc060" stroke-width="1.5" stroke-dasharray="10,4" stroke-linecap="round"/>
  </g>
  ${gridSvg.match(/<text[^>]*>\d+m<\/text>/g)||[]}
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Distance</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB SPL</text>
  <text x="${parseFloat(damageY)}" y="${parseFloat(damageY)-5}" fill="${MUTED}" font-size="9" font-family="DM Mono,monospace" opacity="0.45">85 dB — hearing risk</text>
  <rect x="40" y="${H-18}" width="28" height="2.5" fill="${CH}"/>
  <text x="74" y="${H-13}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">RMS ${powerRms}W · ${splRms} dB @ 1m</text>
  <rect x="340" y="${H-18}" width="22" height="2.5" fill="#dfc060"/>
  <text x="368" y="${H-13}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">Peak ${powerPeak}W · ${splPeak} dB @ 1m</text>
</svg>`
}

// ── EQ RESPONSE ───────────────────────────────────────────────────────────────
function chartEQ(eq: any[]): string {
  const W=1120,H=380,PL=52,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBMIN=-18,DBMAX=12
  const fx=(f:number)=>PL+logX(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+(gh/2)-(db/((DBMAX-DBMIN)/2))*(gh/2)
  const cy=(db:number)=>Math.max(PT+1,Math.min(PT+gh-1,fy(db)))
  const zeroY=(PT+gh/2).toFixed(1)

  const N=600
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))

  let gridSvg=''
  for(const f of [20,30,50,100,200,500,1000,2000,5000,10000,20000]){
    const x=fx(f).toFixed(1)
    const isMajor=f===100||f===1000||f===10000
    gridSvg+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    gridSvg+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${f>=1000?f/1000+'k':f}</text>`
  }
  for(const db of [-12,-9,-6,-3,0,3,6,9]){
    const y=fy(db).toFixed(1)
    gridSvg+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${db===0?'#2a2826':GRID}" stroke-width="${db===0?'1':'0.4'}"/>`
    gridSvg+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db>0?'+':''}${db}</text>`
  }

  if(!eq.length){
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${gridSvg}
  <line x1="${PL}" y1="${zeroY}" x2="${PL+gw}" y2="${zeroY}" stroke="${CH}" stroke-width="2.5"/>
  <text x="${W/2}" y="${H/2+4}" text-anchor="middle" fill="${MUTED}" font-size="14" font-family="DM Sans,sans-serif">Flat — No EQ applied</text>
</svg>`
  }

  // Per-band coefs
  const allCoefs=eq.map(b=>{
    if(b.type==='HP') return {coef:biquadCoefs('HP',b.freq,0,b.q||0.707),band:b}
    if(b.type==='LP') return {coef:biquadCoefs('LP',b.freq,0,b.q||0.707),band:b}
    return {coef:biquadCoefs(b.type||'PK',b.freq,b.gain||0,b.q||1),band:b}
  })

  // Individual band paths (dashed)
  const bandCols=['rgba(201,169,110,0.65)','rgba(91,141,184,0.65)','rgba(160,111,192,0.65)','rgba(111,172,96,0.65)']
  let bandSvg=''
  allCoefs.forEach(({coef,band},bi)=>{
    const bpts: [number,number][]=[]
    const step=Math.max(1,Math.floor(freqs.length/150))
    freqs.filter((_,i)=>i%step===0||i===freqs.length-1).forEach(f=>{
      bpts.push([fx(f),cy(biquadMagDb(coef,f))])
    })
    const bpath=catmullRomPath(bpts,0.45)
    const col=bandCols[bi%bandCols.length]
    bandSvg+=`<path d="${bpath}" fill="none" stroke="${col}" stroke-width="1.2" stroke-dasharray="8,4"/>`
    // Label at the band frequency
    const labelX=fx(band.freq), labelDb=band.gain!=null?band.gain:0
    const labelY=cy(labelDb*0.5)
    const lbl=band.type==='HP'?`HP`:band.type==='LP'?`LP`:(band.gain>0?'+':'')+band.gain+'dB'
    bandSvg+=`<circle cx="${labelX.toFixed(1)}" cy="${cy(biquadMagDb(coef,band.freq)).toFixed(1)}" r="3.5" fill="${col}"/>`
    bandSvg+=`<text x="${labelX.toFixed(1)}" y="${(labelY-8).toFixed(1)}" text-anchor="middle" fill="${col}" font-size="9.5" font-family="DM Mono,monospace">${lbl}</text>`
  })

  // Total combined response
  const totalPts: [number,number][]=[]
  const step=Math.max(1,Math.floor(freqs.length/200))
  freqs.filter((_,i)=>i%step===0||i===freqs.length-1).forEach(f=>{
    const db=allCoefs.reduce((sum,{coef})=>sum+biquadMagDb(coef,f),0)
    totalPts.push([fx(f),cy(db)])
  })
  const totalPath=catmullRomPath(totalPts,0.45)
  const fillPath=`${totalPath} L${(PL+gw).toFixed(1)},${zeroY} L${PL},${zeroY} Z`

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="clip-eq"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${gridSvg}
  <g clip-path="url(#clip-eq)">
    ${bandSvg}
    <path d="${fillPath}" fill="${CH2}"/>
    <line x1="${PL}" y1="${zeroY}" x2="${PL+gw}" y2="${zeroY}" stroke="#2a2826" stroke-width="0.8"/>
    <path d="${totalPath}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Hz</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB</text>
</svg>`
}

// ── EQ FILTER TABLE ───────────────────────────────────────────────────────────
function eqFilterTable(eq: any[], profileName: string): string {
  if(!eq.length) return `<div class="eq-empty">No EQ filters defined — response is flat.</div>`
  const rows=eq.map((b:any,i:number)=>{
    const freqLabel=b.freq>=1000?`${(b.freq/1000).toFixed(1)} kHz`:`${b.freq} Hz`
    const gainLabel=b.gain!=null?(b.gain>0?'+':'')+b.gain+' dB':'—'
    return `<div class="eq-row">
      <div class="eq-cell eq-num">${i+1}</div>
      <div class="eq-cell">${b.type}</div>
      <div class="eq-cell">${freqLabel}</div>
      <div class="eq-cell">${gainLabel}</div>
      <div class="eq-cell">${b.q||'—'}</div>
    </div>`
  }).join('')
  return `<div class="eq-table">
    <div class="eq-head">
      <div class="eq-cell eq-num">#</div>
      <div class="eq-cell">Type</div>
      <div class="eq-cell">Frequency</div>
      <div class="eq-cell">Gain</div>
      <div class="eq-cell">Q</div>
    </div>
    ${rows}
  </div>
  <div class="eq-note">Profile: ${profileName} · RBJ biquad cascade · fs = 48 kHz (ADAU1701 DSP)</div>`
}

// ── PAGE CHROME ───────────────────────────────────────────────────────────────
function pageHdr(name: string, n: number, total: number): string {
  return `<div class="ph"><span class="phl">XSCACE · ${name.toUpperCase()}</span><span class="phn">${n} / ${total}</span></div>`
}
function pageFtr(): string {
  return `<div class="ft"><span class="ftl">XSCACE · xscace.com · support@xscace.com</span><span class="ftr">Technical Specification Document</span></div>`
}
function sr(label: string, value: string): string {
  if(!value||value==='—') return `<div class="sr sr-empty"><span class="sl">${label}</span><span class="sv">—</span></div>`
  return `<div class="sr"><span class="sl">${label}</span><span class="sv">${value}</span></div>`
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params
  try {
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id,productName,productFullName,tagline,shortDescription,series,skuBase,skuVariants,
      sensitivityDb,powerRmsW,powerPeakW,impedanceOhms,splMaxDb,thdN,
      freqLowHz,freqHighHz,freqQualifier,directivityHDeg,directivityVDeg,
      heightMm,widthMm,depthMm,diameterMm,weightKg,driverDescription,crossoverType,crossoverFrequency,
      housingMaterial,grilleMaterial,speakerWireConnector,wireGaugeRecommended,
      ipRating,mountingMethods,launchYear,fireRating,paintableGrille,
      eqData,eqProfileName,specConfidence,proprietaryTechBadges,
      heroImage,specSheetRef,specSheetHash
    }`)
    if(!P) return NextResponse.json({error:'Product not found'},{status:404})

    // Cache
    const h=Buffer.from(`${P.productName}${P.powerRmsW}${P.sensitivityDb}${P.eqData||''}v3ss`).toString('base64').replace(/\W/g,'').slice(0,12)
    if(P.specSheetRef&&P.specSheetHash===h){
      const cdn=fileCdn(P.specSheetRef)
      const head=await fetch(cdn,{method:'HEAD'}).catch(()=>null)
      if(head&&(head.ok||head.status===403)) return NextResponse.redirect(cdn,302)
    }

    const hero=await imgB64(getRef(P.heroImage),600)
    const fontCss=loadFontCss()

    // Parse EQ
    const eq: any[]=[]
    for(const line of (P.eqData||'').split('\n').slice(1)){
      const p=line.trim().split(',')
      if(p.length<2) continue
      if(p[0]==='HP'||p[0]==='LP') eq.push({type:p[0],freq:parseFloat(p[1]),gain:null,q:parseFloat(p[2]||'0.707')})
      else if(!isNaN(parseFloat(p[0]))) eq.push({type:p[2]||'PK',freq:parseFloat(p[0]),gain:parseFloat(p[1]),q:parseFloat(p[3]||'1')})
    }

    // Tech badges
    const tech=(P.proprietaryTechBadges||'').split(',').map((b:string)=>b.trim().replace(/™/g,'').replace(/\s+/g,' ').trim()).filter(Boolean)
    const TECH_DESC: Record<string,string>={
      'psysculpt':'ADAU1701 DSP implementing Fletcher-Munson equal-loudness compensation. Pre-Comp → Loudness L&H → Post-Comp → Log-Decay Peak Detector → Dynamic Bass → DAC. Tonal balance stays consistent from background levels to concert SPL.',
      'xs-flow':'Micro-waveguide geometry precision-machined into the enclosure interior. Channels the rearward acoustic wave around the magnet structure, reducing compression and harmonic distortion at high excursion.',
      'nano resonance':'Intentionally heavy cone mass forces the natural resonant frequency well below the target passband — genuine low-frequency extension from an enclosure only 12–23 mm deep, defying Hoffman\'s Iron Law.',
      'precisionxover array':'Air-core inductors, polypropylene film capacitors and metal-film resistors. Component matching held to ±0.5 dB for inaudible channel-to-channel variation across the array.',
      'aeroframe chassis':'6061 aerospace aluminium machined as the structural chassis, acting as a passive heatsink drawing heat away from the voice coil through direct thermal coupling — no fans, no thermal compression.',
      'powerdense dynamics':'Copper-silver composite voice coil conductor. Significantly higher continuous power in the same former diameter — higher thermal ceiling without increasing coil mass or inductance.',
    }

    // Charts
    const sens=P.sensitivityDb||90
    const frChart=chartFreqResponse(sens,P.freqLowHz||100,P.freqHighHz||20000,eq)
    const polChart=chartPolar(P.directivityHDeg||140,P.directivityVDeg||25)
    const splChart=chartSPL(sens,P.powerRmsW||1,P.powerPeakW||2)
    const eqChart=chartEQ(eq)
    const eqTable=eqFilterTable(eq,P.eqProfileName||'Default')

    // Dimensions string
    const dims=P.diameterMm?`⌀ ${P.diameterMm} mm`:`${P.heightMm||'—'} × ${P.widthMm||'—'} × ${P.depthMm||'—'} mm`

    const TOTAL=tech.length>0?7:6

    // ── CSS ──────────────────────────────────────────────────────────────────
    const css=`
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;overflow:hidden;background:#090909;page-break-after:always;display:flex;flex-direction:column}
.page:last-child{page-break-after:auto}

/* ── Cover ── */
.cvr{position:relative;width:100%;height:100%;overflow:hidden;flex:1}
.cvr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.28}
.cvr-grad{position:absolute;inset:0;background:linear-gradient(to right,#090909 42%,rgba(9,9,9,0.55) 72%,rgba(9,9,9,0.05) 100%)}
.cvr-topbar{position:absolute;top:0;left:0;right:0;height:3px;background:#c9a96e;z-index:2}
.cvr-botbar{position:absolute;bottom:0;left:0;right:0;height:3px;background:#c9a96e;z-index:2}
.cvr-left{position:absolute;left:0;top:0;bottom:0;width:56%;padding:22px 0 20px 18mm;display:flex;flex-direction:column}
.cvr-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:15px;color:#c9a96e;letter-spacing:.05em;margin-bottom:5px}
.cvr-eyebrow{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.2em;color:#7a776f;text-transform:uppercase;margin-bottom:auto}
.cvr-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:76px;color:#eeebe5;line-height:1;margin-bottom:4px}
.cvr-tag{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-style:italic;color:#c9a96e;margin-bottom:16px}
.cvr-rule{height:1px;background:rgba(201,169,110,0.38);width:260px;margin-bottom:16px}
.cvr-stats{display:flex;gap:24px;margin-bottom:16px}
.cvr-sv{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#c9a96e;line-height:1}
.cvr-sl{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.18em;color:#7a776f;margin-top:3px;text-transform:uppercase}
.cvr-meta{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;letter-spacing:.1em;text-transform:uppercase;margin-top:auto;padding-top:10px;border-top:.4px solid rgba(201,169,110,.15)}

/* ── Page chrome ── */
.topbar{height:3px;background:#c9a96e;flex-shrink:0}
.botbar{height:3px;background:#c9a96e;flex-shrink:0;margin-top:auto}
.ph{display:flex;justify-content:space-between;padding:7px 18mm 5px;border-bottom:.3px solid rgba(255,255,255,.05);flex-shrink:0}
.phl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phn{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835}
.ft{display:flex;justify-content:space-between;padding:5px 18mm 7px;border-top:.3px solid rgba(255,255,255,.05);flex-shrink:0;margin-top:auto}
.ftl,.ftr{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f}

/* ── Specs page ── */
.spec-body{padding:8px 18mm 0;flex:1;display:flex;flex-direction:column;min-height:0}
.spec-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#eeebe5;margin-bottom:10px;line-height:1}
.spec-cols{display:flex;gap:14px;flex:1;min-height:0}
.spec-col{flex:1;overflow:hidden}
.sg{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:2.5px;margin:7px 0 2px}
.sg:first-child{margin-top:0}
.sr{display:flex;justify-content:space-between;align-items:baseline;padding:2px 0;border-bottom:.25px solid rgba(255,255,255,.04)}
.sr-empty .sv{color:#3a3835}
.sl{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;flex-shrink:0;padding-right:6px}
.sv{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right}

/* ── Chart pages ── */
.chart-body{padding:8px 18mm 0;flex:1;display:flex;flex-direction:column;min-height:0}
.chart-h{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:300;color:#eeebe5;line-height:1;flex-shrink:0}
.chart-sub{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;margin:3px 0 5px;flex-shrink:0}
.chart-wrap{flex:1;min-height:0;background:#0c0b0a;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex}
.chart-wrap svg{width:100%;height:100%}

/* ── EQ table ── */
.eq-table{flex-shrink:0;margin-top:7px}
.eq-head,.eq-row{display:grid;grid-template-columns:22px 68px 1fr 80px 60px;border-bottom:.3px solid rgba(255,255,255,.05)}
.eq-head{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.12em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:3px;margin-bottom:1px}
.eq-row{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5}
.eq-cell{padding:2.5px 0}
.eq-num{color:#7a776f}
.eq-note{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;margin-top:5px}
.eq-empty{font-family:'DM Mono',monospace;font-size:9px;color:#7a776f;padding:10px 0}

/* ── Tech page ── */
.tech-body{padding:8px 18mm 0;flex:1;display:flex;flex-direction:column;min-height:0}
.tech-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#eeebe5;margin-bottom:10px}
.tech-rows{flex:1;display:flex;flex-direction:column;gap:0}
.tech-row{display:flex;gap:10px;padding:7px 0;border-bottom:.3px solid rgba(255,255,255,.05);flex-shrink:0}
.tech-row:last-child{border-bottom:none}
.tech-icon{flex-shrink:0;width:12mm;display:flex;align-items:flex-start;padding-top:1px}
.tech-img{width:12mm;height:12mm;object-fit:contain}
.tech-ph{width:12mm;height:12mm;background:rgba(201,169,110,.07);border:.4px solid rgba(201,169,110,.16)}
.tech-text{flex:1}
.tech-name{font-family:'DM Sans',Helvetica,sans-serif;font-weight:700;font-size:8.5px;color:#c9a96e;margin-bottom:2px}
.tech-desc{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.6}
`

    // ── HTML ─────────────────────────────────────────────────────────────────
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cvr">
    <div class="cvr-topbar"></div>
    ${hero?`<img src="${hero}" class="cvr-img">`:''}
    <div class="cvr-grad"></div>
    <div class="cvr-left">
      <div class="cvr-brand">XSCACE</div>
      <div class="cvr-eyebrow">Technical Specification Document</div>
      <div class="cvr-name">${P.productName}</div>
      <div class="cvr-tag">${P.tagline||''}</div>
      <div class="cvr-rule"></div>
      <div class="cvr-stats">
        ${([
          P.powerRmsW?{v:`${P.powerRmsW} W`,l:'Power RMS'}:null,
          P.sensitivityDb?{v:`${P.sensitivityDb} dB`,l:'Sensitivity'}:null,
          P.impedanceOhms?{v:`${P.impedanceOhms} Ω`,l:'Impedance'}:null,
          P.depthMm?{v:`${P.depthMm} mm`,l:'Depth'}:null,
        ] as any[]).filter(Boolean).map((s:any)=>`<div><div class="cvr-sv">${s.v}</div><div class="cvr-sl">${s.l}</div></div>`).join('')}
      </div>
      <div class="cvr-meta">${P.series||''} · ${P.skuBase||''} · ${P.specConfidence||'Lab Verified'} · ${P.launchYear||2022}</div>
    </div>
    <div class="cvr-botbar"></div>
  </div>
</div>

<!-- PAGE 2: SPECIFICATIONS — full page, two columns -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,2,TOTAL)}
  <div class="spec-body">
    <div class="spec-title">Technical Specifications</div>
    <div class="spec-cols">
      <div class="spec-col">
        <div class="sg">Acoustic Performance</div>
        ${sr('Power RMS',P.powerRmsW?`${P.powerRmsW} W`:'—')}
        ${sr('Power Peak',P.powerPeakW?`${P.powerPeakW} W`:'—')}
        ${sr('Sensitivity',P.sensitivityDb?`${P.sensitivityDb} dB / 1W / 1m`:'—')}
        ${sr('Impedance',P.impedanceOhms?`${P.impedanceOhms} Ω`:'—')}
        ${sr('Max SPL',P.splMaxDb?`${P.splMaxDb} dB`:'—')}
        ${sr('THD+N',P.thdN||'—')}
        ${sr('Frequency Range',P.freqHighHz?`${P.freqLowHz} Hz – ${Math.round(P.freqHighHz/1000)} kHz ${P.freqQualifier||''}`:'—')}
        ${sr('Directivity H',P.directivityHDeg?`${P.directivityHDeg}° (−6 dB, 1 kHz)`:'—')}
        ${sr('Directivity V',P.directivityVDeg?`${P.directivityVDeg}° (−6 dB, 1 kHz)`:'—')}
        ${sr('Driver Config',P.driverDescription||'—')}
        ${sr('Crossover',P.crossoverType||'—')}
        ${sr('Crossover Freq',P.crossoverFrequency?`${P.crossoverFrequency} Hz`:'—')}
        ${sr('EQ Profile',P.eqProfileName||'Default')}
        ${sr('Spec Confidence',P.specConfidence||'—')}
        <div class="sg">Connectivity</div>
        ${sr('Connector',P.speakerWireConnector||'—')}
        ${sr('Wire Gauge',P.wireGaugeRecommended||'—')}
      </div>
      <div class="spec-col">
        <div class="sg">Physical</div>
        ${sr('Dimensions',dims)}
        ${sr('Weight',P.weightKg?`${P.weightKg} kg`:'—')}
        ${sr('Housing',P.housingMaterial||'—')}
        ${sr('Grille',P.grilleMaterial||'—')}
        ${sr('Paintable Grille',P.paintableGrille!=null?(P.paintableGrille?'Yes':'No'):'—')}
        <div class="sg">Environmental</div>
        ${sr('IP Rating',P.ipRating||'—')}
        ${sr('Fire Rating',P.fireRating||'—')}
        ${sr('Mounting',P.mountingMethods||'—')}
        <div class="sg">Colour & Finish</div>
        ${sr('Finishes',P.colorsStandard||'—')}
        ${sr('Custom RAL',P.customRalAvailable?'Available':'—')}
        ${sr('Marine Treat.',P.marineTreatable?'Available':'—')}
        <div class="sg">Product</div>
        ${sr('Series',P.series||'—')}
        ${sr('SKU',P.skuBase||'—')}
        ${sr('Variants',P.skuVariants||'—')}
        ${sr('Since',P.launchYear?String(P.launchYear):'—')}
      </div>
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 3: FREQUENCY RESPONSE — full page -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,3,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Frequency Response</div>
    <div class="chart-sub">On-axis · 1W / 1m · anechoic · ${P.freqLowHz}Hz – ${Math.round((P.freqHighHz||20000)/1000)}kHz ${P.freqQualifier||''} · ${P.sensitivityDb}dB sensitivity · recommended EQ applied</div>
    <div class="chart-wrap">${frChart}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 4: DIRECTIVITY — full page -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,4,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Directivity Pattern</div>
    <div class="chart-sub">Normalised polar response · H ${P.directivityHDeg}° / V ${P.directivityVDeg}° at −6 dB · 1 kHz reference · multi-frequency overlay (1–8 kHz)</div>
    <div class="chart-wrap">${polChart}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 5: SPL vs DISTANCE — full page -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,5,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">SPL vs Distance</div>
    <div class="chart-sub">Inverse square law · Ref: ${P.sensitivityDb} dB / 1W / 1m · free field anechoic · ${P.powerRmsW}W RMS / ${P.powerPeakW}W Peak</div>
    <div class="chart-wrap">${splChart}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 6: EQ — chart + filter table -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,6,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Recommended EQ</div>
    <div class="chart-sub">Combined biquad cascade response (bold) with individual filter contributions (dashed)</div>
    <div class="chart-wrap" style="flex:1;min-height:0">${eqChart}</div>
    ${eqTable}
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

${tech.length>0?`<!-- PAGE 7: TECHNOLOGIES -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,7,TOTAL)}
  <div class="tech-body">
    <div class="tech-title">Proprietary Technologies</div>
    <div class="tech-rows">
      ${tech.map((badge:string)=>{
        const img=techIconB64(badge)
        const key=badge.toLowerCase().replace(/\s+/g,' ')
        let desc=''
        for(const [k,d] of Object.entries(TECH_DESC)) if(key.includes(k)||k.includes(key.split(' ')[0])){desc=d;break}
        return `<div class="tech-row">
          <div class="tech-icon">${img?`<img src="${img}" class="tech-img">`:`<div class="tech-ph"></div>`}</div>
          <div class="tech-text"><div class="tech-name">${badge}</div><div class="tech-desc">${desc}</div></div>
        </div>`
      }).join('')}
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>`:''}

</body></html>`

    // ── PUPPETEER ─────────────────────────────────────────────────────────────
    const puppeteer=(await import('puppeteer-core')).default
    const chromium=(await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode=false
    const browser=await puppeteer.launch({
      args:[...chromium.args,'--no-sandbox','--single-process','--disable-gpu'],
      executablePath:await chromium.executablePath(
        process.env.CHROMIUM_PACK_URL||'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar'
      ),
      headless:true,
    })
    const page=await browser.newPage()
    await page.setViewport({width:1587,height:1123,deviceScaleFactor:1})
    await page.setContent(html,{waitUntil:'domcontentloaded',timeout:15000})
    await page.emulateMediaType('print')
    const pdf=Buffer.from(await page.pdf({
      width:'297mm',height:'210mm',printBackground:true,
      margin:{top:'0',right:'0',bottom:'0',left:'0'},
    }))
    await browser.close()

    // Cache to Sanity
    if(process.env.SANITY_API_TOKEN&&pdf.length>1000){
      try{
        const fname=`XSCACE_${P.productName.replace(/\s+/g,'_')}_SpecSheet.pdf`
        const up=await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          {method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/pdf'},body:pdf})
        if(up.ok){
          const {document:doc}=await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`,
            {method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/json'},
             body:JSON.stringify({mutations:[{patch:{id:P._id,set:{specSheetRef:doc._id,specSheetHash:h,specSheet:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})})
        }
      }catch(e){console.error('[specsheet] cache failed',e)}
    }

    return new NextResponse(pdf,{status:200,headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':`inline; filename="XSCACE_${slug}_SpecSheet.pdf"`,
      'Content-Length':String(pdf.length),
      'Cache-Control':'no-cache',
    }})
  }catch(err:any){
    console.error('[specsheet]',err)
    return NextResponse.json({error:err?.message},{status:500})
  }
}
