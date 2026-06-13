"""
brochure_gen.py — XSCACE 3-page product brochure.
"""
import sys, os, json, io, base64, argparse, math

ap = argparse.ArgumentParser()
ap.add_argument('--product', required=True)
ap.add_argument('--out', required=True)
args = ap.parse_args()
with open(args.product) as f: P = json.load(f)

# ── sys.path fix for Vercel ────────────────────────────────────────────────────
sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')
sys.path.insert(0, '/var/task')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image

W, H   = A4
MARGIN = 14*mm
COL    = W - 2*MARGIN

# ── Colours ────────────────────────────────────────────────────────────────────
BG    = HexColor('#090909')
CHAMP = HexColor('#c9a96e')
TEXT  = HexColor('#eeebe5')
MUTED = HexColor('#7a776f')
DIM   = HexColor('#3e3c38')
DARK2 = HexColor('#0e0e0c')
DARK3 = HexColor('#161510')

def ca(r,g,b,a): return Color(r,g,b,a)
def champ_a(a):  return ca(0.788,0.663,0.431,a)
def bg_a(a):     return ca(0.035,0.035,0.035,a)
def white_a(a):  return ca(1,1,1,a)

# ── Fonts ──────────────────────────────────────────────────────────────────────
# Try multiple locations so it works both locally and on Vercel
_SCRIPT = os.path.abspath(__file__)
_BASE   = os.path.dirname(_SCRIPT)
FONT_DIRS = [
    os.environ.get('XSCACE_BROCHURE_FONTS', ''),
    os.path.join(_BASE, 'fonts'),
    os.path.join(os.getcwd(), 'fonts'),
    '/var/task/api/brochure/fonts',
]

def find_font(fname):
    for d in FONT_DIRS:
        if d:
            p = os.path.join(d, fname)
            if os.path.exists(p): return p
    return None

_R = {}
def reg(alias, fname):
    p = find_font(fname)
    if p:
        try: pdfmetrics.registerFont(TTFont(alias, p)); _R[alias] = True
        except Exception as e: print(f'[font] {fname}: {e}', file=sys.stderr)
    else: print(f'[font] NOT FOUND: {fname}', file=sys.stderr)

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

def F(a,fb='Helvetica'):        return a if a in _R else fb
def FB(a,fb='Helvetica-Bold'):  return a if a in _R else fb
def FI(a,fb='Helvetica-Oblique'): return a if a in _R else fb
print(f'[fonts] {list(_R.keys())}', file=sys.stderr)

# ── Image helpers ──────────────────────────────────────────────────────────────
def b64img(s):
    if not s: return None
    try:
        b = base64.b64decode(s)
        return b if len(b) > 500 else None
    except: return None

def draw_img(c, b, x, y, w, h, cover=False):
    if not b: return False
    try:
        pil = Image.open(io.BytesIO(b))
        if pil.mode not in ('RGB','L'): pil = pil.convert('RGB')
        buf = io.BytesIO(); pil.save(buf,'PNG'); buf.seek(0)
        ir = ImageReader(buf); iw, ih = pil.size
        if cover:
            sc = max(w/iw, h/ih); sw, sh = iw*sc, ih*sc
            ox, oy = (w-sw)/2, (h-sh)/2
            c.saveState()
            cp = c.beginPath(); cp.rect(x,y,w,h); c.clipPath(cp,stroke=0)
            c.drawImage(ir, x+ox, y+oy, sw, sh, mask='auto')
            c.restoreState()
        else:
            c.drawImage(ir, x, y, w, h, preserveAspectRatio=True, mask='auto', anchor='c')
        return True
    except Exception as e:
        print(f'[img] {e}', file=sys.stderr); return False

# ── Drawing utils ──────────────────────────────────────────────────────────────
def rule(c, y, x=None, w=None, lw=0.5, a=1.0):
    c.setStrokeColor(CHAMP if a>=1.0 else champ_a(a))
    c.setLineWidth(lw); x0=x or MARGIN
    c.line(x0, y, x0+(w or COL), y)

def rect(c, x, y, w, h, col):
    c.setFillColor(col); c.rect(x,y,w,h,fill=1,stroke=0)

def wrap(c, txt, x, y, mw, fn, sz, col, lh=1.55):
    c.setFillColor(col); c.setFont(fn,sz)
    words=str(txt).split(); line=''; lines=[]
    for wd in words:
        t=(line+' '+wd).strip()
        if c.stringWidth(t,fn,sz)<=mw: line=t
        else:
            if line: lines.append(line)
            line=wd
    if line: lines.append(line)
    cy=y
    for l in lines: c.drawString(x,cy,l); cy-=sz*lh
    return y-cy

