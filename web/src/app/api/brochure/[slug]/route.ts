// web/src/app/api/brochure/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

// ── Utilities ─────────────────────────────────────────────────────────────────
function sanityImgUrl(ref: string, w = 800) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=75`
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

// ── Product type detection ─────────────────────────────────────────────────────
type ProductKind = 'speaker' | 'subwoofer' | 'amplifier' | 'streamer'
function detectKind(P: any): ProductKind {
  const cat: string = P.catSlug || ''
  const series: string = (P.series || '').toLowerCase()
  if (cat === 'subwoofer-series' || series.includes('subwoofer')) return 'subwoofer'
  if (cat === 'amplifier-series' || series.includes('amplifier') || series.includes('xylem')) {
    if (!P.powerRmsW && !P.sensitivityDb) return 'streamer'
    return 'amplifier'
  }
  return 'speaker'
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string,string> = {
  'black':'#111','anthracite':'#111','jet black':'#111','matte black':'#111',
  'white':'#F2F0EC','matte white':'#F2F0EC','pure white':'#F4F4F4',
  'champagne':'#C9A96E','matte champagne':'#C9A96E',
  'slate':'#4A4A52','stainless steel':'#9BA4A8',
}
function colorTags(colorsStandard: string, customRal: boolean, marine: boolean): string {
  const swatches = (colorsStandard||'').split(',').map((c:string)=>c.trim()).filter(Boolean)
    .map((name:string) => `<div class="htag"><span class="htsw" style="background:${COLOR_MAP[name.toLowerCase()]||'#555'}"></span>${name}</div>`).join('')
  const ral = customRal ? `<div class="htag htag-ral"><svg width="10" height="10" viewBox="0 0 20 20"><path d="M10 10 L10 1 A9 9 0 0 1 18 5.7 Z" fill="#e63946"/><path d="M10 10 L18 5.7 A9 9 0 0 1 18 14.3 Z" fill="#f4a261"/><path d="M10 10 L18 14.3 A9 9 0 0 1 10 19 Z" fill="#2a9d8f"/><path d="M10 10 L10 19 A9 9 0 0 1 2 14.3 Z" fill="#457b9d"/><path d="M10 10 L2 14.3 A9 9 0 0 1 2 5.7 Z" fill="#6a4c93"/><path d="M10 10 L2 5.7 A9 9 0 0 1 10 1 Z" fill="#f1c453"/><circle cx="10" cy="10" r="4" fill="#0a0a0a"/></svg>Custom RAL</div>` : ''
  const mar = marine ? `<div class="htag htag-marine"><svg width="8" height="11" viewBox="0 0 14 18" stroke="#c9a96e" fill="rgba(201,169,110,0.2)" stroke-width="1.2"><path d="M7 1 C7 1 1 8 1 12 C1 15.3 3.7 17 7 17 C10.3 17 13 15.3 13 12 C13 8 7 1 7 1Z"/></svg>Marine</div>` : ''
  return swatches + ral + mar
}
function techRow(badges: string[]): string {
  return badges.map(badge => {
    const img = techIconB64(badge)
    return `<div class="ti">${img?`<img src="${img}" class="timg">`:`<div class="tph"></div>`}<div class="tn">${badge.toUpperCase()}</div></div>`
  }).join('')
}
function specRow(l: string, v: string): string {
  return `<div class="sr"><span class="sl">${l}</span><span class="sv">${v}</span></div>`
}
function galleryGrid(imgs: string[]): string {
  return [0,1,2,3].map(i =>
    imgs[i] ? `<div class="gc"><img src="${imgs[i]}" class="gi"></div>` : `<div class="gc ge"></div>`
  ).join('')
}

// ── Shared CSS ─────────────────────────────────────────────────────────────────
function buildCss(fontCss: string): string {
  return `${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}
