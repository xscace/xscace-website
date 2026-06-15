// web/src/app/api/manual/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

// ── Utilities ──────────────────────────────────────────────────────────────────
function sanityImgUrl(ref: string, w = 800) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=80`
}
async function imgB64(ref: string | null, w = 800): Promise<string> {
  if (!ref) return ''
  try {
    const r = await fetch(sanityImgUrl(ref, w))
    if (!r.ok) return ''
    return `data:${r.headers.get('content-type')||'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
  } catch { return '' }
}
function getRef(o: any): string { return o?.asset?._ref || '' }
function fileCdn(id: string) {
  const b = id.replace('file-',''), i = b.lastIndexOf('-')
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
    if (fs.existsSync(p)) css += `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url('data:font/truetype;base64,${fs.readFileSync(p).toString('base64')}') format('truetype');}\n`
  }
  const mw = path.join(process.cwd(), 'public', 'fonts', 'MagmaWave.otf')
  if (fs.existsSync(mw)) css += `@font-face{font-family:'MagmaWave';src:url('data:font/otf;base64,${fs.readFileSync(mw).toString('base64')}') format('opentype');}\n`
  return css
}

// ── DIAGRAMS ───────────────────────────────────────────────────────────────────
// All pure SVG, XSCACE palette: #090909 bg, #c9a96e champagne, #eeebe5 light, #7a776f muted
const C = { bg: '#090909', ch: '#c9a96e', lt: '#eeebe5', mu: '#7a776f', dim: '#3a3835', wall: '#1a1a18', acc: 'rgba(201,169,110,0.15)' }

function svgWrap(w: number, h: number, content: string): string {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  ${content}
</svg>`
}

function label(x: number, y: number, text: string, size=7, color=C.mu, anchor='middle'): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-family="DM Mono, monospace" letter-spacing="0.05em">${text}</text>`
}

