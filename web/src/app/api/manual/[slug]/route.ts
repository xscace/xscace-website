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

// ==============================================================================
// INSTALL DIAGRAM — 4-panel step cards, 480×570 SVG
// ==============================================================================
function installDiagram(P:any):string {
  const it=P.installationType||'', W=480, H=570

  // 2x2 panel grid
  const PAD=10, PW=(W-PAD*3)/2, PH=(H-PAD*3-24)/2
  const px=(col:number)=>PAD+col*(PW+PAD)
  const py=(row:number)=>24+PAD+row*(PH+PAD)
  function pnl(col:number,row:number,num:string,title:string,body:string):string {
    const x=px(col),y=py(row)
    return `${R(x,y,PW,PH,WL,'rgba(201,169,110,0.2)',0.7,4)}
    <circle cx="${f(x+16)}" cy="${f(y+16)}" r="11" fill="${CH}" opacity="0.85"/>
    ${tx(x+16,y+21,num,10,BG,'middle','bold')}
    ${tx(x+34,y+20,title,8.5,CH,'start')}
    ${body}`
  }
  function wallH(ox:number,oy:number,ww:number,wh:number):string {
    return `${R(ox,oy,ww,wh,WL,'rgba(201,169,110,0.3)',0.7,0)}<rect x="${f(ox)}" y="${f(oy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#hatch)"/>`
  }
  function scrw(ox:number,oy:number,len=32):string {
    return `${R(ox,oy-5,len,10,LT,BG,0.3,1)}${R(ox+len,oy-7,14,14,CH,BG,0.5,2)}${[4,8,12,16,20,24,28].filter((d:number)=>d<len).map((d:number)=>L(ox+d,oy-5,ox+d,oy+5,'rgba(9,9,9,0.45)',0.4)).join('')}`
  }
  function plug2(cx:number,cy:number):string {return `${C(cx,cy,8,'rgba(201,169,110,0.22)',CH,1.3)}${C(cx,cy,3,CH,BG,0.5)}`}
  function khol(cx:number,cy:number):string {
    return `${C(cx,cy,9,BG,CH,1.4)}${R(cx-5.5,cy,11,18,BG,CH,1,0)}${L(cx-5.5,cy,cx-5.5,cy+18,CH,1)}${L(cx+5.5,cy,cx+5.5,cy+18,CH,1)}`
  }
  function spkFront(ox:number,oy:number,sw:number,sh:number):string {
    const wr=Math.min(sw*0.36,sh*0.28)
    return `${R(ox,oy,sw,sh,WL,CH,1.5,3)}${C(ox+sw/2,oy+sh*0.2,Math.min(sw*0.12,9),CH,BG,0.5)}${C(ox+sw/2,oy+sh*0.6,wr,BG,CH,1.2)}${C(ox+sw/2,oy+sh*0.6,wr*0.42,CH,BG,0.42)}${C(ox+sw/2,oy+sh*0.6,wr*0.16,CH,BG,0.76)}`
  }

  // -- KEYHOLE WALL MOUNT --------------------------------------------------------
  if(it==='keyhole-wall'){
    const spc=P.screwSpacingMm||82, scrL=P.screwSize||'M2.5×25'
    const isQ=(P.productName||'').toLowerCase().includes('quad'), name=P.productName||'speaker'

    // P1: Mark + drill + plug
    const x1=px(0),y1=py(0)
    const wx1=x1+22,wy1=y1+36,ww1=24,wh1=PH-46
    const ss1=wy1+wh1*0.32, ss2=wy1+wh1*0.68
    const P1=pnl(0,0,'1','MARK & DRILL',`
      ${wallH(wx1,wy1,ww1,wh1)}
      ${tx(wx1+ww1/2,ss1-2,'✕',11,CH,'middle')}
      ${tx(wx1+ww1/2,ss2-2,'✕',11,CH,'middle')}
      ${tx(wx1+ww1+8,ss1-12,'6mm HOLES',7.5,CH,'start')}
      ${tx(wx1+ww1+8,ss2-12,'INSERT PLUGS',7.5,CH,'start')}
      ${plug2(wx1+ww1/2,ss2)}
      <path d="M ${f(wx1+ww1+36)} ${f(ss1)} L ${f(wx1+ww1+4)} ${f(ss1)}" stroke="${CH}" stroke-width="1.5" fill="none"/>
      <polygon points="${f(wx1+ww1+1)},${f(ss1-4)} ${f(wx1+ww1+1)},${f(ss1+4)} ${f(wx1+ww1+7)},${f(ss1)}" fill="${CH}"/>
      ${L(wx1+ww1+38,ss1,wx1+ww1+58,ss1,CH,0.5,'2,2')}
      ${L(wx1+ww1+48,ss1,wx1+ww1+58,ss2,CH,0.5,'2,2')}
      ${L(wx1+ww1+38,ss2,wx1+ww1+58,ss2,CH,0.5,'2,2')}
      ${tx(wx1+ww1+62,(ss1+ss2)/2,`${spc}mm`,8,CH,'start')}
    `)

    // P2: Drive screws
    const x2=px(1),y2=py(0)
    const wx2=x2+22,wy2=y2+36,ww2=24,wh2=PH-46
    const st1=wy2+wh2*0.32, st2=wy2+wh2*0.68
    const P2=pnl(1,0,'2','DRIVE SCREWS',`
      ${wallH(wx2,wy2,ww2,wh2)}
      ${plug2(wx2+ww2/2,st1)}${plug2(wx2+ww2/2,st2)}
      ${scrw(wx2+ww2,st1,36)}${scrw(wx2+ww2,st2,36)}
      ${tx(wx2+ww2+62,st1-14,'SCREW 1',8.5,CH,'start')}
      ${tx(wx2+ww2+62,st1,scrL,7.5,MU,'start')}
      ${tx(wx2+ww2+62,st2-14,'SCREW 2',8.5,CH,'start')}
      <!-- 5-7mm proud annotation -->
      ${L(wx2+ww2+32,st1-8,wx2+ww2+46,st1-8,CH,0.5)}
      ${L(wx2+ww2+32,st1+8,wx2+ww2+46,st1+8,CH,0.5)}
      ${L(wx2+ww2+46,st1-8,wx2+ww2+46,st1+8,CH,0.5,'2,1')}
      ${tx(wx2+ww2+50,st1,'5–7mm',7,CH,'start')}
      ${tx(wx2+ww2+50,st1+11,'proud',6.5,MU,'start')}
    `)

    // P3: Keyhole slot detail
    const x3=px(0),y3=py(1)
    const P3=pnl(0,1,'3','KEYHOLE DETAIL',`
      ${R(x3+16,y3+34,PW-32,PH-44,WL,CH,1.2,4)}
      ${tx(x3+PW/2,y3+30,'REAR FACE OF SPEAKER',7.5,MU,'middle')}
      ${khol(x3+PW/2,y3+PH*0.32)}
      ${tx(x3+PW/2,y3+PH*0.32-22,'TOP KEYHOLE',7,MU,'middle')}
      ${khol(x3+PW/2,y3+PH*0.62)}
      ${tx(x3+PW/2,y3+PH*0.62-22,'BOTTOM KEYHOLE',7,MU,'middle')}
      ${R(x3+PW/2+18,y3+PH*0.47-8,22,22,BG,LT,0.8,2)}
      ${C(x3+PW/2+23,y3+PH*0.5,4,CH,BG,0.5)}${C(x3+PW/2+32,y3+PH*0.5,4,BG,LT,0.5)}
      ${tx(x3+PW/2+27,y3+PH*0.5+14,'+−',8,CH,'middle')}
      <path d="M ${f(x3+32)} ${f(y3+60)} L ${f(x3+32)} ${f(y3+90)}" stroke="${CH}" stroke-width="1.5" fill="none"/>
      <path d="M ${f(x3+28)} ${f(y3+86)} L ${f(x3+32)} ${f(y3+94)} L ${f(x3+36)} ${f(y3+86)}" fill="none" stroke="${CH}" stroke-width="1.2"/>
      ${tx(x3+32,y3+50,'LOWER ONTO',7,CH,'middle')}
      ${tx(x3+32,y3+60,'SCREW',7,CH,'middle')}
    `)

    // P4: Installed
    const x4=px(1),y4=py(1)
    const spH=PH-62, spW=44
    const P4=pnl(1,1,'4','INSTALLED',`
      ${wallH(x4+16,y4+36,22,PH-46)}
      ${spkFront(x4+38,y4+36+(PH-46-spH)/2,spW,spH)}
      ${corm(x4+38+spW/2,y4+36+(PH-46-spH)/2+spH+16,name,9,LT)}
      ${L(x4+38+spW,y4+36+(PH-46)/2,x4+PW-8,y4+36+(PH-46)/2,CH,0.9,'4,3')}
      ${tx(x4+PW-6,y4+36+(PH-46)/2-11,'TO',6.5,MU,'end')}
      ${tx(x4+PW-6,y4+36+(PH-46)/2,'AMP',6.5,MU,'end')}
      ${tx(x4+PW-6,y4+PH-20,'✓ LOCKED',8.5,CH,'end')}
    `)

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs><pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(201,169,110,0.09)" stroke-width="4"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="${BG}"/>
    ${tx(W/2,16,`KEYHOLE WALL MOUNT  ·  ${spc}mm C/C  ·  ${scrL}${isQ?' · CORNER MOUNT: 2-PIECE BRACKET':''}`,8.5,MU)}
    ${P1}${P2}${P3}${P4}</svg>`
  }

  // -- BRACKET WALL MOUNT --------------------------------------------------------
  if(it==='bracket-wall'){
    const spc=P.screwSpacingMm||120, scrL=P.screwSize||'M4×25', name=P.productName||'speaker'
    function wh2(ox:number,oy:number,ww:number,wt:number):string {return `${R(ox,oy,ww,wt,WL,'rgba(201,169,110,0.3)',0.7,0)}<rect x="${f(ox)}" y="${f(oy)}" width="${f(ww)}" height="${f(wt)}" fill="url(#hatch)"/>`}
    function pl2(cx:number,cy:number):string {return `${C(cx,cy,8,'rgba(201,169,110,0.22)',CH,1.3)}${C(cx,cy,3,CH,BG,0.5)}`}
    function sc2(ox:number,oy:number):string {return `${R(ox,oy-5,32,10,LT,BG,0.3,1)}${R(ox+32,oy-7,14,14,CH,BG,0.5,2)}`}
    function spF(ox:number,oy:number,sw:number,sh:number):string {const wr=Math.min(sw*0.36,sh*0.28);return `${R(ox,oy,sw,sh,WL,CH,1.5,3)}${C(ox+sw/2,oy+sh*0.2,9,CH,BG,0.5)}${C(ox+sw/2,oy+sh*0.62,wr,BG,CH,1.2)}${C(ox+sw/2,oy+sh*0.62,wr*0.42,CH,BG,0.42)}`}

    const x1=px(0),y1=py(0),wx1=x1+22,wy1=y1+36,ww1=24,wh1=PH-46,sa=wy1+wh1*0.28,sb=wy1+wh1*0.72
    const P1=pnl(0,0,'1','MARK & DRILL',`
      ${wh2(wx1,wy1,ww1,wh1)}
      ${tx(wx1+ww1/2,sa-2,'✕',11,CH,'middle')}${tx(wx1+ww1/2,sb-2,'✕',11,CH,'middle')}
      ${tx(wx1+ww1+8,sa-12,'6mm HOLES',7.5,CH,'start')}
      ${L(wx1+ww1+50,(sa+sb)/2-6,wx1+ww1+50,(sa+sb)/2+6,CH,0.5)}
      ${L(wx1+ww1+46,(sa+sb)/2-6,wx1+ww1+54,(sa+sb)/2-6,CH,0.5)}
      ${L(wx1+ww1+46,(sa+sb)/2+6,wx1+ww1+54,(sa+sb)/2+6,CH,0.5)}
      ${tx(wx1+ww1+58,(sa+sb)/2+4,`${spc}mm`,8,CH,'start')}
    `)
    const x2=px(1),y2=py(0),wx2=x2+22,wy2=y2+36,ww2=24,wh2val=PH-46,sc=wy2+wh2val*0.28,sd=wy2+wh2val*0.72
    const P2=pnl(1,0,'2','FIT BRACKET',`
      ${wh2(wx2,wy2,ww2,wh2val)}
      ${pl2(wx2+ww2/2,sc)}${pl2(wx2+ww2/2,sd)}
      ${sc2(wx2+ww2,sc)}${sc2(wx2+ww2,sd)}
      ${R(wx2+ww2+32,sc,12,sd-sc,WL,CH,1.3,2)}
      ${R(wx2+ww2+32,sc-5,44,10,WL,CH,1.1,2)}
      ${R(wx2+ww2+32,sd-5,44,10,WL,CH,1.1,2)}
      ${tx(wx2+ww2+40,(sc+sd)/2,'BRACKET',7.5,CH,'start')}
    `)
    const x3=px(0),y3=py(1)
    const P3=pnl(0,1,'3','CONNECT CABLE',`
      ${R(x3+18,y3+34,PW-36,PH-44,WL,CH,1.1,3)}
      ${tx(x3+PW/2,y3+30,'REAR OF SPEAKER',7.5,MU,'middle')}
      ${R(x3+PW/2-14,y3+PH*0.43,28,30,BG,LT,0.9,2)}
      ${C(x3+PW/2-7,y3+PH*0.52,5,CH,BG,0.55)}${C(x3+PW/2+7,y3+PH*0.52,5,BG,LT,0.55)}
      ${tx(x3+PW/2-7,y3+PH*0.59,'+',9,CH,'middle')}${tx(x3+PW/2+7,y3+PH*0.59,'−',9,LT,'middle')}
      ${tx(x3+PW/2,y3+PH*0.67,'RED + · BLACK −',7,MU,'middle')}
      ${L(x3+18,y3+PH*0.52,x3+8,y3+PH*0.52,CH,1.2,'4,3')}
      ${tx(x3+6,y3+PH*0.52-11,'TO',6.5,MU,'end')}${tx(x3+6,y3+PH*0.52,'AMP',6.5,MU,'end')}
    `)
    const x4=px(1),y4=py(1),spH=PH-62,spW=40
    const P4=pnl(1,1,'4','INSTALLED',`
      ${wh2(x4+16,y4+36,22,PH-46)}
      ${R(x4+38,y4+36+(PH-46)/2-10,22,18,WL,CH,1,2)}
      ${spF(x4+60,y4+36+(PH-46-spH)/2,spW,spH)}
      ${corm(x4+60+spW/2,y4+36+(PH-46-spH)/2+spH+16,name,9,LT)}
      ${L(x4+60+spW,y4+36+(PH-46)/2,x4+PW-8,y4+36+(PH-46)/2,CH,0.9,'4,3')}
      ${tx(x4+PW-6,y4+36+(PH-46)/2-11,'TO AMP',6.5,MU,'end')}
      ${tx(x4+PW-6,y4+PH-20,'✓ SECURE',8.5,CH,'end')}
    `)
    return svg(W,H,`${tx(W/2,16,'BRACKET WALL MOUNT  ·  '+spc+'mm SPACING  ·  '+scrL,8.5,MU)}${P1}${P2}${P3}${P4}`)
  }

  // -- CEILING CIRCULAR ----------------------------------------------------------
  if(it==='ceiling-circular'){
    const d=P.cutoutDiameterMm||209, cav=P.requiredCavityDepthMm||115, r=52

    function ceil(ox:number,oy:number,w:number,h:number):string {return `${R(ox,oy,w,h,WL,'rgba(201,169,110,0.3)',0.7,0)}<rect x="${f(ox)}" y="${f(oy)}" width="${f(w)}" height="${f(h)}" fill="url(#hatch)"/>`}

    const x1=px(0),y1=py(0),c1x=x1+PW/2,c1y=y1+72
    const P1=pnl(0,0,'1',`CUT ⌀${d}mm`,`
      ${R(x1+10,c1y-30,PW-20,14,'#0c0c0a','rgba(201,169,110,0.06)',0.3,0)}
      ${tx(c1x,c1y-22,`MIN ${cav}mm VOID`,7,MU,'middle')}
      ${ceil(x1+10,c1y-16,PW-20,20)}
      ${tx(c1x,c1y-22,'CEILING',7,MU,'middle')}
      <circle cx="${f(c1x)}" cy="${f(c1y+r+4)}" r="${f(r)}" fill="${BG}" stroke="${CH}" stroke-width="2"/>
      ${tx(c1x,c1y+r+4,`⌀${d}mm`,8.5,CH,'middle')}
      ${tx(c1x,c1y+r+18,'HOLE SAW',7.5,MU,'middle')}
      ${R(x1+10,c1y-30,PW-20,12,'#0c0c0a','rgba(201,169,110,0.06)',0.3,0)}
      ${tx(c1x,c1y-23,`VOID · MIN ${cav}mm`,7,MU,'middle')}
    `)
    const x2=px(1),y2=py(0),c2x=x2+PW/2,c2y=y2+72
    const P2=pnl(1,0,'2','FEED CABLE',`
      ${ceil(x2+10,c2y-16,PW-20,20)}
      <circle cx="${f(c2x)}" cy="${f(c2y+r+4)}" r="${f(r)}" fill="${BG}" stroke="${CH}" stroke-width="1.5"/>
      ${L(c2x,c2y-4,c2x,c2y+r+4+50,CH,2,'5,3')}
      ${tx(c2x+8,c2y+r+36,'CABLE',8,CH,'start')}
      ${tx(c2x+8,c2y+r+50,'200mm SLACK',7,MU,'start')}
      ${R(c2x-13,c2y+r+54,26,18,BG,LT,0.8,2)}
      ${C(c2x-5,c2y+r+63,4,CH,BG,0.5)}${C(c2x+5,c2y+r+63,4,BG,LT,0.5)}
      ${tx(c2x-5,c2y+r+73,'+',8,CH,'middle')}${tx(c2x+5,c2y+r+73,'−',8,LT,'middle')}
      ${tx(c2x,c2y+r+82,'CONNECT',7,MU,'middle')}
    `)
    const x3=px(0),y3=py(1),c3x=x3+PW/2,c3y=y3+62
    const P3=pnl(0,1,'3','INSERT SPEAKER',`
      ${ceil(x3+10,c3y-14,PW-20,18)}
      <circle cx="${f(c3x)}" cy="${f(c3y+r+2)}" r="${f(r)}" fill="${BG}" stroke="${CH}" stroke-width="1.5"/>
      <ellipse cx="${f(c3x+8)}" cy="${f(c3y+r+2)}" rx="${f(r-9)}" ry="${f(r-18)}" fill="${WL}" stroke="${CH}" stroke-width="1.4" transform="rotate(-12,${f(c3x+8)},${f(c3y+r+2)})"/>
      ${R(c3x-r-8,c3y-6,10,9,CH,BG,0.5,2)}
      ${R(c3x+r-2,c3y-6,10,9,CH,BG,0.5,2)}
      ${tx(c3x,c3y-20,'INSERT AT ANGLE',7.5,MU,'middle')}
      ${tx(c3x,c3y-10,'THEN STRAIGHTEN',7,MU,'middle')}
      ${tx(c3x-r-14,c3y-4,'CLIP',6,CH,'end')}${tx(c3x+r+14,c3y-4,'CLIP',6,CH,'start')}
    `)
    const x4=px(1),y4=py(1),c4x=x4+PW/2,c4y=y4+60
    const P4=pnl(1,1,'4','TIGHTEN & GRILLE',`
      ${ceil(x4+10,c4y-14,PW-20,18)}
      <circle cx="${f(c4x)}" cy="${f(c4y+r)}" r="${f(r)}" fill="${WL}" stroke="${CH}" stroke-width="1.9"/>
      <ellipse cx="${f(c4x)}" cy="${f(c4y+r-r*0.26)}" rx="12" ry="8" fill="${CH}" opacity="0.6"/>
      <circle cx="${f(c4x)}" cy="${f(c4y+r+r*0.18)}" r="${f(r*0.36)}" fill="${BG}" stroke="${CH}" stroke-width="1"/>
      <circle cx="${f(c4x)}" cy="${f(c4y+r+r*0.18)}" r="${f(r*0.13)}" fill="${CH}" opacity="0.4"/>
      ${R(c4x-r-5,c4y-4,8,8,CH,BG,0.5,2)}${R(c4x+r-3,c4y-4,8,8,CH,BG,0.5,2)}
      ${tx(c4x,c4y+r*2+16,'TIGHTEN CLIPS EVENLY',7.5,CH,'middle')}
      ${tx(c4x,c4y+r*2+30,'then fit grille',7,MU,'middle')}
      ${tx(c4x,c4y+r*2+46,'✓ COMPLETE',8.5,LT,'middle')}
    `)
    return svg(W,H,`${tx(W/2,16,'CIRCULAR IN-CEILING  ·  ⌀'+d+'mm  ·  MIN '+cav+'mm VOID',8.5,MU)}${P1}${P2}${P3}${P4}`)
  }

  // -- IN-WALL DOGLEG / SPRINGCLIP ----------------------------------------------
  if(it==='inwall-dogleg'||it==='inwall-springclip'){
    const cH=P.cutoutHeightMm||230,cW=P.cutoutWidthMm||328, isDog=it==='inwall-dogleg'
    function wallS(ox:number,oy:number,ww:number,wh:number):string {return `${R(ox,oy,ww,wh,WL,'rgba(201,169,110,0.3)',0.7,0)}<rect x="${f(ox)}" y="${f(oy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#hatch)"/>`}

    const x1=px(0),y1=py(0)
    const P1=pnl(0,0,'1','MARK CUTOUT',`
      ${R(x1+12,y1+34,PW-24,PH-44,WL,'rgba(201,169,110,0.1)',0.4,2)}
      ${tx(x1+PW/2,y1+30,'WALL FACE',7.5,MU,'middle')}
      ${R(x1+32,y1+56,PW-64,PH-82,'rgba(201,169,110,0.04)',CH,0.9,1)}
      <rect x="${f(x1+32)}" y="${f(y1+56)}" width="${f(PW-64)}" height="${f(PH-82)}" fill="none" stroke="${CH}" stroke-width="1.2" stroke-dasharray="5,3"/>
      ${tx(x1+PW/2,y1+66,`${cW}mm`,8.5,CH,'middle')}
      ${tx(x1+32-14,y1+56+(PH-82)/2,`${cH}mm`,8,CH,'end')}
      ${tx(x1+PW/2,y1+PH-36,'CHECK PIPES',7,MU,'middle')}
      ${tx(x1+PW/2,y1+PH-24,'& STUDS FIRST',7,MU,'middle')}
    `)
    const x2=px(1),y2=py(0)
    const P2=pnl(1,0,'2','CUT & CABLE',`
      ${R(x2+12,y2+34,PW-24,PH-44,WL,'rgba(201,169,110,0.1)',0.4,2)}
      ${R(x2+32,y2+56,PW-64,PH-82,BG,CH,1.4,1)}
      ${tx(x2+PW/2,y2+56+(PH-82)/2-8,'OPENING',8.5,CH,'middle')}
      ${tx(x2+PW/2,y2+56+(PH-82)/2+8,'CUT',8.5,CH,'middle')}
      ${L(x2+PW/2,y2+56,x2+PW/2,y2+PH-18,CH,1.5,'5,3')}
      ${tx(x2+PW/2+8,y2+PH-26,'CABLE',7.5,MU,'start')}
    `)
    const x3=px(0),y3=py(1)
    const wallX3=x3+16, wallW3=18, cavW=22
    const cuty3=y3+36+(PH-46)*0.12, cutH3=(PH-46)*0.76
    const P3=pnl(0,1,'3',isDog?'INSERT + CLIP':'INSERT SPEAKER',`
      ${wallS(wallX3,y3+36,wallW3,PH-46)}
      ${R(wallX3,cuty3,wallW3,cutH3,BG,CH,0.7,0)}
      ${R(wallX3-cavW,cuty3+8,cavW,cutH3-16,'#0d0d0c','rgba(201,169,110,0.12)',0.4,1)}
      ${R(wallX3+wallW3,y3+36+(PH-46)*0.1,PW-wallX3-wallW3-x3-10,(PH-46)*0.8,WL,CH,1.2,3)}
      ${C(wallX3+wallW3+(PW-wallX3-wallW3-x3-10)*0.4,y3+36+(PH-46)/2,Math.min((PH-46)*0.24,28),BG,CH,1)}
      ${C(wallX3+wallW3+(PW-wallX3-wallW3-x3-10)*0.4,y3+36+(PH-46)/2,Math.min((PH-46)*0.24,28)*0.4,CH,BG,0.42)}
      ${isDog?`
        <path d="M ${f(wallX3)} ${f(cuty3+cutH3*0.22)} L ${f(wallX3-14)} ${f(cuty3+cutH3*0.1)} L ${f(wallX3-14)} ${f(cuty3-6)}" fill="none" stroke="${CH}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M ${f(wallX3)} ${f(cuty3+cutH3*0.78)} L ${f(wallX3-14)} ${f(cuty3+cutH3*0.9)} L ${f(wallX3-14)} ${f(cuty3+cutH3+6)}" fill="none" stroke="${CH}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${tx(wallX3-18,cuty3+2,'CLIP',6.5,CH,'end')}${tx(wallX3-18,cuty3+cutH3+8,'CLIP',6.5,CH,'end')}
      `:`
        <path d="M ${f(wallX3)} ${f(cuty3+cutH3*0.2)} Q ${f(wallX3-18)} ${f(cuty3+cutH3*0.32)} ${f(wallX3-16)} ${f(cuty3+cutH3*0.44)} Q ${f(wallX3-14)} ${f(cuty3+cutH3*0.56)} ${f(wallX3)} ${f(cuty3+cutH3*0.62)}" fill="none" stroke="${CH}" stroke-width="2.2" stroke-linecap="round"/>
        ${tx(wallX3-22,cuty3+cutH3*0.42,'SPRING',6,CH,'end')}
      `}
      ${tx(wallX3+wallW3+(PW-wallX3-wallW3-x3-10)*0.8+4,y3+36+(PH-46)/2,'ROOM',8,MU,'start')}
    `)
    const x4=px(1),y4=py(1)
    const P4=pnl(1,1,'4','FIT GRILLE',`
      ${R(x4+12,y4+34,PW-24,PH-44,WL,'rgba(201,169,110,0.1)',0.4,2)}
      ${R(x4+32,y4+56,PW-64,PH-82,'#0f0f0d',CH,1.4,1)}
      ${R(x4+32,y4+56,PW-64,PH-82,'rgba(238,235,229,0.03)',LT,0.9,1)}
      ${Array.from({length:3},(_:unknown,r:number)=>Array.from({length:3},(_:unknown,c:number)=>`${C(x4+52+c*22,y4+74+r*28,3,'rgba(238,235,229,0.06)',LT,0.3)}`).join('')).join('')}
      ${tx(x4+PW/2,y4+56+(PH-82)/2,'GRILLE FITTED',9,LT,'middle')}
      ${tx(x4+PW/2,y4+56+(PH-82)/2+18,'(paintable)',7.5,MU,'middle')}
      ${tx(x4+PW-8,y4+PH-20,'✓ DONE',8.5,CH,'end')}
    `)
    return svg(W,H,`${tx(W/2,16,(isDog?'DOG-LEG CLIPS':'SPRING CLIPS')+' IN-WALL  ·  CUTOUT: '+cW+'×'+cH+'mm',8.5,MU)}${P1}${P2}${P3}${P4}`)
  }

  // -- GHOST 2.0 CEILING RECTANGULAR --------------------------------------------
  if(it==='ceiling-rectangular'){
    const cH=P.cutoutHeightMm||168,cW=P.cutoutWidthMm||53
    function ceilS(ox:number,oy:number,w:number,h:number):string {return `${R(ox,oy,w,h,WL,'rgba(201,169,110,0.3)',0.7,0)}<rect x="${f(ox)}" y="${f(oy)}" width="${f(w)}" height="${f(h)}" fill="url(#hatch)"/>`}
    const x1=px(0),y1=py(0)
    const P1=pnl(0,0,'1','BRACKET FIRST',`
      ${R(x1+12,y1+56,PW-24,16,WL,'rgba(201,169,110,0.18)',0.5,0)}
      ${tx(x1+PW/2,y1+50,'CEILING FRAME',7.5,MU,'middle')}
      ${R(x1+PW/2-24,y1+72,48,20,WL,CH,1,2)}
      ${tx(x1+PW/2,y1+86,'BRACKET',8,CH,'middle')}
      ${tx(x1+PW/2,y1+100,'during construction',6.5,MU,'middle')}
      ${R(x1+PW/2-12,y1+112,24,16,BG,LT,0.8,2)}
      ${tx(x1+PW/2,y1+124,'SAFETY HARNESS',6.5,LT,'middle')}
      ${L(x1+PW/2,y1+128,x1+PW/2,y1+150,LT,1,'3,2')}
      ${tx(x1+PW/2,y1+162,'TERMINAL',7,LT,'middle')}
    `)
    const x2=px(1),y2=py(0)
    const P2=pnl(1,0,'2','CUT OPENING',`
      ${ceilS(x2+12,y2+56,PW-24,18)}
      ${tx(x2+PW/2,y2+50,'FINISHED CEILING',7.5,MU,'middle')}
      ${R(x2+PW/2-18,y2+56,36,18,BG,CH,1.5,0)}
      ${tx(x2+PW/2,y2+68,`${cW}×${cH}mm`,8.5,CH,'middle')}
      ${tx(x2+PW/2,y2+82,'after construction',6.5,MU,'middle')}
      ${L(x2+PW/2,y2+74,x2+PW/2,y2+140,CH,1.8,'5,3')}
      ${tx(x2+PW/2+8,y2+120,'CABLE',7.5,CH,'start')}
    `)
    const x3=px(0),y3=py(1)
    const P3=pnl(0,1,'3','SLIDE IN — MAGNET HOLDS',`
      ${ceilS(x3+12,y3+48,PW-24,18)}
      ${R(x3+PW/2-18,y3+48,36,18,BG,CH,0.8,0)}
      ${R(x3+PW/2-16,y3+68,32,54,WL,CH,1.4,2)}
      ${C(x3+PW/2,y3+95,10,BG,CH,0.9)}${C(x3+PW/2,y3+95,4,CH,BG,0.4)}
      ${tx(x3+PW/2,y3+122,'⬡ MAGNET',8,CH,'middle')}
      ${tx(x3+PW/2,y3+136,'pulls flush',7,MU,'middle')}
      ${L(x3+PW/2,y3+154,x3+PW/2,y3+66,CH,0.7,'3,2')}
    `)
    const x4=px(1),y4=py(1)
    const P4=pnl(1,1,'4','PULL-TEST HARNESS',`
      ${ceilS(x4+12,y4+44,PW-24,18)}
      ${R(x4+PW/2-18,y4+44,36,18,'#0f0f0d',CH,1.5,0)}
      ${C(x4+PW/2,y4+54,9,BG,CH,0.9)}
      ${L(x4+PW/2,y4+62,x4+PW/2,y4+118,LT,1.8)}
      ${R(x4+PW/2-12,y4+116,24,16,BG,LT,0.8,2)}
      <path d="M ${f(x4+PW/2+24)} ${f(y4+94)} L ${f(x4+PW/2+24)} ${f(y4+136)}" stroke="${CH}" stroke-width="1.5" fill="none"/>
      <path d="M ${f(x4+PW/2+19)} ${f(y4+132)} L ${f(x4+PW/2+24)} ${f(y4+140)} L ${f(x4+PW/2+29)} ${f(y4+132)}" fill="none" stroke="${CH}" stroke-width="1.2"/>
      ${tx(x4+PW/2+32,y4+110,'PULL',7.5,CH,'start')}${tx(x4+PW/2+32,y4+124,'TEST',7.5,CH,'start')}
      ${tx(x4+PW/2,y4+PH-48,'Harness must hold',8,LT,'middle')}
      ${tx(x4+PW/2,y4+PH-34,'speaker independently',7,MU,'middle')}
      ${tx(x4+PW/2,y4+PH-20,'✓ THEN DONE',8.5,LT,'middle')}
    `)
    return svg(W,H,`${tx(W/2,16,'GHOST 2.0  ·  '+cW+'×'+cH+'mm  ·  MAGNET + SAFETY HARNESS',8.5,MU)}${P1}${P2}${P3}${P4}`)
  }

  // -- IN-WALL SUB -------------------------------------------------------------
  if(it==='inwall-sub'){
    const cH=P.cutoutHeightMm||365,cW=P.cutoutWidthMm||225
    const x1=px(0),y1=py(0)
    const P1=pnl(0,0,'1','CUT OPENING',`
      ${R(x1+12,y1+34,PW-24,PH-44,WL,'rgba(201,169,110,0.1)',0.4,2)}
      ${R(x1+32,y1+56,PW-64,PH-76,BG,CH,1.5,1)}
      ${tx(x1+PW/2,y1+72,`${cW}×${cH}mm`,8.5,CH,'middle')}
      ${tx(x1+PW/2,y1+88,'DRYWALL SAW',7.5,MU,'middle')}
      ${tx(x1+PW/2,y1+102,'check pipes first',7,MU,'middle')}
    `)
    const x2=px(1),y2=py(0)
    const P2=pnl(1,0,'2','CONNECT CABLE',`
      ${R(x2+22,y2+42,PW-44,PH-54,WL,CH,1,3)}
      ${tx(x2+PW/2,y2+38,'REAR OF SUB',7.5,MU,'middle')}
      ${R(x2+PW/2-14,y2+PH*0.36,28,26,BG,LT,0.8,2)}
      ${C(x2+PW/2-7,y2+PH*0.46,5,CH,BG,0.55)}${C(x2+PW/2+7,y2+PH*0.46,5,BG,LT,0.55)}
      ${tx(x2+PW/2-7,y2+PH*0.54,'+',9,CH,'middle')}${tx(x2+PW/2+7,y2+PH*0.54,'−',9,LT,'middle')}
      ${tx(x2+PW/2,y2+PH*0.62,'OBSERVE',7.5,MU,'middle')}${tx(x2+PW/2,y2+PH*0.62+12,'POLARITY',7.5,MU,'middle')}
    `)
    const x3=px(0),y3=py(1)
    const P3=pnl(0,1,'3','INSERT & SCREW',`
      ${R(x3+12,y3+34,PW-24,PH-44,WL,'rgba(201,169,110,0.1)',0.4,2)}
      ${R(x3+32,y3+52,PW-64,PH-72,'#0f0f0d',CH,1.3,2)}
      ${C(x3+PW/2,y3+34+(PH-44)/2,Math.min((PH-72)*0.34,30),BG,CH,1.1)}
      ${C(x3+PW/2,y3+34+(PH-44)/2,Math.min((PH-72)*0.34,30)*0.4,CH,BG,0.42)}
      ${tx(x3+PW/2,y3+PH-42,'FLANGE SCREWS',8,CH,'middle')}
      ${tx(x3+PW/2,y3+PH-28,'through body',7,MU,'middle')}
    `)
    const x4=px(1),y4=py(1)
    const P4=pnl(1,1,'4','FIT GRILLE',`
      ${R(x4+12,y4+34,PW-24,PH-44,WL,'rgba(201,169,110,0.1)',0.4,2)}
      ${R(x4+32,y4+52,PW-64,PH-72,'#0f0f0d',CH,1.3,2)}
      ${R(x4+32,y4+52,PW-64,PH-72,'rgba(238,235,229,0.03)',LT,0.9,2)}
      ${tx(x4+PW/2,y4+34+(PH-44)/2,'GRILLE',9,LT,'middle')}
      ${tx(x4+PW-8,y4+PH-20,'✓ COMPLETE',8.5,CH,'end')}
    `)
    return svg(W,H,`${tx(W/2,16,'IN-WALL SUBWOOFER  ·  '+cW+'×'+cH+'mm',8.5,MU)}${P1}${P2}${P3}${P4}`)
  }

  // -- BANYAN ------------------------------------------------------------------
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

  // -- SPIREA ------------------------------------------------------------------
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

  // -- POWERED / PASSIVE SUB ---------------------------------------------------
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

  // -- DSP AMPLIFIER -----------------------------------------------------------
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

  // -- STREAMING AMP / STREAMER -------------------------------------------------
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

// ==============================================================================
// STEREO POSITIONING DIAGRAM — fills right half of page 3 (480×570)
// ==============================================================================
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

// -- POSITIONING ADVICE (text) -------------------------------------------------
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

// -- TOOLS ---------------------------------------------------------------------
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

// -- INSTALL STEPS -------------------------------------------------------------
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

// -- CONNECT SECTION -----------------------------------------------------------
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

// -- CSS -----------------------------------------------------------------------
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

// -- MAIN HANDLER --------------------------------------------------------------
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
