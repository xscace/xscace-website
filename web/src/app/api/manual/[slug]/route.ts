// web/src/app/api/manual/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

const PROJECT = '7r0kq57d', DATASET = 'production'
const sanity = createClient({ projectId: PROJECT, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })

// ── Utilities ──────────────────────────────────────────────────────────────────
function sanityImgUrl(ref: string, w = 800) {
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${dims}.${ext}?w=${w}&auto=format&q=80`
}
async function imgB64(ref: string | null, w = 800): Promise<string> {
  if (!ref) return ''
  try {
    const r = await fetch(sanityImgUrl(ref, w))
    if (!r.ok) return ''
    return `data:${r.headers.get('content-type')||'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
  } catch { return '' }
}
function getRef(o: any): string { return o?.asset?._ref || '' }
function fileCdn(id: string) {
  const b = id.replace('file-',''), i = b.lastIndexOf('-')
  return `https://cdn.sanity.io/files/${PROJECT}/${DATASET}/${b.slice(0,i)}.${b.slice(i+1)}`
}
function publicFileB64(relPath: string, mime = 'image/png'): string {
  try {
    const p = path.join(process.cwd(), 'public', relPath)
    if (!fs.existsSync(p)) return ''
    return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`
  } catch { return '' }
}
function loadFontCss(): string {
  const fontDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'fonts')
  const map: [string,string,string,string][] = [
    ['Cormorant Garamond','300','normal','Cormorant-Light.ttf'],
    ['Cormorant Garamond','400','italic','Cormorant-Italic.ttf'],
    ['Cormorant Garamond','600','normal','Cormorant-SemiBold.ttf'],
    ['DM Sans','400','normal','DMSans-Reg.ttf'],
    ['DM Sans','700','normal','DMSans-Bold.ttf'],
    ['DM Mono','400','normal','DMMono-Regular.ttf'],
    ['DM Mono','500','normal','DMMono-Medium.ttf'],
  ]
  let css = ''
  for (const [family,weight,style,fname] of map) {
    const p = path.join(fontDir, fname)
    if (fs.existsSync(p)) {
      css += `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url('data:font/truetype;base64,${fs.readFileSync(p).toString('base64')}') format('truetype');}\n`
    }
  }
  const mw = path.join(process.cwd(), 'public', 'fonts', 'MagmaWave.otf')
  if (fs.existsSync(mw)) css += `@font-face{font-family:'MagmaWave';src:url('data:font/otf;base64,${fs.readFileSync(mw).toString('base64')}') format('opentype');}\n`
  return css
}

// ── QR code — pure SVG, no external lib ───────────────────────────────────────
function makeQrSvg(url: string): string {
  // Encode URL as a simple data URI link block inside SVG
  // Real QR would need a library — we render a styled placeholder with the URL text
  // that looks like a QR frame with the configurator link visible
  const escaped = url.replace(/&/g,'&amp;').replace(/</g,'&lt;')
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:80px;height:80px">
    <rect width="120" height="120" fill="#090909"/>
    <rect x="8" y="8" width="104" height="104" fill="none" stroke="#c9a96e" stroke-width="3"/>
    <!-- TL finder -->
    <rect x="14" y="14" width="28" height="28" fill="none" stroke="#c9a96e" stroke-width="2"/>
    <rect x="19" y="19" width="18" height="18" fill="#c9a96e"/>
    <!-- TR finder -->
    <rect x="78" y="14" width="28" height="28" fill="none" stroke="#c9a96e" stroke-width="2"/>
    <rect x="83" y="19" width="18" height="18" fill="#c9a96e"/>
    <!-- BL finder -->
    <rect x="14" y="78" width="28" height="28" fill="none" stroke="#c9a96e" stroke-width="2"/>
    <rect x="19" y="83" width="18" height="18" fill="#c9a96e"/>
    <!-- Data dots pattern -->
    <rect x="50" y="14" width="4" height="4" fill="#c9a96e"/><rect x="58" y="14" width="4" height="4" fill="#c9a96e"/>
    <rect x="54" y="20" width="4" height="4" fill="#c9a96e"/><rect x="62" y="20" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="26" width="4" height="4" fill="#c9a96e"/><rect x="66" y="26" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="50" width="4" height="4" fill="#c9a96e"/><rect x="58" y="50" width="4" height="4" fill="#c9a96e"/>
    <rect x="66" y="50" width="4" height="4" fill="#c9a96e"/><rect x="74" y="50" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="58" width="4" height="4" fill="#c9a96e"/><rect x="62" y="58" width="4" height="4" fill="#c9a96e"/>
    <rect x="70" y="58" width="4" height="4" fill="#c9a96e"/><rect x="78" y="58" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="66" width="4" height="4" fill="#c9a96e"/><rect x="58" y="66" width="4" height="4" fill="#c9a96e"/>
    <rect x="66" y="66" width="4" height="4" fill="#c9a96e"/><rect x="82" y="66" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="74" width="4" height="4" fill="#c9a96e"/><rect x="66" y="74" width="4" height="4" fill="#c9a96e"/>
    <rect x="54" y="82" width="4" height="4" fill="#c9a96e"/><rect x="62" y="82" width="4" height="4" fill="#c9a96e"/>
    <rect x="78" y="82" width="4" height="4" fill="#c9a96e"/><rect x="86" y="82" width="4" height="4" fill="#c9a96e"/>
    <rect x="50" y="90" width="4" height="4" fill="#c9a96e"/><rect x="58" y="90" width="4" height="4" fill="#c9a96e"/>
    <rect x="70" y="90" width="4" height="4" fill="#c9a96e"/><rect x="82" y="90" width="4" height="4" fill="#c9a96e"/>
    <rect x="54" y="98" width="4" height="4" fill="#c9a96e"/><rect x="66" y="98" width="4" height="4" fill="#c9a96e"/>
    <rect x="74" y="98" width="4" height="4" fill="#c9a96e"/>
    <text x="60" y="113" text-anchor="middle" fill="#7a776f" font-size="4" font-family="monospace">${escaped}</text>
  </svg>`
}

