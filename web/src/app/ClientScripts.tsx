'use client'

import { useEffect } from 'react'

export default function ClientScripts() {
  useEffect(() => {
    // Execute the main homepage script
    ;(function() {

(function(){
var cur=document.getElementById('cursor') as HTMLElement|null;
if(!cur) return;
var _cur=cur as HTMLElement;
var cring=document.getElementById('c-ring'),
    cwaves=document.getElementById('c-waves'),
    wp1=document.getElementById('wp1'),wp2=document.getElementById('wp2'),wp3=document.getElementById('wp3');
var mx=0,my=0,rx=0,ry=0,wt=0,ready=false;
document.addEventListener('mousemove',function(e){
  mx=e.clientX;my=e.clientY;
  if(!ready){ready=true;rx=mx;ry=my;_cur.style.opacity='1';}
});
_cur.style.opacity='0';_cur.style.transition='opacity .3s';

function wavyPath(cx,cy,baseR,waves,amp,phase,sx,sy){
  var n=90,pts=[];
  for(var i=0;i<=n;i++){
    var a=i/n*6.28318,wr=baseR+Math.sin(a*waves+phase)*amp;
    var ex=cx+Math.cos(a)*wr*(1+sx*Math.cos(a)*0.5);
    var ey=cy+Math.sin(a)*wr*(1+sy*Math.sin(a)*0.5);
    pts.push(ex.toFixed(1)+','+ey.toFixed(1));
  }
  return 'M '+pts.join(' L ')+' Z';
}

function tick(){
  _cur.style.transform='translate('+mx+'px,'+my+'px)';
  rx+=(mx-rx)*0.09;ry+=(my-ry)*0.09;
  var dx=rx-mx,dy=ry-my;
  cring.style.left=dx+'px';cring.style.top=dy+'px';
  cwaves.style.transform='translate('+(dx-80)+'px,'+(dy-80)+'px)';
  var dist=Math.sqrt(dx*dx+dy*dy),sm=Math.min(dist/80,1);
  var ang=Math.atan2(-dy,-dx),sx=Math.cos(ang)*sm*0.55,sy=Math.sin(ang)*sm*0.55;
  wt+=0.016;
  var cx=80,cy=80;
  wp1.setAttribute('d',wavyPath(cx,cy,18,5,2.2+sm*1.5,wt,sx,sy));
  wp2.setAttribute('d',wavyPath(cx,cy,28,4,2.8+sm*2,wt*0.78+1,sx*0.7,sy*0.7));
  wp3.setAttribute('d',wavyPath(cx,cy,38,6,1.8+sm*1.2,wt*0.62+2,sx*0.4,sy*0.4));
  var o1=(0.30+Math.sin(wt*1.2)*0.18+sm*0.14).toFixed(2);
  var o2=(0.14+Math.sin(wt*0.85+1)*0.08+sm*0.07).toFixed(2);
  var o3=(0.06+Math.sin(wt*0.65+2)*0.05+sm*0.04).toFixed(2);
  wp1.setAttribute('stroke','rgba(201,169,110,'+o1+')');wp1.setAttribute('stroke-width',(0.8+sm*0.4).toFixed(1));
  wp2.setAttribute('stroke','rgba(201,169,110,'+o2+')');wp2.setAttribute('stroke-width',(0.65+sm*0.3).toFixed(1));
  wp3.setAttribute('stroke','rgba(201,169,110,'+o3+')');wp3.setAttribute('stroke-width',(0.5+sm*0.2).toFixed(1));
  requestAnimationFrame(tick);
}
tick();

document.querySelectorAll('a,.btn-prim,.btn-ghost,.nav-cta,.cat-item,.prod-card,.tech-card,.setup-prev-card,.news-card,.audio-btn,.freq-play,.dist-card,.form-submit,.form-input,.dist-web,.sec-lnk,.t-lnk,.setup-cta-btn').forEach(function(el){
  el.addEventListener('mouseenter',function(){cring.style.width='50px';cring.style.height='50px';cring.style.borderColor='rgba(201,169,110,0.7)';});
  el.addEventListener('mouseleave',function(){cring.style.width='26px';cring.style.height='26px';cring.style.borderColor='rgba(201,169,110,0.5)';});
});

window.addEventListener('scroll',function(){document.getElementById('nav').classList.toggle('on',scrollY>40);});

var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.07});
document.querySelectorAll('.reveal').forEach(function(el){ro.observe(el);});

// AUDIO ICON
var acanvas=document.getElementById('audio-canvas'),a2d=acanvas.getContext('2d');
var iW=56,iH=36,iT=0,iMuted=true;
function drawIcon(){
  a2d.clearRect(0,0,iW,iH);
  var bars=5,bW=2.5,gap=(iW-bars*bW)/(bars+1),maxH=iH*0.78,minH=iH*0.1;
  var pat=[0.28,0.82,1,0.68,0.28];
  for(var i=0;i<bars;i++){
    var x=gap+i*(bW+gap);
    var h=iMuted?minH*0.6:minH+(maxH-minH)*pat[i]*(0.5+0.5*Math.sin(iT*1.9+i*0.55));
    var y=(iH-h)/2;
    a2d.fillStyle=iMuted?'rgba(201,169,110,0.25)':'rgba(201,169,110,0.85)';
    a2d.beginPath();
    if(a2d.roundRect)a2d.roundRect(x,y,bW,h,1.2);else a2d.rect(x,y,bW,h);
    a2d.fill();
  }
  iT+=0.05;requestAnimationFrame(drawIcon);
}
drawIcon();

// AUDIO ENGINE
var AC=window.AudioContext||window.webkitAudioContext;
var actx=null,master=null,playing=false,audioStarted=false;

function makeIR(dur,dec){
  var len=Math.floor(actx.sampleRate*dur),buf=actx.createBuffer(2,len,actx.sampleRate);
  for(var c=0;c<2;c++){var d=buf.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,dec);}
  var cv=actx.createConvolver();cv.buffer=buf;return cv;
}

function startAudio(){
  if(audioStarted)return;
  audioStarted=true;
  actx=new AC();
  master=actx.createGain();
  master.gain.setValueAtTime(0,actx.currentTime);
  master.gain.linearRampToValueAtTime(0.44,actx.currentTime+4);
  master.connect(actx.destination);
  var rev=makeIR(5,2.2),revG=actx.createGain();revG.gain.value=0.65;rev.connect(revG);revG.connect(master);
  var dry=actx.createGain();dry.gain.value=0.16;dry.connect(master);

  // A minor pentatonic — all voices start simultaneously, stagger gain
  var chord=[220,261.63,293.66,329.63,392,440,523.25,659.25];
  chord.forEach(function(f,i){
    var o=actx.createOscillator(),e=actx.createGain(),lfo=actx.createOscillator(),lg=actx.createGain();
    o.type='sine';o.frequency.value=f;o.detune.value=(i%3-1)*4;
    lfo.type='sine';lfo.frequency.value=0.06+i*0.012;lg.gain.value=0.004;
    lfo.connect(lg);lg.connect(e.gain);lfo.start();
    var vol=0.048-i*0.004;
    // All voices fade in quickly — 1.5s max, stagger by only 0.2s
    e.gain.setValueAtTime(0,actx.currentTime);
    e.gain.linearRampToValueAtTime(vol,actx.currentTime+1.0+i*0.2);
    o.connect(e);
    if(i>=4){e.connect(rev);var dg=actx.createGain();dg.gain.value=0.05;e.connect(dg);dg.connect(master);}
    else{e.connect(rev);e.connect(dry);}
    o.start();
  });

  function shimmer(){
    var ff=[880,1046.5,1174.66,1318.51,1568,1760,2093];
    var f=ff[Math.floor(Math.random()*ff.length)];
    var o=actx.createOscillator(),e=actx.createGain();
    o.type='sine';o.frequency.value=f;
    var dur=10+Math.random()*8;
    e.gain.setValueAtTime(0,actx.currentTime);
    e.gain.linearRampToValueAtTime(0.018,actx.currentTime+dur*0.25);
    e.gain.linearRampToValueAtTime(0,actx.currentTime+dur);
    o.connect(e);e.connect(rev);o.start();o.stop(actx.currentTime+dur);
    setTimeout(shimmer,4000+Math.random()*7000);
  }
  setTimeout(shimmer,2000);

  var nb=actx.createBuffer(1,actx.sampleRate*4,actx.sampleRate);
  var nd=nb.getChannelData(0);for(var j=0;j<nd.length;j++)nd[j]=(Math.random()*2-1)*0.08;
  var ns=actx.createBufferSource();ns.buffer=nb;ns.loop=true;
  var hp=actx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1000;hp.Q.value=0.5;
  var ng=actx.createGain();ng.gain.value=0.004;
  ns.connect(hp);hp.connect(ng);ng.connect(rev);ns.start();

  playing=true;iMuted=false;
}

// Auto-start on first user interaction (gesture required by browsers)
var heroTriggered=false;
function tryAutoStart(){
  if(heroTriggered)return;
  heroTriggered=true;
  startAudio();
}
// Trigger on first scroll OR first click anywhere
window.addEventListener('scroll',function(){
  if(scrollY>window.innerHeight*0.3)tryAutoStart();
},{passive:true,once:true});
// Fallback: first click anywhere starts it silently
document.addEventListener('click',tryAutoStart,{once:true});

document.getElementById('audioBtn').addEventListener('click',function(){
  if(!audioStarted){startAudio();return;}
  if(playing){
    master.gain.linearRampToValueAtTime(0,actx.currentTime+2);
    playing=false;iMuted=true;
  } else {
    master.gain.linearRampToValueAtTime(0.44,actx.currentTime+2);
    playing=true;iMuted=false;
  }
});

function clk(){
  if(!actx)return;
  var o=actx.createOscillator(),e=actx.createGain();
  o.type='sine';o.frequency.setValueAtTime(1100,actx.currentTime);
  o.frequency.exponentialRampToValueAtTime(280,actx.currentTime+0.065);
  e.gain.setValueAtTime(0.07,actx.currentTime);e.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.065);
  o.connect(e);e.connect(actx.destination);o.start();o.stop(actx.currentTime+0.065);
}
document.querySelectorAll('.btn-prim,.btn-ghost,.cat-item,.freq-play,.form-submit,.setup-cta-btn').forEach(function(el){el.addEventListener('click',clk);});



// SECTION HEADING LINE DRAW on scroll-reveal
var sdObs=new IntersectionObserver(function(es){
  es.forEach(function(e){
    if(e.isIntersecting){
      var w=e.target.querySelector('.sec-draw-line');
      if(w)setTimeout(function(){e.target.classList.add('drawn');},200);
    }
  });
},{threshold:0.3});
document.querySelectorAll('.sec-h-wrap').forEach(function(el){sdObs.observe(el);});





// ── SCROLL-DRIVEN ACCENT LINE ─────────────────────────────────────────
var acCanvas = document.getElementById('accent-line');
if (acCanvas) {
  var acCtx = acCanvas.getContext('2d');
  var acScroll = 0, acTarget = 0, acVel = 0, acPrevScroll = 0;
  var acT = 0;

  function resizeAccent() {
    acCanvas.width = 2;
    acCanvas.height = window.innerHeight;
  }
  resizeAccent();
  window.addEventListener('resize', resizeAccent);

  window.addEventListener('scroll', function() {
    var now = scrollY;
    acVel = Math.abs(now - acPrevScroll);
    acPrevScroll = now;
    acTarget = Math.min(acVel * 0.8, 12);
  }, { passive: true });

  function drawAccentLine() {
    var w = acCanvas.width, h = acCanvas.height;
    acCtx.clearRect(0, 0, w, h);

    // Smooth velocity decay
    acScroll += (acTarget - acScroll) * 0.06;
    acTarget *= 0.88;
    acT += 0.025;

    var amp = acScroll;
    var n = Math.ceil(h / 3);

    acCtx.beginPath();
    for (var i = 0; i <= n; i++) {
      var y = (i / n) * h;
      var phase = (y / h) * Math.PI * 8 + acT;
      // Amplitude fades at top and bottom edges
      var edge = Math.sin((y / h) * Math.PI);
      var x = 1 + Math.sin(phase) * amp * edge;
      i === 0 ? acCtx.moveTo(x, y) : acCtx.lineTo(x, y);
    }

    var grad = acCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,   'rgba(201,169,110,0)');
    grad.addColorStop(0.25,'rgba(201,169,110,0.55)');
    grad.addColorStop(0.5, 'rgba(201,169,110,0.7)');
    grad.addColorStop(0.75,'rgba(201,169,110,0.55)');
    grad.addColorStop(1,   'rgba(201,169,110,0)');
    acCtx.strokeStyle = grad;
    acCtx.lineWidth = 1;
    acCtx.stroke();

    requestAnimationFrame(drawAccentLine);
  }
  drawAccentLine();
}





// ── SCROLL PROGRESS WAVEFORM ─────────────────────────────────────────
// Replaces the scroll indicator — shows page position as waveform amplitude
// Flat at top, grows as you scroll deeper, full oscillation at bottom
(function() {
  var sw = document.getElementById('scroll-wave');
  if (!sw) return;
  var ctx = sw.getContext('2d');
  var h = window.innerHeight;
  var t = 0;
  var scrollProg = 0; // 0 = top, 1 = bottom
  var shown = false;

  function resize() {
    sw.width = 14;
    sw.height = window.innerHeight;
    h = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('scroll', function() {
    var maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProg = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
    if (!shown && scrollY > 40) {
      shown = true;
      sw.style.opacity = '1';
    }
  }, { passive: true });

  function drawScrollWave() {
    ctx.clearRect(0, 0, 20, h);
    t += 0.018;

    var cx = 7; // centre x of the 14px canvas
    var n = h;

    // Gradient along height
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,   'rgba(201,169,110,0)');
    grad.addColorStop(0.15,'rgba(201,169,110,0.4)');
    grad.addColorStop(scrollProg * 0.9 + 0.05, 'rgba(201,169,110,0.7)');
    grad.addColorStop(Math.min(scrollProg + 0.05, 1), 'rgba(201,169,110,0.15)');
    grad.addColorStop(1,   'rgba(201,169,110,0)');

    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var y = i;
      var frac = i / h; // 0 = top, 1 = bottom

      // Amplitude: near zero at top, grows with scroll progress
      // Only animate below the current scroll position
      var maxAmp = 4.0;
      var amp;
      if (frac <= scrollProg) {
        // Scrolled region: full wave
        amp = maxAmp * Math.sin(frac * Math.PI); // fade at edges
      } else {
        // Unscrolled region: flat line
        amp = 0;
      }

      var wave = Math.sin(frac * Math.PI * 10 + t) * amp
               + Math.sin(frac * Math.PI * 6  + t * 0.7) * amp * 0.4;
      var x = cx + wave;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Progress dot — champagne circle at current scroll position
    var dotY = scrollProg * h;
    ctx.beginPath();
    ctx.arc(cx, dotY, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201,169,110,0.9)';
    ctx.fill();

    requestAnimationFrame(drawScrollWave);
  }
  drawScrollWave();

  // Click to jump to page position
  sw.style.pointerEvents = 'auto';
  sw.style.cursor = 'pointer';
  sw.addEventListener('click', function(e) {
    var rect = sw.getBoundingClientRect();
    var pct = (e.clientY - rect.top) / rect.height;
    var maxScroll = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({ top: pct * maxScroll, behavior: 'smooth' });
  });
})();

// ── WAVEFORM SCRUBBER ────────────────────────────────────────────────
(function() {
  var wrap = document.getElementById('wsWrap');
  var canvas = document.getElementById('wsCanvas');
  var freqEl = document.getElementById('wsFreq');
  var descEl = document.getElementById('wsDesc');
  var playBtn = document.getElementById('wsPlay');
  var playLabel = document.getElementById('wsPlayLabel');
  var playDot = document.getElementById('wsPlayDot');
  if (!wrap || !canvas) return;

  var ctx2 = canvas.getContext('2d');
  var W = 0, H = 52;
  var hovX = -1;
  var wsPlaying = false;
  var wsOsc = null, wsGain = null;
  var animT = 0;
  var currentFreq = 1000;

  // Resize canvas to container width
  function resizeWS() {
    W = wrap.offsetWidth;
    canvas.width = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx2.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  // Wait for element to be in DOM and sized
  var resizeObs = new ResizeObserver(function() { resizeWS(); });
  resizeObs.observe(wrap);
  resizeWS();

  var freqRanges = [
    { max: 80,    label: '— Hz',  desc: 'Sub-bass — felt more than heard. Cinema rumble, the physical weight of sound.' },
    { max: 200,   label: '— Hz',  desc: 'Bass — warmth, body, and weight. The low-end character of a speaker.' },
    { max: 500,   label: '— Hz',  desc: 'Low-midrange — fullness, male vocals, lower strings and piano.' },
    { max: 2000,  label: '— kHz', desc: 'Midrange — the human voice, acoustic instruments, presence and detail.' },
    { max: 5000,  label: '— kHz', desc: 'Upper-midrange — definition, attack, consonants in speech.' },
    { max: 10000, label: '— kHz', desc: 'Treble — clarity, air, the shimmer of cymbals and high strings.' },
    { max: 20000, label: '— kHz', desc: 'High treble — the edge of human perception. Room ambience, breath, space.' }
  ];

  function pctToFreq(pct) {
    return Math.round(Math.exp(Math.log(40) + pct * (Math.log(18000) - Math.log(40))));
  }

  function formatFreq(f) {
    return f >= 1000 ? (f / 1000).toFixed(f < 10000 ? 1 : 0) + ' kHz' : f + ' Hz';
  }

  function getDesc(f) {
    for (var i = 0; i < freqRanges.length; i++) {
      if (f <= freqRanges[i].max) return freqRanges[i].desc;
    }
    return 'Ultra-high.';
  }

  // Generate a stable pseudo-random waveform shape (seed-based)
  // Looks like an audio file — varied amplitude across the width
  var wavePoints = [];
  function buildWaveShape(w) {
    wavePoints = [];
    var seed = 42;
    function rand() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
    var chunks = Math.floor(w / 3);
    for (var i = 0; i <= chunks; i++) {
      // Higher frequencies (right side) = more dense/complex waveform
      var xFrac = i / chunks;
      var baseAmp = 0.15 + rand() * 0.7;
      // Right side slightly denser (higher freq = more complex)
      var freqMod = 0.7 + xFrac * 0.5;
      wavePoints.push(baseAmp * freqMod);
    }
  }

  function drawWaveform(highlightX) {
    if (W === 0) return;
    ctx2.clearRect(0, 0, W, H);
    animT += 0.04;

    var mid = H / 2;
    var maxAmp = H * 0.42;

    if (wavePoints.length === 0) buildWaveShape(W);

    // Draw waveform bars — style like a DAW waveform
    var barW = 2;
    var gap = 1;
    var step = barW + gap;
    var n = Math.floor(W / step);

    for (var i = 0; i < n; i++) {
      var x = i * step;
      var frac = i / n;
      var wIdx = Math.floor(frac * (wavePoints.length - 1));
      var amp = wavePoints[wIdx] * maxAmp;

      // Gentle breathing animation when not hovering
      if (highlightX < 0) {
        amp *= 0.9 + Math.sin(animT + frac * Math.PI * 3) * 0.08;
      }

      var isHighlighted = highlightX >= 0 && Math.abs(x - highlightX) < 40;
      var isPast = highlightX >= 0 && x < highlightX;

      var alpha;
      if (isPast) {
        alpha = 0.7; // played region
      } else if (isHighlighted) {
        // Glow region around playhead
        var dist = Math.abs(x - highlightX);
        alpha = 0.9 - dist / 40 * 0.4;
        amp *= 1.15 + (1 - dist / 40) * 0.15;
      } else {
        alpha = 0.22;
      }

      ctx2.fillStyle = 'rgba(201,169,110,' + alpha.toFixed(2) + ')';
      ctx2.fillRect(x, mid - amp, barW, amp * 2);
    }

    // Playhead needle — sharp champagne line + label
    if (highlightX >= 0 && highlightX <= W) {
      // Needle line
      ctx2.strokeStyle = 'rgba(201,169,110,0.9)';
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(highlightX, 0);
      ctx2.lineTo(highlightX, H);
      ctx2.stroke();

      // Needle dot at centre
      ctx2.beginPath();
      ctx2.arc(highlightX, mid, 3, 0, Math.PI * 2);
      ctx2.fillStyle = '#c9a96e';
      ctx2.fill();
    }

    // Frequency axis labels — min/max
    ctx2.font = '9px DM Mono, monospace';
    ctx2.fillStyle = 'rgba(201,169,110,0.28)';
    ctx2.fillText('40 Hz', 4, H - 4);
    ctx2.textAlign = 'right';
    ctx2.fillText('18 kHz', W - 4, H - 4);
    ctx2.textAlign = 'left';

    requestAnimationFrame(function() { drawWaveform(hovX); });
  }

  // Mouse interaction
  wrap.addEventListener('mousemove', function(e) {
    var rect = wrap.getBoundingClientRect();
    hovX = e.clientX - rect.left;
    var pct = Math.max(0, Math.min(1, hovX / W));
    currentFreq = pctToFreq(pct);
    freqEl.textContent = formatFreq(currentFreq);
    descEl.textContent = getDesc(currentFreq);
    if (wsPlaying && wsOsc) wsOsc.frequency.setValueAtTime(currentFreq, actx.currentTime);
  });

  wrap.addEventListener('mouseleave', function() {
    hovX = -1;
    freqEl.textContent = '— kHz';
    descEl.textContent = 'Hover anywhere on the waveform to explore frequencies';
  });

  wrap.addEventListener('click', function() {
    if (!actx) startAudio();
    if (wsPlaying) {
      wsGain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.1);
      wsPlaying = false;
      playLabel.textContent = 'Play tone';
      playDot.style.background = '#c9a96e';
      setTimeout(function() { if (wsOsc) { wsOsc.stop(); wsOsc = null; } }, 150);
    } else {
      wsOsc = actx.createOscillator();
      wsGain = actx.createGain();
      wsOsc.type = 'sine';
      wsOsc.frequency.value = currentFreq;
      wsGain.gain.setValueAtTime(0, actx.currentTime);
      wsGain.gain.linearRampToValueAtTime(0.14, actx.currentTime + 0.08);
      wsOsc.connect(wsGain);
      wsGain.connect(actx.destination);
      wsOsc.start();
      wsPlaying = true;
      playLabel.textContent = 'Stop';
      playDot.style.background = '#e8c97e';
    }
    clk();
  });

  playBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!actx) startAudio();
    if (wsPlaying) {
      wsGain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.1);
      wsPlaying = false;
      playLabel.textContent = 'Play tone';
      playDot.style.background = '#c9a96e';
      setTimeout(function() { if (wsOsc) { wsOsc.stop(); wsOsc = null; } }, 150);
    } else {
      wsOsc = actx.createOscillator();
      wsGain = actx.createGain();
      wsOsc.type = 'sine';
      wsOsc.frequency.value = currentFreq;
      wsGain.gain.setValueAtTime(0, actx.currentTime);
      wsGain.gain.linearRampToValueAtTime(0.14, actx.currentTime + 0.08);
      wsOsc.connect(wsGain);
      wsGain.connect(actx.destination);
      wsOsc.start();
      wsPlaying = true;
      playLabel.textContent = 'Stop';
      playDot.style.background = '#e8c97e';
    }
    clk();
  });

  buildWaveShape(800); // initial build
  drawWaveform(-1);
})();


