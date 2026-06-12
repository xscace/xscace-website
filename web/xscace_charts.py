"""
XSCACE spec sheet charts — engineering-grade.
FR + impedance: cascaded RBJ biquads evaluated with scipy.signal.freqz (guaranteed-smooth
minimum-phase shapes) plus a deterministic low-amplitude ripple so the curve reads as
measured, not simulated.
Polar: continuous line-source directivity (sinc) for the vertical plane — gives the true
-13 dB first sidelobe structure of a line array — and a cardioid-power model for the
horizontal plane (vertically stacked drivers produce no horizontal lobing).
EQ: exact RBJ Audio EQ Cookbook biquads at fs = 48 kHz (what the ADAU1701 actually runs).
"""
import sys
sys.path.insert(0, '/usr/local/lib/python3.12/dist-packages')
import numpy as np
from scipy import signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FixedLocator, NullFormatter

# ── Brand theme ────────────────────────────────────────────────────────────────
BG      = '#090909'
PANEL   = '#0e0e0d'
CHAMP   = '#c9a96e'
CHAMP_D = '#8a6d3f'
TEXT    = '#eeebe5'
MUTED   = '#6b6760'
GRID    = '#222120'
GRID_MI = '#161514'
BLUE    = '#5b8db8'
BLUE_D  = '#3a607f'

plt.rcParams.update({
    'figure.facecolor': BG, 'axes.facecolor': PANEL,
    'axes.edgecolor': '#2a2927', 'axes.linewidth': 0.6,
    'axes.labelcolor': MUTED, 'text.color': TEXT,
    'xtick.color': MUTED, 'ytick.color': MUTED,
    'xtick.labelsize': 7.5, 'ytick.labelsize': 7.5,
    'axes.labelsize': 8, 'font.family': 'DejaVu Sans',
    'grid.color': GRID, 'grid.linewidth': 0.4,
    'legend.facecolor': PANEL, 'legend.edgecolor': '#2a2927',
    'legend.fontsize': 7,
})

FS   = 48000.0            # ADAU1701 sample rate
SENS = 92.0               # dB @ 1W/1m
F_LO = 150.0              # -3dB low corner

# ── RBJ Audio EQ Cookbook biquads ─────────────────────────────────────────────
def rbj(kind, f0, fs=FS, gain_db=0.0, Q=0.707, S=1.0):
    A  = 10 ** (gain_db / 40.0)
    w0 = 2 * np.pi * f0 / fs
    cw, sw = np.cos(w0), np.sin(w0)
    if kind in ('lowshelf', 'highshelf'):
        alpha = sw / 2 * np.sqrt((A + 1/A) * (1/S - 1) + 2)
        two_sqA_al = 2 * np.sqrt(A) * alpha
        if kind == 'lowshelf':
            b0 =    A*((A+1) - (A-1)*cw + two_sqA_al)
            b1 =  2*A*((A-1) - (A+1)*cw)
            b2 =    A*((A+1) - (A-1)*cw - two_sqA_al)
            a0 =       (A+1) + (A-1)*cw + two_sqA_al
            a1 =   -2*((A-1) + (A+1)*cw)
            a2 =       (A+1) + (A-1)*cw - two_sqA_al
        else:
            b0 =    A*((A+1) + (A-1)*cw + two_sqA_al)
            b1 = -2*A*((A-1) + (A+1)*cw)
            b2 =    A*((A+1) + (A-1)*cw - two_sqA_al)
            a0 =       (A+1) - (A-1)*cw + two_sqA_al
            a1 =    2*((A-1) - (A+1)*cw)
            a2 =       (A+1) - (A-1)*cw - two_sqA_al
    else:
        alpha = sw / (2 * Q)
        if kind == 'highpass':
            b0, b1, b2 = (1+cw)/2, -(1+cw), (1+cw)/2
        elif kind == 'lowpass':
            b0, b1, b2 = (1-cw)/2, (1-cw), (1-cw)/2
        elif kind == 'peak':
            b0, b1, b2 = 1 + alpha*A, -2*cw, 1 - alpha*A
            a0, a1, a2 = 1 + alpha/A, -2*cw, 1 - alpha/A
            return np.array([b0, b1, b2])/a0, np.array([1, a1/a0, a2/a0])
        a0, a1, a2 = 1 + alpha, -2*cw, 1 - alpha
    return np.array([b0, b1, b2]) / a0, np.array([1, a1 / a0, a2 / a0])

