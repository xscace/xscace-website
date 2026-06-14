"""
charts_slim.py — generates chart PNGs using only numpy + reportlab + Pillow.
No matplotlib or scipy. Renders directly to PNG via reportlab canvas.
Output: chart_fr.png, chart_polar.png, chart_eq.png in XSCACE_CHART_DIR.
"""
import os, sys, math
sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')
import numpy as np
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
import tempfile, io
from PIL import Image

_base = os.environ.get('XSCACE_CHART_DIR', '/tmp')

# ── Colors ────────────────────────────────────────────────────────────────────
BG     = HexColor('#090909')
PANEL  = HexColor('#0e0e0d')
CHAMP  = HexColor('#c9a96e')
CHAMP2 = HexColor('#8a6d3f')
TEXT   = HexColor('#eeebe5')
MUTED  = HexColor('#6b6760')
GRID   = HexColor('#1a1917')
BLUE   = HexColor('#5b8db8')

FS = 48000.0

# ── RBJ biquad (numpy only) ───────────────────────────────────────────────────
def rbj(kind, f0, gain_db=0.0, Q=0.707):
    A  = 10 ** (gain_db / 40.0)
    w0 = 2 * np.pi * f0 / FS
    cw, sw = np.cos(w0), np.sin(w0)
    alpha  = sw / (2 * Q)
    if kind == 'HP':
        b = np.array([(1+cw)/2, -(1+cw), (1+cw)/2])
        a = np.array([1+alpha, -2*cw, 1-alpha])
    elif kind == 'LS':
        s2A = 2*np.sqrt(A)*alpha
        b = np.array([A*((A+1)-(A-1)*cw+s2A), 2*A*((A-1)-(A+1)*cw), A*((A+1)-(A-1)*cw-s2A)])
        a = np.array([(A+1)+(A-1)*cw+s2A, -2*((A-1)+(A+1)*cw), (A+1)+(A-1)*cw-s2A])
    elif kind == 'HS':
        s2A = 2*np.sqrt(A)*alpha
        b = np.array([A*((A+1)+(A-1)*cw+s2A), -2*A*((A-1)+(A+1)*cw), A*((A+1)+(A-1)*cw-s2A)])
        a = np.array([(A+1)-(A-1)*cw+s2A, 2*((A-1)-(A+1)*cw), (A+1)-(A-1)*cw-s2A])
    elif kind == 'PK':
        b = np.array([1+alpha*A, -2*cw, 1-alpha*A])
        a = np.array([1+alpha/A, -2*cw, 1-alpha/A])
    else:
        return np.array([1,0,0]), np.array([1,0,0])
    return b/a[0], a/a[0]

def biquad_db(b, a, freqs):
    w = 2*np.pi*freqs/FS
    c1,c2 = np.cos(w), np.cos(2*w)
    s1,s2 = np.sin(w), np.sin(2*w)
    nR = b[0]+b[1]*c1+b[2]*c2; nI = -b[1]*s1-b[2]*s2
    dR = a[0]+a[1]*c1+a[2]*c2; dI = -a[1]*s1-a[2]*s2
    mag2 = (nR**2+nI**2)/(dR**2+dI**2)
    return 10*np.log10(np.maximum(mag2, 1e-12))

# ── Draw chart to a reportlab canvas, save as PNG via PIL ─────────────────────
def canvas_to_png(fn, width_pt, height_pt, out_path, dpi=150):
    """Render a reportlab canvas drawing function to PNG."""
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(width_pt, height_pt))
    fn(c, width_pt, height_pt)
    c.save()
    buf.seek(0)
    # Convert PDF bytes to PNG via PIL (requires Pillow with PDF support via poppler)
    # Fallback: save as PDF and use pdf2image if available
    try:
        from pdf2image import convert_from_bytes
        imgs = convert_from_bytes(buf.read(), dpi=dpi)
        imgs[0].save(out_path)
    except ImportError:
        # If pdf2image not available, save raw PDF and note it
        with open(out_path.replace('.png','.pdf'), 'wb') as f:
            f.write(buf.getvalue())
        # Create a blank placeholder PNG
        img = Image.new('RGB', (int(width_pt*dpi/72), int(height_pt*dpi/72)), (9,9,9))
        img.save(out_path)

