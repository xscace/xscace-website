// web/src/app/api/manual/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

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

// ── PALETTE ────────────────────────────────────────────────────────────────────
const BG='#090909', CH='#c9a96e', LT='#eeebe5', MU='#7a776f', DM='#3a3835', WL='#141412'
const f = (n: number) => n.toFixed(1)

// ── SVG helpers ────────────────────────────────────────────────────────────────
function svg(w: number, h: number, body: string) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  ${body}
</svg>`
}
function tx(x:number,y:number,t:string,sz=7,fill=MU,anchor='middle',weight='normal') {
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" fill="${fill}" font-size="${sz}" font-family="DM Mono,monospace" font-weight="${weight}" letter-spacing="0.04em">${t}</text>`
}
function line(x1:number,y1:number,x2:number,y2:number,stroke=CH,sw=0.6,dash='') {
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${sw}" ${dash?`stroke-dasharray="${dash}"`:''}stroke-linecap="round"/>`
}
function rect(x:number,y:number,w:number,h:number,fill=WL,stroke=CH,sw=0.7,rx=2) {
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
}
function circle(cx:number,cy:number,r:number,fill=WL,stroke=CH,sw=0.7) {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
}
// Dimension arrow: horizontal or vertical with label
function dim(x1:number,y1:number,x2:number,y2:number,lbl:string,offset=8) {
  const horiz = Math.abs(y2-y1) < Math.abs(x2-x1)
  const mx=(x1+x2)/2, my=(y1+y2)/2
  if (horiz) {
    return `${line(x1,y1,x2,y2,CH,0.5,'2,2')}
    ${line(x1,y1-4,x1,y1+4,CH,0.5)}
    ${line(x2,y2-4,x2,y2+4,CH,0.5)}
    ${tx(mx,y1-offset,lbl,6,CH)}`
  }
  return `${line(x1,y1,x2,y2,CH,0.5,'2,2')}
  ${line(x1-4,y1,x1+4,y1,CH,0.5)}
  ${line(x2-4,y2,x2+4,y2,CH,0.5)}
  ${tx(x1-offset,my+2,lbl,6,CH,'end')}`
}