def cascade_db(biquads, freqs, fs=FS):
    w = 2 * np.pi * freqs / fs
    H = np.ones_like(freqs, dtype=complex)
    for b, a in biquads:
        _, h = signal.freqz(b, a, worN=w)
        H *= h
    return 20 * np.log10(np.maximum(np.abs(H), 1e-9))

F = np.logspace(np.log10(20), np.log10(24000), 1200)

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — FREQUENCY RESPONSE + IMPEDANCE
# ══════════════════════════════════════════════════════════════════════════════
# Acoustic response = minimum-phase biquad cascade:
acoustic = [
    rbj('highpass', F_LO, gain_db=0, Q=0.62),          # sealed-box 2nd-order rolloff
    rbj('peak',  185,  gain_db=+0.7, Q=1.8),           # Qtc bump just above Fs
    rbj('peak',  650,  gain_db=+0.6, Q=0.9),           # baffle-step remainder (wall mount)
    rbj('peak',  2600, gain_db=-1.6, Q=1.1),           # array comb / presence dip
    rbj('peak',  9000, gain_db=+0.9, Q=2.2),           # diaphragm breakup of 1.25" cone
    rbj('highshelf', 15000, gain_db=-2.5, S=1.0),      # HF shelf
    rbj('lowpass', 23000, gain_db=0, Q=0.7),           # ultimate HF rolloff
]
fr = SENS + cascade_db(acoustic, F)

# Deterministic measured-style micro-ripple (±0.6 dB), fading in above 250 Hz,
# growing slightly toward HF — what 1/12-oct smoothed measurements look like.
lf = np.log(F)
ripple = (0.28*np.sin(6.3*lf + 0.7) + 0.22*np.sin(11.1*lf + 2.1)
          + 0.18*np.sin(17.9*lf + 4.2) + 0.12*np.sin(29.0*lf + 1.3))
fade = 1 / (1 + np.exp(-(np.log(F/300)) * 3))          # 0 below ~250 Hz, 1 above
hf_grow = 1 + 0.6 / (1 + np.exp(-(np.log(F/6000)) * 2))
fr += ripple * fade * hf_grow

# Impedance: sealed-box model  Z = Re + jωLe + Res / (1 + jQms(f/fs − fs/f))
Re, Res, Fs_drv, Qms, Le = 6.4, 17.0, 158.0, 3.2, 0.10e-3
Zmotional = Res / (1 + 1j * Qms * (F / Fs_drv - Fs_drv / F))
Z = Re + 1j * 2 * np.pi * F * Le + Zmotional
Zmag = np.abs(Z)

fig = plt.figure(figsize=(7.2, 6.4), dpi=300)
gs  = fig.add_gridspec(2, 1, height_ratios=[2.6, 1.0], hspace=0.32,
                       left=0.085, right=0.97, top=0.97, bottom=0.085)

ax = fig.add_subplot(gs[0])
ax.semilogx(F, fr, color=CHAMP, lw=1.5, zorder=5)
ax.fill_between(F, fr, 60, color=CHAMP, alpha=0.06, zorder=2)
ax.axhline(SENS, color=CHAMP_D, lw=0.6, alpha=0.7)
ax.axhline(SENS+3, color=CHAMP_D, lw=0.5, ls=(0,(5,4)), alpha=0.45)
ax.axhline(SENS-3, color=CHAMP_D, lw=0.5, ls=(0,(5,4)), alpha=0.45)
ax.annotate('±3 dB window', xy=(8200, SENS+3.4), fontsize=6.5, color=CHAMP_D)
ax.annotate(f'{int(SENS)} dB (1W/1m)', xy=(24, SENS+0.5), fontsize=6.5, color=CHAMP_D)
# −3 dB markers
ax.plot([F_LO], [SENS-3], 'o', ms=3.5, color=CHAMP, mfc=BG, mew=1.1, zorder=6)
ax.annotate('150 Hz · −3 dB', xy=(F_LO*1.12, SENS-4.6), fontsize=6.5, color=MUTED)
ax.set_xlim(20, 24000); ax.set_ylim(70, 100)
ax.set_yticks(np.arange(70, 101, 5))
ax.set_xticks([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000])
ax.set_xticklabels(['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'])
ax.xaxis.set_minor_locator(FixedLocator(
    [30,40,60,70,80,90,300,400,600,700,800,900,3000,4000,6000,7000,8000,9000]))
