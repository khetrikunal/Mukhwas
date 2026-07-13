'use client'
import { useEffect, useState } from 'react'
import { orderApi } from '@/lib/api'
import { Order } from '@/types'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
}

export default function AdminOrdersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchOrders()
  }, [page])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await orderApi.getAll({ page, size: 20 })
      const data = res.data.data
      setOrders(data?.content || [])
      setTotalPages(data?.totalPages || 1)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await orderApi.updateStatus(id, status)
      toast.success('Status updated')
      fetchOrders()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const filtered = search
    ? orders.filter(o => o.orderNumber?.toLowerCase().includes(search.toLowerCase()))
    : orders

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and update order statuses</p>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by order number…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-navy/15 rounded-xl text-sm w-full focus:outline-none focus:border-gold bg-white" />
        </div>

        <div className="bg-white rounded-xl border border-navy/[0.07] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50">
                {['Order #', 'Type', 'Amount', 'Payment', 'Status', 'Date', 'Update Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No orders found</td></tr>
              ) : filtered.map((order) => (
                <tr key={order.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-navy">{order.orderNumber}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${order.orderType === 'WHOLESALE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {order.orderType}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-navy">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${statusColor[order.status]}`}>{order.status}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="border border-navy/15 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-gold bg-white"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy/15 disabled:opacity-40 hover:border-gold">Prev</button>
            <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy/15 disabled:opacity-40 hover:border-gold">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
