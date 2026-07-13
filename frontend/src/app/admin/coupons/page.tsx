'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/lib/api'
import { Coupon } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react'

const emptyForm = {
  code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '0',
  maxDiscountAmount: '', usageLimit: '', validFrom: '', validUntil: '', isActive: true,
}

export default function AdminCouponsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getCoupons()
      setCoupons(res.data.data || [])
    } catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setEditCoupon(null); setForm({ ...emptyForm }); setShowModal(true) }
  const openEdit = (c: Coupon) => {
    setEditCoupon(c)
    setForm({
      code: c.code, discountType: c.discountType, discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount || 0), maxDiscountAmount: String(c.maxDiscountAmount || ''),
      usageLimit: String(c.usageLimit || ''),
      validFrom: c.validFrom ? c.validFrom.split('T')[0] : '',
      validUntil: c.validUntil ? c.validUntil.split('T')[0] : '',
      isActive: c.isActive,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue) { toast.error('Code and discount value are required'); return }
    setSaving(true)
    const payload = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      validFrom: form.validFrom ? `${form.validFrom}T00:00:00` : null,
      validUntil: form.validUntil ? `${form.validUntil}T23:59:59` : null,
      isActive: form.isActive,
    }
    try {
      if (editCoupon) {
        await adminApi.updateCoupon(editCoupon.id, payload)
        toast.success('Coupon updated!')
      } else {
        await adminApi.createCoupon(payload)
        toast.success('Coupon created!')
      }
      setShowModal(false)
      fetchCoupons()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    try {
      await adminApi.deleteCoupon(id)
      toast.success('Coupon deleted')
      fetchCoupons()
    } catch { toast.error('Delete failed') }
  }

  const inp = 'w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white'
  const lbl = 'block text-xs font-medium text-navy/70 mb-1'

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Coupons</h1>
            <p className="text-gray-500 text-sm mt-1">Create and manage discount coupons</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-navy-deep font-semibold px-4 py-2.5 rounded-xl hover:bg-gold-light transition-all text-sm shadow-md">
            <Plus size={16} /> Add Coupon
          </button>
        </div>

        <div className="bg-white rounded-xl border border-navy/[0.07] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60">
                {['Code', 'Type', 'Discount', 'Min Order', 'Usage', 'Valid Until', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <Tag size={32} className="mx-auto mb-2 text-gray-300" />
                  No coupons yet
                </td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-navy">{c.code}</td>
                  <td className="px-4 py-3.5">
                    <span className={`badge text-xs ${c.discountType === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {c.discountType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-navy">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">₹{c.minOrderAmount || 0}</td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {c.usageLimit ? `${c.usedCount}/${c.usageLimit}` : `${c.usedCount} used`}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    {c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`badge text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14} /></button>
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Coupon Code *</label>
                  <input className={`${inp} uppercase font-mono`} value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE20" />
                </div>
                <div>
                  <label className={lbl}>Discount Type *</label>
                  <select className={inp} value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Discount Value *</label>
                  <input type="number" className={inp} value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'PERCENTAGE' ? '20' : '100'} />
                </div>
                <div>
                  <label className={lbl}>Min Order Amount (₹)</label>
                  <input type="number" className={inp} value={form.minOrderAmount}
                    onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Max Discount (₹) — for % type</label>
                  <input type="number" className={inp} value={form.maxDiscountAmount}
                    onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                    placeholder="Optional" />
                </div>
                <div>
                  <label className={lbl}>Usage Limit</label>
                  <input type="number" className={inp} value={form.usageLimit}
                    onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                    placeholder="Unlimited" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Valid From</label>
                  <input type="date" className={inp} value={form.validFrom}
                    onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Valid Until</label>
                  <input type="date" className={inp} value={form.validUntil}
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive as boolean}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-gold" />
                <span className="text-sm text-navy">Active</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-navy">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-gold text-navy-deep font-semibold text-sm rounded-xl hover:bg-gold-light disabled:opacity-60">
                {saving ? 'Saving…' : editCoupon ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
