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

// ── Product type detection ─────────────────────────────────────────────────────
type ProductKind = 'speaker' | 'subwoofer' | 'amplifier' | 'streamer'
function detectKind(P: any): ProductKind {
  const cat: string = P.catSlug || ''
  const series: string = (P.series || '').toLowerCase()
  if (cat === 'subwoofer-series' || series.includes('subwoofer')) return 'subwoofer'
  if (cat === 'amplifier-series' || series.includes('amplifier') || series.includes('xylem')) {
    // Air Mini is streamer-only (no wattage, no speaker out)
    if (!P.powerRmsW && !P.sensitivityDb) return 'streamer'
    return 'amplifier'
  }
  return 'speaker'
}

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

// ── Smooth bezier path ────────────────────────────────────────────────────────
function catmullRomPath(pts: [number,number][], tension=0.4): string {
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

function logX(f: number, fMin: number, fMax: number, w: number): number {
  return Math.log10(f/fMin)/Math.log10(fMax/fMin)*w
}

const CH='#c9a96e', CH2='rgba(201,169,110,0.08)', BLU='#5b8db8', GRID='#151412', GRID2='#1e1c1a', MUTED='#6b6760', BG='#0c0b0a'

// ── CHART: Frequency Response (Speaker) ───────────────────────────────────────
function chartFreqResponse(sens: number, fLow: number, fHigh: number): string {
  const W=1120,H=480,PL=52,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBMIN=55,DBMAX=105
  const fx=(f:number)=>PL+logX(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const cy=(db:number)=>Math.max(PT+2,Math.min(PT+gh-2,fy(db)))
  const N=1200
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))
  const loCoefs1=biquadCoefs('HP',fLow,0,0.54)
  const loCoefs2=biquadCoefs('HP',fLow,0,1.31)
  const hiCoefs=biquadCoefs('LP',fHigh*1.4,0,0.6)
  const acousticDb=(f:number)=>{
    let db=biquadMagDb(loCoefs1,f)+biquadMagDb(loCoefs2,f)+biquadMagDb(hiCoefs,f)+sens
    db+=0.8*Math.exp(-0.5*Math.pow(Math.log2(f/800),2))
    return db
  }
  const pts: [number,number][]=freqs.map(f=>[fx(f),cy(acousticDb(f))])
  const step=Math.max(1,Math.floor(N/250))
  const sampled: [number,number][]=pts.filter((_,i)=>i%step===0||i===pts.length-1)
  const curvePath=catmullRomPath(sampled,0.4)
  const fillPath=`${curvePath} L${(PL+gw).toFixed(1)},${(PT+gh).toFixed(1)} L${PL},${(PT+gh).toFixed(1)} Z`
  const gridFs=[20,50,100,200,500,1000,2000,5000,10000,20000]
  const gridDBs=[60,65,70,75,80,85,90,95,100]
  let g=''
  for(const f of gridFs){
    const x=fx(f).toFixed(1),isMajor=f===100||f===1000||f===10000
    g+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    g+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${f>=1000?f/1000+'k':f}</text>`
  }
  for(const db of gridDBs){
    const y=fy(db).toFixed(1),isMajor=db%10===0
    if(parseFloat(y)<PT||parseFloat(y)>PT+gh) continue
    g+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    if(isMajor) g+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db}</text>`
  }
  const sensY=fy(sens).toFixed(1)
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="cfr"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${g}
  <g clip-path="url(#cfr)">
    <path d="${fillPath}" fill="${CH2}"/>
    <line x1="${PL}" y1="${sensY}" x2="${PL+gw}" y2="${sensY}" stroke="${CH}" stroke-width="0.6" stroke-dasharray="8,5" opacity="0.3"/>
    <path d="${curvePath}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Hz</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB SPL</text>
  <text x="${PL+gw-4}" y="${parseFloat(sensY)-5}" text-anchor="end" fill="${CH}" fill-opacity="0.45" font-size="10" font-family="DM Mono,monospace">${sens} dB ref</text>
</svg>`
}

// ── CHART: Subwoofer Frequency Response (20–500Hz) ────────────────────────────
function chartSubFreqResponse(fLow: number, fHigh: number, sens: number): string {
  const W=1120,H=480,PL=52,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const FMIN=15,FMAX=600,DBMIN=50,DBMAX=100
  const fx=(f:number)=>PL+logX(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const cy=(db:number)=>Math.max(PT+2,Math.min(PT+gh-2,fy(db)))
  const N=600
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))
  // 4th-order HP at fLow (sealed/ported box rolloff), 2nd-order LP at fHigh
  const loC1=biquadCoefs('HP',fLow,0,0.54)
  const loC2=biquadCoefs('HP',fLow,0,1.31)
  const hiC=biquadCoefs('LP',fHigh,0,0.707)
  const acousticDb=(f:number)=>biquadMagDb(loC1,f)+biquadMagDb(loC2,f)+biquadMagDb(hiC,f)+sens
  const pts: [number,number][]=freqs.map(f=>[fx(f),cy(acousticDb(f))])
  const step=Math.max(1,Math.floor(N/200))
  const sampled: [number,number][]=pts.filter((_,i)=>i%step===0||i===pts.length-1)
  const curvePath=catmullRomPath(sampled,0.4)
  const fillPath=`${curvePath} L${(PL+gw).toFixed(1)},${(PT+gh).toFixed(1)} L${PL},${(PT+gh).toFixed(1)} Z`
  let g=''
  for(const f of [20,30,50,80,100,150,200,300,500]){
    const x=fx(f).toFixed(1)
    g+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${GRID2}" stroke-width="0.6"/>`
    g+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${f}</text>`
  }
  for(const db of [55,60,65,70,75,80,85,90,95]){
    const y=fy(db).toFixed(1)
    if(parseFloat(y)<PT||parseFloat(y)>PT+gh) continue
    const isMajor=db%10===0
    g+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    if(isMajor) g+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db}</text>`
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="csf"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${g}
  <g clip-path="url(#csf)">
    <path d="${fillPath}" fill="${CH2}"/>
    <path d="${curvePath}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Hz</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB SPL</text>
</svg>`
}

// ── CHART: Polar Directivity ───────────────────────────────────────────────────
function chartPolar(dirH: number, dirV: number): string {
  const W=1120,H=520,CX=W/2,CY=H/2+10,R=210
  const toR=(d:number)=>d*Math.PI/180
  const beamPath=(bwDeg:number,col:string,fillOp:number,strokeOp:number,sw:number)=>{
    const sigma=bwDeg/2/1.1775
    const pts=Array.from({length:361},(_,i)=>{
      const deg=i-180, rad=toR(deg)
      const r=R*Math.max(0,Math.exp(-0.5*Math.pow(deg/sigma,2)))
      return `${(CX+r*Math.sin(rad)).toFixed(2)},${(CY-r*Math.cos(rad)).toFixed(2)}`
    })
    return `<path d="M ${pts.join(' L ')} Z" fill="${col}" fill-opacity="${fillOp}" stroke="${col}" stroke-width="${sw}" stroke-opacity="${strokeOp}" stroke-linejoin="round"/>`
  }
  let g=''
  for(const r of [R*0.25,R*0.5,R*0.75,R]){
    g+=`<circle cx="${CX}" cy="${CY}" r="${r.toFixed(1)}" fill="none" stroke="${GRID2}" stroke-width="0.6"/>`
    if(r<R) g+=`<text x="${(CX+r+4).toFixed(1)}" y="${(CY+3).toFixed(1)}" fill="${MUTED}" font-size="9" font-family="DM Mono,monospace">${Math.round(-20*Math.log10(R/r))}dB</text>`
  }
  for(let a=0;a<360;a+=30){
    const rad=toR(a)
    g+=`<line x1="${CX.toFixed(1)}" y1="${CY.toFixed(1)}" x2="${(CX+R*Math.sin(rad)).toFixed(1)}" y2="${(CY-R*Math.cos(rad)).toFixed(1)}" stroke="${GRID}" stroke-width="0.5"/>`
  }
  g+=`<text x="${CX}" y="${CY-R-10}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">0°</text>`
  g+=`<text x="${CX+R+14}" y="${CY+4}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">90°</text>`
  g+=`<text x="${CX-R-14}" y="${CY+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">−90°</text>`
  const hFreqs=[{bw:dirH*0.35},{bw:dirH*0.5},{bw:dirH*0.65},{bw:dirH}]
  let beams=''
  for(const {bw} of hFreqs.slice(0,-1)) beams+=beamPath(Math.min(170,bw),CH,0.03,0.25,0.5)
  beams+=beamPath(dirH,CH,0.14,0.95,2.2)
  beams+=beamPath(Math.min(170,dirV*0.5),BLU,0.03,0.2,0.4)
  beams+=beamPath(dirV,BLU,0.10,0.85,1.6)
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${g}${beams}
  <line x1="${CX}" y1="${CY-R-6}" x2="${CX}" y2="${CY+R+6}" stroke="${GRID2}" stroke-width="0.7"/>
  <rect x="40" y="${H-20}" width="26" height="2.5" fill="${CH}"/>
  <text x="72" y="${H-14}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">H ${dirH}° (−6dB, 1 kHz)</text>
  <rect x="320" y="${H-20}" width="20" height="2.5" fill="${BLU}"/>
  <text x="346" y="${H-14}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">V ${dirV}° (−6dB, 1 kHz)</text>
</svg>`
}

