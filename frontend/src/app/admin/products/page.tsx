'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { productApi, categoryApi } from '@/lib/api'
import { Product, ProductVariant, Category } from '@/types'
import toast from 'react-hot-toast'
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff, Star, StarOff,
  X, ChevronDown, ChevronUp, Package, Layers
} from 'lucide-react'

const emptyProduct = {
  name: '', nameMarathi: '', categoryId: '', description: '',
  descriptionMarathi: '', ingredients: '', benefits: '',
  metaTitle: '', isFeatured: false, isActive: true,
}
const emptyVariant = {
  weightGrams: '', label: '', retailPrice: '', wholesalePrice: '',
  moq: 1, stockQuantity: 0, sku: '',
}

export default function AdminProductsPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ ...emptyProduct })
  const [saving, setSaving] = useState(false)

  // Variant management
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [variantForm, setVariantForm] = useState({ ...emptyVariant })
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null)
  const [variantProductId, setVariantProductId] = useState<string | null>(null)
  const [savingVariant, setSavingVariant] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchCategories()
  }, [])

  useEffect(() => { fetchProducts() }, [page, search])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productApi.adminGetAll({ page, size: 15, search: search || undefined })
      const data = res.data.data
      setProducts(data.content || [])
      setTotalPages(data.totalPages || 1)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [page, search])

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll()
      setCategories(res.data.data || [])
    } catch {}
  }

  // ── Product CRUD ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditProduct(null)
    setForm({ ...emptyProduct })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name, nameMarathi: p.nameMarathi || '',
      categoryId: p.category?.id || '',
      description: p.description || '', descriptionMarathi: p.descriptionMarathi || '',
      ingredients: p.ingredients || '', benefits: p.benefits || '',
      metaTitle: p.metaTitle || '', isFeatured: p.isFeatured, isActive: p.isActive,
    } as any)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) {
      toast.error('Name and category are required')
      return
    }
    setSaving(true)
    try {
      if (editProduct) {
        await productApi.update(editProduct.id, form)
        toast.success('Product updated!')
      } else {
        await productApi.create(form)
        toast.success('Product created!')
      }
      setShowModal(false)
      fetchProducts()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return
    try {
      await productApi.delete(id)
      toast.success('Product deactivated')
      fetchProducts()
    } catch { toast.error('Delete failed') }
  }

  const toggleFeatured = async (p: Product) => {
    try {
      await productApi.update(p.id, { isFeatured: !p.isFeatured })
      toast.success(p.isFeatured ? 'Removed from featured' : 'Marked as featured')
      fetchProducts()
    } catch { toast.error('Update failed') }
  }

  const toggleActive = async (p: Product) => {
    try {
      await productApi.update(p.id, { isActive: !p.isActive })
      toast.success(p.isActive ? 'Product deactivated' : 'Product activated')
      fetchProducts()
    } catch { toast.error('Update failed') }
  }

  // ── Variant CRUD ──────────────────────────────────────────────────────────

  const openAddVariant = (productId: string) => {
    setVariantProductId(productId)
    setEditVariant(null)
    setVariantForm({ ...emptyVariant })
    setShowVariantModal(true)
  }

  const openEditVariant = (productId: string, v: ProductVariant) => {
    setVariantProductId(productId)
    setEditVariant(v)
    setVariantForm({
      weightGrams: String(v.weightGrams), label: v.label,
      retailPrice: String(v.retailPrice), wholesalePrice: String(v.wholesalePrice || ''),
      moq: v.moq, stockQuantity: v.stockQuantity, sku: v.sku,
    })
    setShowVariantModal(true)
  }

  const handleSaveVariant = async () => {
    if (!variantForm.weightGrams || !variantForm.retailPrice) {
      toast.error('Weight and retail price are required')
      return
    }
    setSavingVariant(true)
    const payload = {
      weightGrams: Number(variantForm.weightGrams),
      label: variantForm.label,
      retailPrice: Number(variantForm.retailPrice),
      wholesalePrice: variantForm.wholesalePrice ? Number(variantForm.wholesalePrice) : null,
      moq: Number(variantForm.moq),
      stockQuantity: Number(variantForm.stockQuantity),
      sku: variantForm.sku,
    }
    try {
      if (editVariant) {
        await productApi.updateVariant(editVariant.id, payload)
        toast.success('Variant updated!')
      } else {
        await productApi.addVariant(variantProductId!, payload)
        toast.success('Variant added!')
      }
      setShowVariantModal(false)
      fetchProducts()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSavingVariant(false) }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Remove this variant?')) return
    try {
      await productApi.deleteVariant(variantId)
      toast.success('Variant removed')
      fetchProducts()
    } catch { toast.error('Delete failed') }
  }

  const inp = 'w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white'
  const label = 'block text-xs font-medium text-navy/70 mb-1'

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Products</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your product catalogue</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-navy-deep font-semibold px-4 py-2.5 rounded-xl hover:bg-gold-light transition-all text-sm shadow-md">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9 pr-4 py-2 border border-navy/15 rounded-xl text-sm w-full focus:outline-none focus:border-gold bg-white"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-navy/[0.07] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60">
                {['Product', 'Category', 'Variants', 'Status', 'Featured', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 text-gray-300" />
                  No products found
                </td></tr>
              ) : products.map(p => (
                <>
                  <tr key={p.id} className="hover:bg-cream/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-navy text-sm">{p.name}</div>
                      {p.nameMarathi && <div className="text-xs text-gray-400">{p.nameMarathi}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{p.category?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setExpandedProduct(expandedProduct === p.id ? null : p.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Layers size={13} />
                        {p.variants?.length || 0} variants
                        {expandedProduct === p.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive(p)}
                        className={`badge text-xs cursor-pointer ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleFeatured(p)}
                        className={`text-xs flex items-center gap-1 ${p.isFeatured ? 'text-gold' : 'text-gray-300 hover:text-gold/60'}`}>
                        {p.isFeatured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Variants Row */}
                  {expandedProduct === p.id && (
                    <tr key={p.id + '-variants'}>
                      <td colSpan={6} className="bg-gray-50/70 px-6 py-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-semibold text-navy/60 uppercase tracking-wide">Variants</span>
                          <button onClick={() => openAddVariant(p.id)}
                            className="flex items-center gap-1 text-xs text-gold font-medium hover:text-gold-light">
                            <Plus size={13} /> Add Variant
                          </button>
                        </div>
                        {(!p.variants || p.variants.length === 0) ? (
                          <p className="text-xs text-gray-400 italic">No variants yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-navy/50">
                                  <th className="text-left py-1 pr-4 font-medium">Weight</th>
                                  <th className="text-left py-1 pr-4 font-medium">Label</th>
                                  <th className="text-left py-1 pr-4 font-medium">Retail ₹</th>
                                  <th className="text-left py-1 pr-4 font-medium">Wholesale ₹</th>
                                  <th className="text-left py-1 pr-4 font-medium">Stock</th>
                                  <th className="text-left py-1 pr-4 font-medium">SKU</th>
                                  <th className="text-left py-1 font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.variants.map(v => (
                                  <tr key={v.id} className={`border-t border-gray-100 ${!v.isActive ? 'opacity-40' : ''}`}>
                                    <td className="py-1.5 pr-4">{v.weightGrams}g</td>
                                    <td className="py-1.5 pr-4">{v.label}</td>
                                    <td className="py-1.5 pr-4 font-medium">₹{v.retailPrice}</td>
                                    <td className="py-1.5 pr-4 text-purple-600">{v.wholesalePrice ? `₹${v.wholesalePrice}` : '—'}</td>
                                    <td className="py-1.5 pr-4">
                                      <span className={v.stockQuantity === 0 ? 'text-red-500' : 'text-green-600'}>
                                        {v.stockQuantity}
                                      </span>
                                    </td>
                                    <td className="py-1.5 pr-4 text-gray-400">{v.sku || '—'}</td>
                                    <td className="py-1.5">
                                      <div className="flex gap-2">
                                        <button onClick={() => openEditVariant(p.id, v)}
                                          className="text-blue-500 hover:text-blue-700"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDeleteVariant(v.id)}
                                          className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy/15 disabled:opacity-40 hover:border-gold transition-colors">
              Prev
            </button>
            <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy/15 disabled:opacity-40 hover:border-gold transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Product Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">
                {editProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Name *</label>
                  <input className={inp} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={label}>Name (Marathi)</label>
                  <input className={inp} value={form.nameMarathi}
                    onChange={e => setForm(f => ({ ...f, nameMarathi: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={label}>Category *</label>
                <select className={inp} value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">— Select category —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea className={inp} rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Description (Marathi)</label>
                <textarea className={inp} rows={2} value={form.descriptionMarathi}
                  onChange={e => setForm(f => ({ ...f, descriptionMarathi: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Ingredients</label>
                  <textarea className={inp} rows={2} value={form.ingredients}
                    onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} />
                </div>
                <div>
                  <label className={label}>Benefits</label>
                  <textarea className={inp} rows={2} value={form.benefits}
                    onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={label}>Meta Title</label>
                <input className={inp} value={form.metaTitle}
                  onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured as boolean}
                    onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="w-4 h-4 accent-gold" />
                  <span className="text-sm text-navy">Featured</span>
                </label>
                {editProduct && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive as boolean}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-gold" />
                    <span className="text-sm text-navy">Active</span>
                  </label>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-navy transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-gold text-navy-deep font-semibold text-sm rounded-xl hover:bg-gold-light transition-all disabled:opacity-60">
                {saving ? 'Saving…' : editProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Variant Modal ───────────────────────────────────────────────── */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-lg font-bold text-navy">
                {editVariant ? 'Edit Variant' : 'Add Variant'}
              </h2>
              <button onClick={() => setShowVariantModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Weight (grams) *</label>
                  <input type="number" className={inp} value={variantForm.weightGrams}
                    onChange={e => setVariantForm(f => ({ ...f, weightGrams: e.target.value }))} />
                </div>
                <div>
                  <label className={label}>Label (e.g. 100g, Small)</label>
                  <input className={inp} value={variantForm.label}
                    onChange={e => setVariantForm(f => ({ ...f, label: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Retail Price (₹) *</label>
                  <input type="number" className={inp} value={variantForm.retailPrice}
                    onChange={e => setVariantForm(f => ({ ...f, retailPrice: e.target.value }))} />
                </div>
                <div>
                  <label className={label}>Wholesale Price (₹)</label>
                  <input type="number" className={inp} value={variantForm.wholesalePrice}
                    onChange={e => setVariantForm(f => ({ ...f, wholesalePrice: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={label}>Stock Qty</label>
                  <input type="number" className={inp} value={variantForm.stockQuantity}
                    onChange={e => setVariantForm(f => ({ ...f, stockQuantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={label}>MOQ</label>
                  <input type="number" className={inp} value={variantForm.moq}
                    onChange={e => setVariantForm(f => ({ ...f, moq: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={label}>SKU</label>
                  <input className={inp} value={variantForm.sku}
                    onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowVariantModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-navy transition-colors">Cancel</button>
              <button onClick={handleSaveVariant} disabled={savingVariant}
                className="px-5 py-2 bg-gold text-navy-deep font-semibold text-sm rounded-xl hover:bg-gold-light transition-all disabled:opacity-60">
                {savingVariant ? 'Saving…' : editVariant ? 'Update Variant' : 'Add Variant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
