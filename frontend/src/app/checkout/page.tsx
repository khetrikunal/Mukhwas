'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, CreditCard, Truck, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { addressApi, orderApi, paymentApi } from '@/lib/api'
import { Address } from '@/types'

declare global {
  interface Window { Razorpay: any }
}

export default function CheckoutPage() {
  const { items, subtotal, discount, couponCode, total, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: 'Maharashtra', pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout')
      router.push('/login')
      return
    }
    if (items.length === 0) {
      router.push('/cart')
      return
    }
    fetchAddresses()
    loadRazorpayScript()
    // Re-run when the essentials change; fetchAddresses + loadRazorpay are
    // idempotent enough (dedupe in their bodies) that a re-mount when items
    // or auth flips to a non-empty truthy state is cheap and avoids stale
    // captures of `items` / `isAuthenticated`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, items.length === 0])

  const loadRazorpayScript = () => {
    if (document.getElementById('razorpay-script')) return
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
  }

  const fetchAddresses = async () => {
    try {
      const res = await addressApi.getAll()
      const addrs = res.data.data || []
      setAddresses(addrs)
      const def = addrs.find((a: Address) => a.isDefault)
      if (def) setSelectedAddressId(def.id)
      else if (addrs.length === 0) setShowNewAddress(true)
    } catch {
      setShowNewAddress(true)
    }
  }

  const handleAddAddress = async () => {
    try {
      const res = await addressApi.add(newAddress)
      const addr = res.data.data
      setAddresses([...addresses, addr])
      setSelectedAddressId(addr.id)
      setShowNewAddress(false)
      toast.success('Address added')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address')
      return
    }
    if (paymentMethod === 'COD' && total > 2000) {
      toast.error('COD not available for orders above ₹2000')
      return
    }

    setPlacing(true)
    try {
      const orderData = {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      }
      const res = await orderApi.place(orderData)
      const order = res.data.data

      if (paymentMethod === 'COD') {
        clearCart()
        toast.success('Order placed successfully!')
        router.push(`/order-success/${order.id}`)
        return
      }

      // Razorpay flow
      const rpRes = await paymentApi.createOrder(order.id)
      const razorpayOrder = JSON.parse(rpRes.data.data)

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'The Royal Mukhwas',
        description: `Order ${order.orderNumber}`,
        order_id: razorpayOrder.id,
        theme: { color: '#c9a84c' },
        handler: async (response: any) => {
          try {
            await paymentApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            clearCart()
            toast.success('Payment successful!')
            router.push(`/order-success/${order.id}`)
          } catch {
            toast.error('Payment verification failed')
          }
        },
        prefill: { name: user?.name, email: user?.email },
        modal: { ondismiss: () => toast.error('Payment cancelled') },
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-4xl font-bold text-navy mb-10">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <div className="bg-white rounded-xl p-6 border border-navy/[0.07]">
              <h3 className="font-serif text-navy font-semibold mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-gold" /> Delivery Address
              </h3>

              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id}
                    className={`block border rounded-lg p-4 cursor-pointer transition-all
                      ${selectedAddressId === addr.id ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gold/40'}`}>
                    <div className="flex gap-3">
                      <input type="radio" checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-gold" />
                      <div>
                        <div className="font-semibold text-navy text-sm">{addr.fullName} · {addr.phone}</div>
                        <div className="text-gray-500 text-sm mt-0.5">
                          {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                          {addr.city}, {addr.state} – {addr.pincode}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}

                {!showNewAddress && (
                  <button onClick={() => setShowNewAddress(true)}
                    className="flex items-center gap-2 text-gold text-sm font-semibold hover:underline">
                    <Plus size={14} /> Add New Address
                  </button>
                )}

                {showNewAddress && (
                  <div className="border border-gold/30 bg-gold/5 rounded-lg p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input placeholder="Full Name" value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="input-field py-2 text-sm" />
                      <input placeholder="Phone" value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="input-field py-2 text-sm" />
                    </div>
                    <input placeholder="Address Line 1" value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      className="input-field py-2 text-sm" />
                    <input placeholder="Address Line 2 (optional)" value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      className="input-field py-2 text-sm" />
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input placeholder="City" value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="input-field py-2 text-sm" />
                      <input placeholder="State" value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="input-field py-2 text-sm" />
                      <input placeholder="Pincode" value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="input-field py-2 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddAddress} className="bg-navy text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-mid">
                        Save Address
                      </button>
                      {addresses.length > 0 && (
                        <button onClick={() => setShowNewAddress(false)} className="text-gray-500 text-sm px-4 py-2 hover:underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl p-6 border border-navy/[0.07]">
              <h3 className="font-serif text-navy font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-gold" /> Payment Method
              </h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all
                  ${paymentMethod === 'RAZORPAY' ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gold/40'}`}>
                  <input type="radio" checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')} className="accent-gold" />
                  <div>
                    <div className="font-semibold text-navy text-sm">Pay Online</div>
                    <div className="text-gray-400 text-xs">Cards, UPI, Netbanking via Razorpay</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all
                  ${total > 2000 ? 'opacity-40 cursor-not-allowed' : ''}
                  ${paymentMethod === 'COD' ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gold/40'}`}>
                  <input type="radio" checked={paymentMethod === 'COD'} disabled={total > 2000}
                    onChange={() => setPaymentMethod('COD')} className="accent-gold" />
                  <div>
                    <div className="font-semibold text-navy text-sm">Cash on Delivery</div>
                    <div className="text-gray-400 text-xs">
                      {total > 2000 ? 'Not available for orders above ₹2000' : 'Pay when your order arrives'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl p-6 border border-navy/[0.07] h-fit sticky top-24">
            <h3 className="font-serif text-navy text-lg font-semibold mb-5">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-2">{item.productName} ({item.variantLabel}) × {item.quantity}</span>
                  <span className="text-navy font-medium flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={subtotal >= 499 ? 'text-green-600' : ''}>{subtotal >= 499 ? 'FREE' : '₹50'}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-₹{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-navy text-base">
                <span>Total</span><span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            <button onClick={handlePlaceOrder} disabled={placing}
              className="btn-primary w-full justify-center mt-6 flex items-center gap-2">
              <Truck size={16} />
              {placing ? 'Placing Order...' : `Place Order · ₹${total.toFixed(0)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
