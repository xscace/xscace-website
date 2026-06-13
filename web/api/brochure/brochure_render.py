"""
Deterministic reportlab brochure renderer.
Called directly by [slug].py — no subprocess, no AI generation.
"""
import os, sys, math, io, json
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

W, H = landscape(A4)
M = 36  # margin

BG    = HexColor('#090909')
CHAMP = HexColor('#c9a96e')
TEXT  = HexColor('#eeebe5')
MUTED = HexColor('#7a776f')
DARK  = HexColor('#0e0e0c')
DIM   = HexColor('#3a3835')

def ca(r,g,b,a): return Color(r,g,b,a)
def champ_a(a):  return ca(0.788,0.663,0.431,a)
def bg_a(a):     return ca(0.035,0.035,0.035,a)
def white_a(a):  return ca(1,1,1,a)

# ── Fonts ──────────────────────────────────────────────────────────────────────
_FONT_DIR = os.environ.get('XSCACE_BROCHURE_FONTS',
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts'))
_R = set()

def _reg(alias, fname):
    p = os.path.join(_FONT_DIR, fname)
    if os.path.exists(p):
        try: pdfmetrics.registerFont(TTFont(alias, p)); _R.add(alias)
        except Exception as e: print(f'[font] {fname}: {e}', file=sys.stderr)
    else: print(f'[font] missing: {fname}', file=sys.stderr)

_reg('Cor',  'Cormorant-Light.ttf')
_reg('CorI', 'Cormorant-Italic.ttf')
_reg('CorSB','Cormorant-SemiBold.ttf')
_reg('DMS',  'DMSans-Reg.ttf')
_reg('DMSB', 'DMSans-Bold.ttf')
_reg('DMM',  'DMMono-Regular.ttf')
_reg('DMMM', 'DMMono-Medium.ttf')
_reg('Magma','MagmaWave.otf')

def F(a,  fb='Helvetica'):        return a if a in _R else fb
def FB(a, fb='Helvetica-Bold'):   return a if a in _R else fb
def FI(a, fb='Helvetica-Oblique'):return a if a in _R else fb

# ── Drawing utils ──────────────────────────────────────────────────────────────
def fill(c, x, y, w, h, col):
    c.setFillColor(col); c.rect(x, y, w, h, fill=1, stroke=0)

def hline(c, y, x=0, w=None, lw=1, col=None, alpha=1.0):
    c.setStrokeColor(col if col else (CHAMP if alpha==1 else champ_a(alpha)))
    c.setLineWidth(lw); c.line(x, y, x+(w or W), y)

def txt(c, s, x, y, font, size, color, align='l'):
    c.setFillColor(color); c.setFont(font, size)
    if align == 'r': c.drawRightString(x, y, str(s))
    elif align == 'c': c.drawCentredString(x, y, str(s))
    else: c.drawString(x, y, str(s))

def wrap(c, text, x, y, maxw, font, size, color, lh=1.55):
    c.setFillColor(color); c.setFont(font, size)
    words = str(text).split(); line = ''; lines = []
    for w in words:
        t = (line+' '+w).strip()
        if c.stringWidth(t, font, size) <= maxw: line = t
        else:
            if line: lines.append(line)
            line = w
    if line: lines.append(line)
    cy = y
    for l in lines: c.drawString(x, cy, l); cy -= size * lh
    return y - cy

def draw_img(c, img_bytes, x, y, w, h, cover=False):
    if not img_bytes: return False
    try:
        from PIL import Image
        pil = Image.open(io.BytesIO(img_bytes))
        iw, ih = pil.size
        if pil.mode not in ('RGB','L'): pil = pil.convert('RGB')
        buf = io.BytesIO(); pil.save(buf,'JPEG',quality=88); buf.seek(0)
        ir = ImageReader(buf)
        if cover:
            sc = max(w/iw, h/ih); sw, sh = iw*sc, ih*sc
            ox, oy = (w-sw)/2, (h-sh)/2
            c.saveState()
            cp = c.beginPath(); cp.rect(x,y,w,h); c.clipPath(cp,stroke=0)
            c.drawImage(ir, x+ox, y+oy, sw, sh, mask='auto')
            c.restoreState()
        else:
            sc = min(w/iw, h/ih); sw, sh = iw*sc, ih*sc
            c.drawImage(ir, x+(w-sw)/2, y+(h-sh)/2, sw, sh, mask='auto')
        return True
    except Exception as e:
        print(f'[img] {e}', file=sys.stderr); return False

# ── Tech icons ─────────────────────────────────────────────────────────────────
def tech_icon(c, name, cx, cy, sc=0.44):
    c.saveState(); c.translate(cx,cy); c.scale(sc,sc)
    c.setStrokeColor(CHAMP); c.setFillColor(CHAMP); c.setLineCap(1)
    n = name.lower().replace('™','').replace(' ','').replace('-','')

    if 'psysculpt' in n or 'psy' in n:
        c.setLineWidth(1.6)
        pts=[(-20,10),(-12,-4),(-4,10),(4,-4),(12,10),(20,-4),(28,4)]
        p=c.beginPath(); p.moveTo(-28,-4); px,py=-28,-4
        for tx,ty in pts: p.curveTo(px+4,py,tx-4,ty,tx,ty); px,py=tx,ty
        c.drawPath(p)
        c.setStrokeColor(champ_a(0.25)); c.setLineWidth(0.7)
        p2=c.beginPath(); p2.moveTo(-28,8); px,py=-28,8
        for tx,ty in [(-20,-2),(-12,12),(-4,-2),(4,12),(12,-2),(20,12),(28,2)]:
            p2.curveTo(px+4,py,tx-4,ty,tx,ty); px,py=tx,ty
        c.drawPath(p2)

    elif 'flow' in n:
        c.setLineWidth(2.8)
        p=c.beginPath(); p.moveTo(4,18); p.lineTo(-16,18)
        p.curveTo(-26,18,-26,-18,-16,-18); p.lineTo(4,-18); c.drawPath(p)
        c.setLineWidth(1.5)
        for ly in [18,0,-18]:
            c.line(4,ly,16,ly)
            c.setFillColor(CHAMP); c.circle(20,ly,2.5,fill=1,stroke=0)

    elif 'nano' in n or 'resonance' in n:
        c.setLineWidth(1.2)
        for dx,ex in [(-10,-22),(-6,-13),(0,0),(6,13),(10,22)]:
            p=c.beginPath(); p.moveTo(dx,18); p.curveTo(dx,4,ex*0.5,-8,ex,-18); c.drawPath(p)
        c.setFillColor(CHAMP); c.circle(0,-26,3,fill=1,stroke=0)
        c.setStrokeColor(champ_a(0.3)); c.setLineWidth(0.5); c.circle(0,-26,6,fill=0,stroke=1)

    elif 'precision' in n or 'xover' in n:
        c.setLineWidth(0); c.setFillColor(CHAMP)
        for i,hh in enumerate([10,16,22,26,26,22,16,10]):
            c.rect(-23+i*6.5,-hh/2,5,hh,fill=1,stroke=0)

    elif 'aero' in n or 'frame' in n or 'chassis' in n:
        c.setLineWidth(0.9); c.setStrokeColor(champ_a(0.65))
        for ang in range(0,360,45):
            r=math.radians(ang); c.line(13*math.cos(r),13*math.sin(r),22*math.cos(r),22*math.sin(r))
        c.setLineWidth(1.8); c.setStrokeColor(champ_a(0.95))
        for ang in [0,90,180,270]:
            r=math.radians(ang); c.line(0,0,15*math.cos(r),15*math.sin(r))
        c.setLineWidth(1.5); c.setStrokeColor(CHAMP); c.circle(0,0,8,fill=0,stroke=1)

    elif 'power' in n or 'dynamic' in n:
        c.setLineWidth(1.5); c.setFillColor(champ_a(0.12))
        p=c.beginPath(); p.moveTo(-4,2); p.lineTo(18,24); p.lineTo(6,-2); p.close(); c.drawPath(p,fill=1)
        for op,xy in [(0.8,(-22,-8,-6,2)),(0.55,(-20,-16,-4,-6)),(0.35,(-16,-22,0,-12))]:
            c.setStrokeColor(champ_a(op)); c.setLineWidth(1.2); c.line(*xy)

    else:
        c.setLineWidth(1); c.setStrokeColor(champ_a(0.5))
        p=c.beginPath(); p.moveTo(0,16); p.lineTo(16,0); p.lineTo(0,-16); p.lineTo(-16,0); p.close(); c.drawPath(p)

    c.restoreState()

# ── Colour swatch colours ──────────────────────────────────────────────────────
COLOR_MAP = {
    'black':'#111111','anthracite':'#3C3F41','white':'#F2F0EC',
    'champagne':'#C9A96E','matte champagne':'#C9A96E',
    'slate':'#4A4A52','grey':'#5A5A5A','silver':'#8A8A8A',
}

def parse_colors(colors_str):
    result=[]
    for name in [c.strip() for c in colors_str.split(',') if c.strip()]:
        hex_c = COLOR_MAP.get(name.lower(), '#555555')
        result.append((hex_c, name))
    return result

# ── Page chrome ────────────────────────────────────────────────────────────────
def page_chrome(c, label_left, label_right, bars=True):
    fill(c,0,0,W,H,BG)
    if bars:
        fill(c,0,H-5,W,5,CHAMP)
        fill(c,0,0,W,5,CHAMP)
    # Header
    txt(c,label_left, M, H-18, F('DMM'), 7.5, MUTED)
    txt(c,label_right, W-M, H-18, F('DMM'), 7.5, DIM, align='r')
    hline(c, H-24, M, W-2*M, lw=0.3, alpha=0.12)

# ════════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER
# ════════════════════════════════════════════════════════════════════════════════
def page_cover(c, P, hero, lives, gals):
    fill(c,0,0,W,H,BG)
    fill(c,0,H-5,W,5,CHAMP)
    fill(c,0,0,W,5,CHAMP)

    # Hero image right 56%
    img_x = W*0.44
    if hero:
        draw_img(c, hero, img_x, 0, W-img_x, H, cover=True)
        # Gradient fade
        steps=70
        for i in range(steps):
            a=(1-i/steps)**1.8
            fill(c, img_x+i*(W*0.32/steps), 0, W*0.32/steps+2, H, bg_a(a))
        fill(c, img_x, H-30, W-img_x, 30, bg_a(0.6))
        fill(c, img_x, 0, W-img_x, 20, bg_a(0.7))
    else:
        fill(c, img_x, 0, W-img_x, H, DARK)

    # Logo
    tx=M; ty=H-22
    logo_font = F('Magma') if 'Magma' in _R else FB('DMSB')
    txt(c,'XSCACE',tx,ty,logo_font,15,TEXT)
    txt(c,'SIZE DEFYING SOUND',tx,ty-13,F('DMM'),7,MUTED)

    # Product name
    name = P.get('productName','')
    c.setFillColor(TEXT); c.setFont(F('Cor'),62); c.drawString(tx, H*0.52, name)

    # Tagline
    tagline = P.get('tagline','')
    c.setFillColor(CHAMP); c.setFont(FI('CorI'),20); c.drawString(tx, H*0.52-38, tagline)

    # Description
    desc = P.get('shortDescription','')
    wrap(c,desc,tx,H*0.52-58,W*0.30,F('DMS'),10.5,MUTED,lh=1.65)

    # Rule
    hline(c,H*0.22+10,tx,W*0.34,lw=0.8,alpha=0.35)

    # Key stats
    stats=[
        (f"{P['powerRmsW']}W",     'POWER')     if P.get('powerRmsW')    else None,
        (f"{P['sensitivityDb']}dB",'SENSITIVITY')if P.get('sensitivityDb')else None,
        (f"{P['impedanceOhms']}Ω",'IMPEDANCE') if P.get('impedanceOhms') else None,
        (f"{P['depthMm']}mm",      'DEPTH')      if P.get('depthMm')      else None,
    ]
    stats=[s for s in stats if s]
    sy=H*0.22-2; cw=W*0.36/max(len(stats),1)
    for i,(v,l) in enumerate(stats[:4]):
        sx=tx+i*cw
        c.setFillColor(CHAMP); c.setFont(F('CorSB'),24); c.drawString(sx,sy,v)
        c.setFillColor(DIM); c.setFont(F('DMM'),6); c.drawString(sx,sy-12,l)

    # Footer
    series=P.get('series',''); sku=P.get('skuBase','')
    hline(c,34,M,W-2*M,lw=0.3,alpha=0.18)
    txt(c,(series+(' · '+sku if sku else '')).upper(), M,20,F('DMM'),7,DIM)
    txt(c,'XSCACE.COM',W-M,20,F('DMM'),7,DIM,align='r')

# ════════════════════════════════════════════════════════════════════════════════
# PAGE 2 — SPECIFICATIONS
# ════════════════════════════════════════════════════════════════════════════════
def page_specs(c, P, hero, lives, mounts):
    name=P.get('productName','').upper()
    page_chrome(c,f'XSCACE · {name}','02 — 04')

    # Heading
    c.setFillColor(TEXT); c.setFont(F('Cor'),44); c.drawString(M, H-50, 'Specifications')

    col_w = W*0.50 - M; img_x = M+col_w+20; img_w = W-img_x-M

    # Right column images
    img_top_h = (H-110)*0.55; img_bot_h = (H-110)*0.42
    iy_top = H-100-img_top_h
    fill(c, img_x, iy_top, img_w, img_top_h, DARK)
    if hero: draw_img(c, hero, img_x+4, iy_top+4, img_w-8, img_top_h-8, cover=False)
    hline(c, iy_top+img_top_h, img_x, img_w, lw=0.3, alpha=0.1)
    iy_bot = iy_top - img_bot_h - 6
    fill(c, img_x, iy_bot, img_w, img_bot_h, DARK)
    if lives and lives[0]: draw_img(c, lives[0], img_x, iy_bot, img_w, img_bot_h, cover=True)

    # Left column specs
    sy = H-68

    def spec_group(label, rows):
        nonlocal sy
        c.setFillColor(CHAMP); c.setFont(F('DMM'),7.5); c.drawString(M,sy,label)
        sy-=5; hline(c,sy,M,col_w,lw=0.4,alpha=0.25); sy-=6
        for lbl,val in rows:
            if not val: continue
            txt(c,lbl,M,sy,F('DMM'),8,MUTED)
            vs=str(val)
            if c.stringWidth(vs,F('DMM'),8)>col_w*0.56: c.setFont(F('DMM'),7)
            txt(c,vs,M+col_w,sy,F('DMM'),8,TEXT,align='r')
            sy-=4; c.setStrokeColor(white_a(0.05)); c.setLineWidth(0.3)
            c.line(M,sy+1,M+col_w,sy+1); sy-=5

    spec_group('ACOUSTIC',[
        ('Power RMS',   f"{P['powerRmsW']}W"           if P.get('powerRmsW') else ''),
        ('Power Peak',  f"{P['powerPeakW']}W"           if P.get('powerPeakW') else ''),
        ('Sensitivity', f"{P['sensitivityDb']} dB"      if P.get('sensitivityDb') else ''),
        ('Frequency',   f"{P.get('freqLowHz')}Hz – {int(P['freqHighHz']//1000)}kHz {P.get('freqQualifier','')or ''}".strip() if P.get('freqHighHz') else ''),
        ('Impedance',   f"{P['impedanceOhms']}Ω"        if P.get('impedanceOhms') else ''),
        ('Max SPL',     f"{P['splMaxDb']} dB"           if P.get('splMaxDb') else ''),
        ('THD+N',       P.get('thdN','')),
        ('Drivers',     P.get('driverDescription','')),
        ('Crossover',   P.get('crossoverType','')),
        ('Directivity', f"{P['directivityHDeg']}° H × {P['directivityVDeg']}° V" if P.get('directivityHDeg') else ''),
    ])
    sy-=4
    spec_group('PHYSICAL',[
        ('H × W × D', f"{P.get('heightMm')} × {P.get('widthMm')} × {P.get('depthMm')} mm" if P.get('heightMm') else ''),
        ('Weight',    f"{P['weightKg']} kg" if P.get('weightKg') else ''),
        ('Housing',   P.get('housingMaterial','')),
        ('Grille',    P.get('grilleMaterial','')),
        ('IP Rating', P.get('ipRating','')),
        ('Connector', P.get('speakerWireConnector','')),
    ])

    # Mounting options
    sy-=6
    c.setFillColor(CHAMP); c.setFont(F('DMM'),7.5); c.drawString(M,sy,'MOUNTING OPTIONS')
    sy-=5; hline(c,sy,M,col_w,lw=0.4,alpha=0.25); sy-=8

    if mounts:
        card_w = (col_w-8*(len(mounts)-1)) / len(mounts)
        card_h = max(sy-28, 50)
        for i,m in enumerate(mounts):
            cx=M+i*(card_w+8); cy=28
            fill(c,cx,cy,card_w,card_h,DARK)
            c.setStrokeColor(champ_a(0.2)); c.setLineWidth(0.5)
            c.rect(cx,cy,card_w,card_h,fill=0,stroke=1)
            if m.get('img'):
                draw_img(c,m['img'],cx,cy+18,card_w,card_h-18,cover=True)
                fill(c,cx,cy+18,card_w,card_h-18,bg_a(0.15))
            else:
                # Placeholder speaker icon
                c.saveState(); c.translate(cx+card_w/2, cy+card_h*0.55)
                c.setStrokeColor(champ_a(0.2)); c.setLineWidth(0.6)
                c.rect(-8,-16,16,32,fill=0,stroke=1)
                c.line(-16,16,-8,16); c.line(-16,-16,-8,-16)
                c.restoreState()
            fill(c,cx,cy,card_w,16,HexColor('#111110'))
            c.setStrokeColor(champ_a(0.15)); c.setLineWidth(0.3)
            c.line(cx,cy+16,cx+card_w,cy+16)
            c.setFillColor(CHAMP); c.setFont(F('DMM'),6.5)
            c.drawCentredString(cx+card_w/2,cy+5,m['name'].upper())

# ════════════════════════════════════════════════════════════════════════════════
# PAGE 3 — TECHNOLOGY + FINISHES
# ════════════════════════════════════════════════════════════════════════════════
def page_tech(c, P):
    name=P.get('productName','').upper()
    page_chrome(c,f'XSCACE · {name}','03 — 04')

    # Headline
    c.setFillColor(TEXT);  c.setFont(F('Cor'),50);  c.drawString(M, H-52, 'Designed to')
    c.setFillColor(CHAMP); c.setFont(FI('CorI'),50); c.drawString(M, H-104, 'disappear.')

    # Tech section
    c.setFillColor(CHAMP); c.setFont(F('DMM'),7.5); c.drawString(M, H-122, 'PROPRIETARY TECHNOLOGY')
    hline(c, H-128, M, W-2*M, lw=0.4, alpha=0.2)

    tech=[b.strip().replace('™','').replace('\u2122','').replace('  ',' ')
          for b in (P.get('proprietaryTechBadges') or '').split(',') if b.strip()]

    per_row=3; cell_w=(W-2*M)/per_row; row_h=100
    tech_top = H-135
    for i,badge in enumerate(tech[:6]):
        col=i%per_row; row=i//per_row
        cx=M+col*cell_w+cell_w/2; cy=tech_top-row*row_h-30
        tech_icon(c, badge, cx, cy, sc=0.46)
        c.setFillColor(CHAMP); c.setFont(F('DMM'),7)
        c.drawCentredString(cx, cy-20, badge.upper())

    # Finishes row
    fin_y=60; fin_h=60; third=(W-2*M)/3

    def finish_card(label, x, w):
        fill(c,x,fin_y,w,fin_h,HexColor('#0a0a0a'))
        c.setStrokeColor(champ_a(0.28)); c.setLineWidth(0.6)
        c.rect(x,fin_y,w,fin_h,fill=0,stroke=1)
        fill(c,x,fin_y,w*0.25,fin_h,champ_a(0.04))
        c.setFillColor(champ_a(0.7)); c.setFont(F('DMM'),6.5)
        c.drawString(x+8,fin_y+fin_h-14,label.upper())
        hline(c,fin_y+fin_h-18,x+8,w-16,lw=0.3,alpha=0.15)
        return x+8, fin_y+fin_h-28

    # Standard finishes
    fx,fy=finish_card('Standard Finishes',M,third-6)
    colors=parse_colors(P.get('colorsStandard',''))
    for j,(chex,cname) in enumerate(colors[:5]):
        c.setFillColor(HexColor(chex)); c.setStrokeColor(white_a(0.12)); c.setLineWidth(0.3)
        c.rect(fx+j*16,fy,13,10,fill=1,stroke=1)
    txt(c,P.get('colorsStandard',''),fx,fin_y+10,F('DMS'),7.5,TEXT)

    # Custom RAL — colour wheel SVG-style using wedges
    fx2,fy2=finish_card('Custom RAL',M+third+3,third-6)
    ral=bool(P.get('customRalAvailable'))
    if ral:
        c.saveState(); c.translate(fx2+20, fin_y+28)
        hues=[0,30,60,90,120,150,180,210,240,270,300,330]
        import colorsys
        for j,hue in enumerate(hues):
            r,g,b=colorsys.hsv_to_rgb(hue/360,.75,.8)
            c.setFillColor(Color(r,g,b))
            c.wedge(-14,-14,14,14,j*30,30,fill=1,stroke=0)
        fill(c,-7,-7,14,14,HexColor('#0a0a0a'))
        c.restoreState()
        txt(c,'Any RAL colour',fx2+36,fin_y+24,F('DMS'),7.5,TEXT)
    else:
        txt(c,'Not available',fx2,fin_y+10,F('DMS'),7.5,MUTED)

    # Marine & IP — droplet
    fx3,fy3=finish_card('Marine & IP',M+2*third+6,third-6)
    ip=P.get('ipRating',''); marine=bool(P.get('marineTreatable'))
    c.saveState(); c.translate(fx3+14, fin_y+30)
    c.setStrokeColor(CHAMP); c.setFillColor(champ_a(0.18)); c.setLineWidth(1)
    pth=c.beginPath(); pth.moveTo(0,14)
    pth.curveTo(-9,6,-9,-8,0,-10); pth.curveTo(9,-8,9,6,0,14)
    c.drawPath(pth,fill=1,stroke=1)
    hline(c,0,-5,10,lw=0.6,col=champ_a(0.4))
    c.restoreStore=c.restoreState
    c.restoreState()
    marine_txt=(' · '.join(filter(None,[ip,'Marine-grade' if marine else '']))) or 'Standard'
    txt(c,marine_txt,fx3+32,fin_y+24,F('DMS'),7.5,TEXT)

# ════════════════════════════════════════════════════════════════════════════════
# PAGE 4 — GALLERY
# ════════════════════════════════════════════════════════════════════════════════
def page_gallery(c, P, lives, gals):
    name=P.get('productName','').upper()
    page_chrome(c,f'XSCACE · {name}','04 — 04')

    c.setFillColor(TEXT); c.setFont(F('Cor'),40); c.drawString(M, H-52, 'In context.')
    hline(c,H-62,M,W-2*M,lw=0.5,alpha=0.25)

    imgs=[l for l in lives if l]+[g for g in gals if g]
    gw=(W-2*M-6)/2; gh=(H-150)/2

    positions=[(M,H-68-gh),(M+gw+6,H-68-gh),(M,H-68-2*gh-6),(M+gw+6,H-68-2*gh-6)]
    for i,(px,py) in enumerate(positions):
        fill(c,px,py,gw,gh,DARK)
        if i<len(imgs): draw_img(c,imgs[i],px,py,gw,gh,cover=True)
        else:
            c.setStrokeColor(champ_a(0.08)); c.setLineWidth(0.4)
            c.rect(px,py,gw,gh,fill=0,stroke=1)

    # CTA footer
    fill(c,0,0,W,48,DARK)
    hline(c,48,0,W,lw=0.8,alpha=0.25)
    c.setFillColor(TEXT); c.setFont(F('Cor'),18); c.drawString(M,32,'Enquire or specify at xscace.com')
    c.setFillColor(CHAMP); c.setFont(F('DMM'),8); c.drawString(M,16,'support@xscace.com')
    c.setFillColor(DIM); c.setFont(F('DMM'),7); c.drawRightString(W-M,16,'XSCACE · SIZE DEFYING SOUND')


def render(P, hero, gals, lives, mounts, output_path):
    cv=rl_canvas.Canvas(output_path, pagesize=(W,H))
    cv.setTitle(f'{P.get("productFullName","")} — XSCACE Product Brochure')
    cv.setAuthor('XSCACE')

    page_cover(cv, P, hero, lives, gals);  cv.showPage()
    page_specs(cv,  P, hero, lives, mounts); cv.showPage()
    page_tech(cv,   P);                    cv.showPage()
    page_gallery(cv,P, lives, gals);       cv.showPage()
    cv.save()
    print(f'[brochure] rendered to {output_path}', file=sys.stderr)
