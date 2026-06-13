# Requires vercel.json: {"functions": {"api/brochure/[slug].py": {"maxDuration": 300}}}
"""
api/brochure/[slug].py
Claude writes a reportlab PDF brochure from Sanity data → uploads → caches.
Second request serves instantly from Sanity CDN.
"""
from http.server import BaseHTTPRequestHandler
import sys, os, json, urllib.request, urllib.parse, hashlib, traceback, base64, tempfile, subprocess

sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')

PROJECT = '7r0kq57d'; DATASET = 'production'
TOKEN   = os.environ.get('SANITY_API_TOKEN', '')
CLAUDE  = os.environ.get('ANTHROPIC_API_KEY', '')
API     = f'https://{PROJECT}.api.sanity.io/v2024-01-01'

def sanity_fetch(q):
    url = f'{API}/data/query/{DATASET}?query={urllib.parse.quote(q)}'
    req = urllib.request.Request(url)
    if TOKEN: req.add_header('Authorization', f'Bearer {TOKEN}')
    return json.loads(urllib.request.urlopen(req, timeout=20).read())['result']

def img_url(ref, w=1200):
    body = ref[len('image-'):]
    parts = body.split('-')
    ext = parts[-1]; dims = parts[-2]
    hsh = '-'.join(parts[:-2])
    return f'https://cdn.sanity.io/images/{PROJECT}/{DATASET}/{hsh}-{dims}.{ext}?w={w}&auto=format&q=88'

def fetch_img(ref, w=1200):
    if not ref: return None
    try:
        r = urllib.request.urlopen(img_url(ref, w), timeout=12)
        return r.read()
    except: return None

def call_claude(prompt):
    body = json.dumps({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 8000,
        'stream': True,
        'system': '''You are an expert Python developer specialising in reportlab PDF generation.
You write complete, runnable Python scripts that generate beautiful luxury product brochures.
Output ONLY executable Python code. No markdown. No explanation. No code fences.
The script must read product data from a JSON file at sys.argv[1] and write a PDF to sys.argv[2].''',
        'messages': [{'role': 'user', 'content': prompt}]
    }).encode()
    req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body)
    req.add_header('Content-Type', 'application/json')
    req.add_header('x-api-key', CLAUDE)
    req.add_header('anthropic-version', '2023-06-01')
    # Stream so we read chunks as they arrive — avoids the 90s read timeout
    chunks = []
    with urllib.request.urlopen(req, timeout=240) as r:
        for raw_line in r:
            line = raw_line.decode('utf-8').strip()
            if not line.startswith('data:'): continue
            data = line[5:].strip()
            if data == '[DONE]': break
            try:
                ev = json.loads(data)
                if ev.get('type') == 'content_block_delta':
                    chunks.append(ev['delta'].get('text', ''))
            except: pass
    code = ''.join(chunks).strip()
    if code.startswith('```'): code = code.split('\n', 1)[1].rsplit('```', 1)[0]
    return code

def sanity_upload(pdf_bytes, fname):
    url = f'{API}/assets/files/{DATASET}?filename={urllib.parse.quote(fname)}'
    req = urllib.request.Request(url, data=pdf_bytes)
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/pdf')
    return json.loads(urllib.request.urlopen(req, timeout=40).read())['document']['_id']

def sanity_patch(doc_id, fields):
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    req = urllib.request.Request(f'{API}/data/mutate/{DATASET}', data=body)
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    urllib.request.urlopen(req, timeout=15)