function dimLine(x1: number, y1: number, x2: number, y2: number, txt: string, side: 'h'|'v'='h'): string {
  const mx = (x1+x2)/2, my = (y1+y2)/2
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="3,2"/>
  <line x1="${x1}" y1="${y1-4}" x2="${x1}" y2="${y1+4}" stroke="${C.ch}" stroke-width="0.5"/>
  <line x1="${x2}" y1="${y2-4}" x2="${x2}" y2="${y2+4}" stroke="${C.ch}" stroke-width="0.5"/>
  ${label(mx, side==='h' ? my-3 : my, txt, 6, C.ch)}`
}

// ── Stereo positioning diagram (top-down room view) ───────────────────────────
function stereoDiagram(it: string, spc: number, minH: string): string {
  const isCeiling = it === 'ceiling-circular' || it === 'ceiling-rectangular' || it.startsWith('inwall')
  const isOutdoor = it === 'spirea'

  if (isOutdoor) {
    // Landscape bird's eye — speakers around a patio
    return svgWrap(280, 160, `
      <!-- patio area -->
      <rect x="80" y="30" width="120" height="100" rx="4" fill="${C.acc}" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(140, 80, 'LISTENING', 6, C.mu)}
      ${label(140, 90, 'AREA', 6, C.mu)}
      <!-- speaker L -->
      <circle cx="50" cy="80" r="10" fill="${C.wall}" stroke="${C.ch}" stroke-width="1"/>
      <circle cx="50" cy="80" r="4" fill="${C.ch}" opacity="0.6"/>
      ${label(50, 100, 'SPK L', 6, C.ch)}
      <!-- speaker R -->
      <circle cx="230" cy="80" r="10" fill="${C.wall}" stroke="${C.ch}" stroke-width="1"/>
      <circle cx="230" cy="80" r="4" fill="${C.ch}" opacity="0.6"/>
      ${label(230, 100, 'SPK R', 6, C.ch)}
      <!-- dispersion arcs -->
      <path d="M50 70 Q95 60 140 65" fill="none" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.5"/>
      <path d="M230 70 Q185 60 140 65" fill="none" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.5"/>
      <!-- distance annotation -->
      <line x1="60" y1="80" x2="220" y2="80" stroke="${C.dim}" stroke-width="0.4" stroke-dasharray="2,2"/>
      ${label(140, 76, 'every 4–6m along path', 6, C.dim)}
      ${label(140, 148, 'TOP-DOWN VIEW · LANDSCAPE', 6, C.mu)}
    `)
  }

  if (isCeiling) {
    // Room top-down with in-ceiling speakers
    return svgWrap(280, 160, `
      <!-- room outline -->
      <rect x="20" y="15" width="240" height="130" rx="3" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      <!-- MLP sofa -->
      <rect x="100" y="105" width="80" height="22" rx="3" fill="${C.acc}" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(140, 119, 'MLP', 6, C.ch)}
      <!-- ceiling speakers -->
      <circle cx="100" cy="45" r="9" fill="${C.bg}" stroke="${C.ch}" stroke-width="1"/>
      <circle cx="100" cy="45" r="3.5" fill="${C.ch}" opacity="0.7"/>
      ${label(100, 35, 'L', 7, C.ch)}
      <circle cx="180" cy="45" r="9" fill="${C.bg}" stroke="${C.ch}" stroke-width="1"/>
      <circle cx="180" cy="45" r="3.5" fill="${C.ch}" opacity="0.7"/>
      ${label(180, 35, 'R', 7, C.ch)}
      <!-- coverage cone lines -->
      <line x1="100" y1="54" x2="90" y2="105" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.5"/>
      <line x1="100" y1="54" x2="140" y2="105" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.5"/>
      <line x1="180" y1="54" x2="140" y2="105" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.5"/>
      <line x1="180" y1="54" x2="190" y2="105" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.5"/>
      <!-- centreline -->
      <line x1="140" y1="15" x2="140" y2="145" stroke="${C.dim}" stroke-width="0.4" stroke-dasharray="3,3"/>
      <!-- speaker spacing dim -->
      <line x1="100" y1="62" x2="180" y2="62" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="100" y1="58" x2="100" y2="66" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="180" y1="58" x2="180" y2="66" stroke="${C.ch}" stroke-width="0.4"/>
      ${label(140, 70, '60% of listener distance', 6, C.ch)}
      ${label(140, 150, 'TOP-DOWN VIEW · IN-CEILING', 6, C.mu)}
    `)
  }

  // Wall-mount stereo (default — Bonsai, Cane, Cedar etc.)
  const toeIn = (it === 'keyhole-wall' || it === 'bracket-wall') ? 20 : 15 // degrees
  const rad = toeIn * Math.PI / 180
  // Speaker positions
  const Lx = 55, Ly = 55, Rx = 225, Ry = 55
  // MLP
  const MLPx = 140, MLPy = 130
  // Toe-in ray from L speaker toward centre
  const rayLen = 90
  const LRayX = Lx + rayLen * Math.sin(rad), LRayY = Ly + rayLen * Math.cos(rad)
  const RRayX = Rx - rayLen * Math.sin(rad), RRayY = Ry + rayLen * Math.cos(rad)

  return svgWrap(280, 160, `
    <!-- front wall -->
    <rect x="20" y="15" width="240" height="12" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
    ${label(140, 24, 'FRONT WALL', 6, C.mu)}
    <!-- floor line -->
    <line x1="20" y1="145" x2="260" y2="145" stroke="rgba(201,169,110,0.2)" stroke-width="0.5"/>
    <!-- MLP chair -->
    <rect x="122" y="120" width="36" height="20" rx="3" fill="${C.acc}" stroke="${C.ch}" stroke-width="0.5"/>
    ${label(140, 133, 'MLP', 6, C.ch)}
    <!-- centreline -->
    <line x1="140" y1="27" x2="140" y2="145" stroke="${C.dim}" stroke-width="0.4" stroke-dasharray="3,3"/>
    <!-- L speaker body -->
    <rect x="${Lx-7}" y="${Ly-18}" width="14" height="36" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="1"/>
    <circle cx="${Lx}" cy="${Ly-6}" r="3" fill="${C.ch}" opacity="0.5"/>
    <circle cx="${Lx}" cy="${Ly+6}" r="3" fill="${C.ch}" opacity="0.5"/>
    ${label(Lx, Ly-24, 'L', 7, C.ch)}
    <!-- R speaker body -->
    <rect x="${Rx-7}" y="${Ry-18}" width="14" height="36" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="1"/>
    <circle cx="${Rx}" cy="${Ry-6}" r="3" fill="${C.ch}" opacity="0.5"/>
    <circle cx="${Rx}" cy="${Ry+6}" r="3" fill="${C.ch}" opacity="0.5"/>
    ${label(Rx, Ry-24, 'R', 7, C.ch)}
    <!-- toe-in rays -->
    <line x1="${Lx}" y1="${Ly}" x2="${LRayX}" y2="${LRayY}" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.7"/>
    <line x1="${Rx}" y1="${Ry}" x2="${RRayX}" y2="${RRayY}" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.7"/>
    <!-- toe-in angle arc -->
    <path d="M ${Lx} ${Ly+18} A 18 18 0 0 1 ${Lx+18*Math.sin(rad).toFixed(2)} ${Ly+18*Math.cos(rad).toFixed(2)}" fill="none" stroke="${C.ch}" stroke-width="0.5"/>
    ${label(Lx+14, Ly+28, `${toeIn}°`, 6, C.ch, 'start')}
    <!-- speaker spacing -->
    <line x1="${Lx+8}" y1="85" x2="${Rx-8}" y2="85" stroke="${C.ch}" stroke-width="0.4"/>
    <line x1="${Lx+8}" y1="81" x2="${Lx+8}" y2="89" stroke="${C.ch}" stroke-width="0.4"/>
    <line x1="${Rx-8}" y1="81" x2="${Rx-8}" y2="89" stroke="${C.ch}" stroke-width="0.4"/>
    ${label(140, 82, spc > 0 ? `${spc}mm c/c` : '~1/3 room width each side', 6, C.ch)}
    <!-- listener distance line -->
    <line x1="258" y1="${Ly}" x2="258" y2="${MLPy}" stroke="${C.ch}" stroke-width="0.4"/>
    <line x1="254" y1="${Ly}" x2="262" y2="${Ly}" stroke="${C.ch}" stroke-width="0.4"/>
    <line x1="254" y1="${MLPy}" x2="262" y2="${MLPy}" stroke="${C.ch}" stroke-width="0.4"/>
    ${label(268, (Ly+MLPy)/2+2, '2–4m', 6, C.ch, 'start')}
    ${label(140, 154, 'TOP-DOWN VIEW · WALL MOUNT', 6, C.mu)}
  `)
}

// ── Installation method diagrams ───────────────────────────────────────────────
function installDiagram(P: any): string {
  const it = P.installationType || ''
  const spc = P.screwSpacingMm || 0
  const cutH = P.cutoutHeightMm || 0
  const cutW = P.cutoutWidthMm || 0
  const cutD = P.cutoutDiameterMm || 0

  if (it === 'keyhole-wall') {
    // Side elevation: wall with two screws, speaker hanging
    const scr = spc || 82
    const midX = 140, wallX = 80, wallW = 8
    const scr1Y = 70, scr2Y = scr1Y + Math.min(scr * 0.5, 60)
    return svgWrap(280, 200, `
      <!-- wall -->
      <rect x="${wallX}" y="20" width="${wallW}" height="160" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(84, 16, 'WALL', 6, C.mu, 'start')}
      <!-- screw 1 -->
      <line x1="${wallX+wallW}" y1="${scr1Y}" x2="${wallX+wallW+22}" y2="${scr1Y}" stroke="${C.lt}" stroke-width="1.5"/>
      <rect x="${wallX+wallW+22}" y="${scr1Y-3}" width="6" height="6" rx="1" fill="${C.ch}"/>
      ${label(wallX+wallW+32, scr1Y+2, 'SCREW 1', 6, C.ch, 'start')}
      <!-- screw 2 -->
      <line x1="${wallX+wallW}" y1="${scr2Y}" x2="${wallX+wallW+22}" y2="${scr2Y}" stroke="${C.lt}" stroke-width="1.5"/>
      <rect x="${wallX+wallW+22}" y="${scr2Y-3}" width="6" height="6" rx="1" fill="${C.ch}"/>
      ${label(wallX+wallW+32, scr2Y+2, 'SCREW 2', 6, C.ch, 'start')}
      <!-- spacing dim -->
      <line x1="${wallX+wallW+12}" y1="${scr1Y}" x2="${wallX+wallW+12}" y2="${scr2Y}" stroke="${C.ch}" stroke-width="0.5"/>
      <line x1="${wallX+wallW+8}" y1="${scr1Y}" x2="${wallX+wallW+16}" y2="${scr1Y}" stroke="${C.ch}" stroke-width="0.5"/>
      <line x1="${wallX+wallW+8}" y1="${scr2Y}" x2="${wallX+wallW+16}" y2="${scr2Y}" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(wallX+wallW+10, (scr1Y+scr2Y)/2+2, `${spc || '82'}mm`, 6, C.ch, 'end')}
      <!-- speaker body hanging on screws -->
      <rect x="${wallX+wallW+20}" y="${scr1Y-8}" width="20" height="${scr2Y-scr1Y+16}" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- keyhole slots on back of speaker (schematic) -->
      <path d="M ${wallX+wallW+22} ${scr1Y} L ${wallX+wallW+22} ${scr1Y-5} A3 3 0 1 0 ${wallX+wallW+22} ${scr1Y}" fill="none" stroke="${C.ch}" stroke-width="0.5" opacity="0.5"/>
      <path d="M ${wallX+wallW+22} ${scr2Y} L ${wallX+wallW+22} ${scr2Y-5} A3 3 0 1 0 ${wallX+wallW+22} ${scr2Y}" fill="none" stroke="${C.ch}" stroke-width="0.5" opacity="0.5"/>
      <!-- speaker grille dots -->
      <circle cx="${wallX+wallW+30}" cy="${(scr1Y+scr2Y)/2-6}" r="2.5" fill="${C.ch}" opacity="0.5"/>
      <circle cx="${wallX+wallW+30}" cy="${(scr1Y+scr2Y)/2+6}" r="2.5" fill="${C.ch}" opacity="0.5"/>
      <!-- labels -->
      ${label(140, 185, `KEYHOLE WALL MOUNT · ${spc ? spc+'mm SCREW SPACING' : 'PER TEMPLATE'}`, 6, C.mu)}
      ${label(wallX+wallW+30, scr1Y-14, P.productName||'SPEAKER', 6, C.lt)}
      <!-- screw size note -->
      ${label(wallX+wallW+32, scr2Y+18, P.screwSize ? P.screwSize+' SCREW' : '', 6, C.mu, 'start')}
    `)
  }

  if (it === 'bracket-wall') {
    const scr = spc || 120
    const spH = Math.min(scr * 0.55, 70)
    const sY1 = 65, sY2 = sY1 + spH
    const wallX = 70, wallW = 8
    return svgWrap(280, 200, `
      <!-- wall -->
      <rect x="${wallX}" y="20" width="${wallW}" height="160" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(78+8, 16, 'WALL', 6, C.mu, 'start')}
      <!-- screws -->
      <circle cx="${wallX+wallW+8}" cy="${sY1}" r="4" fill="${C.ch}" opacity="0.8"/>
      <circle cx="${wallX+wallW+8}" cy="${sY2}" r="4" fill="${C.ch}" opacity="0.8"/>
      <!-- bracket arm -->
      <rect x="${wallX+wallW}" y="${sY1-3}" width="28" height="6" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.7"/>
      <rect x="${wallX+wallW}" y="${sY2-3}" width="28" height="6" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.7"/>
      <!-- vertical bracket bar -->
      <rect x="${wallX+wallW+24}" y="${sY1}" width="4" height="${spH}" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.7"/>
      <!-- speaker body on bracket -->
      <rect x="${wallX+wallW+28}" y="${sY1-14}" width="42" height="${spH+28}" rx="3" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <circle cx="${wallX+wallW+49}" cy="${sY1+spH/2-8}" r="5" fill="${C.ch}" opacity="0.4"/>
      <circle cx="${wallX+wallW+49}" cy="${sY1+spH/2+8}" r="5" fill="${C.ch}" opacity="0.4"/>
      <!-- spacing dim -->
      <line x1="${wallX+wallW+14}" y1="${sY1}" x2="${wallX+wallW+14}" y2="${sY2}" stroke="${C.ch}" stroke-width="0.5"/>
      <line x1="${wallX+wallW+10}" y1="${sY1}" x2="${wallX+wallW+18}" y2="${sY1}" stroke="${C.ch}" stroke-width="0.5"/>
      <line x1="${wallX+wallW+10}" y1="${sY2}" x2="${wallX+wallW+18}" y2="${sY2}" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(wallX+wallW+12, (sY1+sY2)/2+2, `${spc||120}mm`, 6, C.ch, 'end')}
      ${label(wallX+wallW+49, sY1-20, P.productName||'SPEAKER', 6, C.lt)}
      ${label(140, 185, `BRACKET WALL MOUNT · ${spc ? spc+'mm SCREW SPACING' : 'PER TEMPLATE'}`, 6, C.mu)}
    `)
  }

  if (it === 'ceiling-circular') {
    const d = cutD || 209
    const r = Math.min(d * 0.18, 45)
    return svgWrap(280, 200, `
      <!-- ceiling -->
      <rect x="20" y="30" width="240" height="14" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(140, 26, 'CEILING', 6, C.mu)}
      <!-- cutout hole in ceiling -->
      <circle cx="140" cy="44" r="${r}" fill="${C.bg}" stroke="${C.ch}" stroke-width="1"/>
      <!-- cutout diameter dim -->
      <line x1="${140-r}" y1="44" x2="${140+r}" y2="44" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${140-r}" y1="40" x2="${140-r}" y2="48" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${140+r}" y1="40" x2="${140+r}" y2="48" stroke="${C.ch}" stroke-width="0.4"/>
      ${label(140, 42, `⌀ ${d}mm`, 6, C.ch)}
      <!-- speaker flush-mounted -->
      <circle cx="140" cy="44" r="${r-4}" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <circle cx="140" cy="44" r="${r*0.35}" fill="${C.ch}" opacity="0.4"/>
      <circle cx="140" cy="44" r="${r*0.18}" fill="${C.ch}" opacity="0.7"/>
      <!-- dog-leg clips -->
      <line x1="${140-r+2}" y1="38" x2="${140-r-6}" y2="32" stroke="${C.ch}" stroke-width="1" stroke-linecap="round"/>
      <line x1="${140+r-2}" y1="38" x2="${140+r+6}" y2="32" stroke="${C.ch}" stroke-width="1" stroke-linecap="round"/>
      ${label(140-r-8, 30, 'CLIP', 5, C.mu, 'end')}
      ${label(140+r+8, 30, 'CLIP', 5, C.mu, 'start')}
      <!-- cable drop -->
      <line x1="140" y1="${44+r-4}" x2="140" y2="130" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.6"/>
      ${label(148, 110, 'SPEAKER CABLE', 6, C.mu, 'start')}
      <!-- cavity depth -->
      <line x1="195" y1="30" x2="195" y2="44" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2"/>
      <line x1="191" y1="30" x2="199" y2="30" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="191" y1="44" x2="199" y2="44" stroke="${C.ch}" stroke-width="0.4"/>
      ${label(205, 38, P.requiredCavityDepthMm ? P.requiredCavityDepthMm+'mm\ncavity' : 'cavity', 6, C.ch, 'start')}
      ${label(140, 185, `CIRCULAR CEILING CUTOUT · ⌀${d}mm`, 6, C.mu)}
    `)
  }

  if (it === 'ceiling-rectangular') {
    const cH = cutH || 168, cW = cutW || 53
    const scale = Math.min(120/cW, 60/cH, 1)
    const dW = Math.round(cW * scale), dH = Math.round(cH * scale)
    const cX = 140 - dW/2, cY = 44
    return svgWrap(280, 200, `
      <!-- ceiling -->
      <rect x="20" y="30" width="240" height="14" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(140, 26, 'CEILING', 6, C.mu)}
      <!-- rectangular cutout -->
      <rect x="${cX}" y="${cY}" width="${dW}" height="${dH}" fill="${C.bg}" stroke="${C.ch}" stroke-width="1"/>
      <!-- dim lines -->
      <line x1="${cX}" y1="${cY+dH+8}" x2="${cX+dW}" y2="${cY+dH+8}" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${cX}" y1="${cY+dH+4}" x2="${cX}" y2="${cY+dH+12}" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${cX+dW}" y1="${cY+dH+4}" x2="${cX+dW}" y2="${cY+dH+12}" stroke="${C.ch}" stroke-width="0.4"/>
      ${label(140, cY+dH+18, `${cW}mm wide`, 6, C.ch)}
      <line x1="${cX-10}" y1="${cY}" x2="${cX-10}" y2="${cY+dH}" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${cX-14}" y1="${cY}" x2="${cX-6}" y2="${cY}" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${cX-14}" y1="${cY+dH}" x2="${cX-6}" y2="${cY+dH}" stroke="${C.ch}" stroke-width="0.4"/>
      ${label(cX-12, cY+dH/2+2, `${cH}mm`, 6, C.ch, 'end')}
      <!-- ghost speaker flush in slot -->
      <rect x="${cX+2}" y="${cY+2}" width="${dW-4}" height="${dH-4}" rx="1" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.5"/>
      <!-- magnet symbol -->
      ${label(140, cY+dH/2+2, 'MAGNET', 5, C.ch)}
      <!-- safety wire -->
      <line x1="140" y1="${cY+dH-4}" x2="140" y2="${cY+dH+20}" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="2,2"/>
      ${label(148, cY+dH+22, 'SAFETY HARNESS', 5, C.mu, 'start')}
      ${label(140, 185, `GHOST 2.0 CEILING CUTOUT · ${cW}×${cH}mm`, 6, C.mu)}
    `)
  }

  if (it === 'inwall-dogleg' || it === 'inwall-springclip') {
    const cH = cutH || 230, cW = cutW || 328
    const scale = Math.min(100/cW, 90/cH, 0.9)
    const dW = Math.round(cW * scale), dH = Math.round(cH * scale)
    const wallX = 60, wallW = 10
    const cY = 60 - dH/2
    return svgWrap(280, 200, `
      <!-- wall cross-section -->
      <rect x="${wallX}" y="15" width="${wallW}" height="170" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(wallX+wallW+2, 12, 'WALL', 6, C.mu, 'start')}
      <!-- cutout in wall -->
      <rect x="${wallX}" y="${cY}" width="${wallW}" height="${dH}" fill="${C.bg}" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="2,2"/>
      <!-- speaker in cutout -->
      <rect x="${wallX-2}" y="${cY+4}" width="${wallW+24}" height="${dH-8}" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- driver -->
      <circle cx="${wallX+wallW+10}" cy="${60}" r="${Math.min(dH*0.3, 20)}" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.6"/>
      <circle cx="${wallX+wallW+10}" cy="${60}" r="${Math.min(dH*0.12, 8)}" fill="${C.ch}" opacity="0.5"/>
      ${it === 'inwall-dogleg' ?
        // dog-leg clip behind wall
        `<path d="M ${wallX} ${cY+10} L ${wallX-8} ${cY+4} L ${wallX-8} ${cY-2}" fill="none" stroke="${C.ch}" stroke-width="1.2" stroke-linecap="round"/>
         <path d="M ${wallX} ${cY+dH-10} L ${wallX-8} ${cY+dH-4} L ${wallX-8} ${cY+dH+2}" fill="none" stroke="${C.ch}" stroke-width="1.2" stroke-linecap="round"/>
         ${label(wallX-10, cY+8, 'DOG-LEG', 5, C.ch, 'end')}
         ${label(wallX-10, cY+dH-6, 'DOG-LEG', 5, C.ch, 'end')}`
        :
        // spring clip
        `<path d="M ${wallX} ${cY+8} Q ${wallX-10} ${cY+14} ${wallX-8} ${cY+20} Q ${wallX-6} ${cY+26} ${wallX} ${cY+30}" fill="none" stroke="${C.ch}" stroke-width="1.2"/>
         <path d="M ${wallX} ${cY+dH-8} Q ${wallX-10} ${cY+dH-14} ${wallX-8} ${cY+dH-20} Q ${wallX-6} ${cY+dH-26} ${wallX} ${cY+dH-30}" fill="none" stroke="${C.ch}" stroke-width="1.2"/>
         ${label(wallX-12, cY+20, 'SPRING', 5, C.ch, 'end')}
         ${label(wallX-12, cY+dH-18, 'SPRING', 5, C.ch, 'end')}`
      }
      <!-- cutout dims -->
      <line x1="${wallX+wallW+22}" y1="${cY}" x2="${wallX+wallW+22}" y2="${cY+dH}" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${wallX+wallW+18}" y1="${cY}" x2="${wallX+wallW+26}" y2="${cY}" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="${wallX+wallW+18}" y1="${cY+dH}" x2="${wallX+wallW+26}" y2="${cY+dH}" stroke="${C.ch}" stroke-width="0.4"/>
      ${label(wallX+wallW+34, cY+dH/2+2, `${cH}mm`, 6, C.ch, 'start')}
      ${label(140, 185, `${it === 'inwall-dogleg' ? 'DOG-LEG' : 'SPRING CLIP'} IN-WALL · ${cutH||''}×${cutW||''}mm CUTOUT`, 6, C.mu)}
    `)
  }

  if (it === 'inwall-sub') {
    const cH = cutH || 365, cW = cutW || 225
    const scale = Math.min(90/cW, 90/cH, 0.7)
    const dW = Math.round(cW * scale), dH = Math.round(cH * scale)
    const wallX = 70
    const cY = 55 - dH/2
    return svgWrap(280, 200, `
      <rect x="${wallX}" y="15" width="10" height="170" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(82, 12, 'WALL', 6, C.mu, 'start')}
      <rect x="${wallX}" y="${cY}" width="10" height="${dH}" fill="${C.bg}" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="2,2"/>
      <rect x="${wallX-2}" y="${cY+4}" width="${dW+4}" height="${dH-8}" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- sub woofer cone -->
      <circle cx="${wallX+dW/2+2}" cy="${55}" r="${Math.min(dH*0.38, 34)}" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.7"/>
      <circle cx="${wallX+dW/2+2}" cy="${55}" r="${Math.min(dH*0.16, 14)}" fill="${C.ch}" opacity="0.4"/>
      <!-- flange screws -->
      <circle cx="${wallX+4}" cy="${cY+12}" r="3" fill="none" stroke="${C.ch}" stroke-width="0.5"/>
      <circle cx="${wallX+4}" cy="${cY+dH-12}" r="3" fill="none" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(wallX-2, cY+14, 'SCREW', 5, C.mu, 'end')}
      ${label(wallX-2, cY+dH-10, 'SCREW', 5, C.mu, 'end')}
      <!-- grille -->
      <rect x="${wallX+dW+5}" y="${cY+4}" width="6" height="${dH-8}" rx="1" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(wallX+dW+14, 55, 'GRILLE', 5, C.mu, 'start')}
      ${label(140, 185, `IN-WALL SUBWOOFER · ${cutH||''}×${cutW||''}mm CUTOUT`, 6, C.mu)}
    `)
  }

  if (it === 'banyan-canopy') {
    return svgWrap(280, 200, `
      <!-- Pith base -->
      <rect x="95" y="130" width="90" height="50" rx="4" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      ${label(140, 165, 'BANYAN PITH', 6, C.ch)}
      ${label(140, 175, '(powered sub + DSP)', 5, C.mu)}
      <!-- Pith top socket -->
      <rect x="117" y="118" width="46" height="14" rx="2" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.5"/>
      <!-- Canopy body -->
      <rect x="110" y="48" width="60" height="70" rx="3" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- Canopy drivers -->
      <circle cx="140" cy="68" r="7" fill="${C.ch}" opacity="0.35"/>
      <circle cx="140" cy="90" r="7" fill="${C.ch}" opacity="0.35"/>
      <circle cx="140" cy="110" r="5" fill="${C.ch}" opacity="0.35"/>
      ${label(140, 38, 'BANYAN CANOPY', 6, C.ch)}
      ${label(140, 28, '(line array speaker)', 5, C.mu)}
      <!-- Speakon cable -->
      <line x1="140" y1="118" x2="140" y2="132" stroke="${C.ch}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="140" cy="125" r="3" fill="${C.ch}" opacity="0.7"/>
      ${label(150, 126, 'SPEAKON CABLE', 6, C.mu, 'start')}
      <!-- pole mount option -->
      <line x1="95" y1="155" x2="60" y2="155" stroke="${C.dim}" stroke-width="0.5" stroke-dasharray="2,2"/>
      ${label(58, 155, 'pole / wall / hang', 5, C.mu, 'end')}
      ${label(140, 190, 'BANYAN SET ASSEMBLY', 6, C.mu)}
    `)
  }

  if (it === 'spirea') {
    return svgWrap(280, 200, `
      <!-- ground -->
      <rect x="20" y="150" width="240" height="30" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      ${label(140, 165, 'GROUND / SOIL', 6, C.mu)}
      <!-- spike -->
      <line x1="140" y1="100" x2="140" y2="150" stroke="${C.lt}" stroke-width="2" stroke-linecap="round"/>
      <polygon points="136,150 144,150 140,162" fill="${C.ch}"/>
      ${label(155, 135, 'SPIKE', 6, C.mu, 'start')}
      <!-- speaker body -->
      <circle cx="140" cy="78" r="22" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <circle cx="140" cy="78" r="10" fill="${C.ch}" opacity="0.35"/>
      <circle cx="140" cy="78" r="4" fill="${C.ch}" opacity="0.7"/>
      <!-- hanging alt -->
      <line x1="80" y1="78" x2="110" y2="78" stroke="${C.dim}" stroke-width="0.5" stroke-dasharray="2,2"/>
      <line x1="80" y1="20" x2="80" y2="78" stroke="${C.dim}" stroke-width="0.5" stroke-dasharray="2,2"/>
      ${label(80, 16, 'HANGING MOUNT', 5, C.mu)}
      ${label(80, 22, '(alternative)', 5, C.mu)}
      <!-- cable -->
      <line x1="162" y1="78" x2="220" y2="78" stroke="${C.ch}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.6"/>
      ${label(222, 78, 'CABLE', 5, C.mu, 'start')}
      ${label(140, 188, 'SPIREA · SPIKE OR HANGING MOUNT', 6, C.mu)}
    `)
  }

  if (it === 'powered-sub' || it === 'passive-sub') {
    const powered = it === 'powered-sub'
    return svgWrap(280, 200, `
      <!-- sub box -->
      <rect x="80" y="60" width="120" height="100" rx="4" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- woofer cone -->
      <circle cx="140" cy="110" r="38" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.7"/>
      <circle cx="140" cy="110" r="18" fill="${C.ch}" opacity="0.2"/>
      <circle cx="140" cy="110" r="7" fill="${C.ch}" opacity="0.5"/>
      <!-- rear panel inputs -->
      <rect x="80" y="148" width="120" height="12" rx="0" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.3"/>
      ${powered ?
        `<!-- LFE RCA -->
         <circle cx="105" cy="154" r="5" fill="none" stroke="${C.ch}" stroke-width="0.8"/>
         ${label(105, 170, 'LFE IN', 5, C.ch)}
         <!-- power -->
         <rect x="155" y="150" width="14" height="8" rx="1" fill="none" stroke="${C.lt}" stroke-width="0.5"/>
         ${label(162, 170, 'POWER', 5, C.lt)}`
        :
        `<!-- binding posts -->
         <circle cx="108" cy="154" r="4" fill="${C.ch}" opacity="0.5"/>
         <circle cx="122" cy="154" r="4" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.5"/>
         ${label(108, 170, '+', 6, C.ch)}
         ${label(122, 170, '−', 6, C.ch)}`
      }
      <!-- floor -->
      <line x1="60" y1="160" x2="220" y2="160" stroke="rgba(201,169,110,0.15)" stroke-width="0.5"/>
      ${label(140, 188, powered ? 'POWERED SUBWOOFER · LFE SIGNAL INPUT' : 'PASSIVE SUBWOOFER · SPEAKER WIRE INPUT', 6, C.mu)}
    `)
  }

  if (it === 'dsp-amplifier') {
    const ch = P.channelCount || 4
    const chW = Math.min(160 / ch, 36)
    return svgWrap(280, 200, `
      <!-- rack unit body -->
      <rect x="40" y="60" width="200" height="70" rx="3" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- rack ears -->
      <rect x="20" y="65" width="20" height="60" rx="2" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      <rect x="240" y="65" width="20" height="60" rx="2" fill="${C.wall}" stroke="rgba(201,169,110,0.3)" stroke-width="0.5"/>
      <!-- channel strips -->
      ${Array.from({length: ch}, (_,i) => {
        const cx = 55 + i * chW + chW/2
        return `<rect x="${55 + i*chW}" y="70" width="${chW-4}" height="52" rx="2" fill="${C.bg}" stroke="rgba(201,169,110,0.2)" stroke-width="0.3"/>
        <circle cx="${cx}" cy="82" r="5" fill="${C.ch}" opacity="0.3"/>
        <rect x="${cx-6}" y="92" width="12" height="18" rx="1" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.3"/>
        ${label(cx, 118, `CH${i+1}`, 5, C.mu)}`
      }).join('')}
      <!-- XLR inputs rear -->
      ${Array.from({length: Math.min(ch,4)}, (_,i) => {
        const ix = 55 + i * (160/Math.min(ch,4)) + (160/Math.min(ch,4))/2
        return `<circle cx="${ix}" cy="145" r="5" fill="none" stroke="${C.ch}" stroke-width="0.6"/>
        <circle cx="${ix}" cy="145" r="2" fill="${C.ch}" opacity="0.5"/>
        ${label(ix, 158, 'XLR', 5, C.mu)}`
      }).join('')}
      <!-- Speakon outputs -->
      ${Array.from({length: Math.min(ch,4)}, (_,i) => {
        const ox = 55 + i * (160/Math.min(ch,4)) + (160/Math.min(ch,4))/2
        return `<rect x="${ox-6}" y="162" width="12" height="8" rx="2" fill="none" stroke="${C.lt}" stroke-width="0.5"/>
        ${label(ox, 178, 'OUT', 5, C.lt)}`
      }).join('')}
      <!-- USB DSP port -->
      <rect x="210" y="78" width="18" height="10" rx="1" fill="none" stroke="${C.ch}" stroke-width="0.5"/>
      ${label(219, 96, 'USB DSP', 5, C.ch)}
      ${label(140, 190, `${ch}-CH DSP AMPLIFIER · XLR IN / SPEAKON OUT`, 6, C.mu)}
    `)
  }

  if (it === 'streaming-amplifier' || it === 'streamer') {
    return svgWrap(280, 200, `
      <!-- device body -->
      <rect x="80" y="70" width="120" height="50" rx="4" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.8"/>
      <!-- LED / status indicator -->
      <circle cx="100" cy="95" r="4" fill="${C.ch}" opacity="0.8"/>
      <!-- wifi symbol -->
      <path d="M130 82 Q140 72 150 82" fill="none" stroke="${C.ch}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M133 86 Q140 78 147 86" fill="none" stroke="${C.ch}" stroke-width="1" stroke-linecap="round"/>
      <circle cx="140" cy="90" r="2" fill="${C.ch}"/>
      <!-- speaker output -->
      <rect x="165" y="85" width="20" height="20" rx="2" fill="none" stroke="${C.lt}" stroke-width="0.5"/>
      ${label(175, 112, 'SPK', 5, C.lt)}
      <!-- sub output -->
      <circle cx="155" cy="130" r="5" fill="none" stroke="${C.ch}" stroke-width="0.5" opacity="0.5"/>
      ${label(155, 142, 'SUB', 5, C.mu)}
      <!-- phone app icon -->
      <rect x="40" y="78" width="24" height="38" rx="3" fill="${C.wall}" stroke="${C.ch}" stroke-width="0.6"/>
      <line x1="40" y1="88" x2="64" y2="88" stroke="${C.ch}" stroke-width="0.4"/>
      <line x1="40" y1="108" x2="64" y2="108" stroke="${C.ch}" stroke-width="0.4"/>
      <circle cx="52" cy="112" r="2" fill="${C.ch}" opacity="0.5"/>
      ${label(52, 122, 'XSCACE', 5, C.ch)}
      ${label(52, 128, 'APP', 5, C.ch)}
      <!-- wifi wave from phone to device -->
      <line x1="64" y1="95" x2="80" y2="95" stroke="${C.ch}" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.6"/>
      ${label(72, 91, 'Wi-Fi', 5, C.mu)}
      ${label(140, 188, it === 'streaming-amplifier' ? 'AIR AMP · WIRELESS STREAMING AMPLIFIER' : 'AIR MINI · WIRELESS STREAMER', 6, C.mu)}
    `)
  }

  // fallback empty
  return svgWrap(280, 120, label(140, 60, 'INSTALLATION DIAGRAM', 7, C.mu))
}

// ── QR placeholder SVG ─────────────────────────────────────────────────────────
function makeQrSvg(url: string): string {
  const escaped = url.replace(/&/g,'&amp;').replace(/</g,'&lt;')
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:80px;height:80px">
    <rect width="120" height="120" fill="#090909"/>
    <rect x="8" y="8" width="104" height="104" fill="none" stroke="#c9a96e" stroke-width="3"/>
    <rect x="14" y="14" width="28" height="28" fill="none" stroke="#c9a96e" stroke-width="2"/>
    <rect x="19" y="19" width="18" height="18" fill="#c9a96e"/>
    <rect x="78" y="14" width="28" height="28" fill="none" stroke="#c9a96e" stroke-width="2"/>
    <rect x="83" y="19" width="18" height="18" fill="#c9a96e"/>
    <rect x="14" y="78" width="28" height="28" fill="none" stroke="#c9a96e" stroke-width="2"/>
    <rect x="19" y="83" width="18" height="18" fill="#c9a96e"/>
    <rect x="50" y="14" width="4" height="4" fill="#c9a96e"/><rect x="58" y="14" width="4" height="4" fill="#c9a96e"/>
    <rect x="54" y="20" width="4" height="4" fill="#c9a96e"/><rect x="62" y="20" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="26" width="4" height="4" fill="#c9a96e"/><rect x="66" y="26" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="50" width="4" height="4" fill="#c9a96e"/><rect x="58" y="50" width="4" height="4" fill="#c9a96e"/>
    <rect x="66" y="50" width="4" height="4" fill="#c9a96e"/><rect x="74" y="50" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="58" width="4" height="4" fill="#c9a96e"/><rect x="62" y="58" width="4" height="4" fill="#c9a96e"/>
    <rect x="70" y="58" width="4" height="4" fill="#c9a96e"/><rect x="78" y="58" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="66" width="4" height="4" fill="#c9a96e"/><rect x="58" y="66" width="4" height="4" fill="#c9a96e"/>
    <rect x="66" y="66" width="4" height="4" fill="#c9a96e"/><rect x="82" y="66" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="74" width="4" height="4" fill="#c9a96e"/><rect x="66" y="74" width="4" height="4" fill="#c9a96e"/>
    <rect x="54" y="82" width="4" height="4" fill="#c9a96e"/><rect x="62" y="82" width="4" height="4" fill="#c9a96e"/>
    <rect x="78" y="82" width="4" height="4" fill="#c9a96e"/><rect x="86" y="82" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="90" width="4" height="4" fill="#c9a96e"/><rect x="58" y="90" width="4" height="4" fill="#c9a96e"/>
    <rect x="70" y="90" width="4" height="4" fill="#c9a96e"/><rect x="82" y="90" width="4" height="4" fill="#c9a96e"/>
    <rect x="54" y="98" width="4" height="4" fill="#c9a96e"/><rect x="66" y="98" width="4" height="4" fill="#c9a96e"/>
    <rect x="74" y="98" width="4" height="4" fill="#c9a96e"/>
    <text x="60" y="113" text-anchor="middle" fill="#7a776f" font-size="4" font-family="monospace">${escaped}</text>
  </svg>`
}

