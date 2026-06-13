"""
api/brochure/[slug].py
Vercel Python serverless — on-demand product brochure with Sanity caching.
"""

from http.server import BaseHTTPRequestHandler
import sys, os, json, tempfile, urllib.request, urllib.parse, hashlib

PROJECT_ID  = '7r0kq57d'
DATASET     = 'production'
API_VERSION = '2024-01-01'
TOKEN       = os.environ.get('SANITY_API_TOKEN', '')

def sanity_fetch(query):
    url = f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data/query/{DATASET}?query={urllib.parse.quote(query)}'
    req = urllib.request.Request(url)
    if TOKEN: req.add_header('Authorization', f'Bearer {TOKEN}')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['result']

def sanity_upload(pdf_bytes, filename):
    url = f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/assets/files/{DATASET}?filename={urllib.parse.quote(filename)}'
    req = urllib.request.Request(url, data=pdf_bytes, method='POST')
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/pdf')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['document']['_id']

def sanity_patch(doc_id, fields):
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    req  = urllib.request.Request(
        f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data/mutate/{DATASET}',
        data=body, method='POST')
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def cdn_url(ref):
    return f'https://cdn.sanity.io/files/{PROJECT_ID}/{DATASET}/{ref.replace("file-","").replace("-pdf",".pdf")}'

def img_cdn(ref, w=1200):
    # Convert image ref to CDN URL
    body = ref.replace('image-', '')
    parts = body.rsplit('-', 1)
    ext = parts[-1] if len(parts) == 2 else 'jpg'
    img_id = parts[0].replace('-', '/', 1)
    return f'https://cdn.sanity.io/images/{PROJECT_ID}/{DATASET}/{img_id}.{ext}?w={w}&auto=format'

def fetch_img(ref, w=1200):
    if not ref: return None
    try:
        url = img_cdn(ref, w)
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read()
    except:
        return None

def brochure_hash(p):
    fields = {k: p.get(k) for k in [
        'productName','tagline','shortDescription','sensitivityDb','powerRmsW',
        'powerPeakW','impedanceOhms','freqLowHz','freqHighHz','depthMm','weightKg',
        'proprietaryTechBadges','colorsStandard','mountingMethods','series',
    ]}
    return hashlib.md5(json.dumps(fields, sort_keys=True).encode()).hexdigest()[:12]

def generate_brochure(product, tmp_dir):
    import subprocess
    base     = os.path.dirname(os.path.abspath(__file__))
    gen_py   = os.path.join(base, 'brochure_gen.py')
    if not os.path.exists(gen_py):
        gen_py = os.path.join(os.getcwd(), 'brochure_gen.py')
    json_path = os.path.join(tmp_dir, 'product.json')
    out_path  = os.path.join(tmp_dir, 'brochure.pdf')
    with open(json_path, 'w') as f:
        json.dump(product, f)
    env = {**os.environ, 'XSCACE_CHART_DIR': tmp_dir}
    r = subprocess.run([sys.executable, gen_py, '--product', json_path, '--out', out_path],
                       env=env, timeout=90, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f'brochure_gen.py failed: {r.stdout} {r.stderr}')
    with open(out_path, 'rb') as f:
        return f.read()


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        try:
            slug = self.path.split('/')[-1].split('?')[0]
            if not slug:
                self._err(400, 'No slug'); return

            # ── 1. Fetch product ─────────────────────────────────────────────
            rows = sanity_fetch(f'''*[_type=="product" && slug.current=="{slug}" && status=="Active"][0]{{
                _id, productName, productFullName, tagline, shortDescription, series, skuBase,
                sensitivityDb, powerRmsW, powerPeakW, impedanceOhms, splMaxDb, thdN,
                freqLowHz, freqHighHz, freqQualifier,
                directivityHDeg, directivityVDeg,
                heightMm, widthMm, depthMm, weightKg,
                driverDescription, crossoverType, housingMaterial, grilleMaterial,
                ipRating, mountingMethods, speakerWireConnector,
                proprietaryTechBadges, colorsStandard,
                heroImage, lifestyleImages, galleryImages,
                brochureRef, brochureHash
            }}''')

            if not rows:
                self._err(404, 'Product not found'); return
            product = rows

            # ── 2. Check cache ───────────────────────────────────────────────
            current_hash = brochure_hash(product)
            cached_ref   = product.get('brochureRef')
            if cached_ref and product.get('brochureHash') == current_hash:
                url = cdn_url(cached_ref)
                try:
                    urllib.request.urlopen(urllib.request.Request(url, method='HEAD'), timeout=5)
                    self.send_response(302)
                    self.send_header('Location', url)
                    self.send_header('Cache-Control', 'public, max-age=3600')
                    self.end_headers()
                    return
                except:
                    pass

            # ── 3. Fetch images ──────────────────────────────────────────────
            hero_ref = (product.get('heroImage') or {}).get('asset', {}).get('_ref', '')
            if hero_ref:
                product['_hero_img_bytes'] = fetch_img(hero_ref, 1200)

            life_refs = []
            for src in ['lifestyleImages', 'galleryImages']:
                for img in (product.get(src) or []):
                    ref = (img.get('asset') or {}).get('_ref', '')
                    if ref: life_refs.append(ref)
            product['_lifestyle_bytes'] = [fetch_img(r, 1200) for r in life_refs[:3]]

            # ── 4. Generate ──────────────────────────────────────────────────
            with tempfile.TemporaryDirectory() as tmp_dir:
                pdf_bytes = generate_brochure(product, tmp_dir)

            # ── 5. Upload + cache ────────────────────────────────────────────
            if TOKEN:
                try:
                    fname  = f'XSCACE_{product["productName"].replace(" ","_")}_Brochure.pdf'
                    ref_id = sanity_upload(pdf_bytes, fname)
                    sanity_patch(product['_id'], {'brochureRef': ref_id, 'brochureHash': current_hash})
                except Exception as e:
                    print(f'[brochure] upload failed (non-fatal): {e}', file=sys.stderr)

            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="XSCACE_{slug}_Brochure.pdf"')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception as e:
            self._err(500, str(e))

    def _err(self, code, msg):
        body = json.dumps({'error': msg}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