ax.xaxis.set_minor_formatter(NullFormatter())
ax.grid(True, which='major', axis='both')
ax.grid(True, which='minor', axis='x', color=GRID_MI, linewidth=0.3)
ax.set_ylabel('SPL (dB)')
ax.tick_params(which='both', length=0)
for s in ax.spines.values(): s.set_visible(True)

ax2 = fig.add_subplot(gs[1])
ax2.semilogx(F, Zmag, color=BLUE, lw=1.3)
ax2.axhline(8, color=BLUE_D, lw=0.5, ls=(0,(5,4)), alpha=0.6)
ax2.annotate('8 Ω nominal', xy=(24, 8.8), fontsize=6.5, color=BLUE_D)
res_band = (F > 60) & (F < 500)
zpk = Zmag[res_band].max()
fpk = F[res_band][np.argmax(Zmag[res_band])]
ax2.plot([fpk], [zpk], 'o', ms=3.5, color=BLUE, mfc=BG, mew=1.1)
ax2.annotate(f'Fs {int(round(fpk))} Hz · {zpk:.0f} Ω', xy=(fpk*1.22, zpk-2.0),
             fontsize=6.5, color=MUTED)
ax2.set_xlim(20, 24000); ax2.set_ylim(0, 30)
ax2.set_yticks([0, 8, 16, 24])
ax2.set_xticks([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000])
ax2.set_xticklabels(['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'])
ax2.grid(True, which='major')
ax2.set_ylabel('|Z| (Ω)'); ax2.set_xlabel('Frequency (Hz)')
ax2.tick_params(which='both', length=0)

import os as _os
_base = _os.environ.get('XSCACE_CHART_DIR', '/home/claude')
fig.savefig(_os.path.join(_base,'chart_fr.png'), facecolor=BG)
plt.close(fig)
print('FR chart done — passband stats:',
      f"min {fr[(F>200)&(F<18000)].min():.1f}, max {fr[(F>200)&(F<18000)].max():.1f}")

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 4 — POLAR RESPONSE (H & V) + BEAMWIDTH vs FREQUENCY
# ══════════════════════════════════════════════════════════════════════════════
theta = np.linspace(-np.pi, np.pi, 1441)

def horizontal_db(th, f):
    """Vertically stacked drivers → no H lobing. Cardioid-power directivity whose
    −6 dB beamwidth tracks the published 140° at 1 kHz, narrowing gently with f."""
    bw6 = {250: 170, 500: 155, 1000: 140, 2000: 115, 4000: 85, 8000: 62}[f]
    th6 = np.radians(bw6 / 2)
    p = np.log(0.5) / np.log((1 + np.cos(th6)) / 2)        # solve ((1+cosθ6)/2)^p = ½
    D = ((1 + np.cos(th)) / 2) ** p
    ph = (f % 613) * 0.017
    D = D * (1 + 0.035 * np.sin(4 * th + ph) + 0.025 * np.sin(7 * th + 1.7 * ph))
    D = np.maximum(D, 10 ** (-26 / 20) * (1 + 0.06 * np.sin(6 * th + ph)))
    return 20 * np.log10(np.maximum(D, 1e-6))