// ── Stereo positioning advice ──────────────────────────────────────────────────
function stereoAdvice(P: any): { title: string, steps: string[], note: string } {
  const it = P.installationType || ''
  const name = P.productName || 'speaker'

  if (it === 'ceiling-circular' || it === 'ceiling-rectangular' || it === 'inwall-springclip' || it === 'inwall-dogleg') {
    return {
      title: 'Positioning',
      steps: [
        'Identify your Main Listening Position (MLP) — the primary seat from which you will enjoy audio.',
        'For stereo, position both speakers symmetrically on either side of the room centreline, directly above or in front of the MLP.',
        `In-ceiling speakers do not require toe-in. In-wall speakers face directly forward. For the ${name}, aim any aimable tweeter toward the MLP.`,
        'Speaker spacing: approximately 60% of the distance from the speaker plane to the MLP. E.g., if the MLP is 3m from the wall, place speakers 1.8m apart.',
        'Height: ceiling speakers install at ceiling height. In-wall speakers ideally sit at ear level when seated — 1.0–1.2m from floor.',
        'Ensure both speakers are equidistant from the MLP. Use a tape measure — even 5cm of asymmetry is audible.',
      ],
      note: 'For home cinema LCR and surround placement, use the XSCACE Configurator at configurator.xscace.com',
    }
  }

  if (it === 'keyhole-wall' || it === 'bracket-wall') {
    const isSlim = ['bonsai','cane','quadcane'].some(n => name.toLowerCase().includes(n))
    const toeIn = isSlim ? '15–22°' : '10–15°'
    return {
      title: 'Stereo Positioning',
      steps: [
        'Identify your Main Listening Position (MLP) — the primary seat or sofa.',
        `Mount speakers on the left and right walls symmetrically. The ${name} performs best mounted vertically at ear height when seated — approximately 1.0–1.2m from floor.`,
        `Toe-in: angle each speaker inward by ${toeIn} toward the MLP. This creates a focused stereo image centred on the listening position.`,
        'Speaker spacing: position each speaker approximately one-third of the room width from its side wall. In a 5m wide room, that is ~1.7m from each side wall.',
        'Distance from MLP: 2–4m for near-field to mid-field listening. Closer gives more precision; further gives more spaciousness.',
        'Both speakers must be exactly equidistant from the MLP — check with a tape measure. Asymmetry degrades stereo imaging.',
      ],
      note: `Minimum spacing: ${P.minSpeakerSpacing || '5ft centre-to-centre'}. Minimum height: ${P.minRiggingHeight || '5ft from floor'}.`,
    }
  }

  if (it === 'banyan-canopy' || it === 'banyan-pith') {
    return {
      title: 'Positioning',
      steps: [
        'The Banyan Canopy installs above or forward of the MLP — either into the Pith top or on a separate mount.',
        'For stereo, two Canopy units should be placed symmetrically, one on each side of the room centreline.',
        "The Canopy's wide horizontal dispersion (120°) makes precise toe-in less critical. Focus on equal distance from the MLP.",
      ],
      note: 'The Banyan Pith DSP module manages crossover and equalisation for the Canopy automatically.',
    }
  }

  if (it === 'spirea') {
    return {
      title: 'Landscape Positioning',
      steps: [
        'For pathway coverage, place Spirea units every 4–6m along the path for even distribution.',
        'For seating areas (pool, terrace), position two units symmetrically at the perimeter, aimed inward.',
        "Aim the driver face toward the primary seating zone. The Spirea's 120° dispersion covers a wide arc.",
        'Minimum 1.5m from the seating position to avoid overpowering nearfield bass.',
      ],
      note: 'Garden installs: use outdoor-rated direct-burial cable. For above-ground runs, use UV-stable conduit.',
    }
  }

  return {
    title: 'Placement',
    steps: [
      'Place near the main system rack or in a location with easy access to power and signal connections.',
      'Ensure adequate ventilation — do not enclose in a sealed cabinet without airflow.',
      'Keep signal cables away from power cables to minimise interference.',
    ],
    note: 'For subwoofer placement: the corner of a room reinforces bass. For a flatter response, try the "subwoofer crawl" — place the sub at the MLP, play bass music, walk around and mark where bass sounds most even, then place the sub there.',
  }
}

