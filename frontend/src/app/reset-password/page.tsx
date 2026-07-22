'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Crown, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const tokenParam = searchParams.get('token')
  const token: string = tokenParam ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.resetPassword({ token, newPassword: password })
      const { accessToken, userId, name, email, role } = res.data.data
      setAuth({ id: userId, name, email, role }, accessToken)
      setSuccess(true)
      toast.success('Password reset successful!')
      setTimeout(() => router.push('/'), 2000)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <XCircle size={28} className="text-red-500" />
        </div>
        <h2 className="font-serif text-xl font-bold text-navy">Invalid Reset Link</h2>
        <p className="text-gray-500 text-sm">{error}</p>
        <Link href="/forgot-password" className="btn-primary w-full justify-center mt-4 inline-flex">
          Request New Reset Link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="font-serif text-xl font-bold text-navy">Password Reset Successful</h2>
        <p className="text-gray-500 text-sm">You are now logged in. Redirecting to homepage...</p>
        <Link href="/" className="btn-primary w-full justify-center mt-4 inline-flex">
          Go to Homepage
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-navy text-sm font-medium mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="input-field pr-10"
          />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-navy text-sm font-medium mb-1.5">Confirm New Password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          className="input-field"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-gold text-sm hover:underline font-medium">
          Back to Login
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-royal flex items-center justify-center px-4 pt-[70px] py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-royal p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light
                            flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/30">
              <Crown size={24} className="text-navy-deep" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-cream">Reset Password</h1>
            <p className="text-cream/60 text-sm mt-1">Enter your new password</p>
          </div>

          <div className="p-8">
            <Suspense fallback={<div className="text-center text-gray-500 py-8">Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

