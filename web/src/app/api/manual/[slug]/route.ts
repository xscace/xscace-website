// web/src/app/api/manual/[slug]/route.ts — A4 LANDSCAPE, 5 pages
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

function sanityImgUrl(ref: string, w = 900) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=85`
}
async function imgB64(ref: string | null, w = 900): Promise<string> {
  if (!ref) return ''
  try { const r = await fetch(sanityImgUrl(ref, w)); if (!r.ok) return ''; return `data:${r.headers.get('content-type')||'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}` } catch { return '' }
}
function getRef(o: any): string { return o?.asset?._ref || '' }
function fileCdn(id: string) { const b=id.replace('file-',''),i=b.lastIndexOf('-'); return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${b.slice(0,i)}.${b.slice(i+1)}` }
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
  for (const [family,weight,style,fname] of map) { const p=path.join(fontDir,fname); if(fs.existsSync(p)) css+=`@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url('data:font/truetype;base64,${fs.readFileSync(p).toString('base64')}') format('truetype');}\n` }
  const mw=path.join(process.cwd(),'public','fonts','MagmaWave.otf')
  if(fs.existsSync(mw)) css+=`@font-face{font-family:'MagmaWave';src:url('data:font/otf;base64,${fs.readFileSync(mw).toString('base64')}') format('opentype');}\n`
  return css
}

// PALETTE
const BG='#090909',CH='#c9a96e',LT='#eeebe5',MU='#7a776f',DIM_C='#3a3835',WL='#111110'
const f=(n:number)=>n.toFixed(1)

// SVG PRIMITIVES
function svg(w:number,h:number,body:string){return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(201,169,110,0.09)" stroke-width="4"/></pattern></defs><rect width="${w}" height="${h}" fill="${BG}"/>${body}</svg>`}
function tx(x:number,y:number,t:string,sz=10,fill=MU,anchor='middle'){return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" fill="${fill}" font-size="${sz}" font-family="DM Mono,monospace" letter-spacing="0.03em">${t}</text>`}
function corm(x:number,y:number,t:string,sz=22,fill=LT,anchor='middle'){return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" fill="${fill}" font-size="${sz}" font-family="Cormorant Garamond,Georgia,serif" font-weight="300">${t}</text>`}
function L(x1:number,y1:number,x2:number,y2:number,stroke=CH,sw=1,dash=''){return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${sw}" ${dash?`stroke-dasharray="${dash}"`:''}stroke-linecap="round"/>`}
function R(x:number,y:number,w:number,h:number,fill=WL,stroke=CH,sw=1,rx=3){return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`}
function C(cx:number,cy:number,r:number,fill=WL,stroke=CH,sw=1){return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`}
function dim(x1:number,y1:number,x2:number,y2:number,lbl:string,off=16){
  const horiz=Math.abs(y2-y1)<Math.abs(x2-x1), mx=(x1+x2)/2, my=(y1+y2)/2
  if(horiz) return `${L(x1,y1,x2,y2,CH,0.6,'4,3')}${L(x1,y1-6,x1,y1+6,CH,0.6)}${L(x2,y2-6,x2,y2+6,CH,0.6)}${tx(mx,y1-off,lbl,9,CH)}`
  return `${L(x1,y1,x2,y2,CH,0.6,'4,3')}${L(x1-6,y1,x1+6,y1,CH,0.6)}${L(x2-6,y2,x2+6,y2,CH,0.6)}${tx(x1-off-2,my+3,lbl,9,CH,'end')}`
}

// ══════════════════════════════════════════════════════════════════════════════
// INSTALL DIAGRAM — fills right half of page 4 (480×570 SVG canvas)
// ══════════════════════════════════════════════════════════════════════════════
function installDiagram(P:any):string {
  const it=P.installationType||'', W=480, H=570

  // ── KEYHOLE WALL MOUNT ───────────────────────────────────────────────────────
  if(it==='keyhole-wall'){
    const spc=P.screwSpacingMm||82, scrL=P.screwSize||'M2.5×25'
    const isQ=(P.productName||'').toLowerCase().includes('quad')
    const wx=52,ww=70,wh=460,wy=54
    const s1y=wy+wh/2-Math.min(spc*0.62,100), s2y=wy+wh/2+Math.min(spc*0.62,100)

    // Screw detail with thread lines and hex head
    function screw(y:number){
      return `${R(wx+ww,y-7,40,14,LT,BG,0.4,1)}
      ${[4,9,14,19,24,29,34].map((ox:number)=>L(wx+ww+ox,y-7,wx+ww+ox,y+7,'rgba(9,9,9,0.55)',0.5)).join('')}
      ${R(wx+ww+40,y-10,18,20,CH,BG,0.6,2)}`
    }
    // Keyhole slot
    function kh(cx:number,cy:number){
      return `${C(cx,cy,12,BG,CH,1.4)}${R(cx-7,cy,14,24,BG,CH,1,0)}${L(cx-7,cy,cx-7,cy+24,CH,1.2)}${L(cx+7,cy,cx+7,cy+24,CH,1.2)}`
    }

    return svg(W,H,`
      <!-- WALL slab with hatching -->
      ${R(wx,wy,ww,wh,WL,'rgba(201,169,110,0.35)',0.7,0)}
      <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#hatch)"/>
      ${tx(wx+ww/2,wy-18,'WALL SURFACE',10,MU)}

      <!-- Wall plugs inside wall -->
      ${C(wx+ww/2,s1y,13,'rgba(201,169,110,0.22)',CH,1.4)}
      ${C(wx+ww/2,s1y,5,CH,BG,0.6)}
      ${tx(wx+16,s1y-20,'WALL',8,MU)}
      ${tx(wx+16,s1y-9,'PLUG',8,MU)}
      ${C(wx+ww/2,s2y,13,'rgba(201,169,110,0.22)',CH,1.4)}
      ${C(wx+ww/2,s2y,5,CH,BG,0.6)}

      <!-- Screws protruding from wall -->
      ${screw(s1y)}
      ${R(wx+ww+58,s1y-12,18,24,CH,BG,0.6,2)}
      ${tx(wx+ww+90,s1y-16,'SCREW 1',10,CH,'start')}
      ${tx(wx+ww+90,s1y,scrL,9,MU,'start')}
      ${screw(s2y)}
      ${R(wx+ww+58,s2y-12,18,24,CH,BG,0.6,2)}
      ${tx(wx+ww+90,s2y-16,'SCREW 2',10,CH,'start')}

      <!-- Screw spacing dimension -->
      ${dim(wx-28,s1y,wx-28,s2y,`${spc}mm`,36)}
      ${tx(wx-22,(s1y+s2y)/2+4,`${spc}mm`,10,CH,'end')}

      <!-- SPEAKER REAR showing keyhole slots -->
      ${R(wx+ww+54,s1y-22,52,s2y-s1y+44,WL,CH,1.8,5)}
      ${kh(wx+ww+54+18,s1y)}
      ${kh(wx+ww+54+18,s2y)}
      ${tx(wx+ww+54+18,s1y-32,'REAR FACE',9,LT,'middle')}
      ${tx(wx+ww+54+18,s2y+38,'(keyhole slots)',7,MU,'middle')}

      <!-- Speaker terminal on rear -->
      ${R(wx+ww+54+30,s1y-8,20,28,BG,LT,0.9,2)}
      ${C(wx+ww+54+36,(s1y+s2y)/2-8,5,CH,BG,0.6)}
      ${C(wx+ww+54+44,(s1y+s2y)/2-8,5,BG,LT,0.6)}
      ${tx(wx+ww+54+36,(s1y+s2y)/2+6,'+',9,CH,'middle')}
      ${tx(wx+ww+54+44,(s1y+s2y)/2+6,'−',9,LT,'middle')}
      ${tx(wx+ww+54+40,(s1y+s2y)/2+20,'TERM.',7,MU,'middle')}

      <!-- SPEAKER FRONT (shown to the right) -->
      ${R(wx+ww+54+52+16,s1y-28,56,s2y-s1y+56,WL,CH,1.8,5)}
      <!-- tweeter -->
      ${C(wx+ww+54+52+16+28,s1y+4,10,CH,BG,0.5)}
      <!-- woofer cone rings -->
      ${C(wx+ww+54+52+16+28,s1y+(s2y-s1y)*0.55,Math.min((s2y-s1y)*0.26,30),BG,CH,1.3)}
      ${C(wx+ww+54+52+16+28,s1y+(s2y-s1y)*0.55,Math.min((s2y-s1y)*0.12,14),CH,BG,0.45)}
      ${C(wx+ww+54+52+16+28,s1y+(s2y-s1y)*0.55,Math.min((s2y-s1y)*0.05,6),CH,BG,0.8)}
      ${tx(wx+ww+54+52+16+28,s1y-40,'FRONT FACE',9,LT,'middle')}
      ${corm(wx+ww+54+52+16+28,s2y+(s2y-s1y)*0.32+48,P.productName||'',14,LT)}

      <!-- Cable from terminal to wall -->
      ${L(wx+ww+54+30,(s1y+s2y)/2+6,wx+ww+8,(s1y+s2y)/2,CH,1.2,'5,3')}
      ${tx(wx+ww+54+20,(s1y+s2y)/2+24,'SPEAKER CABLE → AMP',9,MU,'middle')}

      ${isQ ? `
        ${R(66,wy+wh+24,358,56,BG,'rgba(201,169,110,0.13)',0.4,3)}
        ${tx(244,wy+wh+42,'QuadCane: two-piece corner bracket — each piece',10,LT,'middle')}
        ${tx(244,wy+wh+58,`${spc}mm apart centre-to-centre on adjacent walls`,10,MU,'middle')}` : `
        ${R(66,wy+wh+24,358,44,BG,'rgba(201,169,110,0.09)',0.3,3)}
        ${tx(244,wy+wh+42,'Lower keyhole slots onto screw heads. Screw must protrude 5–7mm.',10,LT,'middle')}
        ${tx(244,wy+wh+56,'Speaker locks firmly — cannot lift without tilting.',9,MU,'middle')}`}
      ${tx(W/2,H-10,`KEYHOLE WALL MOUNT  ·  ${spc}mm C/C  ·  ${scrL}`,9,MU)}`)
  }

  // ── BRACKET WALL MOUNT ──────────────────────────────────────────────────────
  if(it==='bracket-wall'){
    const spc=P.screwSpacingMm||120, scrL=P.screwSize||'M4×25'
    const wx=52,ww=70,wh=460,wy=54
    const s1y=wy+wh*0.28, s2y=wy+wh*0.72
    return svg(W,H,`
      ${R(wx,wy,ww,wh,WL,'rgba(201,169,110,0.35)',0.7,0)}
      <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#hatch)"/>
      ${tx(wx+ww/2,wy-18,'WALL SURFACE',10,MU)}
      ${C(wx+ww/2,s1y,13,'rgba(201,169,110,0.22)',CH,1.4)}${C(wx+ww/2,s1y,5,CH,BG,0.6)}
      ${C(wx+ww/2,s2y,13,'rgba(201,169,110,0.22)',CH,1.4)}${C(wx+ww/2,s2y,5,CH,BG,0.6)}
      ${R(wx+ww,s1y-7,36,14,LT,BG,0.4,1)}${R(wx+ww+36,s1y-11,20,22,CH,BG,0.6,2)}
      ${R(wx+ww,s2y-7,36,14,LT,BG,0.4,1)}${R(wx+ww+36,s2y-11,20,22,CH,BG,0.6,2)}
      ${tx(wx+ww+72,s1y-16,'SCREW',10,CH,'start')}${tx(wx+ww+72,s1y,scrL,9,MU,'start')}
      ${tx(wx+ww+72,s2y-16,'SCREW',10,CH,'start')}
      ${dim(wx-28,s1y,wx-28,s2y,`${spc}mm`,36)}
      ${tx(wx-22,(s1y+s2y)/2+4,`${spc}mm`,10,CH,'end')}
      ${R(wx+ww+56,s1y-7,14,s2y-s1y,WL,CH,1.4,2)}
      ${R(wx+ww+56,s1y-8,56,16,WL,CH,1.2,2)}
      ${R(wx+ww+56,s2y-8,56,16,WL,CH,1.2,2)}
      ${tx(wx+ww+56+7,(s1y+s2y)/2,'BRACKET',8,CH,'start')}
      ${R(wx+ww+56+56,s1y-26,80,s2y-s1y+52,WL,CH,1.8,5)}
      ${C(wx+ww+56+56+40,(s1y+s2y)/2-22,11,CH,BG,0.5)}
      ${C(wx+ww+56+56+40,(s1y+s2y)/2+14,18,BG,CH,1.3)}${C(wx+ww+56+56+40,(s1y+s2y)/2+14,8,CH,BG,0.45)}
      ${tx(wx+ww+56+56+40,s1y-42,'FRONT FACE',9,LT,'middle')}
      ${corm(wx+ww+56+56+40,s2y+(s2y-s1y)*0.28+56,P.productName||'',14,LT)}
      ${R(wx+ww+56+56+62,s1y-8,20,26,BG,LT,0.9,2)}
      ${tx(wx+ww+56+56+72,(s1y+s2y)/2,'±',10,CH,'middle')}
      ${L(wx+ww+56+56+60,(s1y+s2y)/2,wx+ww+8,(s1y+s2y)/2,CH,1.2,'5,3')}
      ${tx(W/2,H-10,`BRACKET WALL MOUNT  ·  ${spc}mm C/C  ·  ${scrL}`,9,MU)}`)
  }

  // ── CEILING CIRCULAR ────────────────────────────────────────────────────────
  if(it==='ceiling-circular'){
    const d=P.cutoutDiameterMm||209, cav=P.requiredCavityDepthMm||115, r=110
    return svg(W,H,`
      ${R(30,22,W-60,80,'#0c0c0a','rgba(201,169,110,0.08)',0.3,0)}
      ${tx(W/2,58,`VOID  ·  MIN ${cav}mm CAVITY DEPTH`,10,MU)}
      ${R(30,102,W-60,52,WL,'rgba(201,169,110,0.3)',0.7,0)}
      <rect x="30" y="102" width="${W-60}" height="52" fill="url(#hatch)"/>
      ${tx(W/2,94,'CEILING',9,MU)}
      <circle cx="${W/2}" cy="128" r="${r}" fill="${BG}" stroke="${CH}" stroke-width="2"/>
      ${tx(W/2,90,`⌀ ${d}mm`,11,CH)}
      ${dim(W/2-r,166,W/2+r,166,`${d}mm CUTOUT`,12)}
      <circle cx="${W/2}" cy="128" r="${r-9}" fill="${WL}" stroke="${CH}" stroke-width="1.4"/>
      <circle cx="${W/2}" cy="128" r="${r-24}" fill="#0d0d0b" stroke="rgba(201,169,110,0.25)" stroke-width="0.7"/>
      <ellipse cx="${W/2}" cy="${128-r*0.24}" rx="18" ry="11" fill="${CH}" opacity="0.65"/>
      ${tx(W/2,128-r*0.24+4,'TWEETER',7,BG)}
      <circle cx="${W/2}" cy="${f(128+r*0.22)}" r="${f(r*0.35)}" fill="${BG}" stroke="${CH}" stroke-width="1.2"/>
      <circle cx="${W/2}" cy="${f(128+r*0.22)}" r="${f(r*0.14)}" fill="${CH}" opacity="0.32"/>
      <circle cx="${W/2}" cy="${f(128+r*0.22)}" r="${f(r*0.06)}" fill="${CH}" opacity="0.75"/>
      ${[0,90,180,270].map((a:number)=>{const rd=a*Math.PI/180,ex=W/2+(r+26)*Math.cos(rd),ey=128+(r+26)*Math.sin(rd);return `${R(W/2+(r-5)*Math.cos(rd)-7,128+(r-5)*Math.sin(rd)-5,14,10,CH,BG,0.3,1)}${L(W/2+(r-1)*Math.cos(rd),128+(r-1)*Math.sin(rd),ex,ey,CH,1.8)}${C(ex,ey,7,BG,CH,1.3)}`}).join('')}
      ${tx(W/2+r+42,74,'DOG-LEG',10,CH,'start')}${tx(W/2+r+42,88,'CLIPS ×4',10,CH,'start')}${tx(W/2+r+42,102,'clamp behind ceiling',8,MU,'start')}
      ${L(W/2,128+r-7,W/2,372,CH,1.2,'6,3')}${C(W/2,372,11,BG,CH,1.4)}${C(W/2-5,372,5,CH,BG,0.6)}${C(W/2+5,372,5,BG,LT,0.6)}
      ${tx(W/2+24,364,'TERMINAL',9,CH,'start')}${tx(W/2+24,378,'observe + / −',8,MU,'start')}
      ${L(34,102,34,22,CH,0.6,'3,2')}${L(28,102,40,102,CH,0.6)}${L(28,22,40,22,CH,0.6)}
      ${tx(26,64,`${cav}mm`,9,CH,'end')}${tx(26,77,'cavity',8,MU,'end')}
      ${R(30,408,W-60,138,BG,'rgba(201,169,110,0.08)',0.3,3)}
      ${['①  Check cavity depth — minimum '+cav+'mm required','②  Cut ⌀'+d+'mm hole using hole saw','③  Route cable — leave 200mm slack through hole','④  Connect to terminal (+ and − clearly marked)','⑤  Insert speaker tilted, straighten flush to ceiling','⑥  Tighten dog-leg clips evenly — do not overtighten','⑦  Clip grille on (paintable — prime before fitting)'].map((s:string,i:number)=>`${tx(52,426+i*20,s,9,i%2===0?LT:MU,'start')}`).join('')}
      ${tx(W/2,H-10,`CIRCULAR IN-CEILING  ·  ⌀${d}mm  ·  ${cav}mm CAVITY`,9,MU)}`)
  }

  // ── CEILING RECTANGULAR (Ghost 2.0) ─────────────────────────────────────────
  if(it==='ceiling-rectangular'){
    const cH=P.cutoutHeightMm||168,cW=P.cutoutWidthMm||53
    const sc=Math.min(200/cW,80/cH,2.4), dW=Math.round(cW*sc), dH=Math.round(cH*sc)
    const cx=W/2-dW/2, cy=126
    return svg(W,H,`
      ${R(30,20,W-60,82,'#0c0c0a','rgba(201,169,110,0.07)',0.3,0)}
      ${tx(W/2,58,'CEILING VOID',9,MU)}
      ${R(cx-28,56,dW+56,30,WL,CH,0.9,2)}${tx(W/2,74,'PRE-CONSTRUCTION BRACKET',8,CH)}
      ${R(30,108,W-60,52,WL,'rgba(201,169,110,0.3)',0.7,0)}
      <rect x="30" y="108" width="${W-60}" height="52" fill="url(#hatch)"/>
      ${tx(W/2,100,'CEILING SURFACE',8,MU)}
      ${R(cx,cy,dW,dH,BG,CH,1.8,1)}
      ${dim(cx,cy+dH+26,cx+dW,cy+dH+26,`${cW}mm wide`)}
      ${dim(cx-34,cy,cx-34,cy+dH,`${cH}mm`)}
      ${tx(W/2,cy-16,`${cW}×${cH}mm CUTOUT`,10,CH)}
      ${R(cx+4,cy+4,dW-8,dH-8,'#0f0f0d',CH,1.2,1)}
      ${C(W/2,cy+dH/2,Math.min(dW*0.3,18),BG,CH,1)}${C(W/2,cy+dH/2,Math.min(dW*0.12,7),CH,BG,0.4)}
      <path d="M ${W/2-12} ${cy+12} L ${W/2} ${cy+22} L ${W/2+12} ${cy+12}" fill="none" stroke="${CH}" stroke-width="1.8" stroke-linecap="round"/>
      ${tx(W/2+dW/2+22,cy+14,'MAGNET',9,CH,'start')}${tx(W/2+dW/2+22,cy+28,'holds flush',8,MU,'start')}
      ${L(W/2,cy+dH-5,W/2,cy+dH+68,LT,1.8)}${R(W/2-14,cy+dH+66,28,18,BG,LT,0.9,2)}
      ${tx(W/2+28,cy+dH+78,'PUSH TERMINAL  (safety harness)',9,LT,'start')}
      ${tx(W/2+28,cy+dH+92,'retains speaker if magnet fails',8,MU,'start')}
      ${R(30,cy+dH+126,W-60,166,BG,'rgba(201,169,110,0.07)',0.3,3)}
      ${['①  During construction: fit pre-construction bracket in ceiling framing','②  Route cable through bracket — connect to push terminal harness','③  After finishing: cut '+cW+'×'+cH+'mm opening in ceiling','④  Connect cable to Ghost 2.0 — observe polarity','⑤  Slide Ghost into bracket at an angle — magnets pull it flush','⑥  Pull-test: safety harness must hold speaker independently'].map((s:string,i:number)=>`${tx(52,cy+dH+148+i*22,s,10,i%2===0?LT:MU,'start')}`).join('')}
      ${tx(W/2,H-10,`GHOST 2.0  ·  ${cW}×${cH}mm  ·  MAGNET + SAFETY HARNESS`,9,MU)}`)
  }

  // ── IN-WALL DOGLEG / SPRINGCLIP ─────────────────────────────────────────────
  if(it==='inwall-dogleg'||it==='inwall-springclip'){
    const cH=P.cutoutHeightMm||230,cW=P.cutoutWidthMm||328, isDog=it==='inwall-dogleg'
    const wx=68,ww=72,wh=480,wy=44, cutH=Math.min(cH*0.54,295), cutY=wy+(wh-cutH)/2, spkP=64
    return svg(W,H,`
      ${R(wx,wy,ww,wh,WL,'rgba(201,169,110,0.32)',0.7,0)}
      <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#hatch)"/>
      ${tx(wx+ww/2,wy-18,'WALL CROSS-SECTION',10,MU)}
      ${R(wx-spkP-20,wy,spkP+20,wh,'#0a0a08','rgba(201,169,110,0.04)',0.2,0)}
      ${tx(wx-spkP/2-10,wy-18,'WALL CAVITY',8,MU)}
      ${R(wx,cutY,ww,cutH,BG,CH,1,0)}
      ${L(wx,cutY,wx+ww,cutY,CH,1,'5,3')}${L(wx,cutY+cutH,wx+ww,cutY+cutH,CH,1,'5,3')}
      ${dim(wx+ww+18,cutY,wx+ww+18,cutY+cutH,`${cH}mm`,24)}
      ${tx(wx+ww+16,(cutY*2+cutH)/2+3,`${cH}mm`,9,CH,'end')}
      ${tx(wx+ww/2,cutY-20,`${cW}mm wide`,10,CH)}
      ${R(wx,cutY+10,ww,cutH-20,'#0f0f0d',CH,1.6,2)}
      ${R(wx-spkP,cutY+20,spkP,cutH-40,'#0d0d0c','rgba(201,169,110,0.16)',0.5,1)}
      ${C(wx+ww/2,wy+wh/2,Math.min(cutH*0.31,65),BG,CH,1.4)}
      ${C(wx+ww/2,wy+wh/2,Math.min(cutH*0.12,24),CH,BG,0.38)}
      ${C(wx+ww/2,wy+wh/2,Math.min(cutH*0.05,10),CH,BG,0.75)}
      ${cutH>180?C(wx+ww/2,wy+wh/2-Math.min(cutH*0.33,72),13,CH,BG,0.5):''}
      ${isDog?`
        <path d="M ${wx} ${cutY+32} L ${wx-24} ${cutY+20} L ${wx-24} ${cutY-10}" fill="none" stroke="${CH}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        ${C(wx-24,cutY-10,7,CH,BG,0.8)}
        <path d="M ${wx} ${cutY+cutH-32} L ${wx-24} ${cutY+cutH-20} L ${wx-24} ${cutY+cutH+10}" fill="none" stroke="${CH}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        ${C(wx-24,cutY+cutH+10,7,CH,BG,0.8)}
        ${tx(wx-32,cutY+8,'DOG-LEG',8,CH,'end')}${tx(wx-32,cutY+19,'CLIP',8,CH,'end')}
        ${tx(wx-32,cutY+cutH+16,'DOG-LEG',8,CH,'end')}${tx(wx-32,cutY+cutH+27,'CLIP',8,CH,'end')}
      `:`
        <path d="M ${wx} ${cutY+24} Q ${wx-26} ${cutY+36} ${wx-24} ${cutY+54} Q ${wx-22} ${cutY+72} ${wx} ${cutY+80}" fill="none" stroke="${CH}" stroke-width="3" stroke-linecap="round"/>
        <path d="M ${wx} ${cutY+cutH-24} Q ${wx-26} ${cutY+cutH-36} ${wx-24} ${cutY+cutH-54} Q ${wx-22} ${cutY+cutH-72} ${wx} ${cutY+cutH-80}" fill="none" stroke="${CH}" stroke-width="3" stroke-linecap="round"/>
        ${tx(wx-32,cutY+cutH/2-12,'SPRING',8,CH,'end')}${tx(wx-32,cutY+cutH/2+2,'CLIPS',8,CH,'end')}${tx(wx-32,cutY+cutH/2+17,'auto-expand',7,MU,'end')}
      `}
      ${R(wx-spkP+10,wy+wh/2-20,28,40,BG,LT,1,2)}
      ${C(wx-spkP+19,wy+wh/2-6,6,CH,BG,0.6)}${C(wx-spkP+29,wy+wh/2-6,6,BG,LT,0.6)}
      ${tx(wx-spkP+19,wy+wh/2+10,'+',9,CH,'middle')}${tx(wx-spkP+29,wy+wh/2+10,'−',9,LT,'middle')}
      ${tx(wx-spkP+24,wy+wh/2+26,'TERM.',7,MU,'middle')}
      ${L(wx-spkP+6,wy+wh/2,wx-spkP-22,wy+wh/2,CH,1.2,'4,3')}${tx(wx-spkP-26,wy+wh/2+16,'TO AMP',8,MU,'end')}
      ${tx(wx+ww+22,wy+wh/2,'ROOM SIDE',10,MU,'start')}
      ${R(wx+ww+4,cutY+6,10,cutH-12,'rgba(238,235,229,0.03)',LT,0.6,1)}
      ${tx(wx+ww+32,cutY+cutH/2,'GRILLE',8,LT,'start')}${tx(wx+ww+32,cutY+cutH/2+14,'(paintable)',7,MU,'start')}
      ${R(220,444,W-250,104,BG,'rgba(201,169,110,0.07)',0.3,3)}
      ${['① Mark cutout — check for pipes / studs','② Cut opening with drywall saw','③ Route cable — 200mm slack','④ Connect (observe polarity)','⑤ '+(isDog?'Insert, tighten dog-legs evenly':'Insert — spring clips auto-expand')].map((s:string,i:number)=>`${tx(236,464+i*18,s,10,i===0||i===2?LT:MU,'start')}`).join('')}
      ${tx(W/2,H-10,`${isDog?'DOG-LEG':'SPRING CLIP'} IN-WALL  ·  CUTOUT ${cW}×${cH}mm`,9,MU)}`)
  }

  // ── IN-WALL SUB ─────────────────────────────────────────────────────────────
  if(it==='inwall-sub'){
    const cH=P.cutoutHeightMm||365,cW=P.cutoutWidthMm||225
    const sc=Math.min(120/cW,130/cH), dW=Math.round(cW*sc), dH=Math.round(cH*sc)
    const wx=62,ww=70,wh=480,wy=44,cy=78-dH/2
    return svg(W,H,`
      ${R(wx,wy,ww,wh,WL,'rgba(201,169,110,0.32)',0.7,0)}
      <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#hatch)"/>
      ${tx(wx+ww/2,wy-18,'WALL CROSS-SECTION',10,MU)}
      ${R(wx,cy,ww,dH,BG,CH,0.9,0)}
      ${R(wx-2,cy+7,dW+4,dH-14,WL,CH,1.6,2)}
      ${C(wx+dW/2+2,78,Math.min(dH*0.4,46),BG,CH,1.4)}
      ${C(wx+dW/2+2,78,Math.min(dH*0.4,46)*0.56,WL,CH,0.7)}
      ${C(wx+dW/2+2,78,Math.min(dH*0.4,46)*0.22,CH,BG,0.5)}
      ${R(wx+dW+7,cy+7,10,dH-14,WL,LT,0.6,1)}${tx(wx+dW+24,78,'GRILLE',8,LT,'start')}
      ${C(wx+7,cy+18,6,BG,CH,0.8)}${C(wx+7,cy+dH-18,6,BG,CH,0.8)}
      ${tx(wx+2,cy+14,'FLANGE',7,MU,'end')}${tx(wx+2,cy+dH-14,'SCREW',7,MU,'end')}
      ${dim(wx+dW+28,cy,wx+dW+28,cy+dH,`${cH}mm`,24)}
      ${tx(wx+dW+26,(cy*2+dH)/2+3,`${cH}mm`,9,CH,'end')}
      ${tx(wx+dW/2+2,cy-18,`${cW}mm wide`,10,CH)}
      ${tx(W/2,H-10,`IN-WALL SUBWOOFER  ·  ${cW}×${cH}mm CUTOUT`,9,MU)}`)
  }

  // ── BANYAN ──────────────────────────────────────────────────────────────────
  if(it==='banyan-canopy'||it==='banyan-pith'){
    return svg(W,H,`
      ${R(125,286,230,178,WL,CH,1.8,6)}${tx(240,324,'BANYAN PITH',11,CH)}${tx(240,343,'Dual 12" Powered Sub + DSP',9,MU)}
      ${[0,1,2,3].map((i:number)=>`${R(144+i*48,358,38,10,BG,CH,0.3,1)}`).join('')}
      ${R(170,272,140,16,BG,CH,0.8,1)}${tx(240,265,'TOP SOCKET',8,MU)}
      ${R(218,242,44,32,CH,BG,0.6,3)}${tx(240,262,'SPKN',8,BG)}
      ${tx(240,236,'SPEAKON CABLE',8,CH)}
      ${R(148,56,184,186,WL,CH,1.8,5)}${tx(240,38,'BANYAN CANOPY',12,CH)}${tx(240,24,'Wide-Dispersion Line Array',8,MU)}
      ${[0,1,2,3,4].map((i:number)=>`${C(240,76+i*32,12,CH,BG,0.38)}`).join('')}
      ${R(26,88,116,96,BG,'rgba(201,169,110,0.11)',0.3,2)}
      ${tx(84,106,'ALSO MOUNTS:',9,CH)}${tx(84,120,'· Pole mount',9,MU,'start')}${tx(84,134,'· Wall mount',9,MU,'start')}${tx(84,148,'· Hanging',9,MU,'start')}
      ${R(26,420,W-52,124,BG,'rgba(201,169,110,0.07)',0.3,3)}
      ${['①  Seat Canopy into Pith top socket until locked','②  Connect Speakon cable: Pith output → Canopy input','③  Connect source to Pith Line In (XLR or RCA)','④  Load factory DSP preset via USB + SigmaStudio','⑤  Power on — LED illuminates when ready'].map((s:string,i:number)=>`${tx(50,442+i*22,s,10,i%2===0?LT:MU,'start')}`).join('')}
      ${tx(W/2,H-10,'BANYAN  ·  CANOPY + PITH ASSEMBLY',9,MU)}`)
  }

  // ── SPIREA ──────────────────────────────────────────────────────────────────
  if(it==='spirea'){
    return svg(W,H,`
      ${L(W/2,0,W/2,H,'rgba(201,169,110,0.1)',0.6,'7,4')}
      ${tx(W/4,22,'HANGING MOUNT',11,CH)}${tx(W/4*3,22,'SPIKE MOUNT',11,CH)}
      ${R(28,35,196,18,WL,'rgba(201,169,110,0.24)',0.6,0)}${tx(126,28,'PERGOLA BEAM / JOIST',8,MU)}
      ${L(126,53,126,96,LT,1.4,'3,2')}
      <ellipse cx="126" cy="107" rx="14" ry="19" fill="${BG}" stroke="${CH}" stroke-width="2"/>
      <line x1="116" y1="100" x2="136" y2="100" stroke="${BG}" stroke-width="4"/>
      ${tx(152,107,'CARABINER',9,CH,'start')}
      ${L(126,126,126,164,LT,1.4)}
      ${C(126,197,40,WL,CH,2)}${C(126,197,17,CH,BG,0.45)}${C(126,197,7,CH,BG,0.85)}
      ${tx(126,255,'SPIREA',10,LT)}${L(166,197,214,197,CH,1.2,'4,3')}${tx(218,203,'TO AMP',8,MU,'start')}
      ${R(W/2+18,398,190,86,WL,'rgba(201,169,110,0.14)',0.5,0)}<rect x="${W/2+18}" y="398" width="190" height="86" fill="url(#hatch)"/>
      ${tx(W/2+114,387,'SOIL / GROUND',8,MU)}
      ${L(W/2+114,158,W/2+114,398,LT,3.5)}
      <polygon points="${W/2+102},394 ${W/2+126},394 ${W/2+114},418" fill="${CH}"/>
      ${tx(W/2+154,296,'SPIKE',9,CH,'start')}${tx(W/2+154,311,'(mallet if hard ground)',8,MU,'start')}
      ${C(W/2+114,126,40,WL,CH,2)}${C(W/2+114,126,17,CH,BG,0.45)}${C(W/2+114,126,7,CH,BG,0.85)}
      ${tx(W/2+114,184,'SPIREA',10,LT)}
      ${L(W/2+74,126,W/2+50,126,CH,1.2,'4,3')}${tx(W/2+46,132,'TO AMP',8,MU,'end')}
      ${dim(W/2+62,158,W/2+62,398,'400–600mm',28)}
      ${R(28,476,W-56,78,BG,'rgba(201,169,110,0.07)',0.3,3)}
      ${tx(52,498,'①  Hanging: clip carabiner to anchor — attach Spirea loop',10,LT,'start')}
      ${tx(52,518,'②  Spike: push into soil 400–600mm height (mallet if needed)',10,MU,'start')}
      ${tx(52,538,'③  Route cable to terminal — observe polarity',10,LT,'start')}
      ${tx(W/2,H-10,'SPIREA  ·  HANGING OR SPIKE MOUNT',9,MU)}`)
  }

  // ── POWERED / PASSIVE SUB ───────────────────────────────────────────────────
  if(it==='powered-sub'||it==='passive-sub'){
    const pw=it==='powered-sub'
    return svg(W,H,`
      ${R(76,30,328,292,WL,CH,1.8,7)}
      ${C(W/2,188,116,BG,CH,1.4)}${C(W/2,188,88,WL,CH,0.7)}${C(W/2,188,57,BG,CH,1)}${C(W/2,188,30,CH,BG,0.42)}${C(W/2,188,13,CH,BG,0.75)}
      ${corm(W/2,48,P.productName||'SUBWOOFER',15,LT)}
      ${[-118,-60,0,60,118].map((ox:number)=>`${C(W/2+ox,326,10,CH,BG,0.45)}`).join('')}
      ${R(76,358,328,196,'#0c0c0a',CH,0.8,3)}${tx(W/2,376,'REAR PANEL',9,MU)}
      ${pw?`${C(125,418,17,BG,CH,1.6)}${C(125,418,7,CH,BG,0.55)}
      ${tx(125,447,'LFE / LINE IN',9,CH)}${tx(125,461,'(RCA)',8,MU)}
      ${C(190,418,12,BG,LT,0.9)}${C(208,418,12,BG,LT,0.9)}${tx(190,447,'+',10,CH)}${tx(208,447,'−',10,LT)}${tx(199,461,'HIGH LEVEL',8,MU)}
      ${C(280,418,18,BG,CH,0.8)}${L(280,418,280,401,CH,1.8)}${tx(280,447,'X-OVER',9,CH)}
      ${R(328,408,40,22,BG,LT,0.7,2)}${tx(348,447,'PHASE',9,LT)}${tx(348,461,'0°/180°',8,MU)}
      ${R(375,407,26,24,BG,LT,0.6,1)}${tx(388,447,'IEC',8,LT)}`
      :`${C(185,418,16,CH,BG,0.55)}${C(240,418,16,BG,CH,1)}${tx(185,447,'+',12,CH)}${tx(240,447,'−',12,LT)}${tx(213,461,'BINDING POSTS',9,LT)}${tx(213,475,'14 AWG or thinner',8,MU)}`}
      ${R(28,418,40,44,BG,'rgba(201,169,110,0.14)',0.3,2)}${L(28,418,28,462,'rgba(201,169,110,0.4)',1)}${L(28,418,68,418,'rgba(201,169,110,0.4)',1)}${C(48,440,11,CH,BG,0.45)}
      ${tx(48,472,'CORNER',7,CH)}${tx(48,482,'= more bass',6,MU)}
      ${tx(W/2,H-10,pw?'POWERED SUBWOOFER  ·  LFE SIGNAL IN':'PASSIVE SUBWOOFER  ·  SPEAKER WIRE IN',9,MU)}`)
  }

  // ── DSP AMPLIFIER ───────────────────────────────────────────────────────────
  if(it==='dsp-amplifier'){
    const ch=P.channelCount||4, chW=Math.min(300/ch,70)
    const isLR=(P.productName||'').toLowerCase().includes('lucifer')||(P.productName||'').toLowerCase().includes('root')
    return svg(W,H,`
      ${R(20,56,30,210,WL,'rgba(201,169,110,0.18)',0.5,2)}${R(W-50,56,30,210,WL,'rgba(201,169,110,0.18)',0.5,2)}
      ${[76,96,116,136,156,176,196,216,236,256].map((y:number)=>`${C(35,y,4,BG,CH,0.4)}${C(W-35,y,4,BG,CH,0.4)}`).join('')}
      ${R(50,50,W-100,216,WL,CH,1.6,2)}
      ${Array.from({length:ch},(_:unknown,i:number)=>{const sx=62+i*chW;return `${R(sx,62,chW-10,146,BG,'rgba(201,169,110,0.11)',0.4,2)}
      ${[0,1,2,3,4].map((b:number)=>`${R(sx+5,74+b*11,chW-22,7,`rgba(201,169,110,${0.16+b*0.13})`,BG,0.2,1)}`).join('')}
      ${C(sx+chW/2-5,158,12,'#181816',CH,1)}${L(sx+chW/2-5,158,sx+chW/2-5,147,CH,1.8)}
      ${tx(sx+chW/2-5,184,`CH${i+1}`,9,LT,'middle')}${tx(sx+chW/2-5,197,'GAIN',7,MU,'middle')}`}).join('')}
      ${R(W-118,72,50,22,BG,CH,0.8,1)}${tx(W-93,87,'USB / DSP',8,CH,'middle')}
      ${C(W-74,172,9,CH,BG,0.45)}${tx(W-74,196,'PWR',7,MU,'middle')}
      ${R(50,286,W-100,205,'#0c0c0a',CH,0.8,2)}${tx(W/2,303,'REAR PANEL',9,MU)}
      ${tx(W/2,319,'XLR INPUTS',8,CH)}
      ${Array.from({length:Math.min(ch,4)},(_:unknown,i:number)=>{const ix=72+i*(Math.min(ch,4)>2?88:120);return `${C(ix,346,19,BG,CH,1.3)}${C(ix,346,8,CH,BG,0.32)}${tx(ix-7,351,'1',5,MU,'middle')}${tx(ix+2,342,'2',5,LT,'middle')}${tx(ix+6,352,'3',5,MU,'middle')}${tx(ix,374,`IN ${i+1}`,9,CH,'middle')}${tx(ix,387,'XLR',7,MU,'middle')}`}).join('')}
      ${tx(W-168,319,'OUTPUTS',8,LT)}
      ${Array.from({length:Math.min(ch,4)},(_:unknown,i:number)=>{const ox=W-162+(i-Math.min(ch,4)/2)*82+41;return `${R(ox-18,328,36,26,BG,LT,1,3)}${tx(ox,362,`OUT ${i+1}`,9,LT,'middle')}${tx(ox,377,isLR?'SPKN':'+  −',8,MU,'middle')}`}).join('')}
      ${isLR?`${R(28,410,W-56,90,BG,'rgba(201,169,110,0.11)',0.3,3)}${tx(W/2,430,'BRIDGE WIRING:  CH1(+) and CH2(−) = 1 mono channel',10,LT)}${tx(W/2,450,'CH3(+) and CH4(−) = 2nd mono channel',10,LT)}${tx(W/2,470,'XLR: Pin 1=GND  ·  Pin 2=Hot(+)  ·  Pin 3=Cold(−)',9,MU)}`:
      `${R(28,410,W-56,72,BG,'rgba(201,169,110,0.07)',0.3,3)}${tx(W/2,432,'Connect all speakers before powering on.',10,LT)}${tx(W/2,452,'Load XSCACE factory DSP preset via USB.',10,LT)}${tx(W/2,468,'Adjust crossover, delay, EQ for your room.',9,MU)}`}
      ${corm(W/2,36,P.productName||'DSP AMPLIFIER',18,LT)}
      ${tx(W/2,H-10,`${ch}-CH DSP AMPLIFIER  ·  XLR IN  ·  SPEAKON OUT`,9,MU)}`)
  }

  // ── STREAMING AMP / STREAMER ─────────────────────────────────────────────────
  if(it==='streaming-amplifier'||it==='streamer'){
    const isA=it==='streaming-amplifier'
    return svg(W,H,`
      ${R(86,56,308,122,WL,CH,1.6,6)}${corm(240,106,P.productName||'',22,LT)}${tx(240,128,'AirPlay 2  ·  BT 5.0  ·  Spotify Connect',9,MU)}
      ${C(106,116,7,CH,BG,0.55)}${tx(106,132,'STATUS',6,CH)}
      ${[32,23,14].map((r:number,i:number)=>`<path d="M ${240-r} ${80+r*0.5} A ${r} ${r} 0 0 1 ${240+r} ${80+r*0.5}" fill="none" stroke="${CH}" stroke-width="${1.3-i*0.2}" stroke-linecap="round" opacity="${0.95-i*0.2}"/>`).join('')}
      ${C(240,90,5,CH,BG,0.32)}
      ${R(26,96,56,94,WL,CH,1.1,6)}${R(32,107,44,68,BG,'rgba(201,169,110,0.17)',0.3,2)}${C(54,182,5,CH,BG,0.35)}
      ${tx(54,120,'XSCACE',8,CH,'middle')}${tx(54,131,'CONTROLLER',6,MU,'middle')}${tx(54,147,'App Store',7,LT,'middle')}${tx(54,159,'Google Play',7,LT,'middle')}
      ${L(82,146,90,126,CH,0.7,'2,2')}
      ${R(86,202,308,172,'#0c0c0a',CH,0.7,3)}${tx(240,218,'REAR PANEL',9,MU)}
      ${isA?`${C(124,254,15,CH,BG,0.55)}${C(148,254,15,BG,CH,0.9)}${tx(124,280,'+',11,CH)}${tx(148,280,'−',11,LT)}${tx(136,294,'SPK L',8,LT,'middle')}
      ${C(194,254,15,CH,BG,0.55)}${C(218,254,15,BG,CH,0.9)}${tx(194,280,'+',11,CH)}${tx(218,280,'−',11,LT)}${tx(206,294,'SPK R',8,LT,'middle')}
      ${C(272,254,13,BG,CH,0.8)}${C(272,254,5,CH,BG,0.35)}${tx(272,280,'SUB',8,CH)}${tx(272,294,'OUT',7,MU,'middle')}
      ${C(326,254,13,BG,LT,0.7)}${tx(326,280,'DC',8,LT)}${tx(326,294,'24V',7,MU,'middle')}
      ${C(366,254,11,BG,LT,0.6)}${tx(366,280,'OPT',7,LT)}`
      :`${C(146,254,14,BG,CH,0.9)}${C(146,254,5,CH,BG,0.4)}${tx(146,280,'LINE OUT',8,CH)}${tx(146,294,'RCA',7,MU,'middle')}
      ${C(208,254,12,BG,LT,0.7)}${tx(208,280,'SPDIF',7,LT)}${R(244,244,40,22,BG,LT,0.6,1)}${tx(264,280,'HDMI ARC',7,LT)}
      ${C(328,254,12,BG,LT,0.6)}${tx(328,280,'DC 19V',7,LT)}`}
      ${R(26,396,W-52,148,BG,'rgba(201,169,110,0.07)',0.3,3)}
      ${(isA?['①  Connect speakers to + / − terminals','②  Optionally connect sub to SUB OUT','③  Plug DC adapter — power on','④  Download XSCACE Controller app','⑤  Follow in-app Wi-Fi setup wizard','⑥  Stream via AirPlay / Spotify / BT']:['①  Connect Line Out (RCA) to amplifier','②  Plug DC 19V adapter — power on','③  Download XSCACE Controller app','④  Follow in-app Wi-Fi setup wizard','⑤  Select Air Mini as output in your streaming app']).map((s:string,i:number)=>`${tx(50,418+i*22,s,10,i%2===0?LT:MU,'start')}`).join('')}
      ${tx(W/2,H-10,isA?'AIR AMP  ·  STREAMING AMPLIFIER':'AIR MINI  ·  WIRELESS STREAMER',9,MU)}`)
  }

  return svg(W,H,`${tx(W/2,H/2,'DIAGRAM N/A',10,MU)}`)
}

// ══════════════════════════════════════════════════════════════════════════════
// STEREO POSITIONING DIAGRAM — fills right half of page 3 (480×570)
// ══════════════════════════════════════════════════════════════════════════════
function stereoDiagram(P:any):string {
  const it=P.installationType||'', W=480, H=570

  // WALL MOUNT — elevation view, speakers on wall, MLP chair, straight projection
  if(['keyhole-wall','bracket-wall'].includes(it)){
    return svg(W,H,`
      ${L(20,178,W-20,178,'rgba(201,169,110,0.18)',0.7,'9,5')}
      ${tx(28,173,'EAR HEIGHT 1.0–1.2m',9,MU,'start')}
      ${R(20,28,W-40,20,WL,'rgba(201,169,110,0.22)',0.6,0)}
      ${tx(W/2,20,'FRONT WALL',9,MU)}
      ${L(20,490,W-20,490,'rgba(201,169,110,0.18)',0.6)}${tx(W/2,504,'FLOOR',9,MU)}

      <!-- SPK L -->
      ${R(58,46,22,96,WL,CH,1.8,3)}
      ${C(69,76,8,CH,BG,0.5)}
      ${C(69,108,14,BG,CH,1.4)}${C(69,108,6,CH,BG,0.44)}
      ${tx(69,32,'L',14,CH)}

      <!-- SPK R -->
      ${R(W-80,46,22,96,WL,CH,1.8,3)}
      ${C(W-69,76,8,CH,BG,0.5)}
      ${C(W-69,108,14,BG,CH,1.4)}${C(W-69,108,6,CH,BG,0.44)}
      ${tx(W-69,32,'R',14,CH)}

      <!-- MLP listener icon -->
      ${C(W/2,396,22,BG,CH,1.4)}
      <path d="M ${W/2-28} ${418} Q ${W/2-20} ${452} ${W/2} ${455} Q ${W/2+20} ${452} ${W/2+28} ${418}" fill="none" stroke="${CH}" stroke-width="1.4"/>
      ${tx(W/2,474,'MLP',12,CH)}${tx(W/2,490,'Main Listening Position',9,MU)}

      <!-- Straight sound projection lines (no toe-in) -->
      ${L(69,142,W/2-20,396,CH,0.9,'6,3')}
      ${L(W-69,142,W/2+20,396,CH,0.9,'6,3')}

      <!-- Centre line -->
      ${L(W/2,28,W/2,490,'#2a2a28',0.5,'8,5')}
      ${tx(W/2+8,44,'CENTRE',6,DIM_C,'start')}

      <!-- Height from floor dim -->
      ${L(30,178,30,490,CH,0.6,'3,2')}${L(24,178,36,178,CH,0.6)}${L(24,490,36,490,CH,0.6)}
      ${tx(26,337,'1.0–',9,CH,'end')}${tx(26,350,'1.2m',9,CH,'end')}

      <!-- Speaker spacing dim -->
      ${dim(69,240,W-69,240,'~1/3 room width from each side wall')}

      <!-- Listener distance dim -->
      ${L(W-24,178,W-24,396,CH,0.6,'3,2')}${L(W-30,178,W-18,178,CH,0.6)}${L(W-30,396,W-18,396,CH,0.6)}
      ${tx(W-18,290,'2–4m',9,CH,'start')}${tx(W-18,305,'listener',8,MU,'start')}

      <!-- Key note -->
      ${R(108,276,264,44,BG,'rgba(201,169,110,0.07)',0.3,3)}
      ${tx(W/2,295,'Speakers face directly forward.',10,LT)}
      ${tx(W/2,312,'No angling — wide dispersion covers the MLP.',9,MU)}

      ${tx(W/2,H-10,'STEREO POSITIONING  ·  ELEVATION VIEW',9,MU)}`)
  }

  // IN-CEILING / IN-WALL — top-down plan
  if(['ceiling-circular','ceiling-rectangular','inwall-dogleg','inwall-springclip'].includes(it)){
    return svg(W,H,`
      ${R(28,28,W-56,H-70,WL,'rgba(201,169,110,0.18)',0.8,4)}
      ${tx(W/2,18,'TOP-DOWN ROOM VIEW',9,MU)}
      ${R(28,28,W-56,18,WL,'rgba(201,169,110,0.38)',0.7,0)}${tx(W/2,44,'FRONT WALL',9,MU)}

      <!-- SPK L circle (viewed from above) -->
      ${C(W*0.26,108,24,BG,CH,1.8)}${C(W*0.26,108,11,CH,BG,0.45)}
      ${tx(W*0.26,78,'L',14,CH)}

      <!-- SPK R circle -->
      ${C(W*0.74,108,24,BG,CH,1.8)}${C(W*0.74,108,11,CH,BG,0.45)}
      ${tx(W*0.74,78,'R',14,CH)}

      <!-- Coverage lines to MLP -->
      ${L(W*0.26,132,W*0.36,H-188,CH,0.8,'5,3')}
      ${L(W*0.26,132,W*0.52,H-188,CH,0.8,'5,3')}
      ${L(W*0.74,132,W*0.64,H-188,CH,0.8,'5,3')}
      ${L(W*0.74,132,W*0.48,H-188,CH,0.8,'5,3')}

      <!-- Centre line -->
      ${L(W/2,28,W/2,H-70,'#2a2a28',0.5,'8,5')}

      <!-- MLP sofa -->
      ${R(W*0.32,H-246,W*0.36,82,'rgba(201,169,110,0.07)',CH,1,5)}
      ${tx(W/2,H-200,'MLP',12,CH)}${tx(W/2,H-185,'SOFA',9,MU)}

      <!-- Spacing dim -->
      ${dim(W*0.26,162,W*0.74,162,'≈ 60% of listener distance')}

      <!-- Listener distance -->
      ${L(W-22,108,W-22,H-210,CH,0.6,'3,2')}${L(W-28,108,W-16,108,CH,0.6)}${L(W-28,H-210,W-16,H-210,CH,0.6)}
      ${tx(W-14,H/2+10,'2–4m',9,CH,'start')}

      <!-- Height note -->
      ${R(28,H-178,160,64,BG,'rgba(201,169,110,0.09)',0.3,2)}
      ${tx(36,H-160,'HEIGHT:',8,CH,'start')}${tx(36,H-146,'In-wall: 1.0–1.2m',8,LT,'start')}${tx(36,H-132,'In-ceil: ceiling height',8,LT,'start')}

      <!-- Equal distance note -->
      ${R(W*0.3-8,204,220,40,BG,'rgba(201,169,110,0.06)',0.2,2)}
      ${tx(W/2,220,'Both speakers must be EXACTLY',9,LT)}${tx(W/2,234,'equidistant from the MLP.',9,MU)}

      ${tx(W/2,H-10,'STEREO POSITIONING  ·  PLAN VIEW (TOP-DOWN)',9,MU)}`)
  }

  // SPIREA outdoor
  if(it==='spirea'){
    return svg(W,H,`
      ${R(28,28,W-56,H-70,WL,'rgba(201,169,110,0.1)',0.5,4)}
      ${tx(W/2,18,'TOP-DOWN  ·  GARDEN / LANDSCAPE',9,MU)}
      ${R(W*0.38,28,W*0.24,H-70,'rgba(201,169,110,0.03)','rgba(201,169,110,0.07)',0.3,0)}${tx(W/2,H/2,'PATH',9,MU)}
      ${[70,165,260,355].map((y:number)=>`${C(W*0.3,y,15,WL,CH,1.2)}${C(W*0.3,y,6,CH,BG,0.5)}${C(W*0.7,y,15,WL,CH,1.2)}${C(W*0.7,y,6,CH,BG,0.5)}`).join('')}
      ${dim(W*0.3,70,W*0.3,165,'4–6m',30)}
      ${tx(W/2,H-24,'Space every 4–6m for even coverage',10,LT)}${tx(W/2,H-10,'Aim driver face toward seating area',9,MU)}`)
  }

  // Amps/subs/streamers — system diagram
  return svg(W,H,`
    ${C(100,H/2,44,WL,CH,1.4)}${tx(100,H/2+5,'SOURCE',10,CH)}
    ${L(144,H/2,200,H/2,CH,1.8)}
    ${R(200,H/2-42,160,84,WL,CH,1.6,5)}
    ${tx(280,H/2-10,it.includes('amplifier')?'AMPLIFIER':'DEVICE',10,LT)}
    ${tx(280,H/2+12,it.includes('dsp')||it.includes('amplifier')?'+ SPEAKERS':'→ AMPLIFIER',9,MU)}
    ${L(360,H/2,W-90,H/2,CH,1.8)}
    ${C(W-90,H/2,44,WL,CH,1.4)}${tx(W-90,H/2+5,'SYSTEM',10,LT)}
    ${tx(W/2,H-16,'SYSTEM CONNECTION OVERVIEW',9,MU)}`)
}

// ── POSITIONING ADVICE (text) ─────────────────────────────────────────────────
function stereoAdvice(P:any):{title:string,steps:string[],note:string}{
  const it=P.installationType||'', name=P.productName||'speaker'
  if(['ceiling-circular','ceiling-rectangular','inwall-springclip','inwall-dogleg'].includes(it)) return {
    title:'Speaker Positioning',
    steps:[
      'Identify your Main Listening Position (MLP) — the primary seat from which you will listen.',
      'For stereo: position both speakers symmetrically on either side of the room centreline.',
      'Spacing: approximately 60% of the listener distance. If the MLP is 3m from the speaker plane, space speakers 1.8m apart.',
      `In-wall: mount at ear level when seated — 1.0–1.2m from the floor. In-ceiling: install at ceiling height.`,
      'Both speakers must be exactly equidistant from the MLP. Use a tape measure — even 5cm of asymmetry is audible.',
      'For cinema LCR / surround, use the XSCACE Configurator for full channel layout.',
    ],
    note:`${P.minSpeakerSpacing?`Min spacing: ${P.minSpeakerSpacing}. `:''}Speakers face directly forward — no angling required.`,
  }
  if(['keyhole-wall','bracket-wall'].includes(it)) return {
    title:'Speaker Positioning',
    steps:[
      'Identify your Main Listening Position (MLP) — the primary seat or sofa.',
      'Mount speakers at ear height when seated — approximately 1.0–1.2m from the floor, on the left and right walls.',
      'Horizontal spacing: approximately one-third of the room width from each side wall. In a 5m wide room, that is ~1.7m from each side wall.',
      'Listener distance: 2–4m from the speakers for optimal stereo imaging. Closer gives more precision; further is more spacious.',
      `The ${name} is designed with wide horizontal dispersion — speakers face directly forward. No angling is required.`,
      'Confirm both speakers are exactly equidistant from the MLP with a tape measure.',
    ],
    note:`${P.minSpeakerSpacing?`Min spacing: ${P.minSpeakerSpacing}. `:''}${P.minRiggingHeight?`Min height: ${P.minRiggingHeight}.`:''}`,
  }
  if(['banyan-canopy','banyan-pith'].includes(it)) return {
    title:'Positioning',
    steps:['The Banyan Canopy installs above or forward of the MLP.','For stereo: two Canopy units, symmetrically on either side of the room centreline.','Wide 120° horizontal dispersion — focus on equal distance from MLP, not precise aiming.','Pith DSP manages crossover and EQ automatically.'],
    note:'Max Speakon cable run Pith to Canopy: 10m.',
  }
  if(it==='spirea') return {
    title:'Landscape Positioning',
    steps:['For path coverage: every 4–6m for even distribution.','For seating areas: two units symmetrically at the perimeter, aimed inward.','Aim driver face toward the primary listening zone.','Minimum 1.5m from nearest seat to avoid nearfield bass.'],
    note:'Use outdoor-rated direct-burial cable for in-ground runs.',
  }
  return {
    title:'Placement',
    steps:['Place near the main system rack with easy access to power and signal connections.','Ensure adequate ventilation — do not enclose without airflow.','Keep signal cables away from power cables to minimise interference.'],
    note:'Sub placement: corner positions reinforce bass. "Sub crawl" technique: place sub at MLP, walk the room until bass sounds most even — that is the ideal position.',
  }
}

// ── TOOLS ─────────────────────────────────────────────────────────────────────
function toolsNeeded(it:string):string[]{
  const b=['Pencil / marker','Spirit level','Tape measure','Cable stripper / cutters']
  const d=['Power drill + 6mm bits','Screwdriver (Phillips + flat)']
  const m:Record<string,string[]>={
    'keyhole-wall':[...b,...d,'Wall plugs / anchors'],
    'bracket-wall':[...b,...d,'Wall plugs / anchors'],
    'ceiling-circular':[...b,...d,'Hole saw (cutout diameter)','Stud finder'],
    'ceiling-rectangular':[...b,...d,'Drywall saw / jigsaw','Stud finder'],
    'inwall-dogleg':[...b,...d,'Drywall saw / jigsaw','Stud finder'],
    'inwall-springclip':[...b,...d,'Drywall saw / jigsaw','Stud finder'],
    'inwall-sub':[...b,...d,'Drywall saw / jigsaw','Stud finder'],
    'banyan-canopy':[...b,'Speakon cable (included)','Allen key set'],
    'banyan-pith':[...b,'Speakon cable (to Canopy)','Power outlet access'],
    'spirea':[...b,'Rubber mallet (spike)','Carabiner (hanging)'],
    'powered-sub':[...b,'XLR / RCA cable','Power outlet access'],
    'passive-sub':[...b,'Speaker wire (14 AWG min)'],
    'dsp-amplifier':[...b,'XLR cables','Speakon / speaker wire','Laptop (DSP software)','Rack screws if rack mounting'],
    'streaming-amplifier':[...b,'Smartphone — XSCACE Controller app','Wi-Fi (2.4 or 5GHz)'],
    'streamer':[...b,'Smartphone — XSCACE Controller app','Wi-Fi (2.4 or 5GHz)'],
  }
  return m[it]||b
}

// ── INSTALL STEPS ─────────────────────────────────────────────────────────────
function installSteps(P:any):string[]{
  const it=P.installationType||''
  const spc=P.screwSpacingMm?`${P.screwSpacingMm}mm`:'as per template'
  const scr=P.screwSize||'supplied screw'
  const ch=P.cutoutHeightMm?`${P.cutoutHeightMm}mm`:''
  const cw=P.cutoutWidthMm?`${P.cutoutWidthMm}mm`:''
  const cd=P.cutoutDiameterMm?`${P.cutoutDiameterMm}mm`:''
  const cav=P.requiredCavityDepthMm?`${P.requiredCavityDepthMm}mm minimum`:'sufficient'
  const wire=P.wireGaugeRecommended||'14 AWG'
  const conn=P.speakerWireConnector||'push terminal'
  const name=P.productName||'speaker'

  if(it==='keyhole-wall'){
    const isQ=(P.mountingMethods||'').toLowerCase().includes('corner'), isQC=name.toLowerCase().includes('quad')
    return [`Use the included screw template to mark two screw points ${spc} apart centre-to-centre. Confirm level with a spirit level.`,
      `Drill two 6mm holes at the marked positions. Insert the supplied wall plugs fully into each hole.`,
      `Drive a ${scr} into each plug. Leave the screw head proud of the wall surface by 5–7mm — this is the gap the keyhole slots engage with.`,
      `Route speaker cable (${wire}) to the mounting point, leaving 150mm exposed. Strip 10mm of insulation and connect to the ${conn} on the back of the ${name}. Observe polarity: + (red) to positive, − (black) to negative.`,
      `Align the keyhole slots on the rear of the ${name} with the two screw heads. Lower the speaker downward until it seats firmly and cannot be lifted without tilting.`,
      isQ?(isQC?`Corner mount option: QuadCane corner bracket is two-piece — place each piece exactly ${spc} apart on adjacent walls. Hang the QuadCane across both pieces simultaneously.`:`Corner mount option: screw corner bracket into the corner between two adjacent walls. Hang the speaker on the bracket keyhole slot.`):`The included double-sided tape strip on the rear of the speaker provides additional grip against the wall if required.`
    ].filter(Boolean)
  }
  if(it==='bracket-wall') return [
    `Mark the two screw points ${spc} apart using the included template. Confirm level with a spirit level.`,
    `Drill 6mm holes. Insert wall plugs and drive ${scr} screws fully home.`,
    `Attach the rear bracket to the back of the ${name} using the supplied hardware. Tighten all bracket bolts.`,
    `Route speaker cable (${wire}) — leave 150mm exposed, strip 10mm, connect to terminals. Observe polarity.`,
    `Hold the bracket to the wall, align with the screws, and secure firmly. This joint carries full dynamic load at high output.`,
    `Check level. Route and dress the cable run neatly with cable clips or surface conduit.`,
  ]
  if(it==='ceiling-circular') return [
    `Mark the cutout position using the included circular template. Use a stud finder — confirm no joists are within the cutout area.`,
    `Confirm at least ${cav} of void depth above the ceiling surface at this location.`,
    `Cut the circular hole (${cd}) using a hole saw. Work slowly and support the cut piece from below.`,
    `Route speaker cable (${wire}) through the ceiling void to the cutout. Leave 200mm hanging through the hole.`,
    `Strip 10mm from each wire end. Connect to the speaker terminal block — observe polarity (+ and −).`,
    `Tilt the ${name} slightly to fit it through the cutout at an angle, then straighten so it sits flush against the ceiling.`,
    `Tighten the dog-leg clip screws using the built-in screw heads. As each screw turns, the clip arm rotates behind the ceiling board and clamps the speaker. Tighten evenly — do not overtighten or the board may crack.`,
    `Snap the grille on. Aspen/Aster grilles are paintable — prime and paint before fitting if desired.`,
  ]
  if(it==='ceiling-rectangular') return [
    `During construction (before plasterboard): position and secure the pre-construction spring bracket in the ceiling framing. Required opening: ${ch} × ${cw}.`,
    `Route cable (${wire}) through the ceiling void — leave 300mm hanging through the bracket. Connect to the push terminal safety harness inside the bracket. This harness retains the speaker even if the magnetic hold fails.`,
    `After all construction and finishing: use the included template to make the precise ${ch} × ${cw} rectangular opening in the finished ceiling surface.`,
    `Strip 10mm from the cable ends. Connect to the ${name} rear push terminal — confirm polarity.`,
    `Hold the ${name} below the opening at a slight angle, align with the cutout, and slide it upward. The magnets pull it flush with the ceiling.`,
    `Listen for a firm magnetic seating. Pull downward firmly — the safety harness must support the speaker independently. If not, reconnect the harness terminal before finishing.`,
  ]
  if(it==='inwall-dogleg') return [
    `Mark the cutout: ${ch} high × ${cw} wide. Use the included template. Confirm square and plumb with a spirit level.`,
    `Before cutting: use a stud finder and pipe/cable detector to locate hidden services. Never cut through structural elements.`,
    `Confirm at least ${cav} of void depth behind the wall surface.`,
    `Cut the opening carefully using a drywall saw or jigsaw, staying inside the marked line.`,
    `Route cable (${wire}) through the wall void — leave 200mm exposed inside the cutout.`,
    `Connect cable to the ${name} terminals — observe polarity.`,
    `Insert the ${name} into the cutout. The baffle must sit flush against the wall surface.`,
    `Tighten the dog-leg screws alternating from side to side. Each screw drives a metal arm outward and behind the drywall, clamping the speaker. Tighten until secure but do not crack the board.`,
    `Fit the grille. Paintable — prime, paint to match, then clip on before finishing the surrounding wall.`,
  ]
  if(it==='inwall-springclip') return [
    `Mark the cutout: ${ch} high × ${cw} wide using the included template.`,
    `Check for pipes, cables, and studs. Do not cut through structural elements.`,
    `Confirm cavity depth is at least ${cav}.`,
    `Cut the opening with a drywall saw, staying inside the marked line.`,
    `Route cable (${wire}) through the wall void — leave 200mm exposed.`,
    `Connect cable to the ${name} ${conn}. Observe polarity.`,
    `Compress the spring clips flat against the speaker body. Insert at a slight angle, then straighten into the cutout. The spring clips automatically expand behind the drywall.`,
    `Press the speaker flush — the clips grip the back of the drywall board. No screws to tighten.`,
    `Fit the grille to complete the installation.`,
  ]
  if(it==='inwall-sub') return [
    `Mark the cutout: ${ch} high × ${cw} wide.`,`Check for pipes, cables, and studs using a stud finder.`,`Confirm cavity depth is at least ${cav}.`,
    `Cut the opening with a drywall saw or jigsaw.`,`Route cable (${wire}) — 200mm slack through cutout.`,`Connect cable to subwoofer terminals — observe polarity.`,
    `Insert the subwoofer body into the cutout. The flange must rest flat against the wall surface.`,
    `Drive the included flange screws through the speaker frame into the wall backing. These screws hold the speaker firmly against the surface.`,
    `Clip or magnetically attach the grille over the flange.`,
  ]
  if(it==='banyan-canopy') return [
    `The Banyan Canopy slots directly into the recessed top section of the Banyan Pith — no separate ceiling or wall fixing required for the standard floor-standing configuration.`,
    `Lower the Canopy into the Pith top socket until it seats firmly and cannot tilt.`,
    `Connect the included Speakon cable from the Speakon input (rear of Canopy) to the Canopy output (rear of Pith). Twist the Speakon connector clockwise until the locking tabs click.`,
    `For pole, hanging, or wall mount of the Canopy independently: use the appropriate XSCACE accessory mount. Run the Speakon cable from Pith to Canopy — maximum 10m run.`,
    `Route and secure the Speakon cable with cable management ties or conduit for permanent installations.`,
  ]
  if(it==='banyan-pith') return [
    `Position the Banyan Pith on a solid, level surface capable of supporting ${P.weightKg||29}kg.`,
    `Connect power: plug the supplied IEC power cable into the Pith rear inlet and into a grounded outlet.`,
    `Connect your source: run XLR or RCA cables from your amplifier's sub output (or pre-out) into the Pith's Line In or High Level input.`,
    `Connect the Banyan Canopy: Speakon cable from Pith's Canopy output → Canopy's Speakon input. Twist to lock.`,
    `DSP configuration: connect a laptop via the front USB port. Open SigmaStudio. Load the XSCACE factory preset for your speaker combination.`,
    `Power on the Pith. The status LED illuminates when the system is ready.`,
  ]
  if(it==='spirea') return [
    `Spike mount: push the stake firmly into soil at the chosen location. For harder ground, use the rubber mallet. Aim for a listening height of 400–600mm above ground.`,
    `Hanging mount: attach the carabiner to a suitable overhead anchor (pergola beam, joist, or branch rated for the load). Clip the Spirea hanging loop onto the carabiner.`,
    `Route speaker cable (${wire}) from the amplifier to the Spirea. Connect to the terminal block — observe polarity.`,
    `Aim the driver face toward the primary listening area.`,
    `For permanent outdoor cable runs: use outdoor-rated direct-burial cable. For above-ground runs, use UV-stable conduit.`,
  ]
  if(it==='powered-sub'){
    const jnpr=(P.productName||'').toLowerCase().includes('juniper')
    return [`Place the subwoofer on a solid floor. Corner placement reinforces bass; away from walls gives a flatter response.`,
      `Connect the LFE signal: run an RCA cable from your amplifier's subwoofer output (LFE out) into the subwoofer's Line In. If no sub output is available, use the amplifier's pre-out.`,
      jnpr?`Speaker-level option: connect speaker wire from your amplifier's + and − outputs into the high-level inputs — useful when no pre-out is available.`:`Set the input level trim on the subwoofer rear panel to match your amplifier's output level.`,
      `Connect power: plug the supplied IEC cable into the subwoofer rear and into a grounded outlet.`,
      `Set the low-pass crossover to match your main speakers. Bonsai/Cane/Ghost: 150–200Hz. Cedar/Camphor/Oak/Willow: 80–120Hz.`,
      `Set phase to 0°. If bass sounds hollow at the MLP, switch to 180°.`,
      `Power on. Adjust the volume trim until bass blends naturally with the main speakers.`,
    ]
  }
  if(it==='passive-sub') return [
    `Place the subwoofer on a solid floor. Corner placement reinforces bass.`,
    `Connect speaker wire (${wire}) from a dedicated amplifier output to the binding posts — observe polarity (+ red / − black).`,
    `Ensure the amplifier has a low-pass filter set to the appropriate frequency. Bonsai/Cane/Ghost: 150–200Hz. Larger main speakers: 80–120Hz.`,
    `Do not connect a passive subwoofer to a pre-out or line output — it requires amplifier power.`,
    `Play test audio and adjust the sub channel gain until bass blends naturally.`,
  ]
  if(it==='dsp-amplifier'){
    const isLR=(P.productName||'').toLowerCase().includes('lucifer')||(P.productName||'').toLowerCase().includes('root')
    return [
      `Rack mounting: the ${name} is 1U rack-mountable. Slide into a 19-inch rack and secure with rack screws. Allow at least 1U clearance above for airflow.`,
      `Connect inputs: run XLR balanced cables from your source into the amplifier XLR inputs. CH1/CH2 = L/R main speakers; CH3/CH4 = additional channels or subwoofers.`,
      isLR?`Speakon NL4 wiring: Pin 1+ and 1− carry CH1; Pin 2+ and 2− carry CH2. For bridged mono: connect CH1(+) and CH2(−) — this forms one high-power mono output. Channels 3 & 4 bridge the same way.`:'',
      isLR?`XLR wiring: Pin 1 = Ground, Pin 2 = Hot (+), Pin 3 = Cold (−). Use fully-balanced cables.`:'',
      `Connect power: plug IEC cable into the amplifier rear and into a grounded outlet. Do not power on until all speaker connections are complete.`,
      `DSP configuration: connect a laptop via front USB. Open ${P.desktopSoftwareName||'the DSP software'}. Load the XSCACE factory preset for your speaker model.`,
      `Power on. Start at low volume and verify all channels before raising levels.`,
    ].filter(Boolean)
  }
  if(it==='streaming-amplifier') return [
    `Connect speaker cables from the Air Amp's speaker output terminals — observe polarity (+ red / − black).`,
    `Optionally connect a passive subwoofer to the Air Amp's subwoofer output.`,
    `Connect the supplied DC 24V–5A adapter into the Air Amp's DC input jack and plug into a power outlet.`,
    `Download the XSCACE Controller app (App Store / Google Play). Open the app and follow the Wi-Fi setup wizard to connect the Air Amp to your network.`,
    `The Air Amp appears as an AirPlay 2 device, Bluetooth receiver, and Spotify Connect target. Select it as the output in your streaming app.`,
    `Use the XSCACE Controller app to adjust volume, balance, and EQ.`,
  ]
  if(it==='streamer') return [
    `Connect the Air Mini's Line Out (RCA) to your amplifier's line input, or SPDIF Optical or HDMI ARC to your AV processor.`,
    `Connect the supplied DC 19V adapter into the Air Mini and plug into a power outlet.`,
    `Download the XSCACE Controller app (App Store / Google Play). Follow the Wi-Fi setup wizard.`,
    `The Air Mini appears as an AirPlay 2 receiver, Spotify Connect target, and Bluetooth device. Select it as the output in your streaming app.`,
    `The Air Mini supports DLNA and UPnP for playback from a local NAS or media server.`,
  ]
  return ['Place the unit as described in the positioning section.','Make all signal and power connections.','Power on and verify at low volume.']
}

// ── CONNECT SECTION ───────────────────────────────────────────────────────────
function connectSection(P:any):string{
  const it=P.installationType||''
  const wire=P.wireGaugeRecommended||'14 AWG', conn=P.speakerWireConnector||'push terminal'
  const imp=P.impedanceOhms?`${P.impedanceOhms}Ω`:'8Ω', xov=P.recommendedCrossoverHz?`${P.recommendedCrossoverHz}Hz`:'as required'
  const isSp=['keyhole-wall','bracket-wall','ceiling-circular','ceiling-rectangular','inwall-dogleg','inwall-springclip','banyan-canopy','spirea'].includes(it)
  const isSb=['inwall-sub','powered-sub','passive-sub'].includes(it)
  const isAm=['dsp-amplifier','streaming-amplifier','banyan-pith'].includes(it)
  const row=(l:string,v:string)=>`<div class="crow"><span class="cl">${l}</span><span class="cv">${v}</span></div>`
  if(isSp) return `${row('Wire gauge',wire)}${row('Connector',conn)}${row('Impedance',imp)}${row('Crossover (set on amp)',`${xov} low-pass`)}${row('Polarity','Red(+) positive · Black(−) negative')}<p class="cnote">Wire both speakers in the same phase. Reversed polarity on one speaker causes bass cancellation and a hollow mid-range.</p>`
  if(isSb){const pw=it==='powered-sub';return `${row('Signal input',pw?'RCA Line In or High Level Speaker Input':'Speaker binding posts')}${row('Wire gauge',wire)}${row('Impedance',imp)}${row('Crossover',`${xov} low-pass`)}${pw?row('Power','IEC power cable — grounded outlet'):''}<p class="cnote">${pw?'Built-in amplifier — only LFE signal input required.':'Passive — requires a dedicated amplifier output channel.'}</p>`}
  if(isAm) return `${row('Inputs',P.inputs||'XLR balanced / RCA line')}${row('Outputs',P.outputs||'Speaker terminals / Speakon NL4')}${row('Speaker wire',wire)}${row('Load impedance',imp)}<p class="cnote">Connect all speaker cables before powering on. Never connect or disconnect speakers while the amplifier is running.</p>`
  return `${row('Outputs',P.outputs||'RCA Line Out, SPDIF Optical')}${row('Inputs',P.inputs||'AirPlay 2, Bluetooth 5.0, Spotify Connect')}${row('Power',P.powerSupply||'DC 19V adapter (included)')}<p class="cnote">The Air Mini is a streamer only — no built-in amplifier. Connect its Line Out to an amplifier or AV receiver.</p>`
}

// ── CSS ───────────────────────────────────────────────────────────────────────
function buildCss(fc:string):string{return `${fc}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}
.cov-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.44}
.cov-grad{position:absolute;inset:0;background:linear-gradient(to right,#090909 44%,rgba(9,9,9,.6) 68%,transparent 100%)}
.cov-left{position:absolute;top:0;bottom:0;left:0;width:54%;padding:34px 42px;display:flex;flex-direction:column}
.bar{position:absolute;height:5px;left:0;right:0;background:#c9a96e}
.bt{top:0}.bb{bottom:0}
.logo{font-family:'MagmaWave','DM Sans',sans-serif;font-size:18px;letter-spacing:.04em;color:#eeebe5}
.sub{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.2em;color:#7a776f;margin-top:3px;text-transform:uppercase}
.ey{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.28em;color:#c9a96e;text-transform:uppercase;margin-top:auto;margin-bottom:14px}
.nm{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:66px;color:#eeebe5;line-height:.88}
.tg{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:18px;color:#c9a96e;margin-top:10px}
.rl{height:1px;background:rgba(201,169,110,.35);margin:20px 0}
.mt{display:flex;justify-content:space-between;align-items:flex-end}
.br{font-family:'MagmaWave','DM Sans',sans-serif;font-size:17px;letter-spacing:.04em;color:#eeebe5}
.sk{font-family:'DM Mono',monospace;font-size:7.5px;color:#3a3835;letter-spacing:.12em}
.wn{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f;line-height:1.8;border:.4px solid rgba(201,169,110,.15);padding:8px 12px;margin-top:16px}
.pg{padding:20px 26px 16px;height:100%;display:flex;flex-direction:column}
.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0}
.pb{font-family:'MagmaWave','DM Sans',sans-serif;font-size:13px;color:#eeebe5}
.pi{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;letter-spacing:.1em}
.pr{height:1px;background:rgba(201,169,110,.2);flex-shrink:0}
.pn{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835;margin:4px 0 10px}
.sp{display:flex;gap:0;flex:1;min-height:0}
.sl{flex:0 0 46%;padding-right:22px;border-right:.5px solid rgba(201,169,110,.1);display:flex;flex-direction:column;overflow:hidden}
.sr{flex:1;padding-left:22px;display:flex;flex-direction:column;overflow:hidden}
.sc{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.22em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:4px;margin-bottom:8px;flex-shrink:0}
.st{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:28px;color:#eeebe5;line-height:1.05;margin-bottom:10px;flex-shrink:0}
.bi{display:flex;align-items:flex-start;gap:9px;padding:4px 0;border-bottom:.3px solid rgba(255,255,255,.05)}
.bd{width:5px;height:5px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:4px}
.bt2{font-family:'DM Mono',monospace;font-size:9px;color:#eeebe5}
.tg2{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.ti{font-family:'DM Mono',monospace;font-size:8.5px;color:#7a776f;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.05)}
.ps{display:flex;gap:10px;padding:4px 0;border-bottom:.3px solid rgba(255,255,255,.05)}
.pd{width:4px;height:4px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:6px}
.pt{font-family:'DM Sans',Helvetica,sans-serif;font-size:9.5px;color:#eeebe5;line-height:1.55}
.pn2{font-family:'DM Mono',monospace;font-size:8.5px;color:#7a776f;line-height:1.55;margin-top:10px;border-left:2px solid rgba(201,169,110,.3);padding-left:10px;flex-shrink:0}
.ss{display:flex;gap:12px;padding:5px 0;border-bottom:.3px solid rgba(255,255,255,.05)}
.sn{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:rgba(201,169,110,.26);line-height:1;flex-shrink:0;width:24px;text-align:right}
.st2{font-family:'DM Sans',Helvetica,sans-serif;font-size:9.5px;color:#eeebe5;line-height:1.55;padding-top:3px}
.dg{flex:1;background:#080806;border:.4px solid rgba(201,169,110,.1);overflow:hidden;display:flex;min-height:0}
.dg svg{width:100%;height:100%}
.sf{flex-shrink:0;margin-top:10px;padding:8px 12px;border-left:2px solid rgba(201,169,110,.22);background:rgba(201,169,110,.025)}
.sl2{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;margin-bottom:4px}
.st3{font-family:'DM Sans',Helvetica,sans-serif;font-size:8.5px;color:#7a776f;line-height:1.6}
.kd{background:rgba(201,169,110,.035);border:.4px solid rgba(201,169,110,.11);padding:10px;margin-top:8px;flex-shrink:0}
.crow{display:flex;justify-content:space-between;padding:4px 0;border-bottom:.3px solid rgba(255,255,255,.05)}
.cl{font-family:'DM Mono',monospace;font-size:9px;color:#7a776f}
.cv{font-family:'DM Mono',monospace;font-size:9px;color:#eeebe5;text-align:right;max-width:54%}
.cnote{font-family:'DM Sans',Helvetica,sans-serif;font-size:9px;color:#7a776f;line-height:1.55;margin-top:8px;border-left:2px solid rgba(201,169,110,.28);padding-left:10px}
.qrb{background:#0e0e0c;border:.4px solid rgba(201,169,110,.12);padding:14px;display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center}
.qt{font-family:'Cormorant Garamond',Georgia,serif;font-size:21px;font-weight:300;color:#eeebe5}
.qs{font-family:'DM Mono',monospace;font-size:8.5px;color:#7a776f;line-height:1.6;max-width:165px}
.qu{font-family:'DM Mono',monospace;font-size:9.5px;color:#c9a96e;letter-spacing:.06em}
.supl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;margin-bottom:5px}
.supv{font-family:'DM Mono',monospace;font-size:9.5px;color:#7a776f;margin-bottom:3px}
.pro{font-family:'DM Mono',monospace;font-size:6.5px;color:#3a3835;line-height:1.7;margin-top:auto;border-top:.3px solid rgba(255,255,255,.04);padding-top:7px}
`}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function GET(_req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params
  try{
    const P:any=await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id,productName,productFullName,tagline,shortDescription,series,skuBase,
      installationType,screwSpacingMm,screwSize,cutoutHeightMm,cutoutWidthMm,
      cutoutDiameterMm,requiredCavityDepthMm,mountingMethods,mountingMethod,
      speakerWireConnector,wireGaugeRecommended,impedanceOhms,recommendedCrossoverHz,
      itemsInBox,positioningNote,minRiggingHeight,minSpeakerSpacing,
      powerType,powerRmsW,powerPeakW,weightKg,heightMm,widthMm,depthMm,
      hasDsp,hasStreamer,inputs,outputs,powerSupply,desktopSoftwareName,
      channelCount,installManualRef,installManualHash,
      heroImage,"lifestyle":lifestyleImages[0..0],}`)
    if(!P) return NextResponse.json({error:'Product not found'},{status:404})

    // v5 = landscape 297×210, large SVGs, no toe-in — auto-busts v1/v2/v3/v4
    const nocache=_req.nextUrl?.searchParams?.get('nocache')==='1'
    const h=Buffer.from(`${P.productName}${P.installationType}${P.screwSpacingMm||''}${P.cutoutHeightMm||''}v5`).toString('base64').replace(/\W/g,'').slice(0,12)
    if(!nocache&&P.installManualRef&&P.installManualHash===h){
      const cdn=fileCdn(P.installManualRef)
      const head=await fetch(cdn,{method:'HEAD'}).catch(()=>null)
      if(head&&(head.ok||head.status===403)) return NextResponse.redirect(cdn,302)
    }

    const hero=await imgB64(getRef(P.heroImage),900)
    const fontCss=loadFontCss(), css=buildCss(fontCss)
    const advice=stereoAdvice(P), tools=toolsNeeded(P.installationType||''), steps=installSteps(P)
    const boxItems=(P.itemsInBox||'').split(',').map((s:string)=>s.trim()).filter(Boolean)
    const stepsHtml=steps.map((s,i)=>`<div class="ss"><div class="sn">${i+1}</div><div class="st2">${s}</div></div>`).join('')
    const toolsHtml=tools.map(t=>`<div class="ti">— ${t}</div>`).join('')
    const boxHtml=boxItems.map((t:string)=>`<div class="bi"><div class="bd"></div><div class="bt2">${t}</div></div>`).join('')
    const posHtml=advice.steps.map(s=>`<div class="ps"><div class="pd"></div><div class="pt">${s}</div></div>`).join('')
    const connHtml=connectSection(P)
    const instSvg=installDiagram(P), sterSvg=stereoDiagram(P)
    const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https%3A%2F%2Fconfigurator.xscace.com&bgcolor=090909&color=c9a96e&qzone=2&margin=0`

    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="bar bt"></div><div class="bar bb"></div>
  ${hero?`<img src="${hero}" class="cov-img">`:''}
  <div class="cov-grad"></div>
  <div class="cov-left">
    <div class="logo">XSCACE</div><div class="sub">Size Defying Sound</div>
    <div class="ey">Installation Manual</div>
    <div class="nm">${P.productName}</div>
    <div class="tg">${P.tagline||P.shortDescription||''}</div>
    <div class="rl"></div>
    <div class="mt"><div class="br">XSCACE</div><div class="sk">SKU ${P.skuBase||''} · ${P.series||''}</div></div>
    <div class="wn">READ ALL INSTRUCTIONS<br>BEFORE INSTALLATION</div>
  </div>
</div>

<!-- PAGE 2: BOX + TOOLS -->
<div class="page"><div class="pg">
  <div class="ph"><div class="pb">XSCACE</div><div class="pi">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
  <div class="pr"></div><div class="pn">02</div>
  <div class="sp" style="flex:1">
    <div class="sl">
      <div class="sc">What's in the box</div>
      <div>${boxHtml||'<div class="bt2" style="color:#7a776f">See packaging insert for full contents list.</div>'}</div>
      <div style="margin-top:14px"><div class="sc">Tools required</div><div class="tg2">${toolsHtml}</div></div>
      <div class="sf" style="margin-top:auto">
        <div class="sl2">Before You Begin</div>
        <div class="st3">Always isolate power before making electrical connections. Ensure all wall fixings are rated for the combined weight of the speaker and accessories. If in doubt about wall or ceiling construction, engage a structural professional before cutting or drilling. XSCACE accepts no responsibility for damage resulting from incorrect installation.</div>
      </div>
    </div>
    <div class="sr">
      ${hero?`<div style="flex:1;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#080806;border:.4px solid rgba(201,169,110,.08)"><img src="${hero}" style="width:100%;height:100%;object-fit:contain;display:block"></div>`:`<div style="flex:1;background:#080806;border:.4px solid rgba(201,169,110,.08)"></div>`}
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:#7a776f;line-height:1.8;margin-top:8px;flex-shrink:0">${P.weightKg?`Weight: ${P.weightKg} kg  ·  `:''}${P.heightMm&&P.widthMm&&P.depthMm?`${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm  ·  `:''}${P.powerType||''}</div>
    </div>
  </div>
</div></div>

<!-- PAGE 3: STEREO POSITIONING (text left, full diagram right) -->
<div class="page"><div class="pg">
  <div class="ph"><div class="pb">XSCACE</div><div class="pi">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
  <div class="pr"></div><div class="pn">03</div>
  <div class="sp" style="flex:1">
    <div class="sl">
      <div class="sc">${advice.title}</div>
      <div class="st">Finding your<br>ideal sound<br>stage.</div>
      <div style="flex:1;overflow:hidden">${posHtml}</div>
      <div class="pn2">${advice.note}</div>
    </div>
    <div class="sr"><div class="dg">${sterSvg}</div></div>
  </div>
</div></div>

<!-- PAGE 4: INSTALLATION STEPS (text left, full diagram right) -->
<div class="page"><div class="pg">
  <div class="ph"><div class="pb">XSCACE</div><div class="pi">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
  <div class="pr"></div><div class="pn">04</div>
  <div class="sp" style="flex:1">
    <div class="sl">
      <div class="sc">Installation Steps</div>
      <div class="st">How to install<br>your ${P.productName}.</div>
      <div style="flex:1;overflow:hidden">${stepsHtml}</div>
      ${(P.screwSpacingMm||P.cutoutDiameterMm||P.cutoutHeightMm||P.requiredCavityDepthMm)?`
      <div class="kd">
        <div class="sc" style="margin-bottom:6px">Key Dimensions</div>
        ${P.screwSpacingMm?`<div class="crow"><span class="cl">Screw spacing</span><span class="cv">${P.screwSpacingMm}mm c/c</span></div>`:''}
        ${P.screwSize?`<div class="crow"><span class="cl">Screw size</span><span class="cv">${P.screwSize}</span></div>`:''}
        ${P.cutoutDiameterMm?`<div class="crow"><span class="cl">Cutout ⌀</span><span class="cv">${P.cutoutDiameterMm}mm</span></div>`:''}
        ${(P.cutoutHeightMm&&P.cutoutWidthMm)?`<div class="crow"><span class="cl">Cutout H × W</span><span class="cv">${P.cutoutHeightMm} × ${P.cutoutWidthMm}mm</span></div>`:''}
        ${P.requiredCavityDepthMm?`<div class="crow"><span class="cl">Cavity depth min</span><span class="cv">${P.requiredCavityDepthMm}mm</span></div>`:''}
      </div>` : ''}
      <div class="sf" style="margin-top:8px">
        <div class="sl2">Safety</div>
        <div class="st3">Isolate power before electrical connections. Ensure all fixings are adequate for the system weight. When in doubt, consult a structural professional. XSCACE accepts no responsibility for incorrect installation.</div>
      </div>
    </div>
    <div class="sr"><div class="dg">${instSvg}</div></div>
  </div>
</div></div>

<!-- PAGE 5: CONNECT + QR + SUPPORT -->
<div class="page"><div class="pg">
  <div class="ph"><div class="pb">XSCACE</div><div class="pi">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div></div>
  <div class="pr"></div><div class="pn">05</div>
  <div class="sp" style="flex:1">
    <div class="sl">
      <div class="sc">Connecting to your system</div>
      <div class="st" style="font-size:22px">Signal &amp; power<br>connections.</div>
      <div style="flex:1">${connHtml}</div>
    </div>
    <div class="sr">
      <div style="flex:1">
        <div class="sc">System design &amp; wiring</div>
        <div style="font-family:'DM Sans',Helvetica,sans-serif;font-size:9.5px;color:#eeebe5;line-height:1.6;margin-bottom:12px">For amplifier selection, subwoofer integration, multi-room layout, and interactive wiring diagrams — open the XSCACE Configurator:</div>
        <div class="qrb">
          <div class="qt">XSCACE Configurator</div>
          <img src="${qrUrl}" width="128" height="128" style="display:block;image-rendering:pixelated" alt="QR code — configurator.xscace.com">
          <div class="qs">Scan with your phone camera. Select your products, receive a wiring diagram and bill of quantities.</div>
          <div class="qu">configurator.xscace.com</div>
        </div>
      </div>
      <div style="margin-top:14px;flex-shrink:0">
        <div class="supl">Support</div>
        <div class="supv">support@xscace.com</div><div class="supv">xscace.com</div>
      </div>
      <div style="margin-top:10px;flex-shrink:0">
        <div class="sc">Product Reference</div>
        ${P.skuBase?`<div class="crow"><span class="cl">SKU</span><span class="cv">${P.skuBase}</span></div>`:''}
        ${P.series?`<div class="crow"><span class="cl">Series</span><span class="cv">${P.series}</span></div>`:''}
        ${P.impedanceOhms?`<div class="crow"><span class="cl">Impedance</span><span class="cv">${P.impedanceOhms}Ω</span></div>`:''}
        ${P.powerRmsW?`<div class="crow"><span class="cl">Power RMS</span><span class="cv">${P.powerRmsW}W</span></div>`:''}
        ${P.weightKg?`<div class="crow"><span class="cl">Weight</span><span class="cv">${P.weightKg}kg</span></div>`:''}
      </div>
      <div class="pro">For complex or commercial installations — contact support@xscace.com for a certified installer. · © ${new Date().getFullYear()} XSCACE · Size Defying Sound · Designed in Canada</div>
    </div>
  </div>
</div></div>

</body></html>`

    const puppeteer=(await import('puppeteer-core')).default
    const chromium=(await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode=false
    const browser=await puppeteer.launch({
      args:[...chromium.args,'--no-sandbox','--single-process','--disable-gpu'],
      executablePath:await chromium.executablePath(process.env.CHROMIUM_PACK_URL||'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar'),
      headless:true,
    })
    const page=await browser.newPage()
    await page.setViewport({width:1587,height:1123,deviceScaleFactor:1})
    await page.setContent(html,{waitUntil:'networkidle0',timeout:30000})
    await page.emulateMediaType('print')
    const pdf=Buffer.from(await page.pdf({width:'297mm',height:'210mm',printBackground:true,margin:{top:'0',right:'0',bottom:'0',left:'0'}}))
    await browser.close()

    if(process.env.SANITY_API_TOKEN&&pdf.length>1000){
      try{
        const fname=`XSCACE_${P.productName.replace(/\s+/g,'_')}_Installation_Manual.pdf`
        const up=await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          {method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/pdf'},body:pdf})
        if(up.ok){const {document:doc}=await up.json();await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`,
          {method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/json'},
          body:JSON.stringify({mutations:[{patch:{id:P._id,set:{installManualRef:doc._id,installManualHash:h,installManual:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})})}
      }catch(e){console.error('[manual] cache write failed',e)}
    }

    return new NextResponse(pdf,{status:200,headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="XSCACE_${slug}_Manual.pdf"`,'Content-Length':String(pdf.length),'Cache-Control':'no-cache'}})
  }catch(err:any){console.error('[manual]',err);return NextResponse.json({error:err?.message},{status:500})}
}
