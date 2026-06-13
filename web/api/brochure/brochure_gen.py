"""
brochure_gen.py — XSCACE product brochure. Beautiful, on-brand, full-colour.
Usage: python brochure_gen.py --product product.json --out brochure.pdf
"""
import sys, os, json, math, argparse, io

p = argparse.ArgumentParser()
p.add_argument('--product', required=True)
p.add_argument('--out', required=True)
A = p.parse_args()
with open(A.product) as f: P = json.load(f)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image

W, H = A4

# Colours — match product page
BG    = HexColor('#090909')
CHAMP = HexColor('#c9a96e')
TEXT  = HexColor('#eeebe5')
MUTED = HexColor('#7a766e')
DIM   = HexColor('#56524b')
DARK2 = HexColor('#0f0f0e')
DARK3 = HexColor('#15140f')

def champ_a(a): return Color(0.788, 0.663, 0.431, a)
def white_a(a): return Color(1,1,1,a)
def bg_a(a):    return Color(0.035,0.035,0.035,a)

# Fonts
FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')
_F = {}
def reg(alias, fname):
    try:
        pth = os.path.join(FD, fname)
        if os.path.exists(pth):
            pdfmetrics.registerFont(TTFont(alias, pth)); _F[alias]=1; return True
    except Exception as e:
        print(f'font {fname}: {e}', file=sys.stderr)
    return False

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

def f(a, fb='Helvetica'):       return a if a in _F else fb
def fb(a, x='Helvetica-Bold'):  return a if a in _F else x

# Data
NAME  = P.get('productName','Speaker')
FULL  = P.get('productFullName', NAME)
TAG   = P.get('tagline','')
DESC  = P.get('shortDescription','')
LONG  = P.get('longDescriptionText','') or DESC
SERIES= P.get('series','')
SKU   = P.get('skuBase','')

HERO  = P.get('_hero_img_bytes')
GALLERY = [b for b in P.get('_gallery_bytes', []) if b]
LIFE  = [b for b in P.get('_lifestyle_bytes', []) if b]

TECH = [b.strip().replace('™','').replace('  ',' ')
        for b in (P.get('proprietaryTechBadges') or '').split(',') if b.strip()]
COLORS = P.get('colorsStandard','')
MOUNT  = P.get('mountingMethods','')
if isinstance(MOUNT, list): MOUNT = ', '.join(MOUNT)
MARINE = P.get('marineTreatable', False)
RAL    = P.get('customRalAvailable', False)
IP     = P.get('ipRating','')

MARGIN = 15*mm
COL = W - 2*MARGIN

def rule(c, y, x=None, w=None, lw=0.5, a=1.0):
    c.setStrokeColor(CHAMP if a==1.0 else champ_a(a)); c.setLineWidth(lw)
    c.line(x or MARGIN, y, (x or MARGIN)+(w or COL), y)

def img_fit(c, b, x, y, w, h, cover=False):
    """Draw image. cover=True crops to fill; else contain."""
    if not b: return False
    try:
        im = Image.open(io.BytesIO(b)); iw, ih = im.size
        ir = ImageReader(io.BytesIO(b))
        if cover:
            scale = max(w/iw, h/ih); sw, sh = iw*scale, ih*scale
            ox, oy = (w-sw)/2, (h-sh)/2
            c.saveState(); pth = c.beginPath()
            pth.rect(x,y,w,h); c.clipPath(pth, stroke=0)
            c.drawImage(ir, x+ox, y+oy, sw, sh, mask='auto')
            c.restoreState()
        else:
            c.drawImage(ir, x, y, w, h, preserveAspectRatio=True, mask='auto', anchor='c')
        return True
    except Exception as e:
        print(f'img: {e}', file=sys.stderr); return False

def wrap(c, txt, x, y, mw, fn, sz, col, lh=1.5, align='l'):
    c.setFillColor(col); c.setFont(fn, sz)
    out, line = [], ''
    for w in txt.split():
        t = (line+' '+w).strip()
        if c.stringWidth(t, fn, sz) <= mw: line=t
        else: out.append(line); line=w
    if line: out.append(line)
    cy=y
    for l in out:
        if align=='c': c.drawCentredString(x+mw/2, cy, l)
        elif align=='r': c.drawRightString(x+mw, cy, l)
        else: c.drawString(x, cy, l)
        cy -= sz*lh
    return y-cy