// ── CHART: SPL vs Distance ─────────────────────────────────────────────────────
function chartSPL(sens: number, powerRms: number, powerPeak: number, splMax: number): string {
  const W=1120,H=480,PL=54,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const DMIN=0.5,DMAX=20
  const splAt1m=sens+10*Math.log10(Math.max(powerRms,1))
  const DBMAX=splMax>0?Math.max(splMax+4,splAt1m+6):splAt1m+6
  const DBMIN=Math.max(40,sens+10*Math.log10(Math.max(powerRms,1))-20*Math.log10(DMAX)-8)
  const dx=(d:number)=>PL+logX(d,DMIN,DMAX,gw)
  const dy=(db:number)=>PT+gh-(db-DBMIN)/(DBMAX-DBMIN)*gh
  const cy=(db:number)=>Math.max(PT+1,Math.min(PT+gh-1,dy(db)))
  const dists=[0.5,0.75,1,1.5,2,3,4,5,6,8,10,12,15,20]
  const splAt=(d:number,pwr:number)=>sens+10*Math.log10(pwr)-20*Math.log10(d)
  let g=''
  for(const d of [1,2,5,10,20]){
    const x=dx(d).toFixed(1)
    g+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${GRID2}" stroke-width="0.8"/>`
    g+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${d}m</text>`
  }
  for(let db=Math.ceil(DBMIN/5)*5;db<=DBMAX;db+=5){
    const y=dy(db).toFixed(1)
    if(parseFloat(y)<PT||parseFloat(y)>PT+gh) continue
    const isMajor=db%10===0
    g+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    if(isMajor) g+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db}</text>`
  }
  const rmsP: [number,number][]=dists.map(d=>[dx(d),cy(splAt(d,powerRms))])
  const peakP: [number,number][]=dists.map(d=>[dx(d),cy(splAt(d,powerPeak))])
  const rCurve=catmullRomPath(rmsP,0.4)
  const pCurve=catmullRomPath(peakP,0.4)
  const rFill=`${rCurve} L${(PL+gw).toFixed(1)},${(PT+gh).toFixed(1)} L${PL},${(PT+gh).toFixed(1)} Z`
  const maxY=splMax>0?dy(splMax):-1
  const maxInRange=splMax>0&&maxY>=PT&&maxY<=PT+gh
  const damageY=dy(85).toFixed(1)
  const splRms=Math.round(splAt(1,powerRms)), splPeak=Math.round(splAt(1,powerPeak))
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="cspl"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${g}
  <g clip-path="url(#cspl)">
    <line x1="${PL}" y1="${damageY}" x2="${PL+gw}" y2="${damageY}" stroke="${CH}" stroke-width="0.6" stroke-dasharray="10,6" opacity="0.15"/>
    ${maxInRange?`<line x1="${PL}" y1="${maxY.toFixed(1)}" x2="${PL+gw}" y2="${maxY.toFixed(1)}" stroke="#e05050" stroke-width="1" stroke-dasharray="12,5" opacity="0.7"/>`:''}
    <path d="${rFill}" fill="${CH2}"/>
    <path d="${rCurve}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${pCurve}" fill="none" stroke="#dfc060" stroke-width="1.5" stroke-dasharray="10,4" stroke-linecap="round"/>
  </g>
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Distance</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB SPL</text>
  ${maxInRange?`<text x="${PL+6}" y="${(maxY-5).toFixed(0)}" fill="#e05050" font-size="9" font-family="DM Mono,monospace" opacity="0.8">Max SPL ${splMax} dB</text>`:''}
  <rect x="40" y="${H-18}" width="28" height="2.5" fill="${CH}"/>
  <text x="74" y="${H-13}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">RMS ${powerRms}W · ${splRms} dB @ 1m</text>
  <rect x="380" y="${H-18}" width="22" height="2.5" fill="#dfc060"/>
  <text x="408" y="${H-13}" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">Peak ${powerPeak}W · ${splPeak} dB @ 1m</text>
</svg>`
}

// ── CHART: EQ Response ─────────────────────────────────────────────────────────
function chartEQ(eq: any[]): string {
  const W=1120,H=380,PL=52,PR=24,PT=24,PB=44,gw=W-PL-PR,gh=H-PT-PB
  const FMIN=20,FMAX=25000,DBRANGE=20
  const fx=(f:number)=>PL+logX(f,FMIN,FMAX,gw)
  const fy=(db:number)=>PT+(gh/2)-(db/DBRANGE)*(gh/2)
  const cy=(db:number)=>Math.max(PT+2,Math.min(PT+gh-2,fy(db)))
  const zeroY=(PT+gh/2).toFixed(1)
  const N=800
  const freqs=Array.from({length:N},(_,i)=>FMIN*Math.pow(FMAX/FMIN,i/(N-1)))
  let g=''
  for(const f of [20,50,100,200,500,1000,2000,5000,10000,20000]){
    const x=fx(f).toFixed(1),isMajor=f===100||f===1000||f===10000
    g+=`<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+gh}" stroke="${isMajor?GRID2:GRID}" stroke-width="${isMajor?'0.8':'0.4'}"/>`
    g+=`<text x="${x}" y="${PT+gh+16}" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${f>=1000?f/1000+'k':f}</text>`
  }
  for(const db of [-18,-12,-6,0,6,12,18]){
    const y=fy(db).toFixed(1)
    if(parseFloat(y)<PT||parseFloat(y)>PT+gh) continue
    g+=`<line x1="${PL}" y1="${y}" x2="${PL+gw}" y2="${y}" stroke="${db===0?'#252320':GRID}" stroke-width="${db===0?'1.2':'0.4'}"/>`
    g+=`<text x="${PL-8}" y="${parseFloat(y)+4}" text-anchor="end" fill="${MUTED}" font-size="11" font-family="DM Mono,monospace">${db>0?'+':''}${db}</text>`
  }
  if(!eq.length) return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>${g}
  <line x1="${PL}" y1="${zeroY}" x2="${PL+gw}" y2="${zeroY}" stroke="${CH}" stroke-width="2.5"/>
  <text x="${W/2}" y="${H/2+4}" text-anchor="middle" fill="${MUTED}" font-size="14" font-family="DM Sans,sans-serif">Flat — No EQ applied</text>