// ── INSTALLATION DIAGRAMS ─────────────────────────────────────────────────────
function installDiagram(P: any): string {
  const it = P.installationType || ''

  // ── keyhole-wall ─────────────────────────────────────────────────────────────
  if (it === 'keyhole-wall') {
    const spc = P.screwSpacingMm || 82
    const scaleY = Math.min(spc / 82, 1.5)
    const wallX=40, wallW=18
    const spkX=wallX+wallW, spkW=22, spkH=Math.min(spc*0.9+30, 120)
    const midY=140
    const s1y=midY-spc*0.35, s2y=midY+spc*0.35
    const isQuad = (P.productName||'').toLowerCase().includes('quad')
    return svg(360,290,`
      <!-- wall cross section -->
      ${rect(wallX,20,wallW,250,WL,`rgba(201,169,110,0.25)`,0.5,0)}
      ${tx(wallX+wallW/2,14,'WALL',6,MU)}
      <!-- hatching on wall -->
      ${[40,60,80,100,120,140,160,180,200,220,240].map(y=>`${line(wallX,y,wallX+wallW,y+12,'rgba(201,169,110,0.08)',0.5)}`).join('')}

      <!-- screw 1 -->
      ${line(wallX+wallW, s1y, wallX+wallW+32, s1y, LT, 2)}
      ${rect(wallX+wallW+28, s1y-5, 10, 10, CH, BG, 0.5, 2)}
      ${tx(wallX+wallW+70, s1y+3, 'SCREW 1', 6, CH, 'start')}
      ${tx(wallX+wallW+70, s1y+12, P.screwSize||'M2.5×25', 6, MU, 'start')}

      <!-- screw 2 -->
      ${line(wallX+wallW, s2y, wallX+wallW+32, s2y, LT, 2)}
      ${rect(wallX+wallW+28, s2y-5, 10, 10, CH, BG, 0.5, 2)}
      ${tx(wallX+wallW+70, s2y+3, 'SCREW 2', 6, CH, 'start')}

      <!-- speaker body -->
      ${rect(spkX+28, s1y-18, spkW, s2y-s1y+36, WL, CH, 1, 3)}

      <!-- keyhole slots on rear of speaker (schematic) -->
      ${circle(spkX+33, s1y, 5, BG, CH, 0.8)}
      ${line(spkX+33, s1y+5, spkX+33, s1y+10, CH, 0.8)}
      ${circle(spkX+33, s2y, 5, BG, CH, 0.8)}
      ${line(spkX+33, s2y+5, spkX+33, s2y+10, CH, 0.8)}
      ${tx(spkX+28, s1y-24, 'KEYHOLE SLOTS', 5, MU, 'start')}
      ${tx(spkX+28, s1y-17, '(rear of speaker)', 5, DM, 'start')}

      <!-- driver circles on speaker face -->
      ${circle(spkX+39, midY-8, 5, CH, BG, 0.3)}
      ${circle(spkX+39, midY+8, 5, CH, BG, 0.3)}

      <!-- spacing dim -->
      ${dim(wallX+wallW+16, s1y, wallX+wallW+16, s2y, `${spc}mm`,-32)}
      ${tx(wallX+wallW+8, (s1y+s2y)/2+3, `${spc}mm`, 6, CH, 'end')}

      <!-- wall plug detail -->
      ${circle(wallX+6, s1y, 5, BG, CH, 0.5)}
      ${circle(wallX+6, s2y, 5, BG, CH, 0.5)}
      ${tx(wallX+3, s1y-8, 'PLUG', 5, MU, 'middle')}

      ${isQuad ? `
        <!-- corner mount note -->
        ${rect(220, 180, 120, 70, BG, `rgba(201,169,110,0.2)`, 0.4, 3)}
        ${tx(280, 196, 'CORNER MOUNT:', 6, CH)}
        ${tx(280, 208, 'Two-piece bracket', 5, MU)}
        ${tx(280, 218, `${spc}mm between`, 5, MU)}
        ${tx(280, 228, 'each piece', 5, MU)}
        ${line(220,235,260,235,CH,0.3,'2,2')}
        ${tx(280, 242, 'on adjacent walls', 5, MU)}
      ` : ''}

      <!-- step callouts -->
      ${tx(200, 30, '① Mark template', 6, LT, 'start')}
      ${tx(200, 44, '② Drill + plug', 6, LT, 'start')}
      ${tx(200, 58, '③ Drive screws', 6, LT, 'start')}
      ${tx(200, 72, '④ Connect cable', 6, LT, 'start')}
      ${tx(200, 86, '⑤ Hang on keyholes', 6, LT, 'start')}

      ${tx(180, 276, `KEYHOLE WALL MOUNT · ${spc}mm CENTRE-TO-CENTRE`, 6, MU)}
    `)
  }

  // ── bracket-wall ─────────────────────────────────────────────────────────────
  if (it === 'bracket-wall') {
    const spc = P.screwSpacingMm || 120
    const wallX=40, wallW=18
    const s1y=100, s2y=s1y+Math.min(spc*0.65,100)
    const midY=(s1y+s2y)/2
    return svg(360,290,`
      ${rect(wallX,20,wallW,250,WL,`rgba(201,169,110,0.25)`,0.5,0)}
      ${tx(wallX+wallW/2,14,'WALL',6,MU)}
      ${[40,60,80,100,120,140,160,180,200,220,240].map(y=>`${line(wallX,y,wallX+wallW,y+12,'rgba(201,169,110,0.08)',0.5)}`).join('')}

      <!-- screws into wall -->
      ${circle(wallX+wallW/2, s1y, 5, CH, BG, 0.5)}
      ${circle(wallX+wallW/2, s2y, 5, CH, BG, 0.5)}

      <!-- bracket arms horizontal -->
      ${rect(wallX+wallW, s1y-4, 30, 8, WL, CH, 0.8, 1)}
      ${rect(wallX+wallW, s2y-4, 30, 8, WL, CH, 0.8, 1)}
      <!-- bracket vertical bar -->
      ${rect(wallX+wallW+26, s1y, 6, s2y-s1y, WL, CH, 0.8, 0)}

      <!-- speaker body on bracket -->
      ${rect(wallX+wallW+32, s1y-20, 55, s2y-s1y+40, WL, CH, 1.2, 3)}

      <!-- speaker driver -->
      ${circle(wallX+wallW+59, midY-10, 8, CH, BG, 0.3)}
      ${circle(wallX+wallW+59, midY+10, 8, CH, BG, 0.3)}
      ${tx(wallX+wallW+59, s1y-26, P.productName||'SPEAKER', 6, LT)}

      <!-- spacing dim -->
      ${dim(wallX+wallW+14, s1y, wallX+wallW+14, s2y, `${spc}mm`,-28)}
      ${tx(wallX+wallW+12, (s1y+s2y)/2+3, `${spc}mm`, 6, CH, 'end')}

      <!-- wall plugs -->
      ${circle(wallX+6, s1y, 5, BG, CH, 0.5)}
      ${circle(wallX+6, s2y, 5, BG, CH, 0.5)}

      <!-- step callouts -->
      ${tx(220, 30, '① Mark template', 6, LT, 'start')}
      ${tx(220, 44, '② Drill + plug screws', 6, LT, 'start')}
      ${tx(220, 58, '③ Attach bracket to speaker', 6, LT, 'start')}
      ${tx(220, 72, '④ Connect cable', 6, LT, 'start')}
      ${tx(220, 86, '⑤ Mount bracket to wall', 6, LT, 'start')}

      ${tx(180, 276, `BRACKET WALL MOUNT · ${spc}mm SCREW SPACING`, 6, MU)}
    `)
  }

  // ── ceiling-circular ─────────────────────────────────────────────────────────
  if (it === 'ceiling-circular') {
    const d = P.cutoutDiameterMm || 209
    const cav = P.requiredCavityDepthMm || 115
    const r = 65
    return svg(360,290,`
      <!-- ceiling mass -->
      ${rect(20,40,320,28,WL,`rgba(201,169,110,0.25)`,0.5,0)}
      ${[30,60,90,120,150,180,210,240,270,300].map(x=>`${line(x,40,x+18,68,'rgba(201,169,110,0.07)',0.5)}`).join('')}
      ${tx(180,34,'CEILING',6,MU)}

      <!-- circular cutout in ceiling -->
      <circle cx="180" cy="68" r="${r}" fill="${BG}" stroke="${CH}" stroke-width="1.2"/>

      <!-- speaker body sitting in hole -->
      <circle cx="180" cy="68" r="${r-6}" fill="${WL}" stroke="${CH}" stroke-width="0.8"/>
      <!-- tweeter dome -->
      <ellipse cx="180" cy="60" rx="12" ry="7" fill="${CH}" opacity="0.5"/>
      <!-- woofer ring -->
      <circle cx="180" cy="68" r="${r-22}" fill="${BG}" stroke="${CH}" stroke-width="0.6" opacity="0.5"/>
      <!-- grille dots pattern -->
      ${[0,45,90,135,180,225,270,315].map(a=>{const rad=a*Math.PI/180;const gx=180+Math.cos(rad)*(r-14);const gy=68+Math.sin(rad)*(r-14);return `<circle cx="${f(gx)}" cy="${f(gy)}" r="1.5" fill="${CH}" opacity="0.3"/>`}).join('')}

      <!-- dog-leg clips - 2 shown at sides -->
      ${rect(180-r-14, 56, 14, 8, WL, CH, 0.8, 1)}
      ${rect(180+r, 56, 14, 8, WL, CH, 0.8, 1)}
      ${tx(180-r-7, 50, 'CLIP', 5, CH)}
      ${tx(180+r+7, 50, 'CLIP', 5, CH)}
      <!-- tightening arrows -->
      <path d="M ${f(180-r-2)} 60 L ${f(180-r-10)} 56" fill="none" stroke="${CH}" stroke-width="0.8" marker-end="url(#arr)"/>

      <!-- cutout diameter dim -->
      ${line(180-r, 140, 180+r, 140, CH, 0.5, '3,2')}
      ${line(180-r, 135, 180-r, 145, CH, 0.5)}
      ${line(180+r, 135, 180+r, 145, CH, 0.5)}
      ${tx(180, 136, `⌀ ${d}mm CUTOUT`, 6, CH)}

      <!-- cavity depth dim (side) -->
      ${line(264, 40, 264, 68, CH, 0.5, '2,2')}
      ${line(260, 40, 268, 40, CH, 0.5)}
      ${line(260, 68, 268, 68, CH, 0.5)}
      ${tx(276, 56, `${cav}mm`, 6, CH, 'start')}
      ${tx(276, 66, 'CAVITY', 5, MU, 'start')}

      <!-- speaker cable drop -->
      ${line(180, 68+r-6, 180, 200, CH, 0.5, '3,2')}
      <circle cx="180" cy="200" r="5" fill="${BG}" stroke="${CH}" stroke-width="0.8"/>
      ${tx(192, 204, 'CABLE CONNECTOR', 6, MU, 'start')}

      <!-- step callouts -->
      ${tx(22, 170, '① Locate position, check cavity depth', 6, LT, 'start')}
      ${tx(22, 184, `② Cut ⌀${d}mm hole with hole saw`, 6, LT, 'start')}
      ${tx(22, 198, '③ Route cable — leave 200mm slack', 6, LT, 'start')}
      ${tx(22, 212, '④ Connect cable to terminal, observe polarity', 6, LT, 'start')}
      ${tx(22, 226, '⑤ Insert speaker, tighten dog-leg clips', 6, LT, 'start')}
      ${tx(22, 240, '⑥ Fit grille (paintable)', 6, LT, 'start')}

      ${tx(180, 276, `CIRCULAR IN-CEILING · ⌀${d}mm`, 6, MU)}
    `)
  }

  // ── ceiling-rectangular (Ghost 2.0) ──────────────────────────────────────────
  if (it === 'ceiling-rectangular') {
    const cH = P.cutoutHeightMm || 168
    const cW = P.cutoutWidthMm || 53
    const scale = Math.min(200/cW, 80/cH, 1.2)
    const dW=Math.round(cW*scale), dH=Math.round(cH*scale)
    const cx=180-dW/2, cy=60
    return svg(360,290,`
      <!-- ceiling mass -->
      ${rect(20,30,320,30,WL,`rgba(201,169,110,0.25)`,0.5,0)}
      ${[30,60,90,120,150,180,210,240,270,300].map(x=>`${line(x,30,x+20,60,'rgba(201,169,110,0.07)',0.5)}`).join('')}
      ${tx(180,25,'CEILING',6,MU)}

      <!-- bracket inside ceiling (pre-construction) -->
      ${rect(cx-8, cy-20, dW+16, 20, WL, `rgba(201,169,110,0.4)`, 0.6, 1)}
      ${tx(180, cy-8, 'PRE-CONSTRUCTION BRACKET', 5, CH)}

      <!-- rectangular cutout -->
      ${rect(cx, cy, dW, dH, BG, CH, 1.2, 1)}

      <!-- Ghost speaker body in cutout -->
      ${rect(cx+3, cy+3, dW-6, dH-6, WL, CH, 0.7, 1)}

      <!-- magnet symbol -->
      <path d="M ${f(180-8)} ${f(cy+dH/2-6)} L ${f(180)} ${f(cy+dH/2+4)} L ${f(180+8)} ${f(cy+dH/2-6)}" fill="none" stroke="${CH}" stroke-width="1" stroke-linecap="round"/>
      ${tx(180, cy+dH/2+14, 'MAGNET', 5, CH)}

      <!-- safety harness wire -->
      ${line(180, cy+dH-4, 180, cy+dH+18, LT, 1)}
      ${rect(175, cy+dH+18, 10, 8, BG, LT, 0.5, 1)}
      ${tx(195, cy+dH+24, 'PUSH TERMINAL', 5, LT, 'start')}
      ${tx(195, cy+dH+34, '(safety harness)', 5, MU, 'start')}

      <!-- cutout dim W -->
      ${dim(cx, cy+dH+46, cx+dW, cy+dH+46, `${cW}mm wide`)}
      <!-- cutout dim H -->
      ${dim(cx-20, cy, cx-20, cy+dH, `${cH}mm`)}

      <!-- step callouts -->
      ${tx(22, 208, '① Pre-construction: fit bracket in ceiling framing', 6, LT, 'start')}
      ${tx(22, 220, `② Cut ${cW}×${cH}mm opening in finished ceiling`, 6, LT, 'start')}
      ${tx(22, 232, '③ Route cable — connect to safety harness terminal', 6, LT, 'start')}
      ${tx(22, 244, '④ Slide Ghost into bracket — magnets hold flush', 6, LT, 'start')}
      ${tx(22, 256, '⑤ Confirm harness wire holds — pull test gently', 6, LT, 'start')}

      ${tx(180, 276, `GHOST 2.0 · ${cW}×${cH}mm RECTANGULAR CUTOUT`, 6, MU)}
    `)
  }

  // ── inwall-dogleg / inwall-springclip ─────────────────────────────────────────
  if (it === 'inwall-dogleg' || it === 'inwall-springclip') {
    const cH = P.cutoutHeightMm || 230
    const cW = P.cutoutWidthMm || 328
    const isDog = it === 'inwall-dogleg'
    const scale = Math.min(130/cW, 130/cH)
    const dW = Math.round(cW*scale), dH = Math.round(cH*scale)
    const wallX=60, wallW=22
    const cy=75-dH/2
    return svg(360,290,`
      <!-- wall cross-section -->
      ${rect(wallX,15,wallW,255,WL,`rgba(201,169,110,0.25)`,0.5,0)}
      ${[25,50,75,100,125,150,175,200,225,250].map(y=>`${line(wallX,y,wallX+wallW,y+14,'rgba(201,169,110,0.07)',0.5)}`).join('')}
      ${tx(wallX+wallW/2,10,'WALL',6,MU)}

      <!-- cutout opening -->
      ${rect(wallX, cy, wallW, dH, BG, `rgba(201,169,110,0.4)`, 0.5, 0)}
      ${tx(wallX+wallW/2, cy-6, 'CUTOUT', 5, CH)}

      <!-- speaker body in wall cavity -->
      ${rect(wallX-4, cy+6, dW+8, dH-12, WL, CH, 1, 2)}

      <!-- driver (circular) in speaker -->
      ${circle(wallX+dW/2+2, 75, Math.min(dH*0.35, 35), BG, CH, 0.7)}
      ${circle(wallX+dW/2+2, 75, Math.min(dH*0.12, 12), CH, BG, 0.3)}
      ${circle(wallX+dW*0.75, 75, Math.min(dH*0.12, 10), CH, BG, 0.3)}

      <!-- mounting clips -->
      ${isDog ? `
        <!-- dog-leg arms -->
        <path d="M ${f(wallX)} ${f(cy+14)} L ${f(wallX-12)} ${f(cy+8)} L ${f(wallX-12)} ${f(cy-2)}" fill="none" stroke="${CH}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M ${f(wallX)} ${f(cy+dH-14)} L ${f(wallX-12)} ${f(cy+dH-8)} L ${f(wallX-12)} ${f(cy+dH+2)}" fill="none" stroke="${CH}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${tx(wallX-14, cy+6, 'DOG-LEG', 5, CH, 'end')}
        ${tx(wallX-14, cy+dH-5, 'DOG-LEG', 5, CH, 'end')}
        ${tx(wallX-14, cy+13, 'CLIP', 5, CH, 'end')}
        ${tx(wallX-14, cy+dH+2, 'CLIP', 5, CH, 'end')}
      ` : `
        <!-- spring clips -->
        <path d="M ${f(wallX)} ${f(cy+10)} Q ${f(wallX-14)} ${f(cy+18)} ${f(wallX-12)} ${f(cy+26)} Q ${f(wallX-10)} ${f(cy+34)} ${f(wallX)} ${f(cy+38)}" fill="none" stroke="${CH}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M ${f(wallX)} ${f(cy+dH-10)} Q ${f(wallX-14)} ${f(cy+dH-18)} ${f(wallX-12)} ${f(cy+dH-26)} Q ${f(wallX-10)} ${f(cy+dH-34)} ${f(wallX)} ${f(cy+dH-38)}" fill="none" stroke="${CH}" stroke-width="1.5" stroke-linecap="round"/>
        ${tx(wallX-16, cy+24, 'SPRING', 5, CH, 'end')}
        ${tx(wallX-16, cy+dH-22, 'SPRING', 5, CH, 'end')}
      `}

      <!-- cutout dimension annotation -->
      ${dim(wallX+dW+10, cy, wallX+dW+10, cy+dH, `${cH}mm`,-16)}
      ${tx(wallX+dW+8, (cy*2+dH)/2+2, `${cH}mm`, 5, CH, 'end')}
      ${tx(wallX+dW/2+2, cy-14, `${cW}mm wide`, 6, CH)}

      <!-- step callouts right col -->
      ${tx(220, 30, `① Mark ${cW}×${cH}mm cutout`, 6, LT, 'start')}
      ${tx(220, 44, '② Check for pipes/studs', 6, LT, 'start')}
      ${tx(220, 58, '③ Cut opening with drywall saw', 6, LT, 'start')}
      ${tx(220, 72, '④ Route cable — 200mm slack', 6, LT, 'start')}
      ${tx(220, 86, '⑤ Connect cable, observe polarity', 6, LT, 'start')}
      ${tx(220, 100, '⑥ Insert speaker into cutout', 6, LT, 'start')}
      ${tx(220, 114, isDog ? '⑦ Tighten dog-leg screws evenly' : '⑦ Clips auto-expand behind drywall', 6, LT, 'start')}
      ${tx(220, 128, '⑧ Attach grille (paintable)', 6, LT, 'start')}

      ${tx(180, 276, `${isDog ? 'DOG-LEG CLIPS' : 'SPRING CLIPS'} IN-WALL · ${cW}×${cH}mm`, 6, MU)}
    `)
  }

  // ── inwall-sub ────────────────────────────────────────────────────────────────
  if (it === 'inwall-sub') {
    const cH = P.cutoutHeightMm || 365
    const cW = P.cutoutWidthMm || 225
    const scale = Math.min(110/cW, 120/cH)
    const dW=Math.round(cW*scale), dH=Math.round(cH*scale)
    const wallX=55, wallW=22, cy=75-dH/2
    return svg(360,290,`
      ${rect(wallX,15,wallW,255,WL,`rgba(201,169,110,0.25)`,0.5,0)}
      ${[25,50,75,100,125,150,175,200,225,250].map(y=>`${line(wallX,y,wallX+wallW,y+14,'rgba(201,169,110,0.07)',0.5)}`).join('')}
      ${tx(wallX+wallW/2,10,'WALL',6,MU)}

      <!-- cutout -->
      ${rect(wallX, cy, wallW, dH, BG, `rgba(201,169,110,0.4)`, 0.5, 0)}

      <!-- sub body -->
      ${rect(wallX-2, cy+5, dW+4, dH-10, WL, CH, 1.2, 2)}

      <!-- sub woofer cone (large circle) -->
      ${circle(wallX+dW/2+2, 75, Math.min(dH*0.38, 42), BG, CH, 0.8)}
      ${circle(wallX+dW/2+2, 75, Math.min(dH*0.38, 42)*0.55, CH, BG, 0.3)}
      ${circle(wallX+dW/2+2, 75, Math.min(dH*0.38, 42)*0.2, CH, BG, 0.5)}

      <!-- grille overlay -->
      ${rect(wallX+dW+5, cy+5, 8, dH-10, WL, LT, 0.5, 1)}
      ${tx(wallX+dW+9, 75, 'GRILLE', 5, LT, 'middle')}

      <!-- flange screws -->
      ${circle(wallX+6, cy+16, 4, BG, CH, 0.6)}
      ${circle(wallX+6, cy+dH-16, 4, BG, CH, 0.6)}
      ${tx(wallX+2, cy+14, '①', 6, CH, 'end')}
      ${tx(wallX+2, cy+dH-14, '②', 6, CH, 'end')}
      ${tx(wallX-2, cy+5, 'FLANGE', 5, MU, 'end')}
      ${tx(wallX-2, cy+13, 'SCREWS', 5, MU, 'end')}

      <!-- dims -->
      ${dim(wallX+dW+18, cy, wallX+dW+18, cy+dH, `${cH}mm`,-16)}
      ${tx(wallX+dW+16, (cy*2+dH)/2+2, `${cH}mm`, 5, CH, 'end')}
      ${tx(wallX+dW/2+2, cy-14, `${cW}mm wide`, 6, CH)}

      ${tx(220, 44, `① Cut ${cW}×${cH}mm opening`, 6, LT, 'start')}
      ${tx(220, 58, '② Route + connect cable', 6, LT, 'start')}
      ${tx(220, 72, '③ Insert sub body in cutout', 6, LT, 'start')}
      ${tx(220, 86, '④ Drive flange screws through body', 6, LT, 'start')}
      ${tx(220, 100, '⑤ Fit grille over flange', 6, LT, 'start')}

      ${tx(180, 276, `IN-WALL SUBWOOFER · ${cW}×${cH}mm CUTOUT`, 6, MU)}
    `)
  }

  // ── banyan ────────────────────────────────────────────────────────────────────
  if (it === 'banyan-canopy' || it === 'banyan-pith') {
    return svg(360,290,`
      <!-- Pith body (base) -->
      ${rect(110,180,140,80,WL,CH,1.2,4)}
      ${tx(180,215,'BANYAN PITH',7,CH)}
      ${tx(180,228,'Dual 12" Powered Sub + DSP',5,MU)}
      <!-- Pith vent -->
      ${[0,1,2].map(i=>`${rect(122+i*28,192,20,6,BG,CH,0.3,1)}`).join('')}

      <!-- Pith top socket -->
      ${rect(148,168,64,14,BG,CH,0.6,1)}
      ${tx(180,162,'TOP SOCKET',5,MU)}

      <!-- Canopy body (top speaker) -->
      ${rect(138,60,84,108,WL,CH,1.2,3)}
      ${tx(180,48,'BANYAN CANOPY',7,CH)}
      ${tx(180,38,'Wide-Dispersion Line Array',5,MU)}
      <!-- Canopy drivers (5 circles) -->
      ${[0,1,2,3,4].map(i=>`${circle(180, 75+i*18, 7, CH, BG, 0.3)}`).join('')}

      <!-- Speakon cable connecting Pith to Canopy -->
      ${line(180, 168, 180, 168, CH, 2)}
      <rect x="172" y="162" width="16" height="8" rx="3" fill="${CH}" opacity="0.8"/>
      ${tx(200,168,'SPEAKON',5,LT,'start')}
      ${tx(200,178,'CABLE',5,LT,'start')}
      ${tx(200,188,'(included)',4,MU,'start')}

      <!-- Optional mounts note -->
      ${rect(22,100,90,50,BG,`rgba(201,169,110,0.15)`,0.3,2)}
      ${tx(67,114,'CANOPY CAN',5,CH)}
      ${tx(67,124,'ALSO MOUNT:',5,CH)}
      ${tx(67,136,'· Pole mount',5,MU)}
      ${tx(67,146,'· Wall mount',5,MU)}

      <!-- Steps -->
      ${tx(22,210,'① Canopy seats into Pith top socket',6,LT,'start')}
      ${tx(22,224,'② Connect Speakon cable Pith → Canopy',6,LT,'start')}
      ${tx(22,238,'③ Connect source to Pith Line In',6,LT,'start')}
      ${tx(22,252,'④ Configure DSP via USB + software',6,LT,'start')}

      ${tx(180,276,'BANYAN SET · CANOPY + PITH ASSEMBLY',6,MU)}
    `)
  }

  // ── spirea ────────────────────────────────────────────────────────────────────
  if (it === 'spirea') {
    return svg(360,290,`
      <!-- ── SPIKE MOUNT (left) ── -->
      ${rect(30,16,140,16,WL,`rgba(201,169,110,0.2)`,0.4,0)}
      ${tx(100,10,'PERGOLA / BEAM',5,MU)}
      <!-- hanging wire -->
      ${line(100,32,100,65,LT,0.8,'2,2')}
      <!-- carabiner -->
      <ellipse cx="100" cy="68" rx="6" ry="9" fill="${BG}" stroke="${CH}" stroke-width="1.2"/>
      <line x1="96" y1="64" x2="104" y2="64" stroke="${BG}" stroke-width="2"/>
      ${tx(116,68,'CARABINER',5,CH,'start')}
      <!-- hanging speaker -->
      ${circle(100,100,22,WL,CH,1.2)}
      ${circle(100,100,10,CH,BG,0.4)}
      ${circle(100,100,4,CH,BG,0.7)}
      ${tx(100,90,'SPIREA',5,LT)}
      ${tx(100,130,'HANGING',6,CH)}
      ${tx(100,140,'MOUNT',6,CH)}

      <!-- ── SPIKE MOUNT (right) ── -->
      <!-- ground -->
      ${rect(200,185,140,85,WL,`rgba(201,169,110,0.15)`,0.4,0)}
      <!-- soil texture -->
      ${[0,1,2,3].map(i=>`${tx(220+i*28,200,['∙∙','··','∙·','·∙'][i],8,`rgba(201,169,110,0.2)`)}`).join('')}
      ${tx(270,200,'SOIL / GROUND',5,MU)}
      <!-- spike -->
      ${line(270,80,270,185,LT,2.5)}
      <polygon points="264,183 276,183 270,200" fill="${CH}"/>
      ${tx(285,140,'STAKE / SPIKE',5,CH,'start')}
      ${tx(285,150,'(included)',4,MU,'start')}
      <!-- speaker on spike -->
      ${circle(270,58,26,WL,CH,1.2)}
      ${circle(270,58,12,CH,BG,0.4)}
      ${circle(270,58,5,CH,BG,0.7)}
      ${tx(270,50,'SPIREA',5,LT)}
      ${tx(270,100,'SPIKE',6,CH)}
      ${tx(270,110,'MOUNT',6,CH)}
      <!-- height annotation -->
      ${line(240,58,240,185,CH,0.4,'2,2')}
      ${tx(238,125,'400–600mm',5,CH,'end')}

      <!-- divider -->
      ${line(180,10,180,270,`rgba(201,169,110,0.15)`,0.4,'4,3')}
      ${tx(100,230,'HANGING MOUNT',6,CH)}
      ${tx(100,242,'carabiner + wire',5,MU)}
      ${tx(270,230,'SPIKE MOUNT',6,CH)}
      ${tx(270,242,'landscape / garden',5,MU)}

      ${tx(180,276,'SPIREA · TWO INSTALLATION OPTIONS',6,MU)}
    `)
  }

  // ── powered/passive sub ───────────────────────────────────────────────────────
  if (it === 'powered-sub' || it === 'passive-sub') {
    const powered = it === 'powered-sub'
    return svg(360,290,`
      <!-- sub enclosure front -->
      ${rect(80,30,200,180,WL,CH,1.2,4)}
      <!-- woofer surround -->
      ${circle(180,120,70,BG,CH,1)}
      <!-- spider/cone -->
      ${circle(180,120,50,WL,CH,0.5)}
      ${circle(180,120,30,BG,CH,0.4)}
      ${circle(180,120,12,CH,BG,0.5)}
      <!-- dust cap -->
      ${circle(180,120,6,CH,BG,0.8)}
      <!-- rubber feet -->
      ${[-80,-40,0,40,80].map(ox=>`${circle(180+ox, 216, 5, CH, BG, 0.4)}`).join('')}

      <!-- rear panel inputs -->
      ${rect(80,210,200,20,WL,`rgba(201,169,110,0.35)`,0.5,0)}
      ${tx(180,206,'REAR PANEL',5,MU)}

      ${powered ? `
        <!-- LFE RCA input -->
        ${circle(115,220,7,BG,CH,0.8)}
        ${tx(115,234,'LFE IN',5,CH)}
        <!-- High level input -->
        ${circle(155,220,5,BG,LT,0.5)}
        ${circle(165,220,5,BG,LT,0.5)}
        ${tx(160,234,'HIGH-LEVEL',5,LT)}
        <!-- crossover dial -->
        ${circle(205,220,7,BG,CH,0.5)}
        ${tx(205,234,'X-OVER',5,CH)}
        <!-- phase switch -->
        ${rect(222,214,24,12,BG,LT,0.4,2)}
        ${tx(234,234,'PHASE',5,LT)}
        <!-- power inlet -->
        ${rect(255,213,20,14,BG,LT,0.5,1)}
        ${tx(265,234,'IEC PWR',5,LT)}
      ` : `
        <!-- binding posts -->
        ${circle(145,220,7,CH,BG,0.5)}
        ${circle(165,220,7,BG,CH,0.7)}
        ${tx(145,234,'+',7,CH)}
        ${tx(165,234,'−',7,LT)}
        ${tx(155,234,'BINDING POSTS',4,MU)}
        ${tx(155,243,'14 AWG or thinner',4,MU)}
      `}

      <!-- floor line -->
      ${line(60,250,300,250,`rgba(201,169,110,0.2)`,0.5)}
      ${tx(180,260,'FLOOR',5,MU)}

      <!-- corner placement note -->
      ${rect(22,30,50,50,BG,`rgba(201,169,110,0.12)`,0.3,2)}
      ${line(22,30,22,80,`rgba(201,169,110,0.3)`,0.5)}
      ${line(22,30,72,30,`rgba(201,169,110,0.3)`,0.5)}
      ${tx(47,52,'CORNER',5,CH)}
      ${tx(47,62,'= more bass',4,MU)}

      ${tx(180,276,powered ? 'POWERED SUBWOOFER · LFE SIGNAL IN' : 'PASSIVE SUBWOOFER · SPEAKER WIRE IN',6,MU)}
    `)
  }

  // ── dsp-amplifier ─────────────────────────────────────────────────────────────
  if (it === 'dsp-amplifier') {
    const ch = P.channelCount || 4
    const chW = Math.min(200/ch, 45)
    const isLuc = (P.productName||'').toLowerCase().includes('lucifer')
    const isRoot = (P.productName||'').toLowerCase().includes('root')
    const showSpeakon = isLuc || isRoot
    return svg(360,290,`
      <!-- rack ears -->
      ${rect(20,70,22,120,WL,`rgba(201,169,110,0.2)`,0.5,2)}
      ${rect(318,70,22,120,WL,`rgba(201,169,110,0.2)`,0.5,2)}
      <!-- rack screw holes -->
      ${[80,100,120,140,160].map(y=>`${circle(31,y,3,BG,CH,0.4)}`).join('')}
      ${[80,100,120,140,160].map(y=>`${circle(329,y,3,BG,CH,0.4)}`).join('')}

      <!-- main chassis -->
      ${rect(42,60,276,140,WL,CH,1.2,2)}

      <!-- channel strips -->
      ${Array.from({length: ch}, (_,i)=>{
        const cx=52+i*chW+chW/2
        const sx=52+i*chW+2
        return `
          ${rect(sx,68,chW-4,60,BG,`rgba(201,169,110,0.15)`,0.3,1)}
          <!-- LED indicator -->
          ${circle(cx,76,3,ch===i?CH:`rgba(201,169,110,0.4)`,BG,0.2)}
          <!-- VU meter bars -->
          ${[0,1,2,3].map(b=>`${rect(sx+3+b*((chW-14)/4),84,(chW-14)/4-1,8,`rgba(201,169,110,${0.2+b*0.15})`,BG,0,1)}`).join('')}
          <!-- level knob -->
          ${circle(cx,106,8,WL,CH,0.8)}
          <line x1="${f(cx)}" y1="${f(98)}" x2="${f(cx)}" y2="${f(104)}" stroke="${CH}" stroke-width="1"/>
          ${tx(cx,122,`CH${i+1}`,5,CH)}
        `
      }).join('')}

      <!-- front panel USB port -->
      ${rect(258,78,30,12,BG,CH,0.6,1)}
      ${tx(273,86,'USB',5,CH)}
      ${tx(273,96,'DSP',4,MU)}

      <!-- REAR PANEL label -->
      ${tx(180,148,'REAR PANEL',5,MU)}

      <!-- XLR inputs rear (labelled) -->
      ${Array.from({length: Math.min(ch,4)}, (_,i)=>{
        const ix=60+i*54
        return `
          ${circle(ix,165,10,BG,CH,0.7)}
          ${circle(ix,165,4,CH,BG,0.3)}
          ${tx(ix,182,`XLR IN`,4,CH)}
          ${tx(ix,190,`CH${i+1}`,4,MU)}
          <!-- pin labels -->
          ${tx(ix-6,165,'1',4,MU)}<text x="${f(ix+1)}" y="${f(162)}" font-size="4" fill="${LT}" font-family="DM Mono,monospace">2</text>
          <text x="${f(ix+4)}" y="${f(170)}" font-size="4" fill="${MU}" font-family="DM Mono,monospace">3</text>
        `
      }).join('')}

      <!-- Speakon outputs rear -->
      ${showSpeakon ? Array.from({length: Math.min(ch,4)}, (_,i)=>{
        const ox=60+i*54
        return `
          ${rect(ox-12,197,24,14,BG,LT,0.6,3)}
          ${tx(ox,212,`SPKN`,4,LT)}
          ${tx(ox,220,`CH${i+1}`,4,MU)}
          ${tx(ox,228,i<2?`1+/1-`:`2+/2-`,4,DM)}
        `
      }).join('') : Array.from({length: Math.min(ch,4)}, (_,i)=>{
        const ox=60+i*54
        return `
          ${circle(ox-5,204,5,CH,BG,0.5)}
          ${circle(ox+5,204,5,BG,CH,0.5)}
          ${tx(ox,218,`OUT ${i+1}`,4,LT)}
          ${tx(ox,226,`+   −`,5,CH)}
        `
      }).join('')}

      ${showSpeakon ? `
        <!-- Bridged wiring note -->
        ${rect(236,155,80,70,BG,`rgba(201,169,110,0.15)`,0.3,2)}
        ${tx(276,166,'BRIDGE MODE:',5,CH)}
        ${tx(276,176,'CH1(+) + CH2(−)',4,LT)}
        ${tx(276,184,'= 1 bridged channel',4,MU)}
        ${tx(276,194,'CH3(+) + CH4(−)',4,LT)}
        ${tx(276,202,'= 2nd channel',4,MU)}
      ` : ''}

      ${tx(180,276,`${ch}-CH DSP AMPLIFIER · XLR IN · SPEAKON OUT`,6,MU)}
    `)
  }

  // ── streaming-amplifier / streamer ───────────────────────────────────────────
  if (it === 'streaming-amplifier' || it === 'streamer') {
    const isAmp = it === 'streaming-amplifier'
    return svg(360,290,`
      <!-- device body -->
      ${rect(70,80,220,80,WL,CH,1.2,3)}
      <!-- LED -->
      ${circle(90,120,5,CH,BG,0.4)}
      ${tx(90,134,'STATUS',4,CH)}

      <!-- display area -->
      ${rect(106,90,100,40,BG,`rgba(201,169,110,0.15)`,0.4,2)}
      ${tx(156,106,'AirPlay 2',5,LT)}
      ${tx(156,118,'Spotify Connect',5,LT)}
      ${tx(156,128,'Bluetooth 5.0',5,MU)}

      <!-- rear inputs/outputs -->
      ${tx(180,152,'REAR PANEL',5,MU)}

      ${isAmp ? `
        <!-- speaker terminals -->
        ${circle(100,168,8,CH,BG,0.5)}
        ${circle(120,168,8,BG,CH,0.7)}
        ${tx(100,184,'+',6,CH)}
        ${tx(120,184,'−',6,LT)}
        ${tx(110,192,'SPK L',4,MU)}

        ${circle(150,168,8,CH,BG,0.5)}
        ${circle(170,168,8,BG,CH,0.7)}
        ${tx(150,184,'+',6,CH)}
        ${tx(170,184,'−',6,LT)}
        ${tx(160,192,'SPK R',4,MU)}

        <!-- sub out -->
        ${circle(202,168,7,BG,CH,0.5)}
        ${tx(202,184,'SUB',4,CH)}
        ${tx(202,192,'OUT',4,MU)}

        <!-- inputs -->
        ${circle(232,168,7,BG,LT,0.5)}
        ${tx(232,184,'OPT',4,LT)}

        ${rect(250,162,24,12,BG,LT,0.4,1)}
        ${tx(262,184,'DC 24V',4,LT)}
      ` : `
        <!-- RCA out -->
        ${circle(110,168,8,BG,CH,0.7)}
        ${tx(110,184,'LINE',4,CH)}
        ${tx(110,192,'OUT',4,MU)}
        <!-- optical out -->
        ${circle(140,168,7,BG,LT,0.5)}
        ${tx(140,184,'OPT',4,LT)}
        <!-- HDMI ARC -->
        ${rect(158,162,28,12,BG,LT,0.4,1)}
        ${tx(172,184,'HDMI ARC',4,LT)}
        <!-- power -->
        ${rect(200,162,24,12,BG,LT,0.4,1)}
        ${tx(212,184,'DC 19V',4,LT)}
      `}

      <!-- phone showing app -->
      ${rect(18,90,38,64,WL,CH,0.8,4)}
      ${rect(22,98,30,46,BG,`rgba(201,169,110,0.2)`,0.3,1)}
      ${circle(37,152,3,CH,BG,0.4)}
      ${tx(37,107,'XSCACE',4,CH)}
      ${tx(37,116,'CONTROLLER',3,MU)}
      ${tx(37,128,'App Store',3,LT)}
      ${tx(37,136,'Google Play',3,LT)}

      <!-- wifi signal -->
      ${line(56,120,70,120,CH,0.5,'2,2')}
      <path d="M 68 112 Q 76 104 84 112" fill="none" stroke="${CH}" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M 71 115 Q 76 109 81 115" fill="none" stroke="${CH}" stroke-width="0.7" stroke-linecap="round"/>
      <circle cx="76" cy="118" r="2" fill="${CH}"/>

      <!-- steps -->
      ${tx(18,212,'① Connect speakers to output terminals',6,LT,'start')}
      ${tx(18,226,'② Power on device',6,LT,'start')}
      ${tx(18,240,'③ Download XSCACE Controller app',6,LT,'start')}
      ${tx(18,254,'④ Follow in-app Wi-Fi setup wizard',6,LT,'start')}
      ${tx(18,268,'⑤ Stream via AirPlay / Spotify / BT',6,LT,'start')}

      ${tx(180,276,isAmp ? 'AIR AMP · STREAMING AMPLIFIER SETUP' : 'AIR MINI · STREAMER SETUP',6,MU)}
    `)
  }

  return svg(360,160,tx(180,80,'DIAGRAM N/A FOR THIS PRODUCT TYPE',7,MU))
}

// ── STEREO POSITIONING DIAGRAM ────────────────────────────────────────────────
function stereoDiagram(P: any): string {
  const it = P.installationType || ''

  // In-ceiling / in-wall — top-down room view
  if (['ceiling-circular','ceiling-rectangular','inwall-dogleg','inwall-springclip'].includes(it)) {
    return svg(340,200,`
      <!-- room outline -->
      ${rect(20,15,300,165,WL,`rgba(201,169,110,0.2)`,0.5,3)}
      ${tx(170,12,'ROOM (TOP-DOWN VIEW)',5,MU)}

      <!-- front wall label -->
      ${tx(170,28,'FRONT WALL',5,MU)}

      <!-- speaker L in ceiling -->
      ${circle(90,55,14,BG,CH,1.2)}
      ${circle(90,55,6,CH,BG,0.4)}
      ${tx(90,38,'L',7,CH)}

      <!-- speaker R in ceiling -->
      ${circle(250,55,14,BG,CH,1.2)}
      ${circle(250,55,6,CH,BG,0.4)}
      ${tx(250,38,'R',7,CH)}

      <!-- MLP sofa -->
      ${rect(130,140,80,28,`rgba(201,169,110,0.1)`,CH,0.6,3)}
      ${tx(170,157,'MLP',6,CH)}

      <!-- coverage arcs from each speaker to MLP -->
      <path d="M 90 69 Q 100 110 130 150" fill="none" stroke="${CH}" stroke-width="0.5" stroke-dasharray="3,2" opacity="0.6"/>
      <path d="M 90 69 Q 130 110 170 150" fill="none" stroke="${CH}" stroke-width="0.5" stroke-dasharray="3,2" opacity="0.6"/>
      <path d="M 250 69 Q 240 110 210 150" fill="none" stroke="${CH}" stroke-width="0.5" stroke-dasharray="3,2" opacity="0.6"/>
      <path d="M 250 69 Q 210 110 170 150" fill="none" stroke="${CH}" stroke-width="0.5" stroke-dasharray="3,2" opacity="0.6"/>

      <!-- centreline -->
      ${line(170,15,170,180,DM,0.4,'4,3')}

      <!-- speaker spacing dim -->
      ${line(90,78,250,78,CH,0.4,'2,2')}
      ${line(90,74,90,82,CH,0.4)}
      ${line(250,74,250,82,CH,0.4)}
      ${tx(170,74,'≈ 60% of listener distance',5,CH)}

      <!-- ear level note -->
      ${tx(170,182,'Height: at ear level when seated (1.0–1.2m from floor)',5,MU)}
    `)
  }

  // Wall-mount (Bonsai, Cane, Cedar etc.) — elevation view
  if (['keyhole-wall','bracket-wall'].includes(it)) {
    return svg(340,200,`
      <!-- floor -->
      ${line(20,175,320,175,`rgba(201,169,110,0.2)`,0.5)}
      ${tx(170,185,'FLOOR',5,MU)}

      <!-- front wall -->
      ${rect(20,15,300,6,WL,`rgba(201,169,110,0.2)`,0.4,0)}
      ${tx(170,12,'FRONT WALL',5,MU)}

      <!-- Speaker L body (side elevation) -->
      ${rect(55,85,14,55,WL,CH,1,2)}
      ${circle(62,105,5,CH,BG,0.3)}
      ${circle(62,120,5,CH,BG,0.3)}
      ${tx(62,72,'L',7,CH)}

      <!-- Speaker R body -->
      ${rect(271,85,14,55,WL,CH,1,2)}
      ${circle(278,105,5,CH,BG,0.3)}
      ${circle(278,120,5,CH,BG,0.3)}
      ${tx(278,72,'R',7,CH)}

      <!-- MLP listener icon (side) -->
      <!-- head -->
      ${circle(170,148,8,BG,CH,0.7)}
      <!-- body -->
      <path d="M 162 156 Q 162 174 170 174 Q 178 174 178 156" fill="none" stroke="${CH}" stroke-width="0.7"/>
      ${tx(170,192,'MLP',6,CH)}

      <!-- ear height line -->
      ${line(55,100,320,100,`rgba(201,169,110,0.15)`,0.4,'3,3')}
      ${tx(28,98,'EAR',4,MU,'start')}
      ${tx(28,106,'HEIGHT',4,MU,'start')}
      ${tx(28,114,'≈1.0–1.2m',4,CH,'start')}

      <!-- height from floor -->
      ${line(38,100,38,175,CH,0.4,'2,2')}
      ${line(34,100,42,100,CH,0.4)}
      ${line(34,175,42,175,CH,0.4)}
      ${tx(36,140,'1.0–1.2m',5,CH,'end')}

      <!-- sound projection lines (straight — no toe-in since fixed speakers) -->
      ${line(69,112,162,150,CH,0.4,'2,2')}
      ${line(271,112,178,150,CH,0.4,'2,2')}

      <!-- speaker spacing dim (horizontal) -->
      ${line(69,65,271,65,CH,0.4,'2,2')}
      ${line(69,61,69,69,CH,0.4)}
      ${line(271,61,271,69,CH,0.4)}
      ${tx(170,61,'~1/3 room width from each side wall',5,CH)}

      <!-- 2–4m distance note -->
      ${tx(170,185,'Listener distance: 2–4m from speakers',5,MU)}
    `)
  }

  // Outdoor / spirea
  if (it === 'spirea') {
    return svg(340,200,`
      ${rect(20,15,300,165,`rgba(9,9,9,0.5)`,`rgba(201,169,110,0.15)`,0.4,3)}
      ${tx(170,12,'GARDEN (TOP-DOWN VIEW)',5,MU)}

      <!-- pathway -->
      <rect x="140" y="15" width="60" height="165" rx="0" fill="rgba(201,169,110,0.04)" stroke="rgba(201,169,110,0.1)" stroke-width="0.3"/>
      ${tx(170,105,'PATH',5,MU)}

      <!-- multiple speakers along path -->
      ${[40,90,140].map(y=>`
        ${circle(115,y,10,WL,CH,0.8)}
        ${circle(115,y,4,CH,BG,0.4)}
        ${circle(225,y,10,WL,CH,0.8)}
        ${circle(225,y,4,CH,BG,0.4)}
      `).join('')}

      <!-- spacing dim -->
      ${line(115,40,115,90,CH,0.4,'2,2')}
      ${line(111,40,119,40,CH,0.4)}
      ${line(111,90,119,90,CH,0.4)}
      ${tx(106,66,'4–6m',5,CH,'end')}

      ${tx(170,192,'Place every 4–6m along path for even coverage',5,MU)}
    `)
  }

  // Subwoofers — placement diagram
  if (['powered-sub','passive-sub','inwall-sub'].includes(it)) {
    return svg(340,200,`
      ${rect(20,15,300,155,WL,`rgba(201,169,110,0.15)`,0.4,3)}
      ${tx(170,12,'ROOM (TOP-DOWN VIEW)',5,MU)}

      <!-- corner position (best bass) -->
      ${rect(20,15,45,45,`rgba(201,169,110,0.12)`,CH,0.6,0)}
      ${circle(42,37,14,CH,BG,0.4)}
      ${tx(42,56,'CORNER',4,CH)}
      ${tx(42,64,'(most bass)',4,MU)}

      <!-- side-wall position -->
      ${rect(20,95,12,40,`rgba(201,169,110,0.08)`,`rgba(201,169,110,0.3)`,0.4,0)}
      ${circle(38,115,10,CH,BG,0.3)}
      ${tx(55,115,'SIDE WALL',4,MU,'start')}

      <!-- MLP -->
      ${rect(230,130,80,28,`rgba(201,169,110,0.1)`,CH,0.5,3)}
      ${tx(270,147,'MLP',6,CH)}

      <!-- ideal note -->
      ${tx(170,190,'Place sub in room corner for maximum bass reinforcement',5,MU)}
    `)
  }

  // Amps/streamers — just system connection diagram
  return svg(340,160,`
    ${circle(60,80,30,WL,CH,1)}
    ${tx(60,77,'SOURCE',5,CH)}
    ${tx(60,88,'(App/Stream)',4,MU)}
    ${line(90,80,140,80,CH,0.8)}
    ${rect(140,60,80,40,WL,CH,1,3)}
    ${tx(180,77,it==='streaming-amplifier'?'AIR AMP':it==='dsp-amplifier'?'AMPLIFIER':'STREAMER',5,LT)}
    ${tx(180,90,it==='streaming-amplifier'||it==='dsp-amplifier'?'+ POWER':'',4,MU)}
    ${line(220,80,270,80,CH,0.8)}
    ${circle(270,80,30,WL,CH,1)}
    ${tx(270,77,'SPEAKERS',5,LT)}
    ${tx(270,88,'/ SYSTEM',4,MU)}
    ${tx(170,145,'SYSTEM CONNECTION OVERVIEW',5,MU)}
  `)
}