# Tech icon drawer — vector recreations matching website
def tech_icon(c, name, cx, cy, s=1.0):
    c.saveState(); c.translate(cx, cy); c.scale(s, s)
    c.setStrokeColor(CHAMP); c.setLineCap(1); c.setLineJoin(1)
    n = name.lower()
    if 'nano' in n:
        c.setLineWidth(1.1)
        for dx, curve in [(-10,-14),(-6,-8),(0,0),(6,8),(10,14)]:
            pth=c.beginPath(); pth.moveTo(dx,16); pth.curveTo(dx,2,dx+curve*0.4,-8,curve,-16)
            c.drawPath(pth)
        c.setFillColor(CHAMP); c.circle(0,-22,3,fill=1,stroke=0)
        c.setStrokeColor(champ_a(0.3)); c.setLineWidth(0.5); c.circle(0,-22,6,fill=0,stroke=1)
    elif 'precision' in n or 'xover' in n:
        c.setLineWidth(1.8); hs=[8,14,20,24,24,20,14,8]
        for i,hh in enumerate(hs):
            x=-21+i*6; c.line(x,-hh/2,x,hh/2)
    elif 'powerdense' in n or 'power' in n:
        c.setLineWidth(1.3); c.setFillColor(champ_a(0.06))
        pth=c.beginPath(); pth.moveTo(-8,0); pth.lineTo(20,22); pth.lineTo(6,-2); pth.close(); c.drawPath(pth,fill=1)
        for i,(x1,y1,x2,y2,op) in enumerate([(-26,-10,-10,0,.75),(-24,-18,-6,-6,.6),(-18,-24,0,-12,.45)]):
            c.setStrokeColor(champ_a(op)); c.setLineWidth(1.2-i*0.2); c.line(x1,y1,x2,y2)
    elif 'aero' in n or 'frame' in n:
        import math as _m
        c.setLineWidth(0.9); c.setStrokeColor(champ_a(0.7))
        for ang in range(0,360,45):
            r=_m.radians(ang); c.line(14*_m.cos(r),14*_m.sin(r),22*_m.cos(r),22*_m.sin(r))
        c.setLineWidth(1.5); c.setStrokeColor(champ_a(0.9))
        for ang in [90,0,270,180]:
            r=_m.radians(ang); c.line(0,0,15*_m.cos(r),15*_m.sin(r))
    elif 'flow' in n:
        c.setLineWidth(2.6)
        pth=c.beginPath(); pth.moveTo(4,16); pth.lineTo(-16,16); pth.curveTo(-24,16,-24,8,-24,0)
        pth.curveTo(-24,-8,-24,-16,-16,-16); pth.lineTo(4,-16); c.drawPath(pth)
        c.setFillColor(CHAMP)
        for ly in [16,-16,0]:
            c.setLineWidth(1.3); c.line(4,ly,14,ly); c.circle(20,ly,2,fill=1,stroke=0)
    elif 'psy' in n or 'sculpt' in n:
        c.setLineWidth(1.4)
        pth=c.beginPath(); pth.moveTo(-28,-4)
        pts=[(-24,6),(-16,-2),(-8,8),(0,-8),(8,8),(16,-2),(24,6),(28,-4)]
        px=-28
        for x,y in pts: pth.curveTo(px+4,y,x-4,y,x,y); px=x
        c.drawPath(pth)
    else:
        c.setLineWidth(1.2); c.circle(0,0,16,fill=0,stroke=1)
    c.restoreState()

cv = canvas.Canvas(A.out, pagesize=A4)
cv.setTitle(f'{FULL} — XSCACE Brochure'); cv.setAuthor('XSCACE')

