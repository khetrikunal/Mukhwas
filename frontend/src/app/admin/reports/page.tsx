'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { BarChart3, TrendingUp, ShoppingBag, IndianRupee, Search } from 'lucide-react'

interface SalesReport {
  from: string
  to: string
  totalOrders: number
  paidOrders: number
  totalRevenue: number
}

const today = new Date().toISOString().split('T')[0]
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

export default function AdminReportsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [from, setFrom] = useState(thirtyDaysAgo)
  const [to, setTo] = useState(today)
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchReport()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getSalesReport(from, to)
      setReport(res.data.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  const stats = [
    {
      label: 'Total Orders',
      value: report?.totalOrders ?? '—',
      icon: <ShoppingBag size={20} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Paid Orders',
      value: report?.paidOrders ?? '—',
      icon: <TrendingUp size={20} />,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Revenue',
      value: report ? `₹${Number(report.totalRevenue).toLocaleString('en-IN')}` : '—',
      icon: <IndianRupee size={20} />,
      color: 'text-gold',
      bg: 'bg-gold/10',
    },
    {
      label: 'Conversion Rate',
      value: report && report.totalOrders > 0
        ? `${Math.round((report.paidOrders / report.totalOrders) * 100)}%`
        : '—',
      icon: <BarChart3 size={20} />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy">Sales Report</h1>
          <p className="text-gray-500 text-sm mt-1">Analyse your revenue and order trends</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl border border-navy/[0.07] p-5 mb-6 flex flex-wrap gap-4 items-end shadow-sm">
          <div>
            <label className="block text-xs font-medium text-navy/70 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy/70 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white" />
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="flex items-center gap-2 bg-gold text-navy-deep font-semibold px-4 py-2.5 rounded-xl hover:bg-gold-light transition-all text-sm disabled:opacity-60">
            <Search size={15} />
            {loading ? 'Loading…' : 'Generate Report'}
          </button>
          {/* Quick presets */}
          <div className="flex gap-2 ml-auto flex-wrap">
            {[
              { label: 'Today', days: 0 },
              { label: '7 days', days: 7 },
              { label: '30 days', days: 30 },
              { label: '90 days', days: 90 },
            ].map(({ label, days }) => (
              <button key={label}
                onClick={() => {
                  const t = new Date().toISOString().split('T')[0]
                  const f = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  setFrom(f); setTo(t)
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-navy/15 hover:border-gold text-navy/60 hover:text-navy transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-navy/[0.07] shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>
                {icon}
              </div>
              <div className={`font-bold text-2xl ${loading ? 'animate-pulse text-gray-200' : 'text-navy'}`}>
                {loading ? '—' : value}
              </div>
              <div className="text-gray-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        {report && !loading && (
          <div className="bg-white rounded-xl border border-navy/[0.07] p-6 shadow-sm">
            <h2 className="font-serif text-navy font-semibold mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Period</span>
                <span className="font-medium text-navy text-sm">
                  {new Date(report.from).toLocaleDateString('en-IN')} — {new Date(report.to).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Total Orders</span>
                <span className="font-bold text-navy">{report.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Paid Orders</span>
                <span className="font-bold text-green-600">{report.paidOrders}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Unpaid / Pending</span>
                <span className="font-bold text-yellow-600">{report.totalOrders - report.paidOrders}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm font-semibold">Total Revenue (Paid)</span>
                <span className="font-bold text-xl text-navy">₹{Number(report.totalRevenue).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