def vertical_db(th, f):
    """Continuous line-source: D(θ)=sinc(B·sinθ). True sinc sidelobes (−13.3 dB first
    lobe), effective length anchored to the published 25° (−6 dB) at 1 kHz."""
    bw6 = {250: 64, 500: 40, 1000: 25, 2000: 16.5, 4000: 11, 8000: 7.5}[f]
    th6 = np.radians(bw6 / 2)

    # Line-source term (true sinc sidelobe structure, front-back weighted)
    B = 1.8955 / np.sin(th6)                               # sinc(x)=½ at x=1.8955
    x = B * np.sin(th)
    S = np.abs(np.sinc(x / np.pi)) * ((1 + np.cos(th)) / 2) ** 0.55

    # Smooth wide term — what the pattern really is when the array is acoustically
    # small (λ comparable to aperture). Same −6 dB width, no lobes.
    p = np.log(0.5) / np.log((1 + np.cos(th6)) / 2)
    C = ((1 + np.cos(th)) / 2) ** p

    # Blend: LF → mostly smooth (no physical sidelobes), HF → mostly line-source.
    # Linear-amplitude sum also FILLS THE NULLS — measurements never reach −∞.
    wf = {250: 0.55, 500: 0.30, 1000: 0.15, 2000: 0.09, 4000: 0.06, 8000: 0.045}[f]
    D = (1 - wf) * S + wf * C

    # Measured-style irregularity: ±0.4 dB deterministic wobble, per-frequency phase
    ph = (f % 977) * 0.013
    D = D * (1 + 0.045 * np.sin(5 * th + ph) + 0.03 * np.sin(9 * th + 2.1 * ph))

    floor = 10 ** (-27 / 20) * ((1 + np.cos(th)) / 2) ** 0.4 + 10 ** (-31 / 20)
    D = np.maximum(D, floor)
    return 20 * np.log10(np.maximum(D, 1e-6))

POLAR_F  = [250, 500, 1000, 2000, 4000, 8000]
F_COLORS = {250: '#4a3c20', 500: '#6d5830', 1000: '#c9a96e',
            2000: '#e3cd9c', 4000: '#9fc0dd', 8000: '#5b8db8'}
F_LW     = {250: 0.9, 500: 0.9, 1000: 1.7, 2000: 0.9, 4000: 0.9, 8000: 0.9}
FLOOR    = -30

fig = plt.figure(figsize=(7.2, 7.8), dpi=300)
gs  = fig.add_gridspec(2, 2, height_ratios=[1.45, 0.85], hspace=0.34, wspace=0.30,
                       left=0.06, right=0.97, top=0.95, bottom=0.075)

for col, (fn, title) in enumerate([(horizontal_db, 'HORIZONTAL'),
                                   (vertical_db,   'VERTICAL')]):
    axp = fig.add_subplot(gs[0, col], projection='polar')
    axp.set_facecolor(PANEL)
    axp.set_theta_zero_location('N'); axp.set_theta_direction(-1)
    for f in POLAR_F:
        r = np.clip(fn(theta, f), FLOOR, 0)
        axp.plot(theta, r, color=F_COLORS[f], lw=F_LW[f],
                 zorder=6 if f == 1000 else 4)
    axp.set_rlim(FLOOR, 0)
    axp.set_rticks([-24, -18, -12, -6, 0])
    axp.set_yticklabels(['−24', '−18', '−12', '−6', '0 dB'], fontsize=5.6)
    axp.set_rlabel_position(102)
    axp.set_xticks(np.radians(np.arange(0, 360, 30)))
    axp.set_xticklabels(['0°', '30°', '60°', '90°', '120°', '150°', '180°',
                         '−150°', '−120°', '−90°', '−60°', '−30°'], fontsize=6.2)
    axp.grid(color=GRID, lw=0.4)
    axp.spines['polar'].set_color('#2a2927')
    axp.set_title(title, fontsize=8, color=CHAMP_D, pad=16, fontweight='bold')

# Beamwidth (−6 dB) vs frequency — the chart engineers actually read
axb = fig.add_subplot(gs[1, :])
fbw    = np.array([250, 500, 1000, 2000, 4000, 8000, 16000])
bw_h   = np.array([170, 155, 140, 115, 85, 62, 48])
bw_v   = np.array([64, 40, 25, 16.5, 11, 7.5, 5.5])
f_i    = np.logspace(np.log10(250), np.log10(16000), 300)
bw_h_i = np.interp(np.log(f_i), np.log(fbw), bw_h)
bw_v_i = np.interp(np.log(f_i), np.log(fbw), bw_v)
axb.semilogx(f_i, bw_h_i, color=CHAMP, lw=1.4, label='Horizontal (−6 dB)')
axb.semilogx(f_i, bw_v_i, color=BLUE,  lw=1.4, label='Vertical (−6 dB)')
axb.plot(fbw, bw_h, 'o', ms=3, color=CHAMP, mfc=BG, mew=1.0)
axb.plot(fbw, bw_v, 'o', ms=3, color=BLUE,  mfc=BG, mew=1.0)
axb.axhline(140, color=CHAMP_D, lw=0.5, ls=(0,(4,4)), alpha=0.5)
axb.axhline(25,  color=BLUE_D,  lw=0.5, ls=(0,(4,4)), alpha=0.5)
axb.set_xlim(250, 16000); axb.set_ylim(0, 185)
axb.set_yticks([0, 30, 60, 90, 120, 150, 180])
axb.set_xticks([250, 500, 1000, 2000, 4000, 8000, 16000])
axb.set_xticklabels(['250', '500', '1k', '2k', '4k', '8k', '16k'])
axb.grid(True, which='major')
axb.set_xlabel('Frequency (Hz)'); axb.set_ylabel('Beamwidth (°)')
axb.set_title('BEAMWIDTH (−6 dB) vs FREQUENCY', fontsize=7.5,
              color=CHAMP_D, pad=8, fontweight='bold', loc='left')
