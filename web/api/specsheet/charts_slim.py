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
    W, H = int(720*dpi/72), int(780*dpi/72)
    img  = Image.new('RGB', (W, H), BG_RGB)
    draw = ImageDraw.Draw(img)

    theta = np.linspace(-np.pi, np.pi, 1441)
    FLOOR = -30

    def h_pat(a_deg, freq):
        bw6 = {250:170,500:155,1000:dir_h,2000:115,4000:85,8000:62}
        nf = min(bw6, key=lambda k: abs(k-freq))
        th6 = bw6[nf]/2*np.pi/180
        a = np.abs(np.asarray(a_deg, float)) % 360
        a = np.where(a > 180, 360-a, a)
        ar = a*np.pi/180
        p = math.log(0.5)/math.log((1+math.cos(th6))/2)
        D = ((1+np.cos(ar))/2)**p
        ph = (freq%613)*0.017
        D = D*(1+0.035*np.sin(4*ar+ph)+0.025*np.sin(7*ar+1.7*ph))
        return np.maximum(FLOOR, 20*np.log10(np.maximum(D, 1e-4)))

    def v_pat(a_deg, freq):
        bw6 = {250:64,500:40,1000:dir_v,2000:16.5,4000:11,8000:7.5}
        nf = min(bw6, key=lambda k: abs(k-freq))
        th6 = bw6[nf]/2*np.pi/180
        a = np.abs(np.asarray(a_deg, float)) % 360
        a = np.where(a > 180, 360-a, a)
        ar = a*np.pi/180
        B = 1.8955/np.sin(th6)
        x = B*np.sin(ar)
        xp = np.pi*x/np.pi
        S = np.abs(np.where(np.abs(xp)<1e-9, 1.0, np.sin(xp*np.pi)/(xp*np.pi+1e-9)))
        baf = ((1+np.cos(ar))/2)**0.55
        wf = {250:0.55,500:0.30,1000:0.15,2000:0.09,4000:0.06,8000:0.045}[nf]
        p = math.log(0.5)/math.log((1+math.cos(th6))/2)
        sm = ((1+np.cos(ar))/2)**p
        D = (1-wf)*S*baf + wf*sm
        ph = (freq%977)*0.013
        D = D*(1+0.045*np.sin(5*ar+ph)+0.03*np.sin(9*ar+2.1*ph))
        return np.maximum(FLOOR, 20*np.log10(np.maximum(D, 1e-6)))

    def draw_polar(cx, cy, R, pat_fn, freq, color, lw=2, vertical=False):
        db_arr = pat_fn(np.degrees(theta), freq)
        r_arr  = R*(1+db_arr/24)
        if vertical:
            xs = cx + r_arr*np.cos(theta)
            ys = cy + r_arr*np.sin(theta)
        else:
            xs = cx + r_arr*np.sin(theta)
            ys = cy - r_arr*np.cos(theta)
        pts = list(zip(xs.tolist(), ys.tolist()))
        for i in range(len(pts)-1):
            draw.line([pts[i], pts[i+1]], fill=color, width=lw)

    # Two polar plots side by side
    margin = int(40*dpi/72)
    half_w = W//2
    R = int(min(half_w - margin*2, H//2 - margin*3) * 0.85)

    for ci, (cx, label, pat, is_v) in enumerate([
        (half_w//2, 'HORIZONTAL', h_pat, False),
        (half_w + half_w//2, 'VERTICAL', v_pat, True),
    ]):
        cy = H//2 - int(30*dpi/72)

        # Background circle
        draw.ellipse([cx-R, cy-R, cx+R, cy+R], fill=PANEL_RGB)

        # dB rings
        for db in [0,-6,-12,-18,-24]:
            r = int(R*(1+db/24))
            col = alpha(CHAMP_RGB,0.25) if db==0 else GRID_RGB
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=col, width=1)
            draw.text((cx+r+4, cy-8), f'{db}', fill=MUTED_RGB)

        # Radial lines
        for deg in range(0,360,30):
            rad = (deg-90)*math.pi/180
            draw.line([(cx, cy), (int(cx+R*math.cos(rad)), int(cy+R*math.sin(rad)))],
                      fill=GRID_RGB, width=1)

        # Angle labels
        for deg, lbl in [(0,'0°'),(90,'90°'),(180,'180°'),(270,'−90°')]:
            rad = (deg-90)*math.pi/180
            lx, ly = int(cx+(R+15)*math.cos(rad)), int(cy+(R+15)*math.sin(rad))
            draw.text((lx-10, ly-7), lbl, fill=MUTED_RGB)

        # Panel label
        draw.text((cx-30, cy-R-25), label, fill=alpha(CHAMP_RGB,0.7))

        # Curves
        H_FREQS = [(500, alpha(CHAMP_RGB,0.30), 1),
                   (1000, CHAMP_RGB, 3),
                   (4000, alpha(CHAMP_RGB,0.50), 1),
                   (8000, alpha(CHAMP_RGB,0.25), 1)]
        V_FREQS = [(500, alpha(BLUE_RGB,0.28), 1),
                   (1000, BLUE_RGB, 3),
                   (4000, alpha(BLUE_RGB,0.45), 1),
                   (8000, alpha(BLUE_RGB,0.22), 1)]

        for freq, col, lw in (V_FREQS if is_v else H_FREQS):
            draw_polar(cx, cy, R, pat, freq, col, lw, is_v)

    # Legend
    ly = H - int(55*dpi/72)
    for col, lbl in [(CHAMP_RGB,'■ Horizontal  '), (BLUE_RGB,'■ Vertical')]:
        draw.text((margin, ly), lbl, fill=col)
        margin += int(120*dpi/72)

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
    make_fr_chart()
    make_polar_chart()
    make_eq_chart()
    print("All charts done")
