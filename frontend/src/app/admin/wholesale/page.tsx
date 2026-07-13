'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, CheckCircle, Clock } from 'lucide-react'

interface WholesaleProfile {
  id: string
  businessName: string
  gstNumber?: string
  isApproved: boolean
  approvedAt?: string
  createdAt: string
  user?: { id: string; name: string; email: string; phone: string }
}

export default function AdminWholesalePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [requests, setRequests] = useState<WholesaleProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getWholesaleRequests()
      setRequests(res.data.data || [])
    } catch { toast.error('Failed to load wholesale requests') }
    finally { setLoading(false) }
  }

  const approve = async (id: string) => {
    try {
      await adminApi.approveWholesale(id)
      toast.success('Wholesale request approved!')
      fetchRequests()
    } catch { toast.error('Approval failed') }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy">Wholesale Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Approve wholesale business accounts</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-navy/[0.07] h-24 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-navy/[0.07] py-16 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            No pending wholesale requests
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id}
                className="bg-white rounded-xl border border-navy/[0.07] p-5 flex gap-5 items-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-semibold text-navy">{r.businessName || r.user?.name}</span>
                    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <Clock size={11} /> Pending
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    {r.user?.email && <span>{r.user.email}</span>}
                    {r.user?.phone && <span>{r.user.phone}</span>}
                    {r.gstNumber && <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">GST: {r.gstNumber}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied on {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <button onClick={() => approve(r.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex-shrink-0">
                  <CheckCircle size={15} /> Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
