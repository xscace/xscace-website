import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'software',
  title: 'Software',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'download', title: 'Download' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'name', title: 'App Name', type: 'string', group: 'main', validation: R => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', group: 'main', options: { source: 'name' }, validation: R => R.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', group: 'main' }),
    defineField({ name: 'shortDescription', title: 'Short Description', type: 'text', rows: 3, group: 'main' }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      group: 'main',
      options: {
        list: [
          { title: 'iOS', value: 'ios' },
          { title: 'Android', value: 'android' },
          { title: 'iOS & Android', value: 'ios-android' },
          { title: 'Mac', value: 'mac' },
          { title: 'Windows', value: 'windows' },
          { title: 'Mac & Windows', value: 'mac-windows' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'main',
      options: { list: [{ title: 'Available', value: 'available' }, { title: 'Coming Soon', value: 'coming-soon' }], layout: 'radio' },
      initialValue: 'available',
    }),
    defineField({ name: 'version', title: 'Current Version', type: 'string', group: 'main' }),
    defineField({ name: 'latestReleaseDate', title: 'Latest Release Date', type: 'date', group: 'main' }),

    // Download links (mobile — external store URLs)
    defineField({ name: 'appStoreUrl', title: 'App Store URL (iOS)', type: 'url', group: 'download' }),
    defineField({ name: 'playStoreUrl', title: 'Google Play URL (Android)', type: 'url', group: 'download' }),

    // Desktop — upload installer files directly to Sanity (takes priority over URL fields)
    defineField({
      name: 'macFile',
      title: 'Mac Installer (.dmg)',
      type: 'file',
      group: 'download',
      description: 'Upload the .dmg installer. Once uploaded, the Download for Mac button activates automatically.',
      options: { accept: '.dmg,application/octet-stream' },
    }),
    defineField({
      name: 'windowsFile',
      title: 'Windows Installer (.exe / .msi)',
      type: 'file',
      group: 'download',
      description: 'Upload the .exe or .msi installer. Once uploaded, the Download for Windows button activates.',
      options: { accept: '.exe,.msi,application/octet-stream' },
    }),

    // Desktop — fallback external URLs (used only if no file uploaded above)
    defineField({ name: 'downloadUrlMac', title: 'Download URL Mac (fallback)', type: 'url', group: 'download', description: 'Only used if no .dmg file is uploaded above.' }),
    defineField({ name: 'downloadUrlWindows', title: 'Download URL Windows (fallback)', type: 'url', group: 'download', description: 'Only used if no .exe/.msi file is uploaded above.' }),

    // Images
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', group: 'content', options: { hotspot: true } }),
    defineField({ name: 'deviceMockup', title: 'Device Mockup (transparent PNG)', type: 'image', group: 'content', options: { hotspot: true } }),
    defineField({
      name: 'screenshots',
      title: 'Screenshots',
      type: 'array',
      group: 'content',
      of: [{
        type: 'object',
        fields: [
          { name: 'image', title: 'Screenshot', type: 'image', options: { hotspot: true } },
          { name: 'caption', title: 'Caption', type: 'string' },
        ],
        preview: { select: { title: 'caption', media: 'image' } },
      }],
    }),

    // Features
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      group: 'content',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', title: 'Feature Title', type: 'string' },
          { name: 'description', title: 'Description', type: 'text', rows: 2 },
          { name: 'icon', title: 'Icon', type: 'string', description: 'Icon name (e.g. volume, wifi, eq, preset, timer)' },
        ],
        preview: { select: { title: 'title', subtitle: 'description' } },
      }],
    }),

    // Compatible products
    defineField({
      name: 'compatibleProducts',
      title: 'Compatible Products',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
    }),

    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2, group: 'seo' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'platform', media: 'heroImage' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle || '', media }
    },
  },
})