// ── STEREO POSITIONING ADVICE (text) ──────────────────────────────────────────
function stereoAdvice(P: any): { title: string, steps: string[], note: string } {
  const it = P.installationType || ''
  const name = P.productName || 'speaker'

  if (['ceiling-circular','ceiling-rectangular','inwall-springclip','inwall-dogleg'].includes(it)) {
    return {
      title: 'Speaker Positioning',
      steps: [
        'Identify your Main Listening Position (MLP) — the primary seat or sofa.',
        `For stereo: position both speakers symmetrically on either side of the room centreline, directly above or in front of the MLP.`,
        'Speaker spacing: approximately 60% of the listener distance. E.g. if the MLP is 3m from the speaker plane, space speakers 1.8m apart.',
        'In-wall speakers: ideally at ear level when seated — 1.0–1.2m from floor. In-ceiling speakers install at ceiling height.',
        'Use a tape measure to confirm both speakers are exactly equidistant from the MLP. Even 5cm of asymmetry is audible.',
      ],
      note: 'For cinema LCR and surround placement, use the XSCACE Configurator at configurator.xscace.com',
    }
  }

  if (['keyhole-wall','bracket-wall'].includes(it)) {
    return {
      title: 'Speaker Positioning',
      steps: [
        'Identify your Main Listening Position (MLP) — the primary seat or sofa.',
        `Mount speakers on the left and right walls at ear height when seated — approximately 1.0–1.2m from the floor.`,
        'Horizontal placement: approximately one-third of the room width from each side wall. In a 5m wide room, that is ~1.7m from each side wall.',
        'Listener distance: 2–4m from the speakers for ideal stereo imaging. Closer is more precise; further is more spacious.',
        'Confirm both speakers are exactly equidistant from the MLP with a tape measure.',
      ],
      note: `Minimum spacing: ${P.minSpeakerSpacing || '5ft centre-to-centre'}. Minimum height: ${P.minRiggingHeight || '5ft from floor'}.`,
    }
  }

  if (['banyan-canopy','banyan-pith'].includes(it)) {
    return {
      title: 'Positioning',
      steps: [
        'The Banyan Canopy installs above or forward of the MLP, into the Pith top or on a separate mount.',
        'For stereo, place two Canopy units symmetrically on either side of the room centreline.',
        "Wide horizontal dispersion (120°) means placement is more forgiving than conventional speakers — focus on equal distance from the MLP.",
      ],
      note: 'The Banyan Pith DSP manages crossover and EQ for the Canopy automatically.',
    }
  }

  if (it === 'spirea') {
    return {
      title: 'Landscape Positioning',
      steps: [
        'For pathway coverage: place Spirea units every 4–6m for even audio distribution.',
        'For seating areas (pool, terrace): place units symmetrically at the perimeter, aimed inward toward the seating area.',
        'Aim the driver face toward the primary listening zone.',
        'Maintain at least 1.5m distance from the nearest seat to avoid bass heaviness in nearfield.',
      ],
      note: 'Use outdoor-rated direct-burial cable for in-ground runs. UV-stable conduit for above-ground runs.',
    }
  }

  return {
    title: 'Placement',
    steps: [
      'Place near the main system rack with easy access to power and signal connections.',
      'Ensure adequate ventilation — do not enclose without airflow.',
      'Keep signal cables away from power cables to minimise electrical interference.',
    ],
    note: 'For subwoofer placement: corner positions reinforce bass. For flat response, try the "sub crawl" — place sub at MLP, walk around until bass sounds most even, that is the ideal position.',
  }
}

