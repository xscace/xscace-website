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
function svg(w:number,h:number,body:string){return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs style="display:none"><pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(201,169,110,0.09)" stroke-width="4"/></pattern></defs><rect width="${w}" height="${h}" fill="${BG}"/>${body}</svg>`}
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
  const f2=(n:number)=>n.toFixed(1)

  // Palette
  const BG2='#090909',CH2='#c9a96e',LT2='#eeebe5',MU2='#7a776f',WL2='#111110'

  // SVG primitives — all coords absolute, no nesting
  const tx2=(x:number,y:number,s:string,sz=9,cl=MU2,a='middle')=>
    `<text x="${f2(x)}" y="${f2(y)}" text-anchor="${a}" fill="${cl}" font-size="${sz}" font-family="DM Mono,monospace">${s}</text>`
  const r2=(x:number,y:number,w:number,h:number,fill=WL2,str=CH2,sw=0.8,rx=2)=>
    `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${rx}" fill="${fill}" stroke="${str}" stroke-width="${sw}"/>`
  const c2=(cx:number,cy:number,r:number,fill=WL2,str=CH2,sw=0.8)=>
    `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${fill}" stroke="${str}" stroke-width="${sw}"/>`
  const ln=(x1:number,y1:number,x2:number,y2:number,str=CH2,sw=0.8,dash='')=>
    `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${str}" stroke-width="${sw}" ${dash?`stroke-dasharray="${dash}"`:''}stroke-linecap="round"/>`

  // Wall slab rectangle with hatch fill
  const wall=(x:number,y:number,w:number,h:number)=>
    `${r2(x,y,w,h,WL2,'rgba(201,169,110,0.3)',0.7,0)}<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="url(#hatch)"/>`

  // Screw: shaft + thread marks + hex head, all coords absolute
  const screw=(x:number,y:number,len:number)=>{
    const shaft=r2(x,y-5,len,10,LT2,BG2,0.3,1)
    const threads=[6,12,18,24,30,36].filter(d=>d<len)
      .map(d=>ln(x+d,y-5,x+d,y+5,'rgba(9,9,9,0.45)',0.5)).join('')
    const head=r2(x+len,y-8,14,16,CH2,BG2,0.5,2)
    const slot=ln(x+len+3,y,x+len+11,y,BG2,1.8)
    return shaft+threads+head+slot
  }

  // Wall plug: outer ring + inner dot
  const plug=(cx:number,cy:number)=>
    c2(cx,cy,9,'rgba(201,169,110,0.18)',CH2,1.3)+c2(cx,cy,4,CH2,BG2,0.6)

  // Keyhole slot: circle + rectangular tail pointing down
  const keyhole=(cx:number,cy:number,r=11)=>{
    const slot_w=r*1.1, slot_h=r*2.2
    return c2(cx,cy,r,BG2,CH2,1.6)
      +r2(cx-slot_w/2,cy,slot_w,slot_h,BG2,CH2,1,0)
      +ln(cx-slot_w/2,cy,cx-slot_w/2,cy+slot_h,CH2,1.3)
      +ln(cx+slot_w/2,cy,cx+slot_w/2,cy+slot_h,CH2,1.3)
  }

  // Numbered badge
  const badge=(x:number,y:number,n:number)=>
    c2(x,y,9,CH2,BG2,0.3)
    +`<text x="${f2(x)}" y="${f2(y+3.5)}" text-anchor="middle" fill="#090909" font-size="8.5" font-family="DM Mono,monospace" font-weight="bold">${n}</text>`

  // Horizontal dimension line
  const dimH=(x1:number,y:number,x2:number,lbl:string)=>
    ln(x1,y,x2,y,CH2,0.5,'3,2')
    +ln(x1,y-5,x1,y+5,CH2,0.5)
    +ln(x2,y-5,x2,y+5,CH2,0.5)
    +tx2((x1+x2)/2,y-8,lbl,8,CH2)

  // Vertical dimension line (label left)
  const dimV=(x:number,y1:number,y2:number,lbl:string)=>
    ln(x,y1,x,y2,CH2,0.5,'3,2')
    +ln(x-5,y1,x+5,y1,CH2,0.5)
    +ln(x-5,y2,x+5,y2,CH2,0.5)
    +tx2(x-10,(y1+y2)/2+3,lbl,8,CH2,'end')

  // Standard hatch def + SVG wrapper
  const HATCH=`<defs style="display:none"><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(201,169,110,0.09)" stroke-width="3.5"/></pattern></defs>`
  const mksvg=(body:string)=>
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">${HATCH}<rect width="${W}" height="${H}" fill="${BG2}"/>${body}</svg>`

  // ── Step label row: badge + two lines of text ──────────────────────────────
  // x=badge centre, y=vertical centre, line1=bold, line2=muted
  const step=(bx:number,by:number,n:number,line1:string,line2?:string)=>
    badge(bx,by)
    +tx2(bx+16,by-4,line1||'',9,LT2,'start')
    +(line2&&line2!==''&&line2!=='undefined'?tx2(bx+16,by+9,line2,8,MU2,'start'):'')

  // ============================================================
  // KEYHOLE WALL MOUNT
  // Layout: left strip = wall cross-section (thin)
  //         right area = clean labelled diagram
  // ============================================================
  if(it==='keyhole-wall'){
    const spc=P.screwSpacingMm||82
    const scrL=P.screwSize||'M2.5×25'
    const drillMm=scrL.startsWith('M2.5')?'5':scrL.startsWith('M2')?'4':scrL.startsWith('M3')?'6':scrL.startsWith('M4')?'7':'6'
    const isQ=(P.productName||'').toLowerCase().includes('quad')

    // FIXED layout — screw positions NEVER change regardless of spc
    // Only the annotation text shows the actual measurement
    const WX=50, WW=30, WY=80, WH=400
    const S1=WY+WH*0.28   // top screw — always at 28% of wall height
    const S2=WY+WH*0.72   // bottom screw — always at 72% of wall height
    const SX=WX+WW
    const SLEN=52
    const REAR_X=SX+SLEN+28  // speaker rear face
    const REAR_W=32
    const REAR_H=S2-S1+60
    const REAR_Y=(S1+S2)/2-REAR_H/2
    const TX=REAR_X+REAR_W+28  // text column, well clear of everything

    return mksvg(
      tx2(W/2,18,'KEYHOLE WALL MOUNT',9,MU2)
      +tx2(W/2,30,spc+'mm C/C  ·  '+scrL,8.5,CH2)

      +wall(WX,WY,WW,WH)
      +tx2(WX+WW/2,WY-10,'WALL',8,MU2)

      // Two wall plugs
      +plug(WX+WW/2,S1)
      +plug(WX+WW/2,S2)

      // Two screws protruding from wall
      +screw(SX,S1,SLEN)
      +screw(SX,S2,SLEN)
      +tx2(SX+SLEN+3,S1-14,'5–7mm proud',7,MU2,'start')

      // Spacing dimension — line between screws, label shows actual mm
      +ln(WX+WW+10,S1,WX+WW+10,S2,CH2,0.5,'3,2')
      +ln(WX+WW+5,S1,WX+WW+15,S1,CH2,0.5)
      +ln(WX+WW+5,S2,WX+WW+15,S2,CH2,0.5)
      +tx2(WX+WW+12,S1-6,spc+'mm',8,CH2,'start')

      // Speaker REAR face with keyholes
      +r2(REAR_X,REAR_Y,REAR_W,REAR_H,WL2,CH2,1.4,4)
      +tx2(REAR_X+REAR_W/2,REAR_Y-10,'REAR FACE',7.5,MU2)
      +keyhole(REAR_X+REAR_W/2,S1-6,8)
      +keyhole(REAR_X+REAR_W/2,S2-6,8)

      // Steps — one per row, generous spacing
      +step(TX,S1-20, 1,'Mark positions — use template','Confirm level with spirit level')
      +step(TX,S1+24, 2,'Drill '+drillMm+'mm holes — insert plugs')
      +step(TX,(S1+S2)/2, 3,'Drive '+scrL,'Leave 5–7mm proud of wall')
      +step(TX,S2+0,  4,'Connect cable — Red(+) · Black(−)')
      +step(TX,S2+44, 5,'Lower onto screws — keyhole locks')
      +(isQ
        ? tx2(TX,S2+78,'QuadCane: 2-piece corner bracket, '+spc+'mm apart',7.5,MU2,'start')
        : tx2(TX,S2+78,'Cannot lift without tilting speaker',7.5,MU2,'start'))

      // Info bar
      +r2(20,WY+WH+18,W-36,42,BG2,'rgba(201,169,110,0.12)',0.4,3)
      +tx2(28,WY+WH+30,'DRILL BIT',8,CH2,'start')
      +tx2(96,WY+WH+30,drillMm+'mm for '+scrL,8,LT2,'start')
      +tx2(28,WY+WH+44,'SPACING',8,CH2,'start')
      +tx2(96,WY+WH+44,spc+'mm centre-to-centre',8,LT2,'start')
    )
  }

  if(it==='bracket-wall'){
    const spc=P.screwSpacingMm||120
    const scrL=P.screwSize||'M4×25'
    const drillMm=scrL.startsWith('M4')?'7':scrL.startsWith('M3')?'6':'7'

    // FIXED layout — same positions always, only text changes
    const WX=50, WW=30, WY=80, WH=380
    const S1=WY+WH*0.25
    const S2=WY+WH*0.75
    const SX=WX+WW
    const SLEN=44
    const B_ARM=50, B_BAR=12
    const BVX=SX+SLEN+B_ARM
    const TX=BVX+B_BAR+32

    return mksvg(
      tx2(W/2,18,'BRACKET WALL MOUNT',9,MU2)
      +tx2(W/2,30,spc+'mm C/C  ·  '+scrL,8.5,CH2)

      +wall(WX,WY,WW,WH)
      +tx2(WX+WW/2,WY-10,'WALL',8,MU2)

      +plug(WX+WW/2,S1)
      +plug(WX+WW/2,S2)
      +screw(SX,S1,SLEN)
      +screw(SX,S2,SLEN)

      // Bracket arms
      +r2(SX+SLEN,S1-5,B_ARM,10,WL2,CH2,1.2,2)
      +r2(SX+SLEN,S2-5,B_ARM,10,WL2,CH2,1.2,2)
      // Bracket vertical bar
      +r2(BVX,S1,B_BAR,S2-S1,WL2,CH2,1.2,1)
      +tx2(BVX+B_BAR/2,S1-12,'BRACKET',8,CH2)

      // Spacing annotation — inline between screw positions
      +ln(SX+SLEN+B_ARM+4,S1,SX+SLEN+B_ARM+4,S2,CH2,0.5,'3,2')
      +ln(SX+SLEN+B_ARM-1,S1,SX+SLEN+B_ARM+9,S1,CH2,0.5)
      +ln(SX+SLEN+B_ARM-1,S2,SX+SLEN+B_ARM+9,S2,CH2,0.5)
      +tx2(SX+SLEN+B_ARM+12,(S1+S2)/2,spc+'mm',8,CH2,'start')

      +step(TX,S1-20, 1,'Mark '+spc+'mm spacing — confirm level')
      +step(TX,S1+20, 2,'Drill '+drillMm+'mm — insert plugs')
      +step(TX,(S1+S2)/2, 3,'Drive '+scrL+' — fit bracket to wall')
      +step(TX,S2+10, 4,'Fix speaker to bracket')
      +step(TX,S2+48, 5,'Connect cable — Red(+) · Black(−)')

      +r2(20,WY+WH+18,W-36,42,BG2,'rgba(201,169,110,0.12)',0.4,3)
      +tx2(28,WY+WH+30,'DRILL BIT',8,CH2,'start')
      +tx2(96,WY+WH+30,drillMm+'mm for '+scrL,8,LT2,'start')
      +tx2(28,WY+WH+44,'SPACING',8,CH2,'start')
      +tx2(96,WY+WH+44,spc+'mm centre-to-centre',8,LT2,'start')
    )
  }

  if(it==='ceiling-circular'){
    const d=P.cutoutDiameterMm||209
    const cav=P.requiredCavityDepthMm||115
    const R=100  // circle radius in SVG units — big and clear

    // Top third: ceiling cross-section with hole + speaker
    // Bottom: step list with plenty of space
    const CEIL_Y=80, CEIL_H=34
    const CX=W/2, CY=CEIL_Y+CEIL_H/2+R+4  // speaker centre

    // Dog-leg clips at 4 compass points
    const clips=[0,90,180,270].map((a:number)=>{
      const rd=a*Math.PI/180
      const cx2=CX+Math.cos(rd)*(R-3), cy2=CY+Math.sin(rd)*(R-3)
      const ex=CX+Math.cos(rd)*(R+24), ey=CY+Math.sin(rd)*(R+24)
      return r2(cx2-6,cy2-4,12,8,CH2,BG2,0.3,1)
        +ln(cx2,cy2,ex,ey,CH2,2)
        +c2(ex,ey,7,BG2,CH2,1.3)
    }).join('')

    const STEP_Y=CY+R+30  // start of step list
    const STEP_GAP=28

    return mksvg(
      tx2(W/2,16,'CIRCULAR IN-CEILING',9,MU2)
      +tx2(W/2,28,'⌀'+d+'mm CUTOUT  ·  '+cav+'mm MIN VOID',8.5,CH2)

      // Ceiling void label
      +r2(22,38,W-44,CEIL_Y-40,'#0c0c0a','rgba(201,169,110,0.06)',0.3,0)
      +tx2(W/2,60,'CEILING VOID  —  MIN '+cav+'mm DEPTH REQUIRED',8,MU2)

      // Ceiling slab
      +wall(22,CEIL_Y,W-44,CEIL_H)
      +tx2(W/2,CEIL_Y-6,'CEILING SURFACE',8,MU2)

      // Circular cutout
      +`<circle cx="${CX}" cy="${CY}" r="${R}" fill="${BG2}" stroke="${CH2}" stroke-width="2.2"/>`
      // Speaker body flush in hole
      +`<circle cx="${CX}" cy="${CY}" r="${R-9}" fill="${WL2}" stroke="${CH2}" stroke-width="1.4"/>`
      +`<circle cx="${CX}" cy="${CY}" r="${R-24}" fill="#0d0d0b" stroke="rgba(201,169,110,0.2)" stroke-width="0.6"/>`
      // Tweeter
      +`<ellipse cx="${CX}" cy="${f2(CY-R*0.26)}" rx="17" ry="10" fill="${CH2}" opacity="0.6"/>`
      +tx2(CX,CY-R*0.26+4,'TWEETER',6,'#090909')
      // Woofer cone
      +`<circle cx="${CX}" cy="${f2(CY+R*0.2)}" r="${f2(R*0.36)}" fill="${BG2}" stroke="${CH2}" stroke-width="1.1"/>`
      +`<circle cx="${CX}" cy="${f2(CY+R*0.2)}" r="${f2(R*0.14)}" fill="${CH2}" opacity="0.35"/>`
      +`<circle cx="${CX}" cy="${f2(CY+R*0.2)}" r="${f2(R*0.055)}" fill="${CH2}" opacity="0.72"/>`

      // Dog-leg clips
      +clips
      +tx2(CX+R+32,CY-14,'DOG-LEG',8.5,CH2,'start')
      +tx2(CX+R+32,CY-2,'CLIPS ×4',8.5,CH2,'start')
      +tx2(CX+R+32,CY+11,'grip behind ceiling',7.5,MU2,'start')

      // Diameter dimension line
      +dimH(CX-R,CY+R+14,CX+R,'⌀'+d+'mm')

      // Steps — well-spaced list
      +r2(22,STEP_Y,W-44,H-STEP_Y-10,BG2,'rgba(201,169,110,0.09)',0.4,3)
      +[
        ['1','Cut ⌀'+d+'mm hole — use hole saw','Check no joists within cutout area'],
        ['2','Route cable through hole','Leave 200mm slack hanging through'],
        ['3','Connect cable to terminal','Observe polarity: + and −'],
        ['4','Insert speaker at angle — straighten flush','Dog-leg clips go behind ceiling board'],
        ['5','Tighten clips evenly — do not overtighten'],
        ['6','Fit grille (paintable — prime before fitting)'],
      ].map(([n,a,b=''],i)=>
        step(38,STEP_Y+18+i*STEP_GAP,parseInt(n as string),a,b)
      ).join('')
    )
  }

  // ============================================================
  // IN-WALL DOGLEG / SPRINGCLIP
  // ============================================================
  if(it==='inwall-dogleg'||it==='inwall-springclip'){
    const cH=P.cutoutHeightMm||230, cW=P.cutoutWidthMm||328
    const isDog=it==='inwall-dogleg'

    // Cross-section view: wall left, speaker in middle, room right
    // All proportions fixed — no dynamic scaling that causes cramping
    const WX=40, WW=38, WY=44, WH=H-88
    const cutH_px=Math.min(cH*0.52,260)
    const cutY=WY+(WH-cutH_px)/2

    // Cavity behind wall (left of wall)
    const CAV_W=36
    // Speaker body in the wall opening
    const ROOM_X=WX+WW  // room-side face of speaker

    // Step list: right side column
    const STEPS_X=WX+WW+50
    const STEPS_W=W-STEPS_X-14
    const STEP_GAP=Math.min((WH-20)/8.5, 52)

    return mksvg(
      tx2(W/2,16,'IN-WALL '+(isDog?'DOG-LEG CLIPS':'SPRING CLIPS'),9,MU2)
      +tx2(W/2,28,'CUTOUT: '+cW+' × '+cH+'mm',8.5,CH2)

      // Cavity behind wall
      +r2(WX-CAV_W-6,WY,CAV_W+6,WH,'#0a0a08','rgba(201,169,110,0.05)',0.2,0)
      +tx2(WX-CAV_W/2-3,WY-8,'CAVITY',7,MU2)

      // Wall slab
      +wall(WX,WY,WW,WH)
      +tx2(WX+WW/2,WY-8,'WALL',8,MU2)

      // Cutout opening
      +r2(WX,cutY,WW,cutH_px,BG2,CH2,0.9,0)
      +ln(WX,cutY,WX+WW,cutY,CH2,1,'5,3')
      +ln(WX,cutY+cutH_px,WX+WW,cutY+cutH_px,CH2,1,'5,3')

      // Speaker body in wall
      +r2(WX,cutY+8,WW,cutH_px-16,'#0f0f0d',CH2,1.5,2)
      // Speaker cavity (behind wall section)
      +r2(WX-CAV_W,cutY+16,CAV_W,cutH_px-32,'#0e0e0c','rgba(201,169,110,0.18)',0.5,1)

      // Woofer cone (room-side face)
      +c2(WX+WW/2,WY+WH/2,Math.min(cutH_px*0.29,54),BG2,CH2,1.2)
      +c2(WX+WW/2,WY+WH/2,Math.min(cutH_px*0.12,22),CH2,BG2,0.38)
      +c2(WX+WW/2,WY+WH/2,Math.min(cutH_px*0.05,9),CH2,BG2,0.75)

      // Mounting mechanism — clips shown left of wall clearly
      +(isDog
        ? // Dog-leg arms: L-shaped paths bending behind wall
          `<path d="M ${WX} ${cutY+26} L ${WX-16} ${cutY+12} L ${WX-16} ${cutY-8}" fill="none" stroke="${CH2}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
          +c2(WX-16,cutY-8,7,CH2,BG2,0.7)
          +tx2(WX-22,cutY-16,'CLIP',7.5,CH2,'end')
          +`<path d="M ${WX} ${cutY+cutH_px-26} L ${WX-16} ${cutY+cutH_px-12} L ${WX-16} ${cutY+cutH_px+8}" fill="none" stroke="${CH2}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
          +c2(WX-16,cutY+cutH_px+8,7,CH2,BG2,0.7)
          +tx2(WX-22,cutY+cutH_px+16,'CLIP',7.5,CH2,'end')
        : // Spring clips: bezier curve
          `<path d="M ${WX} ${cutY+18} Q ${WX-20} ${cutY+30} ${WX-18} ${cutY+48} Q ${WX-16} ${cutY+66} ${WX} ${cutY+74}" fill="none" stroke="${CH2}" stroke-width="2.5" stroke-linecap="round"/>`
          +tx2(WX-24,cutY+cutH_px/2-6,'SPRING',7.5,CH2,'end')
          +tx2(WX-24,cutY+cutH_px/2+8,'CLIPS',7.5,CH2,'end')
          +`<path d="M ${WX} ${cutY+cutH_px-18} Q ${WX-20} ${cutY+cutH_px-30} ${WX-18} ${cutY+cutH_px-48} Q ${WX-16} ${cutY+cutH_px-66} ${WX} ${cutY+cutH_px-74}" fill="none" stroke="${CH2}" stroke-width="2.5" stroke-linecap="round"/>`)

      // Terminal on rear (inside cavity)
      +r2(WX-CAV_W+6,WY+WH/2-16,26,32,BG2,LT2,0.8,2)
      +c2(WX-CAV_W+14,WY+WH/2-3,4,CH2,BG2,0.5)
      +c2(WX-CAV_W+22,WY+WH/2-3,4,BG2,LT2,0.5)
      +tx2(WX-CAV_W+14,WY+WH/2+10,'+',8.5,CH2)
      +tx2(WX-CAV_W+22,WY+WH/2+10,'−',8.5,LT2)
      +ln(WX-CAV_W,WY+WH/2,WX-CAV_W-14,WY+WH/2,CH2,1,'3,2')
      +tx2(WX-CAV_W-16,WY+WH/2+14,'TO AMP',7,MU2,'end')

      // Room side label
      +tx2(WX+WW+8,WY+WH/2-8,'ROOM',8,MU2,'start')
      +tx2(WX+WW+8,WY+WH/2+6,'SIDE',8,MU2,'start')

      // Cutout dimensions
      +dimH(WX,cutY-18,WX+WW,cW+'mm wide')
      +dimV(WX+WW+28,cutY,cutY+cutH_px,cH+'mm')

      // Step list in right column — well spaced
      +r2(STEPS_X,WY,STEPS_W,WH,BG2,'rgba(201,169,110,0.08)',0.3,3)
      +[
        ['1','Mark '+cW+'×'+cH+'mm cutout'],
        ['2','Check pipes & studs first'],
        ['3','Cut with drywall saw'],
        ['4','Route cable — 200mm slack'],
        ['5','Connect — Red(+) · Black(−)'],
        ['6','Insert speaker into opening'],
        ['7',isDog?'Tighten clips alternating sides':'Spring clips auto-expand'],
        ['8','Fit grille (paintable)'],
      ].map(([n,s],i)=>
        step(STEPS_X+16,WY+18+i*STEP_GAP,parseInt(n as string),s as string)
      ).join('')
    )
  }

  // ============================================================
  // GHOST 2.0 CEILING RECTANGULAR
  // ============================================================
  if(it==='ceiling-rectangular'){
    const cH=P.cutoutHeightMm||168, cW=P.cutoutWidthMm||53
    const sc=Math.min(200/cW,85/cH,2.2)
    const dW=Math.round(cW*sc), dH=Math.round(cH*sc)
    const cx=W/2-dW/2, cy=132

    const STEP_Y=cy+dH+100
    const STEP_GAP=28

    return mksvg(
      tx2(W/2,16,'GHOST 2.0  CEILING RECTANGULAR',9,MU2)
      +tx2(W/2,28,cW+'×'+cH+'mm  ·  MAGNET + SAFETY HARNESS',8.5,CH2)

      // Ceiling void
      +r2(22,40,W-44,78,'#0c0c0a','rgba(201,169,110,0.06)',0.3,0)
      +tx2(W/2,76,'CEILING VOID',8,MU2)
      // Pre-construction bracket
      +r2(cx-22,62,dW+44,30,WL2,CH2,0.9,2)
      +tx2(W/2,78,'PRE-CONSTRUCTION BRACKET',7.5,CH2)
      +tx2(W/2,90,'fit during construction before plasterboard',7,MU2)

      // Ceiling slab
      +wall(22,118,W-44,40)
      +tx2(W/2,112,'FINISHED CEILING',8,MU2)

      // Rectangular cutout
      +r2(cx,cy,dW,dH,BG2,CH2,2,1)
      +tx2(W/2,cy-12,cW+'×'+cH+'mm',9,CH2)

      // Ghost speaker in cutout
      +r2(cx+4,cy+4,dW-8,dH-8,'#0f0f0d',CH2,1.2,1)
      +c2(W/2,cy+dH/2,Math.min(dW*0.3,17),BG2,CH2,1)
      +c2(W/2,cy+dH/2,Math.min(dW*0.12,6),CH2,BG2,0.4)

      // Magnet symbol
      +`<path d="M ${W/2-13} ${cy+10} L ${W/2} ${cy+22} L ${W/2+13} ${cy+10}" fill="none" stroke="${CH2}" stroke-width="2.2" stroke-linecap="round"/>`
      +tx2(W/2+dW/2+18,cy+14,'MAGNET',8.5,CH2,'start')
      +tx2(W/2+dW/2+18,cy+28,'holds speaker flush',7.5,MU2,'start')

      // Safety harness wire + terminal
      +ln(W/2,cy+dH-4,W/2,cy+dH+60,LT2,2)
      +r2(W/2-14,cy+dH+58,28,18,BG2,LT2,0.9,2)
      +tx2(W/2+22,cy+dH+68,'PUSH TERMINAL',8.5,LT2,'start')
      +tx2(W/2+22,cy+dH+82,'safety harness wire',7.5,MU2,'start')
      +tx2(W/2+22,cy+dH+96,'retains speaker if magnet fails',7,MU2,'start')

      // Dimensions — positioned to not overlap anything
      +dimH(cx,cy+dH+96+18,cx+dW,cW+'mm wide')
      +dimV(cx-28,cy,cy+dH,cH+'mm')

      // Step list
      +r2(22,STEP_Y,W-44,H-STEP_Y-10,BG2,'rgba(201,169,110,0.09)',0.4,3)
      +[
        ['1','During construction: fit bracket in ceiling framing'],
        ['2','Connect cable to safety harness terminal in bracket'],
        ['3','Cut '+cW+'×'+cH+'mm opening after finishing'],
        ['4','Connect cable to Ghost — observe polarity'],
        ['5','Slide Ghost into bracket — magnets pull it flush'],
        ['6','Pull-test: harness must hold speaker independently'],
      ].map(([n,s],i)=>
        step(38,STEP_Y+18+i*STEP_GAP,parseInt(n as string),s as string)
      ).join('')
    )
  }

  // ============================================================
  // IN-WALL SUBWOOFER
  // ============================================================
  if(it==='inwall-sub'){
    const cH=P.cutoutHeightMm||365, cW=P.cutoutWidthMm||225
    const sc=Math.min(110/cW,120/cH)
    const dW=Math.round(cW*sc), dH=Math.round(cH*sc)

    const WX=40, WW=36, WY=44, WH=H-88
    const cutY=WY+(WH-dH)/2
    const STEPS_X=WX+WW+dW+40

    return mksvg(
      tx2(W/2,16,'IN-WALL SUBWOOFER',9,MU2)
      +tx2(W/2,28,'CUTOUT: '+cW+' × '+cH+'mm',8.5,CH2)

      +wall(WX,WY,WW,WH)
      +tx2(WX+WW/2,WY-8,'WALL',8,MU2)

      +r2(WX,cutY,WW,dH,BG2,CH2,0.8,0)
      +r2(WX-2,cutY+6,dW+4,dH-12,WL2,CH2,1.5,2)

      // Woofer cone
      +c2(WX+dW/2+2,WY+WH/2,Math.min(dH*0.4,44),BG2,CH2,1.3)
      +c2(WX+dW/2+2,WY+WH/2,Math.min(dH*0.4,44)*0.55,WL2,CH2,0.7)
      +c2(WX+dW/2+2,WY+WH/2,Math.min(dH*0.4,44)*0.22,CH2,BG2,0.5)

      // Grille strip on room side
      +r2(WX+dW+5,cutY+6,10,dH-12,WL2,LT2,0.6,1)
      +tx2(WX+dW+22,WY+WH/2,'GRILLE',8,LT2,'start')

      // Flange screws
      +c2(WX+7,cutY+20,6,BG2,CH2,0.8)
      +c2(WX+7,cutY+dH-20,6,BG2,CH2,0.8)
      +tx2(WX+3,cutY+14,'FLANGE',6.5,MU2,'end')
      +tx2(WX+3,cutY+dH-14,'SCREWS',6.5,MU2,'end')

      +dimV(WX+dW+24,cutY,cutY+dH,cH+'mm')
      +dimH(WX,cutY-16,WX+dW,cW+'mm')

      +r2(STEPS_X,WY,W-STEPS_X-14,WH,BG2,'rgba(201,169,110,0.08)',0.3,3)
      +[
        ['1','Mark '+cW+'×'+cH+'mm cutout'],
        ['2','Check pipes & studs'],
        ['3','Cut with drywall saw'],
        ['4','Route cable — 200mm slack'],
        ['5','Connect — Red(+) · Black(−)'],
        ['6','Insert sub body into cutout'],
        ['7','Drive flange screws through body'],
        ['8','Clip grille over flange'],
      ].map(([n,s],i)=>
        step(STEPS_X+16,WY+18+i*((WH-20)/8.5),parseInt(n as string),s as string)
      ).join('')
    )
  }

  // ============================================================
  // BANYAN
  // ============================================================
  if(it==='banyan-canopy'||it==='banyan-pith'){
    return mksvg(
      tx2(W/2,16,'BANYAN SYSTEM ASSEMBLY',9,MU2)

      // Pith body
      +r2(125,292,230,178,WL2,CH2,1.8,6)
      +tx2(240,330,'BANYAN PITH',10,CH2)
      +tx2(240,346,'Dual 12" Powered Sub + DSP',8.5,MU2)
      +[0,1,2,3].map((i:number)=>r2(142+i*48,362,38,10,BG2,CH2,0.3,1)).join('')

      // Top socket
      +r2(170,278,140,16,BG2,CH2,0.8,1)
      +tx2(240,272,'TOP SOCKET',7.5,MU2)

      // Speakon connector
      +r2(214,246,52,34,CH2,BG2,0.6,3)
      +tx2(240,267,'SPEAKON',8,'#090909')
      +tx2(240,240,'SPEAKON CABLE',8,CH2)

      // Canopy body
      +r2(146,60,188,186,WL2,CH2,1.8,5)
      +tx2(240,42,'BANYAN CANOPY',11,CH2)
      +tx2(240,28,'Wide-Dispersion Line Array',8.5,MU2)
      +[0,1,2,3,4].map((i:number)=>c2(240,78+i*32,12,CH2,BG2,0.38)).join('')

      // Optional mounts
      +r2(26,96,110,90,BG2,'rgba(201,169,110,0.12)',0.3,2)
      +tx2(81,114,'ALSO MOUNTS:',8.5,CH2)
      +tx2(81,130,'· Pole mount',8,MU2,'start')
      +tx2(81,144,'· Wall mount',8,MU2,'start')
      +tx2(81,158,'· Hanging',8,MU2,'start')

      // Steps
      +r2(26,436,W-52,108,BG2,'rgba(201,169,110,0.08)',0.3,3)
      +[
        ['1','Seat Canopy into Pith top socket until locked'],
        ['2','Connect Speakon cable: Pith output → Canopy input'],
        ['3','Connect source to Pith Line In (XLR or RCA)'],
        ['4','Load DSP preset via USB + SigmaStudio'],
        ['5','Power on — LED illuminates when ready'],
      ].map(([n,s],i)=>step(42,454+i*22,parseInt(n as string),s as string)).join('')
    )
  }

  // ============================================================
  // SPIREA
  // ============================================================
  if(it==='spirea'){
    const MID=W/2
    return mksvg(
      tx2(MID,16,'SPIREA  ·  TWO INSTALLATION OPTIONS',9,MU2)
      +ln(MID,28,MID,H-10,'rgba(201,169,110,0.1)',0.6,'7,4')
      +tx2(MID/2,28,'HANGING MOUNT',9,CH2)
      +tx2(MID+MID/2,28,'SPIKE MOUNT',9,CH2)

      // LEFT: hanging mount
      +wall(22,42,MID-40,18)
      +tx2(MID/2,38,'PERGOLA BEAM / JOIST',7.5,MU2)
      +ln(MID/2,60,MID/2,100,LT2,1.2,'3,2')
      +`<ellipse cx="${MID/2}" cy="110" rx="13" ry="18" fill="${BG2}" stroke="${CH2}" stroke-width="2"/>`
      +ln(MID/2-13,104,MID/2+13,104,BG2,4)
      +tx2(MID/2+16,110,'CARABINER',8.5,CH2,'start')
      +ln(MID/2,128,MID/2,168,LT2,1.4)
      +c2(MID/2,200,38,WL2,CH2,2)
      +c2(MID/2,200,17,CH2,BG2,0.44)
      +c2(MID/2,200,7,CH2,BG2,0.82)
      +tx2(MID/2,256,'SPIREA',9.5,LT2)
      +ln(MID/2+38,200,MID/2+58,200,CH2,1.1,'3,2')
      +tx2(MID/2+62,206,'TO AMP',7.5,MU2,'start')
      // Hanging mount steps
      +tx2(MID/2,320,'1. Attach carabiner to anchor',8,LT2)
      +tx2(MID/2,338,'2. Clip Spirea loop to carabiner',8,MU2)
      +tx2(MID/2,356,'3. Route cable — connect + / −',8,LT2)

      // RIGHT: spike mount
      +wall(MID+22,408,MID-44,78)
      +tx2(MID+MID/2,404,'SOIL / GROUND',7.5,MU2)
      +ln(MID+MID/2,162,MID+MID/2,408,LT2,3.5)
      +`<polygon points="${f2(MID+MID/2-12)},406 ${f2(MID+MID/2+12)},406 ${f2(MID+MID/2)},424" fill="${CH2}"/>`
      +c2(MID+MID/2,132,38,WL2,CH2,2)
      +c2(MID+MID/2,132,17,CH2,BG2,0.44)
      +c2(MID+MID/2,132,7,CH2,BG2,0.82)
      +tx2(MID+MID/2,188,'SPIREA',9.5,LT2)
      +ln(MID+MID/2-38,132,MID+MID/2-62,132,CH2,1.1,'3,2')
      +tx2(MID+MID/2-66,138,'TO AMP',7.5,MU2,'end')
      // Height annotation
      +dimV(MID+MID/2+50,162,408,'400–600mm')
      +tx2(MID+MID/2+16,220,'drive spike into soil',8,MU2,'start')
      +tx2(MID+MID/2+16,236,'use mallet if ground is hard',8,MU2,'start')
      // Spike steps
      +tx2(MID+MID/2,320,'1. Push spike into soil',8,LT2)
      +tx2(MID+MID/2,338,'2. Use mallet if ground is firm',8,MU2)
      +tx2(MID+MID/2,356,'3. Route cable — connect + / −',8,LT2)
    )
  }

  // ============================================================
  // POWERED / PASSIVE SUBWOOFER
  // ============================================================
  if(it==='powered-sub'||it==='passive-sub'){
    const pw=it==='powered-sub'
    return mksvg(
      tx2(W/2,16,pw?'POWERED SUBWOOFER':'PASSIVE SUBWOOFER',9,MU2)

      // Sub enclosure front
      +r2(76,32,328,296,WL2,CH2,1.6,7)
      // Woofer cone rings — large and clear
      +c2(W/2,188,114,BG2,CH2,1.3)
      +c2(W/2,188,88,WL2,CH2,0.6)
      +c2(W/2,188,57,BG2,CH2,0.9)
      +c2(W/2,188,30,CH2,BG2,0.42)
      +c2(W/2,188,13,CH2,BG2,0.76)
      +`<text x="${W/2}" y="52" text-anchor="middle" fill="${LT2}" font-size="13" font-family="Cormorant Garamond,serif" font-weight="300">${P.productName||'SUBWOOFER'}</text>`
      // Rubber feet
      +[-116,-58,0,58,116].map((ox:number)=>c2(W/2+ox,328,10,CH2,BG2,0.44)).join('')

      // Rear panel area
      +r2(76,360,328,168,'#0c0c0a',CH2,0.8,3)
      +tx2(W/2,374,'REAR PANEL',8,MU2)

      +(pw
        ? // LFE input — plenty of space
          c2(120,418,16,BG2,CH2,1.5)+c2(120,418,7,CH2,BG2,0.5)
          +tx2(120,446,'LFE IN',8.5,CH2)+tx2(120,460,'(RCA)',7.5,MU2)
          // High level input
          +c2(192,418,11,BG2,LT2,0.8)+c2(208,418,11,BG2,LT2,0.8)
          +tx2(192,446,'+',10,CH2)+tx2(208,446,'−',10,LT2)
          +tx2(200,460,'HIGH LEVEL',7.5,MU2)
          // Crossover dial
          +c2(278,418,17,BG2,CH2,0.7)+ln(278,418,278,402,CH2,2)
          +tx2(278,446,'X-OVER',8.5,CH2)
          // Phase switch
          +r2(326,408,42,22,BG2,LT2,0.7,2)+tx2(347,446,'PHASE',8.5,LT2)+tx2(347,462,'0° / 180°',7.5,MU2)
          // IEC power
          +r2(376,407,28,24,BG2,LT2,0.6,1)+tx2(390,446,'IEC PWR',8,LT2)
        : // Binding posts — large and clear
          c2(186,418,16,CH2,BG2,0.55)+c2(240,418,16,BG2,CH2,1)
          +tx2(186,446,'+',12,CH2)+tx2(240,446,'−',12,LT2)
          +tx2(213,460,'BINDING POSTS',8.5,LT2)
          +tx2(213,476,'14 AWG or thinner',7.5,MU2))

      // Corner note — small, out of the way
      +r2(28,418,40,44,BG2,'rgba(201,169,110,0.14)',0.3,2)
      +ln(28,418,28,462,'rgba(201,169,110,0.4)',0.8)+ln(28,418,68,418,'rgba(201,169,110,0.4)',0.8)
      +c2(48,440,11,CH2,BG2,0.44)
      +tx2(48,468,'CORNER',7,CH2)+tx2(48,480,'= more bass',6,MU2)
    )
  }

  // ============================================================
  // DSP AMPLIFIER
  // ============================================================
  if(it==='dsp-amplifier'){
    const ch=P.channelCount||4
    const chW=Math.min(300/ch,70)
    const isLR=(P.productName||'').toLowerCase().includes('lucifer')
              ||(P.productName||'').toLowerCase().includes('root')
    return mksvg(
      tx2(W/2,16,ch+'-CHANNEL DSP AMPLIFIER',9,MU2)

      // Rack ears
      +r2(20,56,30,210,WL2,'rgba(201,169,110,0.18)',0.5,2)
      +r2(W-50,56,30,210,WL2,'rgba(201,169,110,0.18)',0.5,2)
      +[76,96,116,136,156,176,196,216,236,256].map((y:number)=>
        c2(35,y,4,BG2,CH2,0.4)+c2(W-35,y,4,BG2,CH2,0.4)).join('')

      // Main chassis front
      +r2(50,50,W-100,216,WL2,CH2,1.5,2)

      // Channel strips
      +Array.from({length:ch},(_:unknown,i:number)=>{
        const sx=62+i*chW
        return r2(sx,62,chW-10,148,BG2,'rgba(201,169,110,0.11)',0.4,2)
          +[0,1,2,3,4].map((b:number)=>r2(sx+5,74+b*11,chW-22,7,'rgba(201,169,110,'+(0.16+b*0.13)+')',BG2,0.2,1)).join('')
          +c2(sx+chW/2-5,160,12,'#181816',CH2,0.9)
          +ln(sx+chW/2-5,160,sx+chW/2-5,149,CH2,1.8)
          +tx2(sx+chW/2-5,182,'CH'+(i+1),8.5,LT2)
          +tx2(sx+chW/2-5,195,'GAIN',7,MU2)
      }).join('')

      // USB DSP port
      +r2(W-118,72,50,22,BG2,CH2,0.8,1)
      +tx2(W-93,87,'USB DSP',7.5,CH2)

      // Rear panel
      +r2(50,284,W-100,205,'#0c0c0a',CH2,0.8,2)
      +tx2(W/2,300,'REAR PANEL',8,MU2)

      // XLR inputs — clearly spaced
      +tx2(W/2,316,'XLR BALANCED INPUTS',7.5,CH2)
      +Array.from({length:Math.min(ch,4)},(_:unknown,i:number)=>{
        const ix=72+i*(Math.min(ch,4)>2?88:120)
        return c2(ix,344,18,BG2,CH2,1.2)
          +c2(ix,344,8,CH2,BG2,0.32)
          +tx2(ix-7,349,'1',5,MU2)
          +tx2(ix+2,340,'2',5,LT2)
          +tx2(ix+6,350,'3',5,MU2)
          +tx2(ix,372,'IN '+(i+1),8.5,CH2)
          +tx2(ix,385,'XLR',7,MU2)
      }).join('')

      // Speaker outputs
      +tx2(W-168,316,'OUTPUTS',7.5,LT2)
      +Array.from({length:Math.min(ch,4)},(_:unknown,i:number)=>{
        const ox=W-162+(i-Math.min(ch,4)/2)*82+41
        return r2(ox-18,326,36,26,BG2,LT2,1,3)
          +tx2(ox,360,'OUT '+(i+1),8.5,LT2)
          +tx2(ox,375,isLR?'SPKN':'+  −',8,MU2)
      }).join('')

      // Bridge wiring note or general instructions
      +(isLR
        ? r2(28,408,W-56,90,BG2,'rgba(201,169,110,0.11)',0.3,3)
          +tx2(W/2,428,'BRIDGE WIRING:  CH1(+) and CH2(−) = 1 mono channel',9,LT2)
          +tx2(W/2,448,'CH3(+) and CH4(−) = 2nd mono channel',9,LT2)
          +tx2(W/2,468,'XLR: Pin 1=GND  ·  Pin 2=Hot(+)  ·  Pin 3=Cold(−)',8.5,MU2)
        : r2(28,408,W-56,72,BG2,'rgba(201,169,110,0.07)',0.3,3)
          +tx2(W/2,430,'Connect all speakers before powering on.',9.5,LT2)
          +tx2(W/2,450,'Load XSCACE factory DSP preset via USB.',9.5,LT2)
          +tx2(W/2,468,'Adjust crossover, delay, EQ for your room.',8.5,MU2))

      +`<text x="${W/2}" y="36" text-anchor="middle" fill="${LT2}" font-size="16" font-family="Cormorant Garamond,serif" font-weight="300">${P.productName||'DSP AMPLIFIER'}</text>`
    )
  }

  // ============================================================
  // STREAMING AMP / STREAMER
  // ============================================================
  if(it==='streaming-amplifier'||it==='streamer'){
    const isA=it==='streaming-amplifier'
    return mksvg(
      tx2(W/2,16,isA?'AIR AMP  ·  STREAMING AMPLIFIER':'AIR MINI  ·  WIRELESS STREAMER',9,MU2)

      // Device body
      +r2(86,54,308,124,WL2,CH2,1.5,6)
      +`<text x="${W/2}" y="108" text-anchor="middle" fill="${LT2}" font-size="20" font-family="Cormorant Garamond,serif" font-weight="300">${P.productName||''}</text>`
      +tx2(W/2,128,'AirPlay 2  ·  Bluetooth 5.0  ·  Spotify Connect',8.5,MU2)
      +c2(106,116,7,CH2,BG2,0.55)
      +tx2(106,134,'STATUS',6.5,CH2)

      // Wi-Fi symbol
      +[32,23,14].map((r2r:number,i:number)=>
        `<path d="M ${240-r2r} ${80+r2r*0.5} A ${r2r} ${r2r} 0 0 1 ${240+r2r} ${80+r2r*0.5}" fill="none" stroke="${CH2}" stroke-width="${1.3-i*0.2}" stroke-linecap="round" opacity="${0.95-i*0.2}"/>`).join('')
      +c2(240,90,5,CH2,BG2,0.32)

      // App icon
      +r2(26,94,56,98,WL2,CH2,1.1,6)
      +r2(32,105,44,72,BG2,'rgba(201,169,110,0.17)',0.3,2)
      +c2(54,184,5,CH2,BG2,0.35)
      +tx2(54,118,'XSCACE',8,CH2)
      +tx2(54,130,'APP',8,MU2)
      +tx2(54,148,'App Store',7.5,LT2)
      +tx2(54,162,'Google Play',7.5,LT2)
      +ln(82,145,90,126,CH2,0.7,'2,2')

      // Rear panel
      +r2(86,202,308,174,'#0c0c0a',CH2,0.7,3)
      +tx2(W/2,218,'REAR PANEL',8,MU2)

      +(isA
        ? // Speaker terminals — well spaced
          c2(124,254,15,CH2,BG2,0.55)+c2(148,254,15,BG2,CH2,0.9)
          +tx2(124,280,'+',11,CH2)+tx2(148,280,'−',11,LT2)
          +tx2(136,296,'SPK L',8.5,LT2)
          +c2(194,254,15,CH2,BG2,0.55)+c2(218,254,15,BG2,CH2,0.9)
          +tx2(194,280,'+',11,CH2)+tx2(218,280,'−',11,LT2)
          +tx2(206,296,'SPK R',8.5,LT2)
          +c2(272,254,13,BG2,CH2,0.8)+c2(272,254,5,CH2,BG2,0.35)
          +tx2(272,280,'SUB',8.5,CH2)+tx2(272,296,'OUT',7.5,MU2)
          +c2(324,254,13,BG2,LT2,0.7)
          +tx2(324,280,'DC',8.5,LT2)+tx2(324,296,'24V',7.5,MU2)
        : c2(146,254,14,BG2,CH2,0.9)+c2(146,254,5,CH2,BG2,0.4)
          +tx2(146,280,'LINE OUT',8,CH2)+tx2(146,296,'RCA',7.5,MU2)
          +c2(208,254,12,BG2,LT2,0.7)
          +tx2(208,280,'SPDIF',7.5,LT2)
          +r2(244,244,40,22,BG2,LT2,0.6,1)+tx2(264,280,'HDMI ARC',7.5,LT2)
          +c2(328,254,12,BG2,LT2,0.6)+tx2(328,280,'DC 19V',7.5,LT2))

      // Step list — well spaced
      +r2(26,396,W-52,150,BG2,'rgba(201,169,110,0.07)',0.3,3)
      +(isA
        ? [['1','Connect speakers to + / − terminals',''],
           ['2','Optionally connect sub to SUB OUT',''],
           ['3','Plug DC adapter — power on',''],
           ['4','Download XSCACE Controller App','App Store / Google Play'],
           ['5','Follow in-app Wi-Fi setup wizard',''],
           ['6','Stream via AirPlay / Spotify / BT','']]
        : [['1','Connect Line Out (RCA) to amplifier',''],
           ['2','Plug DC 19V adapter — power on',''],
           ['3','Download XSCACE Controller App','App Store / Google Play'],
           ['4','Follow in-app Wi-Fi setup wizard',''],
           ['5','Select Air Mini as output in streaming app','']]
      ).map(([n,a,b],i)=>step(42,414+i*24,parseInt(n as string),(a as string)||'',(b as string)||'')).join('')
    )
  }

  return mksvg(tx2(W/2,H/2,'DIAGRAM N/A',10,MU2))
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
