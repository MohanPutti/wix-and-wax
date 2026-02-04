import { Link } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useProducts'
import ProductGrid from '../components/products/ProductGrid'
import Button from '../components/ui/Button'

export default function Home() {
  const { products, isLoading } = useProducts({ limit: 8, status: 'active' })
  const { categories } = useCategories()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-warm-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-warm-900 via-warm-800 to-amber-900 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Illuminate Your Space with
              <span className="text-amber-400"> Artisan Candles</span>
            </h1>
            <p className="text-lg text-warm-200 mb-8">
              Hand-poured with love, our premium candles transform any moment into something special.
              Discover scents crafted for relaxation, celebration, and everything in between.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Collection
                </Button>
              </Link>
              <Link to="/products?category=gifts">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  Gift Sets
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative Element */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-20">
          <div className="w-full h-full bg-gradient-to-l from-amber-500 to-transparent" />
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-semibold text-warm-900 mb-4">
            Shop by Occasion
          </h2>
          <p className="text-warm-600 max-w-2xl mx-auto">
            Find the perfect candle for every moment
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group bg-white rounded-xl p-6 text-center shadow-soft hover:shadow-warm transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <span className="text-2xl">&#x1F56F;</span>
              </div>
              <h3 className="font-medium text-warm-900 group-hover:text-amber-700 transition-colors">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-warm-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-warm-900 mb-2">
                Featured Candles
              </h2>
              <p className="text-warm-600">Our most loved scents</p>
            </div>
            <Link to="/products">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-warm-900 mb-6">
              Crafted with Care
            </h2>
            <div className="space-y-4 text-warm-600">
              <p>
                At Wix & Wax, every candle tells a story. We believe in the power of scent to transform
                your space and elevate your mood.
              </p>
              <p>
                Our candles are hand-poured in small batches using premium soy wax and carefully
                selected fragrance oils. Each one is crafted to burn cleanly and fill your space
                with beautiful, long-lasting scent.
              </p>
              <p>
                From relaxing lavender to festive winter spice, we have a candle for every moment
                and every mood.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div>
                <p className="font-serif text-3xl font-bold text-amber-600">100%</p>
                <p className="text-sm text-warm-600">Soy Wax</p>
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-amber-600">40+</p>
                <p className="text-sm text-warm-600">Hour Burn Time</p>
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-amber-600">Hand</p>
                <p className="text-sm text-warm-600">Poured</p>
              </div>
            </div>
          </div>
          <div className="bg-warm-100 rounded-2xl aspect-square flex items-center justify-center">
            <span className="text-9xl opacity-50">&#x1F56F;</span>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-semibold mb-4">
            Join Our Community
          </h2>
          <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
            Subscribe to receive updates on new arrivals, special offers, and candle care tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button variant="secondary" size="lg">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
