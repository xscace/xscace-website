'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Constraint = { cross: string; text: string; desc: string; angle: { y: number; x: number }; mode: string; last?: boolean }

const CONSTRAINTS_MAP: Record<string, Constraint[]> = {
  'prod-bonsai': [
    { cross:'×', text:'No visible fixings',       desc:'Every fastener is concealed. The grille, baffle and chassis unite as a single uninterrupted surface — nothing to catch the eye, nothing to break the plane.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No draft angle',            desc:'CNC machined, not cast. Zero draft — every edge is geometrically perfect and flush. No taper, no step, no visible gap against the wall.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No unnecessary pattern',    desc:'The only perforations are acoustic. Each 0.7mm aperture exists because sound requires it — not for decoration.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',   desc:'Anodised 6061 aerospace aluminium. The finish is applied under electrical current — it becomes part of the metal itself. Available in any RAL.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Just material. Just form.', desc:'When there is nothing to remove, design is complete. The Bonsai exists at the point where engineering and restraint arrive at the same answer.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-cane': [
    { cross:'×', text:'No visible fixings',        desc:'Every fastener is concealed. The grille, baffle and chassis unite as a single uninterrupted surface — nothing to catch the eye, nothing to break the plane.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No draft angle',            desc:'CNC machined, not cast. Zero draft — every edge is geometrically perfect and flush. No taper, no step, no visible gap against the wall.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No unnecessary pattern',    desc:'The only perforations are acoustic. Each 0.7mm aperture exists because sound requires it — not for decoration.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',   desc:'Anodised 6061 aerospace aluminium. The finish is applied under electrical current — it becomes part of the metal itself. Available in any RAL.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Just material. Just line.', desc:'When there is nothing to remove, design is complete. The Cane exists at the point where engineering and restraint arrive at the same answer.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-quadcane-ic': [
    { cross:'×', text:'No surface constraint',      desc:'The QuadCane IC installs flush into any flat surface — wall or ceiling — with the same bracket, the same cutout, the same result. Four drivers. One form factor. Zero compromises based on orientation.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No draft angle',              desc:'CNC machined, not cast. Zero draft on every edge — geometrically perfect and flush to any surface finish, any panel thickness, any wall or ceiling material.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No unnecessary pattern',      desc:'The only perforations are acoustic. Each aperture exists because sound requires it — not for decoration. The visual rhythm is a direct consequence of four-driver geometry.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',     desc:'Anodised 6061 aerospace aluminium. Applied under electrical current — the finish becomes part of the metal itself. Available in any RAL. Matches any interior, every time.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Four drivers. Any surface.',  desc:'The QuadCane IC arrays four drivers flush into wall or ceiling — the same line, the same output, regardless of which plane the surface happens to be.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-quadcane': [
    { cross:'×', text:'No visible fixings',        desc:'Every fastener is concealed. The grille, baffle and chassis unite as a single uninterrupted surface — nothing to catch the eye, nothing to break the plane.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No draft angle',            desc:'CNC machined, not cast. Zero draft — every edge is geometrically perfect and flush. No taper, no step, no visible gap against the wall.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No unnecessary pattern',    desc:'The only perforations are acoustic. Each 0.7mm aperture exists because sound requires it — not for decoration.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',   desc:'Anodised 6061 aerospace aluminium. The finish is applied under electrical current — it becomes part of the metal itself. Available in any RAL.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Four drivers. One voice.',  desc:'The QuadCane array is tuned as a single acoustic unit — four drivers time-aligned and phase-matched so the room hears one speaker, not four.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-cedar': [
    { cross:'×', text:'No wasted section',         desc:'75 × 75mm. The Cedar\'s entire cross-section is acoustic volume — no dead space, no decorative mass. Every cubic millimetre behind the grille face is load-bearing output.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No visible fixings',        desc:'Every fastener is concealed behind the grille plane. Wall, bracket, driver, baffle — resolved into a single vertical line. Nothing interrupts it from mounting point to top cap.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No arbitrary aperture',     desc:'The grille perforation pattern is derived from driver geometry, not imposed on it. Each opening is acoustically justified. The visual rhythm is a consequence of engineering.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',   desc:'Anodised 6061 aerospace aluminium. Applied under electrical current — the finish becomes part of the metal itself. Consistent across every face, every angle. Available in any RAL.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'75mm of wall. Full range.', desc:'The Cedar occupies 75mm of wall depth and returns a full-range array that scales from intimate rooms to large architectural spaces. It disappears — technically and visually — into the surface it serves.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-ghost2': [
    { cross:'×', text:'Flush to 0.3mm',            desc:'The bezel sits within a 0.3mm tolerance of your ceiling plane. No lip, no shadow line, no visual interruption. The ceiling you designed remains exactly as drawn.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No baffle diffraction',     desc:'The driver is recessed behind the micro-perforated grille. Sound exits before the baffle edge exists — eliminating the diffraction that colours conventional in-ceiling sound.', angle:{y:Math.PI*0.3,x:0.2}, mode:'normal' },
    { cross:'×', text:'No paint masking',          desc:'The grille accepts emulsion directly. Paint it once, paint it again — the acoustic apertures remain clear and the speaker disappears entirely into your ceiling.', angle:{y:0,x:0.3}, mode:'normal' },
    { cross:'×', text:'No asymmetric dispersion',  desc:'Dual coincident drivers deliver identical coverage at every listening position. No sweet spot. No dead zone. The room performs uniformly from every seat.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'The ceiling you designed, exactly.', desc:'When there is nothing to see, the room speaks for itself. The Ghost 2.0 is the point where acoustic engineering becomes invisible.', angle:{y:Math.PI*0.15,x:-0.15}, mode:'normal', last:true },
  ],
  'prod-cane-ic': [
    { cross:'×', text:'No surface constraint',      desc:'The Cane IC installs flush into any flat surface — wall or ceiling — with the same bracket, the same cutout, the same result. One slim-array form factor. Zero compromises based on orientation.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No draft angle',              desc:'CNC machined, not cast. Zero draft on every edge — geometrically perfect and flush to any surface finish, any panel thickness, any wall material.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No unnecessary pattern',      desc:'The only perforations are acoustic. Each aperture exists because sound requires it — not for decoration. The visual rhythm is a direct consequence of driver geometry.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',     desc:'Anodised 6061 aerospace aluminium. Applied under electrical current — the finish becomes part of the metal itself. Available in any RAL. Matches any interior, every time.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Wall or ceiling. One line.',  desc:'The Cane IC is the same slim vertical line whether it disappears into a wall or a ceiling. The room decides the orientation. The speaker does not.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-bonsai-ic': [
    { cross:'×', text:'No surface constraint',      desc:'The Bonsai IC installs flush into any flat surface — wall or ceiling — with the same bracket, the same cutout, the same result. One form factor. Zero compromises based on where the surface happens to be.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No visible fixings',          desc:'Every fastener is concealed behind the grille plane. Nothing to catch the eye, nothing to interrupt the surface. The wall and the speaker become the same plane.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No draft angle',              desc:'CNC machined, not cast. Zero draft on every edge — geometrically perfect and flush to any surface finish, any material, any panel thickness.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No compromise on finish',     desc:'Anodised 6061 aerospace aluminium. Applied under electrical current — the finish becomes part of the metal itself. Available in any RAL. Matches any interior, every time.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Wall or ceiling. 13mm deep.', desc:'The Bonsai IC occupies 13mm of any surface and disappears. Whether the installation is vertical or horizontal, the acoustic result — and the visual result — is the same.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-aster6': [
    { cross:'×', text:'No timbre mismatch',        desc:'The Aster 6 LCR is voice-matched to the full XSCACE in-ceiling range. Left, centre, right — the three channels share an identical acoustic signature. No tonal shift as the image moves across the screen.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No pointing required',       desc:'Coaxial point source — tweeter and woofer share a single acoustic centre. Every seat in the room receives the same timbre and imaging. No directional compromise.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No baffle-step colouration', desc:'Flush-mount geometry eliminates the baffle-step discontinuity. The response is flat, not tilted by the enclosure — the room EQ required is minimal.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No paint masking',           desc:'The grille accepts emulsion directly. One coat and the Aster 6 LCR becomes the ceiling. Nothing visible — only the audio position remains.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'35Hz to 22kHz. LCR matched.', desc:'The Aster 6 LCR returns full-range output from a single 208mm cutout. Matched, measured, and cinema-ready from a surface that disappears.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-aspen6': [
    { cross:'×', text:'No pointing required',       desc:'The Aspen 6 is a coaxial point source — tweeter and woofer share a single acoustic centre. Every seat in the room receives identical timbre, identical imaging. There is no sweet spot because the entire room is the sweet spot.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No orientation constraint',  desc:'A circle has no front. The Aspen 6 can be installed at any rotation and the acoustic axis remains perfectly on-axis with the listener. No alignment marks, no critical orientation.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No baffle-step colouration', desc:'The flush-mount geometry eliminates the baffle-step discontinuity. Treble energy is not directed forward at the expense of bass — the response is flat, not tilted by the enclosure.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No paint masking',           desc:'The grille accepts emulsion directly. One coat and the Aspen 6 disappears entirely into the ceiling. Available pre-painted or ready to accept any finish.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'50Hz to 22kHz. One cutout.', desc:'The Aspen 6 returns a full-range acoustic window from a single 248mm cutout. One speaker. One hole. Nothing visible.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-aspen8': [
    { cross:'×', text:'No pointing required',       desc:'The Aspen 8 is a coaxial point source — tweeter and woofer share a single acoustic centre. Every seat in the room receives identical timbre, identical imaging. There is no sweet spot because the entire room is the sweet spot.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No orientation constraint',  desc:'A circle has no front. The Aspen 8 can be installed at any rotation and the acoustic axis remains perfectly on-axis with the listener. No alignment marks, no critical orientation.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No baffle-step colouration', desc:'The flush-mount geometry eliminates the baffle-step discontinuity. Treble energy is not directed forward at the expense of bass — the response is flat, not tilted by the enclosure.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No paint masking',           desc:'The grille accepts emulsion directly. One coat and the Aspen 8 disappears entirely into the ceiling. Available pre-painted or ready to accept any finish.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'40Hz to 22kHz. One cutout.', desc:'The Aspen 8 returns a full-range acoustic window — down to 40Hz — from a single 285mm cutout. One speaker. One hole. Nothing visible.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-sage': [
    { cross:'×', text:'No timbre mismatch',        desc:'The Sage is voice-matched across its 2-way crossover for a flat, consistent response from 50Hz to 22kHz. What the recording engineer heard is what reaches the listener — no colouration, no upper-mid push.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No cabinet resonance',       desc:'Internal bracing and damping ensure the enclosure makes no acoustic contribution. The Sage produces only what the driver produces — nothing added, nothing coloured.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No off-axis degradation',    desc:'Consistent imaging and tonality across the listening room. Every seat receives the same performance from the front stage — no sweet spot, no drop-off at the edges.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No visible hardware',        desc:'Flush-mounted into the wall plane. The Sage does not protrude, does not shadow, does not exist in the room visually — only acoustically.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'50Hz to 22kHz. In the wall.', desc:'The Sage returns full-range performance from inside the wall surface — passive, precise, and completely invisible to the eye.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-bergenia': [
    { cross:'×', text:'No timbre shift',            desc:'The Bergenia is voice-matched to the Sage LCR. As sound moves from the front stage to the surround field, the tonal character remains identical — no colouration, no sense of leaving one speaker and entering another.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No cabinet resonance',       desc:'The enclosure is internally braced and acoustically damped. The structure produces no audible signature — only the programme material reaches the listener.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No pointing required',       desc:'Flat off-axis response ensures consistent imaging across the listening room. Every seat receives the same performance from the surround field.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No visible hardware',        desc:'Flush-mounted within the wall plane. The Bergenia does not exist in the visual field — only in the acoustic one.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'The surround field, complete.', desc:'The Bergenia closes the loop on a Sage-based cinema system. Front, surround, height — one consistent acoustic signature across every channel.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-willow': [
    { cross:'×', text:'No timbre shift',           desc:'The Willow is voice-matched to the Oak LCR. As sound moves from the front stage to the surround field, the tonal character remains identical — no colouration, no sense of leaving one speaker system and entering another.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No cabinet resonance',       desc:'The birch enclosure is internally braced and acoustically damped. The structure produces no audible signature — only the programme material reaches the listener.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No pointing required',       desc:'The passive crossover maintains flat off-axis response. Every seat in the room — not just the centre — receives consistent imaging and tonality from the surround field.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No visible hardware',        desc:'Flush-mounted within the wall plane. Grille forward of no surface. The room is the room — the Willow does not exist in the visual field, only the acoustic one.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'The surround field, complete.', desc:'The Willow closes the loop on an Oak-based cinema system. Front, surround, height — one consistent acoustic signature across every channel.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-banyan-canopy': [
    { cross:'×', text:'No passive compromise',      desc:'Six 5″ aluminium-cone woofers and three 1.5″ compression drivers with waveguide — each driver optimised for its band. No single driver stretched beyond its design envelope.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No narrowing off-axis',      desc:'The waveguide-loaded compression drivers maintain controlled 100° horizontal dispersion across the full high-frequency band. Every seat in the venue receives the same tonal character.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No separate amplifier rack', desc:'Pairs natively with the Banyan Pith — a powered sub-bass enclosure with 2000W built-in DSP amplification. The full system ships, connects, and calibrates as a single unit.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No weather concession',      desc:'IP-rated housing, UV-stabilised finish, marine-grade fixings. The Canopy is designed to stay outside permanently — not just survive the occasional shower.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'600W. Outdoors. Architectural.', desc:'Professional-grade SPL from a form factor that respects the space it occupies. The Banyan Canopy is PA performance without PA aesthetics.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-spirea': [
    { cross:'×', text:'No weatherproofing compromise', desc:'IP65-rated housing, UV-stabilised finish, and corrosion-resistant hardware. The Spirea is designed to stay outdoors permanently — through rain, sun, and salt air.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No subwoofer required',        desc:'XSCACE Bass Radiator technology extends low-frequency output well beyond what the driver size suggests. A passive radiator tuned to the enclosure delivers bass that a compact cabinet has no right to produce.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No separate amplifier',        desc:'70V/100V line-level compatible for distributed audio over long cable runs. Connect directly to your PA or distributed system without a matching transformer.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No fixed position',            desc:'Ground spikes and pendant hanging mount included in the box. Landscape stake one day, pergola suspension the next — no additional brackets required.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'Outdoor audio. Architectural.', desc:'The Spirea disappears into the landscape. Weatherproof, full-range, and PA-ready — a speaker that respects the space it occupies.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-banyan-pith': [
    { cross:'×', text:'No external amplifier',      desc:'2000W Class D amplification lives inside the Pith enclosure. No rack, no matching, no separate power supply — one cable in, full bass out.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No guesswork crossover',     desc:'SigmaStudio DSP manages the crossover digitally. Every parameter — frequency, slope, delay, EQ — is set precisely in software and recalled on every power cycle.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No port turbulence',         desc:'Dual 12″ long-throw drivers in a tuned birch enclosure. Bass output reaches 27Hz without audible port noise or compression at reference SPL.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No calibration drift',       desc:'All DSP parameters are stored in non-volatile memory. The Pith returns to the exact configured state after any power event — no re-tuning, no guessing.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'27Hz. Outdoors. Controlled.', desc:'The Banyan Pith is the engine of the Banyan Set — 1200W of sub-bass, calibrated for outdoor pressure and paired to the Canopy with surgical precision.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-oak': [
    { cross:'×', text:'No passive compromise',      desc:'Three dedicated drivers — two 8.5″ woofers, a 5″ midrange, and a 1″ ceramic dome tweeter — each optimised for its band alone. No driver asked to do what it was not designed for.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No cabinet resonance',       desc:'The birch enclosure is braced and damped to produce no audible colouration. The structure exists to eliminate its own contribution — what you hear is only the programme material.', angle:{y:Math.PI*0.38,x:0}, mode:'normal' },
    { cross:'×', text:'No off-axis degradation',    desc:'The PrecisionXover Array crossover maintains phase coherence and flat off-axis response across the listening room. Every seat hears the same speaker.', angle:{y:0,x:0.18}, mode:'normal' },
    { cross:'×', text:'No visible hardware',        desc:'Flush-mounted within the wall plane. Grille forward of no surface. The room is the room — the speaker does not exist in the visual field, only the acoustic one.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
    { cross:'→', text:'40Hz to 22kHz. In the wall.', desc:'The Oak returns full cinema-grade bandwidth from inside the wall surface. 350W RMS, 3-way, 4Ω — built for the listening room that takes sound seriously.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
  ],
  'prod-acacia6-pw': [
    { cross:'×', text:'No port noise',             desc:'XS-Flow port geometry eliminates turbulence at the vent exit. Full bass output at reference levels — no chuffing, no compression, no audible artefact.', angle:{y:0,x:0.1}, mode:'normal' },
    { cross:'×', text:'No external amplifier',     desc:'A 200W Class D amplifier lives inside the enclosure. One cable in, sound out. No rack, no matching, no separate power supply.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No crossover guesswork',    desc:'The LFE input accepts a dedicated subwoofer signal directly. The built-in low-pass filter is adjustable — set it once and forget it.', angle:{y:0,x:-0.15}, mode:'normal' },
    { cross:'×', text:'No visible driver',         desc:'The grille sits flush with the enclosure face. No protruding cone, no visible surround. A sealed surface that happens to reproduce 35Hz.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'Bass that disappears.',     desc:'The Acacia 6 is felt before it is heard. Pressure without presence — the room fills with low frequency energy and the source stays invisible.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
  'prod-acacia10-pw': [
    { cross:'×', text:'No port noise',             desc:'XS-Flow port geometry eliminates turbulence at the vent exit. Full bass output at reference levels — no chuffing, no compression, no audible artefact.', angle:{y:0,x:0.1}, mode:'normal' },
    { cross:'×', text:'No external amplifier',     desc:'A 200W Class D amplifier lives inside the enclosure. One cable in, sound out. No rack, no matching, no separate power supply.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No crossover guesswork',    desc:'The LFE input accepts a dedicated subwoofer signal directly. The built-in low-pass filter is adjustable — set it once and forget it.', angle:{y:0,x:-0.15}, mode:'normal' },
    { cross:'×', text:'No visible driver',         desc:'The grille sits flush with the enclosure face. No protruding cone, no visible surround. A sealed surface that happens to reproduce 35Hz.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'Bass that disappears.',     desc:'The Acacia 10 is felt before it is heard. Pressure without presence — the room fills with low frequency energy and the source stays invisible.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
  'prod-acacia6-std': [
    { cross:'×', text:'No port noise',          desc:'XS-Flow port geometry eliminates turbulence at the vent exit. Full bass output at reference levels — no chuffing, no compression, no audible artefact.', angle:{y:0,x:0.1}, mode:'normal' },
    { cross:'×', text:'No amplifier lock-in',   desc:'The Acacia 6 Passive pairs with any amplifier that delivers a subwoofer signal. Your signal chain. Your choice.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No crossover guesswork', desc:'The LFE input accepts a dedicated subwoofer signal directly. Set the crossover in your amplifier or DSP once — the Acacia handles the rest.', angle:{y:0,x:-0.15}, mode:'normal' },
    { cross:'×', text:'No visible driver',      desc:'The grille sits flush with the enclosure face. No protruding cone, no visible surround. A sealed surface that happens to reproduce 35Hz.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'Bass that disappears.',  desc:'The Acacia 6 Passive is felt before it is heard. Pressure without presence — the room fills with low frequency energy and the source stays invisible.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
  'prod-acacia10-std': [
    { cross:'×', text:'No port noise',          desc:'XS-Flow port geometry eliminates turbulence at the vent exit. Full bass output at reference levels — no chuffing, no compression, no audible artefact.', angle:{y:0,x:0.1}, mode:'normal' },
    { cross:'×', text:'No amplifier lock-in',   desc:'The Acacia 10 Passive pairs with any amplifier that delivers a subwoofer signal. Your signal chain. Your choice.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No crossover guesswork', desc:'The LFE input accepts a dedicated subwoofer signal directly. Set the crossover in your amplifier or DSP once — the Acacia handles the rest.', angle:{y:0,x:-0.15}, mode:'normal' },
    { cross:'×', text:'No visible driver',      desc:'The grille sits flush with the enclosure face. No protruding cone, no visible surround. A sealed surface that happens to reproduce 35Hz.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'Bass that disappears.',  desc:'The Acacia 10 Passive is felt before it is heard. Pressure without presence — the room fills with low frequency energy and the source stays invisible.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
  'prod-xylem2': [
    { cross:'×', text:'No rack required',          desc:'The Xylem 2 mounts behind a screen, inside a cabinet, or within a wall box. No separate rack space, no ventilation cutouts, no visible hardware in the room.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No passive crossover',      desc:'DSP-active crossover runs inside the unit. Each output is individually time-aligned and equalised in the digital domain — no passive components in the signal path.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No configuration drift',   desc:'Every parameter is stored in non-volatile memory. Power cycle, power cut, firmware update — the amplifier returns to the exact state you configured.', angle:{y:0,x:0.2}, mode:'normal' },
    { cross:'×', text:'No signal degradation',    desc:'Class D topology with 0.01% THD+N. 400W total across 2 channels, each independently regulated. Drive any 4–8Ω load without compensation.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'Every parameter. Recalled.', desc:'The Xylem 2 is the infrastructure behind the sound — invisible in the room, precise in the rack, total in its control.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
  'prod-xylem3': [
    { cross:'×', text:'No rack required',          desc:'The Xylem 3 fits inside a cabinet, wall box, or behind any panel with a single power cable. No rack infrastructure, no separate sub amplifier.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No separate sub amp',       desc:'The dedicated 200W LFE channel drives any passive subwoofer directly. The two full-range channels handle satellites. One box, one cable run, complete system.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No passive crossover',      desc:'DSP-active crossover separates bass from full-range in the digital domain. Crossover frequency, slope, and alignment are set precisely in software.', angle:{y:0,x:0.2}, mode:'normal' },
    { cross:'×', text:'No configuration drift',   desc:'Every DSP parameter is stored in non-volatile memory. The amplifier returns to the exact state you configured after any power event.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'2.1 — in one unit.',       desc:'The Xylem 3 is the only amplifier you need for a complete 2.1 system. Satellites, subwoofer, crossover, EQ — all resolved inside a single chassis.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
  'prod-xylem4': [
    { cross:'×', text:'No rack required',          desc:'The Xylem 4 fits inside a cabinet or wall cavity. Four channels of amplification in a chassis that disappears behind the installation.', angle:{y:0,x:0}, mode:'normal' },
    { cross:'×', text:'No zone controller',        desc:'Each channel can be independently configured — different EQ, different delay, different level. Drive four separate zones from one unit without any additional hardware.', angle:{y:Math.PI*0.3,x:0}, mode:'normal' },
    { cross:'×', text:'No passive crossover',      desc:'DSP-active crossover on all four channels. Each output is individually time-aligned to the listening position and room geometry.', angle:{y:0,x:0.2}, mode:'normal' },
    { cross:'×', text:'No synchronisation issues', desc:'All four channels share a single clock domain. Phase coherence between zones is maintained to the sample — no latency offset between drivers.', angle:{y:-Math.PI*0.25,x:0}, mode:'normal' },
    { cross:'→', text:'Four channels. One system.', desc:'The Xylem 4 is the foundation of any multi-zone architectural installation — four independently managed channels in the space of one.', angle:{y:Math.PI*0.15,x:0.05}, mode:'normal', last:true },
  ],
}

// Fallback for products without specific constraints
const CONSTRAINTS_DEFAULT: Constraint[] = [
  { cross:'×', text:'No visible fixings',        desc:'Every fastener is concealed. The grille, baffle and chassis unite as a single uninterrupted surface.', angle:{y:0,x:0}, mode:'normal' },
  { cross:'×', text:'No compromise on finish',   desc:'Anodised 6061 aerospace aluminium. The finish is applied under electrical current — it becomes part of the metal itself.', angle:{y:-Math.PI*0.28,x:0}, mode:'fingerprint' },
  { cross:'→', text:'Engineered to disappear.',  desc:'When there is nothing to remove, design is complete.', angle:{y:Math.PI*0.2,x:-0.1}, mode:'normal', last:true },
]

const FLAGSHIP_IDS = ['prod-bonsai', 'prod-bonsai-ic', 'prod-cane', 'prod-cane-ic', 'prod-quadcane', 'prod-quadcane-ic', 'prod-cedar', 'prod-ghost2', 'prod-aspen6', 'prod-aspen8', 'prod-aster6', 'prod-acacia6-pw', 'prod-acacia10-pw', 'prod-xylem2', 'prod-xylem3', 'prod-xylem4', 'prod-oak', 'prod-willow', 'prod-sage', 'prod-bergenia', 'prod-banyan-canopy', 'prod-banyan-pith', 'prod-spirea', 'prod-acacia6-std', 'prod-acacia10-std']

interface Props {
  modelUrl?: string
  productName: string
  productId: string
  minimal?: boolean  // canvas only — no constraints panel
}

// ── CLICK SOUND ───────────────────────────────────────────────────────────────
function playClick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / ctx.sampleRate
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 160) * (t < 0.002 ? 1 : 0.25)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'; f.frequency.value = 2400
    const g = ctx.createGain(); g.gain.value = 0.15
    src.connect(f); f.connect(g); g.connect(ctx.destination)
    src.start()
    setTimeout(() => ctx.close(), 300)
  } catch(e) {}
}

// ── OVERLAY CANVAS (2D effects on 3D canvas) ──────────────────────────────────
function OverlayEffects({ mode, active, canvasW, canvasH, mouseX, mouseY }: {
  mode: string; active: boolean; canvasW: number; canvasH: number; mouseX: number; mouseY: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const fingerprintsRef = useRef<{ x: number; y: number; r: number; a: number; life: number }[]>([])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = canvasW
    canvas.height = canvasH
    if (!active) {
      cancelAnimationFrame(animRef.current)
      canvas.getContext('2d')?.clearRect(0, 0, canvasW, canvasH)
      return
    }
    const ctx = canvas.getContext('2d')!
    const W = canvasW, H = canvasH
    let t = 0

    // Centre of model in canvas space (approx)
    const CX = W * 0.48, CY = H * 0.48

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      t += 0.016


      if (mode === 'fingerprint') {
        // Fingerprint smudges appear near cursor, fade out
        // Add new fingerprint near mouse
        const mx = mouseX * W, my = mouseY * H
        const inModel = mx > W*0.3 && mx < W*0.7 && my > H*0.15 && my < H*0.85
        if (inModel && Math.random() < 0.06) {
          fingerprintsRef.current.push({
            x: mx + (Math.random()-0.5)*20,
            y: my + (Math.random()-0.5)*15,
            r: 8 + Math.random()*12,
            a: 0.12 + Math.random()*0.08,
            life: 1,
          })
        }

        // Draw + decay fingerprints
        fingerprintsRef.current = fingerprintsRef.current.filter(fp => fp.life > 0.01)
        fingerprintsRef.current.forEach(fp => {
          fp.life -= 0.006
          const a = fp.a * fp.life
          ctx.save()
          ctx.translate(fp.x, fp.y)
          ctx.rotate(fp.x * 0.03)
          // Fingerprint oval smudge
          ctx.beginPath()
          ctx.ellipse(0, 0, fp.r, fp.r * 0.55, 0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,245,220,${a * 0.4})`
          ctx.fill()
          // Ridge lines
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath()
            ctx.ellipse(0, i * 2.5, fp.r * 0.7, fp.r * 0.2, 0, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(255,245,220,${a * 0.5})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
          ctx.restore()
        })

        // Subtle text hint
        if (fingerprintsRef.current.length === 0) {
          ctx.font = '8px DM Mono, monospace'
          ctx.fillStyle = 'rgba(201,169,110,0.2)'
          ctx.textAlign = 'center'
          ctx.fillText('Move cursor over the surface', W * 0.46, H * 0.92)
          ctx.textAlign = 'left'
        }
      }


      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [mode, active, canvasW, canvasH, mouseX, mouseY])

  return (
    <canvas ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ModelReveal({ modelUrl, productName, productId, minimal }: Props) {
  const mountRef    = useRef<HTMLDivElement>(null)
  const [wire, setWire]         = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const [active, setActive]     = useState(0)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const [mouseNorm, setMouseNorm]   = useState({ x: 0.5, y: 0.5 }) // 0-1

  const rendererRef  = useRef<any>(null)
  const spotRef      = useRef<any>(null)
  const groupRef     = useRef<any>(null)
  const origMatsRef  = useRef<Map<any, any>>(new Map())
  const wireMatsRef  = useRef<Map<any, any>>(new Map())
  const animIdRef    = useRef<number>(0)
  const mouseRef     = useRef({ x: 0, y: 0 }) // -1 to 1
  const targetYRef   = useRef(0)
  const targetXRef   = useRef(0)
  const currentYRef  = useRef(0)
  const currentXRef  = useRef(0)
  const sceneRef     = useRef<any>(null)
  const cameraRef    = useRef<any>(null)

  const isFlag = FLAGSHIP_IDS.includes(productId)

  // ── Init Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el || !isFlag) return
    let cancelled = false

    const inject = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return }
      const s = document.createElement('script')
      s.src = src; s.onload = () => res(); s.onerror = rej
      document.head.appendChild(s)
    })

    const run = async () => {
      try {
  // Per-product calibrated settings
  const MODEL_SETTINGS: Record<string, {
    cam: [number,number,number], rot: [number,number,number], fov: number,
    exposure: number, ambient: number, key: number, fill: number
  }> = {
        'prod-bonsai':    { cam:[0.18,2.00,3],      rot:[0.158,-0.582,-1.572], fov:60, exposure:0.25,  ambient:0,   key:0.0, fill:3.7 },
    'prod-bonsai-ic': { cam:[0.18,2.00,3],      rot:[0.158,-0.582,-1.572], fov:60, exposure:0.25,  ambient:0,   key:0.0, fill:3.7 },
    'prod-cane':      { cam:[-0.08,0.56,3.03], rot:[0.138,-0.792,-1.502], fov:49, exposure:0.25, ambient:0,   key:2.0, fill:0.7 },
    'prod-cane-ic':   { cam:[-0.08,0.56,3.03], rot:[0.138,-0.792,-1.502], fov:49, exposure:0.25, ambient:0,   key:2.0, fill:0.7 },
    'prod-ghost2':    { cam:[-0.01,0,3],          rot:[0.318,-0.012,0.000],  fov:69, exposure:0.9,  ambient:0,   key:0.8, fill:0   },
    'prod-aster6':    { cam:[0,0,3],              rot:[0.000,-0.702,0.000],  fov:72, exposure:0.85, ambient:0,   key:2.5, fill:0.5 },
    'prod-aspen6':    { cam:[0,0,3],              rot:[0.000,-0.702,0.000],  fov:72, exposure:0.85, ambient:0,   key:2.5, fill:0.5 },
    'prod-aspen8':    { cam:[0,0,3],              rot:[0.000,-0.702,0.000],  fov:72, exposure:0.85, ambient:0,   key:2.5, fill:0.5 },
    'prod-acacia6-pw':{ cam:[0,0,3],              rot:[0.000,-0.702,0.000],  fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
    'prod-acacia10-pw':{ cam:[0,0,3],             rot:[0.000,-0.702,0.000],  fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
    'prod-xylem2':    { cam:[-0.01,-0.67,3],      rot:[-3.622,2.818,-0.002], fov:78, exposure:0.6,  ambient:0,   key:0.0, fill:1.6 },
    'prod-xylem3':    { cam:[-0.01,-0.67,3],      rot:[-3.622,2.818,-0.002], fov:78, exposure:0.6,  ambient:0,   key:0.0, fill:1.6 },
    'prod-xylem4':    { cam:[-0.01,-0.67,3],      rot:[-3.622,2.818,-0.002], fov:78, exposure:0.6,  ambient:0,   key:0.0, fill:1.6 },
    'prod-quadcane':  { cam:[0.18,-0.14,2.43],    rot:[2.308,1.588,-0.702],  fov:45, exposure:0.65, ambient:0,   key:0.0, fill:0.8 },
  'prod-cedar':     { cam:[0.14,0.12,2.75],      rot:[-3.362,-0.892,-3.142], fov:57, exposure:1.35, ambient:0,  key:2.3, fill:0.0 },
  'prod-oak':       { cam:[0,0,3],              rot:[0.000,-0.502,0.000],  fov:65, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-quadcane-ic': { cam:[-0.08,0.56,3.03], rot:[0.138,-0.792,-1.502], fov:49, exposure:0.25, ambient:0,   key:2.0, fill:0.7 },
  'prod-willow':    { cam:[0,0,3],              rot:[0.000,-0.502,0.000],  fov:65, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-sage':      { cam:[0,0,3],              rot:[0.000,-0.502,0.000],  fov:65, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-bergenia':    { cam:[0,0,3],              rot:[0.000,-0.502,0.000],  fov:72, exposure:0.85, ambient:0,   key:2.0, fill:0.5 },
  'prod-banyan-canopy':{ cam:[0,0,3.2],          rot:[0.000,-0.45,0.000],   fov:62, exposure:1.0,  ambient:0,   key:2.2, fill:0.4 },
  'prod-banyan-pith':  { cam:[0,0,3.2],          rot:[0.000,-0.40,0.000],   fov:65, exposure:1.0,  ambient:0,   key:2.2, fill:0.4 },
  'prod-spirea':       { cam:[0,0,3.2],          rot:[0.000,-0.45,0.000],   fov:62, exposure:1.0,  ambient:0,   key:2.0, fill:0.4 },
  'prod-acacia6-std':  { cam:[0,0,3],            rot:[0.000,-0.702,0.000],  fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
  'prod-acacia10-std': { cam:[0,0,3],            rot:[0.000,-0.702,0.000],  fov:78, exposure:0.15, ambient:0,   key:5.0, fill:0.8 },
  }
  const s = (productId && MODEL_SETTINGS[productId]) ? MODEL_SETTINGS[productId]
    : { cam:[0,0,0.82] as [number,number,number], rot:[0,0,0] as [number,number,number], fov:28, exposure:0.75, ambient:0.04, key:0.08, fill:0.2 }


        if (!(window as any).THREE) await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js')
        if (!(window as any).THREE?.GLTFLoader) {
          await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js')
          await new Promise(r => setTimeout(r, 80))
        }
        if (!(window as any).THREE?.DRACOLoader) {
          await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js')
          await new Promise(r => setTimeout(r, 60))
        }
        if (!(window as any).THREE?.RGBELoader) {
          await inject('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/RGBELoader.js')
          await new Promise(r => setTimeout(r, 60))
        }
        if (cancelled) return

        const THREE = (window as any).THREE
        const W = el.offsetWidth
        const H = el.offsetHeight || 600
        setCanvasSize({ w: W, h: H })

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = s.exposure
        renderer.setClearColor(0x000000, 1)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        el.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(s.fov, W / H, 0.01, 100)
        camera.position.set(...s.cam)
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // ── Lighting ──
        scene.add(new THREE.AmbientLight(0xffffff, s.ambient))

        const fill = new THREE.DirectionalLight(0xfff0dd, s.key)
        fill.position.set(2, 3, 2); scene.add(fill)
        const fillLeft = new THREE.DirectionalLight(0xc9a96e, s.fill)
        fillLeft.position.set(-2, 1, 1); scene.add(fillLeft)

        // Depth-creating underlight (fake AO)
        const under = new THREE.DirectionalLight(0x080808, 0.5)
        under.position.set(0, -3, 0.5); scene.add(under)

        const rim = new THREE.DirectionalLight(0xc9a96e, 0.2)
        rim.position.set(0, 0.5, -2); scene.add(rim)

        // Depth of field simulation: slight back light
        const back = new THREE.DirectionalLight(0xfff8ee, 0.05)
        back.position.set(0, 2, -1.5); scene.add(back)

        // Cursor follow light — PointLight tracks pointer position over the model
        const spot = new THREE.PointLight(0xfff8e7, 0, 8, 2)
        spot.position.set(0, 0, 3)
        scene.add(spot)
        spotRef.current = spot
        // Lerp targets for smooth follow
        const spotTarget = { x: 0, y: 0, z: 3 }
        ;(spotRef as any)._target = spotTarget



        // ── HDR Environment Map (studio lighting reflection) ──
        // Procedural HDR: simulate a studio with warm key + cool fill
        // We build it as a DataTexture so no external file needed
        const hdrSize = 128
        const hdrData = new Float32Array(hdrSize * hdrSize * 4)
        for (let y = 0; y < hdrSize; y++) {
          for (let x = 0; x < hdrSize; x++) {
            const nx = x / hdrSize  // 0-1 across equirect
            const ny = y / hdrSize
            // Azimuth and elevation
            const az = nx * Math.PI * 2
            const el = (ny - 0.5) * Math.PI
            // Key light: warm, upper left
            const dKey = Math.max(0, Math.cos(az - Math.PI * 1.3) * Math.cos(el - 0.5))
            // Fill: cool, right
            const dFill = Math.max(0, Math.cos(az - 0.2) * Math.cos(el - 0.1))
            // Floor: very dark warm
            const dFloor = Math.max(0, -Math.sin(el)) * 0.3
            // Ceiling: neutral cool
            const dCeil = Math.max(0, Math.sin(el)) * 0.15
            const i = (y * hdrSize + x) * 4
            hdrData[i]   = dKey * 0.9 + dFill * 0.15 + dFloor * 0.08 + 0.01  // R
            hdrData[i+1] = dKey * 0.7 + dFill * 0.18 + dFloor * 0.06 + 0.01 // G
            hdrData[i+2] = dKey * 0.45 + dFill * 0.25 + dCeil * 0.06 + 0.01 // B
            hdrData[i+3] = 1
          }
        }
        const envTex = new THREE.DataTexture(hdrData, hdrSize, hdrSize, THREE.RGBAFormat, THREE.FloatType)
        envTex.mapping = THREE.EquirectangularReflectionMapping
        envTex.needsUpdate = true
        scene.environment = envTex
        renderer.outputEncoding = THREE.LinearEncoding

        // ── Load GLB ──
        if (modelUrl) {
          let url = modelUrl
          if (modelUrl.includes('/models/')) url = `/api/glb/${modelUrl.split('/models/').pop()}`
          else if (!modelUrl.startsWith('http')) url = modelUrl.startsWith('/') ? modelUrl : `/${modelUrl}`

          const dracoLoader = new THREE.DRACOLoader()
          dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/')
          const gltfLoader = new THREE.GLTFLoader()
          gltfLoader.setDRACOLoader(dracoLoader)
          gltfLoader.load(url, (gltf: any) => {
            if (cancelled) return
            const model = gltf.scene
            const box = new THREE.Box3().setFromObject(model)
            const centre = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const normScale = 2.0 / Math.max(size.x, size.y, size.z)
            model.scale.setScalar(normScale)
            model.position.sub(centre.multiplyScalar(normScale))
            const group = new THREE.Group()
            group.add(model)
            scene.add(group)
            groupRef.current = group
            // Apply base rotation to group and init lerp refs so mouse-follow starts from s.rot
            group.rotation.set(s.rot[0], s.rot[1], s.rot[2])
            targetXRef.current  = s.rot[0]
            targetYRef.current  = s.rot[1]
            currentXRef.current = s.rot[0]
            currentYRef.current = s.rot[1]

            const isAster      = productId === 'prod-aster6'
            const isCaneIc     = productId === 'prod-cane-ic'
            const isBonsaiIc   = productId === 'prod-bonsai-ic'
            const isQuadCaneIc = productId === 'prod-quadcane-ic'
            model.traverse((child: any) => {
              if (!child.isMesh) return
              if (isAster) {
                const mat = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(0x0d0d0d),
                  roughness: 0.82,
                  metalness: 0.0,
                  envMapIntensity: 0.05,
                })
                child.material = mat
                origMatsRef.current.set(child, mat)
              } else if (isCaneIc) {
                const mat = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(0xf0eeea),
                  roughness: 0.78,
                  metalness: 0.0,
                  envMapIntensity: 0.08,
                })
                child.material = mat
                origMatsRef.current.set(child, mat)
              } else if (isBonsaiIc || isQuadCaneIc) {
                const mat = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(0xf2f0ed),
                  roughness: 0.78,
                  metalness: 0.0,
                  envMapIntensity: 0.08,
                })
                child.material = mat
                origMatsRef.current.set(child, mat)
              } else {
                origMatsRef.current.set(child, child.material)
              }
              wireMatsRef.current.set(child, new THREE.MeshBasicMaterial({
                color: new THREE.Color(0xc9a96e), wireframe: true, transparent: true, opacity: 0.3,
              }))
            })

            // reflection removed

            setLoaded(true)
          }, undefined, (e: any) => console.error('GLB:', e))
        } else {
          setLoaded(true)
        }

        // ── Animate ──
        const animate = () => {
          animIdRef.current = requestAnimationFrame(animate)

          // Smooth rotation
          currentYRef.current += (targetYRef.current - currentYRef.current) * 0.055
          currentXRef.current += (targetXRef.current - currentXRef.current) * 0.055
          if (groupRef.current) {
            groupRef.current.rotation.y = currentYRef.current
            groupRef.current.rotation.x = currentXRef.current
          }

          // Cursor follow light — lerp PointLight to mouse position in 3D space
          if (spotRef.current && (spotRef as any)._target) {
            const mx = mouseRef.current.x  // -1 to 1, x axis
            const my = mouseRef.current.y  // -1 to 1, y axis (screen down = positive)
            const t = (spotRef as any)._target
            // Map screen coords to 3D: x matches, y inverts (screen down = 3D up is negative)
            // Camera is at s.cam[2] depth, light sits halfway between camera and model
            const targetX = mx * 1.6
            const targetY = -my * 1.2
            const targetZ = 2.8
            // Smooth lerp — 0.1 gives a natural lag
            t.x += (targetX - t.x) * 0.1
            t.y += (targetY - t.y) * 0.1
            t.z += (targetZ - t.z) * 0.1
            spotRef.current.position.set(t.x, t.y, t.z)
            // Intensity: max when centred, fades at edges
            const dist = Math.sqrt(mx * mx + my * my)
            spotRef.current.intensity = 0.4 + Math.max(0, 1 - dist * 0.7) * 0.8
          }

          renderer.render(scene, camera)
        }
        animate()

      } catch(e) { console.error('ModelReveal:', e) }
    }

    run()

    // Drag-to-rotate state
    const isDragging = { current: false }
    const lastDrag   = { x: 0, y: 0 }

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true
      lastDrag.x = e.clientX; lastDrag.y = e.clientY
    }
    const onMouseUpGlobal = () => { isDragging.current = false }

    // Global mouse tracking + drag rotation
    const onMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      }
      setMouseNorm({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      })
      if (isDragging.current) {
        const dx = e.clientX - lastDrag.x
        const dy = e.clientY - lastDrag.y
        lastDrag.x = e.clientX; lastDrag.y = e.clientY
        targetYRef.current += dx * 0.012
        targetXRef.current += dy * 0.012
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUpGlobal)
    window.addEventListener('mousemove', onMouse)

    return () => {
      cancelled = true
      cancelAnimationFrame(animIdRef.current)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUpGlobal)
      window.removeEventListener('mousemove', onMouse)
      const r = rendererRef.current
      if (r?.domElement && el.contains(r.domElement)) { r.dispose(); el.removeChild(r.domElement) }
    }
  }, [modelUrl, isFlag])

  // Wireframe toggle
  useEffect(() => {
    groupRef.current?.traverse((child: any) => {
      if (!child.isMesh) return
      child.material = wire
        ? wireMatsRef.current.get(child) || child.material
        : origMatsRef.current.get(child) || child.material
    })
  }, [wire])

  const handleConstraint = (i: number) => {
    if (i !== active) playClick()
    setActive(i)
    targetYRef.current = CONSTRAINTS[i].angle.y
    targetXRef.current = CONSTRAINTS[i].angle.x
  }

  if (!isFlag) return null

  const CONSTRAINTS = CONSTRAINTS_MAP[productId] || CONSTRAINTS_DEFAULT
  const current = CONSTRAINTS[active]

  // Minimal mode — canvas only, no constraints panel, fills its container
  if (minimal) {
    return (
      <div style={{position:'relative',width:'100%',height:'100%',minHeight:480,background:'#000'}}>
        <div ref={mountRef} style={{position:'absolute',inset:0}}/>
        <OverlayEffects
          mode="normal"
          active={loaded}
          canvasW={canvasSize.w}
          canvasH={canvasSize.h}
          mouseX={mouseNorm.x}
          mouseY={mouseNorm.y}
        />
        {!loaded && <div className="mr-loading"><div className="mr-loading-bar"/></div>}
        <div className="mr-controls">
          <button
            className={`mr-wire-btn${wire ? ' active' : ''}`}
            onClick={() => { setWire(w => !w); playClick() }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="5" y1="0.5" x2="5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="0.7"/>
            </svg>
            {wire ? 'Solid' : 'Wireframe'}
          </button>
        </div>
        <div className="mr-cursor-hint">Move cursor to illuminate</div>
      </div>
    )
  }

  return (
    <div className="mr-outer">

      {/* 3D left */}
      <div className="mr-left">
        <div ref={mountRef} className="mr-canvas-mount"/>

        {/* Overlay effects */}
        <OverlayEffects
          mode={current.mode}
          active={loaded}
          canvasW={canvasSize.w}
          canvasH={canvasSize.h}
          mouseX={mouseNorm.x}
          mouseY={mouseNorm.y}
        />

        {!loaded && (
          <div className="mr-loading"><div className="mr-loading-bar"/></div>
        )}

        {/* Controls */}
        <div className="mr-controls">
          <button
            className={`mr-wire-btn${wire ? ' active' : ''}`}
            onClick={() => { setWire(w => !w); playClick() }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="5" y1="0.5" x2="5" y2="9.5" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="0.7"/>
            </svg>
            {wire ? 'Solid' : 'Wireframe'}
          </button>
        </div>

        <div className="mr-cursor-hint">Move cursor to illuminate</div>
      </div>

      {/* Constraints right */}
      <div className="mr-right">
        <div className="mr-right-ey">Design Philosophy</div>
        <div className="mr-constraints">
          {CONSTRAINTS.map((c, i) => (
            <div key={i}
              className={`mr-constraint${active === i ? ' active' : ''}${c.last ? ' last' : ''}`}
              onMouseEnter={() => handleConstraint(i)}
              onClick={() => handleConstraint(i)}>
              <span className="mr-cx">{c.cross}</span>
              <div className="mr-ct-wrap">
                <span className="mr-ct">{c.text}</span>
                {active === i && <span className="mr-cd">{c.desc}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mr-counter">
          {String(active + 1).padStart(2, '0')} / {String(CONSTRAINTS.length).padStart(2, '0')}
        </div>
      </div>

    </div>
  )
}
