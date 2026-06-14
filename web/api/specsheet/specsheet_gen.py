"""XSCACE Spec Sheet Generator — v2
Usage:
  python3 specsheet_gen.py                          # uses built-in PRODUCT dict (Cane demo)
  python3 specsheet_gen.py --product data.json --out out.pdf  # API mode
"""
import math, sys, argparse, json, os
_SCRIPT_DIR = os.environ.get('XSCACE_CHART_DIR') or os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')

def _parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--product', default=None, help='JSON file with product data from Sanity')
    p.add_argument('--out', default=None, help='Output PDF path')
    return p.parse_args()

_args = _parse_args()

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm

W, H    = A4
BG      = HexColor('#090909')
CHAMP   = HexColor('#c9a96e')
CHAMP2  = HexColor('#8a6d3f')
TEXT    = HexColor('#eeebe5')
MUTED   = HexColor('#6b6760')
BORDER  = HexColor('#1f1e1c')
MID     = HexColor('#151413')
MARGIN  = 18*mm
COL     = W - 2*MARGIN

PRODUCT = {
    'name':'Cane','full_name':'Cane Slim Array Speaker','tagline':'Slim Array Speaker',
    'sku':'XSP-SA-CAN','series':'Slim Array Series','year':2022,
    'description':'Though compact, Cane defies expectations with its petite frame and formidable 50W power, producing astonishing sound.',
    'power_rms':50,'power_peak':60,'impedance':8,'sensitivity':92,'freq_low':150,
    'freq_high':20000,'freq_qual':'±3dB','drivers':'4 × 1.25" Neodymium, Rubber Edge',
    'crossover':'Built-In Passive Crossover','xover_hz':200,'spl_max':110,
    'thd_n':'≤0.08% @ 1W/1m','dir_h':140,'dir_v':25,
    'height':183.5,'width':43,'depth':23,'weight':0.2,
    'housing':'Aerospace Aluminium','grille':'Mild Steel','ip':'IP66',
    'mounting':'Surface, Corner, Floorstand','connector':'Push Terminal',
    'wire':'14 AWG or thinner',
    'eq':[
        {'freq':250, 'gain': 3,   'type':'LS', 'q':5,   'label':'Low Shelf boost'},
        {'freq':770, 'gain':-3,   'type':'LS', 'q':5,   'label':'Low Shelf cut'},
        {'freq':3000,'gain':-3,   'type':'HS', 'q':1,   'label':'High Shelf cut'},
        {'freq':200, 'gain':None, 'type':'HP', 'q':0.7, 'label':'High-Pass filter'},
    ],
    'eq_profile':'Default','confidence':'Lab Verified',
}