// ── Tools needed by install type ───────────────────────────────────────────────
function toolsNeeded(installationType: string): string[] {
  const base = ['Pencil / marker', 'Spirit level', 'Tape measure', 'Cable stripper / wire cutters']
  const drill = ['Power drill + 6mm drill bits', 'Screwdriver (Phillips + flat)']
  const drywall = ['Drywall saw / jigsaw', 'Stud finder']
  const ceiling = ['Hole saw (to match cutout diameter)']
  const map: Record<string, string[]> = {
    'keyhole-wall':        [...base, ...drill, 'Wall plugs / anchors'],
    'bracket-wall':        [...base, ...drill, 'Wall plugs / anchors'],
    'ceiling-circular':    [...base, ...drill, ...ceiling, 'Stud finder'],
    'ceiling-rectangular': [...base, ...drill, ...drywall, 'Construction adhesive (optional)'],
    'inwall-dogleg':       [...base, ...drill, ...drywall],
    'inwall-springclip':   [...base, ...drill, ...drywall],
    'inwall-sub':          [...base, ...drill, ...drywall],
    'banyan-canopy':       [...base, ...drill, 'Speakon cable (included)', 'Allen key / hex key set'],
    'banyan-pith':         [...base, 'Speakon cable (to Canopy)', 'Power outlet access'],
    'spirea':              [...base, 'Rubber mallet (spike mount)', 'Carabiner (hanging mount)'],
    'powered-sub':         [...base, 'XLR / RCA cable', 'Power outlet access'],
    'passive-sub':         [...base, 'Speaker wire (14 AWG or thinner)', ...drill],
    'dsp-amplifier':       [...base, 'XLR cables', 'Speaker wire', 'Rack screws (if rack mounting)', 'Laptop with DSP software'],
    'streaming-amplifier': [...base, 'Smartphone with XSCACE Controller app', 'Wi-Fi access (2.4 or 5GHz)'],
    'streamer':            [...base, 'Smartphone with XSCACE Controller app', 'Wi-Fi access (2.4 or 5GHz)'],
  }
  return map[installationType] || base
}

