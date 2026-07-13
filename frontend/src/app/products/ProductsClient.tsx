'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/product/ProductCard'
import { productApi } from '@/lib/api'
import { DUMMY_PRODUCTS } from '@/lib/dummyData'
import { Product } from '@/types'

const CATEGORIES = [
  { name: 'All', slug: '' },
  { name: 'Paan', slug: 'paan' },
  { name: 'Sweet Mukhwas', slug: 'sweet-mukhwas' },
  { name: 'Chatpata Mukhwas', slug: 'chatpata-mukhwas' },
  { name: 'Digestive Mukhwas', slug: 'digestive-mukhwas' },
  { name: 'Amla Mukhwas', slug: 'amla-mukhwas' },
  { name: 'Others', slug: 'others' },
]

export default function ProductsClient() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params: any = { page, size: 12 }
      if (selectedCategory) params.category = selectedCategory
      if (search) params.search = search
      const res = await productApi.getAll(params)
      const dataContent = res.data.data?.content || []
      if (dataContent.length > 0) {
        setProducts(dataContent)
        setTotalPages(res.data.data?.totalPages || 0)
      } else {
        // Fallback to locally filtered dummy products
        let filtered = DUMMY_PRODUCTS
        if (selectedCategory) {
          filtered = filtered.filter(p => p.category?.slug === selectedCategory)
        }
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
        }
        setProducts(filtered)
        setTotalPages(Math.ceil(filtered.length / 12))
      }
    } catch (e) {
      console.error('API failed, falling back to local mocks:', e)
      // Fallback to locally filtered dummy products on failure
      let filtered = DUMMY_PRODUCTS
      if (selectedCategory) {
        filtered = filtered.filter(p => p.category?.slug === selectedCategory)
      }
      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      }
      setProducts(filtered)
      setTotalPages(Math.ceil(filtered.length / 12))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchProducts()
  }

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-royal py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="section-label text-center">Our Collection</div>
          <h1 className="font-serif text-4xl font-bold text-cream text-center mb-6">All Products</h1>
          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white/10 border border-gold/30 rounded-lg px-5 py-3
                         text-cream placeholder:text-cream/40 text-sm focus:outline-none focus:border-gold/60"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gold">
              {/* keep lucide import in original file by not rendering here */}
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setSelectedCategory(cat.slug)
                setPage(0)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all
                ${
                  selectedCategory === cat.slug
                    ? 'bg-gold text-navy-deep shadow-md shadow-gold/30'
                    : 'bg-white border border-navy/15 text-navy hover:border-gold hover:text-gold'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all
                      ${page === i ? 'bg-gold text-navy-deep' : 'bg-white border border-navy/15 text-navy hover:border-gold'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <div className="font-serif text-xl text-navy mb-2">No products found</div>
            <p className="text-sm">Try a different category or search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