// ── TOOLS NEEDED ──────────────────────────────────────────────────────────────
function toolsNeeded(it: string): string[] {
  const base = ['Pencil / marker', 'Spirit level', 'Tape measure', 'Cable stripper / wire cutters']
  const drill = ['Power drill + 6mm drill bits', 'Screwdriver (Phillips + flat)']
  const map: Record<string, string[]> = {
    'keyhole-wall':        [...base, ...drill, 'Wall plugs / anchors'],
    'bracket-wall':        [...base, ...drill, 'Wall plugs / anchors'],
    'ceiling-circular':    [...base, ...drill, 'Hole saw (cutout diameter)', 'Stud finder'],
    'ceiling-rectangular': [...base, ...drill, 'Drywall saw / jigsaw', 'Stud finder'],
    'inwall-dogleg':       [...base, ...drill, 'Drywall saw / jigsaw', 'Stud finder'],
    'inwall-springclip':   [...base, ...drill, 'Drywall saw / jigsaw', 'Stud finder'],
    'inwall-sub':          [...base, ...drill, 'Drywall saw / jigsaw', 'Stud finder'],
    'banyan-canopy':       [...base, 'Speakon cable (included)', 'Allen key set'],
    'banyan-pith':         [...base, 'Speakon cable (to Canopy)', 'Power outlet access'],
    'spirea':              [...base, 'Rubber mallet (spike mount)', 'Carabiner (hanging mount)'],
    'powered-sub':         [...base, 'XLR / RCA cable', 'Power outlet access'],
    'passive-sub':         [...base, 'Speaker wire (14 AWG or thinner)'],
    'dsp-amplifier':       [...base, 'XLR cables', 'Speaker wire', 'Rack screws (rack mounting)', 'Laptop with DSP software'],
    'streaming-amplifier': [...base, 'Smartphone — XSCACE Controller app', 'Wi-Fi access (2.4 or 5GHz)'],
    'streamer':            [...base, 'Smartphone — XSCACE Controller app', 'Wi-Fi access (2.4 or 5GHz)'],
  }
  return map[it] || base
}

