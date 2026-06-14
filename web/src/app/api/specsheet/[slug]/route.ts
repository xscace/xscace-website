// web/src/app/api/specsheet/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

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
function loadFontCss(): string {
  const fontDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'fonts')
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
    const p = path.join(fontDir, fname)
    if (fs.existsSync(p)) {
      css += `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url('data:font/truetype;base64,${fs.readFileSync(p).toString('base64')}') format('truetype');}\n`
    }
  }
  const mw = path.join(process.cwd(), 'public', 'fonts', 'MagmaWave.otf')
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
    const b = ref.replace(/^image-/,'').split('-'), ext=b.pop()!, dims=b.pop()!, hash=b.join('-')
    const r = await fetch(`https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=75`)
    if (!r.ok) return ''
    return `data:${r.headers.get('content-type')||'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
  } catch { return '' }
}
function getRef(o: any): string { return o?.asset?._ref||'' }

// ── RBJ Biquad filters (proper physics) ────────────────────────────────────────
function rbj(kind: string, f0: number, gainDb: number, Q: number, fs=48000): number[] {
  const A = Math.pow(10, gainDb/40)
  const w0 = 2*Math.PI*f0/fs
  const cw = Math.cos(w0), sw = Math.sin(w0)
  const alpha = sw/(2*Q)
  let b0=1,b1=0,b2=0,a0=1,a1=0,a2=0
  if (kind==='HP') {
    b0=(1+cw)/2; b1=-(1+cw); b2=(1+cw)/2
    a0=1+alpha;  a1=-2*cw;   a2=1-alpha
  } else if (kind==='LP') {
    b0=(1-cw)/2; b1=(1-cw); b2=(1-cw)/2
    a0=1+alpha;  a1=-2*cw;  a2=1-alpha
  } else if (kind==='PK') {
    b0=1+alpha*A; b1=-2*cw; b2=1-alpha*A
    a0=1+alpha/A; a1=-2*cw; a2=1-alpha/A
  } else if (kind==='LS') {
    const s2A=2*Math.sqrt(A)*alpha
    b0=A*((A+1)-(A-1)*cw+s2A); b1=2*A*((A-1)-(A+1)*cw); b2=A*((A+1)-(A-1)*cw-s2A)
    a0=(A+1)+(A-1)*cw+s2A;     a1=-2*((A-1)+(A+1)*cw);  a2=(A+1)+(A-1)*cw-s2A
  } else if (kind==='HS') {
    const s2A=2*Math.sqrt(A)*alpha
    b0=A*((A+1)+(A-1)*cw+s2A); b1=-2*A*((A-1)+(A+1)*cw); b2=A*((A+1)+(A-1)*cw-s2A)
    a0=(A+1)-(A-1)*cw+s2A;     a1=2*((A-1)-(A+1)*cw);    a2=(A+1)-(A-1)*cw-s2A
  }
  return [b0/a0, b1/a0, b2/a0, 1, a1/a0, a2/a0]
}
function biquadResponse(coefs: number[], freqs: number[], fs=48000): number[] {
  const [b0,b1,b2,,a1,a2] = coefs
  return freqs.map(f => {
    const w = 2*Math.PI*f/fs
    const re_h = b0+b1*Math.cos(w)+b2*Math.cos(2*w)
    const im_h = -b1*Math.sin(w)-b2*Math.sin(2*w)
    const re_d = 1+a1*Math.cos(w)+a2*Math.cos(2*w)
    const im_d = -a1*Math.sin(w)-a2*Math.sin(2*w)
    const mag2 = (re_h*re_h+im_h*im_h)/(re_d*re_d+im_d*im_d)
    return 10*Math.log10(Math.max(mag2, 1e-30))
  })
}

// ── SVG Chart helpers ──────────────────────────────────────────────────────────
const C = { bg:'#090909', panel:'#0e0e0d', champ:'#c9a96e', champ2:'#8a6d3f',
             text:'#eeebe5', muted:'#6b6760', border:'#1f1e1c', grid:'#181715',
             blue:'#5b8db8', gold2:'#dfc060' }

function logScale(f: number, fMin: number, fMax: number, w: number): number {
  return Math.log10(f/fMin)/Math.log10(fMax/fMin)*w
}

// Smooth polyline using cubic bezier through points
function smoothPath(pts: [number,number][]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
  for (let i=1; i<pts.length; i++) {
    const prev = pts[i-1], curr = pts[i]
    const prev2 = pts[Math.max(0,i-2)]
    const next = pts[Math.min(pts.length-1,i+1)]
    const cp1x = prev[0]+(curr[0]-prev2[0])/6
    const cp1y = prev[1]+(curr[1]-prev2[1])/6
    const cp2x = curr[0]-(next[0]-prev[0])/6
    const cp2y = curr[1]-(next[1]-prev[1])/6
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${curr[0].toFixed(2)},${curr[1].toFixed(2)}`
  }
  return d
}

