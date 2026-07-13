'use client'
import { useState } from 'react'
import { Phone, Mail, MapPin, Instagram } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Message sent! We'll get back to you soon.")
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="bg-gradient-royal py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="section-label">Get in Touch</div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-cream">Contact Us</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-navy/[0.07] flex gap-4">
            <div className="w-11 h-11 rounded-lg bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
              <Phone size={18} />
            </div>
              <div>
                <div className="font-semibold text-navy mb-1">Phone</div>
                <a href="tel:+919156996309" className="text-gray-500 text-sm hover:text-gold block">+91 9156996309</a>
              </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-navy/[0.07] flex gap-4">
            <div className="w-11 h-11 rounded-lg bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
              <Instagram size={18} />
            </div>
            <div>
              <div className="font-semibold text-navy mb-1">Instagram</div>
              <a href="https://instagram.com/the_royal_mukhwas" target="_blank" rel="noreferrer" className="text-gray-500 text-sm hover:text-gold">
                @the_royal_mukhwas
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-navy/[0.07] flex gap-4">
            <div className="w-11 h-11 rounded-lg bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <div className="font-semibold text-navy mb-1">Head Office</div>
              <p className="text-gray-500 text-sm">M. No. 3159, Malegaon Bk, Taluka Baramati, District Pune, Maharashtra – 413115</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl p-6 border border-navy/[0.07]">
          <h3 className="font-serif text-navy font-semibold text-lg mb-5">Send us a Message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Your Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            <input required type="email" placeholder="Your Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            <textarea required rows={5} placeholder="Your Message" value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field resize-none" />
            <button type="submit" className="btn-primary w-full justify-center">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  )
}