def draw_chart(draw_fn, w, h, path, dpi=150):
    """Draw directly to a PIL image using the drawing function."""
    pw, ph = int(w*dpi/72), int(h*dpi/72)
    img = Image.new('RGB', (pw, ph), (9,9,9))
    draw_fn(img, pw, ph)
    img.save(path)

# ── Pure-PIL chart drawing ────────────────────────────────────────────────────
from PIL import ImageDraw, ImageFont

def pil_chart(img, draw_fn):
    draw = ImageDraw.Draw(img)
    draw_fn(draw, img.width, img.height)

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

CHAMP_RGB  = hex_to_rgb('c9a96e')
CHAMP2_RGB = hex_to_rgb('8a6d3f')
MUTED_RGB  = hex_to_rgb('6b6760')
GRID_RGB   = hex_to_rgb('1a1917')
BLUE_RGB   = hex_to_rgb('5b8db8')
BG_RGB     = hex_to_rgb('090909')
PANEL_RGB  = hex_to_rgb('0e0e0d')

def alpha(rgb, a):
    return tuple(int(c*a) for c in rgb)

# ── FREQUENCY RESPONSE ────────────────────────────────────────────────────────
def make_fr_chart(sens=92, f_lo=150, dpi=150):
    W, H = int(720*dpi/72), int(640*dpi/72)
    img  = Image.new('RGB', (W, H), BG_RGB)
    draw = ImageDraw.Draw(img)

    PAD = {'l':int(60*dpi/72), 'r':int(20*dpi/72), 't':int(30*dpi/72), 'b':int(60*dpi/72)}
    PW  = W - PAD['l'] - PAD['r']
    PH1 = int(H * 0.62)  # FR plot height
    PH2 = int(H * 0.25)  # impedance plot height
    PH1_y = PAD['t']
    PH2_y = PAD['t'] + PH1 + int(H*0.08)

    DB_MIN, DB_MAX = sens-20, sens+10
    LOG_MIN, LOG_MAX = math.log10(30), math.log10(25000)

    def fx(f): return PAD['l'] + int((math.log10(f)-LOG_MIN)/(LOG_MAX-LOG_MIN)*PW)
    def fy_fr(db): return PH1_y + int(PH1*(1-(db-DB_MIN)/(DB_MAX-DB_MIN)))

    # Panel backgrounds
    draw.rectangle([PAD['l'], PH1_y, PAD['l']+PW, PH1_y+PH1], fill=PANEL_RGB)
    draw.rectangle([PAD['l'], PH2_y, PAD['l']+PW, PH2_y+PH2], fill=PANEL_RGB)

    # FR grid
    for db in range(int(DB_MIN), int(DB_MAX)+1, 3):
        y = fy_fr(db)
        if PH1_y <= y <= PH1_y+PH1:
            col = GRID_RGB if db != sens else alpha(CHAMP_RGB, 0.3)
            draw.line([(PAD['l'], y), (PAD['l']+PW, y)], fill=col, width=1)
            if db % 6 == 0 or db == sens:
                draw.text((PAD['l']-8, y-7), str(db), fill=alpha(MUTED_RGB,0.9) if db!=sens else alpha(CHAMP2_RGB,1))

    for f in [50,100,200,500,1000,2000,5000,10000,20000]:
        x = fx(f)
        draw.line([(x, PH1_y), (x, PH1_y+PH1)], fill=GRID_RGB, width=1)
        lbl = f'{f//1000}k' if f>=1000 else str(f)
        draw.text((x-10, PH1_y+PH1+8), lbl, fill=MUTED_RGB)

    # FR curve
    F = np.logspace(LOG_MIN, LOG_MAX, 600, base=10)
    bqs = [
        rbj('HP', f_lo, Q=0.62),
        rbj('PK', 500, gain_db=0.7, Q=1.8),
        rbj('PK', 2800, gain_db=-1.5, Q=1.1),
        rbj('HS', 14000, gain_db=-2.5),
    ]
    fr = np.zeros(len(F)) + sens
    for b,a in bqs: fr += biquad_db(b, a, F)

    # Micro ripple
    lf = np.log(F)
    fr += 0.28*np.sin(6.3*lf+0.7) + 0.22*np.sin(11.1*lf+2.1) + 0.18*np.sin(17.9*lf+4.2)

    pts = [(fx(F[i]), fy_fr(float(np.clip(fr[i], DB_MIN-1, DB_MAX+1)))) for i in range(len(F))]

    # Fill
    fill_pts = [(PAD['l'], PH1_y+PH1)] + pts + [(PAD['l']+PW, PH1_y+PH1)]
    fill_pts = [(max(PAD['l'], min(PAD['l']+PW, x)), max(PH1_y, min(PH1_y+PH1, y))) for x,y in fill_pts]
    draw.polygon(fill_pts, fill=(28,21,8))

    # Curve
    clipped = [(max(PAD['l'], min(PAD['l']+PW, x)), max(PH1_y, min(PH1_y+PH1, y))) for x,y in pts]
    for i in range(len(clipped)-1):
        draw.line([clipped[i], clipped[i+1]], fill=CHAMP_RGB, width=2)

    # ±3dB dashes
    for off in [3, -3]:
        y = fy_fr(sens+off)
        if PH1_y <= y <= PH1_y+PH1:
            for x in range(PAD['l'], PAD['l']+PW, 14):
                draw.line([(x,y),(min(x+7,PAD['l']+PW),y)], fill=alpha(CHAMP2_RGB,0.5), width=1)

    # Impedance section
    Re, Res, Fs_d, Qms, Le = 6.4, 17.0, 158.0, 3.2, 0.10e-3
    Zm = Res / (1 + 1j * Qms * (F/Fs_d - Fs_d/F))
    Z  = Re + 1j*2*np.pi*F*Le + Zm
    Zmag = np.abs(Z)
    Z_MIN, Z_MAX = 0, 28
    def fy_z(z): return PH2_y + int(PH2*(1-(z-Z_MIN)/(Z_MAX-Z_MIN)))

    for z in [0,8,16,24]:
        y = fy_z(z)
        draw.line([(PAD['l'],y),(PAD['l']+PW,y)], fill=GRID_RGB, width=1)
        draw.text((PAD['l']-20, y-7), str(z), fill=MUTED_RGB)
    # 8Ω reference
    y8 = fy_z(8)
    for x in range(PAD['l'], PAD['l']+PW, 14):
        draw.line([(x,y8),(min(x+7,PAD['l']+PW),y8)], fill=alpha(BLUE_RGB,0.5), width=1)

    z_pts = [(fx(F[i]), fy_z(float(np.clip(Zmag[i], Z_MIN, Z_MAX)))) for i in range(len(F))]
    z_clip = [(max(PAD['l'], min(PAD['l']+PW, x)), max(PH2_y, min(PH2_y+PH2, y))) for x,y in z_pts]
    for i in range(len(z_clip)-1):
        draw.line([z_clip[i], z_clip[i+1]], fill=BLUE_RGB, width=2)

    img.save(os.path.join(_base, 'chart_fr.png'))
    print("FR chart done")

