# vercel.json: {"functions": {"api/brochure/[slug].py": {"maxDuration": 300}}}
from http.server import BaseHTTPRequestHandler
import sys, os, json, urllib.request, urllib.parse, hashlib, traceback, base64, subprocess, tempfile

sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')

PROJECT = '7r0kq57d'; DATASET = 'production'
TOKEN   = os.environ.get('SANITY_API_TOKEN', '')
CLAUDE  = os.environ.get('ANTHROPIC_API_KEY', '')
API     = f'https://{PROJECT}.api.sanity.io/v2024-01-01'

def sanity_fetch(q):
    url = f'{API}/data/query/{DATASET}?query={urllib.parse.quote(q)}'
    r = urllib.request.Request(url)
    if TOKEN: r.add_header('Authorization', f'Bearer {TOKEN}')
    return json.loads(urllib.request.urlopen(r, timeout=20).read())['result']

def sanity_upload(pdf_bytes, fname):
    url = f'{API}/assets/files/{DATASET}?filename={urllib.parse.quote(fname)}'
    r = urllib.request.Request(url, data=pdf_bytes)
    r.add_header('Authorization', f'Bearer {TOKEN}')
    r.add_header('Content-Type', 'application/pdf')
    return json.loads(urllib.request.urlopen(r, timeout=40).read())['document']['_id']

def sanity_patch(doc_id, fields):
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    r = urllib.request.Request(f'{API}/data/mutate/{DATASET}', data=body)
    r.add_header('Authorization', f'Bearer {TOKEN}')
    r.add_header('Content-Type', 'application/json')
    urllib.request.urlopen(r, timeout=15)

def file_cdn(asset_id):
    bare = asset_id.replace('file-', '')
    parts = bare.rsplit('-', 1)
    return f'https://cdn.sanity.io/files/{PROJECT}/{DATASET}/{parts[0]}.{parts[1]}'

def img_cdn(ref, w=1400):
    body = ref[len('image-'):]
    parts = body.split('-')
    ext = parts[-1]; dims = parts[-2]; hsh = '-'.join(parts[:-2])
    return f'https://cdn.sanity.io/images/{PROJECT}/{DATASET}/{hsh}-{dims}.{ext}?w={w}&auto=format&q=90'

def fetch_b64(ref, w=1400):
    if not ref: return ''
    try:
        r = urllib.request.urlopen(img_cdn(ref, w), timeout=12)
        ct = r.headers.get('Content-Type', 'image/jpeg')
        return f'data:{ct};base64,{base64.b64encode(r.read()).decode()}'
    except: return ''

def get_ref(obj):
    return ((obj or {}).get('asset') or {}).get('_ref', '') or ''

def load_fonts_b64():
    """Load all brand fonts as base64 for embedding in HTML."""
    font_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')
    fonts = {}
    mapping = {
        'Cor':  ('Cormorant Garamond', '300', 'normal', 'Cormorant-Light.ttf'),
        'CorI': ('Cormorant Garamond', '400', 'italic', 'Cormorant-Italic.ttf'),
        'CorSB':('Cormorant Garamond', '600', 'normal', 'Cormorant-SemiBold.ttf'),
        'DMS':  ('DM Sans', '400', 'normal', 'DMSans-Reg.ttf'),
        'DMSB': ('DM Sans', '700', 'normal', 'DMSans-Bold.ttf'),
        'DMM':  ('DM Mono', '400', 'normal', 'DMMono-Regular.ttf'),
        'DMMM': ('DM Mono', '500', 'normal', 'DMMono-Medium.ttf'),
    }
    css = ''
    for alias, (family, weight, style, fname) in mapping.items():
        p = os.path.join(font_dir, fname)
        if os.path.exists(p):
            with open(p, 'rb') as f: b64 = base64.b64encode(f.read()).decode()
            css += f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:{style};src:url('data:font/truetype;base64,{b64}') format('truetype');}}\n"
    return css

def call_claude(system, user):
    body = json.dumps({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 16000,
        'stream': True,
        'system': system,
        'messages': [{'role': 'user', 'content': user}]
    }).encode()
    r = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body)
    r.add_header('Content-Type', 'application/json')
    r.add_header('x-api-key', CLAUDE)
    r.add_header('anthropic-version', '2023-06-01')
    chunks = []
    with urllib.request.urlopen(r, timeout=240) as resp:
        for raw in resp:
            line = raw.decode('utf-8').strip()
            if not line.startswith('data:'): continue
            data = line[5:].strip()
            if data == '[DONE]': break
            try:
                ev = json.loads(data)
                if ev.get('type') == 'content_block_delta':
                    chunks.append(ev['delta'].get('text', ''))
            except: pass
    return ''.join(chunks).strip()