</svg>`
  const allCoefs=eq.map(b=>{
    if(b.type==='HP') return {coef:biquadCoefs('HP',b.freq,0,b.q||0.707),band:b}
    if(b.type==='LP') return {coef:biquadCoefs('LP',b.freq,0,b.q||0.707),band:b}
    return {coef:biquadCoefs(b.type||'PK',b.freq,b.gain||0,b.q||1),band:b}
  })
  const bandCols=['rgba(201,169,110,0.65)','rgba(91,141,184,0.65)','rgba(160,111,192,0.65)','rgba(111,172,96,0.65)']
  let bandSvg=''
  allCoefs.forEach(({coef,band},bi)=>{
    const bstep=Math.max(1,Math.floor(freqs.length/200))
    const bpts: [number,number][]=freqs.filter((_,i)=>i%bstep===0||i===freqs.length-1).map(f=>[fx(f),cy(biquadMagDb(coef,f))])
    const col=bandCols[bi%bandCols.length]
    bandSvg+=`<path d="${catmullRomPath(bpts,0.38)}" fill="none" stroke="${col}" stroke-width="0.8" stroke-dasharray="12,6" opacity="0.55"/>`
    const labelX=fx(band.freq).toFixed(1)
    const lbl=band.type==='HP'?`HP`:band.type==='LP'?`LP`:(band.gain>0?'+':'')+band.gain+'dB'
    bandSvg+=`<circle cx="${labelX}" cy="${cy(biquadMagDb(coef,band.freq)).toFixed(1)}" r="2.5" fill="${col}" opacity="0.8"/>`
    bandSvg+=`<text x="${labelX}" y="${(cy(band.gain||0)*0.5+PT*0.5-8).toFixed(1)}" text-anchor="middle" fill="${col}" font-size="9.5" font-family="DM Mono,monospace">${lbl}</text>`
  })
  const tstep=Math.max(1,Math.floor(freqs.length/250))
  const totalPts: [number,number][]=freqs.filter((_,i)=>i%tstep===0||i===freqs.length-1).map(f=>{
    const db=allCoefs.reduce((s,{coef})=>s+biquadMagDb(coef,f),0)
    return [fx(f),cy(db)]
  })
  const totalPath=catmullRomPath(totalPts,0.38)
  const fillPath=`${totalPath} L${(PL+gw).toFixed(1)},${zeroY} L${PL},${zeroY} Z`
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <clipPath id="ceq"><rect x="${PL}" y="${PT}" width="${gw}" height="${gh}"/></clipPath>
  ${g}
  <g clip-path="url(#ceq)">
    ${bandSvg}
    <path d="${fillPath}" fill="${CH2}"/>
    <line x1="${PL}" y1="${zeroY}" x2="${PL+gw}" y2="${zeroY}" stroke="#2a2826" stroke-width="0.8"/>
    <path d="${totalPath}" fill="none" stroke="${CH}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${PL}" y="${H-6}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace">Hz</text>
  <text x="12" y="${PT+gh/2}" fill="${MUTED}" font-size="10" font-family="DM Mono,monospace" transform="rotate(-90,12,${PT+gh/2})">dB</text>
</svg>`
}