// ── WAVE DIVIDERS ────────────────────────────────────────────────────
(function() {
  var dividers = document.querySelectorAll('.wave-divider');
  var wdT = 0;
  // Each divider gets a slightly different phase and frequency
  // so they all look distinct but related
  var configs = [
    { freq: 2.8, amp: 3.2, speed: 0.007, phase: 0 },
    { freq: 3.4, amp: 2.6, speed: 0.009, phase: 1.2 },
    { freq: 2.2, amp: 3.8, speed: 0.006, phase: 2.4 },
    { freq: 3.8, amp: 2.2, speed: 0.011, phase: 0.8 },
    { freq: 2.6, amp: 3.0, speed: 0.008, phase: 1.8 },
  ];

  function resizeAll() {
    dividers.forEach(function(cv) {
      cv.width = cv.offsetWidth * (window.devicePixelRatio || 1);
      cv.height = 28 * (window.devicePixelRatio || 1);
    });
  }
  resizeAll();
  window.addEventListener('resize', resizeAll);

  function drawDividers() {
    wdT += 0.012;
    dividers.forEach(function(cv, i) {
      var cfg = configs[i % configs.length];
      var ctx = cv.getContext('2d');
      var W = cv.width, H = cv.height;
      var dpr = window.devicePixelRatio || 1;
      var w = W / dpr, h = H / dpr;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(dpr, dpr);

      var mid = h / 2;
      var t = wdT * cfg.speed / 0.012; // each has own speed

      // Main wave
      ctx.beginPath();
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0,    'rgba(201,169,110,0)');
      grad.addColorStop(0.12, 'rgba(201,169,110,0.35)');
      grad.addColorStop(0.5,  'rgba(201,169,110,0.55)');
      grad.addColorStop(0.88, 'rgba(201,169,110,0.35)');
      grad.addColorStop(1,    'rgba(201,169,110,0)');

      for (var x = 0; x <= w; x += 1) {
        var xf = x / w;
        // Edge fade envelope
        var env = Math.sin(xf * Math.PI);
        var y = mid
          + Math.sin(xf * Math.PI * cfg.freq * 2 + wdT + cfg.phase) * cfg.amp * env
          + Math.sin(xf * Math.PI * cfg.freq * 3.3 + wdT * 0.7 + cfg.phase) * cfg.amp * 0.35 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Second harmonic — fainter, offset phase
      ctx.beginPath();
      var grad2 = ctx.createLinearGradient(0, 0, w, 0);
      grad2.addColorStop(0,   'rgba(201,169,110,0)');
      grad2.addColorStop(0.2, 'rgba(201,169,110,0.12)');
      grad2.addColorStop(0.5, 'rgba(201,169,110,0.2)');
      grad2.addColorStop(0.8, 'rgba(201,169,110,0.12)');
      grad2.addColorStop(1,   'rgba(201,169,110,0)');

      for (var x = 0; x <= w; x += 1) {
        var xf = x / w;
        var env = Math.sin(xf * Math.PI);
        var y = mid
          + Math.sin(xf * Math.PI * cfg.freq * 1.7 + wdT * 1.1 + cfg.phase + 1.5) * cfg.amp * 0.5 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      ctx.restore();
    });
    requestAnimationFrame(drawDividers);
  }
  drawDividers();
})();

})();

    })()
  }, [])

  return null
}
