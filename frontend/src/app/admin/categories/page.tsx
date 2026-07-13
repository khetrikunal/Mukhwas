'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { categoryApi } from '@/lib/api'
import { Category } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react'

const emptyForm = { name: '', nameMarathi: '', description: '', imageUrl: '', sortOrder: 0, slug: '' }

export default function AdminCategoriesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await categoryApi.getAll()
      setCategories(res.data.data || [])
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setEditCat(null); setForm({ ...emptyForm }); setShowModal(true) }
  const openEdit = (c: Category) => {
    setEditCat(c)
    setForm({ name: c.name, nameMarathi: c.nameMarathi || '', description: c.description || '',
      imageUrl: c.imageUrl || '', sortOrder: c.sortOrder || 0, slug: c.slug || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editCat) {
        await categoryApi.update(editCat.id, form)
        toast.success('Category updated!')
      } else {
        await categoryApi.create(form)
        toast.success('Category created!')
      }
      setShowModal(false)
      fetchCategories()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try {
      await categoryApi.delete(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch { toast.error('Delete failed') }
  }

  const inp = 'w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white'
  const lbl = 'block text-xs font-medium text-navy/70 mb-1'

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Categories</h1>
            <p className="text-gray-500 text-sm mt-1">Organise your product catalogue</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-navy-deep font-semibold px-4 py-2.5 rounded-xl hover:bg-gold-light transition-all text-sm shadow-md">
            <Plus size={16} /> Add Category
          </button>
        </div>

        <div className="bg-white rounded-xl border border-navy/[0.07] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60">
                {['Category', 'Slug', 'Sort Order', 'Image', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                  <Tag size={32} className="mx-auto mb-2 text-gray-300" />
                  No categories found
                </td></tr>
              ) : categories.map(c => (
                <tr key={c.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-navy">{c.name}</div>
                    {c.nameMarathi && <div className="text-xs text-gray-400">{c.nameMarathi}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{c.slug}</td>
                  <td className="px-5 py-3.5 text-center text-gray-500">{c.sortOrder}</td>
                  <td className="px-5 py-3.5">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                    ) : <span className="text-gray-300 text-xs">No image</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">{editCat ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Name *</label>
                  <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Name (Marathi)</label>
                  <input className={inp} value={form.nameMarathi} onChange={e => setForm(f => ({ ...f, nameMarathi: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={lbl}>Slug (auto-generated if empty)</label>
                <input className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. premium-mukhwas" />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea className={inp} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Image URL</label>
                <input className={inp} value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={lbl}>Sort Order</label>
                <input type="number" className={inp} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-navy">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-gold text-navy-deep font-semibold text-sm rounded-xl hover:bg-gold-light disabled:opacity-60">
                {saving ? 'Saving…' : editCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