# ════════════════════════ PAGE 1 — COVER ════════════════════════
def cover(c):
    c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)
    # Hero right 58%, full bleed
    if HERO:
        ix=W*0.42; img_fit(c, HERO, ix, 0, W-ix, H, cover=True)
        steps=70
        for i in range(steps):
            a=(1-i/steps)**1.6
            c.setFillColor(bg_a(a)); xx=ix+(i/steps)*W*0.34
            c.rect(xx,0,W*0.34/steps+1,H,fill=1,stroke=0)
    else:
        c.setFillColor(DARK2); c.rect(W*0.42,0,W*0.58,H,fill=1,stroke=0)
    # Champagne top
    c.setFillColor(CHAMP); c.rect(0,H-1.4*mm,W,1.4*mm,fill=1,stroke=0)
    tx=MARGIN; ty=H-20*mm
    # Logo
    c.setFillColor(TEXT)
    if 'Magma' in _F:
        c.setFont('Magma',16); c.drawString(tx,ty,'XSCACE')
    else:
        c.setFont(fb('DMSB'),13); c.drawString(tx,ty,'XSCACE')
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5); c.drawString(tx,ty-5.5*mm,'SIZE DEFYING SOUND')
    # Name
    ty-=26*mm; c.setFillColor(TEXT); c.setFont(f('Cor'),58); c.drawString(tx,ty,NAME)
    if TAG:
        ty-=11*mm; c.setFillColor(CHAMP); c.setFont(f('CorI'),17); c.drawString(tx,ty,TAG)
    ty-=7*mm; rule(c,ty,w=W*0.30,a=0.5)
    if DESC:
        ty-=8*mm; ch=wrap(c,DESC,tx,ty,W*0.30,f('DMS'),10.5,HexColor('#a8a49c'),lh=1.65); ty-=ch
    # Stats
    sy=MARGIN+34*mm
    stats=[]
    if P.get('powerRmsW'): stats.append((f"{P['powerRmsW']}W",'POWER'))
    if P.get('sensitivityDb'): stats.append((f"{P['sensitivityDb']}dB",'SENSITIVITY'))
    if P.get('impedanceOhms'): stats.append((f"{P['impedanceOhms']}Ω",'IMPEDANCE'))
    if P.get('depthMm'): stats.append((f"{P['depthMm']}mm",'DEPTH'))
    rule(c,sy+15*mm,w=W*0.36,lw=0.3,a=0.3)
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5); c.drawString(tx,sy+11*mm,'KEY SPECIFICATIONS')
    cw=W*0.36/max(len(stats),1)
    for i,(v,l) in enumerate(stats[:4]):
        sx=tx+i*cw
        c.setFillColor(CHAMP); c.setFont(fb('CorSB'),22); c.drawString(sx,sy+2*mm,v)
        c.setFillColor(MUTED); c.setFont(f('DMM'),5.5); c.drawString(sx,sy-3*mm,l)
    # Footer
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5)
    c.drawString(tx,MARGIN+5*mm,(SERIES+('  ·  '+SKU if SKU else '')).upper())
    c.drawRightString(W-MARGIN,MARGIN+5*mm,'XSCACE.COM')
    rule(c,MARGIN+11*mm,lw=0.3,a=0.2)
    c.setFillColor(DIM); c.setFont(f('DMM'),6); c.drawCentredString(W/2,MARGIN-1*mm,'01 — 03')

