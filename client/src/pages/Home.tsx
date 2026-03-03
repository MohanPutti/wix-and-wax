import { Link } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useProducts'
import ProductCard from '../components/products/ProductCard'
import Carousel from '../components/ui/Carousel'
import Spinner from '../components/ui/Spinner'
import { THEME } from '../config'

// Visual display config per slug — new categories get defaults
const CATEGORY_DISPLAY: Record<string, { icon: string; gradient: string }> = {
  'jar-candles':         { icon: '🕯️', gradient: 'from-amber-100 to-amber-300' },
  'scented-sachets':     { icon: '🌸', gradient: 'from-warm-100 to-warm-300' },
  'tealights':           { icon: '✨', gradient: 'from-amber-50 to-amber-200' },
  'gift-boxes':          { icon: '🎁', gradient: 'from-warm-200 to-amber-300' },
  'custom-name-candles': { icon: '✍️', gradient: 'from-amber-200 to-amber-400' },
  'birthdays':           { icon: '🎂', gradient: 'from-warm-100 to-amber-200' },
  'baby-showers':        { icon: '👶', gradient: 'from-amber-50 to-warm-200' },
  'anniversaries':       { icon: '💑', gradient: 'from-amber-200 to-amber-400' },
  'housewarming':        { icon: '🏡', gradient: 'from-warm-200 to-warm-400' },
  'festivals':           { icon: '🪔', gradient: 'from-amber-300 to-amber-500' },
  'return-favors':       { icon: '🎀', gradient: 'from-warm-100 to-warm-300' },
  'wedding-favors':      { icon: '💍', gradient: 'from-amber-50 to-warm-200' },
  'mehendi-haldi':       { icon: '🌼', gradient: 'from-amber-200 to-amber-400' },
  'bridal-shower':       { icon: '👰', gradient: 'from-warm-100 to-amber-300' },
  'save-the-date':       { icon: '📅', gradient: 'from-warm-200 to-warm-400' },
  'luxury-hampers':      { icon: '🧺', gradient: 'from-amber-300 to-amber-500' },
  'bulk-events':         { icon: '📦', gradient: 'from-warm-100 to-warm-300' },
  'corporate':           { icon: '🏢', gradient: 'from-warm-200 to-warm-400' },
  'client-gifts':        { icon: '🤝', gradient: 'from-amber-100 to-warm-300' },
  'welcome-kits':        { icon: '🎒', gradient: 'from-warm-50 to-amber-200' },
  'festive-hampers':     { icon: '🧧', gradient: 'from-amber-200 to-amber-400' },
  'brand-candles':       { icon: '🏷️', gradient: 'from-warm-100 to-warm-300' },
}
const DEFAULT_DISPLAY = { icon: '🕯️', gradient: 'from-amber-100 to-amber-300' }

interface CategoryTileProps {
  label: string
  icon: string
  href: string
  gradient: string
  image: string | null
}

function CategoryTile({ label, icon, href, gradient, image }: CategoryTileProps) {
  return (
    <Link
      to={href}
      className="group flex-shrink-0 w-52 sm:w-60"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className={`${THEME.cardBg} rounded-2xl overflow-hidden hover:shadow-warm hover:-translate-y-1 transition-all duration-300`}>
        {/* Image / placeholder area */}
        <div className={`relative h-64 sm:h-72 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {image ? (
            <img src={image} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <>
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/20" />
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/15" />
              <span className="relative text-7xl drop-shadow-sm">{icon}</span>
            </>
          )}
        </div>
        {/* Label */}
        <div className="px-4 py-3 text-center">
          <p className={`font-semibold ${THEME.cardText} group-hover:text-amber-400 transition-colors text-sm leading-snug`}>
            {label}
          </p>
        </div>
      </div>
    </Link>
  )
}

function SectionHeader({
  title,
  subtitle,
  viewAllHref,
}: {
  title: string
  subtitle?: string
  viewAllHref?: string
}) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className={`font-serif text-2xl md:text-3xl font-semibold ${THEME.heading}`}>{title}</h2>
        {subtitle && <p className={`${THEME.muted} mt-1 text-sm`}>{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap ml-4"
        >
          View all →
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const { categories } = useCategories()

  const featuredCategoryId = categories.find((c) => c.slug === 'featured')?.id
  const { products, isLoading } = useProducts({ limit: 20, status: 'active', categoryId: featuredCategoryId })

  // Build category group sections dynamically (exclude Featured)
  const groups = categories
    .filter((c) => !c.parentId && c.slug !== 'featured')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const groupSections = groups.map((group) => ({
    group,
    items: categories
      .filter((c) => c.parentId === group.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({
        label: cat.name,
        href: `/products?category=${cat.slug}`,
        image: cat.image || null,
        ...(CATEGORY_DISPLAY[cat.slug] || DEFAULT_DISPLAY),
      })),
  })).filter((s) => s.items.length > 0)

  return (
    <div className={THEME.pageBg}>
      {/* Hero Section */}
      <section className="bg-warm-900 border-b border-warm-800">
        <div className="flex flex-col items-center justify-center text-center px-6 py-10 sm:py-12">
          <p className="mb-6 tracking-[0.35em] text-amber-500/80 text-xs sm:text-sm uppercase font-medium">
            Handcrafted · Thoughtfully Curated · Artisan Made
          </p>
          <img
            src="/logo-monogram.png"
            alt="Wicks & Wax"
            className="w-44 sm:w-56 h-auto filter invert mix-blend-screen opacity-90"
          />
          <h1 className="font-serif font-semibold text-cream-100 mb-4 -mt-8" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', letterSpacing: '-0.01em' }}>
            Wicks &amp; Wax
          </h1>
          <p className="max-w-md text-warm-300 text-sm sm:text-base leading-relaxed">
            Handcrafted luxury gifting experiences — from candles to curated hampers — made with warmth and intention.
          </p>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="bg-amber-500 overflow-hidden py-3 border-y border-amber-600">
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          .marquee-track { display: flex; width: max-content; animation: marquee 20s linear infinite; }
        `}</style>
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="shrink-0 px-16 text-white text-sm font-semibold tracking-wide whitespace-nowrap">
              ✦ For bulk orders &amp; customised gifts, WhatsApp us at{' '}
              <a href="https://wa.me/916361019528" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-amber-100">+91 63610 19528</a>
              {' '}— we'd love to craft something special for you &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Featured Products Carousel */}
      <section className={`${THEME.pageBg} py-14`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <SectionHeader title="Featured Candles" subtitle="Our most loved scents" viewAllHref="/products" />
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <Carousel itemWidth={260}>
              {products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-52 sm:w-60" style={{ scrollSnapAlign: 'start' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </Carousel>
          )}
        </div>
      </section>

      {/* Dynamic category group carousels */}
      {groupSections.map((section, i) => (
        <section
          key={section.group.id}
          className={`${i % 2 === 0 ? THEME.sectionAlt : THEME.pageBg} py-14`}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <SectionHeader
              title={section.group.name}
              subtitle={section.group.description}
              viewAllHref={`/products?category=${section.items[0]?.href.split('=')[1] ?? ''}`}
            />
            <Carousel itemWidth={256}>
              {section.items.map((cat) => <CategoryTile key={cat.label} {...cat} />)}
            </Carousel>
          </div>
        </section>
      ))}
    </div>
  )
}