// ── Installation steps ─────────────────────────────────────────────────────────
function installSteps(P: any): string[] {
  const it  = P.installationType || ''
  const spc = P.screwSpacingMm ? `${P.screwSpacingMm}mm` : 'as per template'
  const scr = P.screwSize || 'supplied screw'
  const cut_h = P.cutoutHeightMm ? `${P.cutoutHeightMm}mm` : ''
  const cut_w = P.cutoutWidthMm  ? `${P.cutoutWidthMm}mm`  : ''
  const cut_d = P.cutoutDiameterMm ? `${P.cutoutDiameterMm}mm` : ''
  const cav   = P.requiredCavityDepthMm ? `${P.requiredCavityDepthMm}mm minimum` : 'sufficient'
  const wire  = P.wireGaugeRecommended || '14 AWG'
  const conn  = P.speakerWireConnector || 'supplied connector'
  const name  = P.productName || 'speaker'

  if (it === 'keyhole-wall') {
    const isCorner = (P.mountingMethods || '').toLowerCase().includes('corner')
    const isQuad   = name.toLowerCase().includes('quad')
    return [
      `Use the included screw template to mark two screw points on the wall, exactly ${spc} apart centre-to-centre. Use a spirit level to confirm both marks are perfectly level.`,
      `Drill two 6mm holes at the marked positions. Insert the supplied wall plugs fully into each hole.`,
      `Drive a ${scr} into each plug, leaving the screw head proud of the wall by approximately 5–7mm — this gap is what the keyhole slots hang on.`,
      `Route your speaker cable (${wire}) to the mounting point, leaving 150mm exposed. Strip 10mm of insulation from each wire end and connect to the ${conn} on the back of the ${name} — observe polarity (+ red / − black).`,
      `Align the two keyhole slots on the back of the ${name} with the two screw heads. Lower the speaker onto the screws until it seats firmly.`,
      isCorner
        ? (isQuad
          ? `Corner mount option: The QuadCane corner mount is a two-piece bracket — each piece is placed exactly ${spc} apart centre-to-centre on adjacent walls. Screw each piece in using the same method, then hang the QuadCane onto both pieces.`
          : `Corner mount option: screw the corner bracket into the corner between two adjacent walls using the same method. Hang the speaker on the bracket keyhole slot. Ensure the bracket is level before hanging.`)
        : '',
      `Dress the cable neatly. The included double-sided tape strip on the back of the speaker provides additional grip against the wall surface if needed.`,
    ].filter(Boolean)
  }

  if (it === 'bracket-wall') {
    return [
      `Mark the two mounting screw points on the wall using the included template. The holes are ${spc} apart centre-to-centre. Use a spirit level to confirm the marks are level.`,
      `Drill 6mm holes and insert wall plugs. Drive ${scr} screws until fully seated.`,
      `Attach the rear mounting bracket to the back of the ${name} using the supplied hardware.`,
      `Route your speaker cable (${wire}) to the mounting position, leaving 150mm exposed. Strip 10mm and connect to the speaker terminals, observing polarity.`,
      `Hold the bracket against the wall, align the bracket holes with the screws, and secure firmly. The ${name} carries significant weight at full output — ensure all fixings are tight.`,
      `Check the speaker is level. Dress the cable run neatly using cable clips or surface conduit.`,
    ]
  }

  if (it === 'ceiling-circular') {
    return [
      `Use the included circular cutout template to mark the cutout position on the ceiling. Use a stud finder to confirm you are not cutting through a joist.`,
      `Confirm there is at least ${cav} of cavity depth above the ceiling at this location.`,
      `Cut the circular hole using a hole saw. Required cutout diameter: ${cut_d}.`,
      `Route speaker cable (${wire}) through the ceiling cavity to the cutout, leaving 200mm hanging through the hole.`,
      `Strip 10mm from each wire end. Connect to the speaker terminal block — observe polarity (+ and −).`,
      `Tilt the ${name} slightly to fit it through the cutout at an angle, then straighten it flush against the ceiling surface.`,
      `Tighten the dog-leg clips using the built-in screws. As each screw turns, the clip rotates behind the ceiling board and clamps the speaker in place. Do not overtighten.`,
      `Attach the grille. The Aspen / Aster grille is paintable — prime and paint before fitting if desired.`,
    ]
  }

  if (it === 'ceiling-rectangular') {
    return [
      `During construction (before plasterboard): fit the pre-construction spring bracket into the ceiling framing. Required rectangular cutout: ${cut_h} × ${cut_w}.`,
      `Route speaker cable (${wire}) through the ceiling void and leave hanging through the bracket opening with 300mm of slack. Connect cable ends to the push terminal safety harness inside the bracket — this harness retains the speaker electrically if the magnet ever fails.`,
      `After construction: use the cutout template to make the precise ${cut_h} × ${cut_w} opening in the finished ceiling surface.`,
      `Strip 10mm from the cable ends. Connect to the ${name} rear push terminal — confirm polarity.`,
      `Hold the ${name} below the opening at a slight angle and slide it into the bracket. The magnets will pull it flush with the ceiling surface.`,
      `Listen for a firm magnetic click — the speaker is seated. Gently pull downward to confirm the safety harness is holding.`,
    ]
  }

  if (it === 'inwall-dogleg') {
    return [
      `Mark the rectangular cutout on the wall. Required dimensions: ${cut_h} high × ${cut_w} wide. Use the included cutout template and a spirit level to confirm the outline is square and plumb.`,
      `Check for hidden pipes, cables, and studs using a stud finder and pipe detector before cutting.`,
      `Confirm cavity depth behind the wall is at least ${cav}.`,
      `Cut the opening carefully using a drywall saw or jigsaw.`,
      `Route speaker cable (${wire}) through the wall cavity to the opening, leaving 200mm exposed inside the cutout.`,
      `Connect the cable to the ${name} terminals inside the enclosure — observe polarity.`,
      `Insert the ${name} into the cutout. The body sits within the wall cavity, with the front baffle flush against the wall surface.`,
      `Tighten the dog-leg mounting screws evenly, alternating sides. Each clip rotates behind the drywall as the screw tightens, clamping the speaker firmly.`,
      `Attach the grille. The grille is paintable — prime first, then paint, then fit before finishing the surrounding wall.`,
    ]
  }

  if (it === 'inwall-springclip') {
    return [
      `Mark the rectangular cutout: ${cut_h} high × ${cut_w} wide. Use the included template.`,
      `Check for pipes, cables, and studs — do not cut through structural elements.`,
      `Confirm cavity depth is at least ${cav}.`,
      `Cut the opening carefully using a drywall saw.`,
      `Route speaker cable (${wire}) and leave 200mm exposed through the cutout.`,
      `Connect the cable to the ${name} ${conn} — observe polarity.`,
      `Compress the spring clips flat against the speaker body, insert the speaker into the opening at a slight angle, then straighten. The spring clips automatically expand behind the drywall as the speaker enters the cutout.`,
      `The clips grip the back of the drywall — no screws to tighten. Gently push the speaker flush.`,
      `Fit the grille to complete the installation.`,
    ]
  }

  if (it === 'inwall-sub') {
    return [
      `Mark the rectangular cutout: ${cut_h} high × ${cut_w} wide. Use the included template.`,
      `Check for pipes, cables, and studs using a stud finder before cutting.`,
      `Confirm cavity depth is at least ${cav}.`,
      `Cut the opening using a drywall saw or jigsaw.`,
      `Route speaker cable (${wire}) through the wall cavity to the cutout with 200mm of slack exposed.`,
      `Connect the cable to the subwoofer terminals — observe polarity.`,
      `Insert the subwoofer body into the cutout. Align the flange screw holes with the surrounding wall surface.`,
      `Drive the included flange screws through the subwoofer frame into the wall backing. These pass through the speaker body to hold it firmly against the wall surface.`,
      `Clip the grille over the driver and flange to complete the installation.`,
    ]
  }

  if (it === 'banyan-canopy') {
    return [
      `The Banyan Canopy fits into the recessed top section of the Banyan Pith — no separate wall or ceiling mounting needed for the standard configuration.`,
      `Lower the Canopy into the top of the Pith until it seats firmly in the top socket.`,
      `Connect the included Speakon cable from the Canopy's Speakon input (rear) to the Banyan Pith's Canopy output (rear). Twist the Speakon connector clockwise to lock.`,
      `For pole, hanging, or wall mount of the Canopy independently: use the appropriate accessory mount (sold separately). Run the Speakon cable from the Pith to the Canopy — maximum recommended cable run 10m.`,
      `Route the Speakon cable safely and secure with cable management ties or conduit for permanent installations.`,
    ]
  }

  if (it === 'banyan-pith') {
    return [
      `Position the Banyan Pith on a solid, level surface capable of supporting ${P.weightKg || 29}kg.`,
      `Connect power: plug the supplied IEC power cable into the rear of the Pith and into a grounded power outlet.`,
      `Connect your source: run XLR or RCA cables from your amplifier's sub output (or pre-out) into the Pith's Line In or High Level input.`,
      `Connect the Banyan Canopy: run a Speakon cable from the Pith's Canopy output to the Canopy's Speakon input. See Banyan Canopy installation instructions.`,
      `DSP configuration: connect a laptop via the front USB port. Open the Banyan DSP software (SigmaStudio). Load the XSCACE factory preset for your speaker combination.`,
      `Power on the Pith. The status LED illuminates when the system is ready.`,
    ]
  }

  if (it === 'spirea') {
    return [
      `Spike mount: push the spike firmly into soft soil at the chosen location. On harder ground, use the rubber mallet to drive it. Standard listening height: 400–600mm above ground.`,
      `Hanging mount: attach the carabiner to a suitable overhead anchor (pergola beam, ceiling joist, tree branch rated for the load). Clip the hanging loop onto the carabiner.`,
      `Route speaker cable (${wire}) from the amplifier to the Spirea position. Connect to the terminal block — observe polarity.`,
      `Aim the driver face toward the primary listening area.`,
      `For permanent outdoor cable runs: use outdoor-rated direct-burial cable. For above-ground, use UV-stable conduit.`,
    ]
  }

  if (it === 'powered-sub') {
    const hasJuniper = (P.productName||'').toLowerCase().includes('juniper')
    return [
      `Place the subwoofer on a solid floor. Corner placement reinforces bass; away from walls gives a flatter response.`,
      `Connect the LFE signal: run an RCA cable from your amplifier's subwoofer output (LFE out) into the subwoofer's Line In (RCA). If no sub out is available, use the amplifier's pre-out.`,
      hasJuniper ? `Speaker-level input option: connect speaker wire from an amplifier channel's + and − outputs directly into the subwoofer's high-level inputs — useful when no pre-out is available.` : `Set the input level trim on the subwoofer to match your amplifier's output level.`,
      `Connect power: plug the supplied IEC power cable into the rear of the subwoofer and into a grounded power outlet.`,
      `Set the low-pass crossover on the subwoofer to match your main speakers. For Bonsai/Cane/Ghost: 150–200Hz. For Cedar/Camphor/Oak/Willow: 80–120Hz.`,
      `Set the phase switch to 0° initially. If bass sounds hollow at the MLP, switch to 180°.`,
      `Power on the subwoofer. Adjust the volume trim to blend with the main speakers.`,
    ]
  }

  if (it === 'passive-sub') {
    return [
      `Place the subwoofer on a solid floor. Corner placement reinforces bass.`,
      `Connect speaker wire (${wire}) from a dedicated amplifier sub channel to the subwoofer binding posts — observe polarity (+ red / − black).`,
      `Ensure the amplifier driving the subwoofer has a low-pass filter set to the appropriate crossover frequency. For Bonsai/Cane/Ghost: 150–200Hz. For larger speakers: 80–120Hz.`,
      `Do not connect the passive subwoofer to a pre-out or line-out — it requires amplifier power.`,
      `Play test audio and adjust amplifier gain for the sub channel until bass blends naturally with the main speakers.`,
    ]
  }

  if (it === 'dsp-amplifier') {
    const isLucifer = (P.productName||'').toLowerCase().includes('lucifer')
    const isRoot    = (P.productName||'').toLowerCase().includes('root')
    const hasXLR    = isLucifer || isRoot
    return [
      `Rack mounting: the ${name} is 1U rack-mountable. Slide into a 19-inch rack and secure with rack screws. Allow at least 1U of clearance above for airflow. Alternatively, place on a flat, ventilated surface.`,
      `Connect inputs: run XLR balanced cables from your source into the amplifier's XLR inputs. CH1/CH2 are typically L/R for main speakers; CH3/CH4 for additional channels or subwoofers.`,
      hasXLR ? `Speakon output wiring: use Speakon NL4 connectors. Pin 1+ and 1− carry CH1; Pin 2+ and 2− carry CH2. For bridged mono: connect + from CH1 and − from CH2 outputs (channels 1 and 2 bridge; channels 3 and 4 bridge). This doubles power output.` : '',
      hasXLR ? `XLR wiring: balanced XLR — Pin 1 = Ground, Pin 2 = Hot (+), Pin 3 = Cold (−). Use fully-balanced cables for best noise rejection.` : '',
      `Connect power: plug the IEC power cable into the rear of the amplifier and into a grounded power outlet. Do not power on until all speaker connections are secure.`,
      `DSP setup: connect a laptop via the front USB port. Open ${P.desktopSoftwareName || 'the XSCACE DSP software'} on your laptop. Load the XSCACE factory preset for your speaker model. Adjust crossover, delay, and EQ to taste.`,
      `Power on the amplifier. Play audio at low volume first — verify all channels are working before raising levels.`,
    ].filter(Boolean)
  }

  if (it === 'streaming-amplifier') {
    return [
      `Connect speaker cables from the Air Amp's speaker output terminals to your speakers — observe polarity (+ red / − black).`,
      `Optionally connect a passive subwoofer to the Air Amp's subwoofer output.`,
      `Connect power: plug the supplied DC 24V–5A power adapter into the Air Amp's DC input and into a power outlet.`,
      `First-time setup: download the XSCACE Controller app from the App Store (iOS) or Google Play (Android). Open the app and follow the on-screen setup wizard to connect the Air Amp to your Wi-Fi network.`,
      `Once connected, the Air Amp appears as an AirPlay 2 device, a Bluetooth audio device, and a Spotify Connect target. Select it as the output in your preferred streaming app.`,
      `Use the XSCACE Controller app to adjust volume, balance, and EQ settings.`,
    ]
  }

  if (it === 'streamer') {
    return [
      `Connect the Air Mini's Line Out (RCA) to your amplifier's line input, or connect via SPDIF Optical or HDMI ARC to your AV processor.`,
      `Connect power: plug the supplied DC 19V adapter into the Air Mini and into a power outlet.`,
      `First-time setup: download the XSCACE Controller app from the App Store (iOS) or Google Play (Android). Open the app and follow the setup wizard to connect the Air Mini to your Wi-Fi network.`,
      `Once connected, the Air Mini appears as an AirPlay 2 device, Spotify Connect target, and Bluetooth receiver. Select it as the output in your streaming app.`,
      `The Air Mini supports DLNA and UPnP for local network music playback from a NAS or media server.`,
    ]
  }

  return [
    'Place the unit as described in the positioning section.',
    'Make all signal and power connections as described in the connectivity section.',
    'Power on and verify operation at low volume before raising levels.',
  ]
}