// ── CHART: Frequency Response ──────────────────────────────────────────────────
function chartFreq(sensDb: number, fLow: number, fHigh: number, eq: any[]): string {
  const W=800,H=320,PL=50,PR=20,PT=20,PB=40
  const gw=W-PL-PR, gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBMIN=55,DBMAX=105
  const fx=(f:number)=>PL+logScale(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const clampY=(db:number)=>Math.max(PT,Math.min(PT+gh,fy(db)))

  // Generate 400 frequency points
  const N=400
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))

  // Acoustic rolloff model — smooth Butterworth-like rolloffs
  const baseResp=freqs.map(f=>{
    let db=sensDb
    // Low-end 2nd order rolloff
    const flo=fLow*0.7
    if(f<flo*2) db+=20*Math.log10(Math.pow(f/flo,2)/Math.sqrt(1+Math.pow(f/flo,4)))
    // High-end smooth rolloff
    const fhi=fHigh*1.1
    if(f>fhi*0.5) db-=Math.max(0,12*Math.log10(f/fhi))
    // Slight baffle step
    if(f>400&&f<2000) db+=0.8
    return db
  })

  // Apply actual EQ filters
  let totalResp=[...baseResp]
  const filterCoefs: number[][] = []
  for(const band of eq) {
    if(band.type==='HP') {
      const c=rbj('HP',band.freq,0,band.q||0.707)
      const r=biquadResponse(c,freqs)
      totalResp=totalResp.map((v,i)=>v+r[i])
      filterCoefs.push(c)
    } else if(band.type==='LP') {
      const c=rbj('LP',band.freq,0,band.q||0.707)
      const r=biquadResponse(c,freqs)
      totalResp=totalResp.map((v,i)=>v+r[i])
    } else if(band.gain!=null) {
      const c=rbj(band.type||'PK',band.freq,band.gain,band.q||1)
      const r=biquadResponse(c,freqs)
      totalResp=totalResp.map((v,i)=>v+r[i])
    }
  }

  // Grid
  let gridLines='', gridLabels=''
  for(const f of [30,50,100,200,500,1000,2000,5000,10000,20000]) {
    const x=fx(f).toFixed(1)
    gridLines+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${C.grid}" stroke-width="0.8"/>`
    const lbl=f>=1000?`${f/1000}k`:String(f)
    gridLabels+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${lbl}</text>`
  }
  for(const db of [60,65,70,75,80,85,90,95,100]) {
    const y=fy(db).toFixed(1)
    const isMajor=db%10===0
    gridLines+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${isMajor?C.border:C.grid}" stroke-width="${isMajor?0.8:0.4}"/>`
    if(isMajor) gridLabels+=`<text x="${PL-6}" y="${parseFloat(y)+3}" text-anchor="end" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${db}</text>`
  }

  // Main curve
  const pts: [number,number][] = freqs.map((f,i)=>[fx(f),clampY(totalResp[i])])
  const curvePath=smoothPath(pts)
  const fillPts=`${PL},${PT+gh} ${pts.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')} ${PL+gw},${PT+gh}`

  // Reference line at sensitivity
  const sensY=fy(sensDb).toFixed(1)

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.panel}"/>
    ${gridLines}
    <polygon points="${fillPts}" fill="${C.champ}" fill-opacity="0.07"/>
    <path d="${curvePath}" fill="none" stroke="${C.champ}" stroke-width="2" stroke-linejoin="round"/>
    <line x1="${PL}" y1="${sensY}" x2="${PL+gw}" y2="${sensY}" stroke="${C.champ}" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.4"/>
    ${gridLabels}
    <text x="${PL}" y="${H-4}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace">Hz</text>
    <text x="8" y="${PT+gh/2}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace" transform="rotate(-90,8,${PT+gh/2})">dB SPL</text>
    <text x="${PL+gw}" y="${parseFloat(sensY)-4}" text-anchor="end" fill="${C.champ}" fill-opacity="0.6" font-size="8" font-family="DM Mono,monospace">${sensDb}dB ref</text>
  </svg>`
}

// ── CHART: Polar Directivity ───────────────────────────────────────────────────
function chartPolar(dirH: number, dirV: number): string {
  const W=800, H=380, CX=W/2, CY=H/2, R=150
  const toRad=(d:number)=>d*Math.PI/180

  // Generate smooth polar beam — use a raised cosine model
  function beamPattern(bw6dB: number, freqPoints=180): [number,number][][] {
    const sigma=bw6dB/2
    const pts: [number,number][] = []
    for(let i=0; i<=freqPoints; i++) {
      const angleDeg=-90+i*(180/freqPoints)
      const angleRad=toRad(angleDeg)
      // Gaussian beam model
      const mag=Math.exp(-0.5*Math.pow(angleDeg/sigma,2))
      // Smooth to zero at edges with raised cosine window
      const win=0.5+0.5*Math.cos(toRad(angleDeg)*180/bw6dB)
      const r=R*Math.min(1,Math.max(0,mag))
      pts.push([CX+r*Math.sin(angleRad), CY-r*Math.cos(angleRad)])
    }
    pts.unshift([CX,CY])
    pts.push([CX,CY])
    return [pts]
  }

  // Multiple frequency rings for H (250Hz, 1kHz, 4kHz, 8kHz) — narrowing with frequency
  function hBeamAtFreq(f: number): string {
    const narrowing=Math.min(1,1000/f)
    const bw=dirH*Math.sqrt(narrowing)
    const sigma=bw/2
    const pts: string[] = []
    for(let i=0; i<=180; i++) {
      const a=-90+i
      const r=R*Math.exp(-0.5*Math.pow(a/sigma,2))
      const rad=toRad(a)
      pts.push(`${(CX+r*Math.sin(rad)).toFixed(1)},${(CY-r*Math.cos(rad)).toFixed(1)}`)
    }
    return `M ${CX},${CY} L ${pts.join(' L ')} Z`
  }
  function vBeamAtFreq(f: number): string {
    const narrowing=Math.min(1,1000/f)
    const bw=dirV*Math.sqrt(narrowing)
    const sigma=bw/2
    const pts: string[] = []
    for(let i=0; i<=180; i++) {
      const a=-90+i
      const r=R*Math.exp(-0.5*Math.pow(a/sigma,2))
      const rad=toRad(a)
      pts.push(`${(CX+r*Math.sin(rad)).toFixed(1)},${(CY-r*Math.cos(rad)).toFixed(1)}`)
    }
    return `M ${CX},${CY} L ${pts.join(' L ')} Z`
  }

  // Grid
  let rings='',spokeLines='',ringLabels=''
  for(const r of [R*0.25,R*0.5,R*0.75,R]) {
    rings+=`<circle cx="${CX}" cy="${CY}" r="${r.toFixed(1)}" fill="none" stroke="${C.grid}" stroke-width="0.6"/>`
    const db=Math.round(-6*(R/r-1))
    if(r<R) ringLabels+=`<text x="${CX+r+3}" y="${CY+3}" fill="${C.muted}" font-size="7.5" font-family="DM Mono,monospace">${db}dB</text>`
  }
  for(let a=0; a<360; a+=30) {
    const rad=toRad(a)
    spokeLines+=`<line x1="${CX}" y1="${CY}" x2="${(CX+R*Math.sin(rad)).toFixed(1)}" y2="${(CY-R*Math.cos(rad)).toFixed(1)}" stroke="${C.grid}" stroke-width="0.5"/>`
  }
  // Angle labels
  let angleLabels=''
  for(const [a,lbl] of [[-90,'-90°'],[0,'0°'],[90,'90°']] as [number,string][]) {
    const rad=toRad(a), rx=CX+(R+18)*Math.sin(rad), ry=CY-(R+18)*Math.cos(rad)
    angleLabels+=`<text x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${lbl}</text>`
  }

  // Frequency-dependent beams (1kHz main, faded high freq)
  const hMain=hBeamAtFreq(1000), h4k=hBeamAtFreq(4000), h8k=hBeamAtFreq(8000)
  const vMain=vBeamAtFreq(1000), v4k=vBeamAtFreq(4000)

  // Legend
  const legY=H-14
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.panel}"/>
    ${rings}${spokeLines}${ringLabels}${angleLabels}
    <path d="${h8k}" fill="${C.champ}" fill-opacity="0.04" stroke="${C.champ}" stroke-width="0.4" stroke-opacity="0.3"/>
    <path d="${h4k}" fill="${C.champ}" fill-opacity="0.07" stroke="${C.champ}" stroke-width="0.6" stroke-opacity="0.5"/>
    <path d="${hMain}" fill="${C.champ}" fill-opacity="0.13" stroke="${C.champ}" stroke-width="1.8" stroke-opacity="0.9"/>
    <path d="${v4k}" fill="${C.blue}" fill-opacity="0.05" stroke="${C.blue}" stroke-width="0.6" stroke-opacity="0.4"/>
    <path d="${vMain}" fill="${C.blue}" fill-opacity="0.10" stroke="${C.blue}" stroke-width="1.4" stroke-opacity="0.8"/>
    <line x1="${CX}" y1="${PT||20}" x2="${CX}" y2="${H-20}" stroke="${C.border}" stroke-width="0.6"/>
    <text x="${CX+8}" y="${CY-R-4}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace">0°</text>
    <rect x="30" y="${legY-8}" width="20" height="2" fill="${C.champ}"/>
    <text x="56" y="${legY+1}" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">H ${dirH}° (1kHz)</text>
    <rect x="180" y="${legY-8}" width="20" height="2" fill="${C.blue}"/>
    <text x="206" y="${legY+1}" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">V ${dirV}° (1kHz)</text>
    <text x="${W-30}" y="${legY+1}" text-anchor="end" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace">Gaussian beam model · –6dB points</text>
  </svg>`
}

