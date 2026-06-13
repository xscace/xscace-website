// web/src/app/api/brochure/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'

const sanity = createClient({
  projectId: PROJECT, dataset: DATASET,
  apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})
const anthropic = new Anthropic()

function imgUrl(ref: string, w = 800) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=80`
}
async function imgB64(ref: string | null, w = 800): Promise<string> {
  if (!ref) return ''
  try {
    const r = await fetch(imgUrl(ref, w))
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params
  try {
    // 1. Fetch
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id,productName,productFullName,tagline,shortDescription,series,skuBase,
      colorsStandard,mountingMethods,marineTreatable,customRalAvailable,ipRating,
      sensitivityDb,powerRmsW,powerPeakW,impedanceOhms,splMaxDb,thdN,
      freqLowHz,freqHighHz,freqQualifier,directivityHDeg,directivityVDeg,
      heightMm,widthMm,depthMm,weightKg,driverDescription,crossoverType,
      housingMaterial,grilleMaterial,speakerWireConnector,proprietaryTechBadges,
      heroImage,"gallery":galleryImages[0..2],"lifestyle":lifestyleImages[0..4],
      "accessories":accessories[]->{name,category,heroImage,lifestyleImage},
      brochureRef,brochureHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // 2. Cache
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.depthMm}v3`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.brochureRef && P.brochureHash === h) {
      const cdn = fileCdn(P.brochureRef)
      const head = await fetch(cdn,{method:'HEAD'}).catch(()=>null)
      if (head && (head.ok || head.status===403)) return NextResponse.redirect(cdn, 302)
    }

    // 3. Fetch images
    const hero = await imgB64(getRef(P.heroImage), 900)
    const gals = await Promise.all((P.gallery||[]).slice(0,3).map((g:any)=>imgB64(getRef(g),600)))
    const lives = await Promise.all((P.lifestyle||[]).slice(0,4).map((l:any)=>imgB64(getRef(l),700)))

    const mountMethods = (P.mountingMethods||'').split(',').map((m:string)=>m.trim()).filter(Boolean)
    const mounts: {name:string;img:string}[] = []
    let li = 0
    for (const m of mountMethods) {
      let img = ''
      for (const a of (P.accessories||[])) {
        if (m.toLowerCase().split(' ').some((w:string)=>(a.name||'').toLowerCase().includes(w))) {
          img = await imgB64(getRef(a.lifestyleImage)||getRef(a.heroImage), 600)
          if (img) break
        }
      }
      if (!img && li < lives.length) img = lives[li++]
      mounts.push({name: m, img})
    }

    // Specs
    const sA: Record<string,string> = {}
    if (P.powerRmsW)    sA['Power RMS']   = `${P.powerRmsW}W`
    if (P.powerPeakW)   sA['Power Peak']  = `${P.powerPeakW}W`
    if (P.sensitivityDb)sA['Sensitivity'] = `${P.sensitivityDb} dB`
    if (P.freqHighHz)   sA['Frequency']   = `${P.freqLowHz}Hz – ${Math.round(P.freqHighHz/1000)}kHz ${P.freqQualifier||''}`.trim()
    if (P.impedanceOhms)sA['Impedance']   = `${P.impedanceOhms}Ω`
    if (P.splMaxDb)     sA['Max SPL']     = `${P.splMaxDb} dB`
    if (P.thdN)         sA['THD+N']       = P.thdN
    if (P.driverDescription)sA['Drivers'] = P.driverDescription
    if (P.crossoverType)sA['Crossover']   = P.crossoverType
    if (P.directivityHDeg)sA['Directivity']=`${P.directivityHDeg}° H × ${P.directivityVDeg}° V`
    const sP: Record<string,string> = {}
    if (P.heightMm) sP['H × W × D'] = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
    if (P.weightKg) sP['Weight']    = `${P.weightKg} kg`
    if (P.housingMaterial) sP['Housing']  = P.housingMaterial
    if (P.grilleMaterial)  sP['Grille']   = P.grilleMaterial
    if (P.ipRating)        sP['IP Rating']= P.ipRating
    if (P.speakerWireConnector) sP['Connector'] = P.speakerWireConnector

    const tech = (P.proprietaryTechBadges||'').split(',').map((b:string)=>b.trim().replace(/™/g,'').replace(/\s+/g,' ')).filter(Boolean)
    const marineTxt = [P.ipRating, P.marineTreatable?'Marine-grade':''].filter(Boolean).join(' · ') || 'Standard'
    const colors = P.colorsStandard || ''

    // Color map for swatches
    const colorMap: Record<string,string> = {
      'black':'#111','anthracite':'#3C3F41','white':'#F2F0EC',
      'champagne':'#C9A96E','matte champagne':'#C9A96E','slate':'#4A4A52','grey':'#5A5A5A'
    }
    const swatches = colors.split(',').map((c:string)=>c.trim()).filter(Boolean).map((name:string)=>({
      name, hex: colorMap[name.toLowerCase()] || '#555'
    }))

    // 4. Ask Claude ONLY for page 3 tech section (what it can't mess up)
    // We build pages 1,2,4 deterministically and only ask Claude for tech SVG icons
    const techIconsHtml = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: 'Output only a JSON array, no markdown, no explanation.',
      messages: [{role:'user', content: `For each tech badge, return a JSON array of objects with "name" and "svg" (inline SVG string, viewBox="0 0 60 50", stroke="#c9a96e", fill="none", stroke-width="1.5", no xmlns needed):
${tech.map((t:string,i:number)=>`${i+1}. ${t}`).join('\n')}

Icons must be unique and accurate:
- PsySculpt: smooth sine wave path across full width
- XS-Flow: U-bend pipe with 3 small filled circle outlets  
- Nano Resonance: 5 lines fanning up from a filled dot
- PrecisionXover Array: 7-8 vertical bars varying heights filled #c9a96e
- AeroFrame Chassis: asterisk of 8 spokes with small center circle
- PowerDense Dynamics: lightning bolt shape + 2 arc lines left side

Return ONLY the JSON array.`}]
    })
    let icons: {name:string,svg:string}[] = []
    try {
      const raw = (techIconsHtml.content[0] as any).text.trim().replace(/^```json?\n?/,'').replace(/```$/,'')
      icons = JSON.parse(raw)
    } catch { icons = tech.map((t:string)=>({name:t, svg:'<circle cx="30" cy="25" r="15"/>'})) }

    // 5. Build complete HTML deterministically
    const specRows = (specs: Record<string,string>) => Object.entries(specs).map(([l,v])=>`
      <div class="sr"><span class="sl">${l}</span><span class="sv">${v}</span></div>`).join('')

    const mountCards = mounts.map(m=>`
      <div class="mc">
        ${m.img ? `<img src="${m.img}" class="mi">` : `<div class="mp"><svg viewBox="0 0 40 60" stroke="#c9a96e" fill="none" stroke-width="1"><rect x="14" y="4" width="12" height="40" rx="1"/><line x1="20" y1="4" x2="20" y2="1"/><line x1="16" y1="1" x2="24" y2="1"/><line x1="6" y1="52" x2="34" y2="52"/></svg></div>`}
        <div class="ml">${m.name.toUpperCase()}</div>
      </div>`).join('')

    const techGrid = icons.map(icon=>`
      <div class="ti">
        <div class="ticon"><svg viewBox="0 0 60 50" stroke="#c9a96e" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg></div>
        <div class="tn">${icon.name.toUpperCase()}</div>
      </div>`).join('')

    const swatchHtml = swatches.map((s:{name:string,hex:string})=>`<div class="sw" style="background:${s.hex}" title="${s.name}"></div>`).join('')

    const galleryImgs = [...lives, ...gals].filter(Boolean).slice(0,4)
    const galCells = [0,1,2,3].map(i=> galleryImgs[i]
      ? `<div class="gc"><img src="${galleryImgs[i]}" class="gi"></div>`
      : `<div class="gc ge"></div>`).join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
