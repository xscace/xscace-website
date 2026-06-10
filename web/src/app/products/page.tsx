import { client } from '@/lib/sanity'
import ProductsClient from './ProductsClient'
import { Suspense } from 'react'

export const revalidate = 3600

async function getProductsData() {
  const [products, categories] = await Promise.all([
    client.fetch(`
      *[_type == "product" && status == "Active"] | order(category->order asc, productName asc) {
        _id, productName, productFullName, series, subCategory, powerType,
        tagline, slug, heroImage, proprietaryTechBadges,
        powerRmsW, sensitivityDb, freqLowHz, freqHighHz, impedanceOhms,
        totalPowerW, channelCount, weightKg,
        category->{ name, slug }
      }
    `),
    client.fetch(`
      *[_type == "category"] | order(order asc) { _id, name, slug, order }
    `)
  ])
  return { products, categories }
}

export default async function ProductsPage() {
  const { products, categories } = await getProductsData()
  return (
    <Suspense fallback={<div style={{paddingTop:'62px',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#333',fontSize:'12px',letterSpacing:'.1em'}}>Loading…</div>}>
      <ProductsClient products={products} categories={categories} />
    </Suspense>
  )
}
