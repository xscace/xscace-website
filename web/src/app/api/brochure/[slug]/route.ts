// web/src/app/api/brochure/[slug]/route.ts
// Fetches product data from Sanity + images, renders PDF entirely in-process.
// No Puppeteer, no self-HTTP — works in any Vercel serverless environment.

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@sanity/client'

export const maxDuration = 60

const sanity = createClient({
  projectId: '7r0kq57d',
  dataset:   'production',
  apiVersion: '2024-01-01',
  useCdn:    true,
})

function imgUrl(ref: string, w = 1400) {
  // ref = "image-<hash>-<WxH>-<ext>"
  const body  = ref.replace(/^image-/, '')
  const parts = body.split('-')
  const ext   = parts[parts.length - 1]
  const dims  = parts[parts.length - 2]          // e.g. "3840x2160"
  const hash  = parts.slice(0, parts.length - 2).join('-')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${hash}-${dims}.${ext}?w=${w}&auto=format&q=88`
}

async function fetchImg(ref: string | null, w = 1400): Promise<Buffer | null> {
  if (!ref) return null
  try {
    const res = await fetch(imgUrl(ref, w))
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch { return null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    // ── 1. Fetch product from Sanity ─────────────────────────────────────────
    const P = await sanity.fetch(`
      *[_type=="product" && slug.current=="${slug}" && status=="Active"][0]{
        _id, productName, productFullName, tagline, shortDescription,
        series, skuBase, colorsStandard, mountingMethods,
        marineTreatable, customRalAvailable, ipRating,
        sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
        splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
        directivityHDeg, directivityVDeg,
        heightMm, widthMm, depthMm, weightKg,
        driverDescription, crossoverType, housingMaterial,
        grilleMaterial, speakerWireConnector, proprietaryTechBadges,
        heroImage, "gallery": galleryImages[0..2], "lifestyle": lifestyleImages[0..4]
      }
    `)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // ── 2. Fetch images ───────────────────────────────────────────────────────
    const heroRef     = P.heroImage?.asset?._ref || null
    const galleryRefs = (P.gallery || []).map((i: any) => i?.asset?._ref).filter(Boolean)
    const lifeRefs    = (P.lifestyle || []).map((i: any) => i?.asset?._ref).filter(Boolean)

    const [heroImg, ...galleryImgs] = await Promise.all([
      fetchImg(heroRef, 1600),
      ...galleryRefs.slice(0, 3).map((r: string) => fetchImg(r, 1000)),
    ])
    const lifeImgs = await Promise.all(lifeRefs.slice(0, 4).map((r: string) => fetchImg(r, 1200)))

    // ── 3. Build PDF with PDFKit ─────────────────────────────────────────────
    const PDFDocument = (await import('pdfkit')).default

    // A4 landscape @ 2x
    const PW = 2246, PH = 1587
    const BG    = '#090909'
    const CHAMP = '#c9a96e'
    const TEXT  = '#eeebe5'
    const MUTED = '#7a776f'
    const DIM   = '#3e3b36'

    const chunks: Buffer[] = []
    const doc = new PDFDocument({ size: [PW, PH], margin: 0, autoFirstPage: false })
    doc.on('data', (c: Buffer) => chunks.push(c))
    const done = new Promise<void>(res => doc.on('end', res))

    const rule = (y: number, x = 0, w = PW, lw = 1.5, col = CHAMP) =>
      doc.moveTo(x, y).lineTo(x + w, y).lineWidth(lw).strokeColor(col).stroke()

    const fitImg = (buf: Buffer, x: number, y: number, w: number, h: number, cover = false) => {
      if (!buf) return
      try {
        const img = doc.openImage(buf)
        if (cover) {
          const scale = Math.max(w / img.width, h / img.height)
          const sw = img.width * scale, sh = img.height * scale
          const ox = (w - sw) / 2, oy = (h - sh) / 2
          doc.save().rect(x, y, w, h).clip()
            .image(buf, x + ox, y + oy, { width: sw, height: sh })
            .restore()
        } else {
          const scale = Math.min(w / img.width, h / img.height)
          const sw = img.width * scale, sh = img.height * scale
          doc.image(buf, x + (w - sw) / 2, y + (h - sh) / 2, { width: sw, height: sh })
        }
      } catch {}
    }

    // ══ PAGE 1: COVER ════════════════════════════════════════════════════════
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    doc.rect(0, 0, PW, 10).fill(CHAMP)
    doc.rect(0, PH - 10, PW, 10).fill(CHAMP)

    // Hero image right 55%
    if (heroImg) {
      const rx = PW * 0.45
      fitImg(heroImg, rx, 0, PW - rx, PH, true)
      // Gradient fade left edge
      for (let i = 0; i < 60; i++) {
        const a = Math.pow(1 - i / 60, 1.8) * 0.97
        doc.fillColor(BG).fillOpacity(a)
          .rect(rx + i * (PW * 0.3 / 60), 0, PW * 0.3 / 60 + 2, PH).fill()
      }
      doc.fillOpacity(1)
    }

    const name = (P.productFullName || P.productName || slug)
      .replace(/Slim Array Speaker/gi, '').trim()

    doc.fillColor(TEXT).fontSize(52).font('Helvetica-Bold').text('XSCACE', 100, 100)
    doc.fillColor(MUTED).fontSize(13).font('Helvetica').text('SIZE DEFYING SOUND', 103, 162)

    doc.fillColor(TEXT).fontSize(130).font('Helvetica-Bold')
    doc.text(P.productName || name, 100, PH / 2 - 110, { lineBreak: false })

    rule(PH / 2 + 58, 100, PW * 0.33, 2)

    doc.fillColor(CHAMP).fontSize(26).font('Helvetica')
    doc.text(P.tagline || 'Slim Array Speaker', 103, PH / 2 + 90)

    if (P.shortDescription) {
      doc.fillColor(MUTED).fontSize(14).font('Helvetica')
      doc.text(P.shortDescription, 103, PH / 2 + 138, { width: PW * 0.35, lineBreak: true })
    }

    // Key stats
    const stats = [
      P.powerRmsW    && [`${P.powerRmsW}W`,       'POWER'],
      P.sensitivityDb && [`${P.sensitivityDb}dB`,  'SENSITIVITY'],
      P.impedanceOhms && [`${P.impedanceOhms}Ω`,  'IMPEDANCE'],
      P.depthMm      && [`${P.depthMm}mm`,         'DEPTH'],
    ].filter(Boolean) as [string, string][]

    const sy = PH - 160, cw = PW * 0.38 / Math.max(stats.length, 1)
    rule(sy + 50, 100, PW * 0.38, 0.5, CHAMP)
    doc.fillColor(MUTED).fontSize(11).font('Helvetica').text('KEY SPECIFICATIONS', 100, sy + 26)
    stats.forEach(([v, l], i) => {
      const sx = 100 + i * cw + 4
      doc.fillColor(CHAMP).fontSize(32).font('Helvetica-Bold').text(v, sx, sy - 10)
      doc.fillColor(DIM).fontSize(10).font('Helvetica').text(l, sx, sy + 62)
    })

    doc.fillColor(DIM).fontSize(12).font('Helvetica')
    doc.text((P.series || '').toUpperCase(), 100, PH - 70)
    doc.text('XSCACE.COM', PW - 240, PH - 70)

    // ══ PAGE 2: SPECS ════════════════════════════════════════════════════════
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    rule(0, 0, PW, 10)
    rule(PH - 10, 0, PW, 10)

    doc.fillColor(MUTED).fontSize(13).font('Helvetica')
    doc.text('XSCACE  ·  ' + (P.productFullName || P.productName || '').toUpperCase(), 100, 36)
    doc.text('2 / 5', PW / 2, 36)

    rule(70, 0, PW, 0.5, '#1a1917')

    doc.fillColor(TEXT).fontSize(64).font('Helvetica-Bold')
    doc.text('Specifications', 100, 100)

    // Left col: specs; Right col: gallery image
    const lw2 = PW * 0.52; const rx2 = 100 + lw2 + 40

    if (galleryImgs[0]) {
      const ih = (PH - 200) * 0.52
      fitImg(galleryImgs[0], rx2, 150, PW - rx2 - 80, ih, false)
      doc.fillColor(DIM).fontSize(10).text('PRODUCT', rx2, 155)
    }
    if (lifeImgs[0]) {
      const ih = (PH - 200) * 0.44
      const iy = 150 + (PH - 200) * 0.52 + 20
      fitImg(lifeImgs[0], rx2, iy, PW - rx2 - 80, ih, true)
      doc.fillColor(DIM).fontSize(10).text('IN CONTEXT', rx2, iy + 6)
    }

    const specGroups = [
      ['ACOUSTIC', [
        ['Power RMS',   P.powerRmsW    ? `${P.powerRmsW}W`   : null],
        ['Power Peak',  P.powerPeakW   ? `${P.powerPeakW}W`  : null],
        ['Sensitivity', P.sensitivityDb ? `${P.sensitivityDb} dB` : null],
        ['Frequency',   P.freqHighHz   ? `${P.freqLowHz}Hz – ${Math.round(P.freqHighHz/1000)}kHz ${P.freqQualifier||''}` : null],
        ['Impedance',   P.impedanceOhms ? `${P.impedanceOhms}Ω` : null],
        ['Max SPL',     P.splMaxDb     ? `${P.splMaxDb} dB`  : null],
        ['THD+N',       P.thdN],
        ['Drivers',     P.driverDescription],
        ['Crossover',   P.crossoverType],
        ['Directivity', P.directivityHDeg ? `${P.directivityHDeg}° H × ${P.directivityVDeg}° V` : null],
      ]],
      ['PHYSICAL', [
        ['H × W × D',  P.heightMm ? `${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm` : null],
        ['Weight',      P.weightKg ? `${P.weightKg} kg` : null],
        ['Housing',     P.housingMaterial],
        ['Grille',      P.grilleMaterial],
        ['IP Rating',   P.ipRating],
        ['Connector',   P.speakerWireConnector],
      ]],
      ['MOUNTING', [[P.mountingMethods || '', '']]],
    ] as [string, [string, string|null][]][]

    let sy2 = 190
    for (const [gname, rows] of specGroups) {
      doc.fillColor(CHAMP).fontSize(13).font('Helvetica-Bold').text(gname, 100, sy2)
      sy2 += 18
      rule(sy2, 100, lw2 - 40, 0.4, '#2a2825')
      sy2 += 12
      for (const [lbl, val] of rows) {
        if (!val) continue
        doc.fillColor(MUTED).fontSize(13).font('Helvetica').text(lbl, 100, sy2)
        doc.fillColor(TEXT).fontSize(13).text(String(val), 100, sy2, { align: 'right', width: lw2 - 60 })
        sy2 += 28
        doc.moveTo(100, sy2 - 6).lineTo(100 + lw2 - 60, sy2 - 6).lineWidth(0.3).strokeColor('#1a1917').stroke()
      }
      sy2 += 16
    }

    // ══ PAGE 3: TECHNOLOGY ════════════════════════════════════════════════════
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    rule(0, 0, PW, 10)
    rule(PH - 10, 0, PW, 10)
    doc.fillColor(MUTED).fontSize(13).font('Helvetica')
    doc.text('XSCACE  ·  ' + (P.productName || '').toUpperCase(), 100, 36)
    doc.text('3 / 5', PW / 2, 36)
    rule(70, 0, PW, 0.5, '#1a1917')
    doc.fillColor(TEXT).fontSize(64).font('Helvetica-Bold').text('Designed to', 100, 100)
    doc.fillColor(CHAMP).fontSize(64).font('Helvetica').text('disappear.', 100, 172)

    // Lifestyle strip
    if (lifeImgs[1]) {
      fitImg(lifeImgs[1], 0, 270, PW, 340, true)
      doc.fillColor(BG).fillOpacity(0.22).rect(0, 270, PW, 340).fill().fillOpacity(1)
    } else {
      doc.rect(0, 270, PW, 340).fill('#0e0e0c')
    }

    // Tech badges
    const techBadges = (P.proprietaryTechBadges || '')
      .split(',').map((b: string) => b.trim().replace(/™/g, '').replace(/\s+/g, ' ')).filter(Boolean)

    doc.fillColor(CHAMP).fontSize(13).font('Helvetica-Bold').text('PROPRIETARY TECHNOLOGY', 100, 638)
    rule(660, 100, PW - 200, 0.4, '#2a2825')

    const perRow = 3; const cellW = (PW - 200) / perRow
    techBadges.forEach((badge: string, i: number) => {
      const col = i % perRow, row = Math.floor(i / perRow)
      const bx = 100 + col * cellW + cellW / 2
      const by = 710 + row * 120
      // Simple icon placeholder — champagne dot
      doc.fillColor(CHAMP).circle(bx, by - 20, 18).fill()
      doc.fillColor(BG).fontSize(10).font('Helvetica-Bold').text(badge[0] || '·', bx - 5, by - 26)
      doc.fillColor(CHAMP).fontSize(12).font('Helvetica').text(badge.toUpperCase(), bx - cellW / 2 + 20, by + 8, { width: cellW - 40, align: 'center' })
    })

    // Finishes / RAL / Marine
    const boty = PH - 180
    rule(boty, 100, PW - 200, 0.4, '#2a2825')
    const third = (PW - 200) / 3

    doc.fillColor(CHAMP).fontSize(12).font('Helvetica-Bold').text('STANDARD FINISHES', 100, boty + 20)
    doc.fillColor(TEXT).fontSize(14).font('Helvetica').text(P.colorsStandard || '—', 100, boty + 46, { width: third - 20 })

    doc.fillColor(CHAMP).fontSize(12).font('Helvetica-Bold').text('CUSTOM RAL', 100 + third, boty + 20)
    // Badge border
    doc.rect(100 + third, boty + 42, third - 30, 34).lineWidth(0.8).strokeColor(CHAMP).fillOpacity(0.05).fillAndStroke(CHAMP, CHAMP).fillOpacity(1)
    doc.fillColor(CHAMP).fontSize(12).font('Helvetica').text(P.customRalAvailable ? 'Any RAL — powder coat or anodised' : 'Not available', 104 + third, boty + 52, { width: third - 40 })

    doc.fillColor(CHAMP).fontSize(12).font('Helvetica-Bold').text('MARINE & IP', 100 + third * 2, boty + 20)
    const marineTxt = [P.ipRating, P.marineTreatable ? 'Marine-grade' : ''].filter(Boolean).join(' · ') || '—'
    doc.rect(100 + third * 2, boty + 42, third - 30, 34).lineWidth(0.8).strokeColor(P.marineTreatable ? CHAMP : '#333').fillOpacity(0.05).fillAndStroke('#111', '#333').fillOpacity(1)
    doc.fillColor(P.marineTreatable ? CHAMP : MUTED).fontSize(12).font('Helvetica').text(marineTxt, 104 + third * 2, boty + 52, { width: third - 40 })

    // ══ PAGE 4: LIFESTYLE ════════════════════════════════════════════════════
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    rule(0, 0, PW, 10)
    rule(PH - 10, 0, PW, 10)
    doc.fillColor(MUTED).fontSize(13).font('Helvetica')
    doc.text('XSCACE  ·  ' + (P.productName || '').toUpperCase(), 100, 36)
    doc.text('4 / 5', PW / 2, 36)
    rule(70, 0, PW, 0.5, '#1a1917')
    doc.fillColor(TEXT).fontSize(64).font('Helvetica-Bold').text('Gallery', 100, 100)

    const avail = [lifeImgs[2], lifeImgs[3], galleryImgs[1], galleryImgs[2]].filter(Boolean) as Buffer[]
    if (avail.length >= 2) {
      const gw = (PW - 220) / 2; const gh = (PH - 340) / 2
      const positions = [[100, 200],[120 + gw, 200],[100, 220 + gh],[120 + gw, 220 + gh]]
      avail.slice(0, 4).forEach((img, i) => {
        const [ix, iy] = positions[i]
        fitImg(img, ix, iy, gw, gh, true)
      })
    } else if (avail[0]) {
      fitImg(avail[0], 100, 200, PW - 200, PH - 320, true)
    }

    // ══ PAGE 5: CONTACT ══════════════════════════════════════════════════════
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    rule(0, 0, PW, 10)
    rule(PH - 10, 0, PW, 10)
    doc.fillColor(MUTED).fontSize(13).font('Helvetica')
    doc.text('XSCACE  ·  ' + (P.productName || '').toUpperCase(), 100, 36)
    doc.text('5 / 5', PW / 2, 36)

    if (heroImg) {
      doc.fillColor(BG).fillOpacity(0.6)
      fitImg(heroImg, PW / 2, 0, PW / 2, PH, true)
      doc.rect(PW / 2, 0, PW / 2, PH).fill(BG).fillOpacity(0.55)
      doc.fillOpacity(1)
    }

    doc.fillColor(TEXT).fontSize(72).font('Helvetica-Bold').text('Enquire or', 100, PH / 2 - 120)
    doc.fillColor(CHAMP).fontSize(72).font('Helvetica').text('specify your system.', 100, PH / 2 - 30)
    rule(PH / 2 + 70, 100, PW * 0.42, 1.5)
    doc.fillColor(TEXT).fontSize(20).font('Helvetica').text('xscace.com', 100, PH / 2 + 100)
    doc.fillColor(MUTED).fontSize(16).text('support@xscace.com', 100, PH / 2 + 132)
    doc.fillColor(DIM).fontSize(14).text('SIZE DEFYING SOUND', 100, PH - 80)

    // ── Done ─────────────────────────────────────────────────────────────────
    doc.end()
    await done
    const pdf = Buffer.concat(chunks)

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
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