// ── INSTALL STEPS ─────────────────────────────────────────────────────────────
function installSteps(P: any): string[] {
  const it  = P.installationType || ''
  const spc = P.screwSpacingMm ? `${P.screwSpacingMm}mm` : 'as per template'
  const scr = P.screwSize || 'supplied screw'
  const cut_h = P.cutoutHeightMm ? `${P.cutoutHeightMm}mm` : ''
  const cut_w = P.cutoutWidthMm  ? `${P.cutoutWidthMm}mm`  : ''
  const cut_d = P.cutoutDiameterMm ? `${P.cutoutDiameterMm}mm` : ''
  const cav   = P.requiredCavityDepthMm ? `${P.requiredCavityDepthMm}mm min` : 'sufficient'
  const wire  = P.wireGaugeRecommended || '14 AWG'
  const conn  = P.speakerWireConnector || 'supplied connector'
  const name  = P.productName || 'speaker'

  if (it === 'keyhole-wall') {
    const isCorner = (P.mountingMethods || '').toLowerCase().includes('corner')
    const isQuad   = name.toLowerCase().includes('quad')
    return [
      `Use the included screw template to mark two screw points ${spc} apart centre-to-centre. Use a spirit level to confirm both marks are level.`,
      `Drill two 6mm holes. Insert the supplied wall plugs fully.`,
      `Drive a ${scr} into each plug, leaving the head proud of the wall by 5–7mm — this gap is what the keyhole slots hang on.`,
      `Route speaker cable (${wire}) to the mounting point, leaving 150mm exposed. Strip 10mm and connect to the ${conn} — observe polarity (+ red / − black).`,
      `Align the keyhole slots on the back of the ${name} with the screw heads. Lower until it seats firmly.`,
      isCorner
        ? (isQuad
          ? `Corner mount option: The QuadCane corner bracket is a two-piece design — place each piece exactly ${spc} apart centre-to-centre on adjacent walls. Hang the QuadCane across both pieces.`
          : `Corner mount option: screw the corner bracket into the corner between two adjacent walls using the same method. Hang the speaker on the bracket keyhole slot.`)
        : `Double-sided tape on the rear of the speaker provides additional grip against the wall surface if required.`,
    ].filter(Boolean)
  }

  if (it === 'bracket-wall') {
    return [
      `Mark the two screw points using the included template, ${spc} apart centre-to-centre. Confirm level with spirit level.`,
      `Drill 6mm holes and insert wall plugs. Drive ${scr} screws flush.`,
      `Attach the rear bracket to the ${name} using the supplied hardware.`,
      `Route speaker cable (${wire}) to the mounting position, leaving 150mm exposed. Strip 10mm and connect — observe polarity.`,
      `Hold the bracket to the wall, align with the screws, and secure firmly.`,
      `Check the speaker is level. Dress the cable run with clips or conduit.`,
    ]
  }

  if (it === 'ceiling-circular') {
    return [
      `Mark the cutout position using the included circular template. Use a stud finder — avoid cutting through ceiling joists.`,
      `Confirm at least ${cav} of cavity depth above the ceiling at this location.`,
      `Cut the circular hole (${cut_d}) using a hole saw.`,
      `Route speaker cable (${wire}) through the ceiling cavity, leaving 200mm hanging through the hole.`,
      `Strip 10mm from each wire end. Connect to the speaker terminal block — observe polarity (+ and −).`,
      `Tilt the ${name} to insert it through the cutout at an angle, then straighten flush to the ceiling.`,
      `Tighten the dog-leg clips using the built-in screws. As each screw turns, the clip rotates behind the ceiling board and clamps the speaker. Do not overtighten.`,
      `Fit the grille. Aspen / Aster grilles are paintable — prime and paint before fitting if desired.`,
    ]
  }

  if (it === 'ceiling-rectangular') {
    return [
      `During construction (before plasterboard): fit the pre-construction spring bracket into the ceiling framing. Required rectangular cutout: ${cut_h} × ${cut_w}.`,
      `Route cable (${wire}) through the ceiling void and leave hanging through the bracket with 300mm slack. Connect to the push terminal safety harness inside the bracket — this harness retains the speaker even if the magnet fails.`,
      `After construction: cut the ${cut_h} × ${cut_w} opening in the finished ceiling using the included cutout template.`,
      `Strip 10mm from the cable ends protruding through the cutout. Connect to the ${name} rear push terminal — confirm polarity.`,
      `Hold the ${name} below the opening at a slight angle and slide it into the bracket. Magnets pull it flush with the ceiling.`,
      `Listen for a firm magnetic click. Gently pull downward to confirm the safety harness is holding the speaker independently.`,
    ]
  }

  if (it === 'inwall-dogleg') {
    return [
      `Mark the rectangular cutout: ${cut_h} high × ${cut_w} wide, using the included template. Confirm square and plumb with spirit level.`,
      `Locate studs, pipes, and cables with a stud finder and pipe detector before cutting.`,
      `Confirm cavity depth behind the wall is at least ${cav}.`,
      `Cut the opening with a drywall saw or jigsaw.`,
      `Route cable (${wire}) through the cavity, leaving 200mm exposed at the opening.`,
      `Connect cable to the ${name} terminals — observe polarity.`,
      `Insert the ${name} into the cutout with the baffle flush to the wall surface.`,
      `Tighten the dog-leg screws evenly, alternating sides — each clip rotates behind the drywall to clamp the speaker.`,
      `Attach the grille. Paintable — prime first, paint to match, then fit.`,
    ]
  }

  if (it === 'inwall-springclip') {
    return [
      `Mark the rectangular cutout: ${cut_h} high × ${cut_w} wide, using the included template.`,
      `Check for pipes, cables, and studs — do not cut through structural elements.`,
      `Confirm cavity depth is at least ${cav}.`,
      `Cut the opening with a drywall saw.`,
      `Route cable (${wire}) and leave 200mm exposed through the cutout.`,
      `Connect cable to the ${name} ${conn} — observe polarity.`,
      `Compress the spring clips flat against the speaker body, insert into the opening at a slight angle, then straighten. Clips automatically expand behind the drywall.`,
      `Push the speaker flush — the clips grip the back of the drywall. No screws to tighten.`,
      `Fit the grille to complete the installation.`,
    ]
  }

  if (it === 'inwall-sub') {
    return [
      `Mark the rectangular cutout: ${cut_h} high × ${cut_w} wide.`,
      `Check for pipes, cables, and studs using a stud finder.`,
      `Confirm cavity depth is at least ${cav}.`,
      `Cut the opening with a drywall saw or jigsaw.`,
      `Route cable (${wire}) through the cavity — 200mm slack through cutout.`,
      `Connect cable to the subwoofer terminals — observe polarity.`,
      `Insert the subwoofer body into the cutout. Align flange screw holes with wall surface.`,
      `Drive flange screws through the speaker body into the wall backing — these pass through the speaker to hold it firmly.`,
      `Clip the grille over the flange to complete the installation.`,
    ]
  }

  if (it === 'banyan-canopy') {
    return [
      `The Banyan Canopy seats into the recessed top section of the Banyan Pith — no separate ceiling or wall mount needed for the standard configuration.`,
      `Lower the Canopy into the Pith top socket until it seats firmly.`,
      `Connect the included Speakon cable from the Canopy's Speakon input (rear) to the Pith's Canopy output (rear). Twist the Speakon connector clockwise to lock.`,
      `For pole, hanging, or wall mount of the Canopy independently: use the appropriate accessory mount. Run the Speakon cable from Pith to Canopy — maximum 10m cable run.`,
      `Route the Speakon cable safely and secure with cable management ties or conduit for permanent installs.`,
    ]
  }

  if (it === 'banyan-pith') {
    return [
      `Position the Banyan Pith on a solid, level surface capable of supporting ${P.weightKg || 29}kg.`,
      `Connect power: plug the supplied IEC cable into the Pith rear and into a grounded power outlet.`,
      `Connect your source: run XLR or RCA cables from your amplifier's sub output (or pre-out) into the Pith's Line In or High Level input.`,
      `Connect the Banyan Canopy: run a Speakon cable from the Pith's Canopy output to the Canopy's Speakon input.`,
      `DSP configuration: connect a laptop via the front USB port. Open SigmaStudio. Load the XSCACE factory preset for your speaker combination.`,
      `Power on the Pith. Status LED illuminates when system is ready.`,
    ]
  }

  if (it === 'spirea') {
    return [
      `Spike mount: push spike firmly into soil. On harder ground, use a rubber mallet. Listening height: 400–600mm above ground.`,
      `Hanging mount: attach the carabiner to a suitable overhead anchor (pergola beam, joist, rated for the load). Clip the hanging loop onto the carabiner.`,
      `Route speaker cable (${wire}) from the amplifier to the Spirea. Connect to the terminal block — observe polarity.`,
      `Aim the driver face toward the primary listening area.`,
      `For permanent outdoor cable runs: use outdoor-rated direct-burial cable. For above-ground: UV-stable conduit.`,
    ]
  }

  if (it === 'powered-sub') {
    const hasJuniper = (P.productName||'').toLowerCase().includes('juniper')
    return [
      `Place the subwoofer on a solid floor. Corner placement reinforces bass; away from walls gives a flatter response.`,
      `Connect the LFE signal: run an RCA cable from your amplifier's subwoofer output (LFE out) into the subwoofer's Line In. If no sub out is available, use the amplifier's pre-out.`,
      hasJuniper ? `Speaker-level option: connect speaker wire from an amplifier channel's + and − outputs directly into the high-level inputs — useful when no pre-out is available.` : `Set the input level trim on the subwoofer rear panel to match your amplifier's output level.`,
      `Connect power: plug the supplied IEC cable into the subwoofer rear and into a grounded power outlet.`,
      `Set the low-pass crossover on the subwoofer to match your main speakers. Bonsai/Cane/Ghost: 150–200Hz. Cedar/Camphor/Oak/Willow: 80–120Hz.`,
      `Set the phase switch to 0°. If bass sounds hollow at the MLP, switch to 180°.`,
      `Power on the subwoofer and adjust the volume trim to blend with the main speakers.`,
    ]
  }

  if (it === 'passive-sub') {
    return [
      `Place the subwoofer on a solid floor. Corner placement reinforces bass.`,
      `Connect speaker wire (${wire}) from a dedicated amplifier sub channel to the binding posts — observe polarity (+ red / − black).`,
      `Ensure the driving amplifier has a low-pass filter set to the correct crossover frequency. Bonsai/Cane/Ghost: 150–200Hz. Larger speakers: 80–120Hz.`,
      `Do not connect a passive subwoofer to a pre-out or line-out — it requires amplifier power.`,
      `Play test audio and adjust the amplifier's sub channel gain until bass blends naturally with the main speakers.`,
    ]
  }

  if (it === 'dsp-amplifier') {
    const isLucifer = (P.productName||'').toLowerCase().includes('lucifer')
    const isRoot    = (P.productName||'').toLowerCase().includes('root')
    const hasXLR    = isLucifer || isRoot
    return [
      `Rack mounting: the ${name} is 1U rack-mountable. Slide into a 19-inch rack and secure with rack screws. Allow at least 1U clearance above for airflow.`,
      `Connect inputs: run XLR balanced cables from your source into the amplifier's XLR inputs. CH1/CH2 are typically L/R main speakers; CH3/CH4 for additional channels or subwoofers.`,
      hasXLR ? `Speakon wiring: use NL4 Speakon connectors. Pin 1+ and 1− carry CH1; Pin 2+ and 2− carry CH2. For bridged mono: use CH1(+) and CH2(−) — the two channels form one high-power mono output. Channels 3 and 4 bridge the same way.` : '',
      hasXLR ? `XLR wiring: balanced XLR — Pin 1 = Ground, Pin 2 = Hot (+), Pin 3 = Cold (−).` : '',
      `Connect power: plug the IEC cable into the amplifier rear and into a grounded outlet. Do not power on until all speaker connections are secure.`,
      `DSP setup: connect a laptop via the front USB port. Open ${P.desktopSoftwareName || 'the DSP software'}. Load the XSCACE factory preset for your speaker model.`,
      `Power on. Play audio at low volume first — verify all channels before raising levels.`,
    ].filter(Boolean)
  }

  if (it === 'streaming-amplifier') {
    return [
      `Connect speaker cables from the Air Amp's speaker output terminals to your speakers — observe polarity (+ red / − black).`,
      `Optionally connect a passive subwoofer to the Air Amp's subwoofer output.`,
      `Connect power: plug the supplied DC 24V–5A adapter into the Air Amp's DC input and into a power outlet.`,
      `First-time setup: download the XSCACE Controller app (App Store / Google Play). Open the app and follow the setup wizard to connect the Air Amp to your Wi-Fi.`,
      `Once connected, the Air Amp appears as an AirPlay 2 device, Bluetooth device, and Spotify Connect target. Select it as the output in your streaming app.`,
    ]
  }

  if (it === 'streamer') {
    return [
      `Connect the Air Mini's Line Out (RCA) to your amplifier's line input, or via SPDIF Optical or HDMI ARC to your AV processor.`,
      `Connect power: plug the supplied DC 19V adapter into the Air Mini and into a power outlet.`,
      `First-time setup: download the XSCACE Controller app (App Store / Google Play). Follow the wizard to connect the Air Mini to your Wi-Fi.`,
      `The Air Mini appears as an AirPlay 2 device, Spotify Connect target, and Bluetooth receiver. Select it as the output in your streaming app.`,
    ]
  }

  return ['Place the unit as described in the positioning section.','Make all signal and power connections.','Power on and verify at low volume.']
}

