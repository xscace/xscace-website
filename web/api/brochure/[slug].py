# vercel.json: {"functions": {"api/brochure/[slug].py": {"maxDuration": 300}}}
"""
XSCACE Brochure Generator
- Fetches product + images from Sanity
- Builds complete HTML with embedded fonts, base64 images, inline SVG icons
- Claude writes ONLY the tagline/description copy (fast, cheap call)  
- WeasyPrint renders HTML → PDF (pure Python, no system deps)
- Uploads PDF to Sanity, caches, serves
"""
from http.server import BaseHTTPRequestHandler
import sys, os, json, urllib.request, urllib.parse, hashlib, traceback, base64

sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')

PROJECT = '7r0kq57d'; DATASET = 'production'
TOKEN   = os.environ.get('SANITY_API_TOKEN', '')
CLAUDE  = os.environ.get('ANTHROPIC_API_KEY', '')
API     = f'https://{PROJECT}.api.sanity.io/v2024-01-01'

# ── Helpers ────────────────────────────────────────────────────────────────────
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

def load_font_css():
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from font_css import FONT_CSS
        return FONT_CSS
    except:
        return ''  # Falls back to system fonts

# Tech icon SVGs — exact, fixed, correct
TECH_ICONS = {
    'psysculpt': '<svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2,20 C7,2 11,38 16,20 C21,2 25,38 30,20 C35,2 39,38 44,20 C49,2 53,38 58,20" stroke="#c9a96e" stroke-width="1.8" stroke-linecap="round"/><path d="M2,26 C7,14 11,38 16,26 C21,14 25,38 30,26 C35,14 39,38 44,26 C49,14 53,38 58,26" stroke="#c9a96e" stroke-width="0.7" stroke-linecap="round" opacity="0.3"/></svg>',
    'xs-flow': '<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M38,8 L38,22 C38,36 22,36 22,22 L22,8" stroke="#c9a96e" stroke-width="2.2" stroke-linecap="round"/><line x1="38" y1="8" x2="52" y2="8" stroke="#c9a96e" stroke-width="1.6" stroke-linecap="round"/><line x1="38" y1="28" x2="52" y2="28" stroke="#c9a96e" stroke-width="1.6" stroke-linecap="round"/><circle cx="55" cy="8" r="3" fill="#c9a96e"/><circle cx="55" cy="28" r="3" fill="#c9a96e"/><line x1="22" y1="8" x2="8" y2="8" stroke="#c9a96e" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="8" r="3" fill="#c9a96e"/></svg>',
    'nano resonance': '<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30,52 Q12,30 12,10" stroke="#c9a96e" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/><path d="M30,52 Q18,28 20,8" stroke="#c9a96e" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/><path d="M30,52 L30,8" stroke="#c9a96e" stroke-width="1.8" stroke-linecap="round"/><path d="M30,52 Q42,28 40,8" stroke="#c9a96e" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/><path d="M30,52 Q48,30 48,10" stroke="#c9a96e" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/><circle cx="30" cy="56" r="4" fill="#c9a96e"/></svg>',
    'precisionxover array': '<svg viewBox="0 0 66 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="31" width="6" height="18" rx="1.5" fill="#c9a96e"/><rect x="11" y="24" width="6" height="25" rx="1.5" fill="#c9a96e"/><rect x="20" y="14" width="6" height="35" rx="1.5" fill="#c9a96e"/><rect x="29" y="8" width="6" height="41" rx="1.5" fill="#c9a96e"/><rect x="38" y="14" width="6" height="35" rx="1.5" fill="#c9a96e"/><rect x="47" y="24" width="6" height="25" rx="1.5" fill="#c9a96e"/><rect x="56" y="31" width="6" height="18" rx="1.5" fill="#c9a96e"/></svg>',
    'aeroframe chassis': '<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="20" stroke="#c9a96e" stroke-width="0.6" opacity="0.4"/><line x1="30" y1="4" x2="30" y2="56" stroke="#c9a96e" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="30" x2="56" y2="30" stroke="#c9a96e" stroke-width="1.8" stroke-linecap="round"/><line x1="11" y1="11" x2="49" y2="49" stroke="#c9a96e" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/><line x1="49" y1="11" x2="11" y2="49" stroke="#c9a96e" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/><circle cx="30" cy="30" r="8" stroke="#c9a96e" stroke-width="1.5"/></svg>',
    'powerdense dynamics': '<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36,4 L22,30 L32,30 L28,56 L46,24 L36,24 Z" fill="rgba(201,169,110,0.15)" stroke="#c9a96e" stroke-width="1.6" stroke-linejoin="round"/><path d="M14,30 C10,20 11,10 18,5" stroke="#c9a96e" stroke-width="1.1" stroke-linecap="round" opacity="0.65"/><path d="M11,35 C5,21 6,7 16,1" stroke="#c9a96e" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/></svg>',
}

