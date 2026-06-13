"""
brochure_gen.py  —  XSCACE 3-page product brochure.
Receives product JSON with _hero_img_b64, _gallery_b64[], _lifestyle_b64[].
"""
import sys, os, json, io, base64, argparse, math

ap = argparse.ArgumentParser()
ap.add_argument('--product', required=True)
ap.add_argument('--out', required=True)
args = ap.parse_args()

with open(args.product) as f:
    P = json.load(f)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image

W, H = A4
MARGIN = 14 * mm
COL    = W - 2 * MARGIN

# ── Palette ────────────────────────────────────────────────────────────────────
BG    = HexColor('#090909')
CHAMP = HexColor('#c9a96e')
TEXT  = HexColor('#eeebe5')
MUTED = HexColor('#7a776f')
DIM   = HexColor('#4a4740')
DARK2 = HexColor('#0e0e0c')
DARK3 = HexColor('#161510')

def ca(r,g,b,a): return Color(r,g,b,a)
def champ_a(a):  return ca(0.788,0.663,0.431,a)
def bg_a(a):     return ca(0.035,0.035,0.035,a)
def white_a(a):  return ca(1,1,1,a)

# ── Fonts ──────────────────────────────────────────────────────────────────────
# Find font dir: env var > next to this script > cwd/fonts
FONT_DIR = (os.environ.get('XSCACE_BROCHURE_FONTS')
            or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts'))

_R = {}   # registered aliases

def reg(alias, fname):
    pth = os.path.join(FONT_DIR, fname)
    if os.path.exists(pth):
        try:
            pdfmetrics.registerFont(TTFont(alias, pth))
            _R[alias] = True
        except Exception as e:
            print(f'[font] {fname}: {e}', file=sys.stderr)

reg('Cor',   'Cormorant-Light.ttf')
reg('CorR',  'Cormorant-Regular.ttf')
reg('CorSB', 'Cormorant-SemiBold.ttf')
reg('CorI',  'Cormorant-Italic.ttf')
reg('DMS',   'DMSans-Reg.ttf')
reg('DMSM',  'DMSans-Med.ttf')
reg('DMSB',  'DMSans-Bold.ttf')
reg('DMM',   'DMMono-Regular.ttf')
reg('DMMM',  'DMMono-Medium.ttf')
reg('Magma', 'MagmaWave.otf')

def F(a,  fb='Helvetica'):           return a  if a  in _R else fb
def FB(a, fb='Helvetica-Bold'):      return a  if a  in _R else fb
def FI(a, fb='Helvetica-Oblique'):   return a  if a  in _R else fb

print(f'[fonts] loaded: {list(_R.keys())}', file=sys.stderr)

# ── Image helpers ──────────────────────────────────────────────────────────────
def b64_to_bytes(s):
    if not s: return None
    try:
        b = base64.b64decode(s)
        return b if len(b) > 500 else None
    except:
        return None

def draw_img(c, img_bytes, x, y, w, h, cover=False):
    if not img_bytes: return False
    try:
        pil = Image.open(io.BytesIO(img_bytes))
        iw, ih = pil.size
        # Convert palette / RGBA to RGB for JPEG-safe rendering
        if pil.mode not in ('RGB', 'L'):
            pil = pil.convert('RGB')
        buf = io.BytesIO(); pil.save(buf, 'PNG'); buf.seek(0)
        ir  = ImageReader(buf)
        if cover:
            scale = max(w / iw, h / ih)
            sw, sh = iw * scale, ih * scale
            ox, oy = (w - sw) / 2, (h - sh) / 2
            c.saveState()
            clip = c.beginPath(); clip.rect(x, y, w, h); c.clipPath(clip, stroke=0)
            c.drawImage(ir, x + ox, y + oy, sw, sh, mask='auto')
            c.restoreState()
        else:
            c.drawImage(ir, x, y, w, h, preserveAspectRatio=True, mask='auto', anchor='c')
        return True
    except Exception as e:
        print(f'[img] draw error: {e}', file=sys.stderr)
        return False

# ── Drawing utils ──────────────────────────────────────────────────────────────
def rule(c, y, x=None, w=None, lw=0.5, col=None, a=1.0):
    c.setStrokeColor(col or (CHAMP if a >= 1.0 else champ_a(a)))
    c.setLineWidth(lw); x0 = x or MARGIN
    c.line(x0, y, x0 + (w or COL), y)

def fill_rect(c, x, y, w, h, col):
    c.setFillColor(col); c.rect(x, y, w, h, fill=1, stroke=0)

def wrap(c, txt, x, y, max_w, fn, sz, col, lh=1.55, align='l'):
    """Word-wrap and draw text; returns height consumed."""
    c.setFillColor(col); c.setFont(fn, sz)
    words = str(txt).split(); line = ''; lines = []
    for w in words:
        t = (line + ' ' + w).strip()
        if c.stringWidth(t, fn, sz) <= max_w: line = t
        else:
            if line: lines.append(line)
            line = w
    if line: lines.append(line)
    cy = y
    for l in lines:
        if align == 'c': c.drawCentredString(x + max_w / 2, cy, l)
        elif align == 'r': c.drawRightString(x + max_w, cy, l)
        else: c.drawString(x, cy, l)
        cy -= sz * lh
    return y - cy

def label_val(c, lbl, val, x, y, col_w, lbl_fn, val_fn, sz=8):
    """Draw a label-right-value row then a faint divider."""
    if not val: return 0
    c.setFillColor(MUTED); c.setFont(lbl_fn, sz); c.drawString(x, y, lbl)
    c.setFillColor(TEXT); c.setFont(val_fn, sz)
    vs = str(val)
    if c.stringWidth(vs, val_fn, sz) > col_w * 0.58:
        c.setFont(val_fn, sz - 1)
    c.drawRightString(x + col_w, y, vs)
    c.setStrokeColor(white_a(0.05)); c.setLineWidth(0.3)
    c.line(x, y - 2.5*mm, x + col_w, y - 2.5*mm)
    return 5.5 * mm   # row height

# ── Product data ───────────────────────────────────────────────────────────────
NAME   = P.get('productName',     'Speaker')
FULL   = P.get('productFullName', NAME)
TAG    = P.get('tagline',         '')
DESC   = P.get('shortDescription', '')
SERIES = P.get('series', '')
SKU    = P.get('skuBase', '')

COLORS  = P.get('colorsStandard', '')
MOUNT   = P.get('mountingMethods', '')
if isinstance(MOUNT, list): MOUNT = ', '.join(MOUNT)
MARINE  = bool(P.get('marineTreatable'))
RAL     = bool(P.get('customRalAvailable'))
IP      = P.get('ipRating', '')

# Normalise tech badge names to match icon lookup
RAW_TECH = P.get('proprietaryTechBadges', '') or ''
TECH = []
for b in RAW_TECH.split(','):
    b = b.strip().replace('™', '').replace('\u2122', '')
    # collapse multiple spaces
    while '  ' in b: b = b.replace('  ', ' ')
    if b: TECH.append(b)

# Decode images
HERO    = b64_to_bytes(P.get('_hero_img_b64', ''))
GALLERY = [b64_to_bytes(s) for s in (P.get('_gallery_b64') or []) if s]
LIFE    = [b64_to_bytes(s) for s in (P.get('_lifestyle_b64') or []) if s]

print(f'[images] hero:{bool(HERO)} gallery:{len(GALLERY)} lifestyle:{len(LIFE)}', file=sys.stderr)
print(f'[tech] {TECH}', file=sys.stderr)

# ── Tech icon renderer ─────────────────────────────────────────────────────────
def tech_icon(c, name, cx, cy, scale=0.45):
    """Draw tech icon centred at (cx, cy)."""
    c.saveState(); c.translate(cx, cy); c.scale(scale, scale)
    c.setStrokeColor(CHAMP); c.setFillColor(CHAMP)
    c.setLineCap(1); c.setLineJoin(1)
    n = name.lower().replace(' ', '')

    if 'nano' in n or 'resonance' in n:
        # Fan of lines converging at bottom dot
        c.setLineWidth(1.1)
        for dx in [-10, -6, 0, 6, 10]:
            ex = dx * 2.2
            pth = c.beginPath(); pth.moveTo(dx, 18); pth.curveTo(dx, 4, ex*0.5, -8, ex, -18)
            c.drawPath(pth)
        c.setFillColor(CHAMP); c.circle(0, -26, 3.2, fill=1, stroke=0)
        c.setStrokeColor(champ_a(0.3)); c.setLineWidth(0.5); c.circle(0, -26, 6.5, fill=0, stroke=1)

    elif 'precision' in n or 'xover' in n:
        # Vertical bars of increasing height (line array)
        c.setLineWidth(2)
        heights = [8, 14, 20, 24, 24, 20, 14, 8]
        for i, hh in enumerate(heights):
            x = -21 + i * 6; c.line(x, -hh/2, x, hh/2)

    elif 'power' in n or 'dynamic' in n:
        # Lightning bolt / wedge
        c.setLineWidth(1.3)
        c.setFillColor(champ_a(0.07))
        pth = c.beginPath(); pth.moveTo(-8, 2); pth.lineTo(20, 24); pth.lineTo(6, -2); pth.close()
        c.drawPath(pth, fill=1)
        for op, coords in [(0.75,(-26,-8,-10,2)),(0.55,(-24,-16,-6,-6)),(0.38,(-18,-22,0,-10))]:
            c.setStrokeColor(champ_a(op)); c.setLineWidth(1.1)
            c.line(*coords)

    elif 'aero' in n or 'frame' in n or 'chassis' in n:
        # Radial spokes + cross
        c.setLineWidth(0.9); c.setStrokeColor(champ_a(0.65))
        for ang in range(0, 360, 45):
            r = math.radians(ang)
            c.line(14*math.cos(r), 14*math.sin(r), 22*math.cos(r), 22*math.sin(r))
        c.setLineWidth(1.6); c.setStrokeColor(champ_a(0.9))
        for ang in [0, 90, 180, 270]:
            r = math.radians(ang); c.line(0, 0, 16*math.cos(r), 16*math.sin(r))

    elif 'flow' in n or 'xs' in n:
        # U-bend waveguide with outlets
        c.setLineWidth(2.8)
        pth = c.beginPath(); pth.moveTo(4, 18); pth.lineTo(-16, 18)
        pth.curveTo(-26, 18, -26, -18, -16, -18); pth.lineTo(4, -18)
        c.drawPath(pth)
        c.setLineWidth(1.4)
        for ly in [18, -18, 0]:
            c.line(4, ly, 16, ly)
            c.setFillColor(CHAMP); c.circle(20, ly, 2.2, fill=1, stroke=0)

    elif 'psy' in n or 'sculpt' in n:
        # EQ curve / sine wave
        c.setLineWidth(1.5)
        pth = c.beginPath(); pth.moveTo(-28, -4)
        pts = [(-20, 10), (-12, -4), (-4, 10), (4, -4), (12, 10), (20, -4), (28, 4)]
        px, py = -28, -4
        for tx, ty in pts:
            pth.curveTo(px+4, py, tx-4, ty, tx, ty); px, py = tx, ty
        c.drawPath(pth)
        # Faint echo
        c.setStrokeColor(champ_a(0.25)); c.setLineWidth(0.6)
        pth2 = c.beginPath(); pth2.moveTo(-28, 8)
        for tx, ty in [(-20,-6),(-12,8),(-4,-6),(4,8),(12,-6),(20,8),(28,-2)]:
            pth2.curveTo(px+4, 8, tx-4, ty, tx, ty)
        c.drawPath(pth2)

    else:
        # Generic: small diamond
        c.setLineWidth(1); c.setStrokeColor(champ_a(0.5))
        pth = c.beginPath(); pth.moveTo(0, 16); pth.lineTo(16, 0)
        pth.lineTo(0, -16); pth.lineTo(-16, 0); pth.close(); c.drawPath(pth)

    c.restoreState()

# ── Canvas ─────────────────────────────────────────────────────────────────────
cv = rl_canvas.Canvas(args.out, pagesize=A4)
cv.setTitle(f'{FULL} — XSCACE Product Brochure')
cv.setAuthor('XSCACE')
cv.setSubject('Luxury Architectural Audio')

# ════════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER
# ════════════════════════════════════════════════════════════════════════════════
def page_cover(c):
    fill_rect(c, 0, 0, W, H, BG)

    # Hero image — right 56%, full bleed
    split_x = W * 0.44
    if HERO:
        draw_img(c, HERO, split_x, 0, W - split_x, H, cover=True)
        # Gradient fade from split point leftward
        steps = 80
        for i in range(steps):
            a = (1 - i / steps) ** 1.8
            fill_rect(c, split_x + i * (W * 0.32 / steps), 0,
                      W * 0.32 / steps + 2, H, bg_a(a))
        # Subtle top-to-bottom darken at very top and bottom
        fill_rect(c, split_x, H - 30*mm, W - split_x, 30*mm, bg_a(0.5))
        fill_rect(c, split_x, 0, W - split_x, 20*mm, bg_a(0.6))
    else:
        fill_rect(c, split_x, 0, W - split_x, H, DARK2)

    # Champagne top rule
    fill_rect(c, 0, H - 1.5*mm, W, 1.5*mm, CHAMP)

    # ── Left column text ────────────────────────────────────────────────────────
    tx = MARGIN; ty = H - 20*mm

    # Logo / wordmark
    if 'Magma' in _R:
        c.setFillColor(TEXT); c.setFont('Magma', 18); c.drawString(tx, ty, 'XSCACE')
    else:
        c.setFillColor(TEXT); c.setFont(FB('DMSB'), 13); c.drawString(tx, ty, 'XSCACE')
    c.setFillColor(MUTED); c.setFont(F('DMM'), 6.5); c.drawString(tx, ty - 5.5*mm, 'SIZE DEFYING SOUND')

    # Product name — large Cormorant Light
    ty -= 28*mm
    c.setFillColor(TEXT); c.setFont(F('Cor'), 56); c.drawString(tx, ty, NAME)

    # Tagline — italic champagne
    if TAG:
        ty -= 12*mm
        c.setFillColor(CHAMP); c.setFont(F('CorI'), 17); c.drawString(tx, ty, TAG)

    # Rule + description
    ty -= 8*mm; rule(c, ty, w=W * 0.32, lw=0.5, a=0.4)
    if DESC:
        ty -= 7*mm
        ty -= wrap(c, DESC, tx, ty, W * 0.31, F('DMS'), 10.5,
                   HexColor('#a8a49c'), lh=1.6)

    # ── Key stats ───────────────────────────────────────────────────────────────
    sy = MARGIN + 32*mm
    stats = []
    if P.get('powerRmsW'):    stats.append((f"{P['powerRmsW']}W",        'POWER'))
    if P.get('sensitivityDb'): stats.append((f"{P['sensitivityDb']}dB",  'SENSITIVITY'))
    if P.get('impedanceOhms'): stats.append((f"{P['impedanceOhms']}Ω",  'IMPEDANCE'))
    if P.get('depthMm'):       stats.append((f"{P['depthMm']}mm",        'DEPTH'))

    rule(c, sy + 15*mm, w=W * 0.36, lw=0.3, a=0.25)
    c.setFillColor(MUTED); c.setFont(F('DMM'), 6); c.drawString(tx, sy + 11*mm, 'KEY SPECIFICATIONS')
    cw = W * 0.36 / max(len(stats), 1)
    for i, (v, l) in enumerate(stats[:4]):
        sx = tx + i * cw
        c.setFillColor(CHAMP); c.setFont(F('CorSB'), 22); c.drawString(sx, sy + 2*mm, v)
        c.setFillColor(MUTED); c.setFont(F('DMM'), 5.5); c.drawString(sx, sy - 3*mm, l)

    # Series / SKU / URL footer
    c.setFillColor(DIM); c.setFont(F('DMM'), 6)
    foot = (SERIES + ('  ·  ' + SKU if SKU else '')).upper()
    c.drawString(tx, MARGIN + 6*mm, foot)
    c.drawRightString(W - MARGIN, MARGIN + 6*mm, 'XSCACE.COM')
    rule(c, MARGIN + 12*mm, lw=0.3, a=0.15)
    c.setFillColor(DIM); c.setFont(F('DMM'), 5.5); c.drawCentredString(W / 2, MARGIN - 1.5*mm, '01 — 03')


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 2 — STORY, TECH ICONS, FINISH/MARINE/RAL
# ════════════════════════════════════════════════════════════════════════════════
def page_story(c):
    fill_rect(c, 0, 0, W, H, BG)
    fill_rect(c, 0, H - 1.5*mm, W, 1.5*mm, CHAMP)

    c.setFillColor(MUTED); c.setFont(F('DMM'), 6.5)
    c.drawString(MARGIN, H - 9*mm, 'XSCACE  ·  ' + FULL.upper())
    c.drawRightString(W - MARGIN, H - 9*mm, '02 — 03')
    rule(c, H - 14*mm, lw=0.3, a=0.12)

    # Headline
    c.setFillColor(TEXT); c.setFont(F('Cor'), 40); c.drawString(MARGIN, H - 27*mm, 'Designed to')
    c.setFillColor(CHAMP); c.setFont(F('CorI'), 40); c.drawString(MARGIN, H - 39*mm, 'disappear.')

    # Lifestyle full-width image strip
    strip_h = H * 0.29; strip_y = H - 46*mm - strip_h
    life_img = LIFE[0] if LIFE else (GALLERY[0] if GALLERY else None)
    if life_img:
        draw_img(c, life_img, 0, strip_y, W, strip_h, cover=True)
        fill_rect(c, 0, strip_y, W, strip_h, bg_a(0.18))   # slight darkening overlay
    else:
        fill_rect(c, 0, strip_y, W, strip_h, DARK3)

    # ── Proprietary technology ──────────────────────────────────────────────────
    tech_y = strip_y - 10*mm
    c.setFillColor(CHAMP); c.setFont(F('DMM'), 7)
    c.drawString(MARGIN, tech_y, 'PROPRIETARY TECHNOLOGY')
    rule(c, tech_y - 3.5*mm, lw=0.3, a=0.15)
    tech_y -= 8*mm

    if TECH:
        per_row = 3
        cell_w  = COL / per_row
        row_h   = 25*mm
        for i, badge in enumerate(TECH):
            col = i % per_row; row = i // per_row
            cx  = MARGIN + col * cell_w + cell_w / 2
            cy  = tech_y - row * row_h - 5*mm
            tech_icon(c, badge, cx, cy, scale=0.44)
            c.setFillColor(HexColor('#c9a96e')); c.setFont(F('DMM'), 7)
            c.drawCentredString(cx, cy - 14*mm, badge.upper())

    # ── Finishes / Marine / Custom RAL row ──────────────────────────────────────
    bot_y = MARGIN + 14*mm
    rule(c, bot_y + 20*mm, lw=0.3, a=0.15)
    third = COL / 3

    def info_col(label, content, icon_fn=None, bx=MARGIN):
        c.setFillColor(CHAMP); c.setFont(F('DMM'), 6.5); c.drawString(bx, bot_y + 15*mm, label)
        if icon_fn: icon_fn(bx)
        c.setFillColor(TEXT if content else MUTED); c.setFont(F('DMS'), 8.5)
        wrap(c, content or '—', bx, bot_y + 8*mm, third - 6*mm, F('DMS'), 8.5, TEXT if content else DIM, lh=1.4)

    # Standard finishes
    info_col('STANDARD FINISHES', COLORS or '—', bx=MARGIN)

    # Custom RAL — with coloured chip strip
    def ral_icon(bx):
        if RAL:
            for j, col_hex in enumerate(['#0A0A0A','#F2F0EC','#C9A96E','#3C3F41','#8A9BA8']):
                c.setFillColor(HexColor(col_hex)); c.setStrokeColor(white_a(0.1)); c.setLineWidth(0.4)
                c.rect(bx + j*8*mm, bot_y + 10*mm, 7*mm, 3*mm, fill=1, stroke=1)
    info_col('CUSTOM RAL', 'Any RAL — powder coat or anodised' if RAL else 'Not available',
             icon_fn=ral_icon if RAL else None, bx=MARGIN + third)

    # Marine / IP — with water drop icon
    def marine_icon(bx):
        if MARINE:
            c.setStrokeColor(CHAMP); c.setFillColor(champ_a(0.15)); c.setLineWidth(0.8)
            # simple teardrop
            pth = c.beginPath(); pth.moveTo(bx + 2*mm, bot_y + 13.5*mm)
            pth.curveTo(bx, bot_y+13*mm, bx, bot_y+11*mm, bx+2*mm, bot_y+11*mm)
            pth.curveTo(bx+4*mm, bot_y+11*mm, bx+4*mm, bot_y+13*mm, bx+2*mm, bot_y+13.5*mm)
            c.drawPath(pth, fill=1, stroke=1)

    marine_txt = (IP + ('  ·  Marine-grade' if MARINE else '')) if IP else ('Marine-grade' if MARINE else '—')
    info_col('MARINE & IP RATING', marine_txt, icon_fn=marine_icon, bx=MARGIN + 2*third)

    c.setFillColor(DIM); c.setFont(F('DMM'), 5.5); c.drawCentredString(W/2, MARGIN - 1.5*mm, 'XSCACE  ·  SIZE DEFYING SOUND')
    rule(c, MARGIN + 6*mm, lw=0.3, a=0.15)


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 3 — FULL SPECS + IMAGES + MOUNTING
# ════════════════════════════════════════════════════════════════════════════════
def page_specs(c):
    fill_rect(c, 0, 0, W, H, BG)
    fill_rect(c, 0, H - 1.5*mm, W, 1.5*mm, CHAMP)

    c.setFillColor(MUTED); c.setFont(F('DMM'), 6.5)
    c.drawString(MARGIN, H - 9*mm, 'XSCACE  ·  ' + FULL.upper())
    c.drawRightString(W - MARGIN, H - 9*mm, '03 — 03')
    rule(c, H - 14*mm, lw=0.3, a=0.12)

    c.setFillColor(TEXT); c.setFont(F('Cor'), 30)
    c.drawString(MARGIN, H - 26*mm, 'Specifications')

    # Layout: left 52% = specs, right 44% = images (gap 4%)
    col_w = COL * 0.52
    img_x = MARGIN + col_w + 6*mm
    img_w = COL - col_w - 6*mm

    # Right column — gallery image (product shot) top, lifestyle bottom
    top_h  = (H - 38*mm) * 0.5
    bot_h  = (H - 38*mm) * 0.5 - 4*mm
    top_y  = H - 32*mm - top_h
    bot_y  = top_y - bot_h - 4*mm

    g_img  = GALLERY[0] if GALLERY else HERO
    l_img  = LIFE[1] if len(LIFE) > 1 else (LIFE[0] if LIFE else None)

    if g_img:
        fill_rect(c, img_x, top_y, img_w, top_h, DARK2)
        draw_img(c, g_img, img_x + 3, top_y + 3, img_w - 6, top_h - 6, cover=False)
        # label
        c.setFillColor(MUTED); c.setFont(F('DMM'), 5.5)
        c.drawString(img_x + 4*mm, top_y + 4*mm, 'PRODUCT')

    if l_img:
        draw_img(c, l_img, img_x, bot_y, img_w, bot_h, cover=True)
        fill_rect(c, img_x, bot_y, img_w, bot_h, bg_a(0.15))
        c.setFillColor(MUTED); c.setFont(F('DMM'), 5.5)
        c.drawString(img_x + 4*mm, bot_y + 4*mm, 'IN CONTEXT')

    # Left column — spec groups
    sy = H - 34*mm
    spec_groups = [
        ('ACOUSTIC', [
            ('Power RMS',    f"{P['powerRmsW']}W" if P.get('powerRmsW') else None),
            ('Power Peak',   f"{P['powerPeakW']}W" if P.get('powerPeakW') else None),
            ('Sensitivity',  f"{P['sensitivityDb']} dB" if P.get('sensitivityDb') else None),
            ('Frequency',    f"{P.get('freqLowHz',0)}Hz – {P.get('freqHighHz',0)//1000}kHz {P.get('freqQualifier','')}" if P.get('freqHighHz') else None),
            ('Impedance',    f"{P['impedanceOhms']}Ω" if P.get('impedanceOhms') else None),
            ('Max SPL',      f"{P['splMaxDb']} dB" if P.get('splMaxDb') else None),
            ('THD+N',        P.get('thdN')),
            ('Drivers',      P.get('driverDescription')),
            ('Crossover',    P.get('crossoverType')),
            ('Directivity',  f"{P['directivityHDeg']}° H  ×  {P['directivityVDeg']}° V" if P.get('directivityHDeg') else None),
        ]),
        ('PHYSICAL', [
            ('H × W × D',    f"{P.get('heightMm','—')} × {P.get('widthMm','—')} × {P.get('depthMm','—')} mm" if P.get('heightMm') else None),
            ('Weight',       f"{P['weightKg']} kg" if P.get('weightKg') else None),
            ('Housing',      P.get('housingMaterial')),
            ('Grille',       P.get('grilleMaterial')),
            ('IP Rating',    P.get('ipRating')),
            ('Connector',    P.get('speakerWireConnector')),
        ]),
    ]

    for grp_name, rows in spec_groups:
        c.setFillColor(CHAMP); c.setFont(F('DMM'), 7)
        c.drawString(MARGIN, sy, grp_name)
        sy -= 4*mm; rule(c, sy, w=col_w, lw=0.3, a=0.2); sy -= 5*mm
        for lbl, val in rows:
            if not val: continue
            dy = label_val(c, lbl, val, MARGIN, sy, col_w, F('DMM'), F('DMM'), sz=7.5)
            sy -= dy
        sy -= 4*mm

    # Mounting options — separate group with bold header
    if MOUNT:
        c.setFillColor(CHAMP); c.setFont(F('DMM'), 7); c.drawString(MARGIN, sy, 'MOUNTING OPTIONS')
        sy -= 4*mm; rule(c, sy, w=col_w, lw=0.3, a=0.2); sy -= 6*mm
        c.setFillColor(TEXT); c.setFont(F('DMS'), 8.5)
        sy -= wrap(c, MOUNT, MARGIN, sy, col_w, F('DMS'), 8.5, TEXT, lh=1.5)

    # CTA footer bar
    fill_rect(c, 0, 0, W, MARGIN + 22*mm, DARK2)
    rule(c, MARGIN + 22*mm, lw=0.4, a=0.4)
    c.setFillColor(TEXT); c.setFont(F('Cor'), 16)
    c.drawString(MARGIN, MARGIN + 16*mm, 'Enquire or specify your system')
    c.setFillColor(CHAMP); c.setFont(F('DMSM'), 9)
    c.drawString(MARGIN, MARGIN + 8*mm, 'xscace.com   ·   support@xscace.com')
    c.setFillColor(DIM); c.setFont(F('DMM'), 5.5)
    c.drawCentredString(W / 2, MARGIN - 1.5*mm, 'XSCACE  ·  SIZE DEFYING SOUND')


# ── Render ─────────────────────────────────────────────────────────────────────
page_cover(cv);  cv.showPage()
page_story(cv);  cv.showPage()
page_specs(cv);  cv.showPage()
cv.save()
print(f'Done: {args.out}', file=sys.stderr)