# ── Load from CLI JSON if provided ───────────────────────────────────────────
if _args.product:
    import os
    with open(_args.product) as _f:
        _d = json.load(_f)
    def _hz(v): return int(v) if v else 0
    def _khz(v): return int(v/1000) if v and v >= 1000 else (int(v) if v else 0)

    # Parse eqData CSV into filter list
    _eq = []
    if _d.get('eqData'):
        for _line in _d['eqData'].strip().split('\n')[1:]:
            _p = _line.strip().split(',')
            if len(_p) < 2: continue
            if _p[0] in ('HP','LP'):
                _eq.append({'freq':float(_p[1]),'gain':None,'type':_p[0],'q':float(_p[2]) if len(_p)>2 else 0.7,'label':_p[0]+' filter'})
            else:
                _eq.append({'freq':float(_p[0]),'gain':float(_p[1]),'type':_p[2] if len(_p)>2 else 'PK',
                            'q':float(_p[3]) if len(_p)>3 else 1.0,'label':_p[2]+' filter' if len(_p)>2 else 'EQ'})

    PRODUCT = {
        'name': _d.get('productName','Speaker'),
        'full_name': _d.get('productFullName', _d.get('productName','Speaker')),
        'tagline': _d.get('tagline',''),
        'sku': _d.get('skuBase',''),
        'series': _d.get('series',''),
        'year': _d.get('launchYear', 2022),
        'description': '',
        'power_rms': _d.get('powerRmsW', 0) or 0,
        'power_peak': _d.get('powerPeakW', 0) or 0,
        'impedance': _d.get('impedanceOhms', 8) or 8,
        'sensitivity': _d.get('sensitivityDb', 90) or 90,
        'freq_low': _d.get('freqLowHz', 80) or 80,
        'freq_high': _d.get('freqHighHz', 20000) or 20000,
        'freq_qual': _d.get('freqQualifier', '±3dB') or '±3dB',
        'drivers': _d.get('driverDescription', '') or '',
        'crossover': _d.get('crossoverType', '') or '',
        'xover_hz': _d.get('recommendedCrossoverHz', 80) or 80,
        'spl_max': _d.get('splMaxDb') or (
            round((_d.get('sensitivityDb') or 90) + 10*math.log10(max(_d.get('powerPeakW') or 1, 1)))
            if _d.get('powerPeakW') else (_d.get('sensitivityDb') or 90)
        ),
        'thd_n': _d.get('thdN', '') or '',
        'dir_h': _d.get('directivityHDeg', 140) or 140,
        'dir_v': _d.get('directivityVDeg', 25) or 25,
        'height': _d.get('heightMm', 0) or 0,
        'width': _d.get('widthMm', 0) or 0,
        'depth': _d.get('depthMm', 0) or 0,
        'weight': _d.get('weightKg', 0) or 0,
        'housing': _d.get('housingMaterial', '') or '',
        'grille': _d.get('grilleMaterial', '') or '',
        'ip': _d.get('ipRating', '') or '',
        'mounting': _d.get('mountingMethods', '') or '',
        'connector': _d.get('speakerWireConnector', '') or '',
        'wire': _d.get('wireGaugeRecommended', '') or '',
        'eq': _eq,
        'eq_profile': _d.get('eqProfileName', 'Default') or 'Default',
        'confidence': _d.get('specConfidence', 'Lab Verified') or 'Lab Verified',
    }


# ── MAGMAWAVE IMAGES (pre-rendered PNGs) ──────────────────────────────────────
# MagmaWave font path — loaded from same fonts/ dir as brochure
_MAGMA_OTF = None
for _d in [_SCRIPT_DIR, os.path.join(_SCRIPT_DIR,'fonts'), '/var/task/api/specsheet/fonts']:
    _p = os.path.join(_d, 'MagmaWave.otf')
    if os.path.exists(_p): _MAGMA_OTF = _p; break

def _reg_magma():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    if _MAGMA_OTF:
        try: pdfmetrics.registerFont(TTFont('MagmaWave', _MAGMA_OTF)); return True
        except: pass
    return False
_HAS_MAGMA = _reg_magma()

def draw_magma_text(c, text, x, y, size, color):
    """Draw text in MagmaWave if available, else Helvetica-Bold."""
    c.setFillColor(color)
    if _HAS_MAGMA:
        c.setFont('MagmaWave', size)
    else:
        c.setFont('Helvetica-Bold', size)
    c.drawString(x, y, text)

def page_bg(c):
    c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)

def hline(c, y, color=CHAMP, lw=0.5):
    c.setStrokeColor(color); c.setLineWidth(lw)
    c.line(MARGIN, y, W-MARGIN, y)

