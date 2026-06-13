"""
api/brochure/[slug].py  —  XSCACE product brochure, Vercel Python serverless.
Generates a 3-page PDF and caches the asset ref in Sanity.
"""
from http.server import BaseHTTPRequestHandler
import sys, os, json, tempfile, urllib.request, urllib.parse, hashlib, traceback

PROJECT_ID  = '7r0kq57d'
DATASET     = 'production'
API_VERSION = '2024-01-01'
TOKEN       = os.environ.get('SANITY_API_TOKEN', '')

# ── Sanity helpers ─────────────────────────────────────────────────────────────
def sanity_fetch(query):
    url = (f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}'
           f'/data/query/{DATASET}?query={urllib.parse.quote(query)}')
    req = urllib.request.Request(url)
    if TOKEN: req.add_header('Authorization', f'Bearer {TOKEN}')
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

def sanity_upload(pdf_bytes, filename):
    url = (f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}'
           f'/assets/files/{DATASET}?filename={urllib.parse.quote(filename)}')
    req = urllib.request.Request(url, data=pdf_bytes, method='POST')
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/pdf')
    with urllib.request.urlopen(req, timeout=40) as r:
        doc = json.loads(r.read())['document']
        return doc['_id']          # e.g. "file-abc123-pdf"

def sanity_patch(doc_id, fields):
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    req  = urllib.request.Request(
        f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data/mutate/{DATASET}',
        data=body, method='POST')
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def file_cdn_url(asset_id):
    # asset_id = "file-abc123def-pdf"
    bare = asset_id.replace('file-', '')          # "abc123def-pdf"
    parts = bare.rsplit('-', 1)                    # ["abc123def", "pdf"]
    return (f'https://cdn.sanity.io/files/{PROJECT_ID}/{DATASET}'
            f'/{parts[0]}.{parts[1]}')

def img_cdn_url(ref, w=1400):
    # ref = "image-<hexhash>-<W>x<H>-<ext>"
    # Remove leading "image-"
    body = ref[len('image-'):]                     # "<hash>-<W>x<H>-<ext>"
    parts = body.rsplit('-', 1)                    # ["<hash>-<W>x<H>", "<ext>"]
    ext = parts[-1]                                # "png" / "jpg" / "webp"
    img_path = parts[0].replace('-', '/', 1)      # "<hash>/<W>x<H>"  ← first dash only
    # Sanity CDN format: /<projectId>/<dataset>/<hash>-<WxH>.<ext>
    # Actually the correct format just needs the hash portion before the dimensions
    # Let's use the full parts[0] as-is, replacing first dash with /
    hash_part = parts[0].split('-')[0]             # just the hex hash
    return (f'https://cdn.sanity.io/images/{PROJECT_ID}/{DATASET}'
            f'/{hash_part}-{"-".join(parts[0].split("-")[1:])}.{ext}'
            f'?w={w}&auto=format&q=85')