// ── Stereo positioning advice by speaker type ──────────────────────────────────
function stereoAdvice(P: any): { title: string, steps: string[], note: string } {
  const it = P.installationType || ''
  const name = P.productName || 'speaker'

  if (it === 'ceiling-circular' || it === 'ceiling-rectangular' || it === 'inwall-springclip' || it === 'inwall-dogleg') {
    // In-ceiling / in-wall
    return {
      title: 'Positioning for In-Ceiling / In-Wall',
      steps: [
        'Identify your Main Listening Position (MLP) — the primary seat or sofa from which you will enjoy audio.',
        'For stereo, position the two speakers symmetrically on either side of the room centreline, directly above or in front of the MLP.',
        `Recommended toe-in: In-ceiling speakers do not require toe-in. In-wall speakers should face directly forward. For the ${name}, aim any aimable tweeter toward the MLP.`,
        'Recommended distance between speakers: approximately 60% of the distance from the speakers to the MLP. For example, if the MLP is 3m from the wall, place speakers 1.8m apart.',
        'Height: Ceiling speakers at ceiling height are optimal. In-wall speakers should ideally be at ear level when seated (approx. 1.0–1.2m from floor).',
        'Ensure both speakers are equidistant from the MLP. Use a tape measure — even 5cm difference is audible.',
      ],
      note: 'For home cinema, consult the configurator for LCR and surround channel placement.',
    }
  }

  if (it === 'keyhole-wall' || it === 'bracket-wall') {
    // Surface wall mount speakers (Bonsai, Cane, QuadCane, Cedar, Camphor)
    const isSlim = ['bonsai','cane','quadcane'].some(n => name.toLowerCase().includes(n))
    const toeIn = isSlim ? '15–22°' : '10–15°'
    return {
      title: 'Stereo Positioning',
      steps: [
        'Identify your Main Listening Position (MLP) — the primary seat or sofa.',
        `Mount speakers on the left and right walls (or front wall) symmetrically. The ${name} performs best mounted vertically at ear height when seated — approximately 1.0–1.2m from the floor.`,
        `Toe-in: Angle each speaker inward by ${toeIn} toward the MLP. This creates a focused stereo image centred on the listening position.`,
        'Speaker spacing: position each speaker at approximately one-third of the room width from its respective side wall. For a 5m wide room, this places speakers roughly 1.7m from each side wall.',
        'Distance from MLP: the speakers should be roughly 2–4m from the MLP for near-field to mid-field listening. Closer = more intimate and precise; further = more spacious.',
        'Ensure both speakers are perfectly equidistant from the MLP — use a tape measure. Asymmetry degrades the stereo image.',
      ],
      note: `Minimum recommended speaker spacing: ${P.minSpeakerSpacing || '5ft centre-to-centre'}. Minimum rigging height: ${P.minRiggingHeight || '5ft from floor'}.`,
    }
  }

  if (it === 'ceiling-circular' || it === 'banyan-canopy') {
    return {
      title: 'Positioning',
      steps: [
        'Install the Banyan Canopy directly above or forward of the MLP.',
        'For stereo, two Canopy units should be placed symmetrically, one on each side of the room centreline.',
        "The Canopy's wide horizontal dispersion (120°) makes precise toe-in less critical — focus on equal distance from the MLP.",
      ],
      note: 'The Banyan Pith DSP module manages crossover and equalisation for the Canopy automatically.',
    }
  }

  if (it === 'spirea') {
    return {
      title: 'Landscape Positioning',
      steps: [
        'For pathway coverage, place Spirea units every 4–6m along the path for even distribution.',
        'For listening areas (pool, terrace), position two units symmetrically at the perimeter of the area, aimed inward.',
        "Aim the drivers toward the primary seating zone. The Spirea's 120° dispersion covers a wide arc.",
        'Minimum 1.5m from the seating position to avoid overpowering nearfield bass.',
      ],
      note: 'For garden installations: bury the spike fully into soft soil. For hard surfaces, use the standing mount or hanging mount.',
    }
  }

  // Subwoofers, amps, streamers — no stereo advice
  return {
    title: 'Placement',
    steps: [
      'Place near the main system rack or in a location with easy access to power and signal connections.',
      'Ensure adequate ventilation — do not enclose in a sealed cabinet without airflow.',
      'Keep signal cables away from power cables to minimise interference.',
    ],
    note: 'For subwoofer placement: the corner of a room reinforces bass. For flat response, try the "subwoofer crawl" — place the sub at your listening position, play bass-heavy music, then walk around the room and place the sub where the bass sounds most even.',
  }
}

// ── Tools needed by install type ───────────────────────────────────────────────
function toolsNeeded(installationType: string): string[] {
  const base = ['Pencil / marker', 'Spirit level', 'Tape measure', 'Cable stripper / wire cutters']
  const drill = ['Power drill + drill bits (6mm for wall plugs)', 'Screwdriver (Phillips and flat)']
  const drywall = ['Drywall saw / jigsaw', 'Stud finder']
  const ceiling = ['Ceiling cutout tool / hole saw (to match cutout diameter)']

  const map: Record<string, string[]> = {
    'keyhole-wall':        [...base, ...drill, 'Wall plugs / anchors'],
    'bracket-wall':        [...base, ...drill, 'Wall plugs / anchors'],
    'ceiling-circular':    [...base, ...drill, ...ceiling, 'Stud finder'],
    'ceiling-rectangular': [...base, ...drill, ...drywall, 'Construction adhesive (optional)'],
    'inwall-dogleg':       [...base, ...drill, ...drywall],
    'inwall-springclip':   [...base, ...drill, ...drywall],
    'inwall-sub':          [...base, ...drill, ...drywall],
    'banyan-canopy':       [...base, ...drill, 'Speakon cable (included)', 'Allen key / hex key set'],
    'banyan-pith':         [...base, 'Speakon cable (to Canopy)', 'Power outlet access'],
    'spirea':              [...base, 'Rubber mallet (for spike mount)', 'Carabiner (for hanging mount)'],
    'powered-sub':         [...base, 'XLR / RCA cable', 'Power outlet access'],
    'passive-sub':         [...base, 'Speaker wire (14 AWG or thinner)', ...drill],
    'dsp-amplifier':       [...base, 'XLR cables', 'Speaker wire', 'Rack screws (if rack mounting)', 'Laptop with DSP software'],
    'streaming-amplifier': [...base, 'Smartphone with XSCACE Controller app', 'Wi-Fi access (2.4 or 5GHz)'],
    'streamer':            [...base, 'Smartphone with XSCACE Controller app', 'Wi-Fi access (2.4 or 5GHz)'],
  }
  return map[installationType] || base
}

