'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { accessToken, refreshToken, role, userId, name, email } = res.data.data
      setAuth({ id: userId, name, email, role }, accessToken, refreshToken)
      toast.success(`Welcome back, ${name}!`)
      if (role === 'ADMIN') router.push('/admin/dashboard')
      else router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal flex items-center justify-center px-4 pt-[70px]">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="bg-gradient-royal p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light
                            flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/30">
              <Crown size={24} className="text-navy-deep" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-cream">Welcome Back</h1>
            <p className="text-cream/60 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-navy text-sm font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-navy text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-gold text-xs hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-gold font-semibold hover:underline">Create Account</Link>
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