// ── EQ Filter Table ───────────────────────────────────────────────────────────
function eqFilterTable(eq: any[], profileName: string): string {
  if(!eq.length) return `<div class="eq-empty">No EQ filters — flat response.</div>`
  return `<div class="eq-table">
    <div class="eq-head"><div class="eq-cell eq-num">#</div><div class="eq-cell">Type</div><div class="eq-cell">Frequency</div><div class="eq-cell">Gain</div><div class="eq-cell">Q</div></div>
    ${eq.map((b,i)=>`<div class="eq-row">
      <div class="eq-cell eq-num">${i+1}</div>
      <div class="eq-cell">${b.type}</div>
      <div class="eq-cell">${b.freq>=1000?(b.freq/1000).toFixed(1)+' kHz':b.freq+' Hz'}</div>
      <div class="eq-cell">${b.gain!=null?(b.gain>0?'+':'')+b.gain+' dB':'—'}</div>
      <div class="eq-cell">${b.q||'—'}</div>
    </div>`).join('')}
  </div>
  <div class="eq-note">Profile: ${profileName} · RBJ biquad cascade · fs = 48 kHz (ADAU1701 DSP)</div>`
}

// ── Page chrome ───────────────────────────────────────────────────────────────
function pageHdr(name: string, n: number, total: number): string {
  return `<div class="ph"><span class="phl">XSCACE · ${name.toUpperCase()}</span><span class="phn">${n} / ${total}</span></div>`
}
function pageFtr(): string {
  return `<div class="ft"><span class="ftl">XSCACE · xscace.com</span><span class="ftr">Technical Specification Document</span></div>`
}
function sr(label: string, value: string|null|undefined): string {
  const v=value||'—'
  return `<div class="sr${v==='—'?' sr-empty':''}"><span class="sl">${label}</span><span class="sv">${v}</span></div>`
}

