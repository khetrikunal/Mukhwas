import Image from 'next/image'
import CompanyName1824 from '@/components/common/CompanyName1824'

export default function AboutPage() {
  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      <div className="bg-gradient-royal py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="section-label">Our Story</div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-cream">About The Royal Mukhwas</h1>
        <p className="font-display italic text-cream/60 text-xl mt-3">Khane Ki Happy Ending</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-center mb-10">
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-navy to-navy-mid
                          shadow-[0_0_0_10px_rgba(201,168,76,0.08)] overflow-hidden flex items-center justify-center">
            <Image
              src="/vittho.jpeg"
              alt="1824 Vituraya Ventures Private Limited"
              width={112}
              height={112}
              className="object-contain p-2"
              priority
            />
          </div>
        </div>

        <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6">
          <p>
            <strong className="text-navy">The Royal Mukhwas</strong> began as a passion project from the heart of
            Baramati, Maharashtra â€” under the trusted banner of <strong className="text-navy"><CompanyName1824 /></strong>.
            We believe that every meal deserves a perfect, flavorful ending.
          </p>
          <p>
            Our journey started with a simple mission: to bring the authentic, time-honored taste of traditional
            mukhwas, paan, and digestive products to every household â€” crafted with the finest herbs, spices, and
            natural ingredients, with zero artificial colors.
          </p>
          <p>
            Today, we offer over 42 carefully curated products across 9 categories â€” from classic Paan Varieties and
            aromatic Mukhwas to tangy Amla Products, refreshing Keri delicacies, soothing Digestive Golis, and rare
            Herbal &amp; Medicinal blends.
          </p>
          <p>
            With four branches across Baramati, Phaltan, and Kolhapur, and a growing online presence, we&apos;re proud to
            serve both retail customers and wholesale partners across Maharashtra and beyond.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[['ðŸŒ¿', 'Natural', '100% pure ingredients'], ['âœ¨', 'Premium', 'Finest quality always'],
            ['ðŸº', 'Traditional', 'Time-honored recipes'], ['â¤ï¸', 'Trusted', 'Thousands of happy customers']]
            .map(([icon, title, desc]) => (
              <div key={title} className="text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-serif text-navy font-semibold text-sm">{title}</div>
                <div className="text-gray-400 text-xs mt-1">{desc}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
