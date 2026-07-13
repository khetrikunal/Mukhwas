'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ChevronRight } from 'lucide-react'
import { orderApi } from '@/lib/api'
import { Order } from '@/types'

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.getMyOrders().then((res) => setOrders(res.data.data || [])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-4xl font-bold text-navy mb-10">My Orders</h1>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto mb-4 text-navy/20" />
            <h2 className="font-serif text-xl text-navy mb-2">No orders yet</h2>
            <Link href="/products" className="btn-primary inline-block mt-4">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`}
                className="block bg-white rounded-xl p-5 border border-navy/[0.07] hover:border-gold/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-navy">{order.orderNumber}</div>
                    <div className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <span className={`badge ${statusColor[order.status]}`}>{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">{order.items?.length || 0} item(s)</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">₹{order.totalAmount}</span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