// ── Shared CSS ────────────────────────────────────────────────────────────────
function buildCss(fontCss: string): string {
  return `${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;overflow:hidden;background:#090909;page-break-after:always;display:flex;flex-direction:column}
.page:last-child{page-break-after:auto}
.cvr{position:relative;width:100%;height:100%;overflow:hidden;flex:1}
.cvr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.28}
.cvr-grad{position:absolute;inset:0;background:linear-gradient(to right,#090909 42%,rgba(9,9,9,0.55) 72%,rgba(9,9,9,0.05) 100%)}
.cvr-topbar{position:absolute;top:0;left:0;right:0;height:3px;background:#c9a96e;z-index:2}
.cvr-botbar{position:absolute;bottom:0;left:0;right:0;height:3px;background:#c9a96e;z-index:2}
.cvr-left{position:absolute;left:0;top:0;bottom:0;width:56%;padding:22px 0 20px 18mm;display:flex;flex-direction:column}
.cvr-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:15px;color:#c9a96e;letter-spacing:.05em;margin-bottom:5px}
.cvr-eyebrow{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.2em;color:#7a776f;text-transform:uppercase;margin-bottom:auto}
.cvr-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:72px;color:#eeebe5;line-height:1;margin-bottom:4px}
.cvr-tag{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-style:italic;color:#c9a96e;margin-bottom:16px}
.cvr-rule{height:1px;background:rgba(201,169,110,0.38);width:260px;margin-bottom:16px}
.cvr-stats{display:flex;gap:24px;margin-bottom:16px}
.cvr-sv{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#c9a96e;line-height:1}
.cvr-sl{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.18em;color:#7a776f;margin-top:3px;text-transform:uppercase}
.cvr-meta{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;letter-spacing:.1em;text-transform:uppercase;margin-top:auto;padding-top:10px;border-top:.4px solid rgba(201,169,110,.15)}
.topbar{height:3px;background:#c9a96e;flex-shrink:0}
.botbar{height:3px;background:#c9a96e;flex-shrink:0;margin-top:auto}
.ph{display:flex;justify-content:space-between;padding:7px 18mm 5px;border-bottom:.3px solid rgba(255,255,255,.05);flex-shrink:0}
.phl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phn{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835}
.ft{display:flex;justify-content:space-between;padding:5px 18mm 7px;border-top:.3px solid rgba(255,255,255,.05);flex-shrink:0;margin-top:auto}
.ftl,.ftr{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f}
.spec-body{padding:10px 18mm 0;flex:1;display:flex;flex-direction:column;min-height:0}
.spec-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;color:#eeebe5;margin-bottom:14px;line-height:1}
.spec-cols{display:flex;gap:20px;flex:1;min-height:0}
.spec-col{flex:1;overflow:hidden}
.sg{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:3px;margin:9px 0 3px}
.sg:first-child{margin-top:0}
.sr{display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;border-bottom:.25px solid rgba(255,255,255,.04)}
.sr-empty .sv{color:#3a3835}
.sl{font-family:'DM Mono',monospace;font-size:9px;color:#7a776f;flex-shrink:0;padding-right:8px}
.sv{font-family:'DM Mono',monospace;font-size:9.5px;color:#eeebe5;text-align:right}
.chart-body{padding:8px 18mm 0;flex:1;display:flex;flex-direction:column;min-height:0}
.chart-h{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:300;color:#eeebe5;line-height:1;flex-shrink:0}
.chart-sub{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;margin:3px 0 5px;flex-shrink:0}
.chart-wrap{flex:1;min-height:0;background:#0c0b0a;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex}
.chart-wrap svg{width:100%;height:100%}
.eq-table{flex-shrink:0;margin-top:7px}
.eq-head,.eq-row{display:grid;grid-template-columns:22px 68px 1fr 80px 60px;border-bottom:.3px solid rgba(255,255,255,.05)}
.eq-head{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.12em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:3px;margin-bottom:1px}
.eq-row{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5}
.eq-cell{padding:2.5px 0}
.eq-num{color:#7a776f}
.eq-note{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;margin-top:5px}
.eq-empty{font-family:'DM Mono',monospace;font-size:9px;color:#7a776f;padding:10px 0}
.tech-body{padding:8px 18mm 0;flex:1;display:flex;flex-direction:column;min-height:0}
.tech-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#eeebe5;margin-bottom:10px}
.tech-row{display:flex;gap:10px;padding:7px 0;border-bottom:.3px solid rgba(255,255,255,.05);flex-shrink:0}
.tech-row:last-child{border-bottom:none}
.tech-icon{flex-shrink:0;width:12mm;display:flex;align-items:flex-start;padding-top:1px}
.tech-img{width:12mm;height:12mm;object-fit:contain}
.tech-ph{width:12mm;height:12mm;background:rgba(201,169,110,.07);border:.4px solid rgba(201,169,110,.16)}
.tech-text{flex:1}
.tech-name{font-family:'DM Sans',Helvetica,sans-serif;font-weight:700;font-size:8.5px;color:#c9a96e;margin-bottom:2px}
.tech-desc{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.6}
.feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1}
.feat-item{padding:10px 0;border-bottom:.25px solid rgba(255,255,255,.04);border-right:.25px solid rgba(255,255,255,.04)}
.feat-item:nth-child(even){border-right:none;padding-left:20px}
.feat-label{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#c9a96e;text-transform:uppercase;margin-bottom:4px}
.feat-value{font-family:'DM Sans',Helvetica,sans-serif;font-size:9px;color:#eeebe5;line-height:1.5}
.io-grid{display:flex;gap:12px;flex:1}
.io-col{flex:1;display:flex;flex-direction:column}
.io-head{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:.15em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:4px;margin-bottom:6px}
.io-item{font-family:'DM Mono',monospace;font-size:8px;color:#eeebe5;padding:2px 0;border-bottom:.25px solid rgba(255,255,255,.04)}
`
}

// ── Cover page (shared across all types) ─────────────────────────────────────
function coverPage(P: any, hero: string, stats: {v:string,l:string}[]): string {
  return `<div class="page">
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
        ${stats.filter(Boolean).map(s=>`<div><div class="cvr-sv">${s.v}</div><div class="cvr-sl">${s.l}</div></div>`).join('')}
      </div>
      <div class="cvr-meta">${P.series||''} · ${P.skuBase||''} · ${P.launchYear||2022}</div>
    </div>
    <div class="cvr-botbar"></div>
  </div>
</div>`
}

// ── Tech page (shared) ────────────────────────────────────────────────────────
const TECH_DESC: Record<string,string> = {
  'psysculpt':'ADAU1701 DSP implementing Fletcher-Munson equal-loudness compensation. Pre-Comp → Loudness L&H → Post-Comp → Log-Decay Peak Detector → Dynamic Bass → DAC. Tonal balance stays consistent from background levels to concert SPL.',
  'xs-flow':'Micro-waveguide geometry precision-machined into the enclosure interior. Channels the rearward acoustic wave around the magnet structure, reducing compression and harmonic distortion at high excursion.',
  'nano resonance':'Intentionally heavy cone mass forces the natural resonant frequency well below the target passband — genuine low-frequency extension from an enclosure only 12–23 mm deep, defying Hoffman\'s Iron Law.',
  'precisionxover array':'Air-core inductors, polypropylene film capacitors and metal-film resistors. Component matching held to ±0.5 dB for inaudible channel-to-channel variation across the array.',
  'aeroframe chassis':'6061 aerospace aluminium machined as the structural chassis, acting as a passive heatsink drawing heat away from the voice coil through direct thermal coupling — no fans, no thermal compression.',
  'powerdense dynamics':'Copper-silver composite voice coil conductor. Significantly higher continuous power in the same former diameter — higher thermal ceiling without increasing coil mass or inductance.',
}
function techPage(tech: string[], n: number, total: number, name: string): string {
  if(!tech.length) return ''
  const rows=tech.map(badge=>{
    const img=techIconB64(badge)
    const key=badge.toLowerCase().replace(/\s+/g,' ')
    let desc=''
    for(const [k,d] of Object.entries(TECH_DESC)) if(key.includes(k)||k.includes(key.split(' ')[0])){desc=d;break}
    return `<div class="tech-row">
      <div class="tech-icon">${img?`<img src="${img}" class="tech-img">`:`<div class="tech-ph"></div>`}</div>
      <div class="tech-text"><div class="tech-name">${badge}</div><div class="tech-desc">${desc}</div></div>
    </div>`
  }).join('')
  return `<div class="page">
  <div class="topbar"></div>
  ${pageHdr(name,n,total)}
  <div class="tech-body">
    <div class="tech-title">Proprietary Technologies</div>
    <div>${rows}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>`
}