def footer(c, n, total=7):
    y = 11*mm
    c.setStrokeColor(BORDER); c.setLineWidth(0.4)
    c.line(MARGIN, y+4*mm, W-MARGIN, y+4*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',6.5)
    c.drawString(MARGIN, y, 'XSCACE  ·  xscace.com')
    c.drawCentredString(W/2, y, PRODUCT['full_name'].upper())
    c.drawRightString(W-MARGIN, y, f'{n} / {total}')

def lbl(c,x,y,t,sz=6.5,col=MUTED):
    c.setFillColor(col); c.setFont('Helvetica',sz); c.drawString(x,y,t.upper())

def val(c,x,y,t,sz=9,col=TEXT):
    c.setFillColor(col); c.setFont('Helvetica-Bold',sz); c.drawString(x,y,t)

def row2(c, y, l1,v1, l2,v2, rh=9.5*mm):
    half = COL/2
    for xi, la, va in [(MARGIN,l1,v1),(MARGIN+half,l2,v2)]:
        c.setFillColor(MID)
        c.rect(xi, y-2*mm, half-2*mm, rh, fill=1, stroke=0)
        lbl(c, xi+3*mm, y+1.5*mm, la, 6.5)
        val(c, xi+3*mm, y+5*mm, va, 8.5)

def section_head(c, y, t):
    c.setFillColor(CHAMP); c.setFont('Helvetica-Bold',7)
    c.drawString(MARGIN, y, t)
    c.setStrokeColor(CHAMP2); c.setLineWidth(0.3)
    c.line(MARGIN, y-2*mm, W-MARGIN, y-2*mm)

# ── PAGE 1: COVER ─────────────────────────────────────────────────────────────
def page_cover(c):
    page_bg(c)
    # Top champagne bar
    c.setFillColor(CHAMP); c.rect(0,H-1.2*mm,W,1.2*mm,fill=1,stroke=0)

    # XSCACE in MagmaWave
    draw_magma_text(c, 'XSCACE', MARGIN, H-18*mm, 16, CHAMP)

    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN, H-27*mm, 'SIZE DEFYING SOUND')

    # Product name in MagmaWave
    draw_magma_text(c, PRODUCT['name'], MARGIN, H-62*mm, 36, TEXT)

    c.setFillColor(MUTED); c.setFont('Helvetica',10)
    c.drawString(MARGIN, H-79*mm, PRODUCT['full_name'])
    hline(c, H-84*mm)

    # Description word-wrap
    c.setFillColor(TEXT); c.setFont('Helvetica',8.5)
    words = PRODUCT['description'].split()
    line_words, lines = [], []
    for w in words:
        t = ' '.join(line_words+[w])
        if c.stringWidth(t,'Helvetica',8.5) > COL: lines.append(' '.join(line_words)); line_words=[w]
        else: line_words.append(w)
    if line_words: lines.append(' '.join(line_words))
    dy = H-94*mm
    for ln in lines: c.drawString(MARGIN, dy, ln); dy -= 5*mm

    # Key spec tiles 4×2
    ky = H-134*mm
    specs = [('Power RMS',f"{PRODUCT['power_rms']}W"),('Power Peak',f"{PRODUCT['power_peak']}W"),
             ('Impedance',f"{PRODUCT['impedance']}\u03a9"),('Sensitivity',f"{PRODUCT['sensitivity']}dB"),
             ('Max SPL',f"{PRODUCT['spl_max']}dB"),('IP Rating',PRODUCT['ip']),
             ('Weight',f"{PRODUCT['weight']}kg"),('Freq Range',f"{PRODUCT['freq_low']}Hz\u2013{PRODUCT['freq_high']//1000}kHz")]
    cw2 = COL/4
    for i,(la,va) in enumerate(specs):
        col = i%4; row = i//4
        cx = MARGIN + col*cw2; cy = ky - row*22*mm
        c.setFillColor(BORDER)
        c.rect(cx, cy-14*mm, cw2-3*mm, 17*mm, fill=1, stroke=0)
        c.setStrokeColor(CHAMP); c.setLineWidth(0.4)
        c.line(cx, cy+2*mm, cx+cw2-3*mm, cy+2*mm)
        c.setFillColor(CHAMP); c.setFont('Helvetica-Bold',13)
        c.drawString(cx+3*mm, cy-6*mm, va)
        c.setFillColor(MUTED); c.setFont('Helvetica',6.5)
        c.drawString(cx+3*mm, cy-12*mm, la.upper())

    sy = ky-52*mm; hline(c, sy)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN, sy-6*mm, f'SKU  {PRODUCT["sku"]}   ·   {PRODUCT["series"]}   ·   Since {PRODUCT["year"]}')
    c.setFillColor(CHAMP); c.rect(0,0,W,3.5*mm,fill=1,stroke=0)
    footer(c,1)

