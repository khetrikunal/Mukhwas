'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        name: form.name, email: form.email, phone: form.phone, password: form.password,
      })
      const { accessToken, userId, name, email, role } = res.data.data
      setAuth({ id: userId, name, email, role }, accessToken)
      toast.success(`Welcome, ${name}!`)
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal flex items-center justify-center px-4 pt-[70px] py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-royal p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/30">
              <Crown size={24} className="text-navy-deep" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-cream">Create Account</h1>
            <p className="text-cream/60 text-sm mt-1">Join The Royal Mukhwas family</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-navy text-sm font-medium mb-1.5">Full Name</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name" className="input-field" />
            </div>
            <div>
              <label className="block text-navy text-sm font-medium mb-1.5">Email Address</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-navy text-sm font-medium mb-1.5">Phone Number</label>
              <input type="tel" required value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit mobile number" className="input-field" />
            </div>
            <div>
              <label className="block text-navy text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters" className="input-field pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-navy text-sm font-medium mb-1.5">Confirm Password</label>
              <input type="password" required value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password" className="input-field" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-gold font-semibold hover:underline">Sign In</Link>
            </p>
            <p className="text-center text-sm text-gray-500">
              Wholesale buyer?{' '}
              <Link href="/register/wholesale" className="text-navy font-semibold hover:underline">Register here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