def get_tech_icon(badge_name):
    n = badge_name.lower().replace('™','').replace('\u2122','').replace('  ',' ').strip()
    for key, svg in TECH_ICONS.items():
        if key in n: return svg
    return f'<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="20" stroke="#c9a96e" stroke-width="1.5"/><text x="30" y="35" text-anchor="middle" fill="#c9a96e" font-size="14">{badge_name[0]}</text></svg>'

def build_html(P, hero, gals, lives, mounts, font_css):
    name        = P.get('productName','')
    full_name   = P.get('productFullName', name)
    tagline     = P.get('tagline','')
    desc        = P.get('shortDescription','')
    series      = P.get('series','')
    sku         = P.get('skuBase','')
    colors      = P.get('colorsStandard','')
    marine      = bool(P.get('marineTreatable'))
    ral         = bool(P.get('customRalAvailable'))
    ip          = P.get('ipRating','')
    marine_txt  = ' · '.join(filter(None,[ip,'Marine-grade' if marine else '']))

    specs_rows_acoustic = [
        ('Power RMS',   f"{P['powerRmsW']}W"       if P.get('powerRmsW')    else ''),
        ('Power Peak',  f"{P['powerPeakW']}W"       if P.get('powerPeakW')   else ''),
        ('Sensitivity', f"{P['sensitivityDb']} dB"  if P.get('sensitivityDb') else ''),
        ('Frequency',   f"{P.get('freqLowHz')}Hz – {int(P['freqHighHz']//1000)}kHz {P.get('freqQualifier','')or ''}".strip() if P.get('freqHighHz') else ''),
        ('Impedance',   f"{P['impedanceOhms']}Ω"    if P.get('impedanceOhms') else ''),
        ('Max SPL',     f"{P['splMaxDb']} dB"       if P.get('splMaxDb')     else ''),
        ('THD+N',       P.get('thdN','') or ''),
        ('Drivers',     P.get('driverDescription','') or ''),
        ('Crossover',   P.get('crossoverType','') or ''),
        ('Directivity', f"{P['directivityHDeg']}° H × {P['directivityVDeg']}° V" if P.get('directivityHDeg') else ''),
    ]
    specs_rows_physical = [
        ('H × W × D', f"{P.get('heightMm')} × {P.get('widthMm')} × {P.get('depthMm')} mm" if P.get('heightMm') else ''),
        ('Weight',     f"{P['weightKg']} kg"         if P.get('weightKg')   else ''),
        ('Housing',    P.get('housingMaterial','') or ''),
        ('Grille',     P.get('grilleMaterial','') or ''),
        ('IP Rating',  ip or ''),
        ('Connector',  P.get('speakerWireConnector','') or ''),
    ]

    def spec_rows(rows):
        return ''.join(f'''<div class="spec-row">
          <span class="spec-label">{l}</span>
          <span class="spec-value">{v}</span>
        </div>''' for l,v in rows if v)

    tech_badges = [b.strip().replace('™','').replace('\u2122','').replace('  ',' ')
                   for b in (P.get('proprietaryTechBadges') or '').split(',') if b.strip()]

    def tech_grid():
        items = []
        for badge in tech_badges:
            icon = get_tech_icon(badge)
            items.append(f'''<div class="tech-item">
              <div class="tech-icon">{icon}</div>
              <div class="tech-name">{badge.upper()}</div>
            </div>''')
        return ''.join(items)

    # Color swatches
    color_map = {'black':'#111111','anthracite':'#3C3F41','white':'#F2F0EC',
                 'champagne':'#C9A96E','matte champagne':'#C9A96E','slate':'#4A4A52','grey':'#5A5A5A'}
    def color_swatches():
        items = []
        for cname in [c.strip() for c in colors.split(',') if c.strip()]:
            hex_c = color_map.get(cname.lower(), '#555555')
            items.append(f'<div class="swatch" style="background:{hex_c}" title="{cname}"></div>')
        return ''.join(items)

    # Mounting cards
    def mount_cards():
        cards = []
        for m in mounts:
            img_html = f'<img src="{m["img"]}" class="mount-img">' if m.get('img') else '''
              <div class="mount-placeholder">
                <svg viewBox="0 0 60 60" fill="none" width="40" height="40">
                  <rect x="10" y="8" width="16" height="44" rx="2" stroke="#c9a96e" stroke-width="1" opacity="0.4"/>
                  <line x1="18" y1="8" x2="18" y2="4" stroke="#c9a96e" stroke-width="1.5" opacity="0.6"/>
                  <line x1="14" y1="4" x2="22" y2="4" stroke="#c9a96e" stroke-width="1.5" opacity="0.6"/>
                  <line x1="2" y1="52" x2="34" y2="52" stroke="#c9a96e" stroke-width="1" opacity="0.3"/>
                </svg>
              </div>'''
            cards.append(f'''<div class="mount-card">
              {img_html}
              <div class="mount-label">{m["name"].upper()}</div>
            </div>''')
        return ''.join(cards)

    # Life images for page 4
    def gallery_cells():
        imgs = [l for l in lives if l] + [g for g in gals if g]
        cells = []
        for i in range(4):
            if i < len(imgs):
                cells.append(f'<div class="gallery-cell"><img src="{imgs[i]}" class="gallery-img"></div>')
            else:
                cells.append('<div class="gallery-cell gallery-empty"></div>')
        return ''.join(cells)

    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
{font_css}

