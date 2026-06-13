"""
api/brochure/[slug].py — XSCACE product brochure, Vercel Python serverless.
"""
from http.server import BaseHTTPRequestHandler
import sys, os, json, tempfile, urllib.request, urllib.parse, hashlib, traceback

sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')

PROJECT_ID  = '7r0kq57d'
DATASET     = 'production'
TOKEN       = os.environ.get('SANITY_API_TOKEN', '')
API         = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01'

def _req(url, data=None, method=None, ctype='application/json', auth=True):
    req = urllib.request.Request(url, data=data,
                                 method=method or ('POST' if data else 'GET'))
    if auth and TOKEN: req.add_header('Authorization', f'Bearer {TOKEN}')
    if data: req.add_header('Content-Type', ctype)
    req.add_header('User-Agent', 'XSCACE-Brochure/2.0')
    return urllib.request.urlopen(req, timeout=30)

def sanity_fetch(query):
    url = f'{API}/data/query/{DATASET}?query={urllib.parse.quote(query)}'
    with _req(url) as r: return json.loads(r.read())['result']

def sanity_upload(pdf_bytes, filename):
    url = f'{API}/assets/files/{DATASET}?filename={urllib.parse.quote(filename)}'
    with _req(url, data=pdf_bytes, ctype='application/pdf') as r:
        doc = json.loads(r.read())
        print(f'[upload] response keys: {list(doc.keys())}', file=sys.stderr)
        # Sanity returns {"document": {"_id": "file-...-pdf", ...}}
        asset_id = (doc.get('document') or doc).get('_id', '')
        print(f'[upload] asset_id: {asset_id}', file=sys.stderr)
        return asset_id

def sanity_patch(doc_id, fields):
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    with _req(f'{API}/data/mutate/{DATASET}', data=body) as r:
        return json.loads(r.read())

def file_cdn_url(asset_id):
    # asset_id = "file-<hash>-pdf"
    bare   = asset_id.replace('file-', '')   # "<hash>-pdf"
    parts  = bare.rsplit('-', 1)             # ["<hash>", "pdf"]
    return f'https://cdn.sanity.io/files/{PROJECT_ID}/{DATASET}/{parts[0]}.{parts[1]}'

def img_cdn_url(ref, w=1400):
    # ref = "image-<hash>-<WxH>-<ext>"
    body  = ref[len('image-'):]              # "<hash>-<WxH>-<ext>"
    parts = body.rsplit('-', 1)             # ["<hash>-<WxH>", "<ext>"]
    ext   = parts[-1]
    # Reassemble: replace FIRST dash in parts[0] with /
    img_part = parts[0]
    slash_idx = img_part.index('-')
    path = img_part[:slash_idx] + '-' + img_part[slash_idx+1:]  # keep as-is
    return f'https://cdn.sanity.io/images/{PROJECT_ID}/{DATASET}/{path}.{ext}?w={w}&auto=format&q=85'

def fetch_img(ref, w=1400):
    if not ref: return None
    try:
        with _req(img_cdn_url(ref, w), auth=False) as r:
            data = r.read()
            return data if len(data) > 500 else None
    except Exception as e:
        print(f'[img] {ref[:30]}: {e}', file=sys.stderr)
        return None

def brochure_hash(p):
    keys = ['productName','tagline','shortDescription','sensitivityDb','powerRmsW',
            'powerPeakW','impedanceOhms','freqLowHz','freqHighHz','depthMm','weightKg',
            'proprietaryTechBadges','colorsStandard','mountingMethods','series',
            'marineTreatable','customRalAvailable','ipRating']
    return hashlib.md5(
        json.dumps({k: p.get(k) for k in keys}, sort_keys=True).encode()
    ).hexdigest()[:12]

def check_cdn_exists(url):
    """HEAD check with auth token since files are private."""
    try:
        with _req(url, method='HEAD') as r:
            return r.status < 400
    except urllib.error.HTTPError as e:
        # 403 means it exists but needs auth — treat as exists
        return e.code == 403
    except:
        return False

