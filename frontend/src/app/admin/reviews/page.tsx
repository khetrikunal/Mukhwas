'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { reviewApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Check, Trash2, Star, MessageSquare } from 'lucide-react'

interface Review {
  id: string
  productName: string
  userName: string
  rating: number
  comment: string
  isApproved: boolean
  createdAt: string
}

export default function AdminReviewsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await reviewApi.adminGetAll()
      setReviews(res.data.data || [])
    } catch { toast.error('Failed to load reviews') }
    finally { setLoading(false) }
  }

  const approve = async (id: string) => {
    try {
      await reviewApi.approve(id)
      toast.success('Review approved')
      fetchReviews()
    } catch { toast.error('Failed to approve') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this review?')) return
    try {
      await reviewApi.delete(id)
      toast.success('Review deleted')
      fetchReviews()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">Moderate customer reviews</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-navy/[0.07] h-24 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-navy/[0.07] py-16 text-center text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
            No pending reviews
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id}
                className={`bg-white rounded-xl border border-navy/[0.07] p-5 flex gap-4 shadow-sm
                  ${r.isApproved ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-yellow-400'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-navy text-sm">{r.userName || 'Anonymous'}</span>
                    <span className="text-gray-400 text-xs">on</span>
                    <span className="text-navy/70 text-sm font-medium">{r.productName}</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11}
                          className={i < r.rating ? 'text-gold fill-gold' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className={`badge text-xs ml-auto ${r.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.comment || '(No comment)'}</p>
                  <p className="text-gray-400 text-xs mt-2">{new Date(r.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!r.isApproved && (
                    <button onClick={() => approve(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                      <Check size={13} /> Approve
                    </button>
                  )}
                  <button onClick={() => remove(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