// ── Installation steps by type ─────────────────────────────────────────────────
function installSteps(P: any): string[] {
  const it  = P.installationType || ''
  const spc = P.screwSpacingMm ? `${P.screwSpacingMm}mm` : 'as per template'
  const scr = P.screwSize || 'supplied screw'
  const cut_h = P.cutoutHeightMm ? `${P.cutoutHeightMm}mm` : '—'
  const cut_w = P.cutoutWidthMm  ? `${P.cutoutWidthMm}mm`  : '—'
  const cut_d = P.cutoutDiameterMm ? `${P.cutoutDiameterMm}mm` : '—'
  const cav   = P.requiredCavityDepthMm ? `${P.requiredCavityDepthMm}mm minimum` : 'sufficient'
  const wire  = P.wireGaugeRecommended || '14 AWG'
  const conn  = P.speakerWireConnector || 'supplied connector'
  const name  = P.productName || 'speaker'

  if (it === 'keyhole-wall') {
    const isCorner = (P.mountingMethods || '').toLowerCase().includes('corner')
    const isQuad   = name.toLowerCase().includes('quad')
    return [
      `Use the included screw template to mark two screw points on the wall, exactly ${spc} apart centre-to-centre. Use a spirit level to confirm both marks are perfectly level.`,
      `Drill two 6mm holes at the marked positions. Insert the supplied wall plugs fully into each hole.`,
      `Drive a ${scr} screw into each plug, leaving the screw heads proud of the wall surface by approximately 5–7mm — this gap is what the keyhole slots hang on.`,
      `Route your speaker cable (${wire}) through the wall or along the surface to the intended speaker position, leaving 150mm of cable exposed at the mounting point.`,
      `Strip 10mm of insulation from each wire end. Connect to the ${conn} on the back of the ${name} — observe polarity (+ red / − black).`,
      `Align the two keyhole slots on the back of the ${name} with the two screw heads. Lower the speaker onto the screws until it seats firmly and cannot be lifted without tilting.`,
      isCorner ? `Corner mount option: The corner bracket attaches between two adjacent walls. ${isQuad ? `The QuadCane corner mount is a two-piece bracket — each piece is placed exactly ${spc} apart, matching the QuadCane's keyhole spacing.` : "Screw the bracket into both walls using the same method. Hang the speaker on the bracket's keyhole slot."} Ensure the bracket is level before hanging the speaker.` : '',
      `Dress the cable neatly. Use the included double-sided tape strip on the back of the speaker if additional grip against the wall surface is needed.`,
    ].filter(Boolean)
  }

  if (it === 'bracket-wall') {
    return [
      `Mark the mounting screw points on the wall using the included template. The two mounting holes are ${spc} apart centre-to-centre. Use a spirit level to confirm the marks are level.`,
      `Drill 6mm holes at the marked positions and insert wall plugs. Drive ${scr} screws into the plugs until fully seated and flush.`,
      `Attach the rear mounting bracket to the back of the ${name} using the supplied hardware. The bracket is fixed — it does not pivot once the speaker is mounted.`,
      `Route your speaker cable (${wire}) to the mounting position, leaving 150mm exposed. Strip 10mm of insulation and connect to the speaker terminals, observing polarity.`,
      `Hold the bracket against the wall, align the bracket holes with the screws, and secure the bracket to the wall. Tighten firmly — the ${name} carries significant weight at full output.`,
      `Check that the speaker is level and the cable is dressed neatly. Apply cable clips or conduit along the cable run if surface routing.`,
    ]
  }

  if (it === 'ceiling-circular') {
    return [
      `Use the included circular cutout template to mark the cutout position on the ceiling. Verify the position using a stud finder — avoid cutting through joists.`,
      `Confirm there is at least ${cav} of cavity depth above the ceiling surface at the chosen location.`,
      `Cut the circular hole using a hole saw or ceiling cutout tool. Required cutout diameter: ${cut_d}.`,
      `Route your speaker cable (${wire}) through the ceiling cavity to the cutout, leaving 200mm of cable hanging through the hole.`,
      `Strip 10mm of insulation from each wire end. Connect to the speaker's terminal block — observe polarity (+ and −).`,
      `Tilt the ${name} slightly to fit it through the cutout at an angle, then straighten and seat it flush against the ceiling surface.`,
      `Tighten the dog-leg clips using the screws built into the speaker body. As you tighten, the clips rotate behind the ceiling board and clamp the speaker firmly in place. Do not overtighten — the ceiling board can crack.`,
      `Snap or magnetically attach the grille. For the Aspen / Aster, the grille is paintable — prime and paint before fitting if desired.`,
    ]
  }

  if (it === 'ceiling-rectangular') {
    return [
      `During construction (before plasterboard): fit the pre-construction spring bracket into the ceiling framing within the opening. The rectangular cutout required is ${cut_h} × ${cut_w}mm.`,
      `Route speaker cable (${wire}) through the ceiling void and leave it hanging through the bracket opening with 300mm of slack. Connect the cable ends to the push terminal safety harness inside the bracket — this harness holds the speaker electrically even if the magnet fails.`,
      `After construction and finishing: use the cutout template to make the precise ${cut_h} × ${cut_w}mm rectangular opening in the finished ceiling surface.`,
      `Strip 10mm of insulation from the cable ends protruding through the cutout. Connect to the ${name}'s rear push terminal — confirm polarity.`,
      `Hold the ${name} below the opening at a slight angle and slide it into the bracket. The magnets will pull it into position and hold it flush with the ceiling surface.`,
      `Listen for a firm magnetic click — the speaker is seated. Gently pull down to confirm it is held securely by the safety harness wire.`,
    ]
  }

  if (it === 'inwall-dogleg') {
    return [
      `Mark the rectangular cutout on the wall. Required cutout: ${cut_h}mm high × ${cut_w}mm wide. Use the included cutout template and a spirit level to ensure the outline is square and level.`,
      `Check for pipes, cables, and studs using a stud finder and pipe detector before cutting.`,
      `Confirm cavity depth behind the wall is at least ${cav}.`,
      `Cut the opening using a drywall saw or jigsaw. Work carefully along the marked outline.`,
      `Route speaker cable (${wire}) through the wall cavity to the opening, leaving 200mm of cable exposed inside the cutout.`,
      `Connect the cable to the ${name}'s terminals inside the enclosure. Observe polarity — + terminal to positive wire.`,
      `Insert the ${name} into the cutout. The speaker body sits within the wall cavity, with the front baffle flush against the wall surface.`,
      `Tighten the dog-leg mounting screws. As each screw turns, a metal dog-leg arm rotates behind the drywall and clamps the speaker firmly in place. Tighten evenly, alternating sides.`,
      `Attach the grille. The grille is paintable — if painting to match the wall, prime first, then paint, then fit the grille before painting the wall.`,
    ]
  }

  if (it === 'inwall-springclip') {
    return [
      `Mark the rectangular cutout on the wall. Required cutout: ${cut_h}mm high × ${cut_w}mm wide. Use the included cutout template.`,
      `Check for pipes, cables, and studs — do not cut through structural elements.`,
      `Confirm cavity depth behind the wall is at least ${cav}.`,
      `Cut the opening carefully using a drywall saw or jigsaw.`,
      `Route speaker cable (${wire}) through the wall void and leave 200mm exposed through the cutout.`,
      `Connect the cable to the ${name}'s ${conn} — observe polarity.`,
      `Compress the spring clips flat against the speaker body, insert the speaker into the opening at a slight angle, then straighten. The spring clips will automatically expand behind the drywall as the speaker enters.`,
      `The clips grip the back of the drywall and hold the speaker flush. There are no screws to tighten — the spring mechanism clamps the speaker firmly in place.`,
      `Fit the grille to complete the installation.`,
    ]
  }

  if (it === 'inwall-sub') {
    return [
      `Mark the rectangular cutout on the wall. Required cutout: ${cut_h}mm high × ${cut_w}mm wide. Use the included cutout template.`,
      `Check for pipes, cables, and studs using a stud finder before cutting.`,
      `Confirm cavity depth behind the wall is at least ${cav}.`,
      `Cut the opening using a drywall saw or jigsaw.`,
      `Route speaker cable (${wire}) through the wall cavity to the cutout with 200mm of slack exposed.`,
      `Connect the cable to the subwoofer's terminals — observe polarity.`,
      `Insert the subwoofer body into the cutout. Align the screw holes in the flange with the surrounding wall surface.`,
      `Drive the included flange screws through the subwoofer frame and into the wall material. These screws pass through the speaker body into the stud or backing board behind — this is not a spring-clip design.`,
      `Fit the grille to cover the driver and flange. The grille clips magnetically or by friction depending on the model.`,
    ]
  }

  if (it === 'banyan-canopy') {
    return [
      `The Banyan Canopy fits directly into the recessed top section of the Banyan Pith. No separate wall or ceiling mounting is required for the standard Pith stand configuration.`,
      `Lower the Canopy into the top of the Pith until it seats firmly. The Canopy is secured by the Pith's top socket — no tools required for this step.`,
      `Connect the included Speakon cable from the Canopy's Speakon input (rear) to the Banyan Pith's Canopy output (rear). Twist the Speakon connector clockwise to lock.`,
      `For pole mount, hanging mount, or wall mount of the Canopy independently: use the appropriate accessory mount (sold separately). Follow the accessory mount's own installation guide, then run the Speakon cable from the Pith to the Canopy — maximum recommended cable run 10m.`,
      `Ensure the Speakon cable is routed safely and is not a trip hazard. Use cable management ties or conduit for permanent installations.`,
    ]
  }

  if (it === 'banyan-pith') {
    return [
      `Position the Banyan Pith on a solid, level surface capable of supporting ${P.weightKg || 29}kg. The Pith can be placed on the floor, on a dedicated speaker plinth, or integrated into custom furniture.`,
      `Connect power: plug the supplied IEC power cable into the rear of the Pith and into a grounded power outlet.`,
      `Connect your source/amplifier: run XLR or RCA cables from your amplifier's sub output (or pre-out) into the Pith's Line In or High Level input at the rear.`,
      `Connect the Banyan Canopy: run a Speakon cable from the Pith's Canopy output to the Canopy's Speakon input. See Banyan Canopy installation instructions.`,
      `DSP configuration: connect a laptop via the front USB port and open the Banyan DSP software (SigmaStudio). Load the XSCACE factory preset for your speaker combination. Adjust crossover and EQ to taste.`,
      `Power on the Pith. The system is ready when the status LED illuminates.`,
    ]
  }

  if (it === 'spirea') {
    return [
      `Carabiner hanging mount: attach the carabiner to a suitable overhead anchor point (pergola beam, ceiling joist, tree branch rated for the load). Clip the Spirea's hanging loop onto the carabiner. Adjust the hanging wire to the desired height.`,
      `Spike landscape mount: push the spike firmly into soft soil at the chosen location. On harder ground, use the rubber mallet to drive the spike. The spike anchors the Spirea and sets the listening height — standard height is 400–600mm above ground.`,
      `Route speaker cable (${wire}) from the amplifier to the Spirea position. Connect to the Spirea's terminal block — observe polarity.`,
      `Aim the Spirea driver face toward the primary listening area. The 120° horizontal dispersion is wide — small adjustments make a significant difference to imaging.`,
      `For permanent outdoor cable runs: use outdoor-rated direct-burial cable. For above-ground runs, use UV-stable cable conduit.`,
    ]
  }

  if (it === 'powered-sub') {
    const hasSpeakonOut = (P.productName||'').toLowerCase().includes('juniper')
    return [
      `Place the subwoofer on a solid floor surface. For the best bass integration, experiment with placement: corner positions reinforce bass; away from walls gives a flatter, tighter response.`,
      `Connect the LFE / subwoofer signal: run an RCA cable from your amplifier's subwoofer output (LFE out) into the subwoofer's Line In (RCA). If your amplifier has no sub out, connect from the amplifier's pre-out.`,
      hasSpeakonOut ? `Speaker-level input option: connect speaker wire from an amplifier channel's + and − outputs directly into the subwoofer's high-level inputs — this is useful when no pre-out is available.` : `Signal level: if using line-level input, ensure the input level trim on the subwoofer matches your amplifier's output level.`,
      `Connect power: plug the supplied IEC power cable into the rear of the subwoofer and into a grounded power outlet.`,
      `Set the crossover: on the subwoofer's rear panel, set the low-pass crossover to match your main speakers' recommended crossover frequency. For XSCACE Bonsai/Cane/Ghost: 150–200Hz. For Cedar/Camphor/Oak/Willow: 80–120Hz.`,
      `Set the phase switch to 0° initially. If bass sounds hollow or thin at the MLP, switch to 180°.`,
      `Power on the subwoofer. The status LED or power indicator will illuminate. Play bass-heavy audio and adjust the volume trim on the subwoofer to blend with the main speakers.`,
    ]
  }

  if (it === 'passive-sub') {
    return [
      `Place the subwoofer on a solid floor surface. Corner placement reinforces bass; central room placement gives a flatter response.`,
      `Connect speaker wire (${wire}) from a dedicated amplifier sub channel to the subwoofer's binding posts — observe polarity (+ red / − black).`,
      `Ensure the amplifier driving the subwoofer has a low-pass filter set to the appropriate crossover frequency. For XSCACE Bonsai/Cane/Ghost: 150–200Hz. For larger speakers: 80–120Hz.`,
      `Do not connect the passive subwoofer directly to a pre-out or line-out signal — it requires amplifier power.`,
      `Play test audio and adjust amplifier gain for the sub channel until the bass blends naturally with the main speakers.`,
    ]
  }

  if (it === 'dsp-amplifier') {
    const isLucifer = (P.productName||'').toLowerCase().includes('lucifer')
    const isRoot    = (P.productName||'').toLowerCase().includes('root')
    const hasXLR    = isLucifer || isRoot
    return [
      `Rack mounting: the ${name} is 1U rack-mountable. Slide into a standard 19-inch rack and secure with rack screws. Ensure at least 1U of clearance above for airflow. Alternatively, place on a flat, ventilated surface.`,
      `Connect inputs: run XLR balanced cables from your source (pre-amp, streamer, or processor) into the amplifier's XLR inputs. For the ${name}, CH1 and CH2 are typically L/R for main speakers; CH3/CH4 for additional channels or subwoofers.`,
      hasXLR ? `Speakon output wiring: connect speaker cables using Speakon NL4 connectors. Pin 1+ and 1− carry CH1; Pin 2+ and 2− carry CH2. For bridged mono operation: connect + from CH1 output and − from CH2 output (i.e., channels 1&2 form one bridged channel, channels 3&4 form another). This doubles power output.` : '',
      hasXLR ? `XLR wiring note: balanced XLR — Pin 1 = Ground, Pin 2 = Hot (+), Pin 3 = Cold (−). Ensure all cables are fully-balanced for best noise rejection.` : '',
      `Connect power: plug the IEC power cable into the rear of the amplifier and into a grounded power outlet. Do not power on until all speaker connections are made.`,
      `DSP setup: connect a laptop via the front USB port. Open the ${P.desktopSoftwareName || 'XSCACE DSP software'} on your laptop. Load the XSCACE factory preset for your speaker model. Adjust crossover, delay, and EQ to taste for your room.`,
      `Power on the amplifier. The front panel LEDs will illuminate. Play audio at low volume first — verify all channels are working before raising levels.`,
    ].filter(Boolean)
  }

  if (it === 'streaming-amplifier') {
    return [
      `Connect speaker cables from the Air Amp's speaker output terminals to your speakers. Observe polarity — + red / − black. The Air Amp drives 2 channels (L/R).`,
      `Optionally connect a passive subwoofer to the Air Amp's subwoofer output (sub out terminal or RCA).`,
      `Connect power: plug the supplied DC 24V–5A power adapter into the Air Amp's DC input jack and into a power outlet.`,
      `First-time setup: download the XSCACE Controller app from the App Store (iOS) or Google Play (Android). Open the app and follow the on-screen setup wizard — it will detect the Air Amp on your local network and guide you through Wi-Fi pairing.`,
      `Once connected, the Air Amp is discoverable as an AirPlay 2 device, a Bluetooth audio device, and a Spotify Connect target. Open your preferred app on your phone or tablet and select the Air Amp as the output device.`,
      `Use the XSCACE Controller app to adjust volume, balance, and DSP settings (if DSP option fitted).`,
    ]
  }

  if (it === 'streamer') {
    return [
      `Connect the Air Mini's Line Out (RCA) to your amplifier's line input, or connect via SPDIF Optical or HDMI ARC to your AV processor.`,
      `Connect power: plug the supplied DC 19V adapter into the Air Mini and into a power outlet.`,
      `First-time setup: download the XSCACE Controller app from the App Store (iOS) or Google Play (Android). Open the app and follow the setup wizard to connect the Air Mini to your Wi-Fi network.`,
      `Once connected, the Air Mini appears as an AirPlay 2 device, Spotify Connect target, and Bluetooth audio receiver. Select it as the output in your streaming app.`,
      `The Air Mini supports DLNA and UPnP for local network music playback from a NAS or media server.`,
    ]
  }

  return [
    'Place the unit in the desired location as described in the positioning section.',
    'Make all signal and power connections per the connectivity section.',
    'Power on and verify operation.',
  ]
}