# ── POLAR ─────────────────────────────────────────────────────────────────────
def make_polar_chart(dir_h=140, dir_v=25, dpi=150):
    W, H = int(720*dpi/72), int(700*dpi/72)
    img  = Image.new('RGB', (W, H), BG_RGB)
    draw = ImageDraw.Draw(img)

    theta = np.linspace(-np.pi, np.pi, 2881)   # 0.125° resolution
    FLOOR = -30

    def h_pat(th, freq):
        bw6 = {250:170,500:155,1000:dir_h,2000:115,4000:85,8000:62}
        nf  = min(bw6, key=lambda k: abs(k-freq))
        th6 = bw6[nf]/2*np.pi/180
        ar  = np.abs(th)
        p   = math.log(0.5)/math.log((1+math.cos(th6))/2)
        D   = ((1+np.cos(ar))/2)**p
        ph  = (freq%613)*0.017
        D   = D*(1+0.03*np.sin(4*ar+ph)+0.02*np.sin(7*ar+1.7*ph))
        return np.maximum(FLOOR, 20*np.log10(np.maximum(D,1e-4)))

    def v_pat(th, freq):
        bw6 = {250:64,500:40,1000:dir_v,2000:16.5,4000:11,8000:7.5}
        nf  = min(bw6, key=lambda k: abs(k-freq))
        th6 = bw6[nf]/2*np.pi/180
        ar  = np.abs(th)
        B   = 1.8955/np.sin(th6)
        x   = B*np.sin(ar)
        S   = np.abs(np.sinc(x))           # np.sinc(x) = sin(πx)/(πx)
        baf = ((1+np.cos(ar))/2)**0.55
        wf  = {250:0.55,500:0.30,1000:0.15,2000:0.09,4000:0.06,8000:0.045}[nf]
        p   = math.log(0.5)/math.log((1+math.cos(th6))/2)
        sm  = ((1+np.cos(ar))/2)**p
        D   = (1-wf)*S*baf + wf*sm
        ph  = (freq%977)*0.013
        D   = D*(1+0.04*np.sin(5*ar+ph)+0.025*np.sin(9*ar+2.1*ph))
        D   = np.maximum(D, 10**(-27/20)*((1+np.cos(ar))/2)**0.4 + 10**(-31/20))
        return np.maximum(FLOOR, 20*np.log10(np.maximum(D,1e-6)))

    def draw_polar(cx, cy, R, pat_fn, freq, color, lw, is_v=False):
        db  = pat_fn(theta, freq)
        r   = R*(1 + np.clip(db,FLOOR,0)/abs(FLOOR))
        # For horizontal: angle 0 = top, +right, standard polar
        # For vertical: same convention
        xs  = cx + r*np.sin(theta)
        ys  = cy - r*np.cos(theta)
        pts = list(zip(xs.tolist(), ys.tolist()))
        # Draw as polyline with clipping
        for i in range(len(pts)-1):
            x1,y1 = pts[i]; x2,y2 = pts[i+1]
            # Clip to image bounds
            x1c = max(0,min(W-1,x1)); y1c = max(0,min(H*0.88,y1))
            x2c = max(0,min(W-1,x2)); y2c = max(0,min(H*0.88,y2))
            draw.line([(x1c,y1c),(x2c,y2c)], fill=color, width=lw)

    margin = int(32*dpi/72)
    half   = W//2
    R      = int(min(half/2 - margin, H*0.42))
    cy     = int(H*0.48)
    cxH, cxV = half//2, half + half//2

    PANEL_FILL = (14,14,13)

    for cx, label in [(cxH,'HORIZONTAL'),(cxV,'VERTICAL')]:
        # Panel bg circle
        draw.ellipse([cx-R,cy-R,cx+R,cy+R], fill=PANEL_FILL)

        # dB rings at 0, -6, -12, -18, -24
        for db in [0,-6,-12,-18,-24]:
            r = int(R*(1+db/abs(FLOOR)))
            if r < 2: continue
            col  = (80,65,40) if db == 0 else (35,33,30)
            draw.ellipse([cx-r,cy-r,cx+r,cy+r], outline=col, width=1)
            if db != 0:
                draw.text((cx+r+3, cy-7), f'{db}', fill=(80,74,68))

        # Radial lines every 30°
        for deg in range(0,360,30):
            rad = deg*math.pi/180
            x2  = cx + int(R*math.sin(rad))
            y2  = cy - int(R*math.cos(rad))
            draw.line([(cx,cy),(x2,y2)], fill=(30,28,26), width=1)

        # Angle labels
        for deg,lbl in [(0,'0°'),(90,'90°'),(180,'180°'),(270,'−90°')]:
            rad = deg*math.pi/180
            lx  = cx + int((R+14)*math.sin(rad))
            ly  = cy - int((R+14)*math.cos(rad))
            draw.text((lx-12, ly-7), lbl, fill=(80,74,68))

        # Label
        draw.text((cx-30, cy-R-22), label, fill=(140,115,70))

    # Frequency curves — horizontal
    H_CURVES = [
        (250,  (60, 48, 24,  200), 1),
        (500,  (80, 62, 30,  200), 1),
        (1000, (201,169,110, 255), 3),
        (2000, (160,130,80,  200), 1),
        (4000, (120,95, 55,  200), 1),
        (8000, (80, 62, 30,  200), 1),
    ]
    V_CURVES  = [
        (250,  (30, 60, 90,  200), 1),
        (500,  (45, 85, 130, 200), 1),
        (1000, (91,141,184,  255), 3),
        (2000, (70,110,155,  200), 1),
        (4000, (50, 80, 125, 200), 1),
        (8000, (35, 55, 90,  200), 1),
    ]

    for freq, col, lw in H_CURVES:
        draw_polar(cxH, cy, R, h_pat, freq, col[:3], lw)
    for freq, col, lw in V_CURVES:
        draw_polar(cxV, cy, R, v_pat, freq, col[:3], lw, is_v=True)

    # Legend row
    ly = int(H*0.93)
    lx = margin
    for col, lbl in [((201,169,110),'■ Horizontal'), ((91,141,184),'■ Vertical')]:
        draw.text((lx, ly), lbl, fill=col)
        lx += int(130*dpi/72)
    # Freq legend
    draw.text((lx, ly), '250 · 500 · 1k · 2k · 4k · 8k Hz', fill=(80,74,68))

    # Beamwidth chart at bottom
    bw_y = int(H*0.78)
    bw_h = int(H*0.13)
    bw_x0, bw_x1 = margin, W-margin
    bw_w = bw_x1 - bw_x0

    F_BW  = [250,500,1000,2000,4000,8000,16000]
    BW_H  = [170,155,dir_h,115,85,62,48]
    BW_V  = [64,40,dir_v,16.5,11,7.5,5.5]

    draw.rectangle([bw_x0, bw_y, bw_x1, bw_y+bw_h], fill=PANEL_FILL)
    draw.text((bw_x0, bw_y-18), 'BEAMWIDTH (−6 dB) vs FREQUENCY', fill=(140,115,70))

    def bwx(i): return bw_x0 + int(i/(len(F_BW)-1)*bw_w)
    def bwy(bw): return bw_y + int(bw_h*(1-bw/185))

    # Grid lines at 30,60,90,120,150
    for bw in [30,60,90,120,150]:
        y = bwy(bw)
        draw.line([(bw_x0,y),(bw_x1,y)], fill=(35,33,30), width=1)
        draw.text((bw_x0-28, y-6), str(bw)+'°', fill=(80,74,68))

    # H curve
    h_pts = [(bwx(i), bwy(BW_H[i])) for i in range(len(F_BW))]
    for i in range(len(h_pts)-1):
        draw.line([h_pts[i],h_pts[i+1]], fill=(201,169,110), width=2)
    for p in h_pts: draw.ellipse([p[0]-3,p[1]-3,p[0]+3,p[1]+3], fill=(201,169,110))

    # V curve
    v_pts = [(bwx(i), bwy(BW_V[i])) for i in range(len(F_BW))]
    for i in range(len(v_pts)-1):
        draw.line([v_pts[i],v_pts[i+1]], fill=(91,141,184), width=2)
    for p in v_pts: draw.ellipse([p[0]-3,p[1]-3,p[0]+3,p[1]+3], fill=(91,141,184))

    # Freq axis labels
    for i,f in enumerate(F_BW):
        lbl = f'{f//1000}k' if f>=1000 else str(f)
        draw.text((bwx(i)-8, bw_y+bw_h+5), lbl, fill=(80,74,68))

    img.save(os.path.join(_base, 'chart_polar.png'))
    print("Polar chart done")