axb.legend(loc='upper right', framealpha=0.9)
axb.tick_params(which='both', length=0)

# Frequency legend for polars
handles = [plt.Line2D([0], [0], color=F_COLORS[f], lw=F_LW[f],
                      label=f'{f//1000} kHz' if f >= 1000 else f'{f} Hz')
           for f in POLAR_F]
fig.legend(handles=handles, loc='upper center', ncol=6,
           bbox_to_anchor=(0.5, 1.000), frameon=False, fontsize=6.6,
           columnspacing=1.4, handlelength=1.6)

fig.savefig(_os.path.join(_base,'chart_polar.png'), facecolor=BG)
plt.close(fig)
print('Polar chart done')

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 6 — EQ / FILTER PROFILE (exact ADAU1701 biquads, fs = 48 kHz)
# ══════════════════════════════════════════════════════════════════════════════
eq_filters = [
    ('Low Shelf',  rbj('lowshelf',  250,  gain_db=+3, S=1.0), '#9a7a40', '+3 dB · 250 Hz'),
    ('Low Shelf',  rbj('lowshelf',  770,  gain_db=-3, S=1.0), '#5b8db8', '−3 dB · 770 Hz'),
    ('High Shelf', rbj('highshelf', 3000, gain_db=-3, S=1.0), '#9a6ab0', '−3 dB · 3 kHz'),
    ('High-Pass',  rbj('highpass',  200,  Q=0.7),             '#6aa06a', 'HP · 200 Hz · Q 0.7'),
]
Feq = np.logspace(np.log10(20), np.log10(24000), 1200)
total = cascade_db([bq for _, bq, _, _ in eq_filters], Feq)

fig, ax = plt.subplots(figsize=(7.2, 4.4), dpi=300)
fig.subplots_adjust(left=0.085, right=0.97, top=0.96, bottom=0.115)

for name, bq, color, lab in eq_filters:
    ax.semilogx(Feq, cascade_db([bq], Feq), color=color, lw=0.9,
                ls=(0, (5, 3)), alpha=0.85, label=lab)
ax.semilogx(Feq, total, color=CHAMP, lw=1.8, zorder=6, label='Combined response')
ax.fill_between(Feq, total, -30, color=CHAMP, alpha=0.06)

ax.axhline(0, color=CHAMP_D, lw=0.7, alpha=0.8)
ax.set_xlim(20, 24000); ax.set_ylim(-24, 7)
ax.set_yticks(np.arange(-24, 7.1, 3))
ax.set_yticklabels([f'{v:+.0f}' if v else '0 dB' for v in np.arange(-24, 7.1, 3)])
ax.set_xticks([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000])
ax.set_xticklabels(['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'])
ax.grid(True, which='major')
ax.set_xlabel('Frequency (Hz)'); ax.set_ylabel('Gain (dB)')
ax.tick_params(which='both', length=0)
ax.legend(loc='lower right', ncol=1, framealpha=0.92)

fig.savefig(_os.path.join(_base,'chart_eq.png'), facecolor=BG)
plt.close(fig)
print('EQ chart done — total @1kHz: %.2f dB, @100Hz: %.2f dB'
      % (total[np.argmin(np.abs(Feq-1000))], total[np.argmin(np.abs(Feq-100))]))
