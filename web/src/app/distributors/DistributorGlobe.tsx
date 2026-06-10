'use client'

import { useEffect, useRef, useState } from 'react'

const DIST = [
  { name:'Miantic AV', region:'South Asia', coverage:'All India (excl. Delhi NCR)', city:'Mumbai', lat:19.076, lng:72.877, color:'#c9a96e', countries:[356], phone:'+91 9211 218 313', email:'info@miantic.com', web:'https://www.miantic.com' },
  { name:'Sound N Style', region:'South Asia', coverage:'Delhi NCR', city:'Delhi', lat:28.613, lng:77.209, color:'#c9a96e', countries:[356], phone:'+91 9212 268 632', email:'info@soundnstyle.in', web:null },
  { name:'Smart Age', region:'Southeast Asia', coverage:'Philippines', city:'Manila', lat:14.599, lng:120.984, color:'#7bbfa5', countries:[608], phone:'+63 917 187 2791', email:null, web:'https://www.smartage.ph' },
  { name:'GES Equinox', region:'Middle East', coverage:'Lebanon & MENA', city:'Beirut', lat:33.889, lng:35.495, color:'#e8856a', countries:[422,682,784,512,275,400,368,760,887,48,414,634,196,706], phone:'+971 4 884 9593', email:'info@geslb.com', web:'https://geslb.com' },
  { name:'Avation', region:'Oceania', coverage:'Australia & NZ', city:'Sydney', lat:-33.868, lng:151.209, color:'#6a8fd8', countries:[36,554], phone:'+61 7 5580 3300', email:'info@avation.com.au', web:'https://avation.com.au' },
  { name:'RGB Communications', region:'Europe', coverage:'UK & Europe', city:'London', lat:51.507, lng:-0.127, color:'#9d7de8', countries:[826,276,250,380,724,620,56,528,56,40,756,203,300,348,703,616,428,440,372,233,246,208,578,752,642,100,191,688,807,705,70,705], phone:'+44 1488 73366', email:'sales@rgbcomms.co.uk', web:'https://www.rgbcomms.co.uk' },
  { name:'Pro Act Sales', region:'North America', coverage:'United States', city:'New York', lat:40.712, lng:-74.006, color:'#e87d7d', countries:[840], phone:'+1 516 352 7533', email:'info@proactsales.com', web:'https://www.proactsales.com' },
  { name:'XSCACE Direct', region:'North America', coverage:'Canada', city:'Toronto', lat:43.651, lng:-79.383, color:'#e87d7d', countries:[124], phone:'+1 587 885 3303', email:'support@xscace.com', web:null },
]

type Dist = typeof DIST[0]

