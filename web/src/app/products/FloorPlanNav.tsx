'use client'
import { useState, useEffect } from 'react'

export interface Room {
  id: string
  label: string
  sublabel: string
  categories: string[]
  labelX: number
  labelY: number
}

export const ROOMS: Room[] = [
  { id:'living',    label:'Living Room',    sublabel:'Slim Array · In-Wall · Subwoofer', categories:['slim-array','in-wall','subwoofer-series'], labelX:152, labelY:175 },
  { id:'cinema',    label:'Home Cinema',    sublabel:'In-Wall · Subwoofer · Slim Array', categories:['in-wall','subwoofer-series','slim-array'],   labelX:152, labelY:370 },
  { id:'bedroom',   label:'Bedroom',        sublabel:'Slim Array · In-Ceiling',          categories:['slim-array','in-ceiling'],                   labelX:430, labelY:130 },
  { id:'wardrobe',  label:'Wardrobe / Bath',sublabel:'In-Ceiling',                       categories:['in-ceiling'],                               labelX:430, labelY:285 },
  { id:'dining',    label:'Dining',         sublabel:'In-Ceiling · Slim Array',          categories:['in-ceiling','slim-array'],                   labelX:430, labelY:420 },
  { id:'outdoor',   label:'Outdoor',        sublabel:'Outdoor · Subwoofer',              categories:['outdoor','subwoofer-series'],                labelX:672, labelY:150 },
  { id:'party',     label:'Party Zone',     sublabel:'Outdoor · Subwoofer',              categories:['outdoor','subwoofer-series'],                labelX:672, labelY:330 },
  { id:'server',    label:'Server Room',    sublabel:'Amplifiers · Streamers',           categories:['amplifier-series'],                         labelX:672, labelY:470 },
]

