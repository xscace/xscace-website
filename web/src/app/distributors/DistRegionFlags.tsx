'use client'

// Vector flag illustrations for each distributor region
// Simple, clean SVG flags matching the dark XSCACE aesthetic

const FLAGS: Record<string, React.ReactNode> = {
  IN: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#1a1a1a"/>
      {/* India tricolour */}
      <rect y="0"  width="120" height="26.6" fill="#FF9933" opacity="0.85"/>
      <rect y="26.6" width="120" height="26.6" fill="#f5f2ec" opacity="0.15"/>
      <rect y="53.3" width="120" height="26.7" fill="#138808" opacity="0.85"/>
      {/* Ashoka Chakra */}
      <circle cx="60" cy="40" r="9" fill="none" stroke="#000080" strokeWidth="1" opacity="0.7"/>
      <circle cx="60" cy="40" r="1.5" fill="#000080" opacity="0.7"/>
      {[...Array(24)].map((_,i) => {
        const a = (i / 24) * Math.PI * 2
        return <line key={i} x1="60" y1="40"
          x2={60 + Math.cos(a) * 8} y2={40 + Math.sin(a) * 8}
          stroke="#000080" strokeWidth="0.4" opacity="0.6"/>
      })}
      {/* Country label */}
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">INDIA</text>
    </svg>
  ),
  PH: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#1a1a1a"/>
      <rect y="0" width="120" height="40" fill="#0038A8" opacity="0.8"/>
      <rect y="40" width="120" height="40" fill="#CE1126" opacity="0.8"/>
      {/* White triangle */}
      <polygon points="0,0 36,40 0,80" fill="#f5f2ec" opacity="0.18"/>
      {/* Sun */}
      <circle cx="16" cy="40" r="6" fill="none" stroke="#FCD116" strokeWidth="0.8" opacity="0.7"/>
      {[...Array(8)].map((_,i) => {
        const a = (i / 8) * Math.PI * 2
        return <line key={i} x1={16 + Math.cos(a)*6} y1={40 + Math.sin(a)*6}
          x2={16 + Math.cos(a)*10} y2={40 + Math.sin(a)*10}
          stroke="#FCD116" strokeWidth="0.7" opacity="0.6"/>
      })}
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">PHILIPPINES</text>
    </svg>
  ),
  LB: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#1a1a1a"/>
      <rect y="0" width="120" height="20" fill="#f5f2ec" opacity="0.12"/>
      <rect y="20" width="120" height="40" fill="#f5f2ec" opacity="0.06"/>
      <rect y="60" width="120" height="20" fill="#f5f2ec" opacity="0.12"/>
      {/* Red stripes */}
      <rect y="0" width="120" height="18" fill="#CC2B2B" opacity="0.75"/>
      <rect y="62" width="120" height="18" fill="#CC2B2B" opacity="0.75"/>
      {/* Cedar tree simplified */}
      <polygon points="60,26 52,42 68,42" fill="#2E7D32" opacity="0.8"/>
      <polygon points="60,22 49,38 71,38" fill="#2E7D32" opacity="0.6"/>
      <rect x="58" y="42" width="4" height="6" fill="#2E7D32" opacity="0.7"/>
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">LEBANON · MENA</text>
    </svg>
  ),
  AU: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#00008B" opacity="0.75"/>
      {/* Union Jack simplified */}
      <rect x="0" y="0" width="60" height="40" fill="#1a1a1a" opacity="0.3"/>
      <line x1="0" y1="0" x2="60" y2="40" stroke="#f5f2ec" strokeWidth="5" opacity="0.15"/>
      <line x1="60" y1="0" x2="0" y2="40" stroke="#f5f2ec" strokeWidth="5" opacity="0.15"/>
      <rect x="0" y="17" width="60" height="6" fill="#f5f2ec" opacity="0.18"/>
      <rect x="27" y="0" width="6" height="40" fill="#f5f2ec" opacity="0.18"/>
      <rect x="0" y="17" width="60" height="6" fill="#CC2B2B" opacity="0.5"/>
      <rect x="29" y="0" width="2" height="40" fill="#CC2B2B" opacity="0.5"/>
      {/* Southern Cross - simplified 5 stars */}
      {[[90,20],[100,35],[85,45],[105,50],[95,60]].map(([x,y],i) => (
        <text key={i} x={x} y={y} textAnchor="middle" fill="#f5f2ec" fontSize="8" opacity="0.7">★</text>
      ))}
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">AUSTRALIA</text>
    </svg>
  ),
  GB: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#012169" opacity="0.85"/>
      {/* Union Jack diagonals */}
      <line x1="0" y1="0" x2="120" y2="80" stroke="#f5f2ec" strokeWidth="14" opacity="0.15"/>
      <line x1="120" y1="0" x2="0" y2="80" stroke="#f5f2ec" strokeWidth="14" opacity="0.15"/>
      <line x1="0" y1="0" x2="120" y2="80" stroke="#CC2B2B" strokeWidth="5" opacity="0.5"/>
      <line x1="120" y1="0" x2="0" y2="80" stroke="#CC2B2B" strokeWidth="5" opacity="0.5"/>
      {/* Cross */}
      <rect x="0" y="31" width="120" height="18" fill="#f5f2ec" opacity="0.18"/>
      <rect x="51" y="0" width="18" height="80" fill="#f5f2ec" opacity="0.18"/>
      <rect x="0" y="34" width="120" height="12" fill="#CC2B2B" opacity="0.65"/>
      <rect x="54" y="0" width="12" height="80" fill="#CC2B2B" opacity="0.65"/>
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">UNITED KINGDOM</text>
    </svg>
  ),
  US: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#1a1a1a"/>
      {/* Stripes */}
      {[...Array(13)].map((_,i) => (
        <rect key={i} y={i * 6.15} width="120" height="6.15"
          fill={i % 2 === 0 ? '#B22234' : '#f5f2ec'}
          opacity={i % 2 === 0 ? 0.75 : 0.1}/>
      ))}
      {/* Canton */}
      <rect width="50" height="43" fill="#3C3B6E" opacity="0.85"/>
      {/* Stars grid simplified */}
      {[...Array(5)].map((_,row) =>
        [...Array(6)].map((_,col) => (
          <text key={`${row}-${col}`} x={5 + col*8} y={8 + row*8}
            fill="#f5f2ec" fontSize="5" opacity="0.7">★</text>
        ))
      )}
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">UNITED STATES</text>
    </svg>
  ),
  CA: (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="flag-svg">
      <rect width="120" height="80" fill="#1a1a1a"/>
      <rect x="0"   y="0" width="30"  height="80" fill="#CC2B2B" opacity="0.8"/>
      <rect x="90"  y="0" width="30"  height="80" fill="#CC2B2B" opacity="0.8"/>
      <rect x="30"  y="0" width="60"  height="80" fill="#f5f2ec" opacity="0.1"/>
      {/* Maple leaf simplified */}
      <path d="M60,18 L56,28 L48,26 L54,34 L50,36 L60,34 L70,36 L66,34 L72,26 L64,28 Z"
        fill="#CC2B2B" opacity="0.85"/>
      <line x1="60" y1="34" x2="60" y2="50" stroke="#CC2B2B" strokeWidth="2" opacity="0.75"/>
      <text x="60" y="73" textAnchor="middle" fill="#c9a96e" fontSize="7" letterSpacing="2" fontFamily="DM Mono, monospace">CANADA</text>
    </svg>
  ),
}

export default function DistRegionFlags({ code, country }: { code: string; country: string }) {
  return (
    <div className="dist-flag-wrap">
      {FLAGS[code] || (
        <div className="dist-flag-placeholder">
          <span>{code}</span>
        </div>
      )}
    </div>
  )
}
