'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
  Crown, LayoutDashboard, Package, ShoppingBag, Users, Tag,
  Image, Star, BarChart3, LogOut, ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/wholesale', label: 'Wholesale', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  return (
    <div className="pt-[70px] min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-deep min-h-screen flex flex-col fixed top-[70px] left-0 z-40 border-r border-gold/10">
        <div className="p-5 border-b border-gold/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center flex-shrink-0">
              <Crown size={15} className="text-navy-deep" />
            </div>
            <div>
              <div className="text-cream text-sm font-semibold">Admin Panel</div>
              <div className="text-cream/40 text-xs truncate max-w-[140px]">{user?.name}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group
                  ${active
                    ? 'bg-gold/15 text-gold font-medium'
                    : 'text-cream/60 hover:bg-white/5 hover:text-cream'
                  }`}
              >
                <Icon size={16} className={active ? 'text-gold' : 'text-cream/40 group-hover:text-cream/70'} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} className="text-gold/60" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gold/10">
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/70 text-sm
                       hover:bg-red-400/10 hover:text-red-400 transition-all w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="ml-64 flex-1 min-h-screen">
        {children}
      </div>
    </div>
  )
}