def html_to_pdf(html):
    """Convert HTML to PDF using wkhtmltopdf if available, else reportlab fallback."""
    # Try wkhtmltopdf first
    wk = None
    for path in ['/usr/bin/wkhtmltopdf', '/usr/local/bin/wkhtmltopdf', 'wkhtmltopdf']:
        try:
            subprocess.run([path, '--version'], capture_output=True, timeout=5)
            wk = path; break
        except: pass

    if wk:
        with tempfile.NamedTemporaryFile(suffix='.html', delete=False, mode='w') as hf:
            hf.write(html); hpath = hf.name
        ppath = hpath.replace('.html', '.pdf')
        try:
            r = subprocess.run([
                wk,
                '--page-size', 'A4',
                '--orientation', 'Landscape',
                '--print-media-type',
                '--enable-local-file-access',
                '--no-stop-slow-scripts',
                '--javascript-delay', '500',
                '--quiet',
                hpath, ppath
            ], capture_output=True, timeout=60)
            if os.path.exists(ppath):
                with open(ppath, 'rb') as f: return f.read()
        finally:
            for p in [hpath, ppath]:
                try: os.unlink(p)
                except: pass

    # Fallback: reportlab minimal
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.colors import HexColor
    buf = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
    buf.close()
    cv = rl_canvas.Canvas(buf.name, pagesize=landscape(A4))
    cv.setFillColor(HexColor('#090909'))
    cv.rect(0,0,*landscape(A4),fill=1,stroke=0)
    cv.setFillColor(HexColor('#c9a96e'))
    cv.setFont('Helvetica', 24)
    cv.drawString(50, 400, 'PDF generation requires wkhtmltopdf on this server.')
    cv.save()
    with open(buf.name,'rb') as f: pdf = f.read()
    os.unlink(buf.name)
    return pdf


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        try:
            slug = self.path.rstrip('/').split('/')[-1].split('?')[0]
            if not slug: return self._err(400, 'No slug')

            # 1. Fetch product
            P = sanity_fetch(f'''*[_type=="product" && slug.current=="{slug}" && status=="Active"][0]{{
                _id, productName, productFullName, tagline, shortDescription,
                series, skuBase, colorsStandard, mountingMethods,
                marineTreatable, customRalAvailable, ipRating,
                sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
                splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
                directivityHDeg, directivityVDeg, heightMm, widthMm, depthMm,
                weightKg, driverDescription, crossoverType, housingMaterial,
                grilleMaterial, speakerWireConnector, proprietaryTechBadges,
                heroImage, "gallery": galleryImages[0..3],
                "lifestyle": lifestyleImages[0..5],
                "accessories": accessories[]->{{name, category, heroImage, lifestyleImage}},
                brochureRef, brochureHash
            }}''')
            if not P: return self._err(404, 'Product not found')

            # 2. Cache check
            h = hashlib.md5(f"{P.get('productName')}{P.get('powerRmsW')}{P.get('depthMm')}".encode()).hexdigest()[:12]
            if P.get('brochureRef') and P.get('brochureHash') == h:
                cdn = file_cdn(P['brochureRef'])
                try:
                    urllib.request.urlopen(urllib.request.Request(cdn, method='HEAD'), timeout=5)
                    return self._redirect(cdn)
                except urllib.error.HTTPError as e:
                    if e.code == 403: return self._redirect(cdn)

            # 3. Fetch images as base64 data URIs
            hero  = fetch_b64(get_ref(P.get('heroImage')), 1600)
            gals  = [fetch_b64(get_ref(g), 900)  for g in (P.get('gallery')   or [])[:3]]
            lives = [fetch_b64(get_ref(l), 1200) for l in (P.get('lifestyle')  or [])[:5]]

            # Match accessory images to mount methods
            accs = P.get('accessories') or []
            mount_methods = [m.strip() for m in (P.get('mountingMethods') or '').split(',') if m.strip()]
            mount_imgs = {}
            for a in accs:
                aname = (a.get('name') or '').lower()
                img = fetch_b64(get_ref(a.get('lifestyleImage')) or get_ref(a.get('heroImage')), 900)
                if img:
                    for m in mount_methods:
                        if any(w.lower() in aname for w in m.lower().split()):
                            mount_imgs[m] = img

            # 4. Load fonts
            font_css = load_fonts_b64()

            # 5. Ask Claude to generate HTML
            tech = [b.strip().replace('™','').replace('\u2122','').replace('  ',' ')
                    for b in (P.get('proprietaryTechBadges') or '').split(',') if b.strip()]

            specs_a = {k:v for k,v in {
                'Power RMS':   f"{P['powerRmsW']}W"           if P.get('powerRmsW')    else None,
                'Power Peak':  f"{P['powerPeakW']}W"          if P.get('powerPeakW')   else None,
                'Sensitivity': f"{P['sensitivityDb']} dB"     if P.get('sensitivityDb') else None,
                'Frequency':   f"{P.get('freqLowHz')}Hz – {int(P['freqHighHz']//1000)}kHz {P.get('freqQualifier','')or ''}".strip() if P.get('freqHighHz') else None,
                'Impedance':   f"{P['impedanceOhms']}Ω"       if P.get('impedanceOhms') else None,
                'Max SPL':     f"{P['splMaxDb']} dB"          if P.get('splMaxDb')     else None,
                'THD+N':       P.get('thdN'),
                'Drivers':     P.get('driverDescription'),
                'Crossover':   P.get('crossoverType'),
                'Directivity': f"{P['directivityHDeg']}° H × {P['directivityVDeg']}° V" if P.get('directivityHDeg') else None,
            }.items() if v}
            specs_p = {k:v for k,v in {
                'H × W × D': f"{P.get('heightMm')} × {P.get('widthMm')} × {P.get('depthMm')} mm" if P.get('heightMm') else None,
                'Weight':    f"{P['weightKg']} kg"   if P.get('weightKg') else None,
                'Housing':   P.get('housingMaterial'),
                'Grille':    P.get('grilleMaterial'),
                'IP Rating': P.get('ipRating'),
                'Connector': P.get('speakerWireConnector'),
            }.items() if v}

            marine_txt = ' · '.join(filter(None,[P.get('ipRating',''),'Marine-grade' if P.get('marineTreatable') else ''])) or 'Standard'

            # Build mount data for prompt
            mounts_info = []
            life_idx = 0
            for m in mount_methods:
                img = mount_imgs.get(m, '')
                if not img and life_idx < len(lives):
                    img = lives[life_idx]; life_idx += 1
                mounts_info.append({'name': m, 'img': img})

            html = call_claude(
                system="""You are a luxury product brochure designer. Output ONLY raw HTML, nothing else.
No markdown, no explanation, no code fences. Start with <!DOCTYPE html>.""",

                user=f"""Create a stunning 4-page A4 landscape HTML brochure for this XSCACE luxury speaker.

The font CSS (with all fonts embedded as base64) is already provided — paste it as-is inside <style>.
FONT_CSS_PLACEHOLDER

Images are provided as base64 data URIs — use them directly in src="" attributes.

PRODUCT:
Name: {P.get('productName')} | Full: {P.get('productFullName','')}
Tagline: {P.get('tagline','')}
Description: {P.get('shortDescription','')}
Series: {P.get('series','')} | SKU: {P.get('skuBase','')}
Acoustic specs: {json.dumps(specs_a)}
Physical specs: {json.dumps(specs_p)}
Tech badges: {json.dumps(tech)}
Standard finishes: {P.get('colorsStandard','')}
Custom RAL: {'Available — any RAL, powder coat or anodised' if P.get('customRalAvailable') else 'Not available'}
Marine & IP: {marine_txt}
Mounting options: {json.dumps([m['name'] for m in mounts_info])}

IMAGES (base64 data URIs — use in img src= directly):
HERO_IMAGE: {hero[:80]}... (use full string: {repr('HERO_B64')})
LIFE1: {lives[0][:60] if lives else ''}... (use full: LIFE1_B64)
LIFE2: {lives[1][:60] if len(lives)>1 else ''}... LIFE2_B64
LIFE3: {lives[2][:60] if len(lives)>2 else ''}... LIFE3_B64
LIFE4: {lives[3][:60] if len(lives)>3 else ''}... LIFE4_B64
GAL1: {gals[0][:60] if gals else ''}... GAL1_B64
{chr(10).join(f'MOUNT_{i+1} ({m["name"]}): {m["img"][:60] if m["img"] else "none"}... MOUNT{i+1}_B64' for i,m in enumerate(mounts_info))}

DESIGN: background #090909, accent #c9a96e, text #eeebe5, muted #7a776f
Fonts: 'Cormorant Garamond' (headings), 'DM Sans' (body), 'DM Mono' (labels/specs)
Style: flat, no shadows, 0.5px champagne borders, luxury breathing room

PAGES (each 297mm × 210mm, page-break-after: always):

PAGE 1 COVER:
- Full black bg. Hero image on right 55% object-fit:cover height 100%.
- Overlay: linear-gradient(to right, #090909 42%, rgba(9,9,9,0.5) 65%, transparent 85%)
- Left: XSCACE in DM Mono 13px. Product name Cormorant 78px weight 300. Tagline Cormorant italic 20px #c9a96e.
  Description DM Sans 11px #7a776f. Thin champagne rule. Stats row: 4 key specs (value Cormorant 26px #c9a96e, label DM Mono 7px below).
  Footer: series·SKU left, XSCACE.COM right, DM Mono 8px #7a776f.
- Champagne bars top and bottom (5px).

PAGE 2 SPECS:
- Header: "XSCACE · NAME" left, "02 — 04" right, DM Mono 8px.
- "Specifications" Cormorant 44px.
- Left 50%: ACOUSTIC group then PHYSICAL group. Each row: label DM Mono 8px #7a776f, value DM Mono 8px #eeebe5 right-aligned. Thin separator lines.
- Right 46%: hero image top 55% (object-fit:contain, dark bg), lifestyle image bottom 40% (object-fit:cover).
- Below specs (full width): "MOUNTING OPTIONS" label. Flex row of cards — each card: image top 75% object-fit:cover (or placeholder dark div), mount name DM Mono 8px bottom strip.

PAGE 3 TECH:
- "Designed to" Cormorant 50px + line break + "disappear." Cormorant italic 50px #c9a96e. NO image strip.
- "PROPRIETARY TECHNOLOGY" DM Mono 8px + champagne rule.
- 3-column grid of tech badges. Each: unique inline SVG icon (60×50 viewBox, stroke #c9a96e, fill none):
  * PsySculpt: sine wave path across full width
  * XS-Flow: U-bend tube with 3 outlet dots
  * Nano Resonance: 5 lines fanning from bottom point
  * PrecisionXover Array: 8 vertical bars varying height, filled #c9a96e
  * AeroFrame Chassis: asterisk of 8 spokes + inner circle
  * PowerDense Dynamics: lightning bolt + 3 arc lines
  Badge name below in DM Mono 7px #c9a96e.
- Bottom: 3 bordered cards (border 0.5px rgba(201,169,110,0.3)):
  1. Standard Finishes: colour swatches (div squares) + names
  2. Custom RAL: SVG colour wheel (6-segment pie) + text
  3. Marine & IP: SVG water droplet + text

PAGE 4 GALLERY:
- "In context." Cormorant 40px + champagne rule.
- 2×2 grid of lifestyle images, object-fit:cover, fills height.
- Footer strip: "Enquire or specify at xscace.com" Cormorant 18px, "support@xscace.com" DM Mono 9px #c9a96e. Right: "XSCACE · SIZE DEFYING SOUND" DM Mono 7px.

Use HERO_B64, LIFE1_B64, LIFE2_B64, LIFE3_B64, LIFE4_B64, GAL1_B64, MOUNT1_B64, MOUNT2_B64, MOUNT3_B64 as placeholder strings in src attributes."""
            )

            # Strip markdown
            if html.startswith('```'): html = html.split('\n',1)[1].rsplit('```',1)[0].strip()

            # Inject font CSS
            html = html.replace('FONT_CSS_PLACEHOLDER', font_css)

            # Inject images
            html = html.replace('HERO_B64',   hero or '')
            for i,l in enumerate(lives,1):   html = html.replace(f'LIFE{i}_B64',  l or '')
            for i,g in enumerate(gals,1):     html = html.replace(f'GAL{i}_B64',  g or '')
            for i,m in enumerate(mounts_info,1): html = html.replace(f'MOUNT{i}_B64', m['img'] or '')

            print(f'[brochure] HTML: {len(html):,} chars', file=sys.stderr)

            # 6. Convert to PDF
            pdf_bytes = html_to_pdf(html)
            print(f'[brochure] PDF: {len(pdf_bytes):,} bytes', file=sys.stderr)

            # 7. Upload and cache
            if TOKEN and len(pdf_bytes) > 1000:
                try:
                    fname    = f"XSCACE_{P['productName'].replace(' ','_')}_Brochure.pdf"
                    asset_id = sanity_upload(pdf_bytes, fname)
                    sanity_patch(P['_id'], {
                        'brochureRef':  asset_id,
                        'brochureHash': h,
                        'brochure':     {'_type':'file','asset':{'_type':'reference','_ref':asset_id}}
                    })
                    print(f'[brochure] cached: {asset_id}', file=sys.stderr)
                except Exception as e:
                    print(f'[brochure] upload failed: {e}', file=sys.stderr)

            fname = f'XSCACE_{slug}_Brochure.pdf'
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'inline; filename="{fname}"')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception:
            self._err(500, traceback.format_exc())

    def _redirect(self, url):
        self.send_response(302)
        self.send_header('Location', url)
        self.send_header('Cache-Control', 'public,max-age=86400')
        self.end_headers()

    def _err(self, code, msg):
        body = json.dumps({'error': str(msg)[:3000]}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
