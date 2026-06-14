// web/src/app/api/brochure/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })
const anthropic = new Anthropic()

// ── Image helpers ─────────────────────────────────────────────────────────────
function sanityImgUrl(ref: string, w = 800, crop?: any, hotspot?: any) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  let url = `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=70`
  if (crop && hotspot) {
    // Apply crop/hotspot so Sanity returns the correct region
    url += `&rect=${Math.round(crop.left * parseInt(dims))},${Math.round(crop.top * parseInt(dims.split('x')[1]))},${Math.round((1 - crop.left - crop.right) * parseInt(dims))},${Math.round((1 - crop.top - crop.bottom) * parseInt(dims.split('x')[1]))}`
  }
  return url
}

async function imgB64(ref: string | null, w = 800, crop?: any, hotspot?: any): Promise<string> {
  if (!ref) return ''
  try {
    const r = await fetch(sanityImgUrl(ref, w, crop, hotspot))
    if (!r.ok) return ''
    const buf = Buffer.from(await r.arrayBuffer())
    const ct = r.headers.get('content-type') || 'image/jpeg'
    return `data:${ct};base64,${buf.toString('base64')}`
  } catch { return '' }
}

function getRef(o: any): string { return o?.asset?._ref || '' }

function fileCdn(id: string) {
  const b = id.replace('file-', ''), i = b.lastIndexOf('-')
  return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${b.slice(0,i)}.${b.slice(i+1)}`
}

// Load a file from public/ as base64 data URI
function publicFileB64(relPath: string, mime = 'image/png'): string {
  try {
    const p = path.join(process.cwd(), 'public', relPath)
    if (!fs.existsSync(p)) return ''
    const b64 = fs.readFileSync(p).toString('base64')
    return `data:${mime};base64,${b64}`
  } catch { return '' }
}

// Load MagmaWave font from public/fonts/
function magmaWaveB64(): string {
  return publicFileB64('fonts/MagmaWave.otf', 'font/otf')
}

// Tech icon PNGs from public/tech-icons/
const TECH_ICON_FILES: Record<string, string> = {
  'psysculpt':           'tech-icons/psysculpt.png',
  'xs-flow':             'tech-icons/xs-flow.png',
  'nano resonance':      'tech-icons/nano-resonance.png',
  'precisionxover array':'tech-icons/precisionxover-array.png',
  'aeroframe chassis':   'tech-icons/aeroframe-chassis.png',
  'powerdense dynamics': 'tech-icons/powerdense-dynamics.png',
}

function coverPageB64(type: 'cover' | 'back'): string {
  return publicFileB64(type === 'cover' ? 'brochure-cover.png' : 'brochure-back.png')
}

function techIconB64(badgeName: string): string {
  const key = badgeName.toLowerCase().replace(/™/g,'').replace(/\s+/g,' ').trim()
  for (const [k, file] of Object.entries(TECH_ICON_FILES)) {
    if (key.includes(k) || k.includes(key.split(' ')[0])) {
      return publicFileB64(file)
    }
  }
  return ''
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  try {
    // 1. Fetch product
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription, series, skuBase,
      colorsStandard, mountingMethods, marineTreatable, customRalAvailable, ipRating,
      sensitivityDb, powerRmsW, powerPeakW, impedanceOhms, splMaxDb, thdN,
      freqLowHz, freqHighHz, freqQualifier, directivityHDeg, directivityVDeg,
      heightMm, widthMm, depthMm, weightKg, driverDescription, crossoverType,
      housingMaterial, grilleMaterial, speakerWireConnector, proprietaryTechBadges,
      heroImage, "gallery": galleryImages[0..2], "lifestyle": lifestyleImages[0..4],
      "accessories": accessories[]->{
        _id, name, category, heroImage, lifestyleImage
      },
      brochureRef, brochureHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // 2. Cache check
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.depthMm}v4`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.brochureRef && P.brochureHash === h) {
      const cdn = fileCdn(P.brochureRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) return NextResponse.redirect(cdn, 302)
    }

    // 3. Fetch hero + lifestyle images
    const hero  = await imgB64(getRef(P.heroImage), 700)
    const lives = await Promise.all((P.lifestyle || []).slice(0, 4).map((l: any) => imgB64(getRef(l), 550)))
    const gals  = await Promise.all((P.gallery   || []).slice(0, 3).map((g: any) => imgB64(getRef(g), 450)))

    // 4. Mounting option images — Corner, Floorstand, In-Wall each from correct source
    // Corner Mount accessory (93147ca7), Floorstand accessory (a7c4659b),
    // In-Wall = prod-cane-ic lifestyle image
    const inWallProduct: any = await sanity.fetch(`*[_id=="prod-cane-ic"][0]{"lifestyle": lifestyleImages[0]}`)
    const inWallRef = getRef(inWallProduct?.lifestyle)
    const inWallCrop = inWallProduct?.lifestyle?.crop
    const inWallHotspot = inWallProduct?.lifestyle?.hotspot

    const mountImages: Record<string, string> = {}
    for (const acc of (P.accessories || [])) {
      const n = (acc.name || '').toLowerCase()
      if (n.includes('corner')) {
        mountImages['corner'] = await imgB64(
          getRef(acc.lifestyleImage) || getRef(acc.heroImage), 550,
          acc.lifestyleImage?.crop, acc.lifestyleImage?.hotspot
        )
      } else if (n.includes('floor') || n.includes('stand')) {
        mountImages['floorstand'] = await imgB64(
          getRef(acc.lifestyleImage) || getRef(acc.heroImage), 550,
          acc.lifestyleImage?.crop, acc.lifestyleImage?.hotspot
        )
      }
    }
    if (inWallRef) {
      mountImages['in-wall'] = await imgB64(inWallRef, 550, inWallCrop, inWallHotspot)
    }

    // 5. Load fonts + tech icons from disk
    const magmaFont = magwaFont()
    const magmaCss = magmaFont
      ? `@font-face{font-family:'MagmaWave';src:url('${magmaFont}') format('opentype');}`
      : ''
    const fontCss = loadFontCss() + '\n' + magmaCss

    const fontCss = loadFontCss()
    const coverPage = coverPageB64('cover')
    const backPage  = coverPageB64('back')

    const tech = (P.proprietaryTechBadges || '').split(',')
      .map((b: string) => b.trim().replace(/™/g,'').replace(/\s+/g,' ').trim()).filter(Boolean)

    const techIconsData = tech.map((badge: string) => ({
      name: badge,
      img: techIconB64(badge)
    }))

    // 6. Specs
    const sA: Record<string,string> = {}
    if (P.powerRmsW)     sA['Power RMS']    = `${P.powerRmsW}W`
    if (P.powerPeakW)    sA['Power Peak']   = `${P.powerPeakW}W`
    if (P.sensitivityDb) sA['Sensitivity']  = `${P.sensitivityDb} dB`
    if (P.freqHighHz)    sA['Frequency']    = `${P.freqLowHz}Hz – ${Math.round(P.freqHighHz/1000)}kHz ${P.freqQualifier||''}`.trim()
    if (P.impedanceOhms) sA['Impedance']    = `${P.impedanceOhms}Ω`
    if (P.splMaxDb)      sA['Max SPL']      = `${P.splMaxDb} dB`
    if (P.thdN)          sA['THD+N']        = P.thdN
    if (P.driverDescription) sA['Drivers'] = P.driverDescription
    if (P.crossoverType) sA['Crossover']    = P.crossoverType
    if (P.directivityHDeg) sA['Directivity'] = `${P.directivityHDeg}° H × ${P.directivityVDeg}° V`

    const sP: Record<string,string> = {}
    if (P.heightMm)  sP['H × W × D'] = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
    if (P.weightKg)  sP['Weight']     = `${P.weightKg} kg`
    if (P.housingMaterial)    sP['Housing']   = P.housingMaterial
    if (P.grilleMaterial)     sP['Grille']    = P.grilleMaterial
    if (P.ipRating)           sP['IP Rating'] = P.ipRating
    if (P.speakerWireConnector) sP['Connector'] = P.speakerWireConnector

    const marineTxt = [P.ipRating, P.marineTreatable ? 'Marine-grade treatment' : ''].filter(Boolean).join(' · ') || 'Standard'
    const colors = P.colorsStandard || ''
    const colorMap: Record<string,string> = {
      'black':'#111','anthracite':'#111','white':'#F2F0EC',
      'champagne':'#C9A96E','matte champagne':'#C9A96E','slate':'#4A4A52'
    }
    const swatches = colors.split(',').map((c:string)=>c.trim()).filter(Boolean)
      .map((name:string) => ({ name, hex: colorMap[name.toLowerCase()] || '#555' }))

    // 7. Build mounting cards
    const mountOrder = [
      { key: 'corner',     label: 'Corner Mount' },
      { key: 'floorstand', label: 'Floorstand' },
      { key: 'in-wall',    label: 'In-Wall' },
    ]
    const mountCards = mountOrder.map(m => {
      const img = mountImages[m.key]
      return `<div class="mc">
        ${img ? `<img src="${img}" class="mi">` : `<div class="mp"><svg viewBox="0 0 40 60" stroke="#c9a96e" fill="none" stroke-width="1"><rect x="14" y="4" width="12" height="40" rx="1"/><line x1="20" y1="4" x2="20" y2="1"/><line x1="16" y1="1" x2="24" y2="1"/><line x1="6" y1="52" x2="34" y2="52"/></svg></div>`}
        <div class="ml">${m.label.toUpperCase()}</div>
      </div>`
    }).join('')

    // 8. Tech icons row for page 1
    const techRow = techIconsData.map((t: {name:string;img:string}) => `
      <div class="ti">
        ${t.img ? `<img src="${t.img}" class="timg">` : `<div class="tph"></div>`}
        <div class="tn">${t.name.toUpperCase()}</div>
      </div>`).join('')

    // Hero section style tags (Standard colors / Custom RAL / Marine)
    const colorTagsHtml = swatches.map((s:{name:string,hex:string}) =>
      `<div class="htag"><span class="htsw" style="background:${s.hex}"></span>${s.name}</div>`
    ).join('')
    const ralTagHtml = P.customRalAvailable
      ? `<div class="htag htag-ral"><svg width="10" height="10" viewBox="0 0 20 20"><path d="M10 10 L10 1 A9 9 0 0 1 18 5.7 Z" fill="#e63946"/><path d="M10 10 L18 5.7 A9 9 0 0 1 18 14.3 Z" fill="#f4a261"/><path d="M10 10 L18 14.3 A9 9 0 0 1 10 19 Z" fill="#2a9d8f"/><path d="M10 10 L10 19 A9 9 0 0 1 2 14.3 Z" fill="#457b9d"/><path d="M10 10 L2 14.3 A9 9 0 0 1 2 5.7 Z" fill="#6a4c93"/><path d="M10 10 L2 5.7 A9 9 0 0 1 10 1 Z" fill="#f1c453"/><circle cx="10" cy="10" r="4" fill="#0a0a0a"/></svg>Custom RAL</div>`
      : ''
    const marineTagHtml = P.marineTreatable
      ? `<div class="htag htag-marine"><svg width="8" height="11" viewBox="0 0 14 18" stroke="#c9a96e" fill="rgba(201,169,110,0.2)" stroke-width="1.2"><path d="M7 1 C7 1 1 8 1 12 C1 15.3 3.7 17 7 17 C10.3 17 13 15.3 13 12 C13 8 7 1 7 1Z"/></svg>Marine Treatment</div>`
      : ''

    // Spec rows
    const specRows = (specs: Record<string,string>) => Object.entries(specs).map(([l,v])=>
      `<div class="sr"><span class="sl">${l}</span><span class="sv">${v}</span></div>`).join('')

    // Gallery cells
    const galleryImgs = [...lives, ...gals].filter(Boolean).slice(0,4)
    const galCells = [0,1,2,3].map(i =>
      galleryImgs[i]
        ? `<div class="gc"><img src="${galleryImgs[i]}" class="gi"></div>`
        : `<div class="gc ge"></div>`
    ).join('')

    // 9. Build HTML
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<!-- fonts embedded via @font-face below -->
<style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}
.cb{position:absolute;left:0;right:0;height:5px;background:#c9a96e;z-index:10}
.ct{top:0}.cbb{bottom:0}

/* ── PAGE 1: COVER ── */
.ch{position:absolute;right:0;top:0;width:58%;height:100%;object-fit:cover}
.cf{position:absolute;inset:0;background:linear-gradient(to right,#090909 38%,rgba(9,9,9,.5) 62%,transparent 86%)}
.cl{position:absolute;left:0;top:0;bottom:0;width:52%;padding:40px 44px;display:flex;flex-direction:column}
.cw{font-family:'MagmaWave','DM Sans',sans-serif;font-size:20px;letter-spacing:.04em;color:#eeebe5}
.cs{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.22em;color:#7a776f;margin-top:4px;text-transform:uppercase}
.cn{font-family:'Cormorant Garamond',Georgia,serif;font-size:76px;font-weight:300;color:#eeebe5;margin-top:32px;line-height:1}
.ct2{font-family:'Cormorant Garamond',Georgia,serif;font-size:19px;font-style:italic;color:#c9a96e;margin-top:8px}
.cd{font-family:'DM Sans',sans-serif;font-size:10.5px;color:#7a776f;margin-top:12px;max-width:280px;line-height:1.7}
.cr{height:1px;background:rgba(201,169,110,.35);margin:18px 0;width:240px}

/* Key stats */
.cst{display:flex;gap:24px;margin-bottom:14px}
.csi{display:flex;flex-direction:column}
.csv{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#c9a96e;line-height:1}
.csl{font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.18em;color:#7a776f;margin-top:4px;text-transform:uppercase}

/* Tech icons row on page 1 */
.trow{display:flex;gap:0;margin-top:10px;border-top:.4px solid rgba(201,169,110,.15);padding-top:10px}
.ti{display:flex;flex-direction:column;align-items:center;flex:1;padding:0 2px}
.timg{width:28px;height:24px;object-fit:contain}
.tph{width:28px;height:24px;background:rgba(201,169,110,.1);border-radius:2px}
.tn{font-family:'DM Mono',monospace;font-size:5px;letter-spacing:.1em;color:#7a776f;text-align:center;margin-top:4px;text-transform:uppercase;line-height:1.3}

/* Hero-style tags */
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.htag{display:flex;align-items:center;gap:5px;font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.1em;color:#c9a96e;border:.5px solid rgba(201,169,110,.35);padding:4px 9px;text-transform:uppercase;background:rgba(201,169,110,.04)}
.htsw{display:inline-block;width:9px;height:9px;border:.4px solid rgba(255,255,255,.15);flex-shrink:0}
.htag-ral svg,.htag-marine svg{flex-shrink:0}

/* Cover footer */
.cft{margin-top:auto;border-top:.5px solid rgba(201,169,110,.18);padding-top:10px;display:flex;justify-content:space-between}
.cff{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.12em;color:#7a776f;text-transform:uppercase}

/* ── PAGES 2-3 header ── */
.ph{display:flex;justify-content:space-between;padding:11px 36px 8px;border-bottom:.3px solid rgba(255,255,255,.04)}
.phl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phr{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835}

/* ── PAGE 2: SPECS ── */
.sl2{display:flex;gap:0;padding:12px 36px;height:calc(100% - 36px)}
.sleft{flex:0 0 49%;padding-right:18px;overflow:hidden}
.sh{font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;font-weight:300;color:#eeebe5;margin-bottom:12px;line-height:1}
.sg{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.22);padding-bottom:4px;margin:10px 0 4px}
.sr{display:flex;justify-content:space-between;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.sl{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.sv{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right;max-width:56%}
.mg{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.22);padding-bottom:4px;margin:12px 0 6px}
.mcs{display:flex;gap:6px}
.mc{flex:1;border:.5px solid rgba(201,169,110,.2);background:#0e0e0c;position:relative;overflow:hidden;height:130px}
.mi{position:absolute;top:0;left:0;width:100%;height:calc(100% - 20px);object-fit:cover}
.mp{position:absolute;top:0;left:0;width:100%;height:calc(100% - 20px);display:flex;align-items:center;justify-content:center;background:#111}
.mp svg{width:28px;height:42px;opacity:.3}
.ml{position:absolute;bottom:0;left:0;right:0;height:20px;font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.14em;color:#c9a96e;text-align:center;line-height:20px;background:#111110;border-top:.4px solid rgba(201,169,110,.12)}
.sright{flex:0 0 47%;margin-left:4%;display:flex;flex-direction:column;gap:5px}
.sri{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex;align-items:center;justify-content:center}
.sri img{width:100%;height:100%}
.sri.cv img{object-fit:cover}
.sri.cn2 img{object-fit:contain}

/* ── PAGE 3: GALLERY ── */
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
</style>
</head><body>

${coverPage ? `
<!-- COVER PAGE (from brochure-cover.png) -->
<div class="page" style="padding:0;margin:0">
  <img src="${coverPage}" style="width:100%;height:100%;object-fit:cover;display:block">
</div>` : ''}

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cb ct"></div>
  <div class="cb cbb"></div>
  ${hero ? `<img src="${hero}" class="ch">` : `<div class="ch" style="background:#0e0e0c"></div>`}
  <div class="cf"></div>
  <div class="cl">
    <div class="cw">XSCACE</div>
    <div class="cs">Size Defying Sound</div>
    <div class="cn">${P.productName}</div>
    <div class="ct2">${P.tagline || ''}</div>
    <div class="cd">${P.shortDescription || ''}</div>
    <div class="cr"></div>

    <!-- Key stats -->
    <div class="cst">
      ${[
        P.powerRmsW    ? {v:`${P.powerRmsW}W`,  l:'Power'}       : null,
        P.sensitivityDb? {v:`${P.sensitivityDb}dB`,l:'Sensitivity'}: null,
        P.impedanceOhms? {v:`${P.impedanceOhms}Ω`,l:'Impedance'}  : null,
        P.depthMm      ? {v:`${P.depthMm}mm`,   l:'Depth'}        : null,
      ].filter(Boolean).map((s:any)=>`
      <div class="csi"><div class="csv">${s.v}</div><div class="csl">${s.l}</div></div>`).join('')}
    </div>

    <!-- Proprietary tech icons -->
    <div class="trow">${techRow}</div>

    <!-- Hero-style tags: colors, RAL, marine -->
    <div class="tags">
      ${colorTagsHtml}
      ${ralTagHtml}
      ${marineTagHtml}
    </div>

    <div class="cft">
      <span class="cff">${P.series || ''} · ${P.skuBase || ''}</span>
      <span class="cff">XSCACE.COM</span>
    </div>
  </div>
</div>

<!-- PAGE 2: SPECS + MOUNTING -->
<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${(P.productName||'').toUpperCase()}</span>
    <span class="phr">02 — 03</span>
  </div>
  <div class="sl2">
    <div class="sleft">
      <div class="sh">Specifications</div>
      <div class="sg">Acoustic</div>${specRows(sA)}
      <div class="sg">Physical</div>${specRows(sP)}
      <div class="mg">Mounting Options</div>
      <div class="mcs">${mountCards}</div>
    </div>
    <div class="sright">
      <div class="sri cn2" style="flex:1.2">${hero?`<img src="${hero}">`:''}
      </div>
      <div class="sri cv" style="flex:1">${lives[0]?`<img src="${lives[0]}">`:''}
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3: GALLERY -->
<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${(P.productName||'').toUpperCase()}</span>
    <span class="phr">03 — 03</span>
  </div>
  <div class="gp">
    <div class="gh">In context.</div>
    <div class="gr"></div>
    <div class="gg">${galCells}</div>
    <div class="gf">
      <div>
        <div class="gfc">Enquire or specify at xscace.com</div>
        <div class="gfe">support@xscace.com</div>
      </div>
      <div class="gfb">XSCACE · Size Defying Sound</div>
    </div>
  </div>
</div>

${backPage ? `
<!-- BACK PAGE (from brochure-back.png) -->
<div class="page" style="padding:0;margin:0;page-break-after:auto">
  <img src="${backPage}" style="width:100%;height:100%;object-fit:cover;display:block">
</div>` : ''}

</body></html>`

    // 10. Puppeteer render
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
      omitBackground: false,
    }))
    await browser.close()

    // 11. Upload + cache
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

// Fix typo in function name
function magwaFont() { return magmaWaveB64() }
