"""
api/specsheet/[slug].py
Vercel Python serverless function — on-demand spec sheet generation with Sanity caching.
"""

from http.server import BaseHTTPRequestHandler
import sys, os, json, math, tempfile, urllib.request, urllib.parse, hashlib, time

PROJECT_ID  = '7r0kq57d'
DATASET     = 'production'
API_VERSION = '2024-01-01'

# ── Sanity helpers ─────────────────────────────────────────────────────────────
def sanity_fetch(query: str, token: str = '') -> list:
    url = f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data/query/{DATASET}?query={urllib.parse.quote(query)}'
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['result']

def sanity_upload(pdf_bytes: bytes, filename: str, token: str) -> str:
    url = f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/assets/files/{DATASET}?filename={urllib.parse.quote(filename)}'
    req = urllib.request.Request(url, data=pdf_bytes, method='POST')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/pdf')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['document']['_id']

def sanity_patch(doc_id: str, fields: dict, token: str):
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    req  = urllib.request.Request(
        f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data/mutate/{DATASET}',
        data=body, method='POST'
    )
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def cdn_url(ref: str) -> str:
    return f'https://cdn.sanity.io/files/{PROJECT_ID}/{DATASET}/{ref.replace("file-","").replace("-pdf",".pdf")}'

# ── Spec hash — same fields as route.ts ───────────────────────────────────────
def spec_hash(p: dict) -> str:
    fields = {k: p.get(k) for k in [
        'sensitivityDb','powerRmsW','powerPeakW','impedanceOhms',
        'freqLowHz','freqHighHz','freqQualifier',
        'directivityHDeg','directivityVDeg','splMaxDb','thdN','eqData',
        'heightMm','widthMm','depthMm','weightKg',
        'driverDescription','crossoverType','housingMaterial','grilleMaterial','ipRating',
    ]}
    return hashlib.md5(json.dumps(fields, sort_keys=True).encode()).hexdigest()[:12]

# ── PDF generation ─────────────────────────────────────────────────────────────
def generate_pdf(product: dict, tmp_dir: str) -> bytes:
    import subprocess
    # On Vercel, cwd = project root. Scripts sit at project root (web/).
    # Locally __file__ dir also works. Try cwd first, then file dir.
    cwd        = os.getcwd()
    base       = os.path.dirname(os.path.abspath(__file__))
    charts_py  = os.path.join(cwd, 'charts_slim.py') if os.path.exists(os.path.join(cwd,'charts_slim.py')) else os.path.join(base,'charts_slim.py')
    gen_py     = os.path.join(cwd, 'specsheet_gen.py') if os.path.exists(os.path.join(cwd,'specsheet_gen.py')) else os.path.join(base,'specsheet_gen.py')
    json_path  = os.path.join(tmp_dir, 'product.json')
    out_path   = os.path.join(tmp_dir, 'specsheet.pdf')

    with open(json_path, 'w') as f:
        json.dump(product, f)

    env = {**os.environ, 'XSCACE_CHART_DIR': tmp_dir}
    r1 = subprocess.run([sys.executable, charts_py], env=env, timeout=60, capture_output=True, text=True)
    if r1.returncode != 0:
        raise RuntimeError(f'charts failed: {r1.stdout} {r1.stderr}')
    r2 = subprocess.run([sys.executable, gen_py, '--product', json_path, '--out', out_path], env=env, timeout=60, capture_output=True, text=True)
    if r2.returncode != 0:
        raise RuntimeError(f'gen failed: {r2.stdout} {r2.stderr}')

    with open(out_path, 'rb') as f:
        return f.read()

# ── Handler ────────────────────────────────────────────────────────────────────
class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        token = os.environ.get('SANITY_API_TOKEN', '')

        # Extract slug from path: /api/specsheet/<slug>
        slug = urllib.parse.unquote(self.path.split('?')[0].rstrip('/').split('/')[-1])
        if not slug:
            return self._json(400, {'error': 'No slug provided'})

        # ── 1. Fetch all products, filter in Python ────────────────────────────
        try:
            products = sanity_fetch(
                f'''*[_type == "product"]{{
                  _id, productName, productFullName, tagline, skuBase, series, launchYear,
                  powerRmsW, powerPeakW, impedanceOhms, sensitivityDb, splMaxDb,
                  freqLowHz, freqHighHz, freqQualifier,
                  driverDescription, crossoverType, recommendedCrossoverHz,
                  directivityHDeg, directivityVDeg,
                  thdN, grilleMaterial, paintableGrille,
                  housingMaterial, heightMm, widthMm, depthMm, weightKg,
                  ipRating, mountingMethods, speakerWireConnector, wireGaugeRecommended,
                  eqData, eqProfileName, specConfidence,
                  "slug": slug.current,
                  "specSheetRef":  specSheet.asset._ref,
                  "specSheetHash": specSheetHash
                }}''',
                token
            )
        except Exception as e:
            return self._json(500, {'error': 'Sanity fetch failed', 'detail': str(e)})

        s = slug.lower()
        product = next((p for p in (products or []) if
            (p.get('slug') or '').lower() == s or
            (p.get('productName') or '').lower() == s or
            (p.get('skuBase') or '').lower() == s), None)

        if not product:
            return self._json(404, {'error': 'Product not found', 'slug': slug})

        # ── 2. Check cache — redirect if hash matches ──────────────────────────
        current_hash = spec_hash(product)
        if product.get('specSheetRef') and product.get('specSheetHash') == current_hash:
            self.send_response(302)
            self.send_header('Location', cdn_url(product['specSheetRef']))
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            return

        if product.get('specSheetRef') and product.get('specSheetHash') != current_hash:
            print(f'[specsheet] Specs changed for {product["productName"]} — regenerating', flush=True)

        # ── 3. Generate PDF ────────────────────────────────────────────────────
        try:
            with tempfile.TemporaryDirectory() as tmp_dir:
                pdf_bytes = generate_pdf(product, tmp_dir)
        except Exception as e:
            return self._json(500, {'error': 'PDF generation failed', 'detail': str(e)})

        # ── 4. Upload to Sanity and store hash ─────────────────────────────────
        if token:
            try:
                safe_name = (product.get('productName') or 'Speaker').replace(' ', '_').replace('/', '_')
                asset_id  = sanity_upload(pdf_bytes, f'{safe_name}_Spec_Sheet.pdf', token)
                sanity_patch(product['_id'], {
                    'specSheet':     {'_type': 'file', 'asset': {'_type': 'reference', '_ref': asset_id}},
                    'specSheetHash': current_hash,
                }, token)
                print(f'[specsheet] Cached {product["productName"]} → {asset_id}', flush=True)
            except Exception as e:
                print(f'[specsheet] Upload failed (non-fatal): {e}', flush=True)

        # ── 5. Return PDF ──────────────────────────────────────────────────────
        safe_name = (product.get('productName') or 'Speaker').replace(' ', '_').replace('/', '_')
        self._pdf(pdf_bytes, f'XSCACE_{safe_name}_Spec_Sheet.pdf')

    def _json(self, code: int, body: dict):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _pdf(self, data: bytes, filename: str):
        self.send_response(200)
        self.send_header('Content-Type', 'application/pdf')
        self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'public, max-age=86400')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass
