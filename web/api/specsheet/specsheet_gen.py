"""XSCACE Spec Sheet Generator v3 — clean rewrite
Usage:
  python3 specsheet_gen.py --product data.json --out out.pdf
"""
import math, sys, os, argparse, json

sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')

# ── Args ───────────────────────────────────────────────────────────────────────
ap = argparse.ArgumentParser()
ap.add_argument('--product', default=None)
ap.add_argument('--out',     default='specsheet.pdf')
ARGS = ap.parse_args()

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Paths ──────────────────────────────────────────────────────────────────────
# _SD = directory this script lives in (NOT the temp chart dir)
_SD = os.path.dirname(os.path.abspath(__file__))
# Charts are in the temp dir passed via env
_CD = os.environ.get('XSCACE_CHART_DIR', _SD)
# public/ for tech icons — on Vercel: /var/task/public
_PUBLIC = '/var/task/public'
if not os.path.isdir(_PUBLIC):
    d = _SD
    for _ in range(6):
        t = os.path.join(d, 'public')
        if os.path.isdir(t): _PUBLIC = t; break
        d = os.path.dirname(d)

print(f'[gen] _SD={_SD} _CD={_CD} _PUBLIC={_PUBLIC}', file=sys.stderr)

# ── Font registration ──────────────────────────────────────────────────────────
_LOADED = set()
def _reg(alias, fname):
    for d in [_SD, os.path.join(_SD, 'fonts'), '/var/task/api/specsheet/fonts']:
        p = os.path.join(d, fname)
        if os.path.isfile(p):
            try:
                pdfmetrics.registerFont(TTFont(alias, p))
                _LOADED.add(alias)
                print(f'[gen] font OK: {alias} from {p}', file=sys.stderr)
                return
            except Exception as e:
                print(f'[gen] font FAIL: {alias} {e}', file=sys.stderr)
    print(f'[gen] font MISSING: {alias} ({fname})', file=sys.stderr)

_reg('Cor',  'Cormorant-Light.ttf')
_reg('CorSB','Cormorant-SemiBold.ttf')
_reg('CorI', 'Cormorant-Italic.ttf')
_reg('DMS',  'DMSans-Reg.ttf')
_reg('DMSB', 'DMSans-Bold.ttf')
_reg('DMM',  'DMMono-Regular.ttf')
_reg('DMMM', 'DMMono-Medium.ttf')

# MagmaWave
_MW = None
for d in [_SD, os.path.join(_SD,'fonts'), '/var/task/api/specsheet/fonts', '/var/task/public/fonts']:
    p = os.path.join(d, 'MagmaWave.otf')
    if os.path.isfile(p):
        try: pdfmetrics.registerFont(TTFont('MW', p)); _LOADED.add('MW'); _MW = p; break
        except: pass

print(f'[gen] loaded fonts: {sorted(_LOADED)}', file=sys.stderr)

def F(a):  return a if a in _LOADED else 'Helvetica'
def FB(a): return a if a in _LOADED else 'Helvetica-Bold'
def FI(a): return a if a in _LOADED else 'Helvetica-Oblique'

# ── Tech icons ─────────────────────────────────────────────────────────────────
_ICON_MAP = {
    'psysculpt':            'psysculpt.png',
    'xs-flow':              'xs-flow.png',
    'nano resonance':       'nano-resonance.png',
    'precisionxover array': 'precisionxover-array.png',
    'aeroframe chassis':    'aeroframe-chassis.png',
    'powerdense dynamics':  'powerdense-dynamics.png',
}
def icon_path(badge):
    k = badge.lower().replace('™','').replace('  ',' ').strip()
    for key, fname in _ICON_MAP.items():
        if key in k or k.split()[0] in key:
            p = os.path.join(_PUBLIC, 'tech-icons', fname)
            if os.path.isfile(p):
                print(f'[gen] icon OK: {badge} -> {p}', file=sys.stderr)
                return p
            else:
                print(f'[gen] icon MISSING: {p}', file=sys.stderr)
    return None

# ── Colors / layout ────────────────────────────────────────────────────────────
W, H   = A4
BG     = HexColor('#090909')
CHAMP  = HexColor('#c9a96e')
CHAMP2 = HexColor('#8a6d3f')
TEXT   = HexColor('#eeebe5')
MUTED  = HexColor('#6b6760')
BORDER = HexColor('#1f1e1c')
MID    = HexColor('#151413')
MARGIN = 18*mm
COL    = W - 2*MARGIN

# ── Product data ───────────────────────────────────────────────────────────────
PRODUCT = {
    'name':'Cane','full_name':'Cane Slim Array Speaker',
    'tagline':'Slim Array Speaker','sku':'XSP-SA-CAN','series':'Slim Array Series',
    'year':2022,'description':'',
    'power_rms':50,'power_peak':60,'impedance':8,'sensitivity':92,
    'freq_low':150,'freq_high':20000,'freq_qual':'±3dB',
    'drivers':'4 × 1.25in Neodymium','crossover':'Built-In Passive','xover_hz':200,
    'spl_max':110,'thd_n':'<=0.08%','dir_h':140,'dir_v':25,
    'height':183.5,'width':43,'depth':23,'weight':0.2,
    'housing':'Aerospace Aluminium','grille':'Mild Steel','ip':'IP66',
    'mounting':'Corner, Floorstand, In-Wall','connector':'Push Terminal',
    'wire':'14 AWG','eq':[],'eq_profile':'Default','confidence':'Lab Verified',
    'proprietaryTechBadges':'PsySculpt, XS-Flow, Nano Resonance, PrecisionXover Array, AeroFrame Chassis, PowerDense Dynamics',
}

if ARGS.product:
    with open(ARGS.product) as f: _d = json.load(f)
    _eq = []
    for line in (_d.get('eqData') or '').strip().split('\n')[1:]:
        p = line.strip().split(',')
        if len(p) < 2: continue
        if p[0] in ('HP','LP'):
            _eq.append({'freq':float(p[1]),'gain':None,'type':p[0],'q':float(p[2]) if len(p)>2 else 0.7,'label':p[0]})
        else:
            _eq.append({'freq':float(p[0]),'gain':float(p[1]),'type':p[2] if len(p)>2 else 'PK',
                        'q':float(p[3]) if len(p)>3 else 1.0,'label':'EQ'})
    PRODUCT = {
        'name':         _d.get('productName',''),
        'full_name':    _d.get('productFullName', _d.get('productName','')),
        'tagline':      _d.get('tagline',''),
        'sku':          _d.get('skuBase',''),
        'series':       _d.get('series',''),
        'year':         _d.get('launchYear',2022),
        'description':  '',
        'power_rms':    _d.get('powerRmsW',0) or 0,
        'power_peak':   _d.get('powerPeakW',0) or 0,
        'impedance':    _d.get('impedanceOhms',8) or 8,
        'sensitivity':  _d.get('sensitivityDb',90) or 90,
        'freq_low':     _d.get('freqLowHz',80) or 80,
        'freq_high':    _d.get('freqHighHz',20000) or 20000,
        'freq_qual':    _d.get('freqQualifier','±3dB') or '±3dB',
        'drivers':      _d.get('driverDescription','') or '',
        'crossover':    _d.get('crossoverType','') or '',
        'xover_hz':     _d.get('recommendedCrossoverHz',80) or 80,
        'spl_max':      _d.get('splMaxDb') or round((_d.get('sensitivityDb') or 90)+10*math.log10(max(_d.get('powerPeakW') or 1,1))),
        'thd_n':        _d.get('thdN','') or '',
        'dir_h':        _d.get('directivityHDeg',140) or 140,
        'dir_v':        _d.get('directivityVDeg',25) or 25,
        'height':       _d.get('heightMm',0) or 0,
        'width':        _d.get('widthMm',0) or 0,
        'depth':        _d.get('depthMm',0) or 0,
        'weight':       _d.get('weightKg',0) or 0,
        'housing':      _d.get('housingMaterial','') or '',
        'grille':       _d.get('grilleMaterial','') or '',
        'ip':           _d.get('ipRating','') or '',
        'mounting':     _d.get('mountingMethods','') or '',
        'connector':    _d.get('speakerWireConnector','') or '',
        'wire':         _d.get('wireGaugeRecommended','') or '',
        'eq':           _eq,
        'eq_profile':   _d.get('eqProfileName','Default') or 'Default',
        'confidence':   _d.get('specConfidence','Lab Verified') or 'Lab Verified',
        'proprietaryTechBadges': _d.get('proprietaryTechBadges','') or '',
    }

# ── Helpers ────────────────────────────────────────────────────────────────────
def page_bg(c): c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)
def hline(c,y,color=CHAMP,lw=0.5):
    c.setStrokeColor(color); c.setLineWidth(lw); c.line(MARGIN,y,W-MARGIN,y)

def footer(c,n,total=7):
    y=11*mm
    c.setStrokeColor(BORDER); c.setLineWidth(0.4); c.line(MARGIN,y+4*mm,W-MARGIN,y+4*mm)
    c.setFillColor(MUTED); c.setFont(F('DMM'),6.5)
    c.drawString(MARGIN,y,'XSCACE  ·  xscace.com')
    c.drawCentredString(W/2,y,PRODUCT['full_name'].upper())
    c.drawRightString(W-MARGIN,y,f'{n} / {total}')

def lbl(c,x,y,t,sz=6.5,col=MUTED):
    c.setFillColor(col); c.setFont(F('DMM'),sz); c.drawString(x,y,t.upper())

def val(c,x,y,t,sz=9,col=TEXT):
    c.setFillColor(col); c.setFont(FB('DMSB'),sz); c.drawString(x,y,t)

def row2(c,y,l1,v1,l2,v2,rh=9.5*mm):
    half=COL/2
    for xi,la,va in [(MARGIN,l1,v1),(MARGIN+half,l2,v2)]:
        c.setFillColor(MID); c.rect(xi,y-2*mm,half-2*mm,rh,fill=1,stroke=0)
        lbl(c,xi+3*mm,y+1.5*mm,la,6.5)
        val(c,xi+3*mm,y+5*mm,va,8.5)

def section_head(c,y,t):
    c.setFillColor(CHAMP); c.setFont(FB('DMSB'),7); c.drawString(MARGIN,y,t)
    c.setStrokeColor(CHAMP2); c.setLineWidth(0.3); c.line(MARGIN,y-2*mm,W-MARGIN,y-2*mm)

def draw_mw(c,text,x,y,size,color):
    c.setFillColor(color)
    c.setFont(F('MW') if 'MW' in _LOADED else FB('DMSB'), size)
    c.drawString(x,y,text)

# ── PAGE 1: COVER ──────────────────────────────────────────────────────────────
def page_cover(c):
    page_bg(c)
    c.setFillColor(CHAMP); c.rect(0,H-1.2*mm,W,1.2*mm,fill=1,stroke=0)
    draw_mw(c,'XSCACE',MARGIN,H-18*mm,16,CHAMP)
    c.setFillColor(MUTED); c.setFont(F('DMM'),7); c.drawString(MARGIN,H-27*mm,'SIZE DEFYING SOUND')
    draw_mw(c,PRODUCT['name'],MARGIN,H-62*mm,36,TEXT)
    c.setFillColor(MUTED); c.setFont(F('DMS'),10); c.drawString(MARGIN,H-79*mm,PRODUCT['full_name'])
    hline(c,H-84*mm)
    ky=H-134*mm
    specs=[('Power RMS',f"{PRODUCT['power_rms']}W"),('Power Peak',f"{PRODUCT['power_peak']}W"),
           ('Impedance',f"{PRODUCT['impedance']}Ohm"),('Sensitivity',f"{PRODUCT['sensitivity']}dB"),
           ('Max SPL',f"{PRODUCT['spl_max']}dB"),('IP Rating',PRODUCT['ip']),
           ('Weight',f"{PRODUCT['weight']}kg"),('Freq Range',f"{PRODUCT['freq_low']}Hz-{PRODUCT['freq_high']//1000}kHz")]
    cw2=COL/4
    for i,(la,va) in enumerate(specs):
        col=i%4; row=i//4
        cx=MARGIN+col*cw2; cy=ky-row*22*mm
        c.setFillColor(BORDER); c.rect(cx,cy-14*mm,cw2-2*mm,18*mm,fill=1,stroke=0)
        lbl(c,cx+2*mm,cy-10*mm,la,6)
        c.setFillColor(CHAMP); c.setFont(F('Cor'),13); c.drawString(cx+2*mm,cy-2*mm,va)
    c.setFillColor(MUTED); c.setFont(F('DMM'),7)
    c.drawString(MARGIN,H-168*mm,f'SKU  {PRODUCT["sku"]}   ·   {PRODUCT["series"]}   ·   Since {PRODUCT["year"]}')
    footer(c,1)

# ── PAGE 2: SPECS ──────────────────────────────────────────────────────────────
def page_specs(c):
    page_bg(c)
    yt=H-18*mm
    c.setFillColor(TEXT); c.setFont(F('Cor'),22); c.drawString(MARGIN,yt,PRODUCT['confidence'].upper()+'  ·  '+PRODUCT['full_name'].upper())
    hline(c,yt-5*mm)
    rows=[
        ('Power RMS',f"{PRODUCT['power_rms']} W",'Power Peak',f"{PRODUCT['power_peak']} W"),
        ('Impedance',f"{PRODUCT['impedance']} Ohm",'Sensitivity',f"{PRODUCT['sensitivity']} dB"),
        ('Frequency',f"{PRODUCT['freq_low']} Hz - {PRODUCT['freq_high']//1000} kHz {PRODUCT['freq_qual']}",'Max SPL',f"{PRODUCT['spl_max']} dB"),
        ('Drivers',PRODUCT['drivers'],'Crossover',PRODUCT['crossover']),
        ('Rec. Crossover',f"{PRODUCT['xover_hz']} Hz",'THD+N',PRODUCT['thd_n']),
        ('Directivity H',f"{PRODUCT['dir_h']} deg",'Directivity V',f"{PRODUCT['dir_v']} deg"),
    ]
    y=yt-18*mm
    for l1,v1,l2,v2 in rows: row2(c,y,l1,v1,l2,v2); y-=12*mm
    section_head(c,y-4*mm,'Physical')
    y-=10*mm
    rows2=[
        ('Height',f"{PRODUCT['height']} mm",'Width',f"{PRODUCT['width']} mm"),
        ('Depth',f"{PRODUCT['depth']} mm",'Weight',f"{PRODUCT['weight']} kg"),
        ('Housing',PRODUCT['housing'],'Grille',PRODUCT['grille']),
        ('IP Rating',PRODUCT['ip'],'Mounting',PRODUCT['mounting']),
        ('Connector',PRODUCT['connector'],'Wire Gauge',PRODUCT['wire']),
    ]
    for l1,v1,l2,v2 in rows2: row2(c,y,l1,v1,l2,v2); y-=12*mm
    footer(c,2)

# ── PAGE 3: FREQ RESPONSE ─────────────────────────────────────────────────────
def page_freq(c):
    page_bg(c)
    yt=H-18*mm
    c.setFillColor(TEXT); c.setFont(FB('DMSB'),18); c.drawString(MARGIN,yt,'Frequency Response & Impedance')
    hline(c,yt-5*mm)
    c.setFillColor(MUTED); c.setFont(F('DMM'),7)
    c.drawString(MARGIN,yt-11*mm,f"{PRODUCT['freq_low']} Hz - {PRODUCT['freq_high']//1000} kHz  {PRODUCT['freq_qual']}  On-axis, 1W / 1m, anechoic")
    img_h=H-2*MARGIN-40*mm
    cp=os.path.join(_CD,'chart_fr.png')
    if os.path.isfile(cp):
        c.drawImage(cp,MARGIN,yt-20*mm-img_h,width=COL,height=img_h,preserveAspectRatio=True)
    footer(c,3)

# ── PAGE 4: DIRECTIVITY ────────────────────────────────────────────────────────
def page_polar(c):
    page_bg(c)
    yt=H-18*mm
    c.setFillColor(TEXT); c.setFont(FB('DMSB'),18); c.drawString(MARGIN,yt,'Directivity')
    hline(c,yt-5*mm)
    c.setFillColor(MUTED); c.setFont(F('DMM'),7)
    c.drawString(MARGIN,yt-11*mm,f"H {PRODUCT['dir_h']} deg / V {PRODUCT['dir_v']} deg (-6 dB @ 1 kHz)")
    img_h=H-2*MARGIN-40*mm
    cp=os.path.join(_CD,'chart_polar.png')
    if os.path.isfile(cp):
        c.drawImage(cp,MARGIN,yt-20*mm-img_h,width=COL,height=img_h,preserveAspectRatio=True)
    footer(c,4)

# ── PAGE 5: SPL vs DISTANCE ────────────────────────────────────────────────────
def page_spl(c):
    page_bg(c)
    yt=H-18*mm
    c.setFillColor(TEXT); c.setFont(FB('DMSB'),18); c.drawString(MARGIN,yt,'SPL vs Distance')
    hline(c,yt-5*mm)
    c.setFillColor(MUTED); c.setFont(F('DMM'),7)
    c.drawString(MARGIN,yt-11*mm,f"Inverse square law  Ref: {PRODUCT['sensitivity']} dB @ 1m/1W  Max: {PRODUCT['power_peak']}W")
    # Draw simplified SPL chart inline (no chart_spl.png — compute inline)
    gx,gy=MARGIN,yt-30*mm; gw,gh=COL,H-yt-50*mm
    c.setFillColor(MID); c.rect(gx,gy-gh,gw,gh,fill=1,stroke=0)
    c.setStrokeColor(BORDER); c.setLineWidth(0.3)
    for db in [60,70,80,90,100,110]:
        ry=gy-gh+(db-50)/80*gh
        c.line(gx,ry,gx+gw,ry)
        c.setFillColor(MUTED); c.setFont(F('DMM'),6); c.drawRightString(gx-2,ry-2,str(db))
    dists=[1,2,3,4,5,6,8,10,12,15]
    cx=lambda d: gx+math.log10(d)/math.log10(16)*gw
    fy=lambda s: gy-gh+max(0,min(gh,(s-50)/80*gh))
    def spl_line(pwr,col,lw,dash=None):
        pts=[(cx(d),fy(PRODUCT['sensitivity']+10*math.log10(pwr)-20*math.log10(d))) for d in dists]
        c.setStrokeColor(col); c.setLineWidth(lw)
        if dash: c.setDash(*dash)
        p=c.beginPath(); p.moveTo(*pts[0])
        for x,y in pts[1:]: p.lineTo(x,y)
        c.drawPath(p,stroke=1,fill=0); c.setDash()
    spl_line(PRODUCT['power_rms'],CHAMP,1.5)
    spl_line(PRODUCT['power_peak'],HexColor('#dfc060'),1.0,[5,2])
    c.setFillColor(MUTED); c.setFont(F('DMM'),7)
    for i,d in enumerate(dists):
        c.drawCentredString(cx(d),gy-gh-5*mm,f'{d}m')
    footer(c,5)

# ── PAGE 6: EQ ────────────────────────────────────────────────────────────────
def page_eq(c):
    page_bg(c)
    yt=H-18*mm
    c.setFillColor(TEXT); c.setFont(FB('DMSB'),18); c.drawString(MARGIN,yt,'Recommended EQ')
    hline(c,yt-5*mm)
    c.setFillColor(MUTED); c.setFont(F('DMM'),7)
    c.drawString(MARGIN,yt-11*mm,f"Profile: {PRODUCT['eq_profile']}  RBJ biquad cascade  fs=48kHz")
    img_h=H-2*MARGIN-40*mm
    cp=os.path.join(_CD,'chart_eq.png')
    if os.path.isfile(cp):
        c.drawImage(cp,MARGIN,yt-20*mm-img_h,width=COL,height=img_h,preserveAspectRatio=True)
    footer(c,6)

# ── PAGE 7: PROPRIETARY TECH ──────────────────────────────────────────────────
def page_tech(c):
    page_bg(c)
    yt=H-18*mm
    c.setFillColor(TEXT); c.setFont(F('Cor'),22)
    c.drawString(MARGIN,yt,'Proprietary Technologies')
    hline(c,yt-5*mm)
    c.setFillColor(MUTED); c.setFont(F('DMS'),8)
    c.drawString(MARGIN,yt-11*mm,'Exclusive engineering innovations inside every XSCACE product.')

    TECH_DESC = {
        "psysculpt":            ("PsySculpt",            "Built on the ADAU1701 DSP, PsySculpt implements a psychoacoustically aware EQ curve based on Fletcher-Munson equal-loudness contours, applying dynamic pre-compensation so tonal balance stays consistent from background listening levels to concert SPL."),
        "xs-flow":              ("XS-Flow",              "Micro-waveguide geometry is precision-machined into the internal face of each enclosure. XS-Flow channels the rearward acoustic wave around the magnet structure, reducing compression and harmonic distortion at high excursion."),
        "nano resonance":       ("Nano Resonance",       "By engineering an intentionally heavy cone mass, Nano Resonance forces the system natural resonant frequency well below the target passband, allowing genuine low-frequency extension from an enclosure only 12-23mm deep."),
        "precisionxover array": ("PrecisionXover Array", "Each crossover network is assembled with air-core inductors, polypropylene film capacitors and metal-film resistors. Component matching is held to +/-0.5 dB for inaudible channel-to-channel variation."),
        "aeroframe chassis":    ("AeroFrame Chassis",    "6061 aerospace-grade aluminium is machined to form the speaker structural chassis, acting as a passive heatsink that draws heat away from the voice coil through direct thermal coupling."),
        "powerdense dynamics":  ("PowerDense Dynamics",  "The voice coil is wound with a copper-silver composite conductor, allowing significantly higher continuous power in the same former diameter and raising the thermal ceiling without increasing coil mass or inductance."),
    }

    raw = PRODUCT.get('proprietaryTechBadges','') or ''
    badges = [b.strip().replace('  ',' ').strip() for b in raw.split(',') if b.strip()]
    print(f'[gen] tech badges: {badges}', file=sys.stderr)

    IW = 10*mm  # icon width/height
    TX = MARGIN + IW + 4*mm
    TW = COL - IW - 4*mm
    y  = yt - 26*mm

    for badge in badges:
        if y < 20*mm: break
        key = badge.lower().replace('tm','').replace('  ',' ').strip()

        title, desc = badge, ''
        for k,(t,d) in TECH_DESC.items():
            if k in key or (key.split()[0] if key.split() else '') in k:
                title,desc = t,d; break

        # Icon
        ip = icon_path(badge)
        if ip:
            try:
                c.drawImage(ip,MARGIN,y-IW+3*mm,width=IW,height=IW,preserveAspectRatio=True,mask='auto')
            except Exception as e:
                print(f'[gen] icon draw fail: {e}', file=sys.stderr)
                _fallback_circle(c,y,IW)
        else:
            _fallback_circle(c,y,IW)

        # Title
        c.setFillColor(CHAMP); c.setFont(FB('DMSB'),8)
        c.drawString(TX,y,title)

        # Description wrapped
        c.setFillColor(MUTED); c.setFont(F('DMS'),7.5)
        words=desc.split(); line=''; dy=y-5.5*mm
        for w in words:
            t2=(line+' '+w).strip()
            if c.stringWidth(t2,F('DMS'),7.5)<=TW: line=t2
            else:
                if line: c.drawString(TX,dy,line); dy-=4.5*mm
                line=w
        if line: c.drawString(TX,dy,line); dy-=4.5*mm

        y=dy-3*mm
        hline(c,y+1*mm,color=BORDER,lw=0.3)
        y-=3*mm

    footer(c,7)

def _fallback_circle(c,y,IW):
    c.setFillColor(MID)
    c.circle(MARGIN+IW/2,y-IW/2+3*mm,IW/2,fill=1,stroke=0)
    c.setStrokeColor(CHAMP); c.setLineWidth(0.4)
    c.circle(MARGIN+IW/2,y-IW/2+3*mm,IW/2,fill=0,stroke=1)

# ── Render ────────────────────────────────────────────────────────────────────
out=ARGS.out
cv=canvas.Canvas(out,pagesize=A4)
cv.setTitle(f'{PRODUCT["full_name"]} -- Technical Specification Sheet')
cv.setAuthor('XSCACE'); cv.setSubject('Speaker Specification Sheet')

page_cover(cv);  cv.showPage()
page_specs(cv);  cv.showPage()
page_freq(cv);   cv.showPage()
page_polar(cv);  cv.showPage()
page_spl(cv);    cv.showPage()
page_eq(cv);     cv.showPage()
page_tech(cv);   cv.showPage()

cv.save()
print(f'[gen] Done: {out}', file=sys.stderr)