* {{ margin: 0; padding: 0; box-sizing: border-box; }}

@page {{
  size: 297mm 210mm;
  margin: 0;
}}

body {{
  font-family: 'DM Sans', Helvetica, sans-serif;
  background: #090909;
  color: #eeebe5;
  width: 297mm;
}}

/* ── PAGE WRAPPER ── */
.page {{
  width: 297mm;
  height: 210mm;
  position: relative;
  overflow: hidden;
  background: #090909;
  page-break-after: always;
}}

.champagne-bar-top {{
  position: absolute; top: 0; left: 0; right: 0;
  height: 5px; background: #c9a96e; z-index: 10;
}}
.champagne-bar-bottom {{
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 5px; background: #c9a96e; z-index: 10;
}}

/* ── PAGE 1: COVER ── */
.cover-hero {{
  position: absolute; right: 0; top: 0;
  width: 58%; height: 100%;
  object-fit: cover;
}}
.cover-fade {{
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to right, #090909 44%, rgba(9,9,9,0.7) 65%, transparent 85%);
}}
.cover-left {{
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 52%; padding: 40px 44px;
  display: flex; flex-direction: column;
  justify-content: flex-start;
}}
.cover-wordmark {{
  font-family: 'DM Mono', monospace;
  font-size: 13px; font-weight: 500;
  letter-spacing: 0.18em; color: #eeebe5;
  text-transform: uppercase;
}}
.cover-tagline-sub {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.2em;
  color: #7a776f; margin-top: 5px;
  text-transform: uppercase;
}}
.cover-name {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 82px; font-weight: 300; line-height: 1;
  color: #eeebe5; margin-top: 36px;
}}
.cover-product-tagline {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 22px; font-style: italic;
  color: #c9a96e; margin-top: 10px;
}}
.cover-desc {{
  font-family: 'DM Sans', Helvetica, sans-serif;
  font-size: 11.5px; line-height: 1.75;
  color: #7a776f; margin-top: 16px;
  max-width: 300px;
}}
.cover-rule {{
  height: 1px; background: rgba(201,169,110,0.35);
  margin-top: 24px; width: 260px;
}}
.cover-stats {{
  display: flex; gap: 0; margin-top: 20px;
  align-items: flex-start;
}}
.stat-item {{
  flex: 0 0 auto; margin-right: 28px;
}}
.stat-value {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px; font-weight: 600;
  color: #c9a96e; line-height: 1;
}}
.stat-label {{
  font-family: 'DM Mono', monospace;
  font-size: 6.5px; letter-spacing: 0.18em;
  color: #7a776f; margin-top: 5px;
  text-transform: uppercase;
}}
.cover-footer {{
  position: absolute; bottom: 14px; left: 44px; right: 44px;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 0.5px solid rgba(201,169,110,0.2);
  padding-top: 10px;
}}
.cover-footer-text {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.14em;
  color: #7a776f; text-transform: uppercase;
}}

