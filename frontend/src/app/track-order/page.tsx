'use client'
import { useState } from 'react'
import { Search, Package, CheckCircle, Truck, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { orderApi } from '@/lib/api'
import { Order } from '@/types'

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim()) return
    setLoading(true)
    try {
      const res = await orderApi.getByOrderNumber(orderNumber.trim())
      setOrder(res.data.data)
    } catch {
      toast.error('Order not found')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const currentStepIndex = order ? STEPS.indexOf(order.status) : -1

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="bg-gradient-royal py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="section-label">Order Status</div>
        <h1 className="font-serif text-4xl font-bold text-cream mb-6">Track Your Order</h1>
        <form onSubmit={handleTrack} className="max-w-md mx-auto relative">
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter order number (e.g. RM-240615-0001)"
            className="w-full bg-white/10 border border-gold/30 rounded-lg px-5 py-3 text-cream placeholder:text-cream/40 text-sm focus:outline-none focus:border-gold/60"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gold">
            <Search size={18} />
          </button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && <div className="text-center text-gray-400">Searching...</div>}

        {order && !loading && (
          <div className="bg-white rounded-xl p-8 border border-navy/[0.07]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="font-serif text-xl font-bold text-navy">{order.orderNumber}</div>
                <div className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <span className="font-bold text-navy text-lg">₹{order.totalAmount}</span>
            </div>

            {order.status === 'CANCELLED' ? (
              <div className="bg-red-50 text-red-600 rounded-lg p-4 text-center font-semibold">
                This order has been cancelled.
              </div>
            ) : (
              <div className="flex justify-between relative mb-2">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
                  <div className="h-full bg-gold transition-all"
                       style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }} />
                </div>
                {STEPS.map((step, i) => (
                  <div key={step} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${i <= currentStepIndex ? 'bg-gold text-navy-deep' : 'bg-gray-200 text-gray-400'}`}>
                      {i <= currentStepIndex ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-2 text-center ${i <= currentStepIndex ? 'text-navy font-semibold' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="font-serif text-navy font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.productName} ({item.variantLabel}) × {item.quantity}</span>
                    <span className="text-navy font-medium">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!order && !loading && (
          <div className="text-center text-gray-400 py-12">
            <Package size={56} className="mx-auto mb-4 text-navy/15" />
            Enter your order number above to check status
          </div>
        )}
      </div>
    </div>
  )
}
