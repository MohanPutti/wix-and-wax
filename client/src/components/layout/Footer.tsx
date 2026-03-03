const WHATSAPP_URL = 'https://wa.me/916361019528'

export default function Footer() {
  return (
    <footer className="bg-warm-900 text-warm-100">
      {/* Create Something Uniquely Yours */}
      <div className="border-b border-warm-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="mb-5 flex items-center gap-0">
                <img
                  src="/logo-monogram.png"
                  alt=""
                  className="w-14 h-14 object-contain"
                  style={{ filter: 'brightness(0) invert(1) saturate(0) opacity(0.9)' }}
                />
                <span className="font-serif font-semibold text-cream-100" style={{ fontSize: '1.35rem', letterSpacing: '-0.01em' }}>
                  Wicks &amp; Wax
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream-100 mb-4">
                Create Something Uniquely Yours
              </h2>
              <p className="text-warm-300 mb-6">
                Custom fragrances, personalized labels, bulk packaging — we bring your vision to life.
                Perfect for weddings, corporate events, and special gifting.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Personalize Now
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-warm-600 hover:border-amber-400 text-warm-300 hover:text-amber-400 text-sm font-semibold rounded-lg transition-colors"
                >
                  Bulk Orders
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-warm-600 hover:border-amber-400 text-warm-300 hover:text-amber-400 text-sm font-semibold rounded-lg transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '✍️', label: 'Custom Names & Messages' },
                { icon: '🌺', label: 'Choose Your Fragrance' },
                { icon: '🎀', label: 'Custom Packaging' },
                { icon: '📦', label: 'Bulk & Event Orders' },
              ].map((feat) => (
                <div key={feat.label} className="bg-warm-800 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">{feat.icon}</span>
                  <p className="text-sm font-medium text-warm-200">{feat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-3">
        <span className="font-serif font-semibold text-warm-600" style={{ fontSize: '1.1rem' }}>Wicks &amp; Wax</span>
        <p className="text-warm-500 text-sm text-center">
          &copy; {new Date().getFullYear()} Wicks &amp; Wax. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
