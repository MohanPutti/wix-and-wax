import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/products/ProductCard'
import Button from '../components/ui/Button'
import Carousel from '../components/ui/Carousel'
import Spinner from '../components/ui/Spinner'

const SHOP_CATEGORIES = [
  { label: 'Jar Candles', icon: '🕯️', href: '/products?category=jar-candles', gradient: 'from-amber-200 to-amber-400', image: null },
  { label: 'Scented Sachets', icon: '🌸', href: '/products?category=scented-sachets', gradient: 'from-rose-200 to-pink-400', image: null },
  { label: 'Tealights', icon: '✨', href: '/products?category=tealights', gradient: 'from-yellow-200 to-amber-300', image: null },
  { label: 'Gift Boxes', icon: '🎁', href: '/products?category=gift-boxes', gradient: 'from-emerald-200 to-teal-400', image: null },
  { label: 'Custom Name Candles', icon: '✍️', href: '/products?category=custom-name-candles', gradient: 'from-purple-200 to-violet-400', image: null },
  { label: 'New Arrivals', icon: '🆕', href: '/products?sort=newest', gradient: 'from-sky-200 to-blue-400', image: null },
  { label: 'Bestsellers', icon: '⭐', href: '/products?sort=bestsellers', gradient: 'from-orange-200 to-amber-500', image: null },
]

const OCCASIONS = [
  { label: 'Birthdays', icon: '🎂', href: '/products?occasion=birthdays', gradient: 'from-pink-200 to-rose-400', image: null },
  { label: 'Baby Showers', icon: '👶', href: '/products?occasion=baby-showers', gradient: 'from-sky-200 to-blue-300', image: null },
  { label: 'Anniversaries', icon: '💑', href: '/products?occasion=anniversaries', gradient: 'from-red-200 to-rose-500', image: null },
  { label: 'Housewarming', icon: '🏡', href: '/products?occasion=housewarming', gradient: 'from-green-200 to-emerald-400', image: null },
  { label: 'Festivals', icon: '🪔', href: '/products?occasion=festivals', gradient: 'from-orange-200 to-red-400', image: null },
  { label: 'Return Favors', icon: '🎀', href: '/products?occasion=return-favors', gradient: 'from-rose-200 to-pink-400', image: null },
]

const CORPORATE = [
  { label: 'Corporate Gifting', icon: '🏢', href: '/products?occasion=corporate', gradient: 'from-slate-200 to-slate-400', image: null },
  { label: 'Client Gifts', icon: '🤝', href: '/products?occasion=client-gifts', gradient: 'from-blue-200 to-indigo-400', image: null },
  { label: 'Welcome Kits', icon: '🎒', href: '/products?occasion=welcome-kits', gradient: 'from-teal-200 to-cyan-400', image: null },
  { label: 'Festive Hampers', icon: '🧧', href: '/products?occasion=festive-hampers', gradient: 'from-red-200 to-orange-400', image: null },
  { label: 'Brand Candles', icon: '🏷️', href: '/products?occasion=brand-candles', gradient: 'from-violet-200 to-purple-400', image: null },
]

const WEDDING_EVENTS = [
  { label: 'Wedding Favors', icon: '💍', href: '/products?occasion=wedding-favors', gradient: 'from-rose-100 to-pink-300', image: null },
  { label: 'Mehendi & Haldi', icon: '🌼', href: '/products?occasion=mehendi-haldi', gradient: 'from-yellow-200 to-amber-400', image: null },
  { label: 'Bridal Shower', icon: '👰', href: '/products?occasion=bridal-shower', gradient: 'from-fuchsia-200 to-pink-400', image: null },
  { label: 'Save The Date', icon: '📅', href: '/products?occasion=save-the-date', gradient: 'from-violet-200 to-purple-400', image: null },
  { label: 'Luxury Hampers', icon: '🧺', href: '/products?occasion=luxury-hampers', gradient: 'from-amber-200 to-yellow-400', image: null },
  { label: 'Bulk Event Orders', icon: '📦', href: '/products?occasion=bulk-events', gradient: 'from-slate-200 to-warm-400', image: null },
]

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
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-warm hover:-translate-y-1 transition-all duration-300">
        {/* Image / placeholder area */}
        <div className={`relative h-64 sm:h-72 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {image ? (
            <img src={image} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <>
              {/* decorative blobs */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/20" />
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/15" />
              <span className="relative text-7xl drop-shadow-sm">{icon}</span>
            </>
          )}
        </div>
        {/* Label */}
        <div className="px-4 py-3 text-center">
          <p className="font-semibold text-warm-900 group-hover:text-amber-700 transition-colors text-sm leading-snug">
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
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-warm-900">{title}</h2>
        {subtitle && <p className="text-warm-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors whitespace-nowrap ml-4"
        >
          View all →
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const { products, isLoading } = useProducts({ limit: 12, status: 'active' })

  return (
    <div>
      {/* Hero Section — full image, no cropping */}
      <section className="w-full">
        <img
          src="/hero-banner.png"
          alt="Wicks and Wax"
          className="w-full h-auto block"
        />
      </section>

      {/* Featured Products Carousel */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-14">
        <SectionHeader
          title="Featured Candles"
          subtitle="Our most loved scents"
          viewAllHref="/products"
        />
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Carousel itemWidth={260}>
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-52 sm:w-60"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </Carousel>
        )}
      </section>

      {/* Shop by Category Carousel */}
      <section className="bg-warm-50 py-14">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <SectionHeader
            title="Shop by Product"
            subtitle="Explore our full candle collection"
            viewAllHref="/products"
          />
          <Carousel itemWidth={256}>
            {SHOP_CATEGORIES.map((cat) => (
              <CategoryTile key={cat.label} {...cat} />
            ))}
          </Carousel>
        </div>
      </section>

      {/* Occasions Carousel */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-14">
        <SectionHeader
          title="Shop by Occasion"
          subtitle="Find the perfect candle for every moment"
          viewAllHref="/products"
        />
        <Carousel itemWidth={256}>
          {OCCASIONS.map((occ) => (
            <CategoryTile key={occ.label} {...occ} />
          ))}
        </Carousel>
      </section>

      {/* Wedding & Events Carousel */}
      <section className="bg-warm-50 py-14">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <SectionHeader
            title="Wedding &amp; Events"
            subtitle="Make every celebration unforgettable"
            viewAllHref="/products?occasion=wedding-favors"
          />
          <Carousel itemWidth={256}>
            {WEDDING_EVENTS.map((item) => (
              <CategoryTile key={item.label} {...item} />
            ))}
          </Carousel>
        </div>
      </section>

      {/* Corporate Gifting Carousel */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-14">
        <SectionHeader
          title="Corporate Gifting"
          subtitle="Thoughtful candles that leave a lasting impression"
          viewAllHref="/products?occasion=corporate"
        />
        <Carousel itemWidth={256}>
          {CORPORATE.map((item) => (
            <CategoryTile key={item.label} {...item} />
          ))}
        </Carousel>
      </section>

    </div>
  )
}
