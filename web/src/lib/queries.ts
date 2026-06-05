import { client } from './sanity'

// ─── CATEGORY QUERIES ──────────────────────────────────────────────────────

export async function getAllCategories() {
  return client.fetch(`
    *[_type == "category"] | order(order asc) {
      _id, name, slug, order
    }
  `)
}

// ─── PRODUCT LIST QUERIES ──────────────────────────────────────────────────

export async function getAllProducts() {
  return client.fetch(`
    *[_type == "product" && status == "Active"] | order(productName asc) {
      _id, productName, productFullName, series, subCategory, powerType,
      skuBase, tagline, shortDescription, status, launchYear,
      slug, proprietaryTechBadges, belongsToSet,
      heroImage, hasArView, arViewLink,
      powerRmsW, impedanceOhms, sensitivityDb,
      freqLowHz, freqHighHz, freqQualifier,
      heightMm, widthMm, depthMm, weightKg,
      hasDsp, hasStreamer, totalPowerW, ampClass, channelCount,
      category->{ _id, name, slug },
    }
  `)
}

export async function getProductsByCategory(categorySlug: string) {
  return client.fetch(`
    *[_type == "product" && status == "Active" && category->slug.current == $slug] | order(productName asc) {
      _id, productName, productFullName, series, subCategory, powerType,
      skuBase, tagline, shortDescription, status, launchYear,
      slug, proprietaryTechBadges,
      heroImage, hasArView, arViewLink,
      powerRmsW, impedanceOhms, sensitivityDb,
      freqLowHz, freqHighHz, freqQualifier,
      heightMm, widthMm, depthMm, weightKg,
      hasDsp, hasStreamer, totalPowerW, ampClass, channelCount,
      category->{ _id, name, slug },
    }
  `, { slug: categorySlug })
}

// ─── SINGLE PRODUCT QUERY ──────────────────────────────────────────────────

export async function getProductBySlug(slug: string) {
  return client.fetch(`
    *[_type == "product" && slug.current == $slug][0] {
      _id, productName, productFullName, series, subCategory, powerType,
      skuBase, skuVariants, skuLegend,
      tagline, shortDescription, longDescription,
      status, launchYear, slug, proprietaryTechBadges, belongsToSet,

      // Media
      heroImage, galleryImages, lifestyleImages,
      installationDiagramImages, wiringDiagramImage, dimensionDrawing,
      cutoutTemplateImage, directivityPlotImage, splThrowChartImage,
      hasArView, arViewLink, heroVideo, model3dUrl,

      // Speaker specs
      powerRmsW, powerPeakW, impedanceOhms, sensitivityDb,
      freqLowHz, freqHighHz, freqQualifier,
      driverCount, driverSize, driverMaterial, driverDescription,
      tweeterCount, tweeterType, builtInSubDriver,
      directivityHDeg, directivityVDeg,
      crossoverType, crossoverFrequency,
      marineTreatable, ipRating, eqData, eqProfileName, recommendedCrossoverHz,

      // Amp specs
      totalPowerW, ampClass, channelCount, channelConfigurations,
      powerPerCh8OhmW, powerPerCh4OhmW, bridgedMonoPower,
      thdN, snrDb, freqResponse, inputImpedance, inputSensitivity,
      crosstalk, protectionFeatures,
      hasDsp, dspProcessorSpec, dspPresets,
      hasStreamer, streamingProtocols,
      zoneCount, powerSupply, coolingMethod,

      // Physical
      heightMm, widthMm, depthMm, diameterMm,
      heightIn, widthIn, depthIn,
      weightKg, weightPoweredKg,
      housingMaterial, finish, colorsStandard,
      customRalAvailable, customRalMoq, customRalSurchargePct, customRalLeadDays, customFinishOptions,

      // IW/IC
      cutoutWidthMm, cutoutHeightMm, cutoutDiameterMm,
      requiredCavityDepthMm, cutoutTemplateIncluded,
      mountingMethod, installationOrientation,
      paintableGrille, grilleMaterial, fireRating,
      mountingBracketRequired, mountingBracketDimensions, tweeterAimable,

      // Connectivity
      inputs, outputs, communicationPorts, wirelessConnectivity,
      networkProtocol, controlProtocol, speakerWireConnector,
      lineTransformerCompatible, rackMountable, rackUnitSize,

      // Software
      mobileAppName, mobileAppLinkIos, mobileAppLinkAndroid,
      desktopSoftwareName, desktopSoftwareUrl, compatibleControlSystems,

      // Installation
      minRiggingHeight, minSpeakerSpacing, mountingMethods,
      screwSize, wireGaugeRecommended, wireConnectorType,
      itemsInBox, installationSteps, recommendedRoomSize,
      setupDiagram, positioningNote,

      // Compatibility
      recommendedPairingPrimary->{ _id, productName, productFullName, slug, heroImage, subCategory },
      recommendedPairingSecondary->{ _id, productName, productFullName, slug, heroImage, subCategory },
      compatibleAmplifiers[]->{ _id, productName, slug, heroImage, totalPowerW, channelCount },
      compatibleSubwoofers[]->{ _id, productName, slug, heroImage, powerRmsW, freqLowHz },
      compatibleSpeakers[]->{ _id, productName, slug, heroImage, powerRmsW, sensitivityDb },
      compatibleAccessories[]->{ _id, productName, slug, heroImage },

      // Downloads
      specSheet, installGuide, cadFile,

      // SEO
      seoTitle, seoDescription,

      // Category
      category->{ _id, name, slug },
    }
  `, { slug })
}

// ─── SITEMAP / SLUG LIST ───────────────────────────────────────────────────

export async function getAllProductSlugs() {
  return client.fetch(`
    *[_type == "product" && defined(slug.current)] {
      "slug": slug.current
    }
  `)
}

// ─── HOMEPAGE FEATURED ─────────────────────────────────────────────────────

export async function getFeaturedProducts() {
  return client.fetch(`
    *[_type == "product" && status == "Active"] | order(launchYear desc) [0...8] {
      _id, productName, productFullName, series, subCategory,
      tagline, shortDescription, slug, heroImage, proprietaryTechBadges,
      powerRmsW, impedanceOhms, sensitivityDb, totalPowerW,
      category->{ name, slug }
    }
  `)
}

// ─── DISTRIBUTORS ─────────────────────────────────────────────────────────

export async function getAllDistributors() {
  return client.fetch(`
    *[_type == "distributor"] | order(region asc) {
      _id, name, region, country, city,
      email, phone, website, address
    }
  `)
}

// ─── JOURNAL / BLOG ───────────────────────────────────────────────────────

export async function getAllPosts() {
  return client.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      _id, title, slug, publishedAt, excerpt,
      mainImage, categories
    }
  `)
}

export async function getPostBySlug(slug: string) {
  return client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id, title, slug, publishedAt, excerpt,
      mainImage, body, categories
    }
  `, { slug })
}

// ─── SITE SETTINGS ────────────────────────────────────────────────────────

export async function getSiteSettings() {
  return client.fetch(`
    *[_type == "siteSettings"][0] {
      title, description, logo, favicon,
      contactEmail, contactPhone, socialLinks
    }
  `)
}