// ── HTML GENERATORS BY TYPE ───────────────────────────────────────────────────

function buildSpeakerHtml(P: any, hero: string, eq: any[], dims: string, tech: string[]): string {
  const sens=P.sensitivityDb||90
  const frChart=chartFreqResponse(sens,P.freqLowHz||100,P.freqHighHz||20000)
  const polChart=chartPolar(P.directivityHDeg||140,P.directivityVDeg||25)
  const splChart=chartSPL(sens,P.powerRmsW||1,P.powerPeakW||2,P.splMaxDb||0)
  const eqChart=chartEQ(eq)
  const eqTable=eqFilterTable(eq,P.eqProfileName||'Default')
  const hasTech=tech.length>0
  const TOTAL=hasTech?7:6
  const stats=[
    P.powerRmsW?{v:`${P.powerRmsW} W`,l:'Power RMS'}:null,
    P.sensitivityDb?{v:`${P.sensitivityDb} dB`,l:'Sensitivity'}:null,
    P.impedanceOhms?{v:`${P.impedanceOhms} Ω`,l:'Impedance'}:null,
    P.depthMm?{v:`${P.depthMm} mm`,l:'Depth'}:null,
  ].filter(Boolean) as {v:string,l:string}[]
  return `${coverPage(P,hero,stats)}

<!-- SPECS -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,2,TOTAL)}
  <div class="spec-body">
    <div class="spec-title">Technical Specifications</div>
    <div class="spec-cols">
      <div class="spec-col">
        <div class="sg">Acoustic Performance</div>
        ${sr('Power RMS',P.powerRmsW?`${P.powerRmsW} W`:null)}
        ${sr('Power Peak',P.powerPeakW?`${P.powerPeakW} W`:null)}
        ${sr('Sensitivity',P.sensitivityDb?`${P.sensitivityDb} dB / 1W / 1m`:null)}
        ${sr('Impedance',P.impedanceOhms?`${P.impedanceOhms} Ω`:null)}
        ${sr('Max SPL',P.splMaxDb?`${P.splMaxDb} dB`:null)}
        ${sr('THD+N',P.thdN)}
        ${sr('Frequency Range',P.freqHighHz?`${P.freqLowHz} Hz – ${Math.round(P.freqHighHz/1000)} kHz ${P.freqQualifier||''}`:null)}
        ${sr('Directivity H',P.directivityHDeg?`${P.directivityHDeg}° (−6 dB, 1 kHz)`:null)}
        ${sr('Directivity V',P.directivityVDeg?`${P.directivityVDeg}° (−6 dB, 1 kHz)`:null)}
        ${sr('Driver Config',P.driverDescription)}
        ${sr('Crossover',P.crossoverType)}
        ${sr('Crossover Freq',P.crossoverFrequency?`${P.crossoverFrequency} Hz`:P.recommendedCrossoverHz?`${P.recommendedCrossoverHz} Hz (rec.)`:null)}
        ${sr('EQ Profile',P.eqProfileName||'Default')}
        <div class="sg">Connectivity</div>
        ${sr('Connector',P.speakerWireConnector)}
        ${sr('Wire Gauge',P.wireGaugeRecommended)}
      </div>
      <div class="spec-col">
        <div class="sg">Physical</div>
        ${sr('Dimensions',dims)}
        ${sr('Weight',P.weightKg?`${P.weightKg} kg`:null)}
        ${sr('Housing',P.housingMaterial)}
        ${sr('Grille',P.grilleMaterial)}
        ${sr('Paintable Grille',P.paintableGrille!=null?(P.paintableGrille?'Yes':'No'):null)}
        <div class="sg">Environmental</div>
        ${sr('IP Rating',P.ipRating)}
        ${sr('Mounting',P.mountingMethods)}
        <div class="sg">Colour & Finish</div>
        ${sr('Finishes',(P.colorsStandard||'—')+(P.customRalAvailable?' · Custom RAL':''))}
        <div class="sg">Product</div>
        ${sr('Series',P.series)}
        ${sr('SKU',P.skuBase)}
        ${sr('Variants',P.skuVariants)}
        ${sr('Since',P.launchYear?String(P.launchYear):null)}
      </div>
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- FREQ RESPONSE -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,3,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Frequency Response</div>
    <div class="chart-sub">On-axis · 1W / 1m · anechoic · ${P.freqLowHz}Hz – ${Math.round((P.freqHighHz||20000)/1000)}kHz ${P.freqQualifier||''} · ${P.sensitivityDb}dB sensitivity · raw acoustic, no EQ</div>
    <div class="chart-wrap">${frChart}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- DIRECTIVITY -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,4,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Directivity Pattern</div>
    <div class="chart-sub">Normalised polar response · H ${P.directivityHDeg}° / V ${P.directivityVDeg}° at −6 dB · 1 kHz · multi-frequency overlay</div>
    <div class="chart-wrap">${polChart}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- SPL -->
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

<!-- EQ -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,6,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Recommended EQ</div>
    <div class="chart-sub">Profile: ${P.eqProfileName||'Default'} · combined biquad cascade (bold) with individual filter contributions (dashed)</div>
    <div class="chart-wrap" style="flex:1;min-height:0">${eqChart}</div>
    ${eqTable}
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

${hasTech?techPage(tech,7,TOTAL,P.productName):''}`
}