// Each room: outer wall path, inner floor fill, doors, windows, furniture SVG
const SHAPES: Record<string,{
  wall:string; fill:string;
  doors:{x:number;y:number;r:number;startAngle:number;sweep:number}[];
  windows:{x1:number;y1:number;x2:number;y2:number}[];
  furniture:React.ReactNode;
}> = {
  living: {
    wall:'M40,40 L265,40 L265,300 L40,300 Z',
    fill:'M44,44 L261,44 L261,296 L44,296 Z',
    doors:[{x:263,y:160,r:36,startAngle:180,sweep:0}],
    windows:[{x1:70,y1:40,x2:150,y2:40},{x1:170,y1:40,x2:240,y2:40}],
    furniture:(
      <>
        {/* TV unit on back wall */}
        <rect x="80" y="52" width="145" height="14" rx="1" fill="none" stroke="rgba(201,169,110,0.22)" strokeWidth="0.8"/>
        <rect x="136" y="66" width="33" height="30" rx="0" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.5"/>
        {/* L-sofa */}
        <rect x="60" y="190" width="130" height="42" rx="4" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.8"/>
        <rect x="58" y="190" width="42" height="76" rx="4" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.8"/>
        {/* Sofa back */}
        <rect x="60" y="185" width="130" height="10" rx="3" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        {/* Coffee table */}
        <rect x="116" y="155" width="70" height="36" rx="2" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.6"/>
        {/* Rug */}
        <ellipse cx="155" cy="200" rx="55" ry="40" fill="none" stroke="rgba(201,169,110,0.06)" strokeWidth="0.5" strokeDasharray="3 3"/>
        {/* Bookshelf */}
        <rect x="220" y="80" width="38" height="60" rx="1" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        {[0,1,2,3].map(i=><line key={i} x1="222" y1={86+i*14} x2="256" y2={86+i*14} stroke="rgba(201,169,110,0.08)" strokeWidth="0.4"/>)}
      </>
    ),
  },
  cinema: {
    wall:'M40,320 L265,320 L265,470 L40,470 Z',
    fill:'M44,324 L261,324 L261,466 L44,466 Z',
    doors:[{x:263,y:395,r:30,startAngle:180,sweep:0}],
    windows:[],
    furniture:(
      <>
        {/* Screen on back wall */}
        <rect x="55" y="330" width="195" height="30" rx="1" fill="none" stroke="rgba(201,169,110,0.35)" strokeWidth="1"/>
        <rect x="60" y="334" width="185" height="22" rx="0" fill="rgba(201,169,110,0.03)" stroke="rgba(201,169,110,0.1)" strokeWidth="0.4"/>
        {/* Seating rows */}
        {[0,1,2].map(r=>(
          <g key={r}>
            <rect x={60} y={376+r*26} width={185} height={18} rx="3" fill="none" stroke="rgba(201,169,110,0.15)" strokeWidth="0.7"/>
            {[0,1,2,3,4].map(s=><rect key={s} x={66+s*36} y={377+r*26} width={28} height={16} rx="3" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.4"/>)}
          </g>
        ))}
        {/* Projector on ceiling */}
        <rect x="130" y="325" width="44" height="10" rx="2" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.6"/>
      </>
    ),
  },
  bedroom: {
    wall:'M300,40 L570,40 L570,220 L300,220 Z',
    fill:'M304,44 L566,44 L566,216 L304,216 Z',
    doors:[{x:300,y:148,r:32,startAngle:0,sweep:1}],
    windows:[{x1:400,y1:40,x2:510,y2:40}],
    furniture:(
      <>
        {/* Bed */}
        <rect x="356" y="68" width="160" height="118" rx="5" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.9"/>
        {/* Headboard */}
        <rect x="356" y="64" width="160" height="24" rx="4" fill="none" stroke="rgba(201,169,110,0.22)" strokeWidth="0.8"/>
        {/* Pillows */}
        <rect x="366" y="70" width="62" height="28" rx="4" fill="none" stroke="rgba(201,169,110,0.15)" strokeWidth="0.6"/>
        <rect x="442" y="70" width="62" height="28" rx="4" fill="none" stroke="rgba(201,169,110,0.15)" strokeWidth="0.6"/>
        {/* Duvet fold */}
        <path d="M360 110 Q436 104 510 110" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.6"/>
        {/* Bedside tables */}
        <rect x="316" y="100" width="34" height="34" rx="2" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        <rect x="522" y="100" width="34" height="34" rx="2" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        {/* Lamp circles */}
        <circle cx="333" cy="105" r="8" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.5"/>
        <circle cx="539" cy="105" r="8" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.5"/>
        {/* Wardrobe on right */}
        <rect x="524" y="50" width="36" height="80" rx="1" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        <line x1="542" y1="50" x2="542" y2="130" stroke="rgba(201,169,110,0.07)" strokeWidth="0.4"/>
      </>
    ),
  },
  wardrobe: {
    wall:'M300,240 L570,240 L570,340 L300,340 Z',
    fill:'M304,244 L566,244 L566,336 L304,336 Z',
    doors:[{x:300,y:278,r:28,startAngle:0,sweep:1}],
    windows:[{x1:570,y1:258,x2:570,y2:308}],
    furniture:(
      <>
        {/* Wardrobe units */}
        <rect x="314" y="252" width="55" height="78" rx="1" fill="none" stroke="rgba(201,169,110,0.18)" strokeWidth="0.7"/>
        <rect x="374" y="252" width="55" height="78" rx="1" fill="none" stroke="rgba(201,169,110,0.18)" strokeWidth="0.7"/>
        <line x1="341" y1="252" x2="341" y2="330" stroke="rgba(201,169,110,0.08)" strokeWidth="0.4"/>
        <line x1="401" y1="252" x2="401" y2="330" stroke="rgba(201,169,110,0.08)" strokeWidth="0.4"/>
        {/* Handles */}
        {[341,401,429,457].map((x,i)=><rect key={i} x={x-3} y={284} width="6" height="2" rx="1" fill="rgba(201,169,110,0.2)"/>)}
        {/* Basin/sink suggestion */}
        <rect x="460" y="258" width="96" height="56" rx="3" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        <ellipse cx="508" cy="286" rx="24" ry="16" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.5"/>
        <circle cx="508" cy="280" r="4" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
      </>
    ),
  },
  dining: {
    wall:'M300,360 L570,360 L570,490 L300,490 Z',
    fill:'M304,364 L566,364 L566,486 L304,486 Z',
    doors:[{x:300,y:406,r:30,startAngle:0,sweep:1}],
    windows:[{x1:570,y1:380,x2:570,y2:450}],
    furniture:(
      <>
        {/* Dining table — oval */}
        <ellipse cx="435" cy="425" rx="95" ry="44" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.9"/>
        {/* Chairs */}
        {[[-95,0],[95,0],[-68,-36],[68,-36],[-68,36],[68,36],[0,-44],[0,44]].map(([dx,dy],i)=>(
          <ellipse key={i} cx={435+dx} cy={425+dy} rx="18" ry="13" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        ))}
        {/* Pendant light */}
        <line x1="435" y1="364" x2="435" y2="390" stroke="rgba(201,169,110,0.2)" strokeWidth="0.7"/>
        <ellipse cx="435" cy="394" rx="16" ry="6" fill="rgba(201,169,110,0.06)" stroke="rgba(201,169,110,0.25)" strokeWidth="0.7"/>
        {/* Sideboard */}
        <rect x="310" y="370" width="60" height="28" rx="1" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
      </>
    ),
  },
  outdoor: {
    wall:'M600,40 L790,40 L790,235 L600,235 Z',
    fill:'M604,44 L786,44 L786,231 L604,231 Z',
    doors:[{x:600,y:120,r:32,startAngle:0,sweep:1}],
    windows:[{x1:630,y1:40,x2:750,y2:40}],
    furniture:(
      <>
        {/* Trees */}
        <circle cx="622" cy="185" r="18" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.7"/>
        <circle cx="622" cy="175" r="14" fill="none" stroke="rgba(201,169,110,0.08)" strokeWidth="0.5"/>
        <line x1="622" y1="198" x2="622" y2="218" stroke="rgba(201,169,110,0.12)" strokeWidth="1"/>
        <circle cx="768" cy="185" r="18" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.7"/>
        <circle cx="768" cy="175" r="14" fill="none" stroke="rgba(201,169,110,0.08)" strokeWidth="0.5"/>
        <line x1="768" y1="198" x2="768" y2="218" stroke="rgba(201,169,110,0.12)" strokeWidth="1"/>
        {/* Pool */}
        <rect x="640" y="145" width="110" height="60" rx="8" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.7" strokeDasharray="4 3"/>
        {/* Outdoor seating */}
        <rect x="618" y="78" width="50" height="36" rx="3" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        <rect x="724" y="78" width="50" height="36" rx="3" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.6"/>
        {/* Low table */}
        <rect x="678" y="88" width="36" height="22" rx="2" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.5"/>
      </>
    ),
  },
  party: {
    wall:'M600,255 L790,255 L790,430 L600,430 Z',
    fill:'M604,259 L786,259 L786,426 L604,426 Z',
    doors:[{x:600,y:320,r:30,startAngle:0,sweep:1}],
    windows:[{x1:600,y1:270,x2:600,y2:320}],
    furniture:(
      <>
        {/* DJ booth / bar */}
        <rect x="616" y="265" width="158" height="30" rx="2" fill="none" stroke="rgba(201,169,110,0.25)" strokeWidth="0.9"/>
        <rect x="622" y="268" width="40" height="24" rx="1" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
        <rect x="668" y="268" width="40" height="24" rx="1" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
        <rect x="714" y="268" width="40" height="24" rx="1" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
        {/* Dance floor */}
        <rect x="618" y="310" width="156" height="106" rx="2" fill="rgba(201,169,110,0.015)" stroke="rgba(201,169,110,0.1)" strokeWidth="0.6" strokeDasharray="5 3"/>
        {[0,1,2,3].map(r=>[0,1,2,3].map(c=>(
          <rect key={`${r}-${c}`} x={620+c*38} y={312+r*25} width="36" height="23" rx="0"
            fill="none" stroke="rgba(201,169,110,0.05)" strokeWidth="0.3"/>
        )))}
        {/* Lighting rig dots */}
        {[640,670,700,730,760].map((x,i)=>(
          <circle key={i} cx={x} cy={260} r="3" fill="rgba(201,169,110,0.15)" stroke="rgba(201,169,110,0.3)" strokeWidth="0.5"/>
        ))}
      </>
    ),
  },
  server: {
    wall:'M600,450 L790,450 L790,540 L600,540 Z',
    fill:'M604,454 L786,454 L786,536 L604,536 Z',
    doors:[{x:668,y:450,r:26,startAngle:90,sweep:0}],
    windows:[],
    furniture:(
      <>
        {/* Server racks */}
        {[614,648,682,716,750].map((x,i)=>(
          <g key={i}>
            <rect x={x} y={460} width={26} height={70} rx="1" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.7"/>
            {[0,1,2,3,4,5].map(u=>(
              <rect key={u} x={x+2} y={464+u*11} width={22} height={9} rx="0.5" fill="none" stroke="rgba(201,169,110,0.08)" strokeWidth="0.3"/>
            ))}
            <circle cx={x+6} cy={468} r="1.5" fill={i%2===0?'rgba(201,169,110,0.7)':'rgba(201,169,110,0.2)'}/>
            <circle cx={x+6} cy={478} r="1.5" fill={i%3===0?'rgba(201,169,110,0.5)':'rgba(201,169,110,0.1)'}/>
          </g>
        ))}
        {/* Cable tray */}
        <rect x="614" y="534" width="162" height="5" rx="1" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.4"/>
      </>
    ),
  },
}

interface Props {
  activeCategory: string
  onRoomClick: (room: Room) => void
}

export default function FloorPlanNav({ activeCategory, onRoomClick }: Props) {
  const [hovered, setHovered] = useState<string|null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(()=>{setMounted(true)},[])

  const isLit = (r: Room) => activeCategory === 'all' || r.categories.includes(activeCategory)

  return (
    <div className="fp-wrap">
      <div className="fp-header">
        <div className="fp-header-ey">XSCACE · Installation Map · Click a room to explore</div>
        <div className="fp-header-title">Enter a room</div>
        <div className="fp-header-sub">Select any room to see which XSCACE products belong in that space</div>
      </div>

      <svg viewBox="0 0 840 560" className="fp-svg"
        style={{opacity: mounted ? 1 : 0, transition:'opacity .5s ease'}}>

        {/* Blueprint grid */}
        {[...Array(17)].map((_,i)=>(
          <line key={`v${i}`} x1={i*50} y1="0" x2={i*50} y2="560" stroke="rgba(201,169,110,0.025)" strokeWidth="0.5"/>
        ))}
        {[...Array(12)].map((_,i)=>(
          <line key={`h${i}`} x1="0" y1={i*50} x2="840" y2={i*50} stroke="rgba(201,169,110,0.025)" strokeWidth="0.5"/>
        ))}

        {/* Corridors / hallway connections */}
        <rect x="265" y="40" width="35" height="470" fill="rgba(201,169,110,0.008)"/>
        <rect x="570" y="40" width="30" height="500" fill="rgba(201,169,110,0.008)"/>
        <rect x="40" y="300" width="225" height="20" fill="rgba(201,169,110,0.008)"/>
        <rect x="300" y="340" width="270" height="20" fill="rgba(201,169,110,0.008)"/>

        {/* Each room */}
        {ROOMS.map(room => {
          const shape = SHAPES[room.id]
          if (!shape) return null
          const lit = isLit(room)
          const hov = hovered === room.id

          return (
            <g key={room.id}
              style={{cursor: lit ? 'pointer' : 'default'}}
              onClick={()=>lit && onRoomClick(room)}
              onMouseEnter={()=>setHovered(room.id)}
              onMouseLeave={()=>setHovered(null)}>

              {/* Floor */}
              <path d={shape.fill}
                fill={hov&&lit?'rgba(201,169,110,0.07)':lit?'rgba(201,169,110,0.03)':'rgba(201,169,110,0.008)'}
                style={{transition:'fill .25s'}}/>

              {/* Walls */}
              <path d={shape.wall} fill="none"
                stroke={lit?(hov?'rgba(201,169,110,0.65)':'rgba(201,169,110,0.28)'):'rgba(201,169,110,0.07)'}
                strokeWidth={hov?2:1.2}
                style={{transition:'all .25s'}}/>

              {/* Windows — bright double line */}
              {shape.windows.map((w,wi)=>{
                const horiz = w.y1 === w.y2
                return (
                  <g key={wi}>
                    {/* Erase wall */}
                    {horiz
                      ? <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#060606" strokeWidth="5"/>
                      : <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#060606" strokeWidth="5"/>}
                    {/* Window glazing */}
                    {horiz ? (
                      <>
                        <line x1={w.x1} y1={w.y1-3} x2={w.x2} y2={w.y2-3} stroke={lit?'rgba(201,169,110,0.4)':'rgba(201,169,110,0.08)'} strokeWidth="1"/>
                        <line x1={w.x1} y1={w.y1+3} x2={w.x2} y2={w.y2+3} stroke={lit?'rgba(201,169,110,0.4)':'rgba(201,169,110,0.08)'} strokeWidth="1"/>
                        <line x1={(w.x1+w.x2)/2} y1={w.y1-4} x2={(w.x1+w.x2)/2} y2={w.y1+4} stroke={lit?'rgba(201,169,110,0.3)':'rgba(201,169,110,0.06)'} strokeWidth="0.7"/>
                      </>
                    ) : (
                      <>
                        <line x1={w.x1-3} y1={w.y1} x2={w.x2-3} y2={w.y2} stroke={lit?'rgba(201,169,110,0.4)':'rgba(201,169,110,0.08)'} strokeWidth="1"/>
                        <line x1={w.x1+3} y1={w.y1} x2={w.x2+3} y2={w.y2} stroke={lit?'rgba(201,169,110,0.4)':'rgba(201,169,110,0.08)'} strokeWidth="1"/>
                        <line x1={w.x1-4} y1={(w.y1+w.y2)/2} x2={w.x1+4} y2={(w.y1+w.y2)/2} stroke={lit?'rgba(201,169,110,0.3)':'rgba(201,169,110,0.06)'} strokeWidth="0.7"/>
                      </>
                    )}
                  </g>
                )
              })}

              {/* Doors — gap + swing arc */}
              {shape.doors.map((d,di)=>{
                const rad = d.startAngle * Math.PI/180
                const ex = d.x + Math.cos(rad)*d.r
                const ey = d.y + Math.sin(rad)*d.r
                return (
                  <g key={di}>
                    <path d={`M${d.x},${d.y} A${d.r},${d.r} 0 0,${d.sweep} ${ex},${ey}`}
                      fill="none" stroke={lit?'rgba(201,169,110,0.22)':'rgba(201,169,110,0.05)'}
                      strokeWidth="0.7" strokeDasharray="3 2"/>
                    <line x1={d.x} y1={d.y} x2={ex} y2={ey}
                      stroke={lit?'rgba(201,169,110,0.3)':'rgba(201,169,110,0.06)'} strokeWidth="0.8"/>
                  </g>
                )
              })}

              {/* Furniture */}
              <g opacity={lit?(hov?0.85:0.6):0.15} style={{transition:'opacity .25s'}}>
                {shape.furniture}
              </g>

              {/* Labels */}
              <text x={room.labelX} y={room.labelY-10} textAnchor="middle"
                fill={lit?(hov?'#eeebe5':'rgba(238,235,229,0.55)'):'rgba(238,235,229,0.1)'}
                fontSize="11" fontFamily="Cormorant, serif" fontWeight="300"
                fontStyle={hov?'italic':'normal'}
                style={{transition:'all .25s'}} pointerEvents="none">
                {room.label}
              </text>
              <text x={room.labelX} y={room.labelY+6} textAnchor="middle"
                fill={lit?'rgba(201,169,110,0.28)':'rgba(201,169,110,0.06)'}
                fontSize="6" fontFamily="DM Mono, monospace" letterSpacing="0.8"
                style={{transition:'all .25s'}} pointerEvents="none">
                {room.sublabel.toUpperCase()}
              </text>
              {hov && lit && (
                <text x={room.labelX} y={room.labelY+22} textAnchor="middle"
                  fill="rgba(201,169,110,0.55)" fontSize="7"
                  fontFamily="DM Mono, monospace" letterSpacing="2" pointerEvents="none">
                  ENTER →
                </text>
              )}
            </g>
          )
        })}

        {/* Labels for corridors */}
        <text x="282" y="290" fill="rgba(201,169,110,0.08)" fontSize="6" fontFamily="DM Mono,monospace" writingMode="vertical-rl" letterSpacing="2">CORRIDOR</text>

        {/* North + scale */}
        <g transform="translate(810,520)">
          <line x1="0" y1="10" x2="0" y2="-10" stroke="rgba(201,169,110,0.25)" strokeWidth="0.8"/>
          <polygon points="0,-12 -3,-4 3,-4" fill="rgba(201,169,110,0.4)"/>
          <text x="0" y="18" textAnchor="middle" fill="rgba(201,169,110,0.2)" fontSize="6" fontFamily="DM Mono,monospace">N</text>
        </g>
        <line x1="40" y1="550" x2="140" y2="550" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
        <line x1="40" y1="546" x2="40" y2="554" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
        <line x1="140" y1="546" x2="140" y2="554" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5"/>
        <text x="90" y="548" textAnchor="middle" fill="rgba(201,169,110,0.15)" fontSize="6" fontFamily="DM Mono,monospace">10m</text>
      </svg>
    </div>
  )
}