/* ── PAGE HEADER (pages 2-4) ── */
.page-header {{
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 36px 10px;
  border-bottom: 0.5px solid rgba(201,169,110,0.08);
}}
.page-header-left {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.16em;
  color: #7a776f; text-transform: uppercase;
}}
.page-header-right {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.1em;
  color: #3a3835;
}}

/* ── PAGE 2: SPECS ── */
.specs-layout {{
  display: flex; gap: 0;
  padding: 18px 36px 16px;
  height: calc(100% - 36px);
}}
.specs-left {{
  flex: 0 0 50%; padding-right: 24px;
  overflow: hidden;
}}
.specs-heading {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 44px; font-weight: 300;
  color: #eeebe5; margin-bottom: 16px;
  line-height: 1;
}}
.spec-group-label {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.18em;
  color: #c9a96e; text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 0.5px solid rgba(201,169,110,0.3);
  margin-bottom: 4px; margin-top: 12px;
}}
.spec-row {{
  display: flex; justify-content: space-between;
  padding: 4px 0;
  border-bottom: 0.3px solid rgba(255,255,255,0.04);
}}
.spec-label {{
  font-family: 'DM Mono', monospace;
  font-size: 8px; color: #7a776f;
}}
.spec-value {{
  font-family: 'DM Mono', monospace;
  font-size: 8px; color: #eeebe5;
  text-align: right; max-width: 55%;
}}
.mount-section-label {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.18em;
  color: #c9a96e; text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 0.5px solid rgba(201,169,110,0.3);
  margin-bottom: 8px; margin-top: 14px;
}}
.mount-cards {{
  display: flex; gap: 8px;
}}
.mount-card {{
  flex: 1; border: 0.5px solid rgba(201,169,110,0.2);
  background: #0e0e0c; overflow: hidden;
  display: flex; flex-direction: column;
  height: 90px;
}}
.mount-img {{
  flex: 1; width: 100%; object-fit: cover;
  min-height: 0;
}}
.mount-placeholder {{
  flex: 1; display: flex; align-items: center;
  justify-content: center; background: #111110;
}}
.mount-label {{
  font-family: 'DM Mono', monospace;
  font-size: 7px; letter-spacing: 0.14em;
  color: #c9a96e; text-align: center;
  padding: 6px 4px;
  background: #111110;
  border-top: 0.5px solid rgba(201,169,110,0.15);
  flex-shrink: 0;
}}
.specs-right {{
  flex: 0 0 46%; margin-left: 4%;
  display: flex; flex-direction: column; gap: 8px;
}}
.specs-right-img {{
  flex: 1; background: #0e0e0c;
  border: 0.5px solid rgba(201,169,110,0.08);
  overflow: hidden; display: flex;
  align-items: center; justify-content: center;
}}
.specs-right-img img {{
  width: 100%; height: 100%; object-fit: contain;
}}

