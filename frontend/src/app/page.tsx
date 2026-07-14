import Link from 'next/link'
import Image from 'next/image'
import CloudinarySampleImage from '@/components/CloudinarySampleImage'
import { Crown, Truck, Leaf, Tag, Lock, ArrowRight } from 'lucide-react'

import ProductCard from '@/components/product/ProductCard'
import { productApi } from '@/lib/api'
import { DUMMY_PRODUCTS } from '@/lib/dummyData'
import CompanyName1824 from '@/components/common/CompanyName1824'
import { WHATSAPP_LINK } from '@/lib/branding'


const CATEGORIES = [
  { name: 'Paan', slug: 'paan', emoji: '🍃', count: 2 },
  { name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', emoji: '🌿', count: 6 },
  { name: 'Chatpata Mukhwas', slug: 'chatpata-mukhwas', emoji: '🌶️', count: 1 },
  { name: 'Digestive Mukhwas', slug: 'digestive-mukhwas', emoji: '💊', count: 1 },
  { name: 'Amla Mukhwas', slug: 'amla-mukhwas', emoji: '🍈', count: 3 },
  { name: 'Others', slug: 'others', emoji: '🍬', count: 3 },
]

const TESTIMONIALS = [
  { name: 'Ramesh Shinde', location: 'Pune', rating: 5, text: 'Best mukhwas I\'ve ever had! The Chandan mukhwas is absolutely heavenly. We order in bulk every month for our restaurant.', avatar: 'RS' },
  { name: 'Sunita Patil', location: 'Kolhapur', rating: 5, text: 'The Chatpata Amla is my family\'s favourite. Delivered fresh, packed well, and the taste is exactly like what we get at the branch!', avatar: 'SP' },
  { name: 'Vikas Kulkarni', location: 'Baramati', rating: 5, text: 'Ordered wholesale for our wedding. The Banarasi Paan mukhwas was a huge hit with guests. Premium quality, fair pricing!', avatar: 'VK' },
]

async function getFeaturedProducts() {
  // Home page is static-generated during `next build`.
  // Ensure backend slowness/unavailability never blocks the build.
  const timeoutMs = 5000
  try {
    const res = (await Promise.race([
      productApi.getFeatured(),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Featured fetch timed out')), timeoutMs)
      ),
    ])) as any

    return res.data?.data || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-gradient-royal flex items-center pt-[70px] overflow-hidden">
        <CloudinarySampleImage />
        {/* Background video (muted, autoplay, loop) */}
        <div className="absolute inset-0 w-full h-full">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/Logo.png"
            style={{ opacity: 0.5 }}
            aria-hidden="true"
          >
            <source src="/royalmukhwasvideo.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Overlay tint for readability — rich dark gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,14,28,0.72) 0%, rgba(10,14,28,0.50) 50%, rgba(10,14,28,0.65) 100%)' }} />
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'repeating-linear-gradient(45deg,#c9a84c 0,#c9a84c 1px,transparent 0,transparent 50%)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0"
             style={{ background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            {/* Dual-brand trust badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-white/8 border border-gold/25 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <img
                  src="/Logo.png"
                  alt="The Royal Mukhwas"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-gold/40"
                />
                <span className="text-cream text-[11px] font-semibold tracking-wide">Royal Mukhwas</span>
              </div>
              <span className="text-gold/40 text-xs">×</span>
              <div className="flex items-center gap-2 bg-white/8 border border-gold/25 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <img
                  src="/vittho.jpeg"
                  alt="Vittbo Venture"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-gold/40"
                />
                <span className="text-cream text-[11px] font-semibold tracking-wide">Vittbo Venture</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2.5 bg-gold/10 border border-gold/30 rounded-full
                            px-4 py-2 text-gold-light text-xs tracking-[0.14em] uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
              Premium Mukhwas &amp; Mouth Fresheners
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-black text-cream leading-[1.05] mb-4">
              The <span className="text-gold">Royal</span><br />
              Experience<br />
              <span className="text-4xl md:text-5xl lg:text-6xl">After Every Meal</span>
            </h1>

            <p className="font-display italic text-cream/60 text-xl mb-6">Khane Ki Happy Ending</p>

            <p className="text-cream/70 text-base leading-relaxed mb-10 max-w-md">
              16+ traditional &amp; premium mukhwas, digestives, and mouth fresheners —
              crafted from the finest herbs, spices &amp; ingredients. Trusted by thousands across Maharashtra.
            </p>

            <div className="flex gap-4 flex-wrap">
              <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                Shop Now <ArrowRight size={14} />
              </Link>
              <Link href="/register/wholesale"
                    className="border border-cream/30 text-cream px-8 py-3 rounded text-sm
                               tracking-widest uppercase hover:border-gold-light hover:text-gold-light
                               transition-all font-medium">
                Wholesale Enquiry
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mt-14">
              {[['16+', 'Products'], ['4', 'Branches'], ['6', 'Categories']].map(([num, label]) => (
                <div key={label}>
                  <div className="font-serif text-4xl font-bold text-gold">{num}</div>
                  <div className="text-cream/50 text-xs uppercase tracking-widest mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – floating cards */}
          <div className="hidden lg:flex flex-col gap-4 items-end">
            {[
              { image: '/products/paan/Jaipuri Paan.jpeg', name: 'Jaipuri Paan', cat: 'Paan', price: '₹130', unit: '100 gm', rotate: '-rotate-2' },
              { image: '/products/sweet-mukhwas/Chandan Mukhwas.jpeg', name: 'Chandan Mukhwas', cat: 'Sweet Mukhwas', price: '₹120', unit: '100 gm', rotate: 'rotate-2' },
            ].map((card) => (
              <div key={card.name}
                   className={`${card.rotate} bg-white/6 border border-gold/20 rounded-2xl p-5
                               backdrop-blur-md w-56 hover:border-gold/40 transition-all`}>
                <div className="relative w-12 h-12 rounded-xl overflow-hidden mb-3">
                  <Image src={card.image} alt={card.name} fill className="object-cover" />
                </div>
                <div className="font-serif text-cream font-semibold">{card.name}</div>
                <div className="text-gold-light text-[10px] uppercase tracking-widest mt-1">{card.cat}</div>
                <div className="text-gold font-bold text-lg mt-2">
                  {card.price} <span className="text-cream/40 text-xs font-normal">/ {card.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────────── */}
      <div className="bg-gradient-gold overflow-hidden py-3">
        <div className="flex gap-16 w-max animate-[marquee_28s_linear_infinite]">
          {[...Array(2)].flatMap(() => [
            '🌿 100% Natural', '👑 Premium Quality', '🚚 Pan India Delivery',
            '🏷️ Wholesale Available', '🌿 No Artificial Colors', '✨ Free Shipping Above ₹499'
          ]).map((item, i) => (
            <span key={i} className="text-navy-deep text-xs font-bold tracking-[0.16em] uppercase whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="section-label">Browse by Category</div>
            <h2 className="section-title">What Are You<br />Looking For?</h2>
          </div>
          <Link href="/products" className="btn-ghost">View All Products →</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                  className="group bg-white border border-navy/[0.07] rounded-xl p-5 text-center
                             hover:border-gold/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/8
                             transition-all relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold to-gold-light
                              scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <div className="text-4xl mb-3">{cat.emoji}</div>
              <div className="font-serif text-navy font-semibold text-sm leading-snug">{cat.name}</div>
              <div className="text-gray-400 text-xs mt-1">{cat.count} Products</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ───────────────────────────────────── */}
      <section className="bg-navy-deep py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="section-label">Best Sellers</div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream">Our Royal Selection</h2>
              <p className="text-cream/50 text-sm mt-2 max-w-md">
                Handpicked favourites loved by our customers across Maharashtra and beyond.
              </p>
            </div>
            <Link href="/products" className="text-gold font-semibold text-sm border-b border-gold/40 hover:border-gold pb-0.5 transition-all">
              See All 16+ Products →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featured.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            /* Placeholder cards when no API data */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {DUMMY_PRODUCTS.filter(p => p.isFeatured).slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BRAND STORY ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream-dark">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex items-center justify-center order-2 lg:order-1">
            <div className="relative">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-navy to-navy-mid
                              flex flex-col items-center justify-center gap-2
                              shadow-[0_0_0_20px_rgba(201,168,76,0.07),0_0_0_40px_rgba(201,168,76,0.03)]">
                <Crown size={56} className="text-gold" />
                <span className="font-serif text-gold-light text-sm tracking-[0.18em] uppercase">Est. Baramati</span>
                <span className="text-gold/40 text-[10px] tracking-widest">
                  <CompanyName1824 />
                </span>
              </div>
              <div className="absolute -inset-8 border border-dashed border-gold/20 rounded-full animate-spin"
                   style={{ animationDuration: '40s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                                w-2.5 h-2.5 rounded-full bg-gold" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="section-label">Our Story</div>
            <h2 className="section-title mb-5">Rooted in Tradition,<br />Crafted with Pride</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Royal Mukhwas began as a passion project from the heart of Baramati, Maharashtra —
              under the trusted banner of <CompanyName1824 />. We believe that every meal deserves a perfect,
              flavorful ending.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Our products are crafted using time-honored recipes, finest spices, and zero artificial colors —
              bringing you the authentic taste of India&apos;s mukhwas heritage, now available at your doorstep.
            </p>
            <div className="flex gap-8">
              {[['🌿', 'Natural'], ['✨', 'Premium'], ['🏺', 'Traditional'], ['❤️', 'Trusted']].map(([icon, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-navy text-xs font-semibold">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/about" className="btn-secondary inline-block">Learn More About Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────── */}
      <section className="bg-gradient-royal py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={24} />, title: 'Free Delivery', desc: 'Free shipping on orders above ₹499. Pan-India delivery.' },
            { icon: <Leaf size={24} />, title: '100% Natural', desc: 'No artificial colors, no preservatives. Pure ingredients.' },
            { icon: <Tag size={24} />, title: 'Wholesale Pricing', desc: 'Special bulk pricing for registered wholesale buyers.' },
            { icon: <Lock size={24} />, title: 'Secure Payments', desc: 'Razorpay-powered checkout. COD available under ₹2000.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center
                              text-gold mx-auto mb-4">
                {icon}
              </div>
              <div className="font-serif text-cream font-semibold mb-2">{title}</div>
              <div className="text-cream/50 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-label">Customer Love</div>
            <h2 className="section-title">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 border border-navy/[0.07]">
                <div className="text-gold text-base mb-3">{'★'.repeat(t.rating)}</div>
                <p className="text-gray-600 text-sm leading-relaxed italic mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-mid flex items-center justify-center text-gold-light text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-navy text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.location}, Maharashtra</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-gold py-20 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-black text-navy-deep mb-4">
          Ready to Place an Order?
        </h2>
        <p className="text-navy-deep/60 text-lg mb-10">
          Shop online or reach us on WhatsApp for quick orders &amp; wholesale enquiries.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/products"
                className="bg-navy-deep text-gold-light px-10 py-4 rounded font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-all">
            🛒 Shop Now
          </Link>
          <a
            href={`${WHATSAPP_LINK}?text=Hi! I'd like to order from The Royal Mukhwas`}
            target="_blank"
            rel="noreferrer"
            className="bg-[#25D366] text-white px-10 py-4 rounded font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-all inline-flex items-center gap-2">
            WhatsApp Order
          </a>
        </div>
      </section>
    </>
  )
}
