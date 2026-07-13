'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function WholesaleRegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    businessName: '', gstNumber: '', address: '',
    city: '', state: 'Maharashtra', pincode: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.registerWholesale(form)
      const { accessToken, userId, name, email, role } = res.data.data
      setAuth({ id: userId, name, email, role }, accessToken)
      toast.success('Registration submitted! Await admin approval for wholesale pricing.')
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-[70px] min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-royal p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light
                            flex items-center justify-center mx-auto mb-4">
              <Crown size={24} className="text-navy-deep" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-cream">Wholesale Registration</h1>
            <p className="text-cream/60 text-sm mt-1">Register for exclusive bulk pricing</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="pb-3 border-b border-gray-100">
              <h3 className="font-serif text-navy font-semibold">Personal Details</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">Full Name *</label>
                <input name="name" required value={form.name} onChange={handleChange} className="input-field" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">Phone *</label>
                <input name="phone" required value={form.phone} onChange={handleChange} className="input-field" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">Email *</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} className="input-field" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">Password *</label>
                <input name="password" type="password" required value={form.password} onChange={handleChange} className="input-field" placeholder="Min 6 characters" />
              </div>
            </div>

            <div className="pb-3 border-b border-gray-100 pt-2">
              <h3 className="font-serif text-navy font-semibold">Business Details</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-navy text-sm font-medium mb-1.5">Business Name *</label>
                <input name="businessName" required value={form.businessName} onChange={handleChange} className="input-field" placeholder="Your business / shop name" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">GST Number</label>
                <input name="gstNumber" value={form.gstNumber} onChange={handleChange} className="input-field" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">City *</label>
                <input name="city" required value={form.city} onChange={handleChange} className="input-field" placeholder="Your city" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">State</label>
                <input name="state" value={form.state} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">Pincode</label>
                <input name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="6-digit pincode" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-navy text-sm font-medium mb-1.5">Business Address *</label>
                <textarea name="address" required value={form.address} onChange={handleChange}
                          className="input-field resize-none" rows={3} placeholder="Complete business address" />
              </div>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 text-sm text-navy/70">
              ℹ️ After registration, your wholesale account will be reviewed and approved by our admin team.
              You&apos;ll receive an email notification once approved.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Submitting...' : 'Submit Wholesale Application'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already registered?{' '}
              <Link href="/login" className="text-gold font-semibold hover:underline">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
