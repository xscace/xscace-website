"""
brochure_base.py — Fixed helpers that Claude's generated script imports.
Placed in api/brochure/brochure_base.py — imported by generated gen.py.
"""
import os, math, io
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

W, H = landscape(A4)

BG    = HexColor('#090909')
CHAMP = HexColor('#c9a96e')
TEXT  = HexColor('#eeebe5')
MUTED = HexColor('#7a776f')
DARK  = HexColor('#0e0e0c')
DIM   = HexColor('#3a3835')

def champ_a(a): return Color(0.788, 0.663, 0.431, a)
def bg_a(a):    return Color(0.035, 0.035, 0.035, a)
def white_a(a): return Color(1, 1, 1, a)

# ── Fonts ──────────────────────────────────────────────────────────────────────
FONT_DIR = os.environ.get('XSCACE_BROCHURE_FONTS',
           os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts'))

_LOADED = set()
def _reg(alias, fname):
    p = os.path.join(FONT_DIR, fname)
    if os.path.exists(p):
        try:
            pdfmetrics.registerFont(TTFont(alias, p))
            _LOADED.add(alias)
        except Exception as e:
            print(f'[font] {fname}: {e}')
    else:
        print(f'[font] NOT FOUND: {fname} in {FONT_DIR}')

_reg('Cor',   'Cormorant-Light.ttf')
_reg('CorR',  'Cormorant-Regular.ttf')
_reg('CorSB', 'Cormorant-SemiBold.ttf')
_reg('CorI',  'Cormorant-Italic.ttf')
_reg('DMS',   'DMSans-Reg.ttf')
_reg('DMSM',  'DMSans-Med.ttf')
_reg('DMSB',  'DMSans-Bold.ttf')
_reg('DMM',   'DMMono-Regular.ttf')
_reg('DMMM',  'DMMono-Medium.ttf')
_reg('Magma', 'MagmaWave.otf')

def F(a,  fb='Helvetica'):         return a if a in _LOADED else fb
def FB(a, fb='Helvetica-Bold'):    return a if a in _LOADED else fb
def FI(a, fb='Helvetica-Oblique'): return a if a in _LOADED else fb

# ── Drawing utils ──────────────────────────────────────────────────────────────
def rule(c, y, x=0, w=None, lw=0.8, col=None):
    c.setStrokeColor(col or CHAMP); c.setLineWidth(lw)
    c.line(x, y, x + (w or W), y)

def fill_rect(c, x, y, w, h, col):
    c.setFillColor(col); c.rect(x, y, w, h, fill=1, stroke=0)

def draw_img(c, path, x, y, w, h, cover=False):
    """Draw image from file path. cover=True crops to fill; else contains."""
    if not path or not os.path.exists(path): return False
    try:
        from PIL import Image
        import io as _io
        pil = Image.open(path)
        iw, ih = pil.size
        if pil.mode not in ('RGB', 'L'): pil = pil.convert('RGB')
        buf = _io.BytesIO(); pil.save(buf, 'PNG'); buf.seek(0)
        ir = ImageReader(buf)
        if cover:
            sc = max(w/iw, h/ih); sw, sh = iw*sc, ih*sc
            ox, oy = (w-sw)/2, (h-sh)/2
            c.saveState()
            cp = c.beginPath(); cp.rect(x, y, w, h); c.clipPath(cp, stroke=0)
            c.drawImage(ir, x+ox, y+oy, sw, sh, mask='auto')
            c.restoreState()
        else:
            sc = min(w/iw, h/ih); sw, sh = iw*sc, ih*sc
            c.drawImage(ir, x+(w-sw)/2, y+(h-sh)/2, sw, sh,
                        preserveAspectRatio=True, mask='auto')
        return True
    except Exception as e:
        print(f'[img] {e}'); return False

def wrap_text(c, text, x, y, max_w, font, size, color, line_h=1.5):
    c.setFillColor(color); c.setFont(font, size)
    words = str(text).split(); line = ''; out = []
    for w in words:
        t = (line + ' ' + w).strip()
        if c.stringWidth(t, font, size) <= max_w: line = t
        else:
            if line: out.append(line)
            line = w
    if line: out.append(line)
    cy = y
    for l in out: c.drawString(x, cy, l); cy -= size * line_h
    return y - cy

# ── Tech icons (fixed, correct) ────────────────────────────────────────────────
def draw_tech_icon(c, name, cx, cy, sc=0.42):
    """Draw the correct XSCACE proprietary tech icon centred at cx,cy."""
    c.saveState(); c.translate(cx, cy); c.scale(sc, sc)
    c.setStrokeColor(CHAMP); c.setFillColor(CHAMP)
    c.setLineCap(1); c.setLineJoin(1)
    n = name.lower().replace(' ','').replace('-','').replace('™','')

    if 'nano' in n or 'resonance' in n:
        # Fan of 5 curved lines converging to a dot at bottom
        c.setLineWidth(1.1)
        for dx in [-10, -6, 0, 6, 10]:
            ex = dx * 2.2
            pth = c.beginPath(); pth.moveTo(dx, 18)
            pth.curveTo(dx, 4, ex*0.5, -8, ex, -18); c.drawPath(pth)
        c.setFillColor(CHAMP); c.circle(0, -26, 3, fill=1, stroke=0)
        c.setStrokeColor(champ_a(0.3)); c.setLineWidth(0.5)
        c.circle(0, -26, 6, fill=0, stroke=1)

    elif 'precision' in n or 'xover' in n:
        # 8 vertical bars of varying height — EQ bars
        c.setLineWidth(2.0)
        for i, hh in enumerate([8, 14, 20, 26, 26, 20, 14, 8]):
            x = -21 + i*6; c.line(x, -hh/2, x, hh/2)

    elif 'power' in n or 'dynamic' in n:
        # Lightning bolt / arc lines
        c.setLineWidth(1.3); c.setFillColor(champ_a(0.08))
        pth = c.beginPath(); pth.moveTo(-6, 4); pth.lineTo(18, 24)
        pth.lineTo(6, -2); pth.close(); c.drawPath(pth, fill=1)
        for op, xy in [(0.8,(-24,-8,-8,4)),(0.6,(-22,-16,-6,-6)),(0.4,(-18,-22,0,-12))]:
            c.setStrokeColor(champ_a(op)); c.setLineWidth(1.2); c.line(*xy)

    elif 'aero' in n or 'frame' in n or 'chassis' in n:
        # Radial spokes — heatsink asterisk
        c.setLineWidth(0.9); c.setStrokeColor(champ_a(0.65))
        for ang in range(0, 360, 45):
            r = math.radians(ang)
            c.line(13*math.cos(r), 13*math.sin(r), 22*math.cos(r), 22*math.sin(r))
        c.setLineWidth(1.8); c.setStrokeColor(champ_a(0.95))
        for ang in [0, 90, 180, 270]:
            r = math.radians(ang); c.line(0, 0, 14*math.cos(r), 14*math.sin(r))

    elif 'flow' in n or 'xs' in n:
        # U-bend waveguide with outlets
        c.setLineWidth(2.8)
        pth = c.beginPath(); pth.moveTo(4, 18); pth.lineTo(-16, 18)
        pth.curveTo(-26, 18, -26, -18, -16, -18); pth.lineTo(4, -18); c.drawPath(pth)
        c.setLineWidth(1.5)
        for ly in [18, 0, -18]:
            c.line(4, ly, 16, ly)
            c.setFillColor(CHAMP); c.circle(20, ly, 2.5, fill=1, stroke=0)

    elif 'psy' in n or 'sculpt' in n:
        # EQ / sine wave curve
        c.setLineWidth(1.6)
        pts = [(-20,10),(-12,-4),(-4,10),(4,-4),(12,10),(20,-4),(28,4)]
        pth = c.beginPath(); pth.moveTo(-28, -4)
        px, py = -28, -4
        for tx, ty in pts:
            pth.curveTo(px+4, py, tx-4, ty, tx, ty); px, py = tx, ty
        c.drawPath(pth)
        c.setStrokeColor(champ_a(0.2)); c.setLineWidth(0.7)
        pth2 = c.beginPath(); pth2.moveTo(-28, 8); px, py = -28, 8
        for tx, ty in [(-20,-2),(-12,12),(-4,-2),(4,12),(12,-2),(20,12),(28,4)]:
            pth2.curveTo(px+4, py, tx-4, ty, tx, ty); px, py = tx, ty
        c.drawPath(pth2)

    else:
        # Fallback diamond
        c.setLineWidth(1); c.setStrokeColor(champ_a(0.5))
        pth = c.beginPath(); pth.moveTo(0,16); pth.lineTo(16,0)
        pth.lineTo(0,-16); pth.lineTo(-16,0); pth.close(); c.drawPath(pth)

    c.restoreState()

# ── Finish/marine/RAL icons ────────────────────────────────────────────────────
def draw_finish_card(c, x, y, w, h, label, content, icon_type='text', colors=None):
    """Draw a bordered card for Standard Finishes / Custom RAL / Marine & IP."""
    # Border
    c.setStrokeColor(champ_a(0.35)); c.setLineWidth(0.6)
    c.rect(x, y, w, h, fill=0, stroke=1)
    # Scanning shimmer
    fill_rect(c, x, y, w*0.25, h, champ_a(0.04))
    # Label
    c.setFillColor(champ_a(0.6)); c.setFont(F('DMM'), 7)
    c.drawString(x+8, y+h-12, label.upper())
    # Thin rule under label
    c.setStrokeColor(champ_a(0.15)); c.setLineWidth(0.3)
    c.line(x+8, y+h-16, x+w-8, y+h-16)

    if icon_type == 'swatches' and colors:
        # Color swatches
        swatch_w, swatch_h = 14, 10
        sx = x + 10
        sy_s = y + h - 32
        for i, (chex, cname) in enumerate(colors[:5]):
            c.setFillColor(HexColor(chex))
            c.setStrokeColor(white_a(0.15)); c.setLineWidth(0.3)
            c.rect(sx + i*17, sy_s, swatch_w, swatch_h, fill=1, stroke=1)
        c.setFillColor(TEXT); c.setFont(F('DMS'), 8)
        c.drawString(x+8, y+12, content or '')

    elif icon_type == 'ral':
        # Colour wheel arc + text
        c.saveState(); c.translate(x+w*0.25, y+h*0.42); c.scale(0.55, 0.55)
        for i in range(36):
            ang = i * 10
            hue = ang / 360.0
            import colorsys
            r, g, b = colorsys.hsv_to_rgb(hue, 0.75, 0.85)
            c.setFillColor(Color(r, g, b))
            c.wedge(-22, -22, 22, 22, ang, 10, fill=1, stroke=0)
        c.setFillColor(BG); c.circle(0, 0, 14, fill=1, stroke=0)
        c.restoreState()
        c.setFillColor(TEXT); c.setFont(F('DMS'), 8)
        c.drawString(x+w*0.5+4, y+h*0.4, content or 'Any RAL')

    elif icon_type == 'marine':
        # Water droplet + IP shield
        c.saveState(); c.translate(x+18, y+h*0.45)
        c.setStrokeColor(CHAMP); c.setFillColor(champ_a(0.15)); c.setLineWidth(0.8)
        # Droplet
        pth = c.beginPath(); pth.moveTo(0, 14)
        pth.curveTo(-10, 6, -10, -8, 0, -10)
        pth.curveTo(10, -8, 10, 6, 0, 14); c.drawPath(pth, fill=1, stroke=1)
        c.setFillColor(champ_a(0.5)); c.setLineWidth(0.4)
        c.line(-4, 0, 4, 0); c.line(0, -4, 0, 4)
        c.restoreState()
        # IP badge
        c.setFillColor(champ_a(0.15)); c.setStrokeColor(CHAMP); c.setLineWidth(0.6)
        c.roundRect(x+36, y+h*0.32, 36, 16, 3, fill=1, stroke=1)
        c.setFillColor(CHAMP); c.setFont(F('DMMM'), 8)
        c.drawCentredString(x+54, y+h*0.38, content or 'IP66')

    else:
        c.setFillColor(TEXT); c.setFont(F('DMS'), 8)
        wrap_text(c, content or '—', x+8, y+h-26, w-16, F('DMS'), 8, TEXT, 1.4)

# ── Mounting option block ──────────────────────────────────────────────────────
def draw_mount_block(c, x, y, w, h, name, img_path=None):
    """Draw a mounting option card: image top, label bottom."""
    img_h = h * 0.72
    lbl_h = h - img_h - 4

    if img_path and os.path.exists(img_path):
        draw_img(c, img_path, x, y+lbl_h+4, w, img_h, cover=True)
        # Dim overlay
        fill_rect(c, x, y+lbl_h+4, w, img_h, bg_a(0.15))
    else:
        # Placeholder block
        fill_rect(c, x, y+lbl_h+4, w, img_h, HexColor('#0e0e0c'))
        c.setStrokeColor(champ_a(0.15)); c.setLineWidth(0.5)
        c.rect(x, y+lbl_h+4, w, img_h, fill=0, stroke=1)
        # Placeholder icon
        c.saveState(); c.translate(x+w/2, y+lbl_h+4+img_h/2)
        c.setStrokeColor(champ_a(0.2)); c.setLineWidth(0.6)
        c.rect(-20, -14, 40, 28, fill=0, stroke=1)
        c.line(-20, 14, -6, 2); c.line(-6, 2, 6, -8); c.line(6, -8, 16, 2); c.line(16, 2, 20, -4)
        c.restoreState()

    # Label strip
    fill_rect(c, x, y, w, lbl_h, HexColor('#111110'))
    c.setStrokeColor(champ_a(0.2)); c.setLineWidth(0.4)
    c.rect(x, y, w, lbl_h, fill=0, stroke=1)
    c.setFillColor(CHAMP); c.setFont(F('DMM'), 7.5)
    c.drawCentredString(x+w/2, y+lbl_h*0.35, name.upper())
