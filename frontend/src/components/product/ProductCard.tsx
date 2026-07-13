'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const { user } = useAuthStore()
  const [imageIndex, setImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const primaryVariant = product.variants?.[0]
  const images = product.images?.length ? product.images : []
  const currentImage = images[imageIndex]

  const retailPrice = primaryVariant?.retailPrice
  const wholesalePrice = primaryVariant?.wholesalePrice

  const price = user?.role === 'WHOLESALE' && wholesalePrice
    ? wholesalePrice
    : retailPrice

  const inStock = primaryVariant && primaryVariant.stockQuantity > 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!primaryVariant) {
      toast.error('No variant available')
      return
    }
    if (!inStock) {
      toast.error('Out of stock')
      return
    }
    try {
      await addItem({
        variantId: primaryVariant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: primaryVariant.label,
        imageUrl: images.find((i) => i.isPrimary)?.imageUrl || currentImage?.imageUrl,
        price: price || 0,
        quantity: 1,
      })
      toast.success(`${product.name} added to cart!`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not add to cart')
    }
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div
        className="bg-white rounded-2xl border border-navy/[0.06] overflow-hidden
                    transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl
                    hover:shadow-navy/12 hover:border-gold/25 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-52 sm:h-56 bg-gradient-to-br from-cream to-cream-dark overflow-hidden">
          {/* Featured Badge */}
          {product.isFeatured && (
            <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-gold to-gold-light
                            text-navy-deep text-[9px] font-bold px-2.5 py-1 rounded-full
                            uppercase tracking-widest shadow-md shadow-gold/30">
              ★ Best Seller
            </div>
          )}

          {/* Stock Badge */}
          <div className={`absolute top-3 right-3 z-20 text-[9px] font-bold px-2 py-1 rounded-full
                          uppercase tracking-wider ${
                            inStock
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
                              : 'bg-red-500/15 text-red-500 border border-red-500/25'
                          }`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </div>

          {/* Product Image */}
          {currentImage?.imageUrl ? (
            <Image
              src={currentImage.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=500&auto=format&fit=crop"
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          )}

          {/* Image Navigation Arrows (shown on hover if multiple images) */}
          {images.length > 1 && isHovered && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full
                           bg-white/90 backdrop-blur-sm flex items-center justify-center
                           text-navy hover:bg-white shadow-lg transition-all opacity-0
                           group-hover:opacity-100"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full
                           bg-white/90 backdrop-blur-sm flex items-center justify-center
                           text-navy hover:bg-white shadow-lg transition-all opacity-0
                           group-hover:opacity-100"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {/* Image Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === imageIndex
                      ? 'w-4 h-1.5 bg-gold shadow-md shadow-gold/40'
                      : 'w-1.5 h-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16
                          bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5">
          {/* Category + Weight badges */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[9px] text-gold font-bold uppercase tracking-[0.14em]
                            bg-gold/8 px-2 py-0.5 rounded-full border border-gold/15">
              {product.category?.name}
            </span>
            {primaryVariant && (
              <span className="text-[9px] text-navy/50 font-semibold uppercase tracking-wider
                              bg-navy/[0.04] px-2 py-0.5 rounded-full border border-navy/[0.08]">
                {primaryVariant.label}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-navy font-bold text-base sm:text-[17px] leading-snug mb-1.5
                         group-hover:text-navy-mid transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Pricing Section */}
          <div className="border-t border-navy/[0.06] pt-3 mt-auto">
            {/* MRP Row */}
            <div className="flex items-end justify-between mb-1">
              <div>
                <span className="text-navy font-black text-xl tracking-tight">
                  ₹{retailPrice?.toFixed(0) || '—'}
                </span>
                {primaryVariant && (
                  <div className="text-gray-400 text-[10px] font-medium mt-0.5">
                    {primaryVariant.label}
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`w-10 h-10 rounded-xl flex items-center justify-center
                           transition-all duration-300 shadow-lg
                           ${inStock
                             ? 'bg-gradient-to-br from-gold to-gold-light text-navy-deep shadow-gold/30 hover:shadow-gold/50 hover:scale-110 active:scale-95'
                             : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                           }`}
              >
                <ShoppingCart size={15} />
              </button>
            </div>

            {/* Wholesale Price */}
            {wholesalePrice && (
              <div className="flex items-center gap-1.5 mt-2 bg-emerald-50/80 rounded-lg px-2.5 py-1.5 border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-medium">Wholesale Price:</span>
                <span className="text-emerald-600 font-bold text-sm">₹{wholesalePrice.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
