'use client'
import { useState, useEffect } from 'react'
import { Room } from './FloorPlanNav'

interface Product {
  _id: string
  productName: string
  series: string
  subCategory: string
  slug: { current: string }
  heroImage?: any
  category: { name: string; slug: { current: string } }
}

// Which categories go in each room, and placement types
const ROOM_CONFIG: Record<string,{
  wallCats: string[]; wallCount: number
  ceilCats: string[]; ceilCount: number
  floorCats: string[]; floorCount: number
  rackCats: string[]; rackCount: number
}> = {
  living:   { wallCats:['slim-array','in-wall'], wallCount:4, ceilCats:[], ceilCount:0, floorCats:['subwoofer-series'], floorCount:1, rackCats:[], rackCount:0 },
  cinema:   { wallCats:['slim-array','in-wall'], wallCount:6, ceilCats:[], ceilCount:0, floorCats:['subwoofer-series'], floorCount:2, rackCats:[], rackCount:0 },
  bedroom:  { wallCats:['slim-array'],           wallCount:2, ceilCats:['in-ceiling'],  ceilCount:2, floorCats:[], floorCount:0, rackCats:[], rackCount:0 },
  wardrobe: { wallCats:[],                       wallCount:0, ceilCats:['in-ceiling'],  ceilCount:2, floorCats:[], floorCount:0, rackCats:[], rackCount:0 },
  dining:   { wallCats:['slim-array'],           wallCount:2, ceilCats:['in-ceiling'],  ceilCount:2, floorCats:[], floorCount:0, rackCats:[], rackCount:0 },
  outdoor:  { wallCats:['outdoor'],              wallCount:4, ceilCats:[], ceilCount:0, floorCats:['subwoofer-series','outdoor'], floorCount:1, rackCats:[], rackCount:0 },
  party:    { wallCats:['outdoor'],              wallCount:4, ceilCats:[], ceilCount:0, floorCats:['subwoofer-series'], floorCount:2, rackCats:[], rackCount:0 },
  server:   { wallCats:[],                       wallCount:0, ceilCats:[], ceilCount:0, floorCats:[], floorCount:0, rackCats:['amplifier-series'], rackCount:3 },
}

type PType = 'wall'|'ceil'|'floor'|'rack'
interface Placed { product: Product; type: PType; index: number; total: number }

// 3D scene constants (viewBox 900×540)
const BW = { x:180, y:90, w:540, h:300 } // back wall rect
const VP = { x:450, y:240 }               // vanishing point (centre of back wall)

function lerp(a:number,b:number,t:number){ return a+(b-a)*t }

// Evenly space N items along the back wall
function wallX(i:number, total:number, padding=60){
  if(total===1) return BW.x + BW.w/2
  return BW.x + padding + (i/(total-1))*(BW.w - padding*2)
}
// Ceiling items — slightly above wall top, perspective
function ceilPos(i:number, total:number){
  const x = BW.x + 80 + (i/(Math.max(total-1,1)))*(BW.w-160)
  return { x, y: BW.y+30 }
}
// Floor items — on the perspective floor plane
function floorPos(i:number, total:number){
  const t = 0.3 + (i/(Math.max(total-1,1)))*0.4
  const x = lerp(BW.x+40, BW.x+BW.w-40, t)
  // project from back floor to front floor
  const py = lerp(BW.y+BW.h, 540-20, 0.55)
  return { x: lerp(x, lerp(0,900,t), 0.3), y: py }
}
// Rack positions centre-floor
function rackPos(i:number, total:number){
  const step = BW.w/(total+1)
  return { x: BW.x + step*(i+1), y: BW.y+BW.h*0.55 }
}

function getPos(pp:Placed){
  if(pp.type==='wall')  return { x:wallX(pp.index,pp.total), y:BW.y+BW.h*0.42 }
  if(pp.type==='ceil')  return ceilPos(pp.index,pp.total)
  if(pp.type==='floor') return floorPos(pp.index,pp.total)
  if(pp.type==='rack')  return rackPos(pp.index,pp.total)
  return { x:450, y:240 }
}

// Perspective scale — things further back are smaller
function depthScale(pp:Placed){
  if(pp.type==='ceil')  return 0.7
  if(pp.type==='floor') return 0.9 + pp.index*0.05
  if(pp.type==='rack')  return 0.85
  return 0.85
}

