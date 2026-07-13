'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Users, Package, TrendingUp, BarChart3 } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'

interface Stats {
  totalOrders: number
  totalUsers: number
  totalProducts: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRecentOrders(),
      ])
      setStats(statsRes.data.data)
      setRecentOrders(ordersRes.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>

        {/* Stats cards */}
        {loading ? (
          <div className="grid grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Total Orders', value: stats?.totalOrders, icon: <ShoppingBag size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: <TrendingUp size={20} />, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Users', value: stats?.totalUsers, icon: <Users size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Total Products', value: stats?.totalProducts, icon: <Package size={20} />, color: 'text-gold', bg: 'bg-gold/10' },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl p-5 border border-navy/[0.07]">
                <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>
                  {icon}
                </div>
                <div className="font-bold text-2xl text-navy">{value ?? '—'}</div>
                <div className="text-gray-500 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-navy/[0.07] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-serif text-navy font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-gold text-sm hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/50">
                  <th className="text-left px-6 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">Order #</th>
                  <th className="text-left px-6 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-6 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">No orders yet</td>
                  </tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-navy">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-gold transition-colors">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.user?.name || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-navy">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Add Product', href: '/admin/products', icon: <Package size={18} /> },
            { label: 'Manage Orders', href: '/admin/orders', icon: <ShoppingBag size={18} /> },
            { label: 'View Reports', href: '/admin/reports', icon: <BarChart3 size={18} /> },
          ].map(({ label, href, icon }) => (
            <Link key={href} href={href}
                  className="bg-white border border-navy/[0.07] rounded-xl p-4 flex items-center gap-3
                             hover:border-gold/40 hover:shadow-md transition-all group">
              <div className="w-9 h-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center
                              group-hover:bg-gold group-hover:text-navy-deep transition-all">
                {icon}
              </div>
              <span className="font-medium text-navy text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
