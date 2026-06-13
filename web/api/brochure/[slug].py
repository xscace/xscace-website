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
                prompt = f"""Write a complete Python script that generates a 4-page A4 landscape PDF brochure.

CRITICAL: Start your script with exactly these two lines and nothing before them:
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brochure_base import *

Then read data: P = json.load(open(sys.argv[1]))
Write PDF to: sys.argv[2]

PRODUCT DATA:
{json.dumps(product_data, indent=2)}

IMAGE FILES (absolute paths — use draw_img() to render them):
{json.dumps(img_paths, indent=2)}

USE ONLY these functions from brochure_base (already imported via *):
- F('Cor')=Cormorant Light, F('CorI')=Cormorant Italic, F('CorSB')=Cormorant SemiBold
- F('DMS')=DM Sans, F('DMSM')=DM Sans Medium, F('DMSB')=DM Sans Bold
- F('DMM')=DM Mono, F('Magma')=MagmaWave logo
- draw_img(c, path, x, y, w, h, cover=True/False) — draws image from file
- draw_tech_icon(c, badge_name, cx, cy, sc=0.42) — draws correct SVG tech icon
- draw_finish_card(c, x, y, w, h, label, content, icon_type, colors) — bordered card
- draw_mount_block(c, x, y, w, h, name, img_path) — mounting option with image
- wrap_text(c, text, x, y, max_w, font, size, color) — word-wrapped text
- rule(c, y, x=0, w=None, lw=0.8) — draws champagne rule line
- fill_rect(c, x, y, w, h, col) — fills rectangle
- W, H = A4 landscape dimensions, BG, CHAMP, TEXT, MUTED, DARK, DIM = preset colors
- champ_a(a), bg_a(a), white_a(a) — colors with alpha

NEVER call c.setFont() with a raw font name string — always use F('alias').
NEVER import reportlab fonts yourself — brochure_base handles all font registration.

PAGE 1 — COVER (W x H canvas):
- fill_rect full page BG
- If hero image: draw_img cover=True on right 56% (x=W*0.44). Then 60 gradient rects fading black from W*0.44 rightward
- Champagne bars: fill_rect(c, 0, H-6, W, 6, CHAMP) top, fill_rect(c, 0, 0, W, 6, CHAMP) bottom
- Left column (x=50): "XSCACE" F('Magma') or F('DMSB') size 18, MUTED "SIZE DEFYING SOUND" F('DMM') 7pt below
- Product name P['name'] in F('Cor') 58pt TEXT, y=H*0.52
- Tagline in F('CorI') 18pt CHAMP below name
- Short description wrap_text F('DMS') 11pt MUTED, width=W*0.30
- rule() at y=H*0.18+8, width W*0.34
- Key stats row at y=H*0.18: power, sensitivity, impedance, depth — each: value F('CorSB') 22pt CHAMP, label F('DMM') 6pt MUTED below. Space them W*0.34/4 apart starting x=50
- Footer: series+SKU MUTED F('DMM') 9pt at y=32, "XSCACE.COM" right-aligned

PAGE 2 — SPECIFICATIONS + MOUNTING OPTIONS:
- fill_rect BG, champagne bars
- Header: "XSCACE · NAME" F('DMM') 8pt MUTED left, "02 — 04" right, at y=H-20
- rule at y=H-26, lw=0.3
- "Specifications" F('Cor') 36pt TEXT at y=H-50
- Left col width=W*0.50: two spec groups ACOUSTIC and PHYSICAL
  Each group: group name F('DMM') 8pt CHAMP, rule lw=0.3, then rows:
  label F('DMM') 8pt MUTED left, value F('DMM') 8pt TEXT right-aligned at x+colw
  After each row: thin white_a(0.05) rule
- Mounting options section below specs with label "MOUNTING OPTIONS" F('DMM') 8pt CHAMP + rule
- Then mounting cards side by side using draw_mount_block():
  Parse P['specs']['Mounting'] by comma to get mount names list
  Assign lifestyle images: life1→first mount, life2→second, life3→third
  Each card width = (W*0.48) / num_mounts, height = 110pt
  Place starting x=50, y=50
- Right col x=W*0.53: draw_img hero image contained in dark box top 55% of usable height; life1 image bottom 40%

PAGE 3 — TECHNOLOGY + FINISHES:
- fill_rect BG, champagne bars
- Header: "XSCACE · NAME" left, "03 — 04" right
- "Designed to" F('Cor') 42pt TEXT + "disappear." F('CorI') 42pt CHAMP on next line, at y=H-50
- Life2 or life1 full-width image strip: x=0, y=H-170, width=W, height=100, cover=True, then bg_a(0.18) overlay
- "PROPRIETARY TECHNOLOGY" F('DMM') 8pt CHAMP + rule at y=H-188
- Tech badge grid: 3 per row, cell width=W/3
  For each badge in P['tech_badges']:
    cx = col_index * W/3 + W/6
    cy = start_y - row * 85
    draw_tech_icon(c, badge, cx, cy+20)  ← uses correct icon
    badge name: c.setFillColor(CHAMP); c.setFont(F('DMM'), 7.5); c.drawCentredString(cx, cy, badge.upper())
- Bottom row (y=55, height=70, split into 3): three finish cards using draw_finish_card():
  Card 1: label='Standard Finishes', content=P['finishes'], icon_type='swatches',
    colors=[('#0A0A0A','Black'),('#F2F0EC','White'),('#C9A96E','Champagne'),('#3C3F41','Slate')]
  Card 2: label='Custom RAL', content='Any RAL colour' if P['custom_ral'] else 'Not available', icon_type='ral'
  Card 3: label='Marine & IP', content=ip_string, icon_type='marine'
  Each card: x=i*(W/3)+8, y=55, w=W/3-16, h=70

PAGE 4 — LIFESTYLE GALLERY + CONTACT:
- fill_rect BG, champagne bars
- Header: "XSCACE · NAME" left, "04 — 04" right
- "In context." F('Cor') 36pt TEXT at y=H-50
- rule at y=H-62
- Gallery grid: up to 4 lifestyle images in 2×2 grid
  gw=(W-60)/2, gh=(H-130)/2
  Positions: (30, H*0.5), (40+gw, H*0.5), (30, H*0.5-gh-6), (40+gw, H*0.5-gh-6)
  draw_img each, cover=True. If image missing skip or leave placeholder fill_rect DARK
- Bottom strip y=0 to 60: fill_rect DARK
  "Enquire or specify at xscace.com" F('Cor') 18pt TEXT at x=50, y=35
  "support@xscace.com" F('DMM') 9pt CHAMP at x=50, y=18
  "XSCACE · SIZE DEFYING SOUND" F('DMM') 7pt MUTED right-aligned at y=18

Output ONLY the Python script. Nothing else."""


                code = call_claude(prompt)

                # Copy brochure_base into tmp so gen.py can import it
                base_src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'brochure_base.py')
                if os.path.exists(base_src):
                    import shutil
                    shutil.copy(base_src, os.path.join(tmp, 'brochure_base.py'))

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