/* ── PAGE 3: TECH ── */
.tech-page-inner {{
  padding: 16px 36px;
  height: calc(100% - 36px);
  display: flex; flex-direction: column;
}}
.tech-headline {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 50px; font-weight: 300;
  color: #eeebe5; line-height: 1.1;
  margin-bottom: 4px;
}}
.tech-headline em {{
  font-style: italic; color: #c9a96e;
}}
.tech-section-label {{
  font-family: 'DM Mono', monospace;
  font-size: 7.5px; letter-spacing: 0.18em;
  color: #c9a96e; text-transform: uppercase;
  padding-bottom: 5px;
  border-bottom: 0.5px solid rgba(201,169,110,0.3);
  margin-top: 16px; margin-bottom: 10px;
}}
.tech-grid {{
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 8px 0; flex: 1;
}}
.tech-item {{
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 8px 4px;
}}
.tech-icon {{
  width: 52px; height: 44px;
  display: flex; align-items: center; justify-content: center;
}}
.tech-icon svg {{ width: 100%; height: 100%; }}
.tech-name {{
  font-family: 'DM Mono', monospace;
  font-size: 7px; letter-spacing: 0.14em;
  color: #c9a96e; text-align: center;
  margin-top: 6px; text-transform: uppercase;
}}
.finish-row {{
  display: flex; gap: 8px; margin-top: 10px;
  flex-shrink: 0;
}}
.finish-card {{
  flex: 1; border: 0.5px solid rgba(201,169,110,0.25);
  background: #0a0a0a; padding: 10px 12px;
  min-height: 60px;
}}
.finish-card-label {{
  font-family: 'DM Mono', monospace;
  font-size: 6.5px; letter-spacing: 0.18em;
  color: #c9a96e; text-transform: uppercase;
  border-bottom: 0.3px solid rgba(201,169,110,0.15);
  padding-bottom: 5px; margin-bottom: 7px;
}}
.swatches {{ display: flex; gap: 5px; margin-bottom: 6px; }}
.swatch {{
  width: 18px; height: 14px;
  border: 0.5px solid rgba(255,255,255,0.12);
}}
.finish-text {{
  font-family: 'DM Sans', Helvetica, sans-serif;
  font-size: 8.5px; color: #eeebe5; line-height: 1.4;
}}
.ral-wheel {{ margin-bottom: 6px; }}
.marine-drop {{
  margin-bottom: 6px;
}}

/* ── PAGE 4: GALLERY ── */
.gallery-page-inner {{
  padding: 14px 36px 0;
  height: calc(100% - 36px);
  display: flex; flex-direction: column;
}}
.gallery-heading {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 40px; font-weight: 300;
  color: #eeebe5; line-height: 1;
}}
.gallery-rule {{
  height: 1px; background: rgba(201,169,110,0.25);
  margin: 10px 0 10px;
}}
.gallery-grid {{
  display: grid; grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px; flex: 1;
  min-height: 0;
}}
.gallery-cell {{
  overflow: hidden; background: #0e0e0c;
}}
.gallery-empty {{
  border: 0.5px solid rgba(201,169,110,0.06);
}}
.gallery-img {{
  width: 100%; height: 100%; object-fit: cover;
}}
.gallery-footer {{
  background: #0e0e0c;
  border-top: 1px solid rgba(201,169,110,0.15);
  padding: 10px 0 14px;
  display: flex; justify-content: space-between; align-items: flex-end;
  flex-shrink: 0;
}}
.gallery-cta {{
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17px; color: #eeebe5; font-weight: 300;
}}
.gallery-email {{
  font-family: 'DM Mono', monospace;
  font-size: 8px; color: #c9a96e;
  letter-spacing: 0.08em; margin-top: 4px;
}}
.gallery-brand {{
  font-family: 'DM Mono', monospace;
  font-size: 7px; color: #3a3835;
  letter-spacing: 0.12em; text-transform: uppercase;
}}
</style>
</head>
<body>

<!-- PAGE 1: COVER -->
<div class="page">
  {'<img src="'+hero+'" class="cover-hero">' if hero else '<div class="cover-hero" style="background:#0e0e0c"></div>'}
  <div class="cover-fade"></div>
  <div class="cover-left">
    <div class="cover-wordmark">XSCACE</div>
    <div class="cover-tagline-sub">Size Defying Sound</div>
    <div class="cover-name">{name}</div>
    <div class="cover-product-tagline">{tagline}</div>
    <div class="cover-desc">{desc}</div>
    <div class="cover-rule"></div>
    <div class="cover-stats">
      {''.join(f'<div class="stat-item"><div class="stat-value">{v}</div><div class="stat-label">{l}</div></div>' for l,v in [
        ('Power', f"{P['powerRmsW']}W" if P.get('powerRmsW') else ''),
        ('Sensitivity', f"{P['sensitivityDb']} dB" if P.get('sensitivityDb') else ''),
        ('Impedance', f"{P['impedanceOhms']}Ω" if P.get('impedanceOhms') else ''),
        ('Depth', f"{P['depthMm']} mm" if P.get('depthMm') else ''),
      ] if v)}
    </div>
  </div>
  <div class="cover-footer">
    <span class="cover-footer-text">{series} · {sku}</span>
    <span class="cover-footer-text">XSCACE.COM</span>
  </div>
  <div class="champagne-bar-top"></div>
  <div class="champagne-bar-bottom"></div>
