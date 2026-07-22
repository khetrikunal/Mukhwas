'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Crown, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      toast.success('If an account with that email exists, a reset link has been sent.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal flex items-center justify-center px-4 pt-[70px] py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-royal p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light
                            flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/30">
              <Crown size={24} className="text-navy-deep" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-cream">Forgot Password</h1>
            <p className="text-cream/60 text-sm mt-1">We&apos;ll send you a reset link</p>
          </div>

          <div className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Mail size={28} className="text-green-600" />
                </div>
                <h2 className="font-serif text-xl font-bold text-navy">Check Your Email</h2>
                <p className="text-gray-500 text-sm">
                  If an account with <strong className="text-navy">{email}</strong> exists,
                  we&apos;ve sent a password reset link to it.
                </p>
                <p className="text-gray-400 text-xs">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button onClick={() => setSent(false)} className="text-gold hover:underline font-medium">
                    try again
                  </button>.
                </p>
                <Link href="/login" className="btn-primary w-full justify-center mt-4 inline-flex">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-navy text-sm font-medium mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="text-center">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-gold text-sm hover:underline font-medium">
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