// ── CHART: SPL vs Distance ────────────────────────────────────────────────────
function chartSPL(sens: number, powerRms: number, powerPeak: number): string {
  const W=800,H=320,PL=52,PR=20,PT=20,PB=40
  const gw=W-PL-PR, gh=H-PT-PB
  const DMIN=0.5,DMAX=20,DBMIN=50,DBMAX=122
  const dx=(d:number)=>PL+logScale(d,DMIN,DMAX,gw)
  const dy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const clamp=(db:number)=>Math.max(PT,Math.min(PT+gh,dy(db)))

  const dists=[0.5,0.75,1,1.5,2,3,4,5,6,8,10,12,15,20]
  let gridLines='',gridLabels=''
  for(const d of [0.5,1,2,5,10,20]) {
    const x=dx(d).toFixed(1)
    gridLines+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${C.grid}" stroke-width="0.8"/>`
    gridLabels+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${d}m</text>`
  }
  for(const db of [60,70,80,90,100,110,120]) {
    const y=dy(db).toFixed(1)
    gridLines+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${db===90||db===100?C.border:C.grid}" stroke-width="${db===90||db===100?'0.8':'0.4'}"/>`
    gridLabels+=`<text x="${PL-6}" y="${parseFloat(y)+3}" text-anchor="end" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${db}</text>`
  }

  function curve(pwr: number): string {
    const pts: [number,number][] = dists.map(d=>{
      const db=sens+10*Math.log10(pwr)-20*Math.log10(d)
      return [dx(d), clamp(db)]
    })
    return smoothPath(pts)
  }

  // Pain threshold & hearing damage lines
  const painY=dy(120).toFixed(1)
  const damageY=dy(85).toFixed(1)

  // SPL at 1m labels
  const splRmsAt1=Math.round(sens+10*Math.log10(powerRms))
  const splPeakAt1=Math.round(sens+10*Math.log10(powerPeak))

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.panel}"/>
    ${gridLines}
    <line x1="${PL}" y1="${damageY}" x2="${PL+gw}" y2="${damageY}" stroke="#c9a96e" stroke-width="0.5" stroke-dasharray="6,4" opacity="0.25"/>
    <text x="${PL+gw-4}" y="${parseFloat(damageY)-3}" text-anchor="end" fill="${C.muted}" font-size="7.5" font-family="DM Mono,monospace" opacity="0.5">85 dB — hearing risk</text>
    <path d="${curve(powerRms)}" fill="none" stroke="${C.champ}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${curve(powerPeak)}" fill="none" stroke="${C.gold2}" stroke-width="1.4" stroke-dasharray="7,3" stroke-linecap="round"/>
    ${gridLabels}
    <text x="${PL}" y="${H-4}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace">Distance</text>
    <text x="10" y="${PT+gh/2}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace" transform="rotate(-90,10,${PT+gh/2})">dB SPL</text>
    <rect x="30" y="${H-16}" width="22" height="2" fill="${C.champ}"/>
    <text x="58" y="${H-12}" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">RMS — ${powerRms}W · ${splRmsAt1}dB @ 1m</text>
    <rect x="280" y="${H-16}" width="18" height="2" fill="${C.gold2}" stroke-dasharray="4,3"/>
    <text x="304" y="${H-12}" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">Peak — ${powerPeak}W · ${splPeakAt1}dB @ 1m</text>
  </svg>`
}

// ── CHART: EQ Response ─────────────────────────────────────────────────────────
function chartEQ(eq: any[]): string {
  const W=800,H=320,PL=50,PR=20,PT=20,PB=40
  const gw=W-PL-PR, gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBMIN=-18,DBMAX=12
  const fx=(f:number)=>PL+logScale(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+gh/2-(db/((DBMAX-DBMIN)/2))*(gh/2)
  const clamp=(db:number)=>Math.max(PT,Math.min(PT+gh,fy(db)))
  const zeroY=(PT+gh/2).toFixed(1)

  const N=500
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))

  let gridLines='',gridLabels=''
  for(const f of [30,50,100,200,500,1000,2000,5000,10000,20000]) {
    const x=fx(f).toFixed(1)
    gridLines+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${C.grid}" stroke-width="0.8"/>`
    gridLabels+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${f>=1000?f/1000+'k':f}</text>`
  }
  for(const db of [-12,-9,-6,-3,0,3,6,9]) {
    const y=fy(db).toFixed(1)
    gridLines+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${db===0?C.border:C.grid}" stroke-width="${db===0?'1':'0.4'}"/>`
    gridLabels+=`<text x="${PL-6}" y="${parseFloat(y)+3}" text-anchor="end" fill="${C.muted}" font-size="9" font-family="DM Mono,monospace">${db>0?'+':''}${db}</text>`
  }

  if (!eq.length) {
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${C.panel}"/>
      ${gridLines}${gridLabels}
      <line x1="${PL}" y1="${zeroY}" x2="${PL+gw}" y2="${zeroY}" stroke="${C.champ}" stroke-width="2"/>
      <text x="${W/2}" y="${H/2}" text-anchor="middle" fill="${C.muted}" font-size="11" font-family="DM Sans,sans-serif">Flat — No EQ applied</text>
    </svg>`
  }

  // Compute total response and individual bands
  const totalDb=freqs.map((_,i)=>{
    let db=0
    for(const band of eq) {
      if(band.type==='HP') {
        const c=rbj('HP',band.freq,0,band.q||0.707)
        db+=biquadResponse(c,[freqs[i]])[0]
      } else if(band.type==='LP') {
        const c=rbj('LP',band.freq,0,band.q||0.707)
        db+=biquadResponse(c,[freqs[i]])[0]
      } else if(band.gain!=null) {
        const c=rbj(band.type||'PK',band.freq,band.gain,band.q||1)
        db+=biquadResponse(c,[freqs[i]])[0]
      }
    }
    return db
  })

  // Individual band curves (dashed, faded)
  const bandColors=['#c9a96e99','#5b8db899','#a06fc099','#6fac6099']
  let bandPaths=''
  eq.forEach((band,bi) => {
    const bandDb=freqs.map((f)=>{
      if(band.type==='HP') return biquadResponse(rbj('HP',band.freq,0,band.q||0.707),[f])[0]
      if(band.type==='LP') return biquadResponse(rbj('LP',band.freq,0,band.q||0.707),[f])[0]
      if(band.gain!=null) return biquadResponse(rbj(band.type||'PK',band.freq,band.gain,band.q||1),[f])[0]
      return 0
    })
    const bpts: [number,number][]=freqs.map((f,i)=>[fx(f),clamp(bandDb[i])])
    const bpath=smoothPath(bpts)
    const col=bandColors[bi%bandColors.length]
    bandPaths+=`<path d="${bpath}" fill="none" stroke="${col}" stroke-width="1" stroke-dasharray="5,3"/>`
    // Band label at peak frequency
    const peakX=fx(band.freq).toFixed(1)
    const peakY=clamp(band.gain||0)
    const lbl=band.type==='HP'?`HP ${band.freq}Hz`:band.type==='LP'?`LP ${band.freq}Hz`:`${band.gain>0?'+':''}${band.gain}dB @ ${band.freq>=1000?band.freq/1000+'k':band.freq}Hz`
    bandPaths+=`<circle cx="${peakX}" cy="${peakY.toFixed(1)}" r="3" fill="${col}"/>
      <text x="${peakX}" y="${(peakY-6).toFixed(1)}" text-anchor="middle" fill="${col}" font-size="7.5" font-family="DM Mono,monospace">${lbl}</text>`
  })

  const totalPts: [number,number][]=freqs.map((f,i)=>[fx(f),clamp(totalDb[i])])
  const totalPath=smoothPath(totalPts)
  const fillPts=`${PL},${zeroY} ${totalPts.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')} ${PL+gw},${zeroY}`

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.panel}"/>
    ${gridLines}
    ${bandPaths}
    <polygon points="${fillPts}" fill="${C.champ}" fill-opacity="0.08"/>
    <path d="${totalPath}" fill="none" stroke="${C.champ}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="${PL}" y1="${zeroY}" x2="${PL+gw}" y2="${zeroY}" stroke="${C.border}" stroke-width="0.8"/>
    ${gridLabels}
    <text x="${PL}" y="${H-4}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace">Hz</text>
    <text x="10" y="${PT+gh/2}" fill="${C.muted}" font-size="8" font-family="DM Mono,monospace" transform="rotate(-90,10,${PT+gh/2})">dB</text>
  </svg>`
}

// ── Page chrome builders ───────────────────────────────────────────────────────
function hdr(name: string, n: number, total: number) {
  return `<div class="ph"><span class="phl">XSCACE · ${name.toUpperCase()}</span><span class="phn">${n} / ${total}</span></div>`
}
function ftr() {
  return `<div class="ft"><span class="ftl">XSCACE · Size Defying Sound · xscace.com</span><span class="ftr">Technical Specification Document</span></div>`
}
function specRow(l: string, v: string) {
  return `<div class="sr"><span class="sl">${l}</span><span class="sv">${v}</span></div>`
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  try {
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription, series, skuBase,
      sensitivityDb, powerRmsW, powerPeakW, impedanceOhms, splMaxDb, thdN,
      freqLowHz, freqHighHz, freqQualifier, directivityHDeg, directivityVDeg,
      heightMm, widthMm, depthMm, weightKg, driverDescription, crossoverType,
      housingMaterial, grilleMaterial, speakerWireConnector, wireGaugeRecommended,
      ipRating, mountingMethods, launchYear, eqData, eqProfileName, specConfidence,
      proprietaryTechBadges, heroImage, specSheetRef, specSheetHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // Cache
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.sensitivityDb}${P.eqData}v2ls`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.specSheetRef && P.specSheetHash === h) {
      const cdn = fileCdn(P.specSheetRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(()=>null)
      if (head && (head.ok || head.status===403)) return NextResponse.redirect(cdn, 302)
    }

    // Hero
    const hero = await imgB64(getRef(P.heroImage), 500)

    // Fonts
    const fontCss = loadFontCss()

    // Parse EQ
    const eq: any[] = []
    for (const line of (P.eqData||'').split('\n').slice(1)) {
      const p = line.trim().split(',')
      if (p.length<2) continue
      if (p[0]==='HP'||p[0]==='LP') eq.push({type:p[0],freq:parseFloat(p[1]),gain:null,q:parseFloat(p[2]||'0.707')})
      else eq.push({type:p[2]||'PK',freq:parseFloat(p[0]),gain:parseFloat(p[1]),q:parseFloat(p[3]||'1')})
    }

    // Tech
    const tech = (P.proprietaryTechBadges||'').split(',')
      .map((b:string)=>b.trim().replace(/™/g,'').replace(/\s+/g,' ').trim()).filter(Boolean)
    const techData = tech.map((badge:string)=>({name:badge, img:techIconB64(badge)}))

    const TECH_DESC: Record<string,string> = {
      'psysculpt':            'Built on the ADAU1701 DSP, PsySculpt implements a psychoacoustically aware EQ curve based on Fletcher-Munson equal-loudness contours, applying dynamic pre-compensation so tonal balance stays consistent from background listening levels to concert SPL.',
      'xs-flow':              'Micro-waveguide geometry is precision-machined into the internal face of each enclosure. XS-Flow channels the rearward acoustic wave around the magnet structure, reducing compression and harmonic distortion at high excursion.',
      'nano resonance':       'By engineering an intentionally heavy cone mass, Nano Resonance forces the natural resonant frequency well below the target passband, allowing genuine low-frequency extension from an enclosure only 12-23mm deep — defying the constraints of Hoffman\'s Iron Law.',
      'precisionxover array': 'Each crossover network is assembled with air-core inductors (no ferrous saturation), polypropylene film capacitors (low ESR, stable across temperature), and metal-film resistors. Component matching is held to ±0.5 dB for inaudible channel-to-channel variation.',
      'aeroframe chassis':    '6061 aerospace-grade aluminium is machined to form the speaker\'s structural chassis, acting as a passive heatsink that draws heat away from the voice coil through direct thermal coupling to the body — eliminating thermal compression without fans or active cooling.',
      'powerdense dynamics':  'The voice coil is wound with a copper-silver composite conductor — copper for electrical conductivity, silver for reduced skin effect at high frequencies — allowing significantly higher continuous power in the same former diameter, raising the thermal ceiling without increasing coil mass.',
    }

    // Charts
    const sens = P.sensitivityDb||90
    const frChart    = chartFreq(sens, P.freqLowHz||80, P.freqHighHz||20000, eq)
    const polChart   = chartPolar(P.directivityHDeg||140, P.directivityVDeg||25)
    const splChart   = chartSPL(sens, P.powerRmsW||1, P.powerPeakW||1)
    const eqChart    = chartEQ(eq)

    const TOTAL = 6

    const css = `
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;background:#090909;page-break-after:always;display:flex;flex-direction:column}
.page:last-child{page-break-after:auto}
.topbar{height:3px;background:#c9a96e;flex-shrink:0}
.botbar{height:3px;background:#c9a96e;flex-shrink:0;margin-top:auto}
.ph{display:flex;justify-content:space-between;padding:7px 20mm 6px;border-bottom:.3px solid rgba(255,255,255,.05);flex-shrink:0}
.phl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phn{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835}
.ft{display:flex;justify-content:space-between;padding:5px 20mm 7px;border-top:.3px solid rgba(255,255,255,.05);flex-shrink:0;margin-top:auto}
.ftl,.ftr{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f}
.body{padding:8px 20mm 0;flex:1;min-height:0;display:flex;flex-direction:column}
/* Cover */
.cvr{position:relative;width:297mm;height:210mm;overflow:hidden;flex-shrink:0}
.cvr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.3}
.cvr-grad{position:absolute;inset:0;background:linear-gradient(to right,#090909 45%,rgba(9,9,9,.6) 70%,rgba(9,9,9,.1) 100%)}
.cvr-l{position:absolute;left:0;top:0;bottom:0;width:54%;padding:24px 0 20px 20mm;display:flex;flex-direction:column}
.cvr-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:16px;color:#c9a96e;letter-spacing:.05em;margin-bottom:4px}
.cvr-sub{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.2em;color:#7a776f;text-transform:uppercase;margin-bottom:auto}
.cvr-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:72px;color:#eeebe5;line-height:1;margin-bottom:4px}
.cvr-tag{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-style:italic;color:#c9a96e;margin-bottom:14px}
.cvr-rule{height:1px;background:rgba(201,169,110,.4);width:240px;margin-bottom:14px}
.cvr-stats{display:flex;gap:22px;margin-bottom:16px}
.cvr-sv{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#c9a96e;line-height:1}
.cvr-sl{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.18em;color:#7a776f;margin-top:3px;text-transform:uppercase}
.cvr-meta{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;letter-spacing:.1em;text-transform:uppercase;margin-top:auto;border-top:.5px solid rgba(201,169,110,.15);padding-top:8px}
/* Specs */
.spcols{display:flex;gap:16px;flex:1}
.spcol{flex:1}
.sg{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:3px;margin:6px 0 3px}
.sg:first-child{margin-top:0}
.sr{display:flex;justify-content:space-between;align-items:baseline;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.sl{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f;flex-shrink:0}
.sv{font-family:'DM Mono',monospace;font-size:8px;color:#eeebe5;text-align:right;max-width:60%;word-break:break-word}
/* Chart pages */
.ch1{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:300;color:#eeebe5;margin-bottom:3px}
.ch2{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;margin-bottom:5px}
.chart{flex:1;min-height:0;background:#0e0e0d;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex;align-items:stretch}
.chart svg{width:100%;height:100%}
/* Tech */
.trow{display:flex;gap:10px;padding:6px 0;border-bottom:.3px solid rgba(255,255,255,.05)}
.trow:last-child{border-bottom:none}
.ticon{flex-shrink:0;width:11mm;display:flex;align-items:flex-start;padding-top:1px}
.timg{width:11mm;height:11mm;object-fit:contain}
.tph{width:11mm;height:11mm;background:rgba(201,169,110,.07);border:.4px solid rgba(201,169,110,.18)}
.ttext{flex:1}
.tname{font-family:'DM Sans',Helvetica,sans-serif;font-weight:700;font-size:8.5px;color:#c9a96e;margin-bottom:3px}
.tdesc{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.6}
`

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cvr">
    <div class="topbar" style="position:absolute;top:0;left:0;right:0;z-index:2"></div>
    ${hero?`<img src="${hero}" class="cvr-img">`:''}
    <div class="cvr-grad"></div>
    <div class="cvr-l">
      <div class="cvr-brand">XSCACE</div>
      <div class="cvr-sub">Size Defying Sound</div>
      <div class="cvr-name">${P.productName}</div>
      <div class="cvr-tag">${P.tagline||''}</div>
      <div class="cvr-rule"></div>
      <div class="cvr-stats">
        ${([
          P.powerRmsW    ?{v:`${P.powerRmsW}W`,      l:'Power RMS'}   :null,
          P.sensitivityDb?{v:`${P.sensitivityDb} dB`, l:'Sensitivity'} :null,
          P.impedanceOhms?{v:`${P.impedanceOhms} Ω`,  l:'Impedance'}   :null,
          P.depthMm      ?{v:`${P.depthMm} mm`,       l:'Depth'}       :null,
        ] as any[]).filter(Boolean).map((s:any)=>
          `<div><div class="cvr-sv">${s.v}</div><div class="cvr-sl">${s.l}</div></div>`
        ).join('')}
      </div>
      <div class="cvr-meta">${P.series||''} · ${P.skuBase||''} · ${P.specConfidence||'Lab Verified'} · © XSCACE ${P.launchYear||2022}</div>
    </div>
    <div class="botbar" style="position:absolute;bottom:0;left:0;right:0;z-index:2"></div>
  </div>
</div>

<!-- PAGE 2: SPECIFICATIONS -->
<div class="page">
  <div class="topbar"></div>
  ${hdr(P.productName,2,TOTAL)}
  <div class="body">
    <div class="ch1">Technical Specifications</div>
    <div class="spcols">
      <div class="spcol">
        <div class="sg">Acoustic Performance</div>
        ${specRow('Power RMS',`${P.powerRmsW||'—'} W`)}
        ${specRow('Power Peak',`${P.powerPeakW||'—'} W`)}
        ${specRow('Sensitivity',`${P.sensitivityDb||'—'} dB / 1W / 1m`)}
        ${specRow('Impedance',`${P.impedanceOhms||'—'} Ω`)}
        ${specRow('Max SPL',`${P.splMaxDb||'—'} dB`)}
        ${specRow('THD+N',P.thdN||'—')}
        ${specRow('Frequency Range',`${P.freqLowHz||'—'} Hz – ${Math.round((P.freqHighHz||20000)/1000)} kHz ${P.freqQualifier||''}`)}
        ${specRow('Directivity H',`${P.directivityHDeg||'—'}°`)}
        ${specRow('Directivity V',`${P.directivityVDeg||'—'}°`)}
        ${specRow('Driver Config',P.driverDescription||'—')}
        ${specRow('Crossover',P.crossoverType||'—')}
        ${specRow('EQ Profile',P.eqProfileName||'Default')}
        ${specRow('Spec Confidence',P.specConfidence||'—')}
      </div>
      <div class="spcol">
        <div class="sg">Physical</div>
        ${specRow('Height',`${P.heightMm||'—'} mm`)}
        ${specRow('Width',`${P.widthMm||'—'} mm`)}
        ${specRow('Depth',`${P.depthMm||'—'} mm`)}
        ${specRow('Weight',`${P.weightKg||'—'} kg`)}
        ${specRow('Housing',P.housingMaterial||'—')}
        ${specRow('Grille',P.grilleMaterial||'—')}
        <div class="sg">Installation</div>
        ${specRow('IP Rating',P.ipRating||'—')}
        ${specRow('Mounting',P.mountingMethods||'—')}
        ${specRow('Connector',P.speakerWireConnector||'—')}
        ${specRow('Wire Gauge',P.wireGaugeRecommended||'—')}
        <div class="sg">Product</div>
        ${specRow('Series',P.series||'—')}
        ${specRow('SKU',P.skuBase||'—')}
        ${specRow('Since',String(P.launchYear||'—'))}
      </div>
    </div>
  </div>
  ${ftr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 3: FREQUENCY RESPONSE -->
<div class="page">
  <div class="topbar"></div>
  ${hdr(P.productName,3,TOTAL)}
  <div class="body">
    <div class="ch1">Frequency Response</div>
    <div class="ch2">On-axis · 1W / 1m · anechoic · ${P.freqLowHz}Hz – ${Math.round((P.freqHighHz||20000)/1000)}kHz ${P.freqQualifier||''} · ${P.sensitivityDb}dB sensitivity · with recommended EQ applied</div>
    <div class="chart">${frChart}</div>
  </div>
  ${ftr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 4: DIRECTIVITY -->
<div class="page">
  <div class="topbar"></div>
  ${hdr(P.productName,4,TOTAL)}
  <div class="body">
    <div class="ch1">Directivity Pattern</div>
    <div class="ch2">Normalised polar response · H ${P.directivityHDeg}° / V ${P.directivityVDeg}° at –6 dB · 1kHz reference · multi-frequency overlay</div>
    <div class="chart">${polChart}</div>
  </div>
  ${ftr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 5: SPL + EQ (side by side) -->
<div class="page">
  <div class="topbar"></div>
  ${hdr(P.productName,5,TOTAL)}
  <div class="body" style="flex-direction:row;gap:10px">
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <div class="ch1" style="font-size:20px">SPL vs Distance</div>
      <div class="ch2">Inverse square law · Ref: ${P.sensitivityDb}dB/1W/1m · anechoic</div>
      <div class="chart">${splChart}</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <div class="ch1" style="font-size:20px">Recommended EQ</div>
      <div class="ch2">Profile: ${P.eqProfileName||'Default'} · RBJ biquad cascade · fs = 48 kHz (ADAU1701)</div>
      <div class="chart">${eqChart}</div>
    </div>
  </div>
  ${ftr()}
  <div class="botbar"></div>
</div>

<!-- PAGE 6: PROPRIETARY TECHNOLOGIES -->
<div class="page">
  <div class="topbar"></div>
  ${hdr(P.productName,6,TOTAL)}
  <div class="body">
    <div class="ch1">Proprietary Technologies</div>
    <div class="ch2" style="margin-bottom:8px">Exclusive engineering innovations inside every XSCACE product</div>
    ${techData.map(({name,img}:{name:string,img:string})=>{
      const key=name.toLowerCase().replace(/\s+/g,' ')
      let desc=''
      for(const [k,d] of Object.entries(TECH_DESC)) if(key.includes(k)||k.includes(key.split(' ')[0])){desc=d;break}
      return `<div class="trow">
        <div class="ticon">${img?`<img src="${img}" class="timg">`:`<div class="tph"></div>`}</div>
        <div class="ttext"><div class="tname">${name}</div><div class="tdesc">${desc}</div></div>
      </div>`
    }).join('')}
  </div>
  ${ftr()}
  <div class="botbar"></div>
</div>

</body></html>`

    // Puppeteer — identical to brochure
    const puppeteer = (await import('puppeteer-core')).default
    const chromium  = (await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode = false
    const browser = await puppeteer.launch({
      args:[...chromium.args,'--no-sandbox','--single-process','--disable-gpu'],
      executablePath: await chromium.executablePath(
        process.env.CHROMIUM_PACK_URL||
        'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar'
      ),
      headless:true,
    })
    const page = await browser.newPage()
    await page.setViewport({width:1587,height:1123,deviceScaleFactor:1})
    await page.setContent(html,{waitUntil:'domcontentloaded',timeout:15000})
    await page.emulateMediaType('print')
    const pdf = Buffer.from(await page.pdf({
      width:'297mm',height:'210mm',printBackground:true,
      margin:{top:'0',right:'0',bottom:'0',left:'0'},
    }))
    await browser.close()

    // Cache to Sanity
    if (process.env.SANITY_API_TOKEN && pdf.length>1000) {
      try {
        const fname=`XSCACE_${P.productName.replace(/\s+/g,'_')}_SpecSheet.pdf`
        const up=await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          {method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/pdf'},body:pdf})
        if(up.ok){
          const {document:doc}=await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`,
            {method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/json'},
             body:JSON.stringify({mutations:[{patch:{id:P._id,set:{specSheetRef:doc._id,specSheetHash:h,specSheet:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})})
        }
      } catch(e){console.error('[specsheet] cache failed',e)}
    }

    return new NextResponse(pdf,{status:200,headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':`inline; filename="XSCACE_${slug}_SpecSheet.pdf"`,
      'Content-Length':String(pdf.length),
      'Cache-Control':'no-cache',
    }})
  } catch(err:any){
    console.error('[specsheet]',err)
    return NextResponse.json({error:err?.message},{status:500})
  }
}