// ── Connect section ────────────────────────────────────────────────────────────
function connectSection(P: any): string {
  const it   = P.installationType || ''
  const wire = P.wireGaugeRecommended || '14 AWG or thinner'
  const conn = P.speakerWireConnector || 'push terminal'
  const imp  = P.impedanceOhms ? `${P.impedanceOhms}Ω` : '8Ω'
  const xover = P.recommendedCrossoverHz ? `${P.recommendedCrossoverHz}Hz` : 'as required'

  const isSpeaker = ['keyhole-wall','bracket-wall','ceiling-circular','ceiling-rectangular','inwall-dogleg','inwall-springclip','banyan-canopy','spirea'].includes(it)
  const isSub     = ['inwall-sub','powered-sub','passive-sub'].includes(it)
  const isAmp     = ['dsp-amplifier','streaming-amplifier','banyan-pith'].includes(it)

  if (isSpeaker) {
    return `<div class="conn-row"><span class="conn-l">Wire gauge</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Connector</span><span class="conn-v">${conn}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>
<div class="conn-row"><span class="conn-l">Recommended crossover</span><span class="conn-v">${xover} low-pass (set on amplifier)</span></div>
<div class="conn-row"><span class="conn-l">Polarity</span><span class="conn-v">Red (+) to positive · Black (−) to negative</span></div>
<p class="conn-note">Wire both speakers in the same phase. Reversed polarity on one speaker causes bass cancellation.</p>`
  }

  if (isSub) {
    const powered = it === 'powered-sub'
    return `<div class="conn-row"><span class="conn-l">Signal input</span><span class="conn-v">${powered ? 'RCA Line In or High Level Speaker Input' : 'Speaker terminals (binding posts)'}</span></div>
<div class="conn-row"><span class="conn-l">Wire gauge</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>
<div class="conn-row"><span class="conn-l">Crossover</span><span class="conn-v">${xover} low-pass</span></div>
${powered ? `<div class="conn-row"><span class="conn-l">Power</span><span class="conn-v">IEC power cable — grounded outlet</span></div>` : ''}
<p class="conn-note">${powered ? 'The subwoofer has a built-in amplifier — only LFE signal input is required.' : 'This is a passive subwoofer — it requires a separate amplifier channel to drive it.'}</p>`
  }

  if (isAmp) {
    return `<div class="conn-row"><span class="conn-l">Inputs</span><span class="conn-v">${P.inputs || 'XLR balanced / RCA'}</span></div>
<div class="conn-row"><span class="conn-l">Outputs</span><span class="conn-v">${P.outputs || 'Speaker terminals / Speakon'}</span></div>
<div class="conn-row"><span class="conn-l">Speaker wire</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Load impedance</span><span class="conn-v">${imp}</span></div>
<p class="conn-note">Connect speaker cables before powering on. Never connect or disconnect speakers while the amplifier is running.</p>`
  }

  // streamer
  return `<div class="conn-row"><span class="conn-l">Outputs</span><span class="conn-v">${P.outputs || 'RCA Line Out, SPDIF Optical'}</span></div>
<div class="conn-row"><span class="conn-l">Inputs</span><span class="conn-v">${P.inputs || 'AirPlay 2, Bluetooth 5.0, Spotify Connect'}</span></div>
<div class="conn-row"><span class="conn-l">Power</span><span class="conn-v">${P.powerSupply || 'DC 19V adapter (included)'}</span></div>
<p class="conn-note">The Air Mini is a streamer only — it has no built-in amplifier. Connect its output to an amplifier or AV receiver.</p>`
}