/* bars */
.cb{position:absolute;left:0;right:0;height:5px;background:#c9a96e;z-index:10}
.ct{top:0}.cbb{bottom:0}
/* page header */
.ph{position:absolute;top:8px;left:36px;right:36px;display:flex;justify-content:space-between;align-items:center;z-index:5}
.phl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phr{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835}
/* cover */
.ch{position:absolute;right:0;top:0;width:58%;height:100%;object-fit:cover}
.cf{position:absolute;inset:0;background:linear-gradient(to right,#090909 38%,rgba(9,9,9,.5) 62%,transparent 86%)}
.cl{position:absolute;left:0;top:0;bottom:0;width:54%;padding:40px 44px;display:flex;flex-direction:column}
.cw{font-family:'MagmaWave','DM Sans',sans-serif;font-size:20px;letter-spacing:.04em;color:#eeebe5}
.cs{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.22em;color:#7a776f;margin-top:4px;text-transform:uppercase;margin-bottom:auto}
.cn{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:64px;color:#eeebe5;line-height:1;margin-top:auto}
.ct2{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-style:italic;color:#c9a96e;margin-top:4px}
.cd{font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;color:#7a776f;line-height:1.6;margin-top:10px;max-width:260px}
.cr{height:1px;background:rgba(201,169,110,.3);margin:16px 0}
.cst{display:flex;gap:20px;margin-bottom:14px}
.csi{display:flex;flex-direction:column}
.csv{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;color:#c9a96e;line-height:1}
.csl{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.18em;color:#7a776f;margin-top:3px;text-transform:uppercase}
.trow{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.ti{display:flex;flex-direction:column;align-items:center;gap:3px;opacity:.75}
.timg{width:22px;height:22px;object-fit:contain}
.tph{width:22px;height:22px;background:rgba(201,169,110,.12);border:.4px solid rgba(201,169,110,.3)}
.tn{font-family:'DM Mono',monospace;font-size:4.5px;letter-spacing:.08em;color:#c9a96e;text-align:center;max-width:32px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:auto}
.htag{display:flex;align-items:center;gap:4px;font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;border:.4px solid rgba(201,169,110,.2);padding:3px 7px;border-radius:2px}
.htsw{width:8px;height:8px;border-radius:50%;border:.4px solid rgba(255,255,255,.15);flex-shrink:0}
.htag-ral{border-color:rgba(201,169,110,.4);color:#c9a96e}
.htag-marine{border-color:rgba(91,141,184,.4);color:#5b8db8}
.cft{display:flex;justify-content:space-between;margin-top:12px;border-top:.4px solid rgba(201,169,110,.15);padding-top:8px}
.cff{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835;letter-spacing:.1em;text-transform:uppercase}
/* specs page */
.sl2{position:absolute;top:28px;left:0;right:0;bottom:0;display:flex;padding:0 36px}
.sleft{flex:1;padding:8px 20px 12px 0;border-right:.4px solid rgba(201,169,110,.1);display:flex;flex-direction:column}
.sh{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#eeebe5;margin-bottom:8px}
.sg{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:3px;margin:7px 0 3px}
.sr{display:flex;justify-content:space-between;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.sl{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.sv{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right}
.mg{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:3px;margin:7px 0 5px}
.mcs{display:flex;gap:6px;margin-top:2px}
.mc{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);display:flex;flex-direction:column;align-items:center;overflow:hidden;position:relative;height:60px}
.mi{width:100%;height:calc(100% - 20px);object-fit:cover;position:absolute;top:0}
.mp{width:100%;height:calc(100% - 20px);display:flex;align-items:center;justify-content:center;position:absolute;top:0}
.ml{position:absolute;bottom:0;height:20px;width:100%;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:5.5px;letter-spacing:.1em;color:#7a776f;background:#090909;border-top:.3px solid rgba(201,169,110,.08)}
.sright{flex:0 0 47%;margin-left:4%;display:flex;flex-direction:column;gap:5px}
.sri{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex;align-items:center;justify-content:center}
.sri img{width:100%;height:100%}
.sri.cv img{object-fit:cover}
.sri.cn2 img{object-fit:contain}
/* feature list (amp/streamer page 2) */
.feat-body{position:absolute;top:28px;left:0;right:0;bottom:0;padding:8px 36px 12px;display:flex;flex-direction:column}
.feat-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#eeebe5;margin-bottom:12px}
.feat-cols{display:flex;gap:20px;flex:1}
.feat-col{flex:1}
.feat-sg{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.18);padding-bottom:3px;margin:7px 0 3px}
.feat-sg:first-child{margin-top:0}
.feat-row{display:flex;justify-content:space-between;padding:2.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.feat-l{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.feat-v{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right;max-width:55%}
.feat-img-col{flex:0 0 44%;display:flex;flex-direction:column;gap:6px}
.feat-img{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex;align-items:center;justify-content:center}
.feat-img img{width:100%;height:100%;object-fit:contain}
.feat-img.cover img{object-fit:cover}
/* gallery */
.gp{padding:12px 36px 0;height:calc(100% - 36px);display:flex;flex-direction:column}
.gh{font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;color:#eeebe5}
.gr{height:1px;background:rgba(201,169,110,.22);margin:9px 0 8px}
.gg{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;flex:1;min-height:0}
.gc{overflow:hidden;background:#0e0e0c}
.ge{border:.3px solid rgba(201,169,110,.06)}
.gi{width:100%;height:100%;object-fit:cover}
.gf{background:#0e0e0c;border-top:1px solid rgba(201,169,110,.16);padding:10px 0 12px;display:flex;justify-content:space-between;align-items:flex-end;flex-shrink:0}
.gfc{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#eeebe5;font-weight:300}
.gfe{font-family:'DM Mono',monospace;font-size:7.5px;color:#c9a96e;letter-spacing:.07em;margin-top:3px}
.gfb{font-family:'DM Mono',monospace;font-size:6.5px;color:#3a3835;letter-spacing:.1em;text-transform:uppercase}
`
}

// ── Cover page — shared ────────────────────────────────────────────────────────
function buildCoverPage(P: any, hero: string, stats: {v:string,l:string}[], badges: string[], coverImg: string): string {
  const tags = colorTags(P.colorsStandard||'', !!P.customRalAvailable, !!P.marineTreatable)
  const icons = techRow(badges)
  const statHtml = stats.filter(Boolean).map(s =>
    `<div class="csi"><div class="csv">${s.v}</div><div class="csl">${s.l}</div></div>`
  ).join('')
  return `${coverImg ? `<div class="page" style="padding:0;margin:0"><img src="${coverImg}" style="width:100%;height:100%;object-fit:cover;display:block"></div>` : ''}

<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  ${hero ? `<img src="${hero}" class="ch">` : `<div class="ch" style="background:#0e0e0c"></div>`}
  <div class="cf"></div>
  <div class="cl">
    <div class="cw">XSCACE</div>
    <div class="cs">Size Defying Sound</div>
    <div class="cn">${P.productName}</div>
    <div class="ct2">${P.tagline||''}</div>
    <div class="cd">${P.shortDescription||''}</div>
    <div class="cr"></div>
    <div class="cst">${statHtml}</div>
    ${icons ? `<div class="trow">${icons}</div>` : ''}
    <div class="tags">${tags}</div>
    <div class="cft">
      <span class="cff">${P.series||''} · ${P.skuBase||''}</span>
      <span class="cff">XSCACE.COM</span>
    </div>
  </div>
</div>`
}

// ── Gallery page — shared ──────────────────────────────────────────────────────
function buildGalleryPage(P: any, galleryImgs: string[], backImg: string, pageNum: string): string {
  return `<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${P.productName.toUpperCase()}</span>
    <span class="phr">${pageNum}</span>
  </div>
  <div class="gp">
    <div class="gh">In context.</div>
    <div class="gr"></div>
    <div class="gg">${galleryGrid(galleryImgs)}</div>
    <div class="gf">
      <div>
        <div class="gfc">Enquire or specify at xscace.com</div>
        <div class="gfe">support@xscace.com</div>
      </div>
      <div class="gfb">XSCACE · Size Defying Sound</div>
    </div>
  </div>
</div>
${backImg ? `<div class="page" style="padding:0;margin:0;page-break-after:auto"><img src="${backImg}" style="width:100%;height:100%;object-fit:cover;display:block"></div>` : ''}`
}

// ── PAGE 2: Speaker spec + mounting ───────────────────────────────────────────
function buildSpeakerSpecPage(P: any, hero: string, life0: string, mountCards: string): string {
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
  if (P.heightMm)  sP['H × W × D'] = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
  if (P.weightKg)  sP['Weight']     = `${P.weightKg} kg`
  if (P.housingMaterial)      sP['Housing']   = P.housingMaterial
  if (P.grilleMaterial)       sP['Grille']    = P.grilleMaterial
  if (P.ipRating)             sP['IP Rating'] = P.ipRating
  if (P.speakerWireConnector) sP['Connector'] = P.speakerWireConnector

  return `<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${P.productName.toUpperCase()}</span>
    <span class="phr">02 — 03</span>
  </div>
  <div class="sl2">
    <div class="sleft">
      <div class="sh">Specifications</div>
      <div class="sg">Acoustic</div>${Object.entries(sA).map(([l,v])=>specRow(l,v)).join('')}
      <div class="sg">Physical</div>${Object.entries(sP).map(([l,v])=>specRow(l,v)).join('')}
      ${mountCards ? `<div class="mg">Mounting Options</div><div class="mcs">${mountCards}</div>` : ''}
    </div>
    <div class="sright">
      <div class="sri cn2" style="flex:1.2">${hero?`<img src="${hero}">`:''}
      </div>
      <div class="sri cv" style="flex:1">${life0?`<img src="${life0}">`:''}
      </div>
    </div>
  </div>
</div>`
}

// ── PAGE 2: Subwoofer spec ─────────────────────────────────────────────────────
function buildSubwooferSpecPage(P: any, hero: string, life0: string): string {
  const sA: Record<string,string> = {}
  if (P.powerRmsW)    sA['Power RMS']   = `${P.powerRmsW}W`
  if (P.powerPeakW)   sA['Power Peak']  = `${P.powerPeakW}W`
  if (P.sensitivityDb) sA['Sensitivity'] = `${P.sensitivityDb} dB`
  if (P.impedanceOhms) sA['Impedance']  = `${P.impedanceOhms}Ω`
  if (P.splMaxDb)      sA['Max SPL']    = `${P.splMaxDb} dB`
  if (P.freqHighHz)    sA['Frequency']  = `${P.freqLowHz}Hz – ${P.freqHighHz}Hz ${P.freqQualifier||''}`.trim()
  if (P.driverDescription) sA['Driver'] = P.driverDescription
  if (P.crossoverType) sA['Crossover']  = P.crossoverType
  if (P.thdN)          sA['THD+N']      = P.thdN

  const sP: Record<string,string> = {}
  if (P.heightMm)  sP['H × W × D'] = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
  if (P.weightKg)  sP['Weight']     = `${P.weightKg} kg`
  if (P.housingMaterial) sP['Housing'] = P.housingMaterial
  if (P.ipRating)        sP['IP Rating'] = P.ipRating
  if (P.mountingMethod)  sP['Mounting']  = P.mountingMethod
  if (P.powerType === 'Powered') {
    if (P.inputs)  sP['Inputs']  = P.inputs
    if (P.outputs) sP['Outputs'] = P.outputs
  }

  return `<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${P.productName.toUpperCase()}</span>
    <span class="phr">02 — 03</span>
  </div>
  <div class="sl2">
    <div class="sleft">
      <div class="sh">Specifications</div>
      <div class="sg">Acoustic</div>${Object.entries(sA).map(([l,v])=>specRow(l,v)).join('')}
      <div class="sg">Physical</div>${Object.entries(sP).map(([l,v])=>specRow(l,v)).join('')}
    </div>
    <div class="sright">
      <div class="sri cn2" style="flex:1.2">${hero?`<img src="${hero}">`:''}
      </div>
      <div class="sri cv" style="flex:1">${life0?`<img src="${life0}">`:''}
      </div>
    </div>
  </div>
</div>`
}

// ── PAGE 2: Amplifier features ─────────────────────────────────────────────────
function buildAmplifierSpecPage(P: any, hero: string, life0: string): string {
  const chMatch = (P.tagline||P.productName||'').match(/(\d+)-?[Cc]h/)
  const channels = chMatch ? parseInt(chMatch[1]) : P.channelCount || null
  const pwrPerCh = channels && P.powerRmsW ? Math.round(P.powerRmsW / channels) : null

  const elec: [string,string][] = [
    ['Total Power', P.powerRmsW ? `${P.powerRmsW}W` : ''],
    ['Per Channel', pwrPerCh ? `${pwrPerCh}W` : ''],
    ['Channels', channels ? String(channels) : ''],
    ['Impedance', P.impedanceOhms ? `${P.impedanceOhms}Ω` : ''],
    ['Class', 'Class D'],
    ['THD+N', P.thdN || ''],
    ['SNR', P.snrDb || ''],
  ].filter(([,v])=>v) as [string,string][]

  const dsp: [string,string][] = [
    ['DSP', P.hasDsp ? 'Built-In' : 'None'],
    ['Processor', P.dspProcessorSpec || ''],
    ['Software', P.desktopSoftwareName || ''],
    ['Comms', P.communicationPorts || ''],
  ].filter(([,v])=>v) as [string,string][]

  const conn: [string,string][] = [
    ['Inputs', P.inputs || ''],
    ['Outputs', P.outputs || ''],
    ['Streaming', P.streamingProtocols || (P.hasStreamer ? 'AirPlay 2, BT 5.0, Spotify Connect' : '')],
  ].filter(([,v])=>v) as [string,string][]

  const phys: [string,string][] = [
    ['Dimensions', P.heightMm ? `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm` : ''],
    ['Weight', P.weightKg ? `${P.weightKg} kg` : ''],
    ['Housing', P.housingMaterial || ''],
  ].filter(([,v])=>v) as [string,string][]

  return `<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${P.productName.toUpperCase()}</span>
    <span class="phr">02 — 03</span>
  </div>
  <div class="feat-body">
    <div class="feat-title">Features &amp; Specifications</div>
    <div class="feat-cols">
      <div class="feat-col">
        <div class="feat-sg">Amplifier</div>
        ${elec.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
        <div class="feat-sg">DSP</div>
        ${dsp.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
        <div class="feat-sg">Connectivity</div>
        ${conn.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
        <div class="feat-sg">Physical</div>
        ${phys.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
      </div>
      <div class="feat-img-col">
        <div class="feat-img">${hero?`<img src="${hero}">`:''}
        </div>
        ${life0 ? `<div class="feat-img cover"><img src="${life0}"></div>` : ''}
      </div>
    </div>
  </div>
</div>`
}

// ── PAGE 2: Streamer features ──────────────────────────────────────────────────
function buildStreamerSpecPage(P: any, hero: string, life0: string): string {
  const proto: [string,string][] = [
    ['Wireless', 'AirPlay 2, Spotify Connect, BT 5.0 APTX-HD'],
    ['Digital', 'SPDIF Optical, USB Audio, DAC'],
    ['Network', 'Wi-Fi 802.11 a/b/g/n/ac'],
  ]
  const conn: [string,string][] = [
    ['Inputs', P.inputs || ''],
    ['Outputs', P.outputs || ''],
  ].filter(([,v])=>v) as [string,string][]

  const phys: [string,string][] = [
    ['Dimensions', P.heightMm ? `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm` : ''],
    ['Weight', P.weightKg ? `${P.weightKg} kg` : ''],
    ['Housing', P.housingMaterial || ''],
  ].filter(([,v])=>v) as [string,string][]

  return `<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${P.productName.toUpperCase()}</span>
    <span class="phr">02 — 03</span>
  </div>
  <div class="feat-body">
    <div class="feat-title">Features &amp; Connectivity</div>
    <div class="feat-cols">
      <div class="feat-col">
        <div class="feat-sg">Streaming Protocols</div>
        ${proto.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
        <div class="feat-sg">Connectivity</div>
        ${conn.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
        <div class="feat-sg">Physical</div>
        ${phys.map(([l,v])=>`<div class="feat-row"><span class="feat-l">${l}</span><span class="feat-v">${v}</span></div>`).join('')}
      </div>
      <div class="feat-img-col">
        <div class="feat-img">${hero?`<img src="${hero}">`:''}
        </div>
        ${life0 ? `<div class="feat-img cover"><img src="${life0}"></div>` : ''}
      </div>
    </div>
  </div>
</div>`
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  try {
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription, series, skuBase,
      "catSlug": category->slug.current,
      colorsStandard, mountingMethods, marineTreatable, customRalAvailable, ipRating,
      sensitivityDb, powerRmsW, powerPeakW, impedanceOhms, splMaxDb, thdN,
      freqLowHz, freqHighHz, freqQualifier, directivityHDeg, directivityVDeg,
      heightMm, widthMm, depthMm, weightKg, driverDescription, crossoverType,
      housingMaterial, grilleMaterial, speakerWireConnector, mountingMethod,
      powerType, hasDsp, hasStreamer, dspProcessorSpec, desktopSoftwareName,
      communicationPorts, inputs, outputs, streamingProtocols, channelCount,
      snrDb, proprietaryTechBadges,
      heroImage, "gallery": galleryImages[0..2], "lifestyle": lifestyleImages[0..4],
      "accessories": accessories[]->{ _id, name, category, heroImage, lifestyleImage },
      brochureRef, brochureHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const kind = detectKind(P)

    // Cache — include kind so type changes bust cache
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.depthMm}${kind}v6`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.brochureRef && P.brochureHash === h) {
      const cdn = fileCdn(P.brochureRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) return NextResponse.redirect(cdn, 302)
    }

    // Fetch images
    const hero  = await imgB64(getRef(P.heroImage), 700)
    const lives = await Promise.all((P.lifestyle || []).slice(0,4).map((l:any) => imgB64(getRef(l), 550)))
    const gals  = await Promise.all((P.gallery   || []).slice(0,3).map((g:any) => imgB64(getRef(g), 450)))
    const galleryImgs = [...lives, ...gals].filter(Boolean).slice(0,4)

    const fontCss  = loadFontCss()
    const css      = buildCss(fontCss)
    const coverImg = publicFileB64('brochure-cover.png')
    const backImg  = publicFileB64('brochure-back.png')

    const badges = (P.proprietaryTechBadges||'').split(',')
      .map((b:string) => b.trim().replace(/™/g,'').replace(/\s+/g,' ').trim()).filter(Boolean)

    // Cover stats by type
    let coverStats: {v:string,l:string}[] = []
    if (kind === 'speaker') {
      coverStats = [
        P.powerRmsW    ? {v:`${P.powerRmsW}W`,       l:'Power'}       : null,
        P.sensitivityDb? {v:`${P.sensitivityDb}dB`,   l:'Sensitivity'} : null,
        P.impedanceOhms? {v:`${P.impedanceOhms}Ω`,   l:'Impedance'}   : null,
        P.depthMm      ? {v:`${P.depthMm}mm`,         l:'Depth'}       : null,
      ].filter(Boolean) as {v:string,l:string}[]
    } else if (kind === 'subwoofer') {
      coverStats = [
        P.powerRmsW    ? {v:`${P.powerRmsW}W`,        l:'Power RMS'}   : null,
        P.splMaxDb     ? {v:`${P.splMaxDb}dB`,         l:'Max SPL'}     : null,
        P.freqLowHz    ? {v:`${P.freqLowHz}Hz`,        l:'Freq Low'}    : null,
        P.impedanceOhms? {v:`${P.impedanceOhms}Ω`,    l:'Impedance'}   : null,
      ].filter(Boolean) as {v:string,l:string}[]
    } else if (kind === 'amplifier') {
      const ch = P.channelCount || ((P.tagline||'').match(/(\d+)-?[Cc]h/)||[])[1]
      coverStats = [
        P.powerRmsW    ? {v:`${P.powerRmsW}W`,        l:'Total Power'} : null,
        ch             ? {v:String(ch),                l:'Channels'}    : null,
        P.impedanceOhms? {v:`${P.impedanceOhms}Ω`,   l:'Load'}        : null,
        P.hasDsp       ? {v:'Built-In',               l:'DSP'}         : {v:'None',l:'DSP'},
      ].filter(Boolean) as {v:string,l:string}[]
    } else {
      // streamer
      coverStats = [
        {v:'AirPlay 2',                         l:'Protocol'},
        {v:'BT 5.0',                            l:'Bluetooth'},
        P.widthMm ? {v:`${P.widthMm}mm`,        l:'Width'}      : null,
        P.weightKg? {v:`${P.weightKg}kg`,       l:'Weight'}     : null,
      ].filter(Boolean) as {v:string,l:string}[]
    }

    // Speaker-only: mounting images
    let mountCards = ''
    if (kind === 'speaker') {
      const inWallProduct: any = await sanity.fetch(`*[_id=="prod-${slug.split('-')[0]}-ic"][0]{"lifestyle": lifestyleImages[0]}`)
      const mountImages: Record<string,string> = {}
      for (const acc of (P.accessories || [])) {
        const n = (acc.name||'').toLowerCase()
        if (n.includes('corner'))
          mountImages['corner'] = await imgB64(getRef(acc.lifestyleImage)||getRef(acc.heroImage), 550)
        else if (n.includes('floor')||n.includes('stand'))
          mountImages['floorstand'] = await imgB64(getRef(acc.lifestyleImage)||getRef(acc.heroImage), 550)
      }
      if (getRef(inWallProduct?.lifestyle)) mountImages['in-wall'] = await imgB64(getRef(inWallProduct.lifestyle), 550)
      mountCards = [{key:'corner',label:'Corner Mount'},{key:'floorstand',label:'Floorstand'},{key:'in-wall',label:'In-Wall'}]
        .map(m => {
          const img = mountImages[m.key]
          return `<div class="mc">
            ${img ? `<img src="${img}" class="mi">` : `<div class="mp"><svg viewBox="0 0 40 60" stroke="#c9a96e" fill="none" stroke-width="1"><rect x="14" y="4" width="12" height="40" rx="1"/><line x1="20" y1="4" x2="20" y2="1"/><line x1="16" y1="1" x2="24" y2="1"/><line x1="6" y1="52" x2="34" y2="52"/></svg></div>`}
            <div class="ml">${m.label.toUpperCase()}</div>
          </div>`
        }).join('')
    }

    // Build pages by type
    let page2 = ''
    if      (kind === 'speaker')    page2 = buildSpeakerSpecPage(P, hero, lives[0]||'', mountCards)
    else if (kind === 'subwoofer')  page2 = buildSubwooferSpecPage(P, hero, lives[0]||'')
    else if (kind === 'amplifier')  page2 = buildAmplifierSpecPage(P, hero, lives[0]||'')
    else                            page2 = buildStreamerSpecPage(P, hero, lives[0]||'')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
${buildCoverPage(P, hero, coverStats, badges, coverImg)}
${page2}
${buildGalleryPage(P, galleryImgs, backImg, '03 — 03')}
</body></html>`

    // Puppeteer
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
    await page.setViewport({ width: 1587, height: 1123, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.emulateMediaType('print')
    const pdf = Buffer.from(await page.pdf({
      width: '297mm', height: '210mm', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    }))
    await browser.close()

    // Cache to Sanity
    if (process.env.SANITY_API_TOKEN && pdf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g,'_')}_Brochure.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          { method:'POST', headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/pdf' }, body:pdf }
        )
        if (up.ok) {
          const {document:doc} = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method:'POST',
            headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/json' },
            body: JSON.stringify({mutations:[{patch:{id:P._id,set:{brochureRef:doc._id,brochureHash:h,brochure:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})
          })
        }
      } catch(e){ console.error('[brochure] cache failed',e) }
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="XSCACE_${slug}_Brochure.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-cache',
      }
    })
  } catch(err:any) {
    console.error('[brochure]', err)
    return NextResponse.json({error:err?.message}, {status:500})
  }
}
