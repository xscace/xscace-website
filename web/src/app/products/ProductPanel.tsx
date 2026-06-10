'use client'

import { useEffect, useState, useRef } from 'react'

interface Product {
  _id: string
  productName: string
  productFullName: string
  series: string
  subCategory: string
  powerType: string
  tagline: string
  slug: { current: string }
  heroImage?: any
  heroVideo?: any
  proprietaryTechBadges?: string
  powerRmsW?: number
  sensitivityDb?: number
  freqLowHz?: number
  freqHighHz?: number
  impedanceOhms?: number
  totalPowerW?: number
  channelCount?: number
  weightKg?: number
  category: { name: string; slug: { current: string } }
}

const BADGE_MAP: Record<string, string> = {
  'prod-bonsai':"World's Smallest",'prod-cane':'23mm Thin','prod-quadcane':'21mm Thin',
  'prod-cedar':'Wide Dispersion','prod-ghost2':'Award Winning','prod-aspen6':'2-Way In-Ceiling',
  'prod-aspen8':'8" Driver','prod-aster6':'Aimable Tweeter','prod-oak':'3-Way In-Wall',
  'prod-willow':'3-Way In-Wall','prod-sage':'Titanium Dome','prod-camphor6':'IPX66 Rated',
  'prod-camphor8':'IPX66 Rated','prod-banyan-pith':'Dual 12" + DSP','prod-juniper':'25Hz Deep Bass',
  'prod-air-mini':'Streaming Only','prod-air-amp':'Streaming + Amp','prod-xylem4':'4ch DSP',
}

function getSpec(p: Product): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = []
  if (p.powerRmsW)     specs.push({ label: 'Power', value: p.powerRmsW + 'W RMS' })
  if (p.totalPowerW)   specs.push({ label: 'Total Power', value: p.totalPowerW + 'W' })
  if (p.channelCount)  specs.push({ label: 'Channels', value: String(p.channelCount) })
  if (p.sensitivityDb) specs.push({ label: 'Sensitivity', value: p.sensitivityDb + 'dB' })
  if (p.freqLowHz && p.freqHighHz)
    specs.push({ label: 'Frequency', value: p.freqLowHz + 'Hz – ' + p.freqHighHz + 'Hz' })
  if (p.impedanceOhms) specs.push({ label: 'Impedance', value: p.impedanceOhms + 'Ω' })
  if (p.weightKg)      specs.push({ label: 'Weight', value: p.weightKg + 'kg' })
  if (p.powerType)     specs.push({ label: 'Type', value: p.powerType })
  return specs
}

function getImageUrl(heroImage: any): string | null {
  if (!heroImage?.asset?._ref) return null
  const ref = heroImage.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${ref}`
}

interface ProductPanelProps {
  product: Product | null
  onClose: () => void
}

export default function ProductPanel({ product, onClose }: ProductPanelProps) {
  const [visible, setVisible] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevId = useRef<string | null>(null)

  useEffect(() => {
    if (!product) { setVisible(false); return }
    if (prevId.current !== product._id) {
      setMediaLoaded(false)
      prevId.current = product._id
    }
    const t = setTimeout(() => setVisible(true), 20)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [product, onClose])

  if (!product) return null

  const imgUrl = getImageUrl(product.heroImage)
  const specs = getSpec(product)
  const badge = BADGE_MAP[product._id]
  const href = `/products/${product.category?.slug?.current}/${product.slug?.current}`

  return (
    <div
      className={`prod-panel-overlay ${visible ? 'prod-panel-overlay-visible' : ''}`}
      onClick={onClose}
    >
      <div
        className={`prod-panel ${visible ? 'prod-panel-visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button className="prod-panel-close" onClick={onClose}>×</button>

        {/* Media */}
        <div className="prod-panel-media">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product.productName}
              className={`prod-panel-img ${mediaLoaded ? 'loaded' : ''}`}
              onLoad={() => setMediaLoaded(true)}
            />
          ) : (
            <div className="prod-panel-no-media">
              <svg viewBox="0 0 60 90" fill="none" width="40">
                <rect x="22" y="4" width="16" height="82" rx="3"
                  fill="rgba(201,169,110,0.08)" stroke="#c9a96e" strokeWidth="1"/>
                <circle cx="30" cy="45" r="5" fill="none" stroke="#c9a96e" strokeWidth="0.8"/>
                <rect x="24" y="10" width="12" height="3" rx="1.5"
                  fill="none" stroke="#c9a96e" strokeWidth="0.6" opacity="0.5"/>
              </svg>
              <div className="prod-panel-no-media-lbl">Media loading</div>
            </div>
          )}
          {badge && <div className="prod-panel-badge">{badge}</div>}
        </div>

        {/* Content */}
        <div className="prod-panel-body">
          <div className="prod-panel-ey">
            {product.series || product.subCategory} · {product.category?.name}
          </div>

          <div className="prod-panel-name">{product.productName}</div>

          {product.productFullName && product.productFullName !== product.productName && (
            <div className="prod-panel-fullname">{product.productFullName}</div>
          )}

          {product.tagline && (
            <div className="prod-panel-tagline">{product.tagline}</div>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div className="prod-panel-specs">
              {specs.map((s, i) => (
                <div key={i} className="prod-panel-spec-row">
                  <span className="prod-panel-spec-label">{s.label}</span>
                  <span className="prod-panel-spec-value">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tech badges */}
          {product.proprietaryTechBadges && (
            <div className="prod-panel-tech">
              {product.proprietaryTechBadges.split(',').map((b, i) => (
                <span key={i} className="prod-panel-tech-badge">{b.trim()}</span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="prod-panel-actions">
            <a href={href} className="btn-prim prod-panel-cta">
              Full Product Details →
            </a>
            <a
              href={`https://configurator.xscace.com?product=${product.slug?.current}`}
              className="prod-panel-configure"
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to System →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