# ════════════════════════ PAGE 2 — STORY + TECH ════════════════════════
def page_story(c):
    c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)
    rule(c,H-1.4*mm)
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5)
    c.drawString(MARGIN,H-9*mm,'XSCACE  ·  '+FULL.upper())
    c.drawRightString(W-MARGIN,H-9*mm,'02 — 03')
    rule(c,H-13*mm,lw=0.3,a=0.15)
    # Headline
    c.setFillColor(TEXT); c.setFont(f('Cor'),38); c.drawString(MARGIN,H-27*mm,'Designed to')
    c.setFillColor(CHAMP); c.setFont(f('CorI'),38); c.drawString(MARGIN,H-39*mm,'disappear.')
    # Lifestyle hero strip
    ih=H*0.30; iy=H-46*mm-ih
    life0 = LIFE[0] if LIFE else (GALLERY[0] if GALLERY else None)
    if life0:
        img_fit(c, life0, 0, iy, W, ih, cover=True)
        c.setFillColor(bg_a(0.2)); c.rect(0,iy,W,ih,fill=1,stroke=0)
    else:
        c.setFillColor(DARK3); c.rect(0,iy,W,ih,fill=1,stroke=0)
    # Tech section
    ty=iy-11*mm
    c.setFillColor(CHAMP); c.setFont(f('DMM'),7); c.drawString(MARGIN,ty,'PROPRIETARY TECHNOLOGY')
    rule(c,ty-3.5*mm,lw=0.3,a=0.15)
    ty-=8*mm
    if TECH:
        n=len(TECH); per_row=3; cw=COL/per_row; rh=26*mm
        for i,badge in enumerate(TECH):
            col=i%per_row; row=i//per_row
            bx=MARGIN+col*cw+cw/2; by=ty-row*rh-6*mm
            tech_icon(c, badge, bx, by, s=0.42)
            c.setFillColor(TEXT); c.setFont(f('DMM'),7.5)
            c.drawCentredString(bx, by-13*mm, badge.upper())
    # Bottom — finishes / marine / RAL row
    by=MARGIN+14*mm
    rule(c,by+18*mm,lw=0.3,a=0.15)
    third=COL/3
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5)
    c.drawString(MARGIN,by+13*mm,'STANDARD FINISHES')
    c.setFillColor(TEXT); c.setFont(f('DMS'),8.5)
    wrap(c,COLORS or '—',MARGIN,by+7*mm,third-6*mm,f('DMS'),8.5,TEXT,lh=1.4)
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5)
    c.drawString(MARGIN+third,by+13*mm,'CUSTOM RAL')
    c.setFillColor(TEXT if RAL else DIM); c.setFont(f('DMS'),8.5)
    c.drawString(MARGIN+third,by+7*mm,'Available — any RAL code' if RAL else 'Not available')
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5)
    c.drawString(MARGIN+2*third,by+13*mm,'MARINE / IP')
    c.setFillColor(TEXT); c.setFont(f('DMS'),8.5)
    mtxt = (IP or '') + (' · Marine-grade' if MARINE else '')
    c.drawString(MARGIN+2*third,by+7*mm, mtxt or '—')
    c.setFillColor(DIM); c.setFont(f('DMM'),6); c.drawCentredString(W/2,MARGIN-1*mm,'XSCACE')
    rule(c,MARGIN+6*mm,lw=0.3,a=0.2)

