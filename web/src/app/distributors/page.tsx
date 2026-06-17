'use client'

import { useState } from 'react'
import DistributorGlobe from './DistributorGlobe'

export default function FindUsPage() {
  const [formState, setFormState] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', company: '', type: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('sending')
    try {
      const res = await fetch('https://formspree.io/f/maqzzywo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      })
      setFormState(res.ok ? 'sent' : 'error')
    } catch {
      setFormState('error')
    }
  }

  return (
    <div className="dist-page">

      {/* Header */}
      <div className="dist-page-header">
        <div className="dist-page-ey">Global Presence · Get In Touch</div>
        <div className="dist-page-title">Where to <em>Find Us</em></div>
        <div className="dist-page-sub">
          XSCACE is available through authorised distributors across seven regions.
          Drag the globe to explore — click a region to connect.
          Or reach out directly below.
        </div>
      </div>

      {/* Become a distributor bar */}
      <div className="dist-become-bar">
        <div className="dist-become-text">Interested in carrying XSCACE in your market?</div>
        <a href="mailto:support@xscace.com?subject=Distribution Enquiry" className="dist-become-btn">
          Become a Distributor →
        </a>
      </div>

      {/* Globe */}
      <DistributorGlobe />

      {/* Contact section */}
      <div className="findus-contact">

        {/* Left — direct contact details */}
        <div className="findus-details">
          <div className="findus-details-ey">Direct Contact</div>
          <div className="findus-details-h">Not near a distributor?</div>
          <div className="findus-details-sub">
            Reach out directly — for project enquiries, press, distribution, or anything else.
          </div>
          <div className="findus-contact-list">
            <div className="findus-contact-row">
              <div className="findus-contact-lbl">Email</div>
              <a href="mailto:support@xscace.com" className="findus-contact-val">support@xscace.com</a>
            </div>
            <div className="findus-contact-row">
              <div className="findus-contact-lbl">WhatsApp</div>
              <a href="https://wa.me/+15878853303" target="_blank" rel="noopener noreferrer" className="findus-contact-val">+1 587 885 3303</a>
            </div>
            <div className="findus-contact-row">
              <div className="findus-contact-lbl">HQ</div>
              <div className="findus-contact-val">Toronto, Canada</div>
            </div>
            <div className="findus-contact-row">
              <div className="findus-contact-lbl">Trade</div>
              <a href="mailto:support@xscace.com?subject=Trade Enquiry" className="findus-contact-val">Trade &amp; Specification →</a>
            </div>
          </div>
        </div>

        {/* Right — contact form */}
        <div className="findus-form-wrap">
          {formState === 'sent' ? (
            <div className="findus-sent">
              <div className="findus-sent-icon">✓</div>
              <div className="findus-sent-title">Message received.</div>
              <div className="findus-sent-sub">We'll be in touch within one business day.</div>
            </div>
          ) : (
            <form className="findus-form" onSubmit={handleSubmit}>
              <div className="findus-form-row">
                <div className="findus-field">
                  <label className="findus-label">Name</label>
                  <input className="findus-input" type="text" required placeholder="Your name"
                    value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}/>
                </div>
                <div className="findus-field">
                  <label className="findus-label">Email</label>
                  <input className="findus-input" type="email" required placeholder="your@email.com"
                    value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}/>
                </div>
              </div>
              <div className="findus-form-row">
                <div className="findus-field">
                  <label className="findus-label">Company</label>
                  <input className="findus-input" type="text" placeholder="Company or project name"
                    value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))}/>
                </div>
                <div className="findus-field">
                  <label className="findus-label">Enquiry type</label>
                  <select className="findus-input findus-select" required
                    value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    <option value="" disabled>Select…</option>
                    <option>Residential Project</option>
                    <option>Commercial Project</option>
                    <option>Distribution Enquiry</option>
                    <option>Trade / Specification</option>
                    <option>Press &amp; Media</option>
                    <option>General</option>
                  </select>
                </div>
              </div>
              <div className="findus-field">
                <label className="findus-label">Message</label>
                <textarea className="findus-input findus-textarea" required
                  placeholder="Tell us about your project or enquiry…"
                  value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}/>
              </div>
              {formState === 'error' && (
                <div className="findus-error">Something went wrong — please email us directly at support@xscace.com</div>
              )}
              <button type="submit" className="findus-submit" disabled={formState === 'sending'}>
                {formState === 'sending' ? 'Sending…' : 'Send Message →'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
