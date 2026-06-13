import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'accessory',
  title: 'Accessory',
  type: 'document',
  groups: [
    { name: 'info',   title: 'Info' },
    { name: 'media',  title: 'Media' },
    { name: 'specs',  title: 'Specs' },
    { name: 'compat', title: 'Compatibility' },
  ],
  fields: [
    defineField({
      name: 'name', title: 'Name', type: 'string', group: 'info',
      description: 'e.g. Corner Mount, Floorstand, Hanging Mount',
      validation: R => R.required()
    }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'info',
      options: { source: 'name', maxLength: 96 }
    }),
    defineField({
      name: 'category', title: 'Category', type: 'string', group: 'info',
      options: { list: [
        { title: 'Mount', value: 'mount' },
        { title: 'Bracket', value: 'bracket' },
        { title: 'Stand', value: 'stand' },
        { title: 'Grille', value: 'grille' },
        { title: 'Cable', value: 'cable' },
        { title: 'Other', value: 'other' },
      ], layout: 'radio' }
    }),
    defineField({
      name: 'shortDescription', title: 'Short Description', type: 'string', group: 'info',
      description: 'One line — shown on product page card'
    }),
    defineField({
      name: 'description', title: 'Full Description', type: 'text', group: 'info',
      rows: 4
    }),
    defineField({
      name: 'heroImage', title: 'Product Image', type: 'image', group: 'media',
      description: 'Clean shot of the accessory alone',
      options: { hotspot: true }
    }),
    defineField({
      name: 'lifestyleImage', title: 'Lifestyle Image', type: 'image', group: 'media',
      description: 'The accessory in use with the speaker — this is the hero on the product page',
      options: { hotspot: true }
    }),
    defineField({
      name: 'specs', title: 'Specs', type: 'array', group: 'specs',
      of: [{ type: 'object', name: 'spec', fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'value', title: 'Value', type: 'string' }),
      ], preview: { select: { title: 'label', subtitle: 'value' } } }]
    }),
    defineField({
      name: 'skuCode', title: 'SKU Code', type: 'string', group: 'specs'
    }),
    defineField({
      name: 'compatibleProducts', title: 'Compatible Products', type: 'array', group: 'compat',
      of: [{ type: 'reference', to: [{ type: 'product' }] }]
    }),
    defineField({
      name: 'shopUrl', title: 'Shop / Enquire URL', type: 'url', group: 'info',
      description: 'Optional — link to purchase or enquiry page'
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'category', media: 'heroImage' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle, media })
  }
})