// ── CSS ────────────────────────────────────────────────────────────────────────
function buildCss(fontCss: string): string {
  return `${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:210mm 297mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:210mm}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}
.cov-hero{position:absolute;right:0;top:0;width:100%;height:100%;object-fit:cover;opacity:.45}
.cov-overlay{position:absolute;inset:0;background:linear-gradient(to top,#090909 38%,rgba(9,9,9,.6) 65%,transparent 100%)}
.cov-content{position:absolute;left:0;right:0;bottom:0;padding:44px 40px 48px}
.cov-eyebrow{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.25em;color:#c9a96e;text-transform:uppercase;margin-bottom:10px}
.cov-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:56px;color:#eeebe5;line-height:.95}
.cov-tagline{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:16px;color:#c9a96e;margin-top:6px}
.cov-rule{height:1px;background:rgba(201,169,110,.35);margin:18px 0}
.cov-meta{display:flex;justify-content:space-between;align-items:flex-end}
.cov-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:18px;letter-spacing:.04em;color:#eeebe5}
.cov-sku{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835;letter-spacing:.12em}
.cov-bar{position:absolute;left:0;right:0;height:5px;background:#c9a96e}
.cov-bar-t{top:0}.cov-bar-b{bottom:0}
.cov-logo-area{position:absolute;top:40px;left:40px}
.cov-warning{position:absolute;top:40px;right:40px;font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;text-align:right;line-height:1.6;max-width:80px}
.pg{padding:28px 32px 24px;height:100%;display:flex;flex-direction:column}
.pg-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0}
.pg-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:13px;color:#eeebe5}
.pg-info{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;letter-spacing:.12em;text-align:right}
.pg-rule{height:1px;background:rgba(201,169,110,.22);flex-shrink:0}
.pg-num{font-family:'DM Mono',monospace;font-size:6.5px;color:#3a3835;margin-top:5px;margin-bottom:14px}
.two-col{display:flex;gap:18px;flex:1;min-height:0}
.col-left{flex:1;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.col-right{flex:0 0 40%;display:flex;flex-direction:column;gap:8px}
.sec-label{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:4px;margin-bottom:5px}
.box-item{display:flex;align-items:flex-start;gap:7px;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.box-dot{width:4px;height:4px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:3px}
.box-text{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5}
.tool-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.tool-item{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;padding:2px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.step{display:flex;gap:10px;padding:3.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.step-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:rgba(201,169,110,.3);line-height:1;flex-shrink:0;width:18px;text-align:right}
.step-text{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#eeebe5;line-height:1.5;padding-top:2px}
.stereo-title{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:20px;color:#eeebe5;margin-bottom:7px}
.stereo-step{display:flex;gap:8px;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.stereo-dot{width:3px;height:3px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:5px}
.stereo-text{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#eeebe5;line-height:1.5}
.stereo-note{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;line-height:1.5;margin-top:7px;border-left:1.5px solid rgba(201,169,110,.3);padding-left:8px}
.diag-box{background:#0a0a08;border:.4px solid rgba(201,169,110,.1);overflow:hidden;display:flex;align-items:center;justify-content:center}
.side-img{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:60px}
.side-img img{width:100%;height:100%;object-fit:contain}
.side-img.cover img{object-fit:cover}
.conn-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.conn-l{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.conn-v{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right;max-width:55%}
.conn-note{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.5;margin-top:6px;border-left:1.5px solid rgba(201,169,110,.3);padding-left:8px}
.qr-area{background:#0e0e0c;border:.4px solid rgba(201,169,110,.12);padding:14px;display:flex;flex-direction:column;align-items:center;gap:7px}
.qr-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:300;color:#eeebe5;text-align:center}
.qr-sub{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;text-align:center;line-height:1.6;max-width:140px}
.qr-url{font-family:'DM Mono',monospace;font-size:7.5px;color:#c9a96e;letter-spacing:.05em;margin-top:3px}
.support-label{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;margin-bottom:4px}
.support-line{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f;margin-bottom:2px}
.pro-note{font-family:'DM Mono',monospace;font-size:6px;color:#3a3835;line-height:1.6;margin-top:10px;text-align:center;border-top:.3px solid rgba(255,255,255,.04);padding-top:7px}
`
}

