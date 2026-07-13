import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Phone, MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK, TEL_LINK } from '@/lib/branding'
import CompanyName1824 from '@/components/common/CompanyName1824'

export default function Footer() {
  return (
    <footer className="bg-navy-deep border-t border-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-4 mb-5 group w-fit">
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src="/vittho.jpeg"
                  alt="Vituraya Ventures Private Limited"
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                  priority
                />
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-cream">
                  <CompanyName1824 />
                </div>
                <div className="text-[10px] text-gold-light tracking-[0.14em] uppercase">Khane Ki Happy Ending</div>
              </div>
            </Link>

            <p className="text-cream/50 text-sm leading-relaxed mb-6">
              Premium mukhwas, mouth fresheners &amp; digestive products crafted with the finest natural
              ingredients. A brand by <CompanyName1824 className="text-gold-light/70" />.
            </p>

            <div className="flex gap-3">
              <a
                href="https://instagram.com/the_royal_mukhwas"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center
                            text-gold-light hover:bg-gold hover:text-navy-deep transition-all"
              >
                <Instagram size={15} />
              </a>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center
                            text-gold-light hover:bg-gold hover:text-navy-deep transition-all"
                aria-label="Order on WhatsApp"
              >
                <MessageCircle size={15} />
              </a>

              <a
                href={TEL_LINK}
                className="w-9 h-9 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center
                            text-gold-light hover:bg-gold hover:text-navy-deep transition-all"
                aria-label="Call us"
              >
                <Phone size={15} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-serif text-cream text-base mb-5">Shop</h4>
            <ul className="space-y-2.5">
              {[
                ['All Products', '/products'],
                ['Paan', '/products?category=paan'],
                ['Sweet Mukhwas', '/products?category=sweet-mukhwas'],
                ['Chatpata Mukhwas', '/products?category=chatpata-mukhwas'],
                ['Digestive Mukhwas', '/products?category=digestive-mukhwas'],
                ['Amla Mukhwas', '/products?category=amla-mukhwas'],
                ['Others', '/products?category=others'],
                ['Wholesale', '/register/wholesale'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-cream/50 text-sm hover:text-gold-light transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-serif text-cream text-base mb-5">Company</h4>
            <ul className="space-y-2.5">
              {[
                ['About Us', '/about'],
                ['Our Branches', '/branches'],
                ['Contact Us', '/contact'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-cream/50 text-sm hover:text-gold-light transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-serif text-cream text-base mb-5">Help</h4>
            <ul className="space-y-2.5">
              {[
                ['Track Order', '/track-order'],
                ['My Account', '/account'],
                ['Returns &amp; Refunds', '/contact'],
                ['Shipping Policy', '/contact'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-cream/50 text-sm hover:text-gold-light transition-colors"
                        dangerouslySetInnerHTML={{ __html: label }} />
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-gold/10">
              <p className="text-cream/40 text-xs mb-1">Call us at</p>
              <a
                href={TEL_LINK}
                className="text-gold-light text-sm font-medium hover:text-gold transition-colors"
              >
                +91 9156996309
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gold/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-cream/30 text-xs">
            © {new Date().getFullYear()} <CompanyName1824 />. All rights reserved.
          </p>
          <p className="text-cream/30 text-xs">
            A brand by <span className="text-gold-light/70"><CompanyName1824 /></span>
          </p>
        </div>
      </div>
    </footer>
  )
}