export default function DistributorGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<Dist | null>(null)
  const stateRef = useRef({
    rotLng: -20, rotLat: 20,
    velLng: 0.12, velLat: 0,
    dragging: false, lastX: 0, lastY: 0,
    selected: null as Dist | null,
    raf: 0,
    countries: null as any,
    land: null as any,
    d3: null as any,
  })

  useEffect(() => {
    const s = stateRef.current
    const canvas = canvasRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = canvas.offsetWidth
    const H = Math.round(W * 0.65)
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // Load D3
    const loadD3 = new Promise<void>(resolve => {
      if ((window as any).d3) { resolve(); return }
      const sc = document.createElement('script')
      sc.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js'
      sc.onload = () => resolve()
      document.head.appendChild(sc)
    })

    // Load topojson
    const loadTopo = new Promise<void>(resolve => {
      if ((window as any).topojson) { resolve(); return }
      const sc = document.createElement('script')
      sc.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js'
      sc.onload = () => resolve()
      document.head.appendChild(sc)
    })

    Promise.all([loadD3, loadTopo]).then(async () => {
      const d3 = (window as any).d3
      const topojson = (window as any).topojson
      s.d3 = d3

      const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json())
      
      // Individual countries as features (each has id = numeric ISO code)
      s.countries = topojson.feature(world, world.objects.countries).features
      // Land for fallback
      s.land = topojson.feature(world, world.objects.land)

      startLoop(d3, ctx, W, H)
    })

    function makeProjection(d3: any, W: number, H: number) {
      return d3.geoOrthographic()
        .scale(Math.min(W, H) * 0.42)
        .translate([W / 2, H / 2])
        .rotate([s.rotLng, -s.rotLat, 0])
        .clipAngle(90)
    }

    function draw(d3: any, ctx: CanvasRenderingContext2D, W: number, H: number) {
      ctx.clearRect(0, 0, W, H)
      const proj = makeProjection(d3, W, H)
      const path = d3.geoPath(proj, ctx)
      const t = performance.now() / 1000
      const sel = s.selected

      // Sphere bg
      ctx.beginPath(); path({ type: 'Sphere' })
      const grad = ctx.createRadialGradient(W * 0.38, H * 0.33, 2, W / 2, H / 2, Math.min(W, H) * 0.42)
      grad.addColorStop(0, '#111111')
      grad.addColorStop(1, '#090909')
      ctx.fillStyle = grad; ctx.fill()

      // Graticule
      const graticule = d3.geoGraticule().step([15, 15])
      ctx.beginPath(); path(graticule())
      ctx.strokeStyle = 'rgba(201,169,110,0.065)'; ctx.lineWidth = 0.5; ctx.stroke()

      // Draw all countries
      if (s.countries) {
        for (const feature of s.countries) {
          const id = +feature.id

          // Find which distributor covers this country
          const dist = DIST.find(d => d.countries.includes(id))

          ctx.beginPath(); path(feature)

          if (dist) {
            // Covered country — glow fill
            const isThisSel = sel?.name === dist.name
            const pulse = 0.5 + Math.sin(t * 2 + dist.lat * 0.1) * 0.15

            if (isThisSel) {
              // Selected region — brighter, animated
              const selPulse = 0.7 + Math.sin(t * 3) * 0.2
              ctx.fillStyle = dist.color
              ctx.globalAlpha = selPulse * 0.55
              ctx.fill()
              ctx.strokeStyle = dist.color
              ctx.lineWidth = 1
              ctx.globalAlpha = selPulse * 0.8
              ctx.stroke()
            } else {
              ctx.fillStyle = dist.color
              ctx.globalAlpha = pulse * 0.18
              ctx.fill()
              ctx.strokeStyle = dist.color
              ctx.lineWidth = 0.6
              ctx.globalAlpha = 0.35
              ctx.stroke()
            }
            ctx.globalAlpha = 1
          } else {
            // Uncovered country — dark fill
            ctx.fillStyle = 'rgba(201,169,110,0.05)'
            ctx.fill()
            ctx.strokeStyle = 'rgba(201,169,110,0.12)'
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      }

      // Sphere border
      ctx.beginPath(); path({ type: 'Sphere' })
      ctx.strokeStyle = 'rgba(201,169,110,0.18)'; ctx.lineWidth = 1; ctx.stroke()

      // City labels for covered regions
      if (s.countries) {
        for (const d of DIST) {
          const coords = proj([d.lng, d.lat])
          if (!coords) continue
          const visible = d3.geoDistance([d.lng, d.lat], proj.invert([W / 2, H / 2])!) < Math.PI / 2
          if (!visible) continue

          const [px, py] = coords
          const isSel = sel?.name === d.name

          if (isSel) {
            // Show city label
            ctx.font = '500 10px DM Mono, monospace'
            ctx.fillStyle = d.color
            ctx.globalAlpha = 0.95
            const lx = px > W / 2 ? px - 8 : px + 8
            ctx.textAlign = px > W / 2 ? 'right' : 'left'
            ctx.fillText(d.coverage.toUpperCase(), lx, py - 4)
            ctx.globalAlpha = 1
            ctx.textAlign = 'left'
          }
        }
      }
    }

    function startLoop(d3: any, ctx: CanvasRenderingContext2D, W: number, H: number) {
      function loop() {
        if (!s.dragging) {
          s.rotLng += s.velLng
          s.rotLat += s.velLat
          s.velLng *= 0.97
          s.velLat *= 0.97
          s.rotLat = Math.max(-70, Math.min(70, s.rotLat))
        }
        draw(d3, ctx, W, H)
        s.raf = requestAnimationFrame(loop)
      }
      loop()
    }

    const onDown = (e: MouseEvent) => {
      s.dragging = true; s.lastX = e.clientX; s.lastY = e.clientY
      s.velLng = 0; s.velLat = 0
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e: MouseEvent) => {
      if (!s.dragging) return
      const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY
      s.rotLng += dx * 0.3; s.rotLat -= dy * 0.3
      s.rotLat = Math.max(-70, Math.min(70, s.rotLat))
      s.velLng = dx * 0.2; s.velLat = -dy * 0.2
      s.lastX = e.clientX; s.lastY = e.clientY
    }
    const onUp = () => { s.dragging = false; canvas.style.cursor = 'grab' }

    const onClick = (e: MouseEvent) => {
      if (!s.d3 || !s.countries) return
      const d3 = s.d3
      const rect = canvas.getBoundingClientRect()
      const scaleX = (canvas.width / dpr) / rect.width
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleX

      const proj = makeProjection(d3, W, H)
      const inverted = proj.invert([mx, my])
      if (!inverted) return

      const [clickLng, clickLat] = inverted

      // Find which distributor territory was clicked
      let hit: Dist | null = null
      for (const feature of s.countries) {
        const id = +feature.id
        const dist = DIST.find(d => d.countries.includes(id))
        if (!dist) continue
        if (d3.geoContains(feature, [clickLng, clickLat])) {
          hit = dist; break
        }
      }

      if (hit) {
        const next = s.selected?.name === hit.name ? null : hit
        s.selected = next; setSelected(next)
      } else {
        s.selected = null; setSelected(null)
      }
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(s.raf)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  const spinTo = (d: Dist) => {
    const s = stateRef.current
    const next = s.selected?.name === d.name ? null : d
    s.selected = next
    if (next) {
      s.rotLng = -d.lng
      s.rotLat = d.lat * 0.6
    }
    s.velLng = 0; s.velLat = 0
    setSelected(next)
  }

  return (
    <div className="globe-section">
      <div className="globe-wrap">
        <canvas
          ref={canvasRef}
          className="globe-canvas"
          style={{ cursor: 'grab', display: 'block', width: '100%' }}
        />
        <div className="globe-hint">Drag to rotate · Click a region to explore</div>
      </div>

      <div className="globe-cards">
        {DIST.map(d => (
          <div
            key={d.name}
            className={`globe-card${selected?.name === d.name ? ' active' : ''}`}
            onClick={() => spinTo(d)}
          >
            <div className="gc-dot" style={{ background: d.color }} />
            <div className="gc-body">
              <div className="gc-region">{d.region}</div>
              <div className="gc-name">{d.name}</div>
              <div className="gc-coverage">{d.coverage}</div>
              {selected?.name === d.name && (
                <div className="gc-detail">
                  {d.phone && <div className="gc-row">↗ {d.phone}</div>}
                  {d.email && <a href={`mailto:${d.email}`} className="gc-row gc-link">{d.email}</a>}
                  {d.web && <a href={d.web} target="_blank" rel="noopener" className="gc-row gc-link">{d.web.replace('https://www.', '').replace('https://', '')}</a>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