def file_cdn(asset_id):
    bare = asset_id.replace('file-', '')
    parts = bare.rsplit('-', 1)
    return f'https://cdn.sanity.io/files/{PROJECT}/{DATASET}/{parts[0]}.{parts[1]}'


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        try:
            slug = self.path.rstrip('/').split('/')[-1].split('?')[0]
            if not slug: return self._err(400, 'No slug')

            # 1. Fetch product
            P = sanity_fetch(f'''
                *[_type=="product" && slug.current=="{slug}" && status=="Active"][0]{{
                    _id, productName, productFullName, tagline, shortDescription,
                    series, skuBase, colorsStandard, mountingMethods,
                    marineTreatable, customRalAvailable, ipRating,
                    sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
                    splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
                    directivityHDeg, directivityVDeg, heightMm, widthMm, depthMm,
                    weightKg, driverDescription, crossoverType, housingMaterial,
                    grilleMaterial, speakerWireConnector, proprietaryTechBadges,
                    heroImage, "gallery": galleryImages[0..2],
                    "lifestyle": lifestyleImages[0..3],
                    brochureRef, brochureHash
                }}
            ''')
            if not P: return self._err(404, 'Product not found')

            # 2. Cache check
            h = hashlib.md5(f"{P.get('productName')}{P.get('powerRmsW')}{P.get('depthMm')}".encode()).hexdigest()[:12]
            if P.get('brochureRef') and P.get('brochureHash') == h:
                cdn = file_cdn(P['brochureRef'])
                try:
                    urllib.request.urlopen(urllib.request.Request(cdn, method='HEAD'), timeout=5)
                    self.send_response(302)
                    self.send_header('Location', cdn)
                    self.send_header('Cache-Control', 'public,max-age=86400')
                    self.end_headers()
                    return
                except urllib.error.HTTPError as e:
                    if e.code == 403:   # exists, needs token — serve redirect anyway
                        self.send_response(302)
                        self.send_header('Location', cdn)
                        self.send_header('Cache-Control', 'public,max-age=86400')
                        self.end_headers()
                        return

            # 3. Fetch images
            def get_ref(obj): return (obj or {}).get('asset', {}).get('_ref')
            hero_bytes = fetch_img(get_ref(P.get('heroImage')), 1600)
            gal_bytes  = [fetch_img(get_ref(g), 900)  for g in (P.get('gallery')   or [])[:2]]
            life_bytes = [fetch_img(get_ref(l), 1200) for l in (P.get('lifestyle')  or [])[:3]]

            with tempfile.TemporaryDirectory() as tmp:
                # Save images to disk for the generated script to use
                def save_img(data, name):
                    if not data: return ''
                    p = os.path.join(tmp, name)
                    with open(p, 'wb') as f: f.write(data)
                    return p

                img_paths = {
                    'hero':  save_img(hero_bytes, 'hero.jpg'),
                    'gal1':  save_img(gal_bytes[0]  if len(gal_bytes)  > 0 else None, 'gal1.jpg'),
                    'gal2':  save_img(gal_bytes[1]  if len(gal_bytes)  > 1 else None, 'gal2.jpg'),
                    'life1': save_img(life_bytes[0] if len(life_bytes) > 0 else None, 'life1.jpg'),
                    'life2': save_img(life_bytes[1] if len(life_bytes) > 1 else None, 'life2.jpg'),
                    'life3': save_img(life_bytes[2] if len(life_bytes) > 2 else None, 'life3.jpg'),
                }

                # 4. Build product data for Claude
                product_data = {
                    'name':        P.get('productName', ''),
                    'full_name':   P.get('productFullName', ''),
                    'tagline':     P.get('tagline', ''),
                    'description': P.get('shortDescription', ''),
                    'series':      P.get('series', ''),
                    'sku':         P.get('skuBase', ''),
                    'specs': {k: v for k, v in {
                        'Power RMS':   f"{P['powerRmsW']}W"           if P.get('powerRmsW')    else None,
                        'Power Peak':  f"{P['powerPeakW']}W"          if P.get('powerPeakW')   else None,
                        'Sensitivity': f"{P['sensitivityDb']} dB"     if P.get('sensitivityDb') else None,
                        'Frequency':   f"{P.get('freqLowHz')}Hz – {int(P['freqHighHz']//1000)}kHz {P.get('freqQualifier','') or ''}".strip() if P.get('freqHighHz') else None,
                        'Impedance':   f"{P['impedanceOhms']}Ω"       if P.get('impedanceOhms') else None,
                        'Max SPL':     f"{P['splMaxDb']} dB"          if P.get('splMaxDb')     else None,
                        'THD+N':       P.get('thdN'),
                        'Drivers':     P.get('driverDescription'),
                        'Crossover':   P.get('crossoverType'),
                        'Directivity': f"{P['directivityHDeg']}° H × {P['directivityVDeg']}° V" if P.get('directivityHDeg') else None,
                        'H × W × D':  f"{P.get('heightMm')} × {P.get('widthMm')} × {P.get('depthMm')} mm" if P.get('heightMm') else None,
                        'Weight':      f"{P['weightKg']} kg"          if P.get('weightKg')     else None,
                        'Housing':     P.get('housingMaterial'),
                        'Grille':      P.get('grilleMaterial'),
                        'IP Rating':   P.get('ipRating'),
                        'Connector':   P.get('speakerWireConnector'),
                        'Mounting':    P.get('mountingMethods'),
                    }.items() if v},
                    'finishes':    P.get('colorsStandard', ''),
                    'custom_ral':  P.get('customRalAvailable', False),
                    'marine':      P.get('marineTreatable', False),
                    'tech_badges': [b.strip().replace('™','').replace('\u2122','')
                                    for b in (P.get('proprietaryTechBadges') or '').split(',') if b.strip()],
                    'images':      {k: v for k, v in img_paths.items() if v},
                }

                data_path = os.path.join(tmp, 'product.json')
                pdf_path  = os.path.join(tmp, 'brochure.pdf')
                with open(data_path, 'w') as f: json.dump(product_data, f)

                # 5. Ask Claude to write the reportlab script
                font_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')
                prompt = f"""Write a complete Python script using reportlab to generate a beautiful 3-page A4 landscape PDF brochure for this XSCACE luxury speaker product.

PRODUCT JSON (read from sys.argv[1]):
{json.dumps(product_data, indent=2)}

The script must:
- Read product data: import json; P = json.load(open(sys.argv[1]))
- Write PDF to sys.argv[2]
- Use A4 landscape: from reportlab.lib.pagesizes import landscape, A4; W,H = landscape(A4)
- Register fonts from this directory: {font_dir}
  Available: Cormorant-Light.ttf, Cormorant-Regular.ttf, Cormorant-SemiBold.ttf, Cormorant-Italic.ttf,
             DMSans-Reg.ttf, DMSans-Med.ttf, DMSans-Bold.ttf, DMMono-Regular.ttf, DMMono-Medium.ttf
  Also check for MagmaWave.otf (logo only). Use try/except for each font.
- Use these exact colours: BG=#090909, CHAMP=#c9a96e, TEXT=#eeebe5, MUTED=#7a776f, DARK=#0e0e0c

PAGE 1 — COVER:
- Black background full page
- Thin champagne bar top and bottom (3pt)  
- If hero image exists: draw it covering right 55% of page, then draw a gradient overlay fading from black on left edge using 60 semi-transparent black rectangles
- Left side: "XSCACE" in MagmaWave/DMSans-Bold 18pt, "SIZE DEFYING SOUND" in DMMono 8pt below
- Large product name in Cormorant-Light ~60pt, champagne italic tagline below
- Short description in DMSans 11pt, champagne rule
- Bottom: 4 key specs in Cormorant-SemiBold 22pt with DMMono labels below (Power, Sensitivity, Impedance, Depth)
- Series + SKU bottom left, XSCACE.COM bottom right, page number centred

PAGE 2 — SPECIFICATIONS:
- Black background
- Champagne top/bottom bars
- Header: "XSCACE · PRODUCT NAME" left, "02 — 03" right
- "Specifications" in Cormorant-Light 36pt  
- Left 52%: two spec groups (ACOUSTIC, PHYSICAL) with champagne group labels, spec rows (label in MUTED DMMono 8pt, value right-aligned TEXT DMMono 8pt), faint row separators
- Mounting options as separate group below specs
- Right 44%: hero image top half contained in dark box, life1 image bottom half if available

PAGE 3 — TECHNOLOGY + FINISHES:
- Black background
- Champagne top/bottom bars
- "Designed to" in Cormorant-Light 44pt + "disappear." in Cormorant-Italic champagne same size
- life1 or life2 image as full-width strip (28% of page height) below headline
- "PROPRIETARY TECHNOLOGY" in DMMono champagne label + thin rule
- Tech badges in 3-column grid — for each badge draw:
  * A simple vector icon using reportlab paths (PsySculpt=sine wave path, XS-Flow=U-shape path, Nano Resonance=fan lines, PrecisionXover=vertical bars, AeroFrame=radial spokes, PowerDense=arc lines)
  * Badge name in DMMono 8pt champagne below icon
- Bottom row: 3 info boxes with champagne borders (0.5pt): "STANDARD FINISHES" | "CUSTOM RAL" | "MARINE & IP"
  Each box: label in DMMono champagne 7pt, value in DMSans 9pt TEXT

Image loading: use from reportlab.lib.utils import ImageReader and draw with c.drawImage(ImageReader(path), x, y, w, h, preserveAspectRatio=True, mask='auto') wrapped in try/except.
If an image path doesn't exist or fails, skip it gracefully.

Make it genuinely beautiful — proper whitespace, typographic hierarchy, the feeling of a luxury brand document. Use all the product data provided."""

                code = call_claude(prompt)

                # Save and run the generated script
                script_path = os.path.join(tmp, 'gen.py')
                with open(script_path, 'w') as f: f.write(code)

                r = subprocess.run(
                    [sys.executable, script_path, data_path, pdf_path],
                    capture_output=True, text=True, timeout=60,
                    env={**os.environ, 'XSCACE_BROCHURE_FONTS': font_dir}
                )
                print(f'[brochure] gen stdout: {r.stdout[-300:]}', file=sys.stderr)
                print(f'[brochure] gen stderr: {r.stderr[-500:]}', file=sys.stderr)

                if r.returncode != 0 or not os.path.exists(pdf_path):
                    raise RuntimeError(f'Generation failed: {r.stderr[-800:]}')

                with open(pdf_path, 'rb') as f:
                    pdf_bytes = f.read()

            print(f'[brochure] PDF size: {len(pdf_bytes)} bytes', file=sys.stderr)

            # 6. Upload and cache
            if TOKEN and len(pdf_bytes) > 1000:
                try:
                    fname    = f"XSCACE_{P['productName'].replace(' ','_')}_Brochure.pdf"
                    asset_id = sanity_upload(pdf_bytes, fname)
                    sanity_patch(P['_id'], {
                        'brochureRef': asset_id,
                        'brochureHash': h,
                        'brochure': {'_type': 'file', 'asset': {'_type': 'reference', '_ref': asset_id}}
                    })
                    print(f'[brochure] cached as {asset_id}', file=sys.stderr)
                except Exception as e:
                    print(f'[brochure] upload failed (non-fatal): {e}', file=sys.stderr)

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

    def _err(self, code, msg):
        body = json.dumps({'error': str(msg)[:3000]}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
