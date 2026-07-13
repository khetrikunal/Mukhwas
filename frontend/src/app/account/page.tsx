'use client'
import Link from 'next/link'
import { Package, MapPin, User as UserIcon, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function AccountPage() {
  const { user } = useAuthStore()

  const links = [
    { href: '/account/orders', label: 'My Orders', desc: 'Track and view your order history', icon: <Package size={20} /> },
    { href: '/account/addresses', label: 'My Addresses', desc: 'Manage delivery addresses', icon: <MapPin size={20} /> },
    { href: '/account/profile', label: 'Edit Profile', desc: 'Update your personal details', icon: <UserIcon size={20} /> },
  ]

  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-royal rounded-2xl p-8 mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-3 text-navy-deep font-bold text-xl">
            {user?.name?.[0] || 'U'}
          </div>
          <h1 className="font-serif text-2xl font-bold text-cream">{user?.name}</h1>
          <p className="text-cream/60 text-sm">{user?.email}</p>
          {user?.role === 'WHOLESALE' && (
            <span className="inline-block mt-2 bg-gold/20 text-gold-light text-xs px-3 py-1 rounded-full">Wholesale Account</span>
          )}
        </div>

        <div className="space-y-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              className="flex items-center justify-between bg-white rounded-xl p-5 border border-navy/[0.07] hover:border-gold/30 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-gold/10 text-gold flex items-center justify-center">{link.icon}</div>
                <div>
                  <div className="font-semibold text-navy">{link.label}</div>
                  <div className="text-gray-400 text-xs">{link.desc}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