def spec_row(c, lbl, val, x, y, cw, sz=7.5):
    if not val: return 0
    c.setFillColor(MUTED); c.setFont(F('DMM'),sz); c.drawString(x,y,lbl)
    c.setFillColor(TEXT); c.setFont(F('DMM'),sz)
    vs=str(val)
    if c.stringWidth(vs,F('DMM'),sz)>cw*0.58: c.setFont(F('DMM'),sz-1)
    c.drawRightString(x+cw,y,vs)
    c.setStrokeColor(white_a(0.05)); c.setLineWidth(0.3)
    c.line(x, y-2.2*mm, x+cw, y-2.2*mm)
    return 5.2*mm

# ── Data ───────────────────────────────────────────────────────────────────────
NAME   = P.get('productName','Speaker')
FULL   = P.get('productFullName',NAME)
TAG    = P.get('tagline','')
DESC   = P.get('shortDescription','')
SERIES = P.get('series','')
SKU    = P.get('skuBase','')
COLORS = P.get('colorsStandard','')
MOUNT  = P.get('mountingMethods','')
if isinstance(MOUNT,list): MOUNT=', '.join(MOUNT)
MARINE = bool(P.get('marineTreatable'))
RAL    = bool(P.get('customRalAvailable'))
IP     = P.get('ipRating','')

TECH=[]
for b in (P.get('proprietaryTechBadges') or '').split(','):
    b=b.strip().replace('™','').replace('\u2122','')
    while '  ' in b: b=b.replace('  ',' ')
    if b: TECH.append(b)

HERO    = b64img(P.get('_hero_img_b64',''))
GALLERY = [b64img(s) for s in (P.get('_gallery_b64') or []) if s]
LIFE    = [b64img(s) for s in (P.get('_lifestyle_b64') or []) if s]

print(f'[data] hero:{bool(HERO)} gallery:{len(GALLERY)} life:{len(LIFE)} tech:{TECH}', file=sys.stderr)

# ── Tech icon renderer ─────────────────────────────────────────────────────────
def tech_icon(c, name, cx, cy, sc=0.44):
    c.saveState(); c.translate(cx,cy); c.scale(sc,sc)
    c.setStrokeColor(CHAMP); c.setFillColor(CHAMP)
    c.setLineCap(1); c.setLineJoin(1)
    n=name.lower().replace(' ','').replace('-','')

    if 'nano' in n or 'resonance' in n:
        c.setLineWidth(1.1)
        for dx in [-10,-6,0,6,10]:
            ex=dx*2.2; pth=c.beginPath()
            pth.moveTo(dx,18); pth.curveTo(dx,4,ex*0.5,-8,ex,-18); c.drawPath(pth)
        c.setFillColor(CHAMP); c.circle(0,-26,3.2,fill=1,stroke=0)
        c.setStrokeColor(champ_a(0.3)); c.setLineWidth(0.5); c.circle(0,-26,6.5,fill=0,stroke=1)

    elif 'precision' in n or 'xover' in n:
        c.setLineWidth(2)
        for i,hh in enumerate([8,14,20,24,24,20,14,8]):
            x=-21+i*6; c.line(x,-hh/2,x,hh/2)

    elif 'power' in n or 'dynamic' in n:
        c.setLineWidth(1.3); c.setFillColor(champ_a(0.07))
        pth=c.beginPath(); pth.moveTo(-8,2); pth.lineTo(20,24); pth.lineTo(6,-2); pth.close(); c.drawPath(pth,fill=1)
        for op,xy in [(0.75,(-26,-8,-10,2)),(0.55,(-24,-16,-6,-6)),(0.38,(-18,-22,0,-10))]:
            c.setStrokeColor(champ_a(op)); c.setLineWidth(1.1); c.line(*xy)

    elif 'aero' in n or 'frame' in n or 'chassis' in n:
        c.setLineWidth(0.9); c.setStrokeColor(champ_a(0.65))
        for ang in range(0,360,45):
            r=math.radians(ang); c.line(14*math.cos(r),14*math.sin(r),22*math.cos(r),22*math.sin(r))
        c.setLineWidth(1.6); c.setStrokeColor(champ_a(0.9))
        for ang in [0,90,180,270]:
            r=math.radians(ang); c.line(0,0,16*math.cos(r),16*math.sin(r))

    elif 'flow' in n or 'xs' in n:
        c.setLineWidth(2.8)
        pth=c.beginPath(); pth.moveTo(4,18); pth.lineTo(-16,18)
        pth.curveTo(-26,18,-26,-18,-16,-18); pth.lineTo(4,-18); c.drawPath(pth)
        c.setLineWidth(1.4)
        for ly in [18,-18,0]:
            c.line(4,ly,16,ly); c.setFillColor(CHAMP); c.circle(20,ly,2.2,fill=1,stroke=0)

    elif 'psy' in n or 'sculpt' in n:
        c.setLineWidth(1.5); pts=[(-20,10),(-12,-4),(-4,10),(4,-4),(12,10),(20,-4),(28,4)]
        pth=c.beginPath(); pth.moveTo(-28,-4)
        px,py=-28,-4
        for tx,ty in pts: pth.curveTo(px+4,py,tx-4,ty,tx,ty); px,py=tx,ty
        c.drawPath(pth)
        c.setStrokeColor(champ_a(0.2)); c.setLineWidth(0.6)
        pth2=c.beginPath(); pth2.moveTo(-28,8); px,py=-28,8
        for tx,ty in [(-20,-6),(-12,8),(-4,-6),(4,8),(12,-6),(20,8),(28,-2)]:
            pth2.curveTo(px+4,py,tx-4,ty,tx,ty); px,py=tx,ty
        c.drawPath(pth2)
    else:
        c.setLineWidth(1); c.setStrokeColor(champ_a(0.5))
        pth=c.beginPath(); pth.moveTo(0,16); pth.lineTo(16,0); pth.lineTo(0,-16); pth.lineTo(-16,0); pth.close(); c.drawPath(pth)
    c.restoreState()

