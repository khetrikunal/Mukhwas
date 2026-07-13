'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { bannerApi } from '@/lib/api'
import { Banner } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Image, Eye, EyeOff, ExternalLink } from 'lucide-react'

const emptyForm = { title: '', subtitle: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true }

export default function AdminBannersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const res = await bannerApi.adminGetAll()
      setBanners(res.data.data || [])
    } catch { toast.error('Failed to load banners') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setEditBanner(null); setForm({ ...emptyForm }); setShowModal(true) }
  const openEdit = (b: Banner) => {
    setEditBanner(b)
    setForm({ title: b.title || '', subtitle: b.subtitle || '', imageUrl: b.imageUrl,
      linkUrl: b.linkUrl || '', sortOrder: b.sortOrder, isActive: b.isActive })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { toast.error('Image URL is required'); return }
    setSaving(true)
    try {
      if (editBanner) {
        await bannerApi.update(editBanner.id, form)
        toast.success('Banner updated!')
      } else {
        await bannerApi.create(form)
        toast.success('Banner created!')
      }
      setShowModal(false)
      fetchBanners()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    try {
      await bannerApi.delete(id)
      toast.success('Banner deleted')
      fetchBanners()
    } catch { toast.error('Delete failed') }
  }

  const toggleActive = async (b: Banner) => {
    try {
      await bannerApi.update(b.id, { isActive: !b.isActive })
      toast.success(b.isActive ? 'Banner hidden' : 'Banner shown')
      fetchBanners()
    } catch { toast.error('Update failed') }
  }

  const inp = 'w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white'
  const lbl = 'block text-xs font-medium text-navy/70 mb-1'

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Banners</h1>
            <p className="text-gray-500 text-sm mt-1">Manage homepage carousel banners</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-navy-deep font-semibold px-4 py-2.5 rounded-xl hover:bg-gold-light transition-all text-sm shadow-md">
            <Plus size={16} /> Add Banner
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-navy/[0.07] h-28 animate-pulse" />
            ))
          ) : banners.length === 0 ? (
            <div className="bg-white rounded-xl border border-navy/[0.07] py-16 text-center text-gray-400">
              <Image size={32} className="mx-auto mb-2 text-gray-300" />
              No banners yet
            </div>
          ) : banners.map(b => (
            <div key={b.id}
              className={`bg-white rounded-xl border border-navy/[0.07] p-4 flex gap-4 items-center shadow-sm
                ${!b.isActive ? 'opacity-60' : ''}`}>
              {/* Image Preview */}
              <div className="w-36 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Image size={24} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-navy">{b.title || '(No title)'}</span>
                  <span className={`badge text-xs ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isActive ? 'Visible' : 'Hidden'}
                  </span>
                  <span className="text-xs text-gray-400">Sort: {b.sortOrder}</span>
                </div>
                {b.subtitle && <p className="text-sm text-gray-500 truncate">{b.subtitle}</p>}
                {b.linkUrl && (
                  <a href={b.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gold flex items-center gap-1 hover:underline mt-1">
                    <ExternalLink size={11} /> {b.linkUrl}
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(b)}
                  title={b.isActive ? 'Hide banner' : 'Show banner'}
                  className={`p-2 rounded-lg transition-colors ${b.isActive ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-green-50 text-green-500'}`}>
                  {b.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(b)}
                  className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">{editBanner ? 'Edit Banner' : 'Add Banner'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Image URL *</label>
                <input className={inp} value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/..." />
                {form.imageUrl && (
                  <div className="mt-2 h-24 w-full rounded-lg overflow-hidden bg-gray-100">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Title</label>
                  <input className={inp} value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Sort Order</label>
                  <input type="number" className={inp} value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className={lbl}>Subtitle</label>
                <input className={inp} value={form.subtitle}
                  onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Link URL</label>
                <input className={inp} value={form.linkUrl}
                  onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive as boolean}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-gold" />
                <span className="text-sm text-navy">Visible on site</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-navy">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-gold text-navy-deep font-semibold text-sm rounded-xl hover:bg-gold-light disabled:opacity-60">
                {saving ? 'Saving…' : editBanner ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