# ── PAGE 2: SPECIFICATIONS ────────────────────────────────────────────────────
def page_specs(c):
    page_bg(c)
    yt = H-18*mm
    c.setFillColor(TEXT); c.setFont('Helvetica-Bold',18)
    c.drawString(MARGIN, yt, 'Technical Specifications')
    hline(c, yt-5*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN, yt-11*mm, f'{PRODUCT["confidence"].upper()}  ·  {PRODUCT["full_name"].upper()}')

    rh = 10*mm; y = yt-22*mm
    section_head(c, y, 'ACOUSTIC'); y -= 6*mm
    for l1,v1,l2,v2 in [
        ('Power RMS',f"{PRODUCT['power_rms']} W",'Power Peak',f"{PRODUCT['power_peak']} W"),
        ('Impedance',f"{PRODUCT['impedance']} \u03a9",'Sensitivity',f"{PRODUCT['sensitivity']} dB"),
        ('Frequency',f"{PRODUCT['freq_low']} Hz – {PRODUCT['freq_high']//1000} kHz {PRODUCT['freq_qual']}",'Max SPL',f"{PRODUCT['spl_max']} dB"),
        ('Drivers',PRODUCT['drivers'],'Crossover',PRODUCT['crossover']),
        ('Rec. Crossover',f"{PRODUCT['xover_hz']} Hz",'THD+N',PRODUCT['thd_n']),
        ('Directivity H',f"{PRODUCT['dir_h']}\u00b0",'Directivity V',f"{PRODUCT['dir_v']}\u00b0"),
    ]: row2(c,y,l1,v1,l2,v2,rh); y -= rh+1*mm

    y -= 5*mm; section_head(c, y, 'PHYSICAL'); y -= 6*mm
    for l1,v1,l2,v2 in [
        ('Height',f"{PRODUCT['height']} mm",'Width',f"{PRODUCT['width']} mm"),
        ('Depth',f"{PRODUCT['depth']} mm",'Weight',f"{PRODUCT['weight']} kg"),
        ('Housing',PRODUCT['housing'],'Grille',PRODUCT['grille']),
        ('IP Rating',PRODUCT['ip'],'Mounting',PRODUCT['mounting']),
        ('Connector',PRODUCT['connector'],'Wire Gauge',PRODUCT['wire']),
    ]: row2(c,y,l1,v1,l2,v2,rh); y -= rh+1*mm
    footer(c,2)

# ── PAGE 3: FREQUENCY RESPONSE ────────────────────────────────────────────────
def page_freq(c):
    page_bg(c)
    yt = H-18*mm
    c.setFillColor(TEXT); c.setFont('Helvetica-Bold',18); c.drawString(MARGIN,yt,'Frequency Response & Impedance')
    hline(c, yt-5*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN,yt-11*mm,
        f'{PRODUCT["freq_low"]} Hz \u2013 {PRODUCT["freq_high"]//1000} kHz  {PRODUCT["freq_qual"]}  \u00b7  On-axis, 1W / 1m, anechoic  \u00b7  1/12-octave smoothed')
    img_w = COL
    img_h = img_w * (6.4/7.2)
    c.drawImage(os.path.join(_SCRIPT_DIR, 'chart_fr.png'), MARGIN, yt-20*mm-img_h,
                width=img_w, height=img_h)
    c.setFillColor(MUTED); c.setFont('Helvetica',6.5)
    c.drawString(MARGIN, yt-27*mm-img_h,
        'Impedance: free-air model \u00b7 Re 6.4 \u03a9 \u00b7 Fs 158 Hz \u00b7 minimum 6.9 \u03a9 \u2014 a benign load for any 8 \u03a9-rated amplifier.')
    footer(c,3)

# ── PAGE 4: POLAR PLOT ─────────────────────────────────────────────────────────
def page_polar(c):
    page_bg(c)
    yt = H-18*mm
    c.setFillColor(TEXT); c.setFont('Helvetica-Bold',18); c.drawString(MARGIN,yt,'Directivity')
    hline(c, yt-5*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN, yt-11*mm,
        f'Normalised polar response, 0 dB = on-axis  \u00b7  H {PRODUCT["dir_h"]}\u00b0 / V {PRODUCT["dir_v"]}\u00b0 (\u22126 dB @ 1 kHz)  \u00b7  4 \u00d7 1.25" line source')
    img_w = COL
    img_h = img_w * (7.8/7.2)
    c.drawImage(os.path.join(_SCRIPT_DIR, 'chart_polar.png'), MARGIN, yt-17*mm-img_h,
                width=img_w, height=img_h)
    c.setFillColor(MUTED); c.setFont('Helvetica',6.5)
    c.drawString(MARGIN, yt-23*mm-img_h,
        'Vertical plane shows the characteristic line-source sidelobe structure (first sidelobe \u221213 dB). Wide horizontal coverage holds to 4 kHz.')
    footer(c,4)

# ── PAGE 5: SPL THROW ─────────────────────────────────────────────────────────
def page_spl(c):
    page_bg(c)
    yt = H-18*mm
    c.setFillColor(TEXT); c.setFont('Helvetica-Bold',18); c.drawString(MARGIN,yt,'SPL vs Distance')
    hline(c, yt-5*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN,yt-11*mm,
        f'Inverse square law  ·  Ref: {PRODUCT["sensitivity"]} dB @ 1m/1W  ·  Max: {PRODUCT["power_peak"]}W')

    cx,cy,cw,ch = MARGIN, 90*mm, COL, 140*mm
    c.setFillColor(HexColor('#0e0e0d')); c.rect(cx,cy,cw,ch,fill=1,stroke=0)
    smin,smax = 65,115
    def dx(d): return cx+math.log10(d)/math.log10(20)*cw
    def sy2(s): return cy+(s-smin)/(smax-smin)*ch

    for db in range(smin,smax+1,5):
        gy=sy2(db); lw=0.5 if db%10==0 else 0.25
        c.setStrokeColor(BORDER); c.setLineWidth(lw); c.line(cx,gy,cx+cw,gy)
        if db%10==0:
            c.setFillColor(MUTED); c.setFont('Helvetica',6); c.drawRightString(cx-2*mm,gy-2,str(db))

    for d in [1,2,3,4,5,6,8,10,12,15,20]:
        gx=dx(d); c.setStrokeColor(BORDER); c.setLineWidth(0.25); c.line(gx,cy,gx,cy+ch)
        c.setFillColor(MUTED); c.setFont('Helvetica',6.5); c.drawCentredString(gx,cy-5*mm,f'{d}m')

    def spl_curve(pw, col, lw, dash=None):
        pts=[]
        for i in range(300):
            d=10**(i/299*math.log10(20))
            s=PRODUCT['sensitivity']+10*math.log10(pw)-20*math.log10(d)
            pts.append((dx(d),sy2(s)))
        if dash: c.setDash(*dash)
        c.setStrokeColor(col); c.setLineWidth(lw)
        path=c.beginPath(); path.moveTo(pts[0][0],max(cy,min(cy+ch,pts[0][1])))
        for px,py in pts[1:]: path.lineTo(px,max(cy,min(cy+ch,py)))
        c.drawPath(path,fill=0,stroke=1); c.setDash()

    spl_curve(1, HexColor('#2a2010'), 0.8, (4,3))
    spl_curve(PRODUCT['power_rms'], CHAMP, 1.5)
    spl_curve(PRODUCT['power_peak'], HexColor('#dfc060'), 1.0, (5,2))

    for thr,lbl_t,col in [(85,'85 dB  Speech intelligibility',HexColor('#1e3a14')),
                           (70,'70 dB  Background music',HexColor('#122a38'))]:
        gy=sy2(thr)
        if cy<gy<cy+ch:
            c.setStrokeColor(col); c.setLineWidth(0.5); c.setDash(4,4)
            c.line(cx,gy,cx+cw,gy); c.setDash()
            c.setFillColor(col); c.setFont('Helvetica',6.5); c.drawString(cx+2*mm,gy+1.5*mm,lbl_t)

    c.setStrokeColor(BORDER); c.setLineWidth(0.5); c.rect(cx,cy,cw,ch,fill=0,stroke=1)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawCentredString(cx+cw/2, cy-11*mm,'Distance (m)')
    c.saveState(); c.translate(cx-10*mm,cy+ch/2); c.rotate(90)
    c.drawCentredString(0,0,'SPL (dB)'); c.restoreState()

    lx,ly = MARGIN, cy-20*mm
    for col,dash,lbl_t in [(CHAMP,None,f'RMS ({PRODUCT["power_rms"]}W)'),
                           (HexColor('#dfc060'),(5,2),f'Peak ({PRODUCT["power_peak"]}W)'),
                           (HexColor('#2a2010'),(4,3),'1W Reference')]:
        c.setStrokeColor(col); c.setLineWidth(1.4)
        if dash: c.setDash(*dash)
        c.line(lx,ly,lx+12*mm,ly); c.setDash()
        c.setFillColor(TEXT); c.setFont('Helvetica',7)
        c.drawString(lx+15*mm,ly-2,lbl_t); lx+=58*mm
    footer(c,5)