# ── Hero badge — like the website button style ─────────────────────────────────
def hero_badge(c, label, sub, x, y, w=52*mm):
    """Draw a champagne-bordered badge like the marine/RAL buttons on the product page."""
    h=9*mm
    c.setStrokeColor(champ_a(0.35)); c.setLineWidth(0.5)
    c.rect(x, y, w, h, fill=0, stroke=1)
    # Scanning shimmer — a thin lighter rect on left 30%
    c.setFillColor(champ_a(0.04)); c.rect(x, y, w*0.3, h, fill=1, stroke=0)
    # Label
    c.setFillColor(HexColor('#c9a96e')); c.setFont(F('DMM'),7); c.setLineWidth(0)
    c.drawString(x+3*mm, y+5.5*mm, label.upper())
    if sub:
        c.setFillColor(champ_a(0.5)); c.setFont(F('DMM'),6)
        c.drawString(x+3*mm, y+2*mm, sub)

# ── Canvas ─────────────────────────────────────────────────────────────────────
cv = rl_canvas.Canvas(args.out, pagesize=A4)
cv.setTitle(f'{FULL} — XSCACE Product Brochure')
cv.setAuthor('XSCACE')

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER
# ══════════════════════════════════════════════════════════════════════════════
def page_cover(c):
    rect(c,0,0,W,H,BG)
    # Hero image right 56%
    sx=W*0.44
    if HERO:
        draw_img(c,HERO,sx,0,W-sx,H,cover=True)
        steps=80
        for i in range(steps):
            a=(1-i/steps)**1.8
            rect(c,sx+i*(W*0.32/steps),0,W*0.32/steps+2,H,bg_a(a))
        rect(c,sx,H-28*mm,W-sx,28*mm,bg_a(0.55))
        rect(c,sx,0,W-sx,16*mm,bg_a(0.65))
    else:
        rect(c,sx,0,W-sx,H,DARK2)
    # Top rule
    rect(c,0,H-1.5*mm,W,1.5*mm,CHAMP)
    tx=MARGIN; ty=H-20*mm
    # Logo
    if 'Magma' in _R:
        c.setFillColor(TEXT); c.setFont('Magma',18); c.drawString(tx,ty,'XSCACE')
    else:
        c.setFillColor(TEXT); c.setFont(FB('DMSB'),13); c.drawString(tx,ty,'XSCACE')
    c.setFillColor(MUTED); c.setFont(F('DMM'),6.5); c.drawString(tx,ty-5.5*mm,'SIZE DEFYING SOUND')
    # Name
    ty-=28*mm; c.setFillColor(TEXT); c.setFont(F('Cor'),56); c.drawString(tx,ty,NAME)
    # Tagline
    if TAG:
        ty-=12*mm; c.setFillColor(CHAMP); c.setFont(F('CorI'),17); c.drawString(tx,ty,TAG)
    ty-=8*mm; rule(c,ty,w=W*0.30,lw=0.5,a=0.4)
    if DESC:
        ty-=7*mm; ty-=wrap(c,DESC,tx,ty,W*0.30,F('DMS'),10.5,HexColor('#a8a49c'),lh=1.6)
    # Key stats — evenly spaced with plenty of room
    sy=MARGIN+34*mm
    stats=[]
    if P.get('powerRmsW'):     stats.append((f"{P['powerRmsW']}W",       'POWER'))
    if P.get('sensitivityDb'): stats.append((f"{P['sensitivityDb']}dB",  'SENSITIVITY'))
    if P.get('impedanceOhms'): stats.append((f"{P['impedanceOhms']}Ω",  'IMPEDANCE'))
    if P.get('depthMm'):       stats.append((f"{P['depthMm']}mm",        'DEPTH'))
    rule(c,sy+16*mm,w=W*0.38,lw=0.3,a=0.25)
    c.setFillColor(MUTED); c.setFont(F('DMM'),6); c.drawString(tx,sy+12*mm,'KEY SPECIFICATIONS')
    n=len(stats); cw=W*0.38/max(n,1)
    for i,(v,l) in enumerate(stats[:4]):
        sx2=tx+i*cw+2*mm   # +2mm left padding per cell
        c.setFillColor(CHAMP); c.setFont(F('CorSB'),22); c.drawString(sx2,sy+3*mm,v)
        c.setFillColor(MUTED); c.setFont(F('DMM'),5.5); c.drawString(sx2,sy-2.5*mm,l)
    # Footer
    c.setFillColor(DIM); c.setFont(F('DMM'),6)
    c.drawString(tx,MARGIN+6*mm,(SERIES+('  ·  '+SKU if SKU else '')).upper())
    c.drawRightString(W-MARGIN,MARGIN+6*mm,'XSCACE.COM')
    rule(c,MARGIN+12*mm,lw=0.3,a=0.15)
    c.setFillColor(DIM); c.setFont(F('DMM'),5.5); c.drawCentredString(W/2,MARGIN-1.5*mm,'01 — 03')

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 2 — STORY, TECH, FINISHES/MARINE/RAL
# ══════════════════════════════════════════════════════════════════════════════
def page_story(c):
    rect(c,0,0,W,H,BG)
    rect(c,0,H-1.5*mm,W,1.5*mm,CHAMP)
    c.setFillColor(MUTED); c.setFont(F('DMM'),6.5)
    c.drawString(MARGIN,H-9*mm,'XSCACE  ·  '+FULL.upper())
    c.drawRightString(W-MARGIN,H-9*mm,'02 — 03')
    rule(c,H-14*mm,lw=0.3,a=0.12)
    # Headline
    c.setFillColor(TEXT); c.setFont(F('Cor'),40); c.drawString(MARGIN,H-27*mm,'Designed to')
    c.setFillColor(CHAMP); c.setFont(F('CorI'),40); c.drawString(MARGIN,H-39*mm,'disappear.')
    # Lifestyle strip
    sh=H*0.28; sy=H-46*mm-sh
    life0=LIFE[0] if LIFE else (GALLERY[0] if GALLERY else None)
    if life0:
        draw_img(c,life0,0,sy,W,sh,cover=True)
        rect(c,0,sy,W,sh,bg_a(0.18))
    else:
        rect(c,0,sy,W,sh,DARK3)
    # Proprietary tech icons
    ty=sy-11*mm
    c.setFillColor(CHAMP); c.setFont(F('DMM'),7); c.drawString(MARGIN,ty,'PROPRIETARY TECHNOLOGY')
    rule(c,ty-3.5*mm,lw=0.3,a=0.15); ty-=8*mm
    if TECH:
        per=3; cw=COL/per; rh=25*mm
        for i,badge in enumerate(TECH):
            col=i%per; row=i//per
            cx=MARGIN+col*cw+cw/2; cy=ty-row*rh-5*mm
            tech_icon(c,badge,cx,cy,sc=0.44)
            c.setFillColor(CHAMP); c.setFont(F('DMM'),6.8)
            c.drawCentredString(cx,cy-14*mm,badge.upper())

    # ── Finishes / RAL / Marine row — website badge style ──────────────────────
    bot=MARGIN+10*mm; bh=12*mm
    rule(c,bot+20*mm,lw=0.3,a=0.15)
    third=COL/3

    # Standard colors — color swatches + label
    c.setFillColor(MUTED); c.setFont(F('DMM'),6.5)
    c.drawString(MARGIN,bot+16*mm,'STANDARD FINISHES')
    # Color swatches (small squares)
    color_map={'black':'#0A0A0A','white':'#F2F0EC','champagne':'#C9A96E',
               'anthracite':'#3C3F41','matte':'#2A2A28','white ':'#F2F0EC'}
    swatches=[]; raw=(COLORS or '').lower()
    for cname,chex in color_map.items():
        if cname in raw: swatches.append(chex)
    if not swatches: swatches=['#0A0A0A','#F2F0EC','#C9A96E']
    for j,chex in enumerate(swatches[:5]):
        sx2=MARGIN+j*6.5*mm
        c.setFillColor(HexColor(chex)); c.setStrokeColor(white_a(0.12)); c.setLineWidth(0.3)
        c.rect(sx2,bot+8.5*mm,5.5*mm,5.5*mm,fill=1,stroke=1)
    if COLORS:
        c.setFillColor(TEXT); c.setFont(F('DMS'),8)
        c.drawString(MARGIN,bot+5.5*mm,COLORS)

    # Custom RAL — badge style
    bx=MARGIN+third
    hero_badge(c,'Custom RAL','Any RAL — powder coat or anodised' if RAL else 'Not available',
               bx, bot+8*mm, w=third-6*mm)
    if RAL:
        # Small colour wheel chips below badge
        for j,chex in enumerate(['#9B2423','#1F4788','#1F4030','#F4F4F0','#0A0A0A']):
            c.setFillColor(HexColor(chex)); c.setStrokeColor(white_a(0.1)); c.setLineWidth(0.3)
            c.rect(bx+j*6*mm, bot+2.5*mm, 5*mm, 3.5*mm, fill=1, stroke=1)

    # Marine treatment — badge style
    bx2=MARGIN+2*third
    marine_label='Marine Treatment' if MARINE else 'Standard'
    marine_sub=IP if IP else ('Available' if MARINE else 'Not available')
    hero_badge(c,marine_label,marine_sub,bx2,bot+8*mm,w=third-6*mm)
    if IP:
        c.setFillColor(champ_a(0.55)); c.setFont(F('DMM'),6.5)
        c.drawString(bx2,bot+3.5*mm,IP+' rated')

    rule(c,MARGIN+6*mm,lw=0.3,a=0.15)
    c.setFillColor(DIM); c.setFont(F('DMM'),5.5)
    c.drawCentredString(W/2,MARGIN-1.5*mm,'XSCACE  ·  SIZE DEFYING SOUND')

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — SPECS LEFT + MOUNTING OPTIONS WITH IMAGES RIGHT
# ══════════════════════════════════════════════════════════════════════════════
def page_specs(c):
    rect(c,0,0,W,H,BG)
    rect(c,0,H-1.5*mm,W,1.5*mm,CHAMP)
    c.setFillColor(MUTED); c.setFont(F('DMM'),6.5)
    c.drawString(MARGIN,H-9*mm,'XSCACE  ·  '+FULL.upper())
    c.drawRightString(W-MARGIN,H-9*mm,'03 — 03')
    rule(c,H-14*mm,lw=0.3,a=0.12)
    c.setFillColor(TEXT); c.setFont(F('Cor'),30); c.drawString(MARGIN,H-26*mm,'Specifications')

    # Two-column: left 50% specs, right 46% mounting images
    colw=COL*0.50; imgx=MARGIN+colw+6*mm; imgw=COL-colw-6*mm

    # ── Right: 3 mounting option images stacked ──────────────────────────────
    # Parse mounting methods into up to 3 labels
    mount_methods=[m.strip() for m in MOUNT.split(',') if m.strip()][:3] if MOUNT else []
    # Available images: use lifestyle[1..] and gallery, then fallback to hero
    all_imgs=[LIFE[i] if i<len(LIFE) else None for i in range(1,4)]
    for i,gi in enumerate(GALLERY[:3]):
        if i<len(all_imgs) and not all_imgs[i]: all_imgs[i]=gi
    if not any(all_imgs) and HERO:
        all_imgs=[HERO, HERO, HERO]
    n_slots=max(len(mount_methods),1); n_slots=min(n_slots,3)
    slot_h=(H-38*mm-n_slots*3*mm)/n_slots; slot_h=max(slot_h,28*mm)
    top_y=H-32*mm
    for i in range(n_slots):
        iy=top_y-i*(slot_h+3*mm)-slot_h
        img=all_imgs[i] if i<len(all_imgs) else None
        if img:
            rect(c,imgx,iy,imgw,slot_h,DARK2)
            draw_img(c,img,imgx+2,iy+2,imgw-4,slot_h-4,cover=True)
            rect(c,imgx,iy,imgw,slot_h,bg_a(0.1))
        else:
            rect(c,imgx,iy,imgw,slot_h,DARK2)
        # Mount label
        lbl=mount_methods[i] if i<len(mount_methods) else ''
        if lbl:
            rect(c,imgx,iy,imgw,7*mm,bg_a(0.75))
            c.setFillColor(CHAMP); c.setFont(F('DMM'),6.5)
            c.drawString(imgx+3*mm,iy+4*mm,lbl.upper()+' MOUNT')

    # ── Left: spec groups ────────────────────────────────────────────────────
    sy=H-34*mm
    groups=[
        ('ACOUSTIC',[
            ('Power RMS',    f"{P['powerRmsW']}W" if P.get('powerRmsW') else None),
            ('Power Peak',   f"{P['powerPeakW']}W" if P.get('powerPeakW') else None),
            ('Sensitivity',  f"{P['sensitivityDb']} dB" if P.get('sensitivityDb') else None),
            ('Frequency',    f"{P.get('freqLowHz',0)}Hz – {P.get('freqHighHz',20000)//1000}kHz {P.get('freqQualifier','')}".strip() if P.get('freqHighHz') else None),
            ('Impedance',    f"{P['impedanceOhms']}Ω" if P.get('impedanceOhms') else None),
            ('Max SPL',      f"{P['splMaxDb']} dB" if P.get('splMaxDb') else None),
            ('THD+N',        P.get('thdN')),
            ('Drivers',      P.get('driverDescription')),
            ('Crossover',    P.get('crossoverType')),
            ('Directivity',  f"{P['directivityHDeg']}° H × {P['directivityVDeg']}° V" if P.get('directivityHDeg') else None),
        ]),
        ('PHYSICAL',[
            ('H × W × D',   f"{P.get('heightMm','—')} × {P.get('widthMm','—')} × {P.get('depthMm','—')} mm" if P.get('heightMm') else None),
            ('Weight',       f"{P['weightKg']} kg" if P.get('weightKg') else None),
            ('Housing',      P.get('housingMaterial')),
            ('Grille',       P.get('grilleMaterial')),
            ('IP Rating',    P.get('ipRating')),
            ('Connector',    P.get('speakerWireConnector')),
        ]),
    ]
    for gname,rows in groups:
        c.setFillColor(CHAMP); c.setFont(F('DMM'),7); c.drawString(MARGIN,sy,gname)
        sy-=4*mm; rule(c,sy,w=colw,lw=0.3,a=0.2); sy-=5*mm
        for lbl,val in rows:
            dy=spec_row(c,lbl,val,MARGIN,sy,colw); sy-=dy
        sy-=4*mm

    # Mounting options text
    if MOUNT:
        c.setFillColor(CHAMP); c.setFont(F('DMM'),7); c.drawString(MARGIN,sy,'MOUNTING OPTIONS')
        sy-=4*mm; rule(c,sy,w=colw,lw=0.3,a=0.2); sy-=6*mm
        c.setFillColor(TEXT); c.setFont(F('DMS'),8.5)
        sy-=wrap(c,MOUNT,MARGIN,sy,colw,F('DMS'),8.5,TEXT,lh=1.5)

    # CTA
    rect(c,0,0,W,MARGIN+20*mm,DARK2)
    rule(c,MARGIN+20*mm,lw=0.4,a=0.4)
    c.setFillColor(TEXT); c.setFont(F('Cor'),16); c.drawString(MARGIN,MARGIN+14*mm,'Enquire or specify your system')
    c.setFillColor(CHAMP); c.setFont(F('DMSM'),9); c.drawString(MARGIN,MARGIN+7*mm,'xscace.com   ·   support@xscace.com')
    c.setFillColor(DIM); c.setFont(F('DMM'),5.5); c.drawCentredString(W/2,MARGIN-1.5*mm,'XSCACE  ·  SIZE DEFYING SOUND')

page_cover(cv);  cv.showPage()
page_story(cv);  cv.showPage()
page_specs(cv);  cv.showPage()
cv.save()
print(f'Done: {args.out}',file=sys.stderr)