function buildSubwooferHtml(P: any, hero: string, eq: any[], dims: string, tech: string[]): string {
  const sens=P.sensitivityDb||88
  const frChart=chartSubFreqResponse(P.freqLowHz||25,P.freqHighHz||300,sens)
  const splChart=chartSPL(sens,P.powerRmsW||1,P.powerPeakW||P.powerRmsW*1.5||2,P.splMaxDb||0)
  const eqChart=chartEQ(eq)
  const eqTable=eqFilterTable(eq,P.eqProfileName||'Default')
  const hasTech=tech.length>0
  const TOTAL=hasTech?5:4
  const stats=[
    P.powerRmsW?{v:`${P.powerRmsW} W`,l:'Power RMS'}:null,
    P.sensitivityDb?{v:`${P.sensitivityDb} dB`,l:'Sensitivity'}:null,
    P.freqLowHz?{v:`${P.freqLowHz} Hz`,l:'Freq Low'}:null,
    P.splMaxDb?{v:`${P.splMaxDb} dB`,l:'Max SPL'}:null,
  ].filter(Boolean) as {v:string,l:string}[]
  return `${coverPage(P,hero,stats)}

<!-- SPECS -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,2,TOTAL)}
  <div class="spec-body">
    <div class="spec-title">Technical Specifications</div>
    <div class="spec-cols">
      <div class="spec-col">
        <div class="sg">Acoustic Performance</div>
        ${sr('Power RMS',P.powerRmsW?`${P.powerRmsW} W`:null)}
        ${sr('Power Peak',P.powerPeakW?`${P.powerPeakW} W`:null)}
        ${sr('Sensitivity',P.sensitivityDb?`${P.sensitivityDb} dB / 1W / 1m`:null)}
        ${sr('Impedance',P.impedanceOhms?`${P.impedanceOhms} Ω`:null)}
        ${sr('Max SPL',P.splMaxDb?`${P.splMaxDb} dB`:null)}
        ${sr('THD+N',P.thdN)}
        ${sr('Frequency Range',P.freqHighHz?`${P.freqLowHz} Hz – ${P.freqHighHz} Hz ${P.freqQualifier||''}`:null)}
        ${sr('Driver',P.driverDescription)}
        ${sr('Driver Size',P.driverSize)}
        ${sr('Crossover',P.crossoverType)}
        ${sr('EQ Profile',P.eqProfileName||'Default')}
        ${P.powerType==='Powered'?`<div class="sg">Electronics</div>
        ${sr('Inputs',P.inputs)}
        ${sr('Outputs',P.outputs)}
        ${sr('DSP',P.hasDsp?'Built-in':'None')}`:'' }
        <div class="sg">Connectivity</div>
        ${sr('Connector',P.speakerWireConnector||'Binding Post')}
        ${sr('Wire Gauge',P.wireGaugeRecommended)}
      </div>
      <div class="spec-col">
        <div class="sg">Physical</div>
        ${sr('Dimensions',dims)}
        ${sr('Weight',P.weightKg?`${P.weightKg} kg`:null)}
        ${sr('Housing',P.housingMaterial)}
        ${sr('Grille',P.grilleMaterial)}
        <div class="sg">Installation</div>
        ${sr('IP Rating',P.ipRating)}
        ${sr('Mounting',P.mountingMethod||P.mountingMethods)}
        ${sr('Cavity Depth',P.requiredCavityDepthMm?`${P.requiredCavityDepthMm} mm (min)`:null)}
        ${sr('Cutout H',P.cutoutHeightMm?`${P.cutoutHeightMm} mm`:null)}
        ${sr('Cutout W',P.cutoutWidthMm?`${P.cutoutWidthMm} mm`:null)}
        <div class="sg">Product</div>
        ${sr('Series',P.series)}
        ${sr('SKU',P.skuBase)}
        ${sr('Power Type',P.powerType)}
        ${sr('Since',P.launchYear?String(P.launchYear):null)}
      </div>
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- FREQ RESPONSE -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,3,TOTAL)}
  <div class="chart-body">
    <div class="chart-h">Frequency Response</div>
    <div class="chart-sub">On-axis · 1W / 1m · anechoic · ${P.freqLowHz} Hz – ${P.freqHighHz} Hz ${P.freqQualifier||''} · raw acoustic response</div>
    <div class="chart-wrap">${frChart}</div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

<!-- SPL + EQ -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,4,TOTAL)}
  <div class="chart-body" style="flex-direction:row;gap:10px">
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <div class="chart-h" style="font-size:20px">SPL vs Distance</div>
      <div class="chart-sub">Inverse square law · ${P.sensitivityDb}dB/1W/1m</div>
      <div class="chart-wrap">${splChart}</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <div class="chart-h" style="font-size:20px">Recommended EQ</div>
      <div class="chart-sub">Profile: ${P.eqProfileName||'Default'} · RBJ biquad cascade</div>
      <div class="chart-wrap" style="flex:1;min-height:0">${eqChart}</div>
      ${eqTable}
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

${hasTech?techPage(tech,5,TOTAL,P.productName):''}`
}