body{font-family:'DM Sans',sans-serif;background:#090909;color:#eeebe5;width:297mm}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}
.cb{position:absolute;left:0;right:0;height:5px;background:#c9a96e;z-index:10}
.ct{top:0}.cbb{bottom:0}
/* Cover */
.ch{position:absolute;right:0;top:0;width:58%;height:100%;object-fit:cover}
.cf{position:absolute;inset:0;background:linear-gradient(to right,#090909 40%,rgba(9,9,9,.55) 65%,transparent 88%)}
.cl{position:absolute;left:0;top:0;bottom:0;width:50%;padding:44px 44px}
.cw{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:.18em;color:#eeebe5;text-transform:uppercase}
.cs{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.2em;color:#7a776f;margin-top:5px;text-transform:uppercase}
.cn{font-family:'Cormorant Garamond',Georgia,serif;font-size:78px;font-weight:300;color:#eeebe5;margin-top:36px;line-height:1}
.ct2{font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-style:italic;color:#c9a96e;margin-top:10px}
.cd{font-family:'DM Sans',sans-serif;font-size:11px;color:#7a776f;margin-top:14px;max-width:290px;line-height:1.7}
.cr{height:1px;background:rgba(201,169,110,.35);margin:22px 0;width:260px}
.cst{display:flex;gap:28px;margin-top:4px}
.csv{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#c9a96e;line-height:1}
.csl{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.18em;color:#7a776f;margin-top:5px;text-transform:uppercase}
.cft{position:absolute;bottom:0;left:44px;right:44px;border-top:.5px solid rgba(201,169,110,.2);padding:10px 0;display:flex;justify-content:space-between}
.cff{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:.12em;color:#7a776f;text-transform:uppercase}
/* Pages 2-4 header */
.ph{display:flex;justify-content:space-between;padding:12px 36px 8px;border-bottom:.3px solid rgba(255,255,255,.04)}
.phl{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:.15em;color:#7a776f;text-transform:uppercase}
.phr{font-family:'DM Mono',monospace;font-size:7.5px;color:#3a3835}
/* Specs page */
.sl2{display:flex;gap:0;padding:14px 36px;height:calc(100% - 38px)}
.sleft{flex:0 0 49%;padding-right:20px;overflow:hidden}
.sh{font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:300;color:#eeebe5;margin-bottom:14px;line-height:1}
.sg{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.25);padding-bottom:5px;margin:10px 0 4px}
.sr{display:flex;justify-content:space-between;padding:3.5px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.sl{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.sv{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right;max-width:56%}
.mg{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.25);padding-bottom:5px;margin:12px 0 7px}
.mcs{display:flex;gap:6px}
.mc{flex:1;border:.5px solid rgba(201,169,110,.2);background:#0e0e0c;display:flex;flex-direction:column;overflow:hidden;min-height:80px}
.mi{flex:1;width:100%;object-fit:cover;min-height:0}
.mp{flex:1;display:flex;align-items:center;justify-content:center;background:#111}
.mp svg{width:32px;height:48px;opacity:.35}
.ml{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.14em;color:#c9a96e;text-align:center;padding:5px 4px;background:#111110;border-top:.4px solid rgba(201,169,110,.15);flex-shrink:0}
.sright{flex:0 0 47%;margin-left:4%;display:flex;flex-direction:column;gap:6px}
.sri{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.08);overflow:hidden;display:flex;align-items:center;justify-content:center}
.sri img{width:100%;height:100%;object-fit:contain}
.sri.cv img{object-fit:cover}
/* Tech page */
.tp{padding:14px 36px;height:calc(100% - 38px);display:flex;flex-direction:column}
.th{font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;font-weight:300;color:#eeebe5;line-height:1.1}
.thi{font-style:italic;color:#c9a96e}
.tl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.25);padding-bottom:4px;margin:14px 0 8px}
.tg{display:grid;grid-template-columns:repeat(3,1fr);flex:1;align-items:center}
.ti{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 8px}
.ticon{width:54px;height:44px;display:flex;align-items:center;justify-content:center}
.ticon svg{width:100%;height:100%}
.tn{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.13em;color:#c9a96e;text-align:center;margin-top:6px;text-transform:uppercase}
.fr{display:flex;gap:7px;flex-shrink:0;margin-top:10px}
.fc{flex:1;border:.5px solid rgba(201,169,110,.28);background:#0a0a0a;padding:10px 11px}
.fcl{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;border-bottom:.3px solid rgba(201,169,110,.15);padding-bottom:5px;margin-bottom:7px}
.fct{font-family:'DM Sans',sans-serif;font-size:8px;color:#eeebe5;line-height:1.4;margin-top:5px}
.sws{display:flex;gap:5px;margin-bottom:6px}
.sw{width:18px;height:13px;border:.4px solid rgba(255,255,255,.12)}
/* Gallery */
.gp{padding:14px 36px 0;height:calc(100% - 38px);display:flex;flex-direction:column}
.gh{font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;font-weight:300;color:#eeebe5}
.gr{height:1px;background:rgba(201,169,110,.25);margin:10px 0 8px}
.gg{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;flex:1;min-height:0}
.gc{overflow:hidden;background:#0e0e0c}
.ge{border:.4px solid rgba(201,169,110,.06)}
.gi{width:100%;height:100%;object-fit:cover}
.gf{background:#0e0e0c;border-top:1px solid rgba(201,169,110,.18);padding:10px 0 12px;display:flex;justify-content:space-between;align-items:flex-end;flex-shrink:0}
.gfc{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#eeebe5;font-weight:300}
.gfe{font-family:'DM Mono',monospace;font-size:8px;color:#c9a96e;letter-spacing:.07em;margin-top:4px}
.gfb{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835;letter-spacing:.1em;text-transform:uppercase}
/* RAL wheel SVG */
.rw{width:36px;height:36px;margin-bottom:6px}
/* Marine droplet */
.md{width:28px;height:36px;margin-bottom:6px}
</style>
</head><body>

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
    <div class="ct2">${P.tagline||''}</div>
    <div class="cd">${P.shortDescription||''}</div>
    <div class="cr"></div>
    <div class="cst">
      ${Object.entries({Power:`${P.powerRmsW}W`,Sensitivity:`${P.sensitivityDb} dB`,Impedance:`${P.impedanceOhms}Ω`,Depth:`${P.depthMm}mm`}).filter(([,v])=>v&&v!=='undefinedW').map(([l,v])=>`
      <div><div class="csv">${v}</div><div class="csl">${l}</div></div>`).join('')}
    </div>
  </div>
  <div class="cft">
    <span class="cff">${P.series||''} · ${P.skuBase||''}</span>
    <span class="cff">XSCACE.COM</span>
  </div>
</div>

<!-- PAGE 2: SPECS -->
<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${(P.productName||'').toUpperCase()}</span>
    <span class="phr">02 — 04</span>
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
      <div class="sri" style="flex:1.2">${hero?`<img src="${hero}">`:''}
      </div>
      <div class="sri cv" style="flex:1">${lives[0]?`<img src="${lives[0]}">`:''}
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3: TECHNOLOGY -->
<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${(P.productName||'').toUpperCase()}</span>
    <span class="phr">03 — 04</span>
  </div>
  <div class="tp">
    <div class="th">Designed to <span class="thi">disappear.</span></div>
    <div class="tl">Proprietary Technology</div>
    <div class="tg">${techGrid}</div>
    <div class="fr">
      <!-- Standard Finishes -->
      <div class="fc">
        <div class="fcl">Standard Finishes</div>
        <div class="sws">${swatchHtml}</div>
        <div class="fct">${colors}</div>
      </div>
      <!-- Custom RAL -->
      <div class="fc">
        <div class="fcl">Custom RAL</div>
        <svg class="rw" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 L20 2 A18 18 0 0 1 35.6 11 Z" fill="#e63946"/>
          <path d="M20 20 L35.6 11 A18 18 0 0 1 35.6 29 Z" fill="#f4a261"/>
          <path d="M20 20 L35.6 29 A18 18 0 0 1 20 38 Z" fill="#2a9d8f"/>
          <path d="M20 20 L20 38 A18 18 0 0 1 4.4 29 Z" fill="#457b9d"/>
          <path d="M20 20 L4.4 29 A18 18 0 0 1 4.4 11 Z" fill="#6a4c93"/>
          <path d="M20 20 L4.4 11 A18 18 0 0 1 20 2 Z" fill="#f1c453"/>
          <circle cx="20" cy="20" r="9" fill="#0a0a0a"/>
          <circle cx="20" cy="20" r="18" fill="none" stroke="#c9a96e" stroke-width=".5"/>
        </svg>
        <div class="fct">${P.customRalAvailable ? 'Any RAL — powder coat or anodised' : 'Not available'}</div>
      </div>
      <!-- Marine & IP -->
      <div class="fc">
        <div class="fcl">Marine &amp; IP</div>
        <svg class="md" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2 C14 2 2 18 2 27 C2 34 7.4 38 14 38 C20.6 38 26 34 26 27 C26 18 14 2 14 2 Z" fill="rgba(201,169,110,0.15)" stroke="#c9a96e" stroke-width="1.2"/>
          <line x1="9" y1="26" x2="19" y2="26" stroke="#c9a96e" stroke-width=".8" opacity=".5"/>
          <line x1="14" y1="21" x2="14" y2="31" stroke="#c9a96e" stroke-width=".8" opacity=".5"/>
        </svg>
        <div class="fct">${marineTxt}</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: GALLERY -->
<div class="page">
  <div class="cb ct"></div><div class="cb cbb"></div>
  <div class="ph">
    <span class="phl">XSCACE · ${(P.productName||'').toUpperCase()}</span>
    <span class="phr">04 — 04</span>
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

</body></html>`

    console.log('[brochure] HTML:', html.length, 'chars, images:', {hero:!!hero, lives:lives.filter(Boolean).length, gals:gals.filter(Boolean).length})

    // 6. Puppeteer
    const puppeteer  = (await import('puppeteer-core')).default
    const chromium   = (await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode = false

    const browser = await puppeteer.launch({
      args:          [...chromium.args, '--no-sandbox', '--single-process', '--disable-gpu'],
      executablePath: await chromium.executablePath(
        process.env.CHROMIUM_PACK_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar'
      ),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle2', timeout: 20000 })
    const pdf = Buffer.from(await page.pdf({
      width:'297mm', height:'210mm', printBackground:true,
      margin:{top:'0',right:'0',bottom:'0',left:'0'},
    }))
    await browser.close()
    console.log('[brochure] PDF:', pdf.length)

    // 7. Cache
    if (process.env.SANITY_API_TOKEN && pdf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g,'_')}_Brochure.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          {method:'POST', headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/pdf'}, body:pdf}
        )
        if (up.ok) {
          const {document:doc} = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method:'POST',
            headers:{Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`,'Content-Type':'application/json'},
            body: JSON.stringify({mutations:[{patch:{id:P._id,set:{brochureRef:doc._id,brochureHash:h,brochure:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})
          })
        }
      } catch(e){console.error('[brochure] cache failed',e)}
    }

    return new NextResponse(pdf, {
      status:200,
      headers:{
        'Content-Type':'application/pdf',
        'Content-Disposition':`inline; filename="XSCACE_${slug}_Brochure.pdf"`,
        'Content-Length':String(pdf.length),
        'Cache-Control':'no-cache',
      }
    })
  } catch(err:any) {
    console.error('[brochure]', err)
    return NextResponse.json({error:err?.message}, {status:500})
  }
}