def fetch_img(ref, w=1400):
    if not ref: return None
    try:
        url = img_cdn_url(ref, w)
        req = urllib.request.Request(url, headers={'User-Agent': 'XSCACE-Brochure/1.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
            return data if len(data) > 1000 else None
    except Exception as e:
        print(f'[brochure] img fetch failed for {ref}: {e}', file=sys.stderr)
        return None

def get_img_refs(product):
    """Extract all image refs from a product document."""
    hero_ref = ((product.get('heroImage') or {}).get('asset') or {}).get('_ref', '')
    gallery_refs = [
        ((img.get('asset') or {}).get('_ref', ''))
        for img in (product.get('galleryImages') or [])
        if img.get('asset', {}).get('_ref')
    ]
    lifestyle_refs = [
        ((img.get('asset') or {}).get('_ref', ''))
        for img in (product.get('lifestyleImages') or [])
        if img.get('asset', {}).get('_ref')
    ]
    return hero_ref, gallery_refs, lifestyle_refs

def brochure_hash(p):
    keys = [
        'productName','tagline','shortDescription','sensitivityDb','powerRmsW',
        'powerPeakW','impedanceOhms','freqLowHz','freqHighHz','depthMm','weightKg',
        'proprietaryTechBadges','colorsStandard','mountingMethods','series',
        'marineTreatable','customRalAvailable','ipRating',
    ]
    return hashlib.md5(
        json.dumps({k: p.get(k) for k in keys}, sort_keys=True).encode()
    ).hexdigest()[:12]

def generate_brochure(product, tmp_dir):
    import subprocess
    # Find brochure_gen.py — same directory as this handler
    base    = os.path.dirname(os.path.abspath(__file__))
    gen_py  = os.path.join(base, 'brochure_gen.py')
    jpath   = os.path.join(tmp_dir, 'product.json')
    outpath = os.path.join(tmp_dir, 'brochure.pdf')

    # Write image bytes as base64 into the JSON (subprocess can't share memory)
    import base64
    p_copy = {k: v for k, v in product.items()
              if not k.startswith('_img_')}         # clean first
    for key in ('_hero_img_b64', '_gallery_b64', '_lifestyle_b64'):
        p_copy[key] = product.get(key, '')

    with open(jpath, 'w') as f:
        json.dump(p_copy, f)

    env = {**os.environ, 'XSCACE_BROCHURE_FONTS': os.path.join(base, 'fonts')}
    r = subprocess.run(
        [sys.executable, gen_py, '--product', jpath, '--out', outpath],
        env=env, timeout=120, capture_output=True, text=True
    )
    if r.returncode != 0:
        raise RuntimeError(f'brochure_gen failed:\nSTDOUT:{r.stdout}\nSTDERR:{r.stderr}')

    with open(outpath, 'rb') as f:
        return f.read()


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        try:
            slug = self.path.rstrip('/').split('/')[-1].split('?')[0]
            if not slug:
                return self._err(400, 'No slug')

            # 1. Fetch product from Sanity
            product = sanity_fetch(f'''
                *[_type=="product" && slug.current=="{slug}" && status=="Active"][0]{{
                    _id, productName, productFullName, tagline, shortDescription,
                    series, skuBase, colorsStandard, mountingMethods,
                    marineTreatable, customRalAvailable, ipRating,
                    sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
                    splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
                    directivityHDeg, directivityVDeg, heightMm, widthMm, depthMm,
                    weightKg, driverDescription, crossoverType, housingMaterial,
                    grilleMaterial, speakerWireConnector, proprietaryTechBadges,
                    heroImage, galleryImages[0..2], lifestyleImages[0..3],
                    brochureRef, brochureHash
                }}
            ''')
            if not product:
                return self._err(404, 'Product not found')

            # 2. Cache check
            current_hash = brochure_hash(product)
            cached_ref   = product.get('brochureRef')
            if cached_ref and product.get('brochureHash') == current_hash:
                cdn = file_cdn_url(cached_ref)
                try:
                    urllib.request.urlopen(
                        urllib.request.Request(cdn, method='HEAD'), timeout=5)
                    self.send_response(302)
                    self.send_header('Location', cdn)
                    self.send_header('Cache-Control', 'public,max-age=3600')
                    self.end_headers()
                    return
                except:
                    pass  # asset gone, regenerate

            # 3. Fetch images and encode as base64
            import base64
            hero_ref, gallery_refs, life_refs = get_img_refs(product)

            hero_bytes = fetch_img(hero_ref, 1400) if hero_ref else None
            product['_hero_img_b64'] = base64.b64encode(hero_bytes).decode() if hero_bytes else ''

            gallery_b64 = []
            for ref in gallery_refs[:2]:
                b = fetch_img(ref, 1000)
                gallery_b64.append(base64.b64encode(b).decode() if b else '')
            product['_gallery_b64'] = gallery_b64

            life_b64 = []
            for ref in life_refs[:3]:
                b = fetch_img(ref, 1200)
                life_b64.append(base64.b64encode(b).decode() if b else '')
            product['_lifestyle_b64'] = life_b64

            # 4. Generate PDF in tmp dir
            with tempfile.TemporaryDirectory() as tmp_dir:
                pdf_bytes = generate_brochure(product, tmp_dir)

            # 5. Upload to Sanity and cache the ref
            if TOKEN:
                try:
                    fname  = f'XSCACE_{product["productName"].replace(" ","_")}_Brochure.pdf'
                    asset_id = sanity_upload(pdf_bytes, fname)
                    sanity_patch(product['_id'], {
                        'brochureRef': asset_id,          # plain string, not a reference
                        'brochureHash': current_hash,
                    })
                except Exception as e:
                    print(f'[brochure] upload/cache failed (non-fatal): {e}', file=sys.stderr)

            # 6. Stream PDF
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
        body = json.dumps({'error': msg}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