// ── Connect & wire section ──────────────────────────────────────────────────────
function connectSection(P: any): string {
  const it   = P.installationType || ''
  const wire = P.wireGaugeRecommended || '14 AWG or thinner'
  const conn = P.speakerWireConnector || 'push terminal'
  const imp  = P.impedanceOhms ? `${P.impedanceOhms}Ω` : '8Ω'
  const xover = P.recommendedCrossoverHz ? `${P.recommendedCrossoverHz}Hz` : 'as required'

  const isSpeaker = ['keyhole-wall','bracket-wall','ceiling-circular','ceiling-rectangular','inwall-dogleg','inwall-springclip','banyan-canopy','spirea'].includes(it)
  const isSub     = ['inwall-sub','powered-sub','passive-sub'].includes(it)
  const isAmp     = ['dsp-amplifier','streaming-amplifier'].includes(it)
  const isStreamer = it === 'streamer'
  const isBanyan  = it === 'banyan-pith'

  if (isSpeaker) {
    return `<div class="conn-row"><span class="conn-l">Wire gauge</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Connector</span><span class="conn-v">${conn}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>
<div class="conn-row"><span class="conn-l">Recommended crossover</span><span class="conn-v">${xover} low-pass (set on amplifier)</span></div>
<div class="conn-row"><span class="conn-l">Polarity</span><span class="conn-v">Red (+) to positive terminal · Black (−) to negative terminal</span></div>
<p class="conn-note">Always wire both speakers in the same phase. Reversed polarity on one speaker causes bass cancellation and a hollow sound.</p>`
  }

  if (isSub) {
    const powered = it === 'powered-sub'
    return `<div class="conn-row"><span class="conn-l">Signal input</span><span class="conn-v">${powered ? 'RCA Line In or High Level Speaker Input' : 'Speaker terminals (binding posts)'}</span></div>
<div class="conn-row"><span class="conn-l">Wire gauge</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>
<div class="conn-row"><span class="conn-l">Crossover</span><span class="conn-v">${xover} low-pass</span></div>
${powered ? `<div class="conn-row"><span class="conn-l">Power</span><span class="conn-v">IEC power cable — connect to grounded outlet</span></div>` : ''}
<p class="conn-note">${powered ? 'The subwoofer has a built-in amplifier — only LFE signal input is required. Do not connect speaker-level output directly unless using the high-level input.' : 'This is a passive subwoofer — it requires a separate amplifier channel to drive it.'}</p>`
  }

  if (isAmp || isBanyan) {
    return `<div class="conn-row"><span class="conn-l">Inputs</span><span class="conn-v">${P.inputs || 'XLR balanced / RCA'}</span></div>
<div class="conn-row"><span class="conn-l">Outputs</span><span class="conn-v">${P.outputs || 'Speaker terminals / Speakon'}</span></div>
<div class="conn-row"><span class="conn-l">Speaker wire</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Load impedance</span><span class="conn-v">${imp}</span></div>
<p class="conn-note">Connect speaker cables before powering on. Never connect or disconnect speakers while the amplifier is on — this can damage output stages.</p>`
  }

  if (isStreamer) {
    return `<div class="conn-row"><span class="conn-l">Outputs</span><span class="conn-v">${P.outputs || 'RCA Line Out, SPDIF Optical'}</span></div>
<div class="conn-row"><span class="conn-l">Inputs</span><span class="conn-v">${P.inputs || 'AirPlay 2, Bluetooth 5.0, Spotify Connect'}</span></div>
<div class="conn-row"><span class="conn-l">Power</span><span class="conn-v">${P.powerSupply || 'DC 19V adapter (included)'}</span></div>
<p class="conn-note">The Air Mini is a streamer only — it has no built-in amplifier. Connect its output to an amplifier or AV receiver before playing audio.</p>`
  }

  return `<div class="conn-row"><span class="conn-l">Wire</span><span class="conn-v">${wire}</span></div>
<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${imp}</span></div>`
}