# ── EQ ────────────────────────────────────────────────────────────────────────
def make_eq_chart(eq_filters=None, dpi=150):
    if eq_filters is None:
        eq_filters = [
            ('LS', 250, 3.0, 1.0, '+3 dB · 250 Hz'),
            ('LS', 770, -3.0, 1.0, '−3 dB · 770 Hz'),
            ('HS', 3000, -3.0, 1.0, '−3 dB · 3 kHz'),
            ('HP', 200, 0, 0.7, 'HP · 200 Hz'),
        ]

    W, H = int(720*dpi/72), int(440*dpi/72)
    img  = Image.new('RGB', (W, H), BG_RGB)
    draw = ImageDraw.Draw(img)

    PAD = {'l':int(55*dpi/72),'r':int(20*dpi/72),'t':int(25*dpi/72),'b':int(55*dpi/72)}
    PW = W - PAD['l'] - PAD['r']
    PH = H - PAD['t'] - PAD['b']

    DB_MIN, DB_MAX = -24, 7
    LOG_MIN, LOG_MAX = math.log10(20), math.log10(24000)
    F = np.logspace(LOG_MIN, LOG_MAX, 600, base=10)

    def fx(f): return PAD['l'] + int((math.log10(f)-LOG_MIN)/(LOG_MAX-LOG_MIN)*PW)
    def fy(db): return PAD['t'] + int(PH*(1-(db-DB_MIN)/(DB_MAX-DB_MIN)))

    draw.rectangle([PAD['l'], PAD['t'], PAD['l']+PW, PAD['t']+PH], fill=PANEL_RGB)

    # Grid
    for db in range(DB_MIN, DB_MAX+1, 3):
        y = fy(db)
        col = alpha(CHAMP2_RGB, 0.8) if db==0 else GRID_RGB
        lw  = 2 if db==0 else 1
        draw.line([(PAD['l'],y),(PAD['l']+PW,y)], fill=col, width=lw)
        draw.text((PAD['l']-30, y-7), f'{db:+d}' if db else '0 dB', fill=MUTED_RGB)

    for f in [50,100,200,500,1000,2000,5000,10000,20000]:
        x = fx(f)
        draw.line([(x,PAD['t']),(x,PAD['t']+PH)], fill=GRID_RGB, width=1)
        draw.text((x-10, PAD['t']+PH+8), f'{f//1000}k' if f>=1000 else str(f), fill=MUTED_RGB)

    # Compute combined curve
    total = np.zeros(len(F))
    FCOLS = [alpha(CHAMP_RGB,0.40), alpha(BLUE_RGB,0.40),
             (155,90,180,100), (106,160,106,100)]

    for idx, (kind, f0, gain, Q, _) in enumerate(eq_filters):
        b, a = rbj(kind, f0, gain_db=gain, Q=Q)
        curve = biquad_db(b, a, F)
        total += curve
        # Individual dashed curve
        pts = [(fx(F[i]), fy(float(np.clip(curve[i], DB_MIN-1, DB_MAX+1)))) for i in range(len(F))]
        col = FCOLS[idx % len(FCOLS)][:3]
        for i in range(0, len(pts)-1, 2):
            x1,y1 = max(PAD['l'],min(PAD['l']+PW,pts[i][0])), max(PAD['t'],min(PAD['t']+PH,pts[i][1]))
            x2,y2 = max(PAD['l'],min(PAD['l']+PW,pts[i+1][0])), max(PAD['t'],min(PAD['t']+PH,pts[i+1][1]))
            draw.line([(x1,y1),(x2,y2)], fill=col, width=1)

    # Fill + combined curve
    pts = [(fx(F[i]), fy(float(np.clip(total[i], DB_MIN-1, DB_MAX+1)))) for i in range(len(F))]
    fill = [(PAD['l'], PAD['t']+PH)] + [(max(PAD['l'],min(PAD['l']+PW,x)), max(PAD['t'],min(PAD['t']+PH,y))) for x,y in pts] + [(PAD['l']+PW, PAD['t']+PH)]
    draw.polygon(fill, fill=(28,21,8))
    clipped = [(max(PAD['l'],min(PAD['l']+PW,x)), max(PAD['t'],min(PAD['t']+PH,y))) for x,y in pts]
    for i in range(len(clipped)-1):
        draw.line([clipped[i], clipped[i+1]], fill=CHAMP_RGB, width=2)

    img.save(os.path.join(_base, 'chart_eq.png'))
    print("EQ chart done")

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import argparse, json as _json
    ap = argparse.ArgumentParser()
    ap.add_argument('--product', default=None)
    args = ap.parse_args()

    # Defaults (Cane-like)
    sens=92; f_lo=150; dir_h=140; dir_v=25; eq_filters=None

    if args.product:
        try:
            with open(args.product) as _f:
                _d = _json.load(_f)
            sens  = _d.get('sensitivityDb', 92) or 92
            f_lo  = _d.get('freqLowHz', 150) or 150
            dir_h = _d.get('directivityHDeg', 140) or 140
            dir_v = _d.get('directivityVDeg', 25) or 25
            # Parse EQ filters from eqData CSV
            eq_filters = []
            if _d.get('eqData'):
                for line in _d['eqData'].strip().split('\n')[1:]:
                    p = line.strip().split(',')
                    if len(p) < 2: continue
                    if p[0] in ('HP','LP'):
                        eq_filters.append((p[0], float(p[1]), 0, float(p[2]) if len(p)>2 else 0.7, p[0]+' filter'))
                    else:
                        eq_filters.append((p[2] if len(p)>2 else 'PK', float(p[0]), float(p[1]),
                                          float(p[3]) if len(p)>3 else 1.0, 'EQ'))
        except Exception as e:
            print(f'[charts] product load error: {e}')

    make_fr_chart(sens=sens, f_lo=f_lo)
    make_polar_chart(dir_h=dir_h, dir_v=dir_v)
    make_eq_chart(eq_filters=eq_filters)
    print("All charts done")
