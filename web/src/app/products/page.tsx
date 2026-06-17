import { client } from '@/lib/sanity'
import ProductsClient from './ProductsClient'
import { Suspense } from 'react'

export const revalidate = 3600

function imgUrl(ref: string, w = 900) {
  if (!ref) return ''
  const b = ref.replace(/^image-/, '').split('-')
  const ext = b.pop()!, dims = b.pop()!, hash = b.join('-')
  return `https://cdn.sanity.io/images/7r0kq57d/production/${hash}-${dims}.${ext}?w=${w}&auto=format&q=85`
}

async function getProductsData() {
  const [products, categories, softwareApps] = await Promise.all([
    client.fetch(`
      *[_type == "product" && status == "Active"] | order(category->order asc, productName asc) {
        _id, productName, productFullName, series, subCategory, powerType,
        tagline, slug, heroImage, proprietaryTechBadges,
        powerRmsW, sensitivityDb, freqLowHz, freqHighHz, impedanceOhms,
        totalPowerW, channelCount, weightKg,
        category->{ name, slug },
        "heroVideoRef": heroVideoFile.asset._ref,
        "fallbackImageRef": coalesce(lifestyleImages[0].asset._ref, galleryImages[0].asset._ref)
      }
    `),
    client.fetch(`
      *[_type == "category"] | order(order asc) { _id, name, slug, order }
    `),
    client.fetch(`
      *[_type == "software"] | order(name asc) {
        _id, name, slug, tagline, platform, status,
        appStoreUrl, playStoreUrl,
        "heroImageRef": heroImage.asset._ref
      }
    `),
  ])

  function fileUrl(ref: string) {
    if (!ref) return ''
    const clean = ref.replace('file-', '')
    const last = clean.lastIndexOf('-')
    return `https://cdn.sanity.io/files/7r0kq57d/production/${clean.slice(0, last)}.${clean.slice(last + 1)}`
  }

  const products2 = products.map((p: any) => ({
    ...p,
    heroVideoUrl: p.heroVideoRef ? fileUrl(p.heroVideoRef) : null,
    fallbackImageUrl: p.fallbackImageRef ? imgUrl(p.fallbackImageRef) : null,
  }))

  const software = softwareApps.map((app: any) => ({
    ...app,
    heroImageUrl: app.heroImageRef ? imgUrl(app.heroImageRef) : '',
  }))

  return { products: products2, categories, software }
}

export default async function ProductsPage() {
  const { products, categories, software } = await getProductsData()
  return (
    <Suspense fallback={<div style={{paddingTop:'62px',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#333',fontSize:'12px',letterSpacing:'.1em'}}>Loading…</div>}>
      <ProductsClient products={products} categories={categories} software={software} />
    </Suspense>
  )
}