# ── PAGE 6: EQ PROFILE ─────────────────────────────────────────────────────────
def page_eq(c):
    page_bg(c)
    yt = H-18*mm
    c.setFillColor(TEXT); c.setFont('Helvetica-Bold',18); c.drawString(MARGIN,yt,'EQ & Filter Profile')
    hline(c, yt-5*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN,yt-11*mm,
        f'Profile: {PRODUCT["eq_profile"]}  \u00b7  RBJ biquad cascade evaluated at fs = 48 kHz (ADAU1701)  \u00b7  Recommended DSP preset')
    img_w = COL
    img_h = img_w * (4.4/7.2)
    img_y = yt-18*mm-img_h
    c.drawImage(os.path.join(_SCRIPT_DIR, 'chart_eq.png'), MARGIN, img_y,
                width=img_w, height=img_h)

    ty = img_y - 14*mm
    section_head(c, ty, 'APPLIED FILTERS'); ty -= 7*mm
    cols_x=[MARGIN, MARGIN+14*mm, MARGIN+42*mm, MARGIN+70*mm, MARGIN+94*mm, MARGIN+120*mm]
    for i,h in enumerate(['#','Type','Frequency','Gain','Q / Slope','Function']):
        c.setFillColor(MUTED); c.setFont('Helvetica-Bold',6.5); c.drawString(cols_x[i],ty,h.upper())
    ty -= 2.5*mm; c.setStrokeColor(BORDER); c.setLineWidth(0.3); c.line(MARGIN,ty,W-MARGIN,ty); ty -= 5.5*mm

    rows = [
        ('1','Low Shelf','250 Hz','+3.0 dB','S = 1.0','Restores warmth lost to slim-enclosure loading'),
        ('2','Low Shelf','770 Hz','\u22123.0 dB','S = 1.0','Tames lower-mid build-up of the 4-driver sum'),
        ('3','High Shelf','3 kHz','\u22123.0 dB','S = 1.0','Counteracts on-axis HF beaming of the array'),
        ('4','High-Pass','200 Hz','\u2014','Q = 0.7','Excursion protection \u00b7 12 dB/oct Butterworth'),
    ]
    for idx,row in enumerate(rows):
        if idx%2==0:
            c.setFillColor(MID); c.rect(MARGIN,ty-2*mm,COL,7.5*mm,fill=1,stroke=0)
        c.setFillColor(TEXT); c.setFont('Helvetica',7.5)
        for xi,txt in zip(cols_x,row):
            c.drawString(xi,ty+0.5*mm,txt)
        ty -= 8.5*mm

    ty -= 3*mm
    c.setFillColor(MUTED); c.setFont('Helvetica',6.5)
    c.drawString(MARGIN, ty,
        'Coefficients per the Audio EQ Cookbook (RBJ). Apply via XSCACE Controller or any DSP supporting standard biquads.')
    footer(c,6)