// ── CONNECT SECTION ───────────────────────────────────────────────────────────
function connectSection(P: any): string {
  const it   = P.installationType || ''
  const wire = P.wireGaugeRecommended || '14 AWG or thinner'
  const conn = P.speakerWireConnector || 'push terminal'
  const imp  = P.impedanceOhms ? `${P.impedanceOhms}Ω` : '8Ω'
  const xover = P.recommendedCrossoverHz ? `${P.recommendedCrossoverHz}Hz` : 'as required'
  const isSpeaker = ['keyhole-wall','bracket-wall','ceiling-circular','ceiling-rectangular','inwall-dogleg','inwall-springclip','banyan-canopy','spirea'].includes(it)
  const isSub     = ['inwall-sub','powered-sub','passive-sub'].includes(it)
  const isAmp     = ['dsp-amplifier','streaming-amplifier','banyan-pith'].includes(it)
  if (isSpeaker) return `
<div class="conn-row"><span class="conn-l">Wire gauge</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Connector</span><span class="conn-v">${conn}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>
<div class="conn-row"><span class="conn-l">Crossover (set on amp)</span><span class="conn-v">${xover} low-pass</span></div>
<div class="conn-row"><span class="conn-l">Polarity</span><span class="conn-v">Red(+) to positive · Black(−) to negative</span></div>
<p class="conn-note">Wire both speakers in the same phase. Reversed polarity on one speaker causes bass cancellation.</p>`
  if (isSub) {
    const powered = it === 'powered-sub'
    return `
<div class="conn-row"><span class="conn-l">Signal input</span><span class="conn-v">${powered ? 'RCA Line In or High Level input' : 'Speaker terminals (binding posts)'}</span></div>
<div class="conn-row"><span class="conn-l">Wire gauge</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>
<div class="conn-row"><span class="conn-l">Crossover</span><span class="conn-v">${xover} low-pass</span></div>
${powered ? `<div class="conn-row"><span class="conn-l">Power</span><span class="conn-v">IEC power cable — grounded outlet</span></div>` : ''}
<p class="conn-note">${powered ? 'Built-in amplifier — only LFE signal input required. Do not connect speaker-level output unless using high-level input.' : 'Passive — requires a separate amplifier channel to drive it.'}</p>`
  }
  if (isAmp) return `
<div class="conn-row"><span class="conn-l">Inputs</span><span class="conn-v">${P.inputs || 'XLR balanced / RCA'}</span></div>
<div class="conn-row"><span class="conn-l">Outputs</span><span class="conn-v">${P.outputs || 'Speaker terminals / Speakon'}</span></div>
<div class="conn-row"><span class="conn-l">Speaker wire</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Load impedance</span><span class="conn-v">${imp}</span></div>
<p class="conn-note">Connect all speaker cables before powering on. Never connect or disconnect speakers while the amplifier is running.</p>`
  return `
<div class="conn-row"><span class="conn-l">Outputs</span><span class="conn-v">${P.outputs || 'RCA Line Out, SPDIF Optical'}</span></div>
<div class="conn-row"><span class="conn-l">Inputs</span><span class="conn-v">${P.inputs || 'AirPlay 2, Bluetooth 5.0, Spotify Connect'}</span></div>
<div class="conn-row"><span class="conn-l">Power</span><span class="conn-v">${P.powerSupply || 'DC 19V adapter (included)'}</span></div>
<p class="conn-note">The Air Mini is a streamer only — no built-in amplifier. Connect its output to an amplifier or AV receiver.</p>`
}

