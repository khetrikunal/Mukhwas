'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/lib/api'
import { User } from '@/types'
import toast from 'react-hot-toast'
import { Search, Users, ShieldCheck, ShieldOff } from 'lucide-react'

const roleColor: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  CUSTOMER: 'bg-blue-100 text-blue-700',
  WHOLESALE: 'bg-indigo-100 text-indigo-700',
}

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return }
    fetchUsers()
  }, [page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({ page, size: 20 })
      const data = res.data.data
      setUsers(data.content || [])
      setTotalPages(data.totalPages || 1)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const toggleStatus = async (u: User) => {
    try {
      await adminApi.updateUserStatus(u.id, !u.isActive)
      toast.success(u.isActive ? 'User deactivated' : 'User activated')
      fetchUsers()
    } catch { toast.error('Update failed') }
  }

  const filtered = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Users</h1>
            <p className="text-gray-500 text-sm mt-1">Manage customer and wholesale accounts</p>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-navy/15 rounded-xl text-sm w-full focus:outline-none focus:border-gold bg-white" />
        </div>

        <div className="bg-white rounded-xl border border-navy/[0.07] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60">
                {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-navy/60 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  No users found
                </td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-navy">{u.name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-xs ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleStatus(u)}
                      title={u.isActive ? 'Deactivate user' : 'Activate user'}
                      className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`}>
                      {u.isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy/15 disabled:opacity-40 hover:border-gold">Prev</button>
            <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy/15 disabled:opacity-40 hover:border-gold">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