# ── PAGE 7: PROPRIETARY TECHNOLOGIES ─────────────────────────────────────────
def page_tech(c):
    page_bg(c)
    yt = H-18*mm
    c.setFillColor(TEXT); c.setFont('Helvetica-Bold',18)
    c.drawString(MARGIN,yt,'Proprietary Technologies')
    hline(c, yt-5*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(MARGIN,yt-11*mm,'Exclusive engineering innovations inside every XSCACE product.')

    techs = [
        ('NR','Nano\nResonance',
         'By engineering an intentionally heavy cone mass, Nano Resonance forces the system\'s '
         'natural resonant frequency (Fs) well below the target passband. This counters Hoffman\'s Iron Law — '
         'the trade-off between bass extension, enclosure size, and efficiency — allowing genuine low-frequency '
         'extension from an enclosure only 12–23mm deep. The result is bass that defies the physics of its cabinet.'),
        ('PD','PowerDense\nDynamics',
         'The voice coil is wound with a copper-silver composite conductor — copper for electrical conductivity, '
         'silver for reduced skin effect at high frequencies. This allows the coil to handle significantly higher '
         'continuous power in the same former diameter, raising the thermal ceiling without increasing coil mass '
         'or inductance. More power in, less distortion out.'),
        ('AF','AeroFrame\nChassis',
         '6061 aerospace-grade aluminium is machined to form the speaker\'s structural chassis. Beyond providing '
         'rigidity under excursion, the chassis acts as a passive heatsink — drawing heat away from the voice coil '
         'through direct thermal coupling to the body. In outdoor and high-SPL scenarios, this eliminates thermal '
         'compression without fans or active cooling.'),
        ('PX','PrecisionXover\nArray',
         'Each crossover network is assembled with air-core inductors (no ferrous saturation), polypropylene '
         'film capacitors (low ESR, stable across temperature), and metal-film resistors. Component matching is '
         'held to ±0.5 dB. At this tolerance, channel-to-channel variation is inaudible in stereo and '
         'near-field arrays — critical for Cane\'s four-driver line array configuration.'),
        ('XF','XS-Flow',
         'Micro-waveguide geometry is precision-machined into the internal face of each enclosure. In a 12mm '
         'depth, there is virtually no room for standing waves — but without management, internal reflections '
         'and turbulence create coloration above 2kHz. XS-Flow channels the rearward acoustic wave around the '
         'magnet structure and out through the terminal plate, reducing compression and harmonic distortion '
         'at high excursion.'),
        ('PS','PsySculpt',
         'Built on the ADAU1701 DSP, PsySculpt implements a psychoacoustically aware EQ curve based on '
         'Fletcher-Munson equal-loudness contours. At low listening levels the human ear perceives bass and '
         'treble as relatively quieter. PsySculpt applies a dynamic pre-compensation curve — boosting low and '
         'high frequencies proportionally as volume decreases — so tonal balance stays consistent from '
         'background listening levels to concert SPL.'),
    ]

    icon_size = 11*mm
    y = yt - 26*mm
    row_h = (y - 20*mm) / len(techs)

    for abbr, name, desc in techs:
        # Icon circle
        c.setFillColor(MID); c.circle(MARGIN+icon_size/2, y-icon_size/2+3*mm, icon_size/2, fill=1, stroke=0)
        c.setStrokeColor(CHAMP); c.setLineWidth(0.4)
        c.circle(MARGIN+icon_size/2, y-icon_size/2+3*mm, icon_size/2, fill=0, stroke=1)
        c.setFillColor(CHAMP); c.setFont('Helvetica-Bold',7)
        c.drawCentredString(MARGIN+icon_size/2, y-icon_size/2+1.5*mm, abbr)

        # Name
        tx = MARGIN + icon_size + 5*mm
        name_lines = name.split('\n')
        c.setFillColor(TEXT); c.setFont('Helvetica-Bold',10)
        c.drawString(tx, y+1*mm, name_lines[0])
        if len(name_lines)>1:
            c.setFillColor(CHAMP); c.setFont('Helvetica-Bold',10)
            c.drawString(tx + c.stringWidth(name_lines[0],'Helvetica-Bold',10)+2, y+1*mm, name_lines[1])
        c.setFillColor(TEXT); c.setFont('Helvetica-Bold',10)

        # Description — word wrap in remaining width
        desc_x = tx + 52*mm
        desc_w = W - MARGIN - desc_x
        c.setFillColor(HexColor('#a8a59f')); c.setFont('Helvetica',7.2)
        words = desc.split(); line_words=[]; dy = y+1.5*mm; line_h=4.5*mm
        for w in words:
            t=' '.join(line_words+[w])
            if c.stringWidth(t,'Helvetica',7.2)>desc_w:
                if line_words: c.drawString(desc_x,dy,' '.join(line_words)); dy-=line_h
                line_words=[w]
            else: line_words.append(w)
        if line_words: c.drawString(desc_x,dy,' '.join(line_words))

        # Separator
        sep_y = y - row_h + 4*mm
        c.setStrokeColor(BORDER); c.setLineWidth(0.25)
        c.line(MARGIN, sep_y, W-MARGIN, sep_y)
        y -= row_h

    footer(c,7)

# ── BUILD ─────────────────────────────────────────────────────────────────────
out = _args.out if _args.out else '/mnt/user-data/outputs/xscace/cane_specsheet.pdf'
cv = canvas.Canvas(out, pagesize=A4)
cv.setTitle(f'{PRODUCT["full_name"]} — Technical Specification Sheet')
cv.setAuthor('XSCACE'); cv.setSubject('Speaker Specification Sheet')

page_cover(cv);  cv.showPage()
page_specs(cv);  cv.showPage()
page_freq(cv);   cv.showPage()
page_polar(cv);  cv.showPage()
page_spl(cv);    cv.showPage()
page_eq(cv);     cv.showPage()
page_tech(cv);   cv.showPage()

cv.save()
print(f'Done: {out}')
