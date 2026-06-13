// web/src/app/api/brochure/[slug]/route.ts
// Fetch product from Sanity → Claude generates HTML → Puppeteer setContent() → PDF → Sanity cache
// setContent() loads HTML directly (no URL navigation), so no self-fetch problem.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const maxDuration = 120

const PROJECT = '7r0kq57d'
const DATASET = 'production'

const sanity = createClient({
  projectId: PROJECT,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// ── Image helpers ────────────────────────────────────────────────────────────
function imgUrl(ref: string, w = 1400) {
  const body = ref.replace(/^image-/, '')
  const parts = body.split('-')
  const ext = parts[parts.length - 1]
  const dims = parts[parts.length - 2]
  const hash = parts.slice(0, parts.length - 2).join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=75`
}

async function imgDataUri(ref: string | null, w = 1400): Promise<string> {
  if (!ref) return ''
  try {
    const res = await fetch(imgUrl(ref, w))
    if (!res.ok) return ''
    const buf = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get('content-type') || 'image/jpeg'
    return `data:${ct};base64,${buf.toString('base64')}`
  } catch { return '' }
}

function getRef(obj: any): string {
  return obj?.asset?._ref || ''
}

function fileCdn(assetId: string) {
  const bare = assetId.replace('file-', '')
  const i = bare.lastIndexOf('-')
  return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${bare.slice(0, i)}.${bare.slice(i + 1)}`
}

// ── Embedded fonts ───────────────────────────────────────────────────────────
function loadFontCss(): string {
  // Use Google Fonts — Puppeteer has internet access so this works fine
  // Much faster than embedding 4MB of base64 fonts in the HTML
  return `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@400;700&family=DM+Mono:wght@400;500&display=swap');`
}

// ── Claude call ──────────────────────────────────────────────────────────────
async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  return (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    // 1. Fetch product
    const P = await sanity.fetch(`*[_type=="product" && slug.current=="${slug}" && status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription,
      series, skuBase, colorsStandard, mountingMethods,
      marineTreatable, customRalAvailable, ipRating,
      sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
      splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
      directivityHDeg, directivityVDeg, heightMm, widthMm, depthMm,
      weightKg, driverDescription, crossoverType, housingMaterial,
      grilleMaterial, speakerWireConnector, proprietaryTechBadges,
      heroImage, "gallery": galleryImages[0..3], "lifestyle": lifestyleImages[0..5],
      "accessories": accessories[]->{name, category, heroImage, lifestyleImage},
      brochureRef, brochureHash
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // 2. Cache check
    const h = Buffer.from(`${P.productName}${P.powerRmsW}${P.depthMm}`).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 12)
    if (P.brochureRef && P.brochureHash === h) {
      const cdn = fileCdn(P.brochureRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) {
        return NextResponse.redirect(cdn, 302)
      }
    }

    // 3. Fetch images
    const hero = await imgDataUri(getRef(P.heroImage), 900)
    const gals = await Promise.all((P.gallery || []).slice(0, 3).map((g: any) => imgDataUri(getRef(g), 700)))
    const lives = await Promise.all((P.lifestyle || []).slice(0, 5).map((l: any) => imgDataUri(getRef(l), 700)))

    // Match accessory images to mount methods
    const mountMethods = (P.mountingMethods || '').split(',').map((m: string) => m.trim()).filter(Boolean)
    const accs = P.accessories || []
    const mounts: { name: string; img: string }[] = []
    let lifeIdx = 0
    for (const m of mountMethods) {
      let img = ''
      for (const a of accs) {
        const an = (a.name || '').toLowerCase()
        if (m.toLowerCase().split(' ').some((w: string) => an.includes(w))) {
          img = await imgDataUri(getRef(a.lifestyleImage) || getRef(a.heroImage), 700)
          if (img) break
        }
      }
      if (!img && lifeIdx < lives.length) { img = lives[lifeIdx]; lifeIdx++ }
      mounts.push({ name: m, img })
    }


    // 4. Build spec objects
    const specsA: Record<string, string> = {}
    if (P.powerRmsW) specsA['Power RMS'] = `${P.powerRmsW}W`
    if (P.powerPeakW) specsA['Power Peak'] = `${P.powerPeakW}W`
    if (P.sensitivityDb) specsA['Sensitivity'] = `${P.sensitivityDb} dB`
    if (P.freqHighHz) specsA['Frequency'] = `${P.freqLowHz}Hz – ${Math.round(P.freqHighHz / 1000)}kHz ${P.freqQualifier || ''}`.trim()
    if (P.impedanceOhms) specsA['Impedance'] = `${P.impedanceOhms}Ω`
    if (P.splMaxDb) specsA['Max SPL'] = `${P.splMaxDb} dB`
    if (P.thdN) specsA['THD+N'] = P.thdN
    if (P.driverDescription) specsA['Drivers'] = P.driverDescription
    if (P.crossoverType) specsA['Crossover'] = P.crossoverType
    if (P.directivityHDeg) specsA['Directivity'] = `${P.directivityHDeg}° H × ${P.directivityVDeg}° V`

    const specsP: Record<string, string> = {}
    if (P.heightMm) specsP['H × W × D'] = `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm`
    if (P.weightKg) specsP['Weight'] = `${P.weightKg} kg`
    if (P.housingMaterial) specsP['Housing'] = P.housingMaterial
    if (P.grilleMaterial) specsP['Grille'] = P.grilleMaterial
    if (P.ipRating) specsP['IP Rating'] = P.ipRating
    if (P.speakerWireConnector) specsP['Connector'] = P.speakerWireConnector

    const tech = (P.proprietaryTechBadges || '').split(',').map((b: string) => b.trim().replace(/™/g, '').replace(/\s+/g, ' ')).filter(Boolean)
    const marineTxt = [P.ipRating, P.marineTreatable ? 'Marine-grade' : ''].filter(Boolean).join(' · ') || 'Standard'

    // 5. Claude generates HTML
    let html = await callClaude(
      `You are a luxury product brochure designer. Output ONLY raw HTML. No markdown, no code fences, no explanation. Start with <!DOCTYPE html>.`,
      `Create a stunning 4-page A4 landscape HTML brochure for this XSCACE luxury architectural speaker.

Use this in your <head>: <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@400;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

PRODUCT:
Name: ${P.productName} | Full: ${P.productFullName || ''}
Tagline: ${P.tagline || ''}
Description: ${P.shortDescription || ''}
Series: ${P.series || ''} | SKU: ${P.skuBase || ''}
Acoustic: ${JSON.stringify(specsA)}
Physical: ${JSON.stringify(specsP)}
Tech badges: ${JSON.stringify(tech)}
Standard finishes: ${P.colorsStandard || ''}
Custom RAL: ${P.customRalAvailable ? 'Available — any RAL, powder coat or anodised' : 'Not available'}
Marine & IP: ${marineTxt}
Mounting options: ${JSON.stringify(mounts.map(m => m.name))}

IMAGES — use these EXACT placeholder strings as the src value in <img> tags. I will replace them with base64 after you respond:
- HERO_B64 (cover hero, product against luxury interior)
- LIFE1_B64, LIFE2_B64, LIFE3_B64, LIFE4_B64 (lifestyle photos)
- GAL1_B64 (product studio shot)
${mounts.map((m, i) => `- MOUNT${i + 1}_B64 (${m.name} mount lifestyle photo)`).join('\n')}
${hero ? '' : '(HERO not available — use a #0e0e0c block)'}

DESIGN SYSTEM:
- Background #090909, accent champagne #c9a96e, text #eeebe5, muted #7a776f
- Fonts: 'Cormorant Garamond' headings, 'DM Sans' body, 'DM Mono' labels/specs
- Flat. No shadows. No gradients except dark photo overlays. 0.5px champagne borders. Generous breathing room.
- Each page: 297mm × 210mm, page-break-after: always (last page none)

PAGE 1 — COVER:
HERO_B64 fills right 55% (object-fit:cover, height 100%, position absolute right). Left gradient overlay linear-gradient(to right,#090909 42%,rgba(9,9,9,0.4) 68%,transparent 88%). Left column padded 48px: "XSCACE" DM Mono 13px letter-spacing 0.18em #eeebe5; "SIZE DEFYING SOUND" DM Mono 7px #7a776f. Product name Cormorant 78px weight 300 #eeebe5 (margin-top 40px). Tagline Cormorant italic 20px #c9a96e. Description DM Sans 11px #7a776f max-width 300px. 1px champagne rule opacity 0.35 width 260px. Stats row: ${Object.keys({ Power: 1, Sensitivity: 1, Impedance: 1, Depth: 1 })} — value Cormorant 26px weight 600 #c9a96e, label DM Mono 7px #7a776f below, gap 28px. Footer absolute bottom: series·SKU left + XSCACE.COM right, DM Mono 8px #7a776f, champagne top border. Champagne bars top+bottom 5px.

PAGE 2 — SPECIFICATIONS:
Header row "XSCACE · ${(P.productName || '').toUpperCase()}" + "02 — 04". "Specifications" Cormorant 44px. Two columns (left 50%, right 46%). LEFT: ACOUSTIC then PHYSICAL groups — group label DM Mono 8px #c9a96e + champagne underline, each row flex (label DM Mono 8px #7a776f, value DM Mono 8px #eeebe5 right) with 0.3px row separators. RIGHT: HERO_B64 top 55% (object-fit:contain, bg #0e0e0c, border 0.5px), LIFE1_B64 bottom 42% (object-fit:cover). Below specs full width: "MOUNTING OPTIONS" label + rule. Flex row of mount cards — each card border 0.5px champagne/0.2: MOUNT_N image top 75% object-fit:cover (or #111 placeholder with small champagne speaker SVG), name DM Mono 7px #c9a96e bottom strip bg #111110. Champagne bars top+bottom.

PAGE 3 — TECHNOLOGY (NO photographs on this page):
Header row + "03 — 04". "Designed to" Cormorant 50px #eeebe5 + line break "disappear." Cormorant italic 50px #c9a96e. "PROPRIETARY TECHNOLOGY" DM Mono 8px #c9a96e + champagne rule. 3-column CSS grid of tech badges, each cell: a UNIQUE inline SVG icon (viewBox 0 0 60 60, stroke #c9a96e fill none stroke-width 1.5):
  * PsySculpt: smooth sine/EQ wave path spanning the icon
  * XS-Flow: U-bend tube shape with 3 small filled circles as outlets
  * Nano Resonance: 5 lines fanning upward from a filled dot at bottom
  * PrecisionXover Array: 8 vertical rounded bars of varying heights, filled #c9a96e
  * AeroFrame Chassis: 8-spoke asterisk with a circle in the middle
  * PowerDense Dynamics: a lightning bolt (filled champagne 15% opacity) with 2-3 concentric arc lines on the left
  Badge name below each icon, DM Mono 7px #c9a96e centered. Generous vertical spacing between the two rows.
Bottom: 3 equal bordered cards (border 0.5px champagne/0.3, padding 12px):
  1. "STANDARD FINISHES" — row of colour swatch squares (20×14px, map: Black/Anthracite→#2a2c2e, White→#F2F0EC, Champagne→#C9A96E) + the names in DM Sans 8px
  2. "CUSTOM RAL" — an SVG colour wheel (6 coloured pie segments forming a ring) + "${P.customRalAvailable ? 'Any RAL colour' : 'Not available'}" DM Sans 8px
  3. "MARINE & IP" — an SVG water droplet (champagne stroke, 15% fill) + "${marineTxt}" DM Sans 8px

PAGE 4 — GALLERY:
Header row + "04 — 04". "In context." Cormorant 40px + champagne rule. 2×2 CSS grid (gap 4px) filling remaining height with LIFE1_B64..LIFE4_B64 (fallback GAL1_B64), object-fit:cover. Footer strip bg #0e0e0c border-top champagne: "Enquire or specify at xscace.com" Cormorant 18px #eeebe5 + "support@xscace.com" DM Mono 9px #c9a96e; right "XSCACE · SIZE DEFYING SOUND" DM Mono 7px #7a776f.

Make it genuinely beautiful — like a real luxury print brochure. Output ONLY the HTML.`
    )

    // Strip markdown fences
    if (html.startsWith('```')) html = html.replace(/^```html?\n/, '').replace(/```\s*$/, '').trim()

    // Images only — fonts loaded via Google Fonts link in head
    html = html.replaceAll('HERO_B64', hero || '')
    lives.forEach((l, i) => { html = html.replaceAll(`LIFE${i + 1}_B64`, l || '') })
    gals.forEach((g, i) => { html = html.replaceAll(`GAL${i + 1}_B64`, g || '') })
    mounts.forEach((m, i) => { html = html.replaceAll(`MOUNT${i + 1}_B64`, m.img || '') })

    // 6. Render HTML → PDF with Puppeteer setContent (no URL navigation!)
    const puppeteer = await import('puppeteer-core')
    const chromium = (await import('@sparticuz/chromium')).default

    const browser = await puppeteer.default.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar'
      ),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 })
    const pdfBuffer = await page.pdf({
      width: '297mm',
      height: '210mm',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await browser.close()

    const pdf = Buffer.from(pdfBuffer)

    // 7. Upload to Sanity and cache
    if (process.env.SANITY_API_TOKEN && pdf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g, '_')}_Brochure.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          { method: 'POST', headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type': 'application/pdf' }, body: pdf }
        )
        if (up.ok) {
          const { document: doc } = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mutations: [{ patch: { id: P._id, set: { brochureRef: doc._id, brochureHash: h, brochure: { _type: 'file', asset: { _type: 'reference', _ref: doc._id } } } } }] }),
          })
        }
      } catch (e) { console.error('[brochure] upload failed', e) }
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="XSCACE_${slug}_Brochure.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    console.error('[brochure]', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