</div>

<!-- PAGE 2: SPECIFICATIONS -->
<div class="page">
  <div class="champagne-bar-top"></div>
  <div class="champagne-bar-bottom"></div>
  <div class="page-header">
    <span class="page-header-left">XSCACE · {name.upper()}</span>
    <span class="page-header-right">02 — 04</span>
  </div>
  <div class="specs-layout">
    <div class="specs-left">
      <div class="specs-heading">Specifications</div>
      <div class="spec-group-label">Acoustic</div>
      {spec_rows(specs_rows_acoustic)}
      <div class="spec-group-label">Physical</div>
      {spec_rows(specs_rows_physical)}
      <div class="mount-section-label">Mounting Options</div>
      <div class="mount-cards">{mount_cards()}</div>
    </div>
    <div class="specs-right">
      <div class="specs-right-img" style="flex:1.2">
        {'<img src="'+hero+'">' if hero else ''}
      </div>
      <div class="specs-right-img" style="flex:1">
        {'<img src="'+lives[0]+'" style="object-fit:cover">' if lives and lives[0] else ''}
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3: TECHNOLOGY + FINISHES -->
<div class="page">
  <div class="champagne-bar-top"></div>
  <div class="champagne-bar-bottom"></div>
  <div class="page-header">
    <span class="page-header-left">XSCACE · {name.upper()}</span>
    <span class="page-header-right">03 — 04</span>
  </div>
  <div class="tech-page-inner">
    <div class="tech-headline">Designed to <em>disappear.</em></div>
    <div class="tech-section-label">Proprietary Technology</div>
    <div class="tech-grid">{tech_grid()}</div>
    <div class="finish-row">
      <div class="finish-card">
        <div class="finish-card-label">Standard Finishes</div>
        <div class="swatches">{color_swatches()}</div>
        <div class="finish-text">{colors}</div>
      </div>
      <div class="finish-card">
        <div class="finish-card-label">Custom RAL</div>
        <div class="ral-wheel"><svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="19" fill="#c9a96e" opacity="0.08" stroke="#c9a96e" stroke-width="0.5"/>
  <path d="M20,20 L20,1 A19,19 0 0,1 37.1,10.5 Z" fill="hsl(0,75%,55%)"/>
  <path d="M20,20 L37.1,10.5 A19,19 0 0,1 37.1,29.5 Z" fill="hsl(60,75%,55%)"/>
  <path d="M20,20 L37.1,29.5 A19,19 0 0,1 20,39 Z" fill="hsl(120,75%,55%)"/>
  <path d="M20,20 L20,39 A19,19 0 0,1 2.9,29.5 Z" fill="hsl(180,75%,55%)"/>
  <path d="M20,20 L2.9,29.5 A19,19 0 0,1 2.9,10.5 Z" fill="hsl(240,75%,55%)"/>
  <path d="M20,20 L2.9,10.5 A19,19 0 0,1 20,1 Z" fill="hsl(300,75%,55%)"/>
  <circle cx="20" cy="20" r="10" fill="#0a0a0a"/>
</svg></div>
        <div class="finish-text">{'Any RAL — powder coat or anodised' if ral else 'Not available'}</div>
      </div>
      <div class="finish-card">
        <div class="finish-card-label">Marine &amp; IP</div>
        <div class="marine-drop">
          <svg viewBox="0 0 40 54" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20,2 C20,2 3,26 3,38 C3,47 10.5,52 20,52 C29.5,52 37,47 37,38 C37,26 20,2 20,2 Z" fill="rgba(201,169,110,0.15)" stroke="#c9a96e" stroke-width="1.5"/>
            <line x1="13" y1="36" x2="27" y2="36" stroke="#c9a96e" stroke-width="0.8" opacity="0.5"/>
            <line x1="20" y1="30" x2="20" y2="42" stroke="#c9a96e" stroke-width="0.8" opacity="0.5"/>
          </svg>
        </div>
        <div class="finish-text">{marine_txt or 'Standard protection'}</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: GALLERY -->
