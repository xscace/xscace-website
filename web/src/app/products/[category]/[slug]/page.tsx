import { client } from '@/lib/sanity'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'

export const revalidate = 3600

async function getProduct(slug: string) {
  return client.fetch(`
    *[_type == "product" && slug.current == $slug && status == "Active"][0] {
      _id, productName, productFullName, series, subCategory, powerType, tagline,
      shortDescription, longDescription, slug, status, launchYear,
      proprietaryTechBadges, skuBase, skuVariants,
      heroImage, galleryImages, lifestyleImages,
      installationDiagramImages, dimensionDrawing, wiringDiagramImage,
      cutoutTemplateImage, directivityPlotImage,
      heroVideoFile{ asset{ _ref } }, heroVideo, model3dUrl, arViewLink, hasArView,
      productVideos[]{ videoFile{ asset{ _ref } }, url, title, type, thumbnail },
      "xylemVideos": *[_id == "prod-xylem2"][0].productVideos[]{ videoFile{ asset{ _ref } }, url, title, type, thumbnail },
      powerRmsW, powerPeakW, impedanceOhms, sensitivityDb,
      freqLowHz, freqHighHz, freqQualifier,
      driverCount, driverSize, driverMaterial, driverDescription,
      tweeterCount, tweeterType, builtInSubDriver,
      directivityHDeg, directivityVDeg,
      crossoverType, crossoverFrequency,
      ipRating, marineTreatable,
      eqData,
      totalPowerW, channelCount, ampClass, channelConfigurations,
      powerPerCh8OhmW, powerPerCh4OhmW, thdN, snrDb,
      freqResponse, inputImpedance, inputSensitivity,
      hasDsp, dspProcessorSpec, dspPresets,
      hasStreamer, streamingProtocols, protectionFeatures,
      weightKg, heightMm, widthMm, depthMm, diameterMm,
      housingMaterial, finish, colorsStandard, customRalAvailable,
      cutoutHeightMm, cutoutWidthMm, cutoutDiameterMm,
      requiredCavityDepthMm, mountingMethod, mountingMethods,
      paintableGrille, grilleMaterial, fireRating,
      tweeterAimable, installationOrientation,
      mountingBracketRequired, mountingBracketDimensions,
      inputs, outputs, communicationPorts,
      wirelessConnectivity, networkProtocol, controlProtocol,
      speakerWireConnector, rackMountable, rackUnitSize,
      lineTransformerCompatible,
      mobileAppName, mobileAppLinkIos, mobileAppLinkAndroid,
      desktopSoftwareName, desktopSoftwareUrl, compatibleControlSystems,
      eqProfileName, recommendedCrossoverHz,
      minRiggingHeight, minSpeakerSpacing,
      screwSize, wireGaugeRecommended, wireConnectorType,
      itemsInBox, installationSteps, recommendedRoomSize, positioningNote,
      cadFile,
      geoDescription, seoTitle, seoDescription, seoKeywords,
      backBoxRequired, backBoxIncluded, grilleIncluded,
      certifications, typicalUseCases,
      category->{ name, slug },
      recommendedPairingPrimary->{ _id, productName, slug, heroImage, series, category->{ name, slug } },
      recommendedPairingSecondary->{ _id, productName, slug, heroImage, series, category->{ name, slug } },
      compatibleAmplifiers[]->{ _id, productName, slug, heroImage, series, category->{ name, slug } },
      compatibleSubwoofers[]->{ _id, productName, slug, heroImage, series, category->{ name, slug } },
      compatibleSpeakers[]->{ _id, productName, slug, heroImage, series, category->{ name, slug } },
      accessories[]->{ _id, productName, slug, heroImage },
      relatedProducts[]->{ _id, productName, slug, heroImage, series, sensitivityDb, powerRmsW, impedanceOhms, "category": category->{ name, "slug": slug } },
      "inWallVariant": *[_type=="product" && status=="Active" && (
        (^.productName == "Cane" && productName == "Cane In-Ceiling / In-Wall") ||
        (^.productName == "Bonsai" && productName == "Bonsai In-Ceiling / In-Wall") ||
        (^.productName == "QuadCane" && productName == "QuadCane In-Ceiling / In-Wall")
      )][0]{ _id, productName, "slug": slug.current, "catSlug": category->slug.current, heroImage, lifestyleImages, heightMm, widthMm, depthMm },
      accessories[]->{ _id, name, category, shortDescription, description, skuCode,
        heroImage, lifestyleImage,
        specs[]{ label, value }
      },
      typicalSetups[]{
        _key, label, description,
        products[]{
          _key, quantity, role,
          product->{ _id, productName, "slug": slug.current, series, sensitivityDb, powerRmsW, powerPeakW, impedanceOhms, heroImage, "galleryImage": galleryImages[0], "catSlug": category->slug.current }
        }
      },
    }
  `, { slug })
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: `${product.seoTitle || product.productName + ' — XSCACE'}`,
    description: product.seoDescription || product.shortDescription || product.tagline,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  return <ProductDetail product={product} />
}