// ── CSS ───────────────────────────────────────────────────────────────────────
function buildCss(fontCss: string): string {
  return `${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:210mm 297mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:210mm}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}
.cov-hero{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.42}
.cov-overlay{position:absolute;inset:0;background:linear-gradient(to top,#090909 40%,rgba(9,9,9,.7) 68%,transparent 100%)}
.cov-content{position:absolute;left:0;right:0;bottom:0;padding:44px 40px 50px}
.cov-eyebrow{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.25em;color:#c9a96e;text-transform:uppercase;margin-bottom:10px}
.cov-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:58px;color:#eeebe5;line-height:.95}
.cov-tagline{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:16px;color:#c9a96e;margin-top:7px}
.cov-rule{height:1px;background:rgba(201,169,110,.35);margin:20px 0}
.cov-meta{display:flex;justify-content:space-between;align-items:flex-end}
.cov-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:19px;letter-spacing:.04em;color:#eeebe5}
.cov-sku{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835;letter-spacing:.12em}
.cov-bar{position:absolute;left:0;right:0;height:5px;background:#c9a96e}
.cov-bar-t{top:0}.cov-bar-b{bottom:0}
.cov-logo{position:absolute;top:40px;left:40px}
.cov-warn{position:absolute;top:40px;right:40px;font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;text-align:right;line-height:1.7}
.pg{padding:26px 30px 22px;height:100%;display:flex;flex-direction:column}
.pg-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-shrink:0}
.pg-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:13px;color:#eeebe5}
.pg-info{font-family:'DM Mono',monospace;font-size:6px;color:#7a776f;letter-spacing:.12em}
.pg-rule{height:1px;background:rgba(201,169,110,.2);flex-shrink:0}
.pg-num{font-family:'DM Mono',monospace;font-size:6px;color:#3a3835;margin:5px 0 12px}
.two{display:flex;gap:16px;flex:1;min-height:0}
.left{flex:1;display:flex;flex-direction:column;gap:10px;overflow:hidden;min-width:0}
.right{flex:0 0 38%;display:flex;flex-direction:column;gap:8px}
.sec{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:3px;margin-bottom:5px}
.box-item{display:flex;align-items:flex-start;gap:7px;padding:2px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.box-dot{width:4px;height:4px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:3px}
.box-text{font-family:'DM Mono',monospace;font-size:7px;color:#eeebe5}
.tool-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.tool-item{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;padding:1.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.pos-title{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:19px;color:#eeebe5;margin-bottom:6px}
.pos-step{display:flex;gap:7px;padding:2px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.pos-dot{width:3px;height:3px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:5px}
.pos-text{font-family:'DM Sans',Helvetica,sans-serif;font-size:7px;color:#eeebe5;line-height:1.5}
.pos-note{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;line-height:1.5;margin-top:6px;border-left:1.5px solid rgba(201,169,110,.3);padding-left:7px}
.step{display:flex;gap:10px;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.step-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:rgba(201,169,110,.3);line-height:1;flex-shrink:0;width:17px;text-align:right}
.step-text{font-family:'DM Sans',Helvetica,sans-serif;font-size:7px;color:#eeebe5;line-height:1.5;padding-top:2px}
.diag{background:#0a0a08;border:.4px solid rgba(201,169,110,.1);overflow:hidden;display:flex;align-items:stretch;justify-content:stretch}
.conn-row{display:flex;justify-content:space-between;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.conn-l{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f}
.conn-v{font-family:'DM Mono',monospace;font-size:7px;color:#eeebe5;text-align:right;max-width:55%}
.conn-note{font-family:'DM Sans',Helvetica,sans-serif;font-size:7px;color:#7a776f;line-height:1.5;margin-top:5px;border-left:1.5px solid rgba(201,169,110,.3);padding-left:7px}
.qr-area{background:#0e0e0c;border:.4px solid rgba(201,169,110,.12);padding:12px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.qr-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:300;color:#eeebe5}
.qr-sub{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;line-height:1.6;max-width:130px}
.qr-url{font-family:'DM Mono',monospace;font-size:7px;color:#c9a96e;letter-spacing:.05em}
.dim-box{background:#0a0a08;border:.4px solid rgba(201,169,110,.1);padding:8px}
.safety{margin-top:8px;padding-top:7px;border-top:.4px solid rgba(201,169,110,.1);flex-shrink:0}
.safety-lbl{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.15em;color:#c9a96e;text-transform:uppercase;margin-bottom:3px}
.safety-txt{font-family:'DM Sans',Helvetica,sans-serif;font-size:6.5px;color:#7a776f;line-height:1.55}
.pro-note{font-family:'DM Mono',monospace;font-size:5.5px;color:#3a3835;line-height:1.7;margin-top:8px;text-align:center;border-top:.3px solid rgba(255,255,255,.04);padding-top:6px}
.supp-lbl{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;margin-bottom:3px}
.supp-line{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;margin-bottom:2px}
`
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
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

    const h = Buffer.from(`${P.productName}${P.installationType}${P.screwSpacingMm||''}${P.cutoutHeightMm||''}v3`).toString('base64').replace(/\W/g,'').slice(0,12)
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

    const stepsHtml  = steps.map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div class="step-text">${s}</div></div>`).join('')
    const toolsHtml  = tools.map(t=>`<div class="tool-item">— ${t}</div>`).join('')
    const boxHtml    = boxItems.map((t:string)=>`<div class="box-item"><div class="box-dot"></div><div class="box-text">${t}</div></div>`).join('')
    const posHtml    = advice.steps.map(s=>`<div class="pos-step"><div class="pos-dot"></div><div class="pos-text">${s}</div></div>`).join('')
    const connHtml   = connectSection(P)
    const instSvg    = installDiagram(P)
    const stereoSvg  = stereoDiagram(P)

    // Real QR code via api.qrserver.com — Puppeteer has network access
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=https%3A%2F%2Fconfigurator.xscace.com&bgcolor=090909&color=c9a96e&qzone=2&margin=0`

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cov-bar cov-bar-t"></div>
  <div class="cov-bar cov-bar-b"></div>
  ${hero ? `<img src="${hero}" class="cov-hero">` : ''}
  <div class="cov-overlay"></div>
  <div class="cov-logo">
    <div style="font-family:'MagmaWave','DM Sans',sans-serif;font-size:16px;color:#eeebe5;letter-spacing:.04em">XSCACE</div>
    <div style="font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.2em;color:#7a776f;margin-top:2px">SIZE DEFYING SOUND</div>
  </div>
  <div class="cov-warn">READ ALL<br>INSTRUCTIONS<br>BEFORE<br>INSTALLATION</div>
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

<!-- PAGE 2: BOX + TOOLS + POSITIONING + STEREO DIAGRAM -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr"><div class="pg-brand">XSCACE</div><div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
    <div class="pg-rule"></div>
    <div class="pg-num">02</div>
    <div class="two">
      <div class="left">
        <div>
          <div class="sec">What's in the box</div>
          ${boxHtml || '<div class="box-text" style="color:#7a776f">See packaging for full contents list.</div>'}
        </div>
        <div>
          <div class="sec">Tools required</div>
          <div class="tool-grid">${toolsHtml}</div>
        </div>
        <div style="flex:1">
          <div class="sec">${advice.title}</div>
          <div class="pos-title">Finding your<br>ideal sound stage.</div>
          ${posHtml}
          <div class="pos-note">${advice.note}</div>
        </div>
      </div>
      <div class="right">
        <!-- Positioning diagram — takes majority of right col -->
        <div class="diag" style="flex:0 0 190px">${stereoSvg}</div>
        ${hero ? `<div style="flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);overflow:hidden"><img src="${hero}" style="width:100%;height:100%;object-fit:contain;display:block"></div>` : ''}
        <div style="font-family:'DM Mono',monospace;font-size:6px;color:#7a776f;line-height:1.7;margin-top:4px;flex-shrink:0">
          ${P.weightKg ? `Weight: ${P.weightKg} kg · ` : ''}${P.heightMm && P.widthMm && P.depthMm ? `${P.heightMm}×${P.widthMm}×${P.depthMm}mm` : ''}${P.powerType ? ` · ${P.powerType}` : ''}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3: INSTALLATION STEPS + DIAGRAM -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr"><div class="pg-brand">XSCACE</div><div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
    <div class="pg-rule"></div>
    <div class="pg-num">03</div>
    <div class="two" style="flex:1">
      <div class="left">
        <div class="sec">Installation Steps</div>
        <div style="flex:1;overflow:hidden">${stepsHtml}</div>
        <div class="safety">
          <div class="safety-lbl">Safety Notice</div>
          <div class="safety-txt">Always isolate power before making electrical connections. Ensure all fixings are adequate for the combined weight of the installation. If in doubt about wall or ceiling construction, consult a structural professional before cutting. XSCACE accepts no responsibility for damage caused by incorrect installation.</div>
        </div>
      </div>
      <div class="right">
        <!-- Installation method diagram — full height -->
        <div class="diag" style="flex:0 0 280px">${instSvg}</div>
        <!-- Key dimensions callout -->
        <div class="dim-box" style="flex:1;margin-top:0">
          <div class="sec" style="margin-bottom:4px">Key Dimensions</div>
          ${P.screwSpacingMm ? `<div class="conn-row"><span class="conn-l">Screw spacing</span><span class="conn-v">${P.screwSpacingMm}mm c/c</span></div>` : ''}
          ${P.screwSize ? `<div class="conn-row"><span class="conn-l">Screw size</span><span class="conn-v">${P.screwSize}</span></div>` : ''}
          ${P.cutoutDiameterMm ? `<div class="conn-row"><span class="conn-l">Cutout ⌀</span><span class="conn-v">${P.cutoutDiameterMm}mm</span></div>` : ''}
          ${(P.cutoutHeightMm && P.cutoutWidthMm) ? `<div class="conn-row"><span class="conn-l">Cutout H × W</span><span class="conn-v">${P.cutoutHeightMm} × ${P.cutoutWidthMm}mm</span></div>` : ''}
          ${P.requiredCavityDepthMm ? `<div class="conn-row"><span class="conn-l">Cavity depth min</span><span class="conn-v">${P.requiredCavityDepthMm}mm</span></div>` : ''}
          ${(!P.screwSpacingMm && !P.cutoutDiameterMm && !P.cutoutHeightMm && !P.requiredCavityDepthMm) ? `<div style="font-family:'DM Mono',monospace;font-size:6.5px;color:#3a3835">No cutout or screw dimensions required</div>` : ''}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: CONNECT + QR + SUPPORT -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr"><div class="pg-brand">XSCACE</div><div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
    <div class="pg-rule"></div>
    <div class="pg-num">04</div>
    <div class="two" style="flex:1">
      <div class="left">
        <div>
          <div class="sec">Connecting to your system</div>
          ${connHtml}
        </div>
        <div style="flex:1">
          <div class="sec">System design &amp; wiring</div>
          <div style="font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#eeebe5;line-height:1.6;margin-bottom:8px">For full system configuration — amplifier selection, subwoofer integration, multi-room setup, and wiring diagrams — use the XSCACE Configurator:</div>
          <div class="qr-area">
            <div class="qr-title">XSCACE Configurator</div>
            <img src="${qrUrl}" width="100" height="100" style="display:block;image-rendering:pixelated" alt="QR code for configurator.xscace.com">
            <div class="qr-sub">Scan to open the interactive system configurator. Select your products, receive a complete wiring diagram and bill of quantities.</div>
            <div class="qr-url">configurator.xscace.com</div>
          </div>
        </div>
        <div class="pro-note">For complex installations, large spaces, or commercial projects — XSCACE recommends engaging a certified installation partner. Contact support@xscace.com to be connected with a professional installer in your region.</div>
      </div>
      <div class="right">
        <div>
          <div class="supp-lbl">Support</div>
          <div class="supp-line">support@xscace.com</div>
          <div class="supp-line">xscace.com</div>
        </div>
        <div style="margin-top:12px">
          <div class="sec">Product Reference</div>
          ${P.skuBase ? `<div class="conn-row"><span class="conn-l">SKU</span><span class="conn-v">${P.skuBase}</span></div>` : ''}
          ${P.series  ? `<div class="conn-row"><span class="conn-l">Series</span><span class="conn-v">${P.series}</span></div>` : ''}
          ${P.impedanceOhms ? `<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${P.impedanceOhms}Ω</span></div>` : ''}
          ${P.powerRmsW ? `<div class="conn-row"><span class="conn-l">Power RMS</span><span class="conn-v">${P.powerRmsW}W</span></div>` : ''}
          ${P.weightKg  ? `<div class="conn-row"><span class="conn-l">Weight</span><span class="conn-v">${P.weightKg}kg</span></div>` : ''}
          ${P.heightMm && P.widthMm && P.depthMm ? `<div class="conn-row"><span class="conn-l">Dimensions</span><span class="conn-v">${P.heightMm}×${P.widthMm}×${P.depthMm}mm</span></div>` : ''}
        </div>
        <div style="flex:1"></div>
        <div style="font-family:'DM Mono',monospace;font-size:5.5px;color:#3a3835;line-height:1.7;border-top:.3px solid rgba(255,255,255,.04);padding-top:7px">
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
    // networkidle0 so the QR code image loads
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 })
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