# ════════════════════════ PAGE 3 — SPECS + MOUNTING ════════════════════════
def page_specs(c):
    c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)
    rule(c,H-1.4*mm)
    c.setFillColor(MUTED); c.setFont(f('DMM'),6.5)
    c.drawString(MARGIN,H-9*mm,'XSCACE  ·  '+FULL.upper())
    c.drawRightString(W-MARGIN,H-9*mm,'03 — 03')
    rule(c,H-13*mm,lw=0.3,a=0.15)
    c.setFillColor(TEXT); c.setFont(f('Cor'),30); c.drawString(MARGIN,H-25*mm,'Specifications')

    colw=COL*0.50; imgx=MARGIN+colw+8*mm; imgw=COL-colw-8*mm
    # Right column: gallery image top, lifestyle bottom
    img_top_h=(H-40*mm)*0.5; img_bot_h=(H-40*mm)*0.5
    gimg = GALLERY[0] if GALLERY else HERO
    limg = LIFE[1] if len(LIFE)>1 else (LIFE[0] if LIFE else None)
    iy_top=H-32*mm-img_top_h
    if gimg:
        c.setFillColor(DARK2); c.rect(imgx,iy_top,imgw,img_top_h,fill=1,stroke=0)
        img_fit(c, gimg, imgx+4, iy_top+4, imgw-8, img_top_h-8, cover=False)
    iy_bot=iy_top-img_bot_h-4*mm
    if limg:
        img_fit(c, limg, imgx, iy_bot, imgw, img_bot_h, cover=True)

    # Left: specs
    groups=[
        ('ACOUSTIC',[
            ('Power RMS', f"{P['powerRmsW']}W" if P.get('powerRmsW') else None),
            ('Power Peak', f"{P['powerPeakW']}W" if P.get('powerPeakW') else None),
            ('Sensitivity', f"{P['sensitivityDb']} dB" if P.get('sensitivityDb') else None),
            ('Frequency', f"{P.get('freqLowHz')}Hz–{P.get('freqHighHz')//1000}kHz {P.get('freqQualifier','')}" if P.get('freqHighHz') else None),
            ('Impedance', f"{P['impedanceOhms']}Ω" if P.get('impedanceOhms') else None),
            ('Max SPL', f"{P['splMaxDb']} dB" if P.get('splMaxDb') else None),
            ('THD+N', P.get('thdN')),
            ('Drivers', P.get('driverDescription')),
            ('Crossover', P.get('crossoverType')),
            ('Directivity', f"{P['directivityHDeg']}° H × {P['directivityVDeg']}° V" if P.get('directivityHDeg') else None),
        ]),
        ('PHYSICAL',[
            ('Dimensions', f"{P.get('heightMm','—')} × {P.get('widthMm','—')} × {P.get('depthMm','—')} mm" if P.get('heightMm') else None),
            ('Weight', f"{P['weightKg']} kg" if P.get('weightKg') else None),
            ('Housing', P.get('housingMaterial')),
            ('Grille', P.get('grilleMaterial')),
            ('IP Rating', P.get('ipRating')),
            ('Connector', P.get('speakerWireConnector')),
        ]),
    ]
    sy=H-38*mm
    for gname,rows in groups:
        c.setFillColor(CHAMP); c.setFont(f('DMM'),7); c.drawString(MARGIN,sy,gname)
        sy-=4*mm; rule(c,sy,w=colw,lw=0.3,a=0.2); sy-=5*mm
        for lbl,val in rows:
            if not val: continue
            c.setFillColor(MUTED); c.setFont(f('DMM'),7.5); c.drawString(MARGIN,sy,lbl)
            c.setFillColor(TEXT); c.setFont(f('DMM'),7.5)
            vs=str(val)
            if c.stringWidth(vs,f('DMM'),7.5)>colw*0.62:
                c.setFont(f('DMM'),6.5)
            c.drawRightString(MARGIN+colw,sy,vs)
            sy-=4*mm; c.setStrokeColor(white_a(0.04)); c.setLineWidth(0.3)
            c.line(MARGIN,sy+1.5*mm,MARGIN+colw,sy+1.5*mm); sy-=2*mm
        sy-=4*mm
    # Mounting block (separate)
    if MOUNT:
        c.setFillColor(CHAMP); c.setFont(f('DMM'),7); c.drawString(MARGIN,sy,'MOUNTING OPTIONS')
        sy-=4*mm; rule(c,sy,w=colw,lw=0.3,a=0.2); sy-=5*mm
        c.setFillColor(TEXT); c.setFont(f('DMS'),8.5)
        sy-=wrap(c,MOUNT,MARGIN,sy,colw,f('DMS'),8.5,TEXT,lh=1.5)
    # CTA
    c.setFillColor(DARK2); c.rect(0,0,W,MARGIN+20*mm,fill=1,stroke=0)
    rule(c,MARGIN+20*mm,lw=0.4,a=0.4)
    c.setFillColor(TEXT); c.setFont(f('Cor'),16); c.drawString(MARGIN,MARGIN+13*mm,'Enquire or specify your system')
    c.setFillColor(CHAMP); c.setFont(fb('DMSM'),9)
    c.drawString(MARGIN,MARGIN+6*mm,'xscace.com   ·   support@xscace.com')
    c.setFillColor(DIM); c.setFont(f('DMM'),6); c.drawCentredString(W/2,MARGIN-1*mm,'XSCACE  ·  SIZE DEFYING SOUND')

cover(cv); cv.showPage()
page_story(cv); cv.showPage()
page_specs(cv); cv.showPage()
cv.save()
print(f'Done: {A.out}')