// ── SPEAKER COMPONENTS ─────────────────────────────────────────────────────
function WallSpeaker({ x, y, s, hov }:{ x:number; y:number; s:number; hov:boolean }){
  const w=6*s, h=52*s
  return (
    <g>
      {hov && <ellipse cx={x} cy={y} rx={40*s} ry={40*s} fill="rgba(201,169,110,0.06)" style={{filter:'blur(12px)'}}/>}
      {/* Body */}
      <rect x={x-w/2} y={y-h/2} width={w} height={h} rx={2}
        fill={hov?'rgba(201,169,110,0.2)':'rgba(201,169,110,0.1)'}
        stroke="#c9a96e" strokeWidth={hov?1.4:0.9} style={{transition:'all .25s'}}/>
      {/* 3D side */}
      <rect x={x+w/2} y={y-h/2+3} width={3*s} height={h-6} rx={1}
        fill="rgba(201,169,110,0.04)" stroke="rgba(201,169,110,0.2)" strokeWidth="0.4"/>
      {/* Mounting slots */}
      <rect x={x-w*0.3} y={y-h/2+4} width={w*0.6} height={2} rx={1} fill="#c9a96e" opacity="0.4"/>
      <rect x={x-w*0.3} y={y+h/2-6} width={w*0.6} height={2} rx={1} fill="#c9a96e" opacity="0.4"/>
      {/* Driver */}
      <circle cx={x} cy={y} r={w*0.55} fill="none" stroke="#c9a96e" strokeWidth="0.8" opacity="0.7"/>
      <circle cx={x} cy={y} r={w*0.2} fill="#c9a96e" opacity="0.5"/>
      {/* Waves */}
      {hov && [14,24,36].map((r,i)=>(
        <circle key={i} cx={x} cy={y} r={r*s} fill="none" stroke="rgba(201,169,110,0.15)" strokeWidth="0.5">
          <animate attributeName="r" values={`${r*s};${(r+10)*s};${r*s}`} dur="2s" begin={`${i*0.35}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" begin={`${i*0.35}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </g>
  )
}

function CeilSpeaker({ x, y, s, hov }:{ x:number; y:number; s:number; hov:boolean }){
  return (
    <g>
      {hov && <ellipse cx={x} cy={y} rx={36*s} ry={14*s} fill="rgba(201,169,110,0.07)" style={{filter:'blur(8px)'}}/>}
      <ellipse cx={x} cy={y} rx={16*s} ry={6*s}
        fill={hov?'rgba(201,169,110,0.18)':'rgba(201,169,110,0.08)'}
        stroke="#c9a96e" strokeWidth={hov?1.2:0.7} style={{transition:'all .25s'}}/>
      <ellipse cx={x} cy={y} rx={6*s} ry={2.5*s} fill="rgba(201,169,110,0.25)"/>
      <ellipse cx={x} cy={y} rx={2*s} ry={0.8*s} fill="#c9a96e" opacity="0.6"/>
      {hov && [20,32,44].map((r,i)=>(
        <ellipse key={i} cx={x} cy={y} rx={r*s} ry={r*s*0.38}
          fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.5">
          <animate attributeName="rx" values={`${r*s};${(r+14)*s};${r*s}`} dur="2.2s" begin={`${i*0.4}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2.2s" begin={`${i*0.4}s`} repeatCount="indefinite"/>
        </ellipse>
      ))}
    </g>
  )
}

function FloorSub({ x, y, s, hov }:{ x:number; y:number; s:number; hov:boolean }){
  const w=44*s, h=40*s
  return (
    <g>
      {hov && <ellipse cx={x} cy={y} rx={50*s} ry={30*s} fill="rgba(201,169,110,0.07)" style={{filter:'blur(14px)'}}/>}
      {/* Shadow */}
      <rect x={x-w/2+4} y={y-h/2+4} width={w} height={h} rx={2} fill="rgba(0,0,0,0.5)"/>
      {/* Body */}
      <rect x={x-w/2} y={y-h/2} width={w} height={h} rx={2}
        fill={hov?'rgba(201,169,110,0.18)':'rgba(201,169,110,0.08)'}
        stroke="#c9a96e" strokeWidth={hov?1.4:0.8} style={{transition:'all .25s'}}/>
      {/* Top face */}
      <path d={`M${x-w/2},${y-h/2} L${x-w/2+8},${y-h/2-8} L${x+w/2+8},${y-h/2-8} L${x+w/2},${y-h/2} Z`}
        fill="rgba(201,169,110,0.04)" stroke="rgba(201,169,110,0.2)" strokeWidth="0.5"/>
      {/* Driver */}
      <circle cx={x} cy={y-2} r={14*s} fill="none" stroke="#c9a96e" strokeWidth="0.8" opacity="0.6"/>
      <circle cx={x} cy={y-2} r={5*s} fill="none" stroke="#c9a96e" strokeWidth="0.6" opacity="0.4"/>
      <circle cx={x} cy={y-2} r={2*s} fill="#c9a96e" opacity="0.5"/>
      {hov && [22,34].map((r,i)=>(
        <circle key={i} cx={x} cy={y-2} r={r*s}
          fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.8">
          <animate attributeName="r" values={`${r*s};${(r+14)*s};${r*s}`} dur="1.8s" begin={`${i*0.5}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1.8s" begin={`${i*0.5}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </g>
  )
}

function Rack({ x, y, s, hov }:{ x:number; y:number; s:number; hov:boolean }){
  const w=60*s, h=96*s
  return (
    <g>
      {/* Shadow */}
      <rect x={x-w/2+5} y={y-h/2+6} width={w} height={h} rx={1} fill="rgba(0,0,0,0.5)"/>
      {/* Body */}
      <rect x={x-w/2} y={y-h/2} width={w} height={h} rx={1}
        fill={hov?'rgba(201,169,110,0.12)':'rgba(201,169,110,0.05)'}
        stroke="#c9a96e" strokeWidth={hov?1.2:0.7} style={{transition:'all .25s'}}/>
      {/* Top face */}
      <path d={`M${x-w/2},${y-h/2} L${x-w/2+8},${y-h/2-8} L${x+w/2+8},${y-h/2-8} L${x+w/2},${y-h/2} Z`}
        fill="rgba(201,169,110,0.04)" stroke="rgba(201,169,110,0.2)" strokeWidth="0.5"/>
      {/* Rack units */}
      {[...Array(8)].map((_,u)=>(
        <rect key={u} x={x-w/2+3} y={y-h/2+4+u*11*s} width={w-6} height={9*s} rx="0.5"
          fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.4"/>
      ))}
      {/* LEDs */}
      {[...Array(8)].map((_,u)=>(
        <circle key={u} cx={x-w/2+8} cy={y-h/2+8+u*11*s}
          r={1.5*s} fill={u%3===0?'rgba(201,169,110,0.8)':u%2===0?'rgba(201,169,110,0.3)':'rgba(201,169,110,0.1)'}/>
      ))}
      {/* Display panel */}
      <rect x={x-w/2+14} y={y-h/2+5} width={w-26} height={8*s} rx="1"
        fill="rgba(201,169,110,0.06)" stroke="rgba(201,169,110,0.12)" strokeWidth="0.3"/>
    </g>
  )
}

// ── ROOM-SPECIFIC 3D DECOR ─────────────────────────────────────────────────
function Decor({ id }:{ id:string }){
  const C = 'rgba(201,169,110,'
  switch(id){
    case 'living': return (
      <>
        {/* TV on back wall */}
        <rect x="240" y="102" width="420" height="22" rx="1" fill={`${C}0.04)`} stroke={`${C}0.3)`} strokeWidth="0.9"/>
        <rect x="250" y="107" width="400" height="12" rx="0" fill={`${C}0.02)`} stroke={`${C}0.12)`} strokeWidth="0.4"/>
        <rect x="425" y="124" width="50" height="38" rx="0" fill="none" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        {/* Wall art */}
        <rect x="192" y="148" width="50" height="72" rx="1" fill="none" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        <rect x="658" y="148" width="50" height="72" rx="1" fill="none" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        {/* L-shaped sofa */}
        <path d="M210,480 L500,468 L500,510 L210,522 Z" fill={`${C}0.05)`} stroke={`${C}0.18)`} strokeWidth="0.8"/>
        <path d="M210,464 L500,452 L500,480 L210,492 Z" fill={`${C}0.07)`} stroke={`${C}0.22)`} strokeWidth="0.8"/>
        <path d="M210,454 L240,448 L240,522 L210,528 Z" fill={`${C}0.06)`} stroke={`${C}0.18)`} strokeWidth="0.7"/>
        {/* Sofa pillows */}
        <path d="M248,454 L310,450 L310,472 L248,476 Z" fill={`${C}0.09)`} stroke={`${C}0.15)`} strokeWidth="0.5"/>
        <path d="M318,450 L380,446 L380,468 L318,472 Z" fill={`${C}0.09)`} stroke={`${C}0.15)`} strokeWidth="0.5"/>
        {/* Coffee table */}
        <path d="M300,440 L540,430 L546,458 L306,468 Z" fill={`${C}0.04)`} stroke={`${C}0.14)`} strokeWidth="0.7"/>
        {/* Rug */}
        <ellipse cx="400" cy="468" rx="140" ry="36" fill="none" stroke={`${C}0.06)`} strokeWidth="0.5" strokeDasharray="4 3"/>
        {/* Lamp */}
        <line x1="690" y1="90" x2="680" y2="180" stroke={`${C}0.18)`} strokeWidth="0.7"/>
        <ellipse cx="680" cy="184" rx="14" ry="5" fill={`${C}0.1)`} stroke={`${C}0.3)`} strokeWidth="0.6"/>
        {/* Floor (perspective) */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.018)`} stroke={`${C}0.12)`} strokeWidth="0.7"/>
      </>
    )
    case 'cinema': return (
      <>
        {/* Large screen wall-to-wall */}
        <rect x="185" y="96" width="530" height="180" rx="2" fill={`${C}0.03)`} stroke={`${C}0.4)`} strokeWidth="1.4"/>
        <rect x="195" y="104" width="510" height="164" rx="0" fill={`${C}0.015)`} stroke={`${C}0.12)`} strokeWidth="0.5"/>
        {/* Screen scanlines */}
        {[0,1,2,3,4,5].map(i=>(
          <line key={i} x1="195" y1={110+i*26} x2="705" y2={110+i*26} stroke={`${C}0.04)`} strokeWidth="0.4"/>
        ))}
        {/* Curtains sides */}
        <rect x="185" y="96" width="18" height="180" rx="0" fill={`${C}0.04)`} stroke={`${C}0.15)`} strokeWidth="0.5"/>
        <rect x="697" y="96" width="18" height="180" rx="0" fill={`${C}0.04)`} stroke={`${C}0.15)`} strokeWidth="0.5"/>
        {/* Seating rows — recliners */}
        {[0,1,2].map(row=>(
          <g key={row}>
            <path d={`M${200+row*20},${418+row*30} L${700-row*20},${412+row*30} L${700-row*20},${436+row*30} L${200+row*20},${442+row*30} Z`}
              fill={`${C}0.04)`} stroke={`${C}0.12)`} strokeWidth="0.6"/>
            {[0,1,2,3,4,5,6].map(s=>(
              <rect key={s} x={208+row*20+s*70} y={418+row*30} width={56} height={18} rx="4"
                fill="none" stroke={`${C}0.1)`} strokeWidth="0.5"/>
            ))}
          </g>
        ))}
        {/* Ceiling lighting strips */}
        {[280,380,450,520,620].map((x,i)=>(
          <g key={i}>
            <line x1={x} y1={90} x2={x} y2={108} stroke={`${C}0.18)`} strokeWidth="0.6"/>
            <ellipse cx={x} cy={110} rx="5" ry="3" fill={`${C}0.12)`} stroke={`${C}0.3)`} strokeWidth="0.5"/>
          </g>
        ))}
        {/* Projector */}
        <rect x="390" y="92" width="120" height="16" rx="3" fill={`${C}0.08)`} stroke={`${C}0.25)`} strokeWidth="0.7"/>
        <line x1="450" y1="108" x2="450" y2="280" stroke={`${C}0.06)`} strokeWidth="0.5" strokeDasharray="3 4"/>
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.012)`} stroke={`${C}0.1)`} strokeWidth="0.6"/>
      </>
    )
    case 'bedroom': return (
      <>
        {/* Bed — king size */}
        <path d="M255,450 L640,436 L642,530 L253,544 Z" fill={`${C}0.05)`} stroke={`${C}0.18)`} strokeWidth="0.9"/>
        {/* Headboard */}
        <path d="M255,436 L640,422 L640,452 L255,466 Z" fill={`${C}0.08)`} stroke={`${C}0.25)`} strokeWidth="1"/>
        {/* Pillows */}
        <path d="M275,436 L378,430 L378,456 L275,462 Z" fill={`${C}0.12)`} stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <path d="M390,430 L493,424 L493,450 L390,456 Z" fill={`${C}0.12)`} stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <path d="M505,424 L600,418 L600,444 L505,450 Z" fill={`${C}0.1)`} stroke={`${C}0.18)`} strokeWidth="0.6"/>
        {/* Duvet fold */}
        <path d="M260,466 Q450,454 638,440" fill="none" stroke={`${C}0.1)`} strokeWidth="0.7"/>
        {/* Bedside tables */}
        <path d="M192,446 L253,440 L253,496 L192,502 Z" fill="none" stroke={`${C}0.14)`} strokeWidth="0.7"/>
        <path d="M640,430 L700,424 L700,480 L640,486 Z" fill="none" stroke={`${C}0.14)`} strokeWidth="0.7"/>
        {/* Lamps */}
        <line x1="222" y1="440" x2="218" y2="420" stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <ellipse cx="218" cy="416" rx="10" ry="4" fill={`${C}0.08)`} stroke={`${C}0.25)`} strokeWidth="0.5"/>
        <line x1="670" y1="424" x2="666" y2="404" stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <ellipse cx="666" cy="400" rx="10" ry="4" fill={`${C}0.08)`} stroke={`${C}0.25)`} strokeWidth="0.5"/>
        {/* Window treatment */}
        <rect x="272" y="90" width="356" height="12" rx="1" fill={`${C}0.06)`} stroke={`${C}0.15)`} strokeWidth="0.5"/>
        <line x1="272" y1="102" x2="272" y2="200" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        <line x1="628" y1="102" x2="628" y2="200" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        {/* Dresser */}
        <path d="M186" y="280" d="M186,280 L350,272 L350,360 L186,368 Z" fill="none" stroke={`${C}0.12)`} strokeWidth="0.7"/>
        {[0,1].map(r=>[0,1,2].map(c=>(
          <rect key={`${r}-${c}`} x={190+c*53} y={285+r*36} width={49} height={32} rx="1"
            fill="none" stroke={`${C}0.08)`} strokeWidth="0.4"/>
        )))}
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.018)`} stroke={`${C}0.1)`} strokeWidth="0.6"/>
        {/* Rug */}
        <ellipse cx="450" cy="480" rx="180" ry="40" fill="none" stroke={`${C}0.05)`} strokeWidth="0.5" strokeDasharray="4 3"/>
      </>
    )
    case 'wardrobe': return (
      <>
        {/* Full-height wardrobe units on back wall */}
        {[0,1,2,3].map(i=>(
          <g key={i}>
            <rect x={188+i*135} y={96} width={128} height={294} rx="1"
              fill={`${C}0.03)`} stroke={`${C}0.2)`} strokeWidth="0.8"/>
            <line x1={188+i*135} y1={200} x2={316+i*135} y2={200} stroke={`${C}0.07)`} strokeWidth="0.4"/>
            <rect x={240+i*135} y={148} width={6} height={4} rx="2" fill={`${C}0.3)`}/>
            <rect x={240+i*135} y={248} width={6} height={4} rx="2" fill={`${C}0.3)`}/>
          </g>
        ))}
        {/* Bathroom: freestanding bathtub */}
        <path d="M570,410 L760,396 L764,464 L566,478 Z" fill={`${C}0.04)`} stroke={`${C}0.2)`} strokeWidth="0.9"/>
        <path d="M575,416 L752,402 L756,456 L571,470 Z" fill={`${C}0.03)`} stroke={`${C}0.1)`} strokeWidth="0.4"/>
        {/* Tap */}
        <line x1="720" y1="400" x2="718" y2="390" stroke={`${C}0.25)`} strokeWidth="1.2"/>
        <line x1="710" y1="392" x2="726" y2="390" stroke={`${C}0.2)`} strokeWidth="0.8"/>
        {/* Vanity mirror */}
        <rect x="192" y="300" width="350" height="80" rx="2" fill="none" stroke={`${C}0.25)`} strokeWidth="0.8"/>
        <rect x="196" y="304" width="342" height="72" rx="1" fill={`${C}0.02)`} stroke={`${C}0.08)`} strokeWidth="0.3"/>
        {/* Vanity counter */}
        <path d="M188,380 L544,366 L546,400 L188,414 Z" fill={`${C}0.05)`} stroke={`${C}0.18)`} strokeWidth="0.7"/>
        <ellipse cx="340" cy="386" rx="60" ry="12" fill="none" stroke={`${C}0.15)`} strokeWidth="0.6"/>
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.015)`} stroke={`${C}0.1)`} strokeWidth="0.6"/>
      </>
    )
    case 'dining': return (
      <>
        {/* Large dining table */}
        <path d="M220,440 L680,420 L688,490 L216,510 Z" fill={`${C}0.05)`} stroke={`${C}0.22)`} strokeWidth="1"/>
        {/* Table top detail */}
        <path d="M228,446 L672,426 L678,482 L222,502 Z" fill={`${C}0.02)`} stroke={`${C}0.1)`} strokeWidth="0.5"/>
        {/* Chairs — top + bottom */}
        {[0,1,2,3,4].map(i=>(
          <g key={i}>
            {/* Top chairs */}
            <path d={`M${238+i*90},${432} L${312+i*90},${426} L${314+i*90},${442} L${240+i*90},${448} Z`}
              fill="none" stroke={`${C}0.14)`} strokeWidth="0.6"/>
            {/* Bottom chairs */}
            <path d={`M${230+i*90},${510} L${304+i*90},${502} L${306+i*90},${520} L${232+i*90},${528} Z`}
              fill="none" stroke={`${C}0.14)`} strokeWidth="0.6"/>
          </g>
        ))}
        {/* Pendant lights */}
        {[300,450,600].map((x,i)=>(
          <g key={i}>
            <line x1={x} y1={90} x2={x-5} y2={150} stroke={`${C}0.2)`} strokeWidth="0.7"/>
            <ellipse cx={x-5} cy={156} rx="18" ry="7" fill={`${C}0.08)`} stroke={`${C}0.3)`} strokeWidth="0.7"/>
            <ellipse cx={x-5} cy={153} rx="10" ry="3" fill={`${C}0.15)`} stroke={`${C}0.2)`} strokeWidth="0.4"/>
          </g>
        ))}
        {/* Buffet sideboard */}
        <path d="M184,300 L360,290 L360,350 L184,360 Z" fill={`${C}0.04)`} stroke={`${C}0.15)`} strokeWidth="0.7"/>
        <path d="M188,304 L356,294 L356,346 L188,356 Z" fill="none" stroke={`${C}0.08)`} strokeWidth="0.4"/>
        {/* Wine glasses on table */}
        {[280,380,480,560].map((x,i)=>(
          <g key={i}>
            <line x1={x} y1={438} x2={x} y2={450} stroke={`${C}0.15)`} strokeWidth="0.5"/>
            <ellipse cx={x} cy={436} rx="5" ry="3" fill="none" stroke={`${C}0.2)`} strokeWidth="0.5"/>
          </g>
        ))}
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.018)`} stroke={`${C}0.1)`} strokeWidth="0.6"/>
      </>
    )
    case 'outdoor': return (
      <>
        {/* Sky gradient suggestion — faint */}
        <rect x="0" y="0" width="900" height="390" fill={`${C}0.006)`}/>
        {/* Stars */}
        {[[120,60],[220,30],[380,45],[530,20],[680,38],[780,55],[150,80],[600,70]].map(([sx,sy],i)=>(
          <circle key={i} cx={sx} cy={sy} r="1" fill={`${C}0.3)`}/>
        ))}
        {/* Moon */}
        <circle cx="780" cy="50" r="18" fill={`${C}0.08)`} stroke={`${C}0.2)`} strokeWidth="0.5"/>
        {/* Trees — left */}
        <ellipse cx="90" cy="260" rx="50" ry="65" fill={`${C}0.04)`} stroke={`${C}0.1)`} strokeWidth="0.7"/>
        <ellipse cx="90" cy="235" rx="38" ry="50" fill={`${C}0.03)`} stroke={`${C}0.08)`} strokeWidth="0.5"/>
        <rect x="82" y="320" width="16" height="70" rx="2" fill="none" stroke={`${C}0.1)`} strokeWidth="0.7"/>
        {/* Trees — right */}
        <ellipse cx="810" cy="260" rx="50" ry="65" fill={`${C}0.04)`} stroke={`${C}0.1)`} strokeWidth="0.7"/>
        <ellipse cx="810" cy="235" rx="38" ry="50" fill={`${C}0.03)`} stroke={`${C}0.08)`} strokeWidth="0.5"/>
        <rect x="802" y="320" width="16" height="70" rx="2" fill="none" stroke={`${C}0.1)`} strokeWidth="0.7"/>
        {/* Smaller shrubs */}
        <ellipse cx="200" cy="350" rx="30" ry="20" fill={`${C}0.03)`} stroke={`${C}0.08)`} strokeWidth="0.5"/>
        <ellipse cx="700" cy="350" rx="30" ry="20" fill={`${C}0.03)`} stroke={`${C}0.08)`} strokeWidth="0.5"/>
        {/* Pool */}
        <path d="M240,440 L660,422 L668,510 L234,528 Z" fill={`${C}0.025)`} stroke={`${C}0.15)`} strokeWidth="0.8" strokeDasharray="4 3"/>
        {/* Pool ripple */}
        <ellipse cx="452" cy="468" rx="120" ry="20" fill="none" stroke={`${C}0.08)`} strokeWidth="0.5" strokeDasharray="3 4"/>
        {/* Decking */}
        {[392,404,416,428,440,452].map((y,i)=>(
          <line key={i} x1="180" y1={y} x2="720" y2={y-i} stroke={`${C}0.05)`} strokeWidth="0.6"/>
        ))}
        {/* Outdoor sofa */}
        <path d="M188,400 L320,394 L320,422 L188,428 Z" fill={`${C}0.05)`} stroke={`${C}0.15)`} strokeWidth="0.7"/>
        <path d="M188,390 L320,384 L320,402 L188,408 Z" fill={`${C}0.07)`} stroke={`${C}0.18)`} strokeWidth="0.7"/>
        <path d="M580,388 L710,382 L710,410 L580,416 Z" fill={`${C}0.05)`} stroke={`${C}0.15)`} strokeWidth="0.7"/>
        <path d="M580,378 L710,372 L710,390 L580,396 Z" fill={`${C}0.07)`} stroke={`${C}0.18)`} strokeWidth="0.7"/>
        {/* Low table */}
        <path d="M338,404 L560,396 L562,420 L336,428 Z" fill={`${C}0.04)`} stroke={`${C}0.12)`} strokeWidth="0.6"/>
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.022)`} stroke={`${C}0.12)`} strokeWidth="0.7"/>
      </>
    )
    case 'party': return (
      <>
        {/* DJ booth — back wall centre */}
        <path d="M230,96 L670,96 L670,210 L230,210 Z" fill={`${C}0.04)`} stroke={`${C}0.3)`} strokeWidth="1.2"/>
        {/* DJ gear on booth */}
        <rect x="240" y="104" width="140" height="98" rx="2" fill={`${C}0.03)`} stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <ellipse cx="310" cy="152" rx="44" ry="44" fill="none" stroke={`${C}0.18)`} strokeWidth="0.6"/>
        <ellipse cx="310" cy="152" rx="28" ry="28" fill="none" stroke={`${C}0.12)`} strokeWidth="0.4"/>
        <ellipse cx="310" cy="152" rx="10" ry="10" fill={`${C}0.1)`} stroke={`${C}0.2)`} strokeWidth="0.5"/>
        {/* Mixer */}
        <rect x="390" y="120" width="130" height="70" rx="2" fill={`${C}0.04)`} stroke={`${C}0.18)`} strokeWidth="0.6"/>
        {[0,1,2,3].map(i=>(
          <g key={i}>
            <rect x={396+i*28} y={128} width={20} height={52} rx="1" fill="none" stroke={`${C}0.1)`} strokeWidth="0.4"/>
            <rect x={400+i*28} y={132} width={12} height={30} rx="0.5" fill={`${C}0.06)`}/>
          </g>
        ))}
        {/* Second turntable */}
        <rect x="532" y="104" width="130" height="98" rx="2" fill={`${C}0.03)`} stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <ellipse cx="597" cy="152" rx="44" ry="44" fill="none" stroke={`${C}0.18)`} strokeWidth="0.6"/>
        <ellipse cx="597" cy="152" rx="28" ry="28" fill="none" stroke={`${C}0.12)`} strokeWidth="0.4"/>
        <ellipse cx="597" cy="152" rx="10" ry="10" fill={`${C}0.1)`} stroke={`${C}0.2)`} strokeWidth="0.5"/>
        {/* Dance floor with tiles */}
        <path d="M200,420 L700,400 L710,530 L194,550 Z" fill={`${C}0.02)`} stroke={`${C}0.1)`} strokeWidth="0.6" strokeDasharray="5 4"/>
        {[0,1,2,3,4].map(row=>[0,1,2,3,4,5,6].map(col=>(
          <path key={`${row}-${col}`}
            d={`M${204+col*72+row*6},${424+row*24} L${270+col*72+row*6},${420+row*24} L${274+col*72+(row+1)*6},${444+(row+1)*24} L${208+col*72+(row+1)*6},${448+(row+1)*24} Z`}
            fill="none" stroke={`${C}0.06)`} strokeWidth="0.3"/>
        )))}
        {/* Lighting rigs ceiling */}
        {[220,310,400,490,580,670].map((x,i)=>(
          <g key={i}>
            <line x1={x} y1={90} x2={x-2} y2={112} stroke={`${C}0.2)`} strokeWidth="0.7"/>
            <rect x={x-14} y={112} width={28} height={12} rx="2" fill={`${C}0.08)`} stroke={`${C}0.28)`} strokeWidth="0.6"/>
            {/* Light beam suggestion */}
            <path d={`M${x-4},124 L${x-20},350 L${x+20},350 L${x+4},124 Z`}
              fill={`${C}0.012)`} stroke="none"/>
          </g>
        ))}
        {/* Bar stools */}
        {[280,360,440,520,600].map((x,i)=>(
          <ellipse key={i} cx={x} cy={380} rx="10" ry="6" fill="none" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        ))}
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.02)`} stroke={`${C}0.1)`} strokeWidth="0.6"/>
      </>
    )
    case 'server': return (
      <>
        {/* Back wall — perforated panel look */}
        {[0,1,2,3,4,5,6,7,8,9].map(i=>(
          <line key={i} x1="182" y1={96+i*30} x2="718" y2={96+i*30} stroke={`${C}0.05)`} strokeWidth="0.5"/>
        ))}
        {[0,1,2,3,4,5,6,7,8].map(i=>(
          <line key={i} x1={196+i*60} y1={90} x2={196+i*60} y2={390} stroke={`${C}0.04)`} strokeWidth="0.4"/>
        ))}
        {/* Cable management trays on wall */}
        <rect x="184" y="342" width="532" height="12" rx="1" fill={`${C}0.06)`} stroke={`${C}0.2)`} strokeWidth="0.6"/>
        <rect x="184" y="318" width="532" height="12" rx="1" fill={`${C}0.04)`} stroke={`${C}0.15)`} strokeWidth="0.5"/>
        {/* Patch panel on back wall */}
        <rect x="300" y="104" width="300" height="44" rx="1" fill={`${C}0.05)`} stroke={`${C}0.25)`} strokeWidth="0.8"/>
        {[...Array(12)].map((_,i)=>(
          <rect key={i} x={306+i*23} y={110} width={18} height={12} rx="1"
            fill="none" stroke={`${C}0.15)`} strokeWidth="0.4"/>
        ))}
        {/* UPS unit */}
        <path d="M184,290 L280,284 L280,344 L184,350 Z" fill={`${C}0.05)`} stroke={`${C}0.2)`} strokeWidth="0.7"/>
        <ellipse cx="216" cy="316" rx="16" ry="12" fill="none" stroke={`${C}0.15)`} strokeWidth="0.5"/>
        {/* Floor raised tiles */}
        {[0,1,2,3].map(row=>[0,1,2,3,4,5,6].map(col=>(
          <path key={`${row}-${col}`}
            d={`M${184+col*76+row*6},${396+row*36} L${254+col*76+row*6},${392+row*36} L${258+col*76+(row+1)*6},${428+(row+1)*36} L${188+col*76+(row+1)*6},${432+(row+1)*36} Z`}
            fill={`${C}0.015)`} stroke={`${C}0.07)`} strokeWidth="0.4"/>
        )))}
        {/* Cooling units on left wall */}
        <path d="M0,180 L180,150 L180,280 L0,310 Z" fill={`${C}0.03)`} stroke={`${C}0.12)`} strokeWidth="0.5"/>
        {[0,1,2].map(i=>(
          <ellipse key={i} cx={60} cy={194+i*44} rx={45} ry={12}
            fill="none" stroke={`${C}0.1)`} strokeWidth="0.5"/>
        ))}
        {/* Floor */}
        <path d="M0,540 L180,390 L720,390 L900,540 Z" fill={`${C}0.025)`} stroke={`${C}0.15)`} strokeWidth="0.8"/>
      </>
    )
    default: return null
  }
}

export default function RoomView({ room, products, activeCategory, onProductClick, onBack }:{
  room:Room; products:Product[]; activeCategory:string
  onProductClick:(p:Product)=>void; onBack:()=>void
}) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState<string|null>(null)

  useEffect(()=>{ setVisible(false); const t=setTimeout(()=>setVisible(true),40); return ()=>clearTimeout(t) },[room.id])

  const cfg = ROOM_CONFIG[room.id] || { wallCats:[],wallCount:0,ceilCats:[],ceilCount:0,floorCats:[],floorCount:0,rackCats:[],rackCount:0 }
  const wallProds = products.filter(p=>cfg.wallCats.includes(p.category?.slug?.current)).slice(0,cfg.wallCount)
  const ceilProds = products.filter(p=>cfg.ceilCats.includes(p.category?.slug?.current)).slice(0,cfg.ceilCount)
  const floorProds = products.filter(p=>cfg.floorCats.includes(p.category?.slug?.current)).slice(0,cfg.floorCount)
  const rackProds = products.filter(p=>cfg.rackCats.includes(p.category?.slug?.current)).slice(0,cfg.rackCount)

  const placed:Placed[] = [
    ...wallProds.map((p,i)=>({product:p,type:'wall' as PType,index:i,total:wallProds.length})),
    ...ceilProds.map((p,i)=>({product:p,type:'ceil' as PType,index:i,total:ceilProds.length})),
    ...floorProds.map((p,i)=>({product:p,type:'floor' as PType,index:i,total:floorProds.length})),
    ...rackProds.map((p,i)=>({product:p,type:'rack' as PType,index:i,total:rackProds.length})),
  ]

  const unique = [...new Map(placed.map(pp=>[pp.product._id,pp.product])).values()]

  return (
    <div className={`room-view ${visible?'room-view-visible':''}`}>
      <div className="room-view-topbar">
        <button className="room-back-btn" onClick={onBack}>← Floor Plan</button>
        <div className="room-view-title-wrap">
          <div className="room-view-ey">{room.sublabel}</div>
          <div className="room-view-title">{room.label}</div>
        </div>
        <div className="room-view-hint">Hover a speaker · Click to open</div>
      </div>

      <div className="room-scene-wrap">
        <svg viewBox="0 0 900 540" className="room-scene-svg" preserveAspectRatio="xMidYMid meet">
          {/* Room shell */}
          <rect x="0" y="0" width="900" height="540" fill="#080807"/>
          {/* Back wall */}
          <rect x={BW.x} y={BW.y} width={BW.w} height={BW.h} fill="#0e0d0b" stroke="rgba(201,169,110,0.28)" strokeWidth="1"/>
          {/* Left wall */}
          <path d="M0,0 L0,540 L180,390 L180,90 Z" fill="#0b0a08" stroke="rgba(201,169,110,0.18)" strokeWidth="0.8"/>
          {/* Right wall */}
          <path d="M900,0 L900,540 L720,390 L720,90 Z" fill="#0b0a08" stroke="rgba(201,169,110,0.18)" strokeWidth="0.8"/>
          {/* Ceiling */}
          <path d="M0,0 L900,0 L720,90 L180,90 Z" fill="#090908" stroke="rgba(201,169,110,0.14)" strokeWidth="0.6"/>

          {/* Perspective grid */}
          {[0.2,0.4,0.6,0.8].map((t,i)=>(
            <line key={`fg${i}`} x1={BW.x+t*BW.w} y1={BW.y+BW.h} x2={t*900} y2={540}
              stroke="rgba(201,169,110,0.04)" strokeWidth="0.4"/>
          ))}
          {[0.3,0.6].map((t,i)=>(
            <line key={`fh${i}`} x1={180*t} y1={lerp(540,390,t)} x2={900-180*t} y2={lerp(540,390,t)}
              stroke="rgba(201,169,110,0.04)" strokeWidth="0.4"/>
          ))}
          {/* Back wall grid */}
          {[1,2,3].map(i=>(
            <line key={`wv${i}`} x1={BW.x+i*BW.w/4} y1={BW.y} x2={BW.x+i*BW.w/4} y2={BW.y+BW.h}
              stroke="rgba(201,169,110,0.04)" strokeWidth="0.3"/>
          ))}
          {/* Ceiling coving */}
          <path d="M0,10 L900,10 L720,96 L180,96 Z" fill="none" stroke="rgba(201,169,110,0.07)" strokeWidth="0.5"/>
          {/* Skirting */}
          <path d="M180,382 L720,382 L900,530 L0,530 Z" fill="none" stroke="rgba(201,169,110,0.08)" strokeWidth="0.5"/>

          {/* Room decor */}
          <Decor id={room.id}/>

          {/* Speaker dots */}
          {placed.map(pp=>{
            const pos = getPos(pp)
            const s = depthScale(pp)
            const key = `${pp.product._id}-${pp.type}-${pp.index}`
            const hov = hovered===key
            return (
              <g key={key} style={{cursor:'pointer'}}
                onClick={()=>onProductClick(pp.product)}
                onMouseEnter={()=>setHovered(key)}
                onMouseLeave={()=>setHovered(null)}>
                {pp.type==='wall'  && <WallSpeaker  x={pos.x} y={pos.y} s={s} hov={hov}/>}
                {pp.type==='ceil'  && <CeilSpeaker  x={pos.x} y={pos.y} s={s} hov={hov}/>}
                {pp.type==='floor' && <FloorSub     x={pos.x} y={pos.y} s={s} hov={hov}/>}
                {pp.type==='rack'  && <Rack         x={pos.x} y={pos.y} s={s} hov={hov}/>}
                {hov && (()=>{
                  const tx=Math.max(80,Math.min(820,pos.x))
                  const ty=pp.type==='ceil'?pos.y+20:pos.y-72
                  return (
                    <g>
                      <rect x={tx-75} y={ty} width="150" height="58" rx="2"
                        fill="rgba(4,4,3,0.97)" stroke="rgba(201,169,110,0.38)" strokeWidth="0.7"/>
                      <text x={tx} y={ty+16} textAnchor="middle" fill="rgba(201,169,110,0.5)"
                        fontSize="7" fontFamily="DM Mono,monospace" letterSpacing="1">
                        {(pp.product.series||pp.product.subCategory||'').toUpperCase()}
                      </text>
                      <text x={tx} y={ty+34} textAnchor="middle" fill="#eeebe5"
                        fontSize="14" fontFamily="Cormorant,serif" fontWeight="300">
                        {pp.product.productName}
                      </text>
                      <text x={tx} y={ty+48} textAnchor="middle" fill="rgba(201,169,110,0.45)"
                        fontSize="6.5" fontFamily="DM Mono,monospace" letterSpacing="1.5">
                        CLICK TO VIEW →
                      </text>
                    </g>
                  )
                })()}
              </g>
            )
          })}
        </svg>
      </div>

      {unique.length>0 && (
        <div className="room-product-list">
          <div className="room-product-list-label">Products in this room</div>
          <div className="room-product-list-grid">
            {unique.map(p=>{
              const pp=placed.find(x=>x.product._id===p._id)
              return (
                <button key={p._id} className="room-prod-btn"
                  onClick={()=>onProductClick(p)}
                  onMouseEnter={()=>{ if(pp) setHovered(`${pp.product._id}-${pp.type}-${pp.index}`) }}
                  onMouseLeave={()=>setHovered(null)}>
                  <span className="room-prod-cat">{p.series||p.subCategory}</span>
                  <span className="room-prod-name">{p.productName}</span>
                  <span className="room-prod-arr">→</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {unique.length===0 && (
        <div className="no-results" style={{padding:'32px 0'}}>
          No products assigned — ensure Sanity products have the correct category.
        </div>
      )}
    </div>
  )
}
