import {defineField, defineType} from 'sanity'

// ── CATEGORY ──────────────────────────────────────────────────────────────────
export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: R => R.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: R => R.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'heroImage', title: 'Hero Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'heroVideo', title: 'Hero Video URL (YouTube/Vimeo)', type: 'url'}),
    defineField({name: 'categoryVideo2', title: 'Secondary Video URL', type: 'url'}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 0}),
  ],
  preview: {select: {title: 'name', media: 'heroImage'}},
})

// ── JOURNAL POST ──────────────────────────────────────────────────────────────
export const post = defineType({
  name: 'post',
  title: 'Journal Post',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: R => R.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: R => R.required()}),
    defineField({name: 'publishedAt', title: 'Published Date', type: 'datetime'}),
    defineField({
      name: 'category', title: 'Article Category', type: 'string',
      options: {list: ['News', 'Technology', 'Installation', 'Case Study', 'Product', 'Design']},
    }),
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3}),
    defineField({name: 'heroImage', title: 'Hero Image', type: 'image', options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
    }),
    defineField({
      name: 'body', title: 'Body', type: 'array',
      of: [{type: 'block'}, {type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'relatedProducts', title: 'Related Products',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    }),
    defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2}),
  ],
  orderings: [{title: 'Published Date (newest)', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'publishedAt', media: 'heroImage'},
    prepare({title, subtitle, media}) {
      return {title, subtitle: subtitle ? subtitle.slice(0, 10) : 'Draft', media}
    },
  },
})

// ── DISTRIBUTOR ───────────────────────────────────────────────────────────────
export const distributor = defineType({
  name: 'distributor',
  title: 'Distributor',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Company Name', type: 'string', validation: R => R.required()}),
    defineField({name: 'region', title: 'Region', type: 'string', validation: R => R.required(),
      description: 'e.g. India, UK & Europe, Middle East & North Africa'}),
    defineField({name: 'website', title: 'Website URL', type: 'url'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'address', title: 'Address', type: 'text', rows: 2}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 0}),
  ],
  preview: {select: {title: 'name', subtitle: 'region'}},
})

// ── SITE SETTINGS (singleton) ─────────────────────────────────────────────────
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Site Title', type: 'string'}),
    defineField({name: 'description', title: 'Default Meta Description', type: 'text', rows: 2}),
    defineField({name: 'email', title: 'Contact Email', type: 'string'}),
    defineField({name: 'phone', title: 'WhatsApp / Phone', type: 'string'}),
    defineField({name: 'address', title: 'Address', type: 'text', rows: 2}),
    defineField({
      name: 'socialLinks', title: 'Social Links', type: 'object',
      fields: [
        {name: 'instagram', type: 'url', title: 'Instagram'},
        {name: 'linkedin', type: 'url', title: 'LinkedIn'},
        {name: 'youtube', type: 'url', title: 'YouTube'},
      ],
    }),
  ],
})
