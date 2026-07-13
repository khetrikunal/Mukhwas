'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package } from 'lucide-react'
import { orderApi } from '@/lib/api'

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    // In a real flow you'd fetch by order ID; using order number lookup as fallback
    orderApi.getMyOrders().then((res) => {
      const found = res.data.data?.find((o: any) => o.id === id)
      setOrder(found)
    }).catch(() => {})
  }, [id])

  return (
    <div className="pt-[70px] min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 border border-navy/[0.07] shadow-xl">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 text-sm mb-6">
          {order ? `Order #${order.orderNumber}` : 'Thank you for shopping with us.'}
        </p>
        {order && (
          <div className="bg-cream-dark rounded-lg p-4 mb-6 text-left text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold text-navy">₹{order.totalAmount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-semibold text-navy">{order.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold text-navy">{order.status}</span></div>
          </div>
        )}
        <p className="text-gray-400 text-xs mb-8">
          We&apos;ll send you updates via email as your order progresses through processing and shipping.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/account/orders" className="btn-primary flex items-center justify-center gap-2">
            <Package size={16} /> Track My Order
          </Link>
          <Link href="/products" className="text-gold text-sm hover:underline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
