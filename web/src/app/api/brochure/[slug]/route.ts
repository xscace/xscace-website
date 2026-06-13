// web/src/app/api/brochure/[slug]/route.ts
// Renders real product page sections via Puppeteer into a landscape PDF

import { NextRequest, NextResponse } from 'next/server'

// A4 landscape in px @96dpi
const W = 1123
const H  = 794

const SITE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = await params

  try {
    // Dynamic import so the module is only loaded serverside
    const puppeteer    = await import('puppeteer-core')
    const { default: chromium } = await import('@sparticuz/chromium')

    const browser = await puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: W, height: H, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    // ── Load product page with ?brochure=1 ───────────────────────────────────
    const url = `${SITE}/products/slim-array-series/${slug}?brochure=1`
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 })

    // Hide chrome that shouldn't appear in brochure
    await page.addStyleTag({ content: `
      nav, footer, .nav-wrap, .audio-btn-wrap, .scroll-wave-wrap,
      .pd-wave-divider, .pd-hero-ctas, .pd-brochure-btn, .ar-wall-btn,
      .fg-scroll-hint, .fg-track { display: none !important; }
      * { animation-play-state: paused !important; cursor: none !important; }
      ::-webkit-scrollbar { display: none; }
    ` })
    await page.waitForTimeout(1000)

    // ── Capture each section as a full-page screenshot ───────────────────────
    const sections = [
      { sel: '.pd-hero-v2',       label: 'hero'        },
      { sel: '.pd-specs-section', label: 'specs'       },
      { sel: '.acc-section',      label: 'accessories' },
      { sel: '.pd-tech-section',  label: 'tech'        },
      { sel: '.fg-section',       label: 'gallery'     },
    ]

    const shots: { png: Buffer; label: string }[] = []

    for (const s of sections) {
      const el = await page.$(s.sel)
      if (!el) continue
      const box = await el.boundingBox()
      if (!box || box.height < 10) continue

      await page.evaluate((sel: string) => {
        document.querySelector(sel)?.scrollIntoView({ block: 'start' })
      }, s.sel)
      await page.waitForTimeout(400)

      const png = await page.screenshot({
        type: 'png',
        clip: { x: Math.max(0, box.x), y: box.y, width: W, height: Math.min(box.height, H * 4) },
        captureBeyondViewport: true,
      }) as Buffer
      shots.push({ png, label: s.label })
    }

    await browser.close()

    // ── Compose PDF using PDFKit ─────────────────────────────────────────────
    const { default: PDFDocument } = await import('pdfkit')
    const { Readable } = await import('stream')

    const doc = new PDFDocument({ size: [W * 2, H * 2], margin: 0, autoFirstPage: false })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    const done = new Promise<void>(res => doc.on('end', res))

    const BG   = '#090909'
    const CHAMP = '#c9a96e'
    const TEXT  = '#eeebe5'
    const MUTED = '#7a776f'
    const PW = W * 2, PH = H * 2

    // ── PAGE 1: COVER ────────────────────────────────────────────────────────
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    // Champagne top rule
    doc.rect(0, 0, PW, 8).fill(CHAMP)
    // XSCACE wordmark
    doc.fillColor(TEXT).fontSize(52).font('Helvetica-Bold').text('XSCACE', 80, 90)
    doc.fillColor(MUTED).fontSize(13).font('Helvetica').text('SIZE DEFYING SOUND', 83, 150)
    // Product name
    const prodName = slug.split('-')
      .map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
      .replace(/Slim Array Speaker|Slim Array/g, '').trim()
    doc.fillColor(TEXT).fontSize(140).font('Helvetica-Bold').text(prodName, 80, PH / 2 - 100)
    // Champagne rule
    doc.moveTo(80, PH / 2 + 60).lineTo(600, PH / 2 + 60).lineWidth(1.5).strokeColor(CHAMP).stroke()
    // Tagline
    doc.fillColor(CHAMP).fontSize(26).font('Helvetica').text('Slim Array Speaker', 83, PH / 2 + 90)
    // Footer
    doc.fillColor(MUTED).fontSize(14).text('XSCACE.COM', PW - 220, PH - 80)
    doc.text('1 / 6', PW / 2, PH - 80)

    // ── PAGES 2-6: Section screenshots ───────────────────────────────────────
    for (let i = 0; i < shots.length; i++) {
      const { png, label } = shots[i]
      doc.addPage()
      doc.rect(0, 0, PW, PH).fill(BG)

      // Fit image to page
      const img = doc.openImage(png)
      const iw = img.width, ih = img.height
      const scale = Math.min(PW / iw, PH / ih)
      const sw = iw * scale, sh = ih * scale
      const ox = (PW - sw) / 2, oy = (PH - sh) / 2
      doc.image(png, ox, oy, { width: sw, height: sh })

      // Page label
      doc.fillColor(MUTED).fontSize(12).font('Helvetica')
      doc.text(label.toUpperCase(), PW - 240, PH - 60)
      doc.text(`${i + 2} / 6`, PW / 2, PH - 60)
    }

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
      }
    })

  } catch (err: any) {
    console.error('[brochure]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
