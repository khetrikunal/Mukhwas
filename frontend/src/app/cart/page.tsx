'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, discount, couponCode,
          applyCoupon, removeCoupon } = useCartStore()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const shipping = subtotal >= 499 ? 0 : 50
  const total = subtotal + shipping - discount

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      // Store method dispatches to the server when synced and resets state;
      // it throws on invalid coupon, surfacing the backend message.
      await applyCoupon(couponInput)
      toast.success('Coupon applied!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="pt-[70px] min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={80} className="mx-auto mb-6 text-navy/20" />
          <h2 className="font-serif text-3xl text-navy mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add some royal treats to get started!</p>
          <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-4xl font-bold text-navy mb-10">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.variantId} className="bg-white rounded-xl p-5 flex gap-4 border border-navy/[0.07]">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg bg-cream-dark flex items-center justify-center flex-shrink-0 text-3xl overflow-hidden">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.productName} width={80} height={80} className="object-cover" />
                  ) : (
                    <Image
                      src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=150&auto=format&fit=crop"
                      alt={item.productName}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-serif text-navy font-semibold truncate">{item.productName}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{item.variantLabel}</div>
                  <div className="text-gold font-bold mt-1">₹{item.price.toFixed(0)}</div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-cream-dark flex items-center justify-center hover:bg-gold/20 transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-cream-dark flex items-center justify-center hover:bg-gold/20 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>

                {/* Total & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(item.variantId)}
                          className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                  <div className="font-bold text-navy">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="text-red-400 text-sm hover:text-red-600 transition-colors">
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-xl p-5 border border-navy/[0.07]">
              <h3 className="font-serif text-navy font-semibold mb-3 flex items-center gap-2">
                <Tag size={16} className="text-gold" /> Apply Coupon
              </h3>
              {couponCode ? (
                <div className="flex items-center justify-between bg-gold/10 border border-gold/30 rounded-lg px-4 py-2.5">
                  <span className="text-gold font-semibold text-sm">{couponCode} applied</span>
                  <button onClick={removeCoupon} className="text-red-400 text-xs hover:underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input-field flex-1 py-2 text-sm"
                  />
                  <button onClick={handleApplyCoupon} disabled={couponLoading}
                          className="bg-navy text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-mid transition-colors disabled:opacity-50">
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-6 border border-navy/[0.07] sticky top-24">
              <h3 className="font-serif text-navy text-lg font-semibold mb-5">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}
                {subtotal < 499 && (
                  <p className="text-xs text-gold bg-gold/10 rounded-lg px-3 py-2">
                    Add ₹{(499 - subtotal).toFixed(0)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-navy text-base">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-primary w-full justify-center mt-5 block text-center">
                Proceed to Checkout
              </Link>
              <Link href="/products" className="block text-center text-gold text-sm mt-3 hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