function buildAmplifierHtml(P: any, hero: string, tech: string[]): string {
  const hasTech=tech.length>0
  const TOTAL=hasTech?3:2
  const stats=[
    P.powerRmsW?{v:`${P.powerRmsW} W`,l:'Total Power'}:null,
    P.channels?{v:String(P.channels),l:'Channels'}:null,
    P.impedanceOhms?{v:`${P.impedanceOhms} Ω`,l:'Load'}:null,
    P.hasDsp?{v:'Built-In',l:'DSP'}:{v:'None',l:'DSP'},
  ].filter(Boolean) as {v:string,l:string}[]

  // Parse channels from product name / tagline
  const chMatch=(P.tagline||P.productName||'').match(/(\d+)-?[Cc]h/)
  const channels=chMatch?chMatch[1]:null
  const pwrPerCh=channels&&P.powerRmsW?Math.round(P.powerRmsW/parseInt(channels)):null

  return `${coverPage(P,hero,stats)}

<!-- SPECS -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,2,TOTAL)}
  <div class="spec-body">
    <div class="spec-title">Technical Specifications</div>
    <div class="spec-cols">
      <div class="spec-col">
        <div class="sg">Amplifier</div>
        ${sr('Total Power RMS',P.powerRmsW?`${P.powerRmsW} W`:null)}
        ${pwrPerCh?sr('Power Per Channel',`${pwrPerCh} W`):''}
        ${channels?sr('Channels',channels):''}
        ${sr('Load Impedance',P.impedanceOhms?`${P.impedanceOhms} Ω`:null)}
        ${sr('Class','Class D')}
        ${sr('THD+N',P.thdN)}
        <div class="sg">DSP</div>
        ${sr('DSP',P.hasDsp?'Built-In':'None')}
        ${sr('DSP Spec',P.dspProcessorSpec)}
        ${sr('Software',P.desktopSoftwareName)}
        ${sr('Comms',P.communicationPorts)}
        ${P.hasStreamer?`<div class="sg">Streaming</div>
        ${sr('Protocols','AirPlay 2, Bluetooth 5.0 APTX-HD, Spotify Connect')}`:'' }
      </div>
      <div class="spec-col">
        <div class="sg">Connectivity</div>
        ${sr('Inputs',P.inputs)}
        ${sr('Outputs',P.outputs)}
        <div class="sg">Physical</div>
        ${sr('Height',P.heightMm?`${P.heightMm} mm`:null)}
        ${sr('Width',P.widthMm?`${P.widthMm} mm`:null)}
        ${sr('Depth',P.depthMm?`${P.depthMm} mm`:null)}
        ${sr('Weight',P.weightKg?`${P.weightKg} kg`:null)}
        ${sr('Housing',P.housingMaterial)}
        ${sr('IP Rating',P.ipRating)}
        <div class="sg">Product</div>
        ${sr('Series',P.series)}
        ${sr('SKU',P.skuBase)}
        ${sr('Since',P.launchYear?String(P.launchYear):null)}
      </div>
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

${hasTech?techPage(tech,3,TOTAL,P.productName):''}`
}

function buildStreamerHtml(P: any, hero: string, tech: string[]): string {
  const hasTech=tech.length>0
  const TOTAL=hasTech?3:2
  const stats=[
    {v:'AirPlay 2',l:'Protocol'},
    {v:'BT 5.0',l:'Bluetooth'},
    {v:P.powerRmsW?`${P.powerRmsW} W`:'—',l:'Power'},
    {v:P.housingMaterial||'Aluminium',l:'Housing'},
  ]
  return `${coverPage(P,hero,stats)}

<!-- SPECS -->
<div class="page">
  <div class="topbar"></div>
  ${pageHdr(P.productName,2,TOTAL)}
  <div class="spec-body">
    <div class="spec-title">Technical Specifications</div>
    <div class="spec-cols">
      <div class="spec-col">
        <div class="sg">Streaming Protocols</div>
        ${sr('Wireless','AirPlay 2, Spotify Connect, Bluetooth 5.0 APTX-HD')}
        ${sr('Digital','SPDIF Optical, USB Audio, DAC')}
        ${sr('Network','Wi-Fi 802.11 a/b/g/n/ac')}
        <div class="sg">Connectivity</div>
        ${sr('Inputs',P.inputs)}
        ${sr('Outputs',P.outputs)}
      </div>
      <div class="spec-col">
        <div class="sg">Physical</div>
        ${sr('Height',P.heightMm?`${P.heightMm} mm`:null)}
        ${sr('Width',P.widthMm?`${P.widthMm} mm`:null)}
        ${sr('Depth',P.depthMm?`${P.depthMm} mm`:null)}
        ${sr('Weight',P.weightKg?`${P.weightKg} kg`:null)}
        ${sr('Housing',P.housingMaterial)}
        <div class="sg">Product</div>
        ${sr('Series',P.series)}
        ${sr('SKU',P.skuBase)}
        ${sr('Since',P.launchYear?String(P.launchYear):null)}
      </div>
    </div>
  </div>
  ${pageFtr()}
  <div class="botbar"></div>
</div>

${hasTech?techPage(tech,3,TOTAL,P.productName):''}`
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params
  try {
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id,productName,productFullName,tagline,shortDescription,series,skuBase,skuVariants,slug,
      "catSlug":category->slug.current,
      sensitivityDb,powerRmsW,powerPeakW,impedanceOhms,splMaxDb,thdN,
      freqLowHz,freqHighHz,freqQualifier,directivityHDeg,directivityVDeg,
      heightMm,widthMm,depthMm,diameterMm,weightKg,driverDescription,driverSize,
      crossoverType,crossoverFrequency,recommendedCrossoverHz,
      housingMaterial,grilleMaterial,speakerWireConnector,wireGaugeRecommended,
      ipRating,mountingMethods,mountingMethod,requiredCavityDepthMm,
      cutoutHeightMm,cutoutWidthMm,paintableGrille,
      launchYear,powerType,hasDsp,hasStreamer,
      dspProcessorSpec,desktopSoftwareName,communicationPorts,
      inputs,outputs,colorsStandard,customRalAvailable,marineTreatable,
      eqData,eqProfileName,proprietaryTechBadges,
      heroImage,specSheetRef,specSheetHash
    }`)
    if(!P) return NextResponse.json({error:'Product not found'},{status:404})

    const kind=detectKind(P)

    // Cache hash includes kind so type changes bust the cache
    const h=Buffer.from(`${P.productName}${P.powerRmsW}${P.sensitivityDb}${P.eqData||''}${kind}v4ss`).toString('base64').replace(/\W/g,'').slice(0,12)
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

    // Dimensions
    const dims=P.diameterMm?`⌀ ${P.diameterMm} mm`:`${P.heightMm||'—'} × ${P.widthMm||'—'} × ${P.depthMm||'—'} mm`

    // Build HTML by type
    const css=buildCss(fontCss)
    let body=''
    if(kind==='speaker') body=buildSpeakerHtml(P,hero,eq,dims,tech)
    else if(kind==='subwoofer') body=buildSubwooferHtml(P,hero,eq,dims,tech)
    else if(kind==='amplifier') body=buildAmplifierHtml(P,hero,tech)
    else body=buildStreamerHtml(P,hero,tech)

    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`

    // Puppeteer
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
