import { NextRequest, NextResponse } from 'next/server'

const W = 1587, H = 1123

const SITE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const puppeteer = await import('puppeteer-core')
    const chromiumPkg = await import('@sparticuz/chromium')

    const executablePath = await chromiumPkg.default.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'
    )

    const browser = await puppeteer.default.launch({
      executablePath,
      args: chromiumPkg.default.args,
      defaultViewport: { width: W, height: H, deviceScaleFactor: 1.5 },
      headless: true,
    })

    const page = await browser.newPage()
    const url = `${SITE}/products/slim-array-series/${slug}?brochure=1`
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 })

    await page.addStyleTag({ content: `
      nav, footer, .nav-wrap, .audio-btn-wrap, .scroll-wave-wrap,
      .pd-wave-divider, .pd-hero-ctas, .pd-brochure-btn, .ar-wall-btn,
      .fg-scroll-hint, .fg-track { display: none !important; }
      * { animation-play-state: paused !important; }
    ` })
    await page.waitForTimeout(1500)

    const SECTIONS = [
      { sel: '.pd-hero-v2',        label: 'Hero'           },
      { sel: '.pd-specs-section',  label: 'Specifications' },
      { sel: '.acc-section',       label: 'Accessories'    },
      { sel: '.pd-tech-section',   label: 'Technology'     },
      { sel: '.fg-section',        label: 'Gallery'        },
    ]

    const shots: { png: Buffer; label: string }[] = []
    for (const s of SECTIONS) {
      try {
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
          clip: { x: Math.max(0, Math.floor(box.x)), y: Math.floor(box.y), width: Math.min(W, Math.floor(box.width)), height: Math.min(H * 3, Math.floor(box.height)) },
          captureBeyondViewport: true,
        }) as Buffer
        shots.push({ png, label: s.label })
      } catch (e) { console.error(`[brochure] ${s.sel}:`, e) }
    }
    await browser.close()

    // Build PDF with PDFKit
    const PDFDocument = (await import('pdfkit')).default
    const PW = W * 1.5, PH = H * 1.5
    const BG = '#090909', CHAMP = '#c9a96e', TEXT = '#eeebe5', MUTED = '#7a776f'
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ size: [PW, PH], margin: 0, autoFirstPage: false })
    doc.on('data', (c: Buffer) => chunks.push(c))
    const done = new Promise<void>(res => doc.on('end', res))

    // Cover
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BG)
    doc.rect(0, 0, PW, 8).fill(CHAMP)
    doc.rect(0, PH - 8, PW, 8).fill(CHAMP)
    const name = slug.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1))
      .join(' ').replace(/Slim Array Speaker|Slim Array/gi, '').trim()
    if (shots[0]) {
      const rx = PW * 0.45
      doc.save()
      doc.rect(rx, 0, PW - rx, PH).clip()
      doc.image(shots[0].png, rx, 0, { width: PW - rx, height: PH, cover: [PW - rx, PH] as any })
      doc.restore()
      for (let i = 0; i < 50; i++) {
        const a = Math.pow(1 - i / 50, 2) * 0.95
        doc.fillColor(BG).fillOpacity(a).rect(rx + i * (PW * 0.28 / 50), 0, PW * 0.28 / 50 + 2, PH).fill()
      }
      doc.fillOpacity(1)
    }
    doc.fillColor(TEXT).fontSize(46).font('Helvetica-Bold').text('XSCACE', 80, 90)
    doc.fillColor(MUTED).fontSize(11).font('Helvetica').text('SIZE DEFYING SOUND', 82, 148)
    doc.fillColor(TEXT).fontSize(100).font('Helvetica-Bold').text(name, 80, PH / 2 - 80, { lineBreak: false })
    doc.moveTo(80, PH / 2 + 55).lineTo(80 + PW * 0.32, PH / 2 + 55).lineWidth(2).strokeColor(CHAMP).stroke()
    doc.fillColor(CHAMP).fontSize(22).font('Helvetica').text('Slim Array Speaker', 82, PH / 2 + 85)
    doc.fillColor(MUTED).fontSize(11).text('XSCACE.COM', PW - 200, PH - 65)
    doc.text(`1 / ${shots.length + 1}`, PW / 2, PH - 65)

    // Section pages
    for (let i = 0; i < shots.length; i++) {
      const { png, label } = shots[i]
      doc.addPage()
      doc.rect(0, 0, PW, PH).fill(BG)
      const img = doc.openImage(png)
      const scale = Math.min(PW / img.width, PH / img.height)
      const sw = img.width * scale, sh = img.height * scale
      doc.image(png, (PW - sw) / 2, sh < PH ? (PH - sh) / 2 : 0, { width: sw, height: sh })
      doc.rect(0, 0, PW, 6).fill(CHAMP)
      doc.rect(0, PH - 6, PW, 6).fill(CHAMP)
      doc.fillColor(MUTED).fontSize(11).font('Helvetica-Bold').text('XSCACE', PW - 140, 28)
      doc.font('Helvetica').text(label.toUpperCase(), PW - 240, PH - 52)
      doc.text(`${i + 2} / ${shots.length + 1}`, PW / 2, PH - 52)
    }

    doc.end(); await done
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