// ── MAIN HANDLER ───────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  try {
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription, series, skuBase,
      installationType, screwSpacingMm, screwSize, cutoutHeightMm, cutoutWidthMm,
      cutoutDiameterMm, requiredCavityDepthMm, mountingMethods, mountingMethod,
      speakerWireConnector, wireGaugeRecommended, impedanceOhms, recommendedCrossoverHz,
      itemsInBox, positioningNote, minRiggingHeight, minSpeakerSpacing,
      powerType, powerRmsW, powerPeakW, weightKg, heightMm, widthMm, depthMm,
      hasDsp, hasStreamer, inputs, outputs, powerSupply, desktopSoftwareName,
      channelCount, installManualRef, installManualHash,
      heroImage, "lifestyle": lifestyleImages[0..1],
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const h = Buffer.from(`${P.productName}${P.installationType}${P.screwSpacingMm||''}${P.cutoutHeightMm||''}v2`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.installManualRef && P.installManualHash === h) {
      const cdn = fileCdn(P.installManualRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) return NextResponse.redirect(cdn, 302)
    }

    const hero  = await imgB64(getRef(P.heroImage), 600)
    const life0 = await imgB64(getRef(P.lifestyle?.[0]), 500)

    const fontCss = loadFontCss()
    const css     = buildCss(fontCss)
    const advice  = stereoAdvice(P)
    const tools   = toolsNeeded(P.installationType || '')
    const steps   = installSteps(P)
    const boxItems = (P.itemsInBox || '').split(',').map((s: string) => s.trim()).filter(Boolean)

    const stepsHtml  = steps.map((s, i) => `<div class="step"><div class="step-num">${i+1}</div><div class="step-text">${s}</div></div>`).join('')
    const toolsHtml  = tools.map(t => `<div class="tool-item">— ${t}</div>`).join('')
    const boxHtml    = boxItems.map((t: string) => `<div class="box-item"><div class="box-dot"></div><div class="box-text">${t}</div></div>`).join('')
    const stereoHtml = advice.steps.map(s => `<div class="stereo-step"><div class="stereo-dot"></div><div class="stereo-text">${s}</div></div>`).join('')
    const connHtml   = connectSection(P)
    const qrSvg      = makeQrSvg('configurator.xscace.com')
    const installSvg = installDiagram(P)
    const stereoDiag = stereoDiagram(P.installationType || '', P.screwSpacingMm || 0, P.minRiggingHeight || '')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cov-bar cov-bar-t"></div>
  <div class="cov-bar cov-bar-b"></div>
  ${hero ? `<img src="${hero}" class="cov-hero">` : ''}
  <div class="cov-overlay"></div>
  <div class="cov-logo-area">
    <div style="font-family:'MagmaWave','DM Sans',sans-serif;font-size:16px;color:#eeebe5;letter-spacing:.04em">XSCACE</div>
    <div style="font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.2em;color:#7a776f;margin-top:2px">SIZE DEFYING SOUND</div>
  </div>
  <div class="cov-warning">READ ALL<br>INSTRUCTIONS<br>BEFORE<br>INSTALLATION</div>
  <div class="cov-content">
    <div class="cov-eyebrow">Installation Manual</div>
    <div class="cov-name">${P.productName}</div>
    <div class="cov-tagline">${P.tagline || P.shortDescription || ''}</div>
    <div class="cov-rule"></div>
    <div class="cov-meta">
      <div class="cov-brand">XSCACE</div>
      <div class="cov-sku">SKU ${P.skuBase || ''} · ${P.series || ''}</div>
    </div>
  </div>
</div>

<!-- PAGE 2: BOX + TOOLS + STEREO POSITIONING + DIAGRAM -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr">
      <div class="pg-brand">XSCACE</div>
      <div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div>
    </div>
    <div class="pg-rule"></div>
    <div class="pg-num">02</div>
    <div class="two-col" style="flex:1">
      <div class="col-left">
        <div>
          <div class="sec-label">What's in the box</div>
          ${boxHtml || '<div class="box-text" style="color:#7a776f">See packaging for complete contents list.</div>'}
        </div>
        <div>
          <div class="sec-label">Tools required</div>
          <div class="tool-grid">${toolsHtml}</div>
        </div>
        <div style="flex:1">
          <div class="sec-label">${advice.title}</div>
          <div class="stereo-title">Finding your ideal<br>sound stage.</div>
          ${stereoHtml}
          <div class="stereo-note">${advice.note}</div>
        </div>
      </div>
      <div class="col-right">
        <!-- Stereo positioning diagram -->
        <div class="diag-box" style="flex:0 0 160px">
          ${stereoDiag}
        </div>
        ${hero ? `<div class="side-img" style="flex:1"><img src="${hero}"></div>` : ''}
        ${life0 ? `<div class="side-img cover" style="flex:1"><img src="${life0}"></div>` : ''}
        <div style="font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;line-height:1.6;margin-top:4px">
          ${P.weightKg ? `Weight: ${P.weightKg} kg<br>` : ''}
          ${P.heightMm && P.widthMm && P.depthMm ? `Dimensions: ${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm<br>` : ''}
          ${P.powerType ? `Power: ${P.powerType}` : ''}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3: INSTALLATION STEPS + DIAGRAM -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr">
      <div class="pg-brand">XSCACE</div>
      <div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div>
    </div>
    <div class="pg-rule"></div>
    <div class="pg-num">03</div>
    <div class="two-col" style="flex:1">
      <div class="col-left" style="flex:1">
        <div class="sec-label">Installation Steps</div>
        ${stepsHtml}
        <div style="margin-top:10px;padding-top:8px;border-top:.4px solid rgba(201,169,110,.12);flex-shrink:0">
          <div style="font-family:'DM Mono',monospace;font-size:6.5px;color:#c9a96e;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px">Safety Notice</div>
          <div style="font-family:'DM Sans',Helvetica,sans-serif;font-size:7px;color:#7a776f;line-height:1.55">
            Always isolate power before making electrical connections. Ensure all fixings are adequate for the combined weight of the system. If in doubt about wall or ceiling construction, consult a structural professional. XSCACE accepts no responsibility for damage caused by incorrect installation.
          </div>
        </div>
      </div>
      <div class="col-right">
        <!-- Installation method diagram -->
        <div class="diag-box" style="flex:0 0 200px">
          ${installSvg}
        </div>
        <!-- Key dimensions callout -->
        <div style="background:#0a0a08;border:.4px solid rgba(201,169,110,.1);padding:10px;margin-top:0">
          <div class="sec-label" style="margin-bottom:5px">Key Dimensions</div>
          ${P.screwSpacingMm ? `<div class="conn-row"><span class="conn-l">Screw spacing</span><span class="conn-v">${P.screwSpacingMm}mm c/c</span></div>` : ''}
          ${P.screwSize ? `<div class="conn-row"><span class="conn-l">Screw size</span><span class="conn-v">${P.screwSize}</span></div>` : ''}
          ${P.cutoutDiameterMm ? `<div class="conn-row"><span class="conn-l">Cutout diameter</span><span class="conn-v">${P.cutoutDiameterMm}mm</span></div>` : ''}
          ${(P.cutoutHeightMm && P.cutoutWidthMm) ? `<div class="conn-row"><span class="conn-l">Cutout H × W</span><span class="conn-v">${P.cutoutHeightMm} × ${P.cutoutWidthMm}mm</span></div>` : ''}
          ${P.requiredCavityDepthMm ? `<div class="conn-row"><span class="conn-l">Cavity depth</span><span class="conn-v">${P.requiredCavityDepthMm}mm min</span></div>` : ''}
          ${(!P.screwSpacingMm && !P.cutoutDiameterMm && !P.cutoutHeightMm) ? `<div style="font-family:'DM Mono',monospace;font-size:7px;color:#3a3835">No cutout required</div>` : ''}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: CONNECT + QR + SUPPORT -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr">
      <div class="pg-brand">XSCACE</div>
      <div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div>
    </div>
    <div class="pg-rule"></div>
    <div class="pg-num">04</div>
    <div class="two-col" style="flex:1">
      <div class="col-left">
        <div>
          <div class="sec-label">Connecting to your system</div>
          ${connHtml}
        </div>
        <div style="flex:1">
          <div class="sec-label">System Design &amp; Wiring</div>
          <div style="font-family:'DM Sans',Helvetica,sans-serif;font-size:8px;color:#eeebe5;line-height:1.55;margin-bottom:8px">For full system configuration — amplifier selection, subwoofer integration, multi-room setup, and wiring diagrams — use the XSCACE Configurator:</div>
          <div class="qr-area">
            <div class="qr-title">XSCACE Configurator</div>
            ${qrSvg}
            <div class="qr-sub">Scan to open the interactive system configurator. Select your products and receive a complete wiring diagram and bill of quantities.</div>
            <div class="qr-url">configurator.xscace.com</div>
          </div>
        </div>
        <div class="pro-note">
          For complex installations, large spaces, or commercial projects — XSCACE recommends engaging a professional installer. Contact support@xscace.com to be connected with a certified partner in your region.
        </div>
      </div>
      <div class="col-right">
        <div>
          <div class="support-label">Support</div>
          <div class="support-line">support@xscace.com</div>
          <div class="support-line">xscace.com</div>
        </div>
        <div style="margin-top:12px">
          <div class="sec-label">Product Reference</div>
          ${P.skuBase ? `<div class="conn-row"><span class="conn-l">SKU</span><span class="conn-v">${P.skuBase}</span></div>` : ''}
          ${P.series  ? `<div class="conn-row"><span class="conn-l">Series</span><span class="conn-v">${P.series}</span></div>` : ''}
          ${P.impedanceOhms ? `<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${P.impedanceOhms}Ω</span></div>` : ''}
          ${P.powerRmsW ? `<div class="conn-row"><span class="conn-l">Power RMS</span><span class="conn-v">${P.powerRmsW}W</span></div>` : ''}
          ${P.weightKg  ? `<div class="conn-row"><span class="conn-l">Weight</span><span class="conn-v">${P.weightKg} kg</span></div>` : ''}
        </div>
        <div style="flex:1"></div>
        <div style="font-family:'DM Mono',monospace;font-size:6px;color:#3a3835;line-height:1.7;margin-top:auto;border-top:.3px solid rgba(255,255,255,.04);padding-top:8px">
          © ${new Date().getFullYear()} XSCACE · Size Defying Sound<br>
          All specifications subject to change without notice.<br>
          xscace.com · Designed in Canada
        </div>
      </div>
    </div>
  </div>
</div>

</body></html>`

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
      width: '210mm', height: '297mm', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    }))
    await browser.close()

    if (process.env.SANITY_API_TOKEN && pdf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g,'_')}_Installation_Manual.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          { method:'POST', headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/pdf' }, body:pdf }
        )
        if (up.ok) {
          const {document:doc} = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method:'POST',
            headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/json' },
            body: JSON.stringify({mutations:[{patch:{id:P._id,set:{installManualRef:doc._id,installManualHash:h,installManual:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})
          })
        }
      } catch(e){ console.error('[manual] cache failed',e) }
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="XSCACE_${slug}_Manual.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-cache',
      }
    })
  } catch(err:any) {
    console.error('[manual]', err)
    return NextResponse.json({error:err?.message}, {status:500})
  }
}
