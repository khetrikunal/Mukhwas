'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Star, Leaf, ChevronLeft, ChevronRight, Package, Truck, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { productApi, reviewApi } from '@/lib/api'
import { DUMMY_PRODUCTS } from '@/lib/dummyData'
import { Product, ProductVariant } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'benefits'>('desc')
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((s) => s.addItem)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          productApi.getBySlug(slug),
          reviewApi.getByProduct(slug).catch(() => ({ data: { data: [] } })),
        ])
        const prod = prodRes.data.data
        setProduct(prod)
        if (prod.variants?.length) setSelectedVariant(prod.variants[0])
        setReviews(revRes.data.data || [])
      } catch (err) {
        console.error('Failed fetching product from API, checking local mocks:', err)
        const localProd = DUMMY_PRODUCTS.find((p) => p.slug === slug)
        if (localProd) {
          setProduct(localProd)
          if (localProd.variants?.length) setSelectedVariant(localProd.variants[0])
        } else {
          toast.error('Product not found')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [slug])

  const retailPrice = selectedVariant?.retailPrice || 0
  const wholesalePrice = selectedVariant?.wholesalePrice || 0

  const price = selectedVariant
    ? (user?.role === 'WHOLESALE' && wholesalePrice
        ? wholesalePrice
        : retailPrice)
    : 0

  const inStock = selectedVariant && selectedVariant.stockQuantity > 0

  const handleAddToCart = () => {
    if (!selectedVariant || !product || !inStock) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: selectedVariant.label,
      imageUrl: product.images?.find((i) => i.isPrimary)?.imageUrl,
      price,
      quantity,
    })
    toast.success(`${product.name} added to cart!`)
  }

  if (loading) {
    return (
      <div className="pt-[70px] min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="h-96 bg-cream-dark rounded-2xl animate-pulse" />
            <div className="flex gap-3">{[...Array(4)].map((_, i) => <div key={i} className="w-20 h-20 rounded-xl bg-cream-dark animate-pulse" />)}</div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-cream-dark rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!product) return (
    <div className="pt-[70px] min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-serif text-2xl text-navy">Product not found</h2>
      </div>
    </div>
  )

  const images = product.images?.length
    ? product.images
    : [{ id: 'placeholder', imageUrl: '', isPrimary: true, sortOrder: 0 }]

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gold transition-colors">Products</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-gold transition-colors">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-navy font-medium">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ──────── LEFT: Image Gallery ──────── */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-cream to-cream-dark
                            border border-navy/[0.06] shadow-lg shadow-navy/5">
              {images[activeImage]?.imageUrl ? (
                <Image
                  src={images[activeImage].imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500"
                  priority
                />
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop"
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              )}

              {/* Featured badge */}
              {product.isFeatured && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-gold to-gold-light
                                text-navy-deep text-xs font-bold px-4 py-1.5 rounded-full
                                shadow-lg shadow-gold/30">
                  ★ Best Seller
                </div>
              )}

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                               bg-white/90 backdrop-blur-sm flex items-center justify-center
                               text-navy hover:bg-white shadow-lg transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                               bg-white/90 backdrop-blur-sm flex items-center justify-center
                               text-navy hover:bg-white shadow-lg transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-navy/70 backdrop-blur-sm text-cream
                                text-xs font-medium px-3 py-1 rounded-full">
                  {activeImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2
                                transition-all duration-300 hover:scale-105
                      ${activeImage === i
                        ? 'border-gold shadow-lg shadow-gold/25 ring-2 ring-gold/20'
                        : 'border-transparent hover:border-gold/30 opacity-70 hover:opacity-100'}`}
                  >
                    {img.imageUrl
                      ? <Image src={img.imageUrl} alt="" width={80} height={80} className="object-cover w-full h-full" />
                      : <Image
                          src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=150&auto=format&fit=crop"
                          alt=""
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                    }
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ──────── RIGHT: Product Info ──────── */}
          <div className="flex flex-col">
            {/* Category */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-gold font-bold uppercase tracking-[0.16em]
                              bg-gold/8 px-3 py-1 rounded-full border border-gold/15">
                {product.category?.name}
              </span>
              {inStock ? (
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider
                                bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ✓ In Stock
                </span>
              ) : (
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider
                                bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="font-serif text-3xl md:text-4xl font-black text-navy mb-1 leading-tight">
              {product.name}
            </h1>
            {product.nameMarathi && (
              <p className="text-navy/40 text-lg font-display italic mb-4">{product.nameMarathi}</p>
            )}

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-5">
                <div className="flex text-gold text-sm">{'★'.repeat(5)}</div>
                <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
              </div>
            )}

            {/* ── Pricing Card ── */}
            <div className="bg-gradient-to-br from-cream-dark to-cream rounded-2xl p-6 mb-6
                            border border-navy/[0.06] shadow-inner">
              {/* MRP */}
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-black text-navy tracking-tight">
                  ₹{retailPrice?.toFixed(0)}
                </span>
                <span className="text-gray-400 text-sm font-medium">
                  / {selectedVariant?.label || '100 gm'}
                </span>
              </div>

              {user?.role === 'WHOLESALE' && wholesalePrice ? (
                <div className="mt-2 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200 inline-flex items-center gap-2">
                  <span className="text-emerald-600 text-xs font-bold">✓ Wholesale Price Applied:</span>
                  <span className="text-emerald-700 font-black text-lg">₹{wholesalePrice.toFixed(0)}</span>
                </div>
              ) : wholesalePrice ? (
                <div className="mt-3 bg-white rounded-xl px-4 py-3 border border-navy/[0.06]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-xs font-medium">Wholesale Price:</span>
                      <span className="text-emerald-600 font-bold text-xl ml-2">₹{wholesalePrice.toFixed(0)}</span>
                      <span className="text-gray-400 text-[10px] ml-1">incl. GST</span>
                    </div>
                    <a href="/register/wholesale"
                       className="text-gold text-[10px] font-bold uppercase tracking-wider hover:text-gold-light transition-colors">
                      Register →
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Variant selector */}
            {product.variants?.length > 0 && (
              <div className="mb-6">
                <label className="text-navy text-sm font-bold mb-3 block tracking-wide">Select Weight</label>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.filter(v => v.isActive).map((v) => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300
                        ${selectedVariant?.id === v.id
                          ? 'bg-gradient-to-r from-gold to-gold-light text-navy-deep border-gold shadow-lg shadow-gold/25 scale-105'
                          : 'bg-white border-navy/10 text-navy hover:border-gold hover:text-gold hover:shadow-md'}`}>
                      {v.label}
                      <span className="block text-[10px] font-normal mt-0.5 opacity-70">
                        ₹{v.retailPrice?.toFixed(0)}
                      </span>
                      {v.stockQuantity === 0 && <span className="ml-1 text-red-400 text-[10px]">(OOS)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-navy text-sm font-bold mb-3 block tracking-wide">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-xl border border-navy/10 overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-cream-dark transition-colors">
                    <Minus size={16} className="text-navy" />
                  </button>
                  <span className="w-14 text-center font-bold text-xl text-navy select-none">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-cream-dark transition-colors">
                    <Plus size={16} className="text-navy" />
                  </button>
                </div>
                {selectedVariant && (
                  <span className="text-gray-400 text-xs">
                    {selectedVariant.stockQuantity} available
                  </span>
                )}
              </div>
            </div>

            {/* Total */}
            {price > 0 && quantity > 1 && (
              <div className="mb-4 bg-gold/5 rounded-xl px-4 py-2 border border-gold/15 inline-flex items-center gap-2">
                <span className="text-navy text-sm font-medium">Total:</span>
                <span className="text-gold font-black text-xl">₹{(price * quantity).toFixed(0)}</span>
              </div>
            )}

            {/* Add to Cart Button */}
            <button onClick={handleAddToCart}
              disabled={!selectedVariant || !inStock}
              className="btn-primary w-full justify-center flex items-center gap-3 mb-3
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-base py-4 rounded-xl shadow-xl shadow-gold/25
                         hover:shadow-2xl hover:shadow-gold/35 transition-all">
              <ShoppingCart size={18} />
              {!inStock ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {/* WhatsApp Order */}
            <a href={`https://wa.me/919096999914?text=Hi! I want to order ${product.name}`}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl
                         border-2 border-[#25D366] text-[#25D366] text-sm font-bold
                         hover:bg-[#25D366] hover:text-white transition-all duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Quick Order on WhatsApp
            </a>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-navy/[0.06]">
              {[
                { icon: <Leaf size={16} />, label: '100% Natural' },
                { icon: <Truck size={16} />, label: 'Free Delivery ₹499+' },
                { icon: <Shield size={16} />, label: 'Secure Checkout' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-9 h-9 rounded-full bg-gold/8 flex items-center justify-center text-gold">
                    {icon}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ──────── Tabs Section ──────── */}
        <div className="mt-16">
          <div className="flex gap-1 border-b border-gray-200 mb-8">
            {(['desc', 'ingredients', 'benefits'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px
                  ${activeTab === tab
                    ? 'border-gold text-gold'
                    : 'border-transparent text-gray-400 hover:text-navy'}`}>
                {tab === 'desc' ? 'Description' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            {activeTab === 'desc' && (
              <div>
                <p>{product.description || 'No description available.'}</p>
                {product.descriptionMarathi && (
                  <p className="mt-4 font-display italic text-gray-500">{product.descriptionMarathi}</p>
                )}
              </div>
            )}
            {activeTab === 'ingredients' && (
              <div>
                <p>{product.ingredients || 'Ingredients information not available.'}</p>
                {product.ingredientsMarathi && (
                  <p className="mt-4 font-display italic text-gray-500">{product.ingredientsMarathi}</p>
                )}
              </div>
            )}
            {activeTab === 'benefits' && (
              <div>
                <p>{product.benefits || 'Benefits information not available.'}</p>
                {product.benefitsMarathi && (
                  <p className="mt-4 font-display italic text-gray-500">{product.benefitsMarathi}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ──────── Reviews ──────── */}
        {reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-navy mb-6">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-6 border border-navy/[0.06]
                                          shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-gold text-sm mb-2">{'★'.repeat(r.rating)}</div>
                  <p className="text-gray-600 text-sm italic leading-relaxed mb-4">&ldquo;{r.comment}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy-mid
                                    flex items-center justify-center text-gold-light text-xs font-bold">
                      {r.user?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-navy text-sm font-semibold">{r.user?.name || 'Customer'}</div>
                      <div className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
