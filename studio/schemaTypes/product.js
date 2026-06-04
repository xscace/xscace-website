import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    {name: 'identity',     title: '01 · Identity & Classification'},
    {name: 'media',        title: '02 · Media & Visual Assets'},
    {name: 'speakerSpecs', title: '03 · Acoustic / Speaker Specs'},
    {name: 'ampSpecs',     title: '04 · Amplifier / Electronics Specs'},
    {name: 'physical',     title: '05 · Physical Specifications'},
    {name: 'iwic',         title: '06 · In-Wall / In-Ceiling'},
    {name: 'connectivity', title: '07 · Inputs, Outputs & Connectivity'},
    {name: 'software',     title: '08 · Apps & Software'},
    {name: 'eq',           title: '09 · EQ & Setup'},
    {name: 'installation', title: '10 · Installation & Setup'},
    {name: 'compatibility', title: '11 · Compatible Products'},
    {name: 'docControl',   title: '13 · Document Control (Internal)'},
    {name: 'seo',          title: 'SEO'},
  ],

  fields: [

    // ─────────────────────────────────────────────────────────────
    // GROUP 1 — Identity & Classification
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'productName',
      title: 'Product Name',
      type: 'string',
      group: 'identity',
      description: 'Short name — e.g. "Bonsai"',
      validation: R => R.required(),
    }),

    defineField({
      name: 'productFullName',
      title: 'Full Product Name',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Bonsai Mini Slim Array Speaker"',
    }),

    defineField({
      name: 'series',
      title: 'Series / Family',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Slim Array Series", "Xylem Series", "Banyan Set"',
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'identity',
      validation: R => R.required(),
    }),

    defineField({
      name: 'subCategory',
      title: 'Sub-Category',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Passive Subwoofer", "DSP Amplifier", "LCR In-Ceiling"',
    }),

    defineField({
      name: 'powerType',
      title: 'Power Type',
      type: 'string',
      group: 'identity',
      options: {
        list: ['Passive', 'Powered'],
        layout: 'radio',
      },
      description: 'Is the product passive (needs external amp) or powered (has built-in amp)?',
    }),

    defineField({
      name: 'skuBase',
      title: 'SKU Base Code',
      type: 'string',
      group: 'identity',
      description: 'Base SKU without configuration suffix — e.g. "XSP-SA-BON"',
    }),

    defineField({
      name: 'skuVariants',
      title: 'SKU Variants',
      type: 'text',
      rows: 4,
      group: 'identity',
      description: 'AMP only — each variant: SKU code + configuration + what preset/mode it represents. e.g. "XAM-DSP-XLM2 · Champagne"',
    }),

    defineField({
      name: 'skuLegend',
      title: 'SKU Legend / Key',
      type: 'text',
      rows: 3,
      group: 'identity',
      description: 'AMP only — e.g. "D = Flat DSP, B = Bonsai preset, C = Cane preset…"',
    }),

    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'identity',
      description: '1-line marketing line — e.g. "World\'s Slimmest In-Ceiling Speaker"',
      validation: R => R.max(100),
    }),

    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      group: 'identity',
      description: 'Up to 200 chars — for website hero and brochure intro',
      validation: R => R.max(200),
    }),

    defineField({
      name: 'longDescription',
      title: 'Long Description',
      type: 'array',
      of: [{type: 'block'}],
      group: 'identity',
      description: 'Full product story — used in brochure body and product page',
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'identity',
      options: {
        list: ['Active', 'Coming Soon', 'Discontinued'],
        layout: 'radio',
      },
      initialValue: 'Active',
    }),

    defineField({
      name: 'launchYear',
      title: 'Launch Year',
      type: 'number',
      group: 'identity',
      description: 'e.g. 2022',
      validation: R => R.min(2020).max(2040).integer(),
    }),

    defineField({
      name: 'slug',
      title: 'Page URL Slug',
      type: 'slug',
      group: 'identity',
      options: {source: 'productFullName'},
      description: 'e.g. /bonsai-slimarray-speaker',
      validation: R => R.required(),
    }),

    defineField({
      name: 'proprietaryTechBadges',
      title: 'Proprietary Tech Badges',
      type: 'string',
      group: 'identity',
      description: 'Comma-separated — e.g. "PsySculpt™, XS-Flow™, XBR Technology"',
    }),

    defineField({
      name: 'belongsToSet',
      title: 'Belongs to Set',
      type: 'string',
      group: 'identity',
      description: 'For Banyan products — e.g. "Banyan Set"',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 2 — Media & Visual Assets
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      description: 'Primary product shot — white or transparent background',
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
    }),

    defineField({
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      group: 'media',
      of: [{
        type: 'image',
        options: {hotspot: true},
        fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      }],
      description: 'Multiple product angles',
    }),

    defineField({
      name: 'lifestyleImages',
      title: 'Lifestyle Images',
      type: 'array',
      group: 'media',
      of: [{
        type: 'image',
        options: {hotspot: true},
        fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      }],
      description: 'Installed / in-room shots',
    }),

    defineField({
      name: 'installationDiagramImages',
      title: 'Installation Diagram Images',
      type: 'array',
      group: 'media',
      of: [{
        type: 'image',
        options: {hotspot: true},
        fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      }],
      description: 'Step-by-step install visuals',
    }),

    defineField({
      name: 'wiringDiagramImage',
      title: 'Wiring Diagram Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      description: 'Impedance / wiring diagram',
    }),

    defineField({
      name: 'dimensionDrawing',
      title: 'Dimension Drawing / Technical Drawing',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      description: 'Dimensioned line drawing — the kind architects need',
    }),

    defineField({
      name: 'cutoutTemplateImage',
      title: 'Cutout Template Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      description: 'IW/IC and SUB — visual of the cutout shape',
    }),

    defineField({
      name: 'directivityPlotImage',
      title: 'Directivity Plot Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      description: 'Polar pattern — Claude-generated from directivity H/V data',
    }),

    defineField({
      name: 'splThrowChartImage',
      title: 'SPL Throw Chart Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      description: 'Inverse square law throw chart — Claude-generated',
    }),

    defineField({
      name: 'hasArView',
      title: 'Has AR Viewer?',
      type: 'boolean',
      group: 'media',
      initialValue: false,
      description: 'Not all speakers have AR. Only enable for products with a Vectary AR link',
    }),

    defineField({
      name: 'arViewLink',
      title: 'AR Viewer Link',
      type: 'url',
      group: 'media',
      description: 'One link only — hero colour (Champagne if standard, else Black). e.g. https://app.vectary.com/p/...',
    }),

    defineField({
      name: 'heroVideo',
      title: 'Hero Video URL',
      type: 'url',
      group: 'media',
      description: 'YouTube or Vimeo URL',
    }),

    defineField({
      name: 'model3dUrl',
      title: '3D Model URL (GLB/GLTF)',
      type: 'url',
      group: 'media',
      description: 'Direct URL to .glb file for model-viewer AR embed',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 3 — Acoustic / Speaker Specifications
    // Applies to: SP, SUB, IW/IC, OUT
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'powerRmsW',
      title: 'Power RMS (W)',
      type: 'number',
      group: 'speakerSpecs',
      description: 'Lab-verified RMS power rating',
    }),

    defineField({
      name: 'powerPeakW',
      title: 'Power Peak / Max (W)',
      type: 'number',
      group: 'speakerSpecs',
    }),

    defineField({
      name: 'impedanceOhms',
      title: 'Impedance (Ohms)',
      type: 'number',
      group: 'speakerSpecs',
    }),

    defineField({
      name: 'sensitivityDb',
      title: 'Sensitivity (dB)',
      type: 'number',
      group: 'speakerSpecs',
      description: 'Single value — measured at 1W / 1m / 1kHz sine wave',
    }),

    defineField({
      name: 'freqLowHz',
      title: 'Frequency Low (Hz)',
      type: 'number',
      group: 'speakerSpecs',
    }),

    defineField({
      name: 'freqHighHz',
      title: 'Frequency High (Hz)',
      type: 'number',
      group: 'speakerSpecs',
    }),

    defineField({
      name: 'freqQualifier',
      title: 'Frequency Qualifier',
      type: 'string',
      group: 'speakerSpecs',
      description: 'e.g. "–3dB", "–6dB" — leave blank if unspecified',
      options: {
        list: ['±3dB', '–3dB', '–6dB', ''],
      },
    }),

    defineField({
      name: 'driverCount',
      title: 'Driver Count',
      type: 'number',
      group: 'speakerSpecs',
      description: 'Total number of drivers',
    }),

    defineField({
      name: 'driverSize',
      title: 'Driver Size',
      type: 'string',
      group: 'speakerSpecs',
      description: 'e.g. "1.25"" or "6.5 inch"',
    }),

    defineField({
      name: 'driverMaterial',
      title: 'Driver Type / Material',
      type: 'string',
      group: 'speakerSpecs',
      description: 'e.g. "Neodymium, Rubber Edge", "Graphite Cone, Rubber Surround"',
    }),

    defineField({
      name: 'driverDescription',
      title: 'Driver Description (Full)',
      type: 'string',
      group: 'speakerSpecs',
      description: 'Complete driver string — e.g. "4 × Power Dense Custom Woofers"',
    }),

    defineField({
      name: 'tweeterCount',
      title: 'Tweeter Count',
      type: 'number',
      group: 'speakerSpecs',
      description: '0 if none',
      initialValue: 0,
    }),

    defineField({
      name: 'tweeterType',
      title: 'Tweeter Type',
      type: 'string',
      group: 'speakerSpecs',
      description: 'e.g. "1" Ceramic Dome", "1" Silk Dome (aimable)"',
    }),

    defineField({
      name: 'builtInSubDriver',
      title: 'Built-in Subwoofer Driver',
      type: 'string',
      group: 'speakerSpecs',
      description: 'Ghost-type speakers — e.g. "1 × 5.5 inch Built-in Subwoofer Driver"',
    }),

    defineField({
      name: 'directivityHDeg',
      title: 'Directivity — Horizontal (°)',
      type: 'number',
      group: 'speakerSpecs',
    }),

    defineField({
      name: 'directivityVDeg',
      title: 'Directivity — Vertical (°)',
      type: 'number',
      group: 'speakerSpecs',
    }),

    defineField({
      name: 'crossoverType',
      title: 'Crossover Type',
      type: 'string',
      group: 'speakerSpecs',
      description: 'e.g. "Built-in Passive Crossover", "Built-in Passive Crossover (2-way)"',
    }),

    defineField({
      name: 'crossoverFrequency',
      title: 'Crossover Frequency',
      type: 'string',
      group: 'speakerSpecs',
      description: 'Recommended crossover point — e.g. "250Hz". Covers speaker crossover and sub integration point.',
    }),

    defineField({
      name: 'marineTreatable',
      title: 'Marine Treatable?',
      type: 'boolean',
      group: 'speakerSpecs',
      initialValue: false,
    }),

    defineField({
      name: 'ipRating',
      title: 'Marine / IP Rating',
      type: 'string',
      group: 'speakerSpecs',
      description: 'e.g. "IP66", "IPX66" — leave blank if not rated',
    }),

    // EQ data lives in Group 3 (single field, referenced in Group 9)
    defineField({
      name: 'eqData',
      title: 'EQ Data (CSV)',
      type: 'text',
      rows: 8,
      group: 'speakerSpecs',
      description: `CSV format — used to render the EQ curve on the website. Format:
freq,gain,type,q
80,+4.0,LS,0.7
500,-2.0,PK,1.4
2000,+1.5,PK,2.0
HP,250,2

Types: LS=Low Shelf, HS=High Shelf, PK=Parametric Peak, HP=High Pass, LP=Low Pass`,
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 4 — Amplifier / Electronics Specifications
    // Applies to: AMP only
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'totalPowerW',
      title: 'Total Power Output (W)',
      type: 'number',
      group: 'ampSpecs',
      description: 'Sum of all channels — e.g. 1000 (for 4×250W)',
    }),

    defineField({
      name: 'ampClass',
      title: 'Amplifier Class',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "Class D"',
    }),

    defineField({
      name: 'channelConfigurations',
      title: 'Channel Configurations',
      type: 'text',
      rows: 3,
      group: 'ampSpecs',
      description: 'e.g. "2 × 200W @ 8Ω" or "2 × 100W + 1 × 200W @ 8Ω"',
    }),

    defineField({
      name: 'powerPerCh8OhmW',
      title: 'Power Per Channel @ 8Ω (W)',
      type: 'number',
      group: 'ampSpecs',
    }),

    defineField({
      name: 'powerPerCh4OhmW',
      title: 'Power Per Channel @ 4Ω (W)',
      type: 'number',
      group: 'ampSpecs',
    }),

    defineField({
      name: 'bridgedMonoPower',
      title: 'Bridged Mono Power',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "2×800W @ 8Ω bridged"',
    }),

    defineField({
      name: 'thdN',
      title: 'THD+N',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "<0.1% @ 1KHz, 1W, 8Ω"',
    }),

    defineField({
      name: 'snrDb',
      title: 'Signal to Noise Ratio',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. ">109dB @ 1KHz"',
    }),

    defineField({
      name: 'freqResponse',
      title: 'Frequency Response',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "20Hz – 22KHz"',
    }),

    defineField({
      name: 'inputImpedance',
      title: 'Input Impedance',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "20KΩ"',
    }),

    defineField({
      name: 'inputSensitivity',
      title: 'Input Sensitivity',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "0.77V"',
    }),

    defineField({
      name: 'crosstalk',
      title: 'Crosstalk',
      type: 'string',
      group: 'ampSpecs',
      description: 'If measured — e.g. ">60dB @ 1KHz"',
    }),

    defineField({
      name: 'protectionFeatures',
      title: 'Protection Features',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "Short, DCP, OVP, UVP, OCP, OTP"',
    }),

    defineField({
      name: 'hasDsp',
      title: 'Has DSP?',
      type: 'boolean',
      group: 'ampSpecs',
      initialValue: false,
    }),

    defineField({
      name: 'dspProcessorSpec',
      title: 'DSP Processor Spec',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "48KHz, 48-bit Fixed-Point DSP, 24-bit A/D & D/A"',
    }),

    defineField({
      name: 'dspPresets',
      title: 'DSP Presets / Programs',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "20 user program dynamic storage"',
    }),

    defineField({
      name: 'hasStreamer',
      title: 'Has Built-in Streamer?',
      type: 'boolean',
      group: 'ampSpecs',
      initialValue: false,
    }),

    defineField({
      name: 'streamingProtocols',
      title: 'Streaming Protocols',
      type: 'text',
      rows: 2,
      group: 'ampSpecs',
      description: 'e.g. "Airplay 2, Spotify Connect, DLNA, Tidal Connect, UPnP, Bluetooth 5.0 APTX-HD"',
    }),

    defineField({
      name: 'channelCount',
      title: 'Channel Count',
      type: 'number',
      group: 'ampSpecs',
    }),

    defineField({
      name: 'zoneCount',
      title: 'Zone Count',
      type: 'number',
      group: 'ampSpecs',
      description: 'For multi-zone amps',
    }),

    defineField({
      name: 'powerSupply',
      title: 'Power Supply',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "DC 24V–5A"',
    }),

    defineField({
      name: 'coolingMethod',
      title: 'Cooling Method',
      type: 'string',
      group: 'ampSpecs',
      description: 'e.g. "Passive", "Active fan"',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 5 — Physical Specifications
    // Applies to: All
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'heightMm',
      title: 'Height (mm)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'widthMm',
      title: 'Width (mm)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'depthMm',
      title: 'Depth (mm)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'diameterMm',
      title: 'Diameter (mm)',
      type: 'number',
      group: 'physical',
      description: 'Round speakers only (Aspen, Aster, Spirea)',
    }),

    defineField({
      name: 'heightIn',
      title: 'Height (inches)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'widthIn',
      title: 'Width (inches)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'depthIn',
      title: 'Depth (inches)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'weightKg',
      title: 'Weight — Standard (kg)',
      type: 'number',
      group: 'physical',
    }),

    defineField({
      name: 'weightPoweredKg',
      title: 'Weight — Powered Version (kg)',
      type: 'number',
      group: 'physical',
      description: 'SUB only — powered version weight differs from passive',
    }),

    defineField({
      name: 'housingMaterial',
      title: 'Housing Material',
      type: 'string',
      group: 'physical',
      description: 'e.g. "Aerospace Aluminium", "ABS", "Birch Wood + MDF"',
    }),

    defineField({
      name: 'finish',
      title: 'Finish',
      type: 'string',
      group: 'physical',
      description: 'e.g. "Matte", "Anodised", "CNC-machined"',
    }),

    defineField({
      name: 'colorsStandard',
      title: 'Standard Colors',
      type: 'string',
      group: 'physical',
      description: 'e.g. "Champagne, Anthracite, White" or "Black only"',
    }),

    defineField({
      name: 'customRalAvailable',
      title: 'Custom RAL Available?',
      type: 'boolean',
      group: 'physical',
      initialValue: false,
    }),

    defineField({
      name: 'customRalMoq',
      title: 'Custom RAL MOQ',
      type: 'number',
      group: 'physical',
      description: 'Minimum order quantity — e.g. 6',
    }),

    defineField({
      name: 'customRalSurchargePct',
      title: 'Custom RAL Surcharge (%)',
      type: 'number',
      group: 'physical',
      description: 'e.g. 20 (for +20% price)',
    }),

    defineField({
      name: 'customRalLeadDays',
      title: 'Custom RAL Lead Time (days)',
      type: 'number',
      group: 'physical',
      description: 'e.g. 45',
    }),

    defineField({
      name: 'customFinishOptions',
      title: 'Custom Finish Options',
      type: 'string',
      group: 'physical',
      description: 'e.g. "Matte, Gloss, Brushed"',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 6 — In-Wall / In-Ceiling Specific
    // Applies to: IW/IC, Ghost, Sage, Bergenia, Oak, Willow, Aspen, Aster
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'cutoutWidthMm',
      title: 'Cutout Width (mm)',
      type: 'number',
      group: 'iwic',
      description: 'Critical for installers — rectangular speakers',
    }),

    defineField({
      name: 'cutoutHeightMm',
      title: 'Cutout Height (mm)',
      type: 'number',
      group: 'iwic',
      description: 'Critical for installers — rectangular speakers',
    }),

    defineField({
      name: 'cutoutDiameterMm',
      title: 'Cutout Diameter (mm)',
      type: 'number',
      group: 'iwic',
      description: 'Round speakers only (Aspen 6, Aspen 8, Aster LCR)',
    }),

    defineField({
      name: 'requiredCavityDepthMm',
      title: 'Required Cavity Depth Behind Wall (mm)',
      type: 'number',
      group: 'iwic',
      description: 'How much space is needed behind the wall/ceiling for installation',
    }),

    defineField({
      name: 'cutoutTemplateIncluded',
      title: 'Cutout Template Included in Box?',
      type: 'boolean',
      group: 'iwic',
      initialValue: true,
    }),

    defineField({
      name: 'mountingMethod',
      title: 'Mounting Method',
      type: 'string',
      group: 'iwic',
      description: 'e.g. "Spring clip", "Magnetic mount (Ghost 2.0)", "External L-Bracket flush mount"',
    }),

    defineField({
      name: 'installationOrientation',
      title: 'Installation Orientation',
      type: 'string',
      group: 'iwic',
      description: 'e.g. "Ceiling or wall", "Wall only", "Ceiling only — angled LCR"',
    }),

    defineField({
      name: 'paintableGrille',
      title: 'Paintable Grille?',
      type: 'boolean',
      group: 'iwic',
      initialValue: false,
    }),

    defineField({
      name: 'grilleMaterial',
      title: 'Grille Material',
      type: 'string',
      group: 'iwic',
      description: 'e.g. "Steel mesh", "Aluminium"',
    }),

    defineField({
      name: 'fireRating',
      title: 'Fire Rating',
      type: 'string',
      group: 'iwic',
      description: 'If applicable — e.g. "UL Listed"',
    }),

    defineField({
      name: 'mountingBracketRequired',
      title: 'Mounting Bracket Required?',
      type: 'boolean',
      group: 'iwic',
      initialValue: false,
      description: 'Does installation require a separate back/mounting bracket?',
    }),

    defineField({
      name: 'mountingBracketDimensions',
      title: 'Mounting Bracket Dimensions',
      type: 'string',
      group: 'iwic',
      description: 'e.g. "L-bracket sized to speaker body: 894.8 × 297.9mm"',
    }),

    defineField({
      name: 'tweeterAimable',
      title: 'Tweeter Aimable?',
      type: 'boolean',
      group: 'iwic',
      initialValue: false,
      description: 'Aster 6 LCR has an aimable tweeter',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 7 — Inputs, Outputs & Connectivity
    // Applies to: AMP and powered speakers/subs
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'inputs',
      title: 'Inputs',
      type: 'text',
      rows: 3,
      group: 'connectivity',
      description: 'e.g. "Line In (RCA), High Level Speaker Input, SPDIF Optical, USB, HDMI ARC"',
    }),

    defineField({
      name: 'outputs',
      title: 'Outputs',
      type: 'text',
      rows: 3,
      group: 'connectivity',
      description: 'e.g. "Speaker Out L/R, Line Out, LFE Out, 5V Output"',
    }),

    defineField({
      name: 'communicationPorts',
      title: 'Communication Ports',
      type: 'string',
      group: 'connectivity',
      description: 'e.g. "1× USB front, 2× RS485 (RJ-45) rear"',
    }),

    defineField({
      name: 'wirelessConnectivity',
      title: 'Wireless Connectivity',
      type: 'string',
      group: 'connectivity',
      description: 'e.g. "Wi-Fi 2.4GHz + 5GHz, RJ45 Ethernet, Bluetooth 5.0 APTX-HD"',
    }),

    defineField({
      name: 'networkProtocol',
      title: 'Network Protocol',
      type: 'string',
      group: 'connectivity',
      description: 'e.g. "UPnP, DLNA"',
    }),

    defineField({
      name: 'controlProtocol',
      title: 'Control Protocol',
      type: 'string',
      group: 'connectivity',
      description: 'e.g. "RS485, IP Control"',
    }),

    defineField({
      name: 'speakerWireConnector',
      title: 'Speaker Wire Connector Type',
      type: 'string',
      group: 'connectivity',
      description: 'e.g. "JST 2.5mm Male" — for Bonsai/Cane',
    }),

    defineField({
      name: 'lineTransformerCompatible',
      title: '70V / 100V Line Compatible?',
      type: 'boolean',
      group: 'connectivity',
      initialValue: false,
      description: 'Outdoor and commercial products — PA line compatibility',
    }),

    defineField({
      name: 'rackMountable',
      title: 'Rack Mountable?',
      type: 'boolean',
      group: 'connectivity',
      initialValue: false,
    }),

    defineField({
      name: 'rackUnitSize',
      title: 'Rack Unit Size',
      type: 'string',
      group: 'connectivity',
      description: 'e.g. "1U", "0.5U (2× Air Amps per 1U rack bracket)"',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 8 — Apps & Software
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'mobileAppName',
      title: 'Mobile App Name',
      type: 'string',
      group: 'software',
      description: 'e.g. "4Stream", "GoControl", "XSCACE Controller"',
    }),

    defineField({
      name: 'mobileAppLinkIos',
      title: 'Mobile App — iOS Link',
      type: 'url',
      group: 'software',
    }),

    defineField({
      name: 'mobileAppLinkAndroid',
      title: 'Mobile App — Android Link',
      type: 'url',
      group: 'software',
    }),

    defineField({
      name: 'desktopSoftwareName',
      title: 'Desktop Software Name',
      type: 'string',
      group: 'software',
      description: 'e.g. "Root 4 DSP Software", "SigmaStudio (by Analog Devices)"',
    }),

    defineField({
      name: 'desktopSoftwareUrl',
      title: 'Desktop Software Download URL',
      type: 'url',
      group: 'software',
    }),

    defineField({
      name: 'compatibleControlSystems',
      title: 'Compatible Control Systems',
      type: 'string',
      group: 'software',
      description: 'e.g. "Control4, Crestron, Savant" — if applicable',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 9 — EQ & Setup
    // eqData lives in Group 3 — referenced here for context
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'eqProfileName',
      title: 'EQ Profile Name',
      type: 'string',
      group: 'eq',
      description: 'e.g. "Loudness Curve", "Flat Response", "Nearfield"',
    }),

    defineField({
      name: 'recommendedCrossoverHz',
      title: 'Recommended Crossover (Hz)',
      type: 'number',
      group: 'eq',
      description: 'Recommended crossover point for sub integration — e.g. 250',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 10 — Installation & Setup
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'minRiggingHeight',
      title: 'Minimum Rigging Height',
      type: 'string',
      group: 'installation',
      description: 'e.g. "5ft minimum"',
    }),

    defineField({
      name: 'minSpeakerSpacing',
      title: 'Minimum Speaker Spacing',
      type: 'string',
      group: 'installation',
      description: 'e.g. "5ft center-to-center"',
    }),

    defineField({
      name: 'mountingMethods',
      title: 'Mounting Methods / Accessories',
      type: 'text',
      rows: 3,
      group: 'installation',
      description: 'Describes mounting options — corresponds to accessories in box. e.g. "Screw mount, Corner mount, Floor stand"',
    }),

    defineField({
      name: 'screwSize',
      title: 'Screw Size',
      type: 'string',
      group: 'installation',
      description: 'e.g. "M2.5×25", "M4×25"',
    }),

    defineField({
      name: 'wireGaugeRecommended',
      title: 'Wire Gauge Recommended',
      type: 'string',
      group: 'installation',
      description: 'e.g. "14 AWG or thinner"',
    }),

    defineField({
      name: 'wireConnectorType',
      title: 'Wire Connector Type',
      type: 'string',
      group: 'installation',
      description: 'e.g. "JST 2.5mm connector wire (included)"',
    }),

    defineField({
      name: 'itemsInBox',
      title: 'Items in Box',
      type: 'text',
      rows: 4,
      group: 'installation',
      description: 'Everything included — e.g. "Speaker unit ×1, M2.5×25 Screws + Plugs, Screw template, Double-sided tape, Wire connectors"',
    }),

    defineField({
      name: 'installationSteps',
      title: 'Installation Steps',
      type: 'text',
      rows: 6,
      group: 'installation',
      description: 'Step-by-step text for manual generation — numbered list of steps',
    }),

    defineField({
      name: 'recommendedRoomSize',
      title: 'Room Size Recommendation',
      type: 'string',
      group: 'installation',
      description: 'Based on 2.1 setup — e.g. "Up to 20 × 20 ft — living rooms, home cinemas"',
    }),

    defineField({
      name: 'setupDiagram',
      title: 'Setup Diagram',
      type: 'image',
      group: 'installation',
      options: {hotspot: true},
      description: 'One image — the most commonly installed setup (speakers + subs only)',
    }),

    defineField({
      name: 'positioningNote',
      title: 'Positioning Note',
      type: 'text',
      rows: 2,
      group: 'installation',
      description: 'e.g. "Position calculated based on main listening position. Minimum 5ft from floor."',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 11 — Compatible Products
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'recommendedPairingPrimary',
      title: 'Recommended Pairing (Primary)',
      type: 'reference',
      to: [{type: 'product'}],
      group: 'compatibility',
      description: 'The "suggested setup" primary product shown on website',
    }),

    defineField({
      name: 'recommendedPairingSecondary',
      title: 'Recommended Pairing (Secondary)',
      type: 'reference',
      to: [{type: 'product'}],
      group: 'compatibility',
    }),

    defineField({
      name: 'compatibleAmplifiers',
      title: 'Compatible Amplifiers',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      group: 'compatibility',
    }),

    defineField({
      name: 'compatibleSubwoofers',
      title: 'Compatible Subwoofers',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      group: 'compatibility',
    }),

    defineField({
      name: 'compatibleAccessories',
      title: 'Compatible Accessories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      group: 'compatibility',
    }),

    defineField({
      name: 'compatibleSpeakers',
      title: 'Compatible Speakers / Subs',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      group: 'compatibility',
      description: 'For amplifiers — which speakers this amp powers',
    }),

    defineField({
      name: 'maxSpeakersPerChannel',
      title: 'Max Speakers Per Channel',
      type: 'number',
      group: 'compatibility',
    }),

    // ─────────────────────────────────────────────────────────────
    // GROUP 13 — Document Control (Internal, Not Public)
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'version',
      title: 'Version Number',
      type: 'string',
      group: 'docControl',
      description: 'e.g. "v2.1"',
    }),

    defineField({
      name: 'lastUpdatedBy',
      title: 'Last Updated By',
      type: 'string',
      group: 'docControl',
    }),

    defineField({
      name: 'specConfidence',
      title: 'Spec Confidence',
      type: 'string',
      group: 'docControl',
      options: {
        list: ['Lab Verified', 'Manufacturer Claimed', 'Estimated'],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'labReportReference',
      title: 'Lab Report Reference',
      type: 'string',
      group: 'docControl',
      description: 'File name or link to raw lab data',
    }),

    defineField({
      name: 'changelog',
      title: 'Changelog',
      type: 'text',
      rows: 6,
      group: 'docControl',
      description: 'Running log of all changes with dates — e.g. "v1.1 — corrected sensitivity from 94dB to 92dB — Jan 2025"',
    }),

    defineField({
      name: 'approvalStatus',
      title: 'Approval Status',
      type: 'string',
      group: 'docControl',
      options: {
        list: ['Draft', 'Approved', 'Published'],
        layout: 'radio',
      },
      initialValue: 'Draft',
    }),

    defineField({
      name: 'openIssues',
      title: 'Open Issues',
      type: 'text',
      rows: 3,
      group: 'docControl',
      description: 'Any unresolved spec questions or tasks',
    }),

    // ─────────────────────────────────────────────────────────────
    // SEO
    // ─────────────────────────────────────────────────────────────

    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
    }),

    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),

    // Downloads (ungrouped — accessible from all views)
    defineField({
      name: 'specSheet',
      title: 'Spec Sheet PDF',
      type: 'file',
      options: {accept: '.pdf'},
    }),

    defineField({
      name: 'installGuide',
      title: 'Installation Guide PDF',
      type: 'file',
      options: {accept: '.pdf'},
    }),

    defineField({
      name: 'cadFile',
      title: 'CAD / DWG File',
      type: 'file',
    }),

  ],

  preview: {
    select: {
      title: 'productName',
      subtitle: 'series',
      media: 'heroImage',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Untitled Product',
        subtitle: subtitle || '',
        media,
      }
    },
  },
})