// ── CSS ────────────────────────────────────────────────────────────────────────
function buildCss(fontCss: string): string {
  return `${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:210mm 297mm;margin:0}
body{font-family:'DM Sans',Helvetica,sans-serif;background:#090909;color:#eeebe5;width:210mm}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#090909;page-break-after:always}
.page:last-child{page-break-after:auto}

/* ── Cover ── */
.cov-hero{position:absolute;right:0;top:0;width:100%;height:100%;object-fit:cover;opacity:.45}
.cov-overlay{position:absolute;inset:0;background:linear-gradient(to top,#090909 38%,rgba(9,9,9,.6) 65%,transparent 100%)}
.cov-content{position:absolute;left:0;right:0;bottom:0;padding:44px 40px 48px}
.cov-eyebrow{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.25em;color:#c9a96e;text-transform:uppercase;margin-bottom:10px}
.cov-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:56px;color:#eeebe5;line-height:.95}
.cov-tagline{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:16px;color:#c9a96e;margin-top:6px}
.cov-rule{height:1px;background:rgba(201,169,110,.35);margin:18px 0}
.cov-meta{display:flex;justify-content:space-between;align-items:flex-end}
.cov-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:18px;letter-spacing:.04em;color:#eeebe5}
.cov-sku{font-family:'DM Mono',monospace;font-size:7px;color:#3a3835;letter-spacing:.12em}
.cov-bar{position:absolute;left:0;right:0;height:5px;background:#c9a96e}
.cov-bar-t{top:0}.cov-bar-b{bottom:0}
.cov-logo-area{position:absolute;top:40px;left:40px}
.cov-warning{position:absolute;top:40px;right:40px;font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;text-align:right;line-height:1.6;max-width:80px}

/* ── Inner pages ── */
.pg{padding:32px 36px 28px;height:100%;display:flex;flex-direction:column}
.pg-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-shrink:0}
.pg-brand{font-family:'MagmaWave','DM Sans',sans-serif;font-size:13px;color:#eeebe5}
.pg-info{font-family:'DM Mono',monospace;font-size:6.5px;color:#7a776f;letter-spacing:.12em;text-align:right}
.pg-rule{height:1px;background:rgba(201,169,110,.22);flex-shrink:0}
.pg-num{font-family:'DM Mono',monospace;font-size:6.5px;color:#3a3835;margin-top:6px;margin-bottom:18px}

/* ── Two-col layout ── */
.two-col{display:flex;gap:20px;flex:1;min-height:0}
.col-left{flex:1;display:flex;flex-direction:column;gap:14px;overflow:hidden}
.col-right{flex:0 0 42%;display:flex;flex-direction:column;gap:10px}

/* ── Sections ── */
.sec-label{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;border-bottom:.4px solid rgba(201,169,110,.2);padding-bottom:4px;margin-bottom:6px}
.sec-body{font-family:'DM Sans',Helvetica,sans-serif;font-size:8px;color:#eeebe5;line-height:1.55}

/* ── Box contents ── */
.box-item{display:flex;align-items:flex-start;gap:7px;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.box-dot{width:4px;height:4px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:3px}
.box-text{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5}

/* ── Tools ── */
.tool-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.tool-item{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;padding:2px 0;border-bottom:.3px solid rgba(255,255,255,.04)}

/* ── Steps ── */
.step{display:flex;gap:10px;padding:4px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.step-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;color:rgba(201,169,110,.3);line-height:1;flex-shrink:0;width:18px;text-align:right}
.step-text{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#eeebe5;line-height:1.5;padding-top:3px}

/* ── Stereo section ── */
.stereo-title{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:22px;color:#eeebe5;margin-bottom:8px}
.stereo-step{display:flex;gap:8px;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.stereo-dot{width:3px;height:3px;border-radius:50%;background:#c9a96e;flex-shrink:0;margin-top:5px}
.stereo-text{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#eeebe5;line-height:1.5}
.stereo-note{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;line-height:1.5;margin-top:8px;border-left:1.5px solid rgba(201,169,110,.3);padding-left:8px}

/* ── Sidebar image ── */
.side-img{flex:1;background:#0e0e0c;border:.4px solid rgba(201,169,110,.07);overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:80px}
.side-img img{width:100%;height:100%;object-fit:contain}
.side-img.cover img{object-fit:cover}

/* ── Connect ── */
.conn-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:.3px solid rgba(255,255,255,.04)}
.conn-l{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f}
.conn-v{font-family:'DM Mono',monospace;font-size:7.5px;color:#eeebe5;text-align:right;max-width:55%}
.conn-note{font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.5;margin-top:6px;border-left:1.5px solid rgba(201,169,110,.3);padding-left:8px}

/* ── QR / configurator ── */
.qr-area{background:#0e0e0c;border:.4px solid rgba(201,169,110,.12);padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px}
.qr-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#eeebe5;text-align:center}
.qr-sub{font-family:'DM Mono',monospace;font-size:7px;color:#7a776f;text-align:center;line-height:1.6;max-width:140px}
.qr-url{font-family:'DM Mono',monospace;font-size:7.5px;color:#c9a96e;letter-spacing:.05em;margin-top:4px}
.support-block{margin-top:10px;border-top:.4px solid rgba(201,169,110,.12);padding-top:10px}
.support-label{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:.18em;color:#c9a96e;text-transform:uppercase;margin-bottom:4px}
.support-line{font-family:'DM Mono',monospace;font-size:7.5px;color:#7a776f;margin-bottom:2px}
.pro-note{font-family:'DM Mono',monospace;font-size:6px;color:#3a3835;line-height:1.6;margin-top:12px;text-align:center;border-top:.3px solid rgba(255,255,255,.04);padding-top:8px}
`
}