def generate_brochure(product, tmp_dir):
    import subprocess, base64
    base     = os.path.dirname(os.path.abspath(__file__))
    gen_py   = os.path.join(base, 'brochure_gen.py')
    jpath    = os.path.join(tmp_dir, 'product.json')
    outpath  = os.path.join(tmp_dir, 'brochure.pdf')

    # Write clean copy (no raw bytes — use b64)
    p_out = {k: v for k, v in product.items() if not isinstance(v, bytes)}
    with open(jpath, 'w') as f: json.dump(p_out, f)

    env = {
        **os.environ,
        'XSCACE_BROCHURE_FONTS': os.path.join(base, 'fonts'),
    }
    r = subprocess.run(
        [sys.executable, gen_py, '--product', jpath, '--out', outpath],
        env=env, timeout=120, capture_output=True, text=True
    )
    print(f'[gen] stdout: {r.stdout[-500:]}', file=sys.stderr)
    print(f'[gen] stderr: {r.stderr[-1000:]}', file=sys.stderr)
    if r.returncode != 0:
        raise RuntimeError(f'brochure_gen failed (exit {r.returncode})')
    with open(outpath, 'rb') as f: return f.read()


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        try:
            slug = self.path.rstrip('/').split('/')[-1].split('?')[0]
            if not slug: return self._err(400, 'No slug')

            # 1. Fetch product
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
                    heroImage, "galleryImages": galleryImages[0..2],
                    "lifestyleImages": lifestyleImages[0..3],
                    brochureRef, brochureHash
                }}
            ''')
            if not product: return self._err(404, 'Product not found')

            # 2. Cache check — use authenticated HEAD so 403 = exists
            current_hash = brochure_hash(product)
            cached_ref   = product.get('brochureRef', '')
            if cached_ref and product.get('brochureHash') == current_hash:
                cdn = file_cdn_url(cached_ref)
                if check_cdn_exists(cdn):
                    self.send_response(302)
                    self.send_header('Location', cdn)
                    self.send_header('Cache-Control', 'public,max-age=3600')
                    self.end_headers()
                    return
                print(f'[cache] miss — regenerating', file=sys.stderr)

            # 3. Fetch images as base64
            import base64

            def img_b64(ref, w=1400):
                b = fetch_img(ref, w)
                return base64.b64encode(b).decode() if b else ''

            def get_ref(obj):
                return ((obj or {}).get('asset') or {}).get('_ref', '')

            hero_ref = get_ref(product.get('heroImage'))
            product['_hero_img_b64'] = img_b64(hero_ref, 1400)

            product['_gallery_b64'] = [
                img_b64(get_ref(img), 1000)
                for img in (product.get('galleryImages') or [])
                if get_ref(img)
            ]
            product['_lifestyle_b64'] = [
                img_b64(get_ref(img), 1200)
                for img in (product.get('lifestyleImages') or [])
                if get_ref(img)
            ]

            print(f'[images] hero:{bool(product["_hero_img_b64"])} '
                  f'gallery:{len(product["_gallery_b64"])} '
                  f'life:{len(product["_lifestyle_b64"])}', file=sys.stderr)

            # 4. Generate
            with tempfile.TemporaryDirectory() as tmp:
                pdf_bytes = generate_brochure(product, tmp)

            print(f'[pdf] size: {len(pdf_bytes)} bytes', file=sys.stderr)

            # 5. Upload and cache
            if TOKEN and len(pdf_bytes) > 1000:
                try:
                    fname    = f'XSCACE_{product["productName"].replace(" ","_")}_Brochure.pdf'
                    asset_id = sanity_upload(pdf_bytes, fname)
                    if asset_id:
                        sanity_patch(product['_id'], {
                            'brochureRef':  asset_id,
                            'brochureHash': current_hash,
                        })
                        print(f'[cache] stored {asset_id}', file=sys.stderr)
                except Exception as e:
                    print(f'[upload] failed: {e}', file=sys.stderr)

            # 6. Stream
            name = f'XSCACE_{slug}_Brochure.pdf'
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'inline; filename="{name}"')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception:
            self._err(500, traceback.format_exc())

    def _err(self, code, msg):
        body = json.dumps({'error': str(msg)[:2000]}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
