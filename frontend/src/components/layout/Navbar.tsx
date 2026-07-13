'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const itemCount = useCartStore((s) => s.itemCount)
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/products?category=paan-varieties', label: 'Paan' },
    { href: '/register/wholesale', label: 'Wholesale' },
    { href: '/branches', label: 'Branches' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-navy/98 shadow-xl shadow-navy-deep/30'
        : 'bg-navy/95'
      } backdrop-blur-md border-b border-gold/20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-auto py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-light
                            flex items-center justify-center shadow-lg shadow-gold/40
                            group-hover:shadow-gold/60 transition-all overflow-hidden flex-shrink-0">
              <Image
                src="/Logo.png"
                alt="The Royal Mukhwas"
                fill
                sizes="96px"
                className="object-contain p-2"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="font-serif text-2xl font-bold text-cream tracking-wide leading-tight">
                The Royal Mukhwas
              </div>
              <div className="text-xs text-gold-light tracking-[0.14em] uppercase">
                Khane Ki Happy Ending
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                    className="text-cream/80 hover:text-gold-light text-[13px] font-medium
                               tracking-wide transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button onClick={() => setSearchOpen(!searchOpen)}
                    className="text-cream/70 hover:text-gold-light transition-colors p-1.5">
              <Search size={18} />
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative text-cream/70 hover:text-gold-light transition-colors p-1.5">
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-navy-deep
                                 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 border border-gold/40 rounded-full
                                   px-3 py-1.5 text-gold-light text-xs font-medium hover:bg-gold/10 transition-all">
                  <User size={14} />
                  <span className="hidden sm:block max-w-[80px] truncate">{user?.name}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-navy-deep border border-gold/20
                                rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100
                                group-hover:visible transition-all z-50">
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin/dashboard"
                          className="block px-4 py-2 text-gold-light text-xs hover:bg-white/5 transition-colors">
                      Admin Panel
                    </Link>
                  )}
                  <Link href="/account" className="block px-4 py-2 text-cream/80 text-xs hover:bg-white/5 transition-colors">
                    My Account
                  </Link>
                  <Link href="/account/orders" className="block px-4 py-2 text-cream/80 text-xs hover:bg-white/5 transition-colors">
                    My Orders
                  </Link>
                  <hr className="border-gold/10 my-1" />
                  <button onClick={() => { logout(); router.push('/') }}
                          className="w-full text-left px-4 py-2 text-red-400 text-xs hover:bg-white/5 transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"
                      className="text-cream/80 text-xs font-medium hover:text-gold-light transition-colors hidden sm:block">
                  Login
                </Link>
                <Link href="/register"
                      className="bg-gradient-to-r from-gold to-gold-light text-navy-deep
                                 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide
                                 hover:opacity-90 transition-all">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="lg:hidden text-cream/70 hover:text-gold-light transition-colors ml-1"
                    onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        {searchOpen && (
          <div className="pb-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mukhwas, amla, paan..."
                className="w-full bg-white/10 border border-gold/30 rounded-lg px-4 py-2.5
                           text-cream placeholder:text-cream/40 text-sm focus:outline-none
                           focus:border-gold/60 focus:bg-white/15 transition-all"
                autoFocus
              />
              <button type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gold hover:text-gold-light">
                <Search size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 border-t border-gold/10 pt-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-cream/80 hover:text-gold-light px-2 py-2 text-sm font-medium
                                 rounded-lg hover:bg-white/5 transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