<div class="page">
  <div class="champagne-bar-top"></div>
  <div class="champagne-bar-bottom"></div>
  <div class="page-header">
    <span class="page-header-left">XSCACE · {name.upper()}</span>
    <span class="page-header-right">04 — 04</span>
  </div>
  <div class="gallery-page-inner">
    <div class="gallery-heading">In context.</div>
    <div class="gallery-rule"></div>
    <div class="gallery-grid">{gallery_cells()}</div>
    <div class="gallery-footer">
      <div>
        <div class="gallery-cta">Enquire or specify at xscace.com</div>
        <div class="gallery-email">support@xscace.com</div>
      </div>
      <div class="gallery-brand">XSCACE · Size Defying Sound</div>
    </div>
  </div>
</div>

</body>
</html>'''


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        try:
            slug = self.path.rstrip('/').split('/')[-1].split('?')[0]
            if not slug: return self._err(400, 'No slug')

            P = sanity_fetch(f'''*[_type=="product" && slug.current=="{slug}" && status=="Active"][0]{{
                _id, productName, productFullName, tagline, shortDescription,
                series, skuBase, colorsStandard, mountingMethods,
                marineTreatable, customRalAvailable, ipRating,
                sensitivityDb, powerRmsW, powerPeakW, impedanceOhms,
                splMaxDb, thdN, freqLowHz, freqHighHz, freqQualifier,
                directivityHDeg, directivityVDeg, heightMm, widthMm, depthMm,
                weightKg, driverDescription, crossoverType, housingMaterial,
                grilleMaterial, speakerWireConnector, proprietaryTechBadges,
                heroImage,
                "gallery": galleryImages[0..3],
                "lifestyle": lifestyleImages[0..5],
                "accessories": accessories[]->{{
                    name, category, shortDescription, heroImage, lifestyleImage
                }},
                brochureRef, brochureHash
            }}''')
            if not P: return self._err(404, 'Product not found')

            h = hashlib.md5(f"{P.get('productName')}{P.get('powerRmsW')}{P.get('depthMm')}".encode()).hexdigest()[:12]
            if P.get('brochureRef') and P.get('brochureHash') == h:
                cdn = file_cdn(P['brochureRef'])
                try:
                    urllib.request.urlopen(urllib.request.Request(cdn, method='HEAD'), timeout=5)
                    return self._redirect(cdn)
                except urllib.error.HTTPError as e:
                    if e.code == 403: return self._redirect(cdn)

            hero  = fetch_b64(get_ref(P.get('heroImage')), 1600)
            gals  = [fetch_b64(get_ref(g), 900)  for g in (P.get('gallery')   or [])[:3]]
            lives = [fetch_b64(get_ref(l), 1200) for l in (P.get('lifestyle')  or [])[:5]]

            # Match accessory images to mount methods
            accs = P.get('accessories') or []
            mount_methods = [m.strip() for m in (P.get('mountingMethods') or '').split(',') if m.strip()]
            mounts = []
            used_lives = 0
            for m in mount_methods:
                img = ''
                # Try to match accessory by name
                for a in accs:
                    aname = (a.get('name') or '').lower()
                    if any(w.lower() in aname for w in m.split()):
                        img = fetch_b64(get_ref(a.get('lifestyleImage')) or get_ref(a.get('heroImage')), 900)
                        if img: break
                # Fall back to lifestyle images
                if not img and used_lives < len(lives):
                    img = lives[used_lives]; used_lives += 1
                mounts.append({'name': m, 'img': img})

            font_css = load_font_css()
            html = build_html(P, hero, gals, lives, mounts, font_css)
            print(f'[brochure] HTML: {len(html):,} chars, fonts: {bool(font_css)}', file=sys.stderr)

            import weasyprint
            pdf_bytes = weasyprint.HTML(string=html).write_pdf()
            print(f'[brochure] PDF: {len(pdf_bytes):,} bytes', file=sys.stderr)

            if TOKEN and len(pdf_bytes) > 1000:
                try:
                    fname    = f"XSCACE_{P['productName'].replace(' ','_')}_Brochure.pdf"
                    asset_id = sanity_upload(pdf_bytes, fname)
                    sanity_patch(P['_id'], {
                        'brochureRef':  asset_id,
                        'brochureHash': h,
                        'brochure':     {'_type': 'file', 'asset': {'_type': 'reference', '_ref': asset_id}}
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
