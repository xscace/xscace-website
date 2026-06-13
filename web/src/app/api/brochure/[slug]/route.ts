// web/src/app/api/brochure/[slug]/route.ts
// Claude generates HTML → pdf-lib renders it as PDF (pure Node, no Chromium)
// Actually: use @sparticuz/chromium bundled binary (deployed with function, no runtime download)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

const PROJECT = '7r0kq57d'
const DATASET = 'production'

const sanity = createClient({
  projectId: PROJECT, dataset: DATASET,
  apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const anthropic = new Anthropic()

function imgUrl(ref: string, w = 800) {
  const body = ref.replace(/^image-/, '')
  const parts = body.split('-')
  const ext = parts[parts.length - 1]
  const dims = parts[parts.length - 2]
  const hash = parts.slice(0, parts.length - 2).join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=75`
}

async function imgB64(ref: string | null, w = 800): Promise<string> {
  if (!ref) return ''
  try {
    const res = await fetch(imgUrl(ref, w))
    if (!res.ok) return ''
    const buf = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get('content-type') || 'image/jpeg'
    return `data:${ct};base64,${buf.toString('base64')}`
  } catch { return '' }
}

function getRef(obj: any): string { return obj?.asset?._ref || '' }

function fileCdn(id: string) {
  const bare = id.replace('file-', '')
  const i = bare.lastIndexOf('-')
  return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${bare.slice(0, i)}.${bare.slice(i + 1)}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    // 1. Fetch product
    const P: any = await sanity.fetch(`*[_type=="product" && slug.current=="${slug}" && status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription,
      series, skuBase, colorsStandard, mountingMethods,
      marineTreatable, customRalAvailable, ipRating,
      sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
      splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
      directivityHDeg, directivityVDeg, heightMm, widthMm, depthMm,
      weightKg, driverDescription, crossoverType, housingMaterial,
      grilleMaterial, speakerWireConnector, proprietaryTechBadges,
      heroImage, "gallery": galleryImages[0..2], "lifestyle": lifestyleImages[0..4],
      "accessories": accessories[]->{name, category, heroImage, lifestyleImage},
      brochureRef, brochureHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // 2. Cache check
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.depthMm}v2`).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 12)
    if (P.brochureRef && P.brochureHash === h) {
      const cdn = fileCdn(P.brochureRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) return NextResponse.redirect(cdn, 302)
    }

    // 3. Fetch images — small sizes to keep payload low
    const [hero, ...rest] = await Promise.all([
      imgB64(getRef(P.heroImage), 900),
      ...(P.gallery || []).slice(0, 2).map((g: any) => imgB64(getRef(g), 600)),
      ...(P.lifestyle || []).slice(0, 4).map((l: any) => imgB64(getRef(l), 700)),
    ])
    const gals = rest.slice(0, 2)
    const lives = rest.slice(2)

    const mountMethods = (P.mountingMethods || '').split(',').map((m: string) => m.trim()).filter(Boolean)
    const accs = P.accessories || []
    const mounts: {name: string; img: string}[] = []
    let li = 0
    for (const m of mountMethods) {
      let img = ''
      for (const a of accs) {
        if (m.toLowerCase().split(' ').some((w: string) => (a.name || '').toLowerCase().includes(w))) {
          img = await imgB64(getRef(a.lifestyleImage) || getRef(a.heroImage), 600)
          if (img) break
        }
      }
      if (!img && li < lives.length) { img = lives[li++] }
      mounts.push({ name: m, img })
    }

    // Build specs
    const sA: Record<string, string> = {}
    if (P.powerRmsW)    sA['Power RMS']   = `${P.powerRmsW}W`
    if (P.powerPeakW)   sA['Power Peak']  = `${P.powerPeakW}W`
    if (P.sensitivityDb)sA['Sensitivity'] = `${P.sensitivityDb} dB`
    if (P.freqHighHz)   sA['Frequency']   = `${P.freqLowHz}Hz – ${Math.round(P.freqHighHz/1000)}kHz ${P.freqQualifier||''}`.trim()
    if (P.impedanceOhms)sA['Impedance']   = `${P.impedanceOhms}Ω`
    if (P.splMaxDb)     sA['Max SPL']     = `${P.splMaxDb} dB`
    if (P.thdN)         sA['THD+N']       = P.thdN
    if (P.driverDescription) sA['Drivers']= P.driverDescription
    if (P.crossoverType)sA['Crossover']   = P.crossoverType
    if (P.directivityHDeg) sA['Directivity'] = `${P.directivityHDeg}° H × ${P.directivityVDeg}° V`

    const sP: Record<string, string> = {}
    if (P.heightMm) sP['H × W × D'] = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
    if (P.weightKg) sP['Weight']    = `${P.weightKg} kg`
    if (P.housingMaterial) sP['Housing']  = P.housingMaterial
    if (P.grilleMaterial)  sP['Grille']   = P.grilleMaterial
    if (P.ipRating)        sP['IP Rating']= P.ipRating
    if (P.speakerWireConnector) sP['Connector'] = P.speakerWireConnector

    const tech = (P.proprietaryTechBadges||'').split(',').map((b:string)=>b.trim().replace(/™/g,'').replace(/\s+/g,' ')).filter(Boolean)
    const marineTxt = [P.ipRating, P.marineTreatable ? 'Marine-grade' : ''].filter(Boolean).join(' · ') || 'Standard'

    // 4. Claude generates HTML — images as base64 inline, Google Fonts for typography
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      system: 'You are a luxury product brochure designer. Output ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Create a beautiful 4-page A4 landscape HTML brochure for this XSCACE luxury speaker.

PRODUCT:
Name: ${P.productName} | Full: ${P.productFullName || ''}
Tagline: ${P.tagline || ''} | Description: ${P.shortDescription || ''}
Series: ${P.series || ''} | SKU: ${P.skuBase || ''}
Acoustic specs: ${JSON.stringify(sA)}
Physical specs: ${JSON.stringify(sP)}
Tech badges: ${JSON.stringify(tech)}
Standard finishes: ${P.colorsStandard || ''}
Custom RAL: ${P.customRalAvailable ? 'Available — any RAL colour' : 'Not available'}
Marine & IP: ${marineTxt}
Mounting options: ${JSON.stringify(mountMethods)}

IMAGES — these are actual base64 data URIs, use directly in src="":
HERO: ${hero ? hero.slice(0, 60) + '...[HERO_B64]' : 'not available'}
LIFE1: ${lives[0] ? lives[0].slice(0,40)+'...[LIFE1_B64]' : 'not available'}
LIFE2: ${lives[1] ? lives[1].slice(0,40)+'...[LIFE2_B64]' : 'not available'}
LIFE3: ${lives[2] ? lives[2].slice(0,40)+'...[LIFE3_B64]' : 'not available'}
LIFE4: ${lives[3] ? lives[3].slice(0,40)+'...[LIFE4_B64]' : 'not available'}
GAL1: ${gals[0] ? gals[0].slice(0,40)+'...[GAL1_B64]' : 'not available'}
${mounts.map((m,i)=>`MOUNT${i+1} (${m.name}): ${m.img ? m.img.slice(0,40)+'...[MOUNT${i+1}_B64]' : 'not available'}`).join('\n')}

Replace [HERO_B64] [LIFE1_B64] [LIFE2_B64] [LIFE3_B64] [LIFE4_B64] [GAL1_B64] [MOUNT1_B64] [MOUNT2_B64] [MOUNT3_B64] with those exact placeholder strings — I will do string replacement after.

DESIGN: #090909 bg, #c9a96e champagne accent, #eeebe5 text, #7a776f muted.
Google Fonts in <head>: Cormorant Garamond (headings), DM Sans (body), DM Mono (labels).
Flat. No shadows. 0.5px champagne borders. Luxury spacing. Print-ready.

@page { size: 297mm 210mm; margin: 0; } — each page has page-break-after: always (except last).

PAGE 1 COVER: Hero image right 55% position absolute object-fit cover. Black-to-transparent gradient overlay left. Left column: XSCACE wordmark DM Mono 13px, product name Cormorant 78px weight 300, italic tagline 20px champagne, description DM Sans 11px muted, champagne rule, 4 key stats (value Cormorant 26px champagne, label DM Mono 7px below). Footer: series·SKU left, XSCACE.COM right. Champagne bars 5px top+bottom.

PAGE 2 SPECS: Header "XSCACE · ${P.productName?.toUpperCase()}" + "02—04". "Specifications" Cormorant 44px. Left 50%: ACOUSTIC then PHYSICAL spec groups — label DM Mono 8px muted left, value DM Mono 8px text right, thin row separators. Right 46%: hero image top (contain, dark bg), LIFE1 bottom (cover). Below: MOUNTING OPTIONS — flex row cards, each with image top 75% cover (or dark placeholder) + name DM Mono 7px champagne bottom strip.

PAGE 3 TECH (no photos): "Designed to" + line break "disappear." Cormorant 50px. "PROPRIETARY TECHNOLOGY" label + rule. 3-col grid — each badge: inline SVG icon unique to each technology (PsySculpt=sine wave, XS-Flow=U-bend tube, Nano Resonance=fan of 5 lines from dot, PrecisionXover=8 vertical bars filled champagne, AeroFrame=8-spoke asterisk+circle, PowerDense=lightning bolt+arcs) + name DM Mono 7px. Bottom: 3 bordered cards — Standard Finishes (color swatches), Custom RAL (SVG colour wheel), Marine & IP (SVG water droplet).

PAGE 4 GALLERY: "In context." Cormorant 40px + rule. 2×2 grid LIFE1-LIFE4 object-fit cover. Footer: enquire CTA + xscace.com + support@xscace.com.

Output ONLY the complete HTML.`
      }]
    })

    let html = msg.content.filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('')
    if (html.startsWith('```')) html = html.replace(/^```html?\n?/,'').replace(/```\s*$/,'').trim()

    // Inject images
    html = html.replaceAll('[HERO_B64]',   hero  || '')
    html = html.replaceAll('[LIFE1_B64]',  lives[0] || '')
    html = html.replaceAll('[LIFE2_B64]',  lives[1] || '')
    html = html.replaceAll('[LIFE3_B64]',  lives[2] || '')
    html = html.replaceAll('[LIFE4_B64]',  lives[3] || '')
    html = html.replaceAll('[GAL1_B64]',   gals[0]  || '')
    mounts.forEach((m,i) => { html = html.replaceAll(`[MOUNT${i+1}_B64]`, m.img || '') })

    console.log('[brochure] HTML size:', html.length)

    // 5. Puppeteer with bundled Chromium (no runtime download)
    const puppeteer  = (await import('puppeteer-core')).default
    const chromium   = (await import('@sparticuz/chromium')).default

    const browser = await puppeteer.launch({
      args:           [...chromium.args, '--no-sandbox', '--single-process', '--disable-gpu'],
      executablePath: await chromium.executablePath(
        process.env.CHROMIUM_PACK_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar'
      ),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle2', timeout: 25000 })

    const pdf = await page.pdf({
      width:           '297mm',
      height:          '210mm',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await browser.close()

    const pdfBuf = Buffer.from(pdf)
    console.log('[brochure] PDF size:', pdfBuf.length)

    // 6. Upload to Sanity + cache
    if (process.env.SANITY_API_TOKEN && pdfBuf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g,'_')}_Brochure.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          { method:'POST', headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/pdf' }, body:pdfBuf }
        )
        if (up.ok) {
          const { document: doc } = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method:'POST',
            headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/json' },
            body: JSON.stringify({ mutations:[{ patch:{ id:P._id, set:{ brochureRef:doc._id, brochureHash:h, brochure:{ _type:'file', asset:{ _type:'reference', _ref:doc._id } } } } }] })
          })
        }
      } catch(e) { console.error('[brochure] cache failed', e) }
    }

    return new NextResponse(pdfBuf, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="XSCACE_${slug}_Brochure.pdf"`,
        'Content-Length':      String(pdfBuf.length),
        'Cache-Control':       'no-cache',
      },
    })
  } catch(err: any) {
    console.error('[brochure]', err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
