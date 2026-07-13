import { MapPin, Phone, Clock } from 'lucide-react'

const BRANCHES = [
  {
    name: 'Subhadra Mall, Baramati',
    address: 'Subhadra Mall, Baramati, Dist. Pune, Maharashtra',
    location: 'Near # Reliance SMART Superstore',
    phone: '9096999914',
    timing: 'Mon–Sun: 10:00 AM – 9:00 PM',
    mapUrl: 'https://www.google.com/maps/search/Subhadra+Mall+Baramati+Near+Reliance+SMART+Superstore',
  },
  {
    name: 'Shriram Bazar, Phaltan',
    address: 'Shriram Bazar, Phaltan, Maharashtra',
    phone: '9370118012',
    timing: 'Mon–Sun: 10:00 AM – 9:00 PM',
  },
  {
    name: 'Warna Bazar, Warnanager',
    address: 'Warna Bazar, Warnanager, Kolhapur, Maharashtra',
    phone: '9096999914',
    timing: 'Mon–Sun: 10:00 AM – 9:00 PM',
  },
  {
    name: 'Warna Bazar, Peth Vadgaon',
    address: 'Warna Bazar, Peth Vadgaon, Kolhapur, Maharashtra',
    phone: '9096999914',
    timing: 'Mon–Sun: 10:00 AM – 9:00 PM',
  },
]

export default function BranchesPage() {
  return (
    <div className="pt-[70px] min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-royal py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="section-label">Find Us</div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-cream">Our Branches</h1>
        <p className="text-cream/60 mt-3 max-w-lg mx-auto">
          Visit any of our four branches across Maharashtra for the freshest experience.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {BRANCHES.map((branch) => (
            <div key={branch.name} className="bg-white rounded-xl p-6 border border-navy/[0.07]
                                              hover:border-gold/30 hover:shadow-lg transition-all">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-navy font-semibold text-lg mb-1">{branch.name}</h3>
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 text-sm mb-1 hover:text-gold transition-colors underline cursor-pointer block"
                  >
                    {branch.address}
                  </a>
                  {branch.location && (
                    <p className="text-gold-light/70 text-sm font-medium mb-3">{branch.location}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {branch.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {branch.timing}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Head Office */}
        <div className="bg-navy-deep rounded-2xl p-8 text-center border border-gold/15">
          <div className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Head Office</div>
          <h3 className="font-serif text-cream text-xl font-bold mb-2">Vithoba Ventures Group</h3>
          <p className="text-cream/60 mb-4">
            M. No. 3159, Malegaon Bk, Taluka Baramati, District Pune, Maharashtra – 413115
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="tel:9096999914" className="text-gold-light hover:text-gold transition-colors flex items-center gap-1.5">
              <Phone size={14} /> 9096999914
            </a>
            <a href="tel:9370118012" className="text-gold-light hover:text-gold transition-colors flex items-center gap-1.5">
              <Phone size={14} /> 9370118012
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