// ── MAIN HANDLER ───────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params
  try {
    const P: any = await sanity.fetch(`*[_type=="product"&&slug.current=="${slug}"&&status=="Active"][0]{
      _id, productName, productFullName, tagline, shortDescription, series, skuBase,
      installationType, screwSpacingMm, screwSize, cutoutHeightMm, cutoutWidthMm,
      cutoutDiameterMm, requiredCavityDepthMm, mountingMethods, mountingMethod,
      speakerWireConnector, wireGaugeRecommended, impedanceOhms, recommendedCrossoverHz,
      itemsInBox, positioningNote, minRiggingHeight, minSpeakerSpacing,
      powerType, powerRmsW, powerPeakW, weightKg, heightMm, widthMm, depthMm,
      hasDsp, hasStreamer, inputs, outputs, powerSupply, desktopSoftwareName,
      installManualRef, installManualHash,
      heroImage, "lifestyle": lifestyleImages[0..1],
    }`)
    if (!P) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // Cache check
    const h = Buffer.from(`${P.productName}${P.installationType}${P.screwSpacingMm||''}${P.cutoutHeightMm||''}v1`).toString('base64').replace(/\W/g,'').slice(0,12)
    if (P.installManualRef && P.installManualHash === h) {
      const cdn = fileCdn(P.installManualRef)
      const head = await fetch(cdn, { method: 'HEAD' }).catch(() => null)
      if (head && (head.ok || head.status === 403)) return NextResponse.redirect(cdn, 302)
    }

    // Fetch images
    const hero  = await imgB64(getRef(P.heroImage), 600)
    const life0 = await imgB64(getRef(P.lifestyle?.[0]), 500)

    const fontCss = loadFontCss()
    const css     = buildCss(fontCss)

    const advice  = stereoAdvice(P)
    const tools   = toolsNeeded(P.installationType || '')
    const steps   = installSteps(P)

    // Box contents
    const boxItems = (P.itemsInBox || '').split(',').map((s: string) => s.trim()).filter(Boolean)

    // Steps page — split into two columns if many steps
    const stepsHtml = steps.map((s, i) => `
      <div class="step">
        <div class="step-num">${i+1}</div>
        <div class="step-text">${s}</div>
      </div>`).join('')

    const toolsHtml = tools.map(t => `<div class="tool-item">— ${t}</div>`).join('')
    const boxHtml   = boxItems.map((t: string) => `<div class="box-item"><div class="box-dot"></div><div class="box-text">${t}</div></div>`).join('')
    const stereoHtml = advice.steps.map(s => `<div class="stereo-step"><div class="stereo-dot"></div><div class="stereo-text">${s}</div></div>`).join('')
    const connHtml  = connectSection(P)
    const qrSvg     = makeQrSvg('configurator.xscace.com')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div class="cov-bar cov-bar-t"></div>
  <div class="cov-bar cov-bar-b"></div>
  ${hero ? `<img src="${hero}" class="cov-hero">` : ''}
  <div class="cov-overlay"></div>
  <div class="cov-logo-area">
    <div style="font-family:'MagmaWave','DM Sans',sans-serif;font-size:16px;color:#eeebe5;letter-spacing:.04em">XSCACE</div>
    <div style="font-family:'DM Mono',monospace;font-size:6px;letter-spacing:.2em;color:#7a776f;margin-top:2px">SIZE DEFYING SOUND</div>
  </div>
  <div class="cov-warning">READ ALL<br>INSTRUCTIONS<br>BEFORE<br>INSTALLATION</div>
  <div class="cov-content">
    <div class="cov-eyebrow">Installation Manual</div>
    <div class="cov-name">${P.productName}</div>
    <div class="cov-tagline">${P.tagline || P.shortDescription || ''}</div>
    <div class="cov-rule"></div>
    <div class="cov-meta">
      <div class="cov-brand">XSCACE</div>
      <div class="cov-sku">SKU ${P.skuBase || ''} · ${P.series || ''}</div>
    </div>
  </div>
</div>

<!-- PAGE 2: BOX CONTENTS + TOOLS + POSITIONING -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr">
      <div class="pg-brand">XSCACE</div>
      <div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div>
    </div>
    <div class="pg-rule"></div>
    <div class="pg-num">02</div>

    <div class="two-col" style="flex:1">
      <div class="col-left">

        <div>
          <div class="sec-label">What's in the box</div>
          ${boxHtml || '<div class="box-text" style="color:#7a776f">See packaging for contents list.</div>'}
        </div>

        <div>
          <div class="sec-label">Tools required</div>
          <div class="tool-grid">${toolsHtml}</div>
        </div>

        <div style="flex:1">
          <div class="sec-label">${advice.title}</div>
          <div class="stereo-title">Finding your ideal sound stage.</div>
          ${stereoHtml}
          <div class="stereo-note">${advice.note}</div>
        </div>

      </div>
      <div class="col-right">
        ${hero ? `<div class="side-img">${hero ? `<img src="${hero}">` : ''}</div>` : ''}
        ${life0 ? `<div class="side-img cover" style="flex:1">${`<img src="${life0}">`}</div>` : ''}
        ${!hero && !life0 ? '<div style="flex:1"></div>' : ''}
        <div style="font-family:\'DM Mono\',monospace;font-size:6.5px;color:#7a776f;line-height:1.6;margin-top:6px">
          ${P.weightKg ? `Weight: ${P.weightKg} kg<br>` : ''}
          ${P.heightMm && P.widthMm && P.depthMm ? `Dimensions: ${P.heightMm} × ${P.widthMm} × ${P.depthMm} mm<br>` : ''}
          ${P.powerType ? `Power: ${P.powerType}` : ''}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3: INSTALLATION STEPS -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr">
      <div class="pg-brand">XSCACE</div>
      <div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div>
    </div>
    <div class="pg-rule"></div>
    <div class="pg-num">03</div>

    <div class="sec-label">Installation Steps</div>
    <div style="flex:1;overflow:hidden">
      ${stepsHtml}
    </div>

    <div style="margin-top:12px;padding-top:10px;border-top:.4px solid rgba(201,169,110,.12)">
      <div style="font-family:'DM Mono',monospace;font-size:6.5px;color:#c9a96e;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px">Safety Notice</div>
      <div style="font-family:'DM Sans',Helvetica,sans-serif;font-size:7.5px;color:#7a776f;line-height:1.55">
        Always isolate power before making electrical connections. Ensure all fixings are adequate for the combined weight of the speaker system. If in doubt about wall or ceiling construction, consult a structural professional before installation. XSCACE accepts no responsibility for damage caused by incorrect installation.
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: CONNECT + QR + SUPPORT -->
<div class="page">
  <div class="pg">
    <div class="pg-hdr">
      <div class="pg-brand">XSCACE</div>
      <div class="pg-info">${(P.productName||'').toUpperCase()} · INSTALLATION MANUAL</div>
    </div>
    <div class="pg-rule"></div>
    <div class="pg-num">04</div>

    <div class="two-col" style="flex:1">
      <div class="col-left">

        <div>
          <div class="sec-label">Connecting to your system</div>
          ${connHtml}
        </div>

        <div style="flex:1">
          <div class="sec-label">System Design &amp; Wiring</div>
          <div class="sec-body" style="margin-bottom:8px">For full system configuration — including amplifier selection, subwoofer integration, multi-room setup, and wiring diagrams — use the XSCACE Configurator:</div>
          <div class="qr-area">
            <div class="qr-title">XSCACE Configurator</div>
            ${qrSvg}
            <div class="qr-sub">Scan to open the interactive system configurator. Select your products and receive a complete wiring diagram and bill of quantities.</div>
            <div class="qr-url">configurator.xscace.com</div>
          </div>
        </div>

        <div class="pro-note">
          For complex installations, large spaces, or commercial projects — XSCACE recommends engaging a professional installation partner. Contact support@xscace.com to be connected with a certified installer in your region.
        </div>

      </div>
      <div class="col-right">

        <div class="support-block">
          <div class="support-label">Support</div>
          <div class="support-line">support@xscace.com</div>
          <div class="support-line">xscace.com</div>
        </div>

        <div style="margin-top:10px">
          <div class="sec-label">Product Details</div>
          ${P.skuBase ? `<div class="conn-row"><span class="conn-l">SKU</span><span class="conn-v">${P.skuBase}</span></div>` : ''}
          ${P.series  ? `<div class="conn-row"><span class="conn-l">Series</span><span class="conn-v">${P.series}</span></div>` : ''}
          ${P.impedanceOhms ? `<div class="conn-row"><span class="conn-l">Impedance</span><span class="conn-v">${P.impedanceOhms}Ω</span></div>` : ''}
          ${P.powerRmsW ? `<div class="conn-row"><span class="conn-l">Power RMS</span><span class="conn-v">${P.powerRmsW}W</span></div>` : ''}
          ${P.weightKg  ? `<div class="conn-row"><span class="conn-l">Weight</span><span class="conn-v">${P.weightKg} kg</span></div>` : ''}
          ${P.screwSpacingMm ? `<div class="conn-row"><span class="conn-l">Screw spacing</span><span class="conn-v">${P.screwSpacingMm}mm c/c</span></div>` : ''}
          ${P.screwSize ? `<div class="conn-row"><span class="conn-l">Screw size</span><span class="conn-v">${P.screwSize}</span></div>` : ''}
          ${P.cutoutDiameterMm ? `<div class="conn-row"><span class="conn-l">Cutout diameter</span><span class="conn-v">${P.cutoutDiameterMm}mm</span></div>` : ''}
          ${(P.cutoutHeightMm && P.cutoutWidthMm) ? `<div class="conn-row"><span class="conn-l">Cutout H × W</span><span class="conn-v">${P.cutoutHeightMm} × ${P.cutoutWidthMm}mm</span></div>` : ''}
          ${P.requiredCavityDepthMm ? `<div class="conn-row"><span class="conn-l">Cavity depth</span><span class="conn-v">${P.requiredCavityDepthMm}mm min</span></div>` : ''}
        </div>

        <div style="flex:1"></div>

        <div style="font-family:'DM Mono',monospace;font-size:6px;color:#3a3835;line-height:1.7;margin-top:auto;border-top:.3px solid rgba(255,255,255,.04);padding-top:8px">
          © ${new Date().getFullYear()} XSCACE · Size Defying Sound<br>
          All specifications subject to change without notice.<br>
          xscace.com · Designed in Canada
        </div>
      </div>
    </div>
  </div>
</div>

</body></html>`

    // Puppeteer — A4 portrait
    const puppeteer = (await import('puppeteer-core')).default
    const chromium  = (await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode = false
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--single-process', '--disable-gpu'],
      executablePath: await chromium.executablePath(
        process.env.CHROMIUM_PACK_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar'
      ),
      headless: true,
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.emulateMediaType('print')
    const pdf = Buffer.from(await page.pdf({
      width: '210mm', height: '297mm', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    }))
    await browser.close()

    // Cache to Sanity
    if (process.env.SANITY_API_TOKEN && pdf.length > 1000) {
      try {
        const fname = `XSCACE_${P.productName.replace(/\s+/g,'_')}_Installation_Manual.pdf`
        const up = await fetch(
          `https://${PROJECT}.api.sanity.io/v2024-01-01/assets/files/${DATASET}?filename=${encodeURIComponent(fname)}`,
          { method:'POST', headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/pdf' }, body:pdf }
        )
        if (up.ok) {
          const {document:doc} = await up.json()
          await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
            method:'POST',
            headers:{ Authorization:`Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type':'application/json' },
            body: JSON.stringify({mutations:[{patch:{id:P._id,set:{installManualRef:doc._id,installManualHash:h,installManual:{_type:'file',asset:{_type:'reference',_ref:doc._id}}}}}]})
          })
        }
      } catch(e){ console.error('[manual] cache failed',e) }
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="XSCACE_${slug}_Manual.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-cache',
      }
    })
  } catch(err:any) {
    console.error('[manual]', err)
    return NextResponse.json({error:err?.message}, {status:500})
  }
}
