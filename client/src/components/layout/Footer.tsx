import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-warm-900 text-warm-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">&#x1F56F;</span>
              <span className="font-serif text-2xl font-semibold text-cream-100">Wix & Wax</span>
            </div>
            <p className="text-warm-300 max-w-md">
              Hand-poured artisan candles made with love. Transform your space with our carefully curated collection of premium scents.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-cream-100 mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-warm-300 hover:text-amber-400 transition-colors">
                  All Candles
                </Link>
              </li>
              <li>
                <Link to="/products?category=relaxation" className="text-warm-300 hover:text-amber-400 transition-colors">
                  Relaxation
                </Link>
              </li>
              <li>
                <Link to="/products?category=gifts" className="text-warm-300 hover:text-amber-400 transition-colors">
                  Gift Sets
                </Link>
              </li>
              <li>
                <Link to="/products?category=holiday" className="text-warm-300 hover:text-amber-400 transition-colors">
                  Seasonal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-cream-100 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-warm-300 hover:text-amber-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-warm-300 hover:text-amber-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-warm-300 hover:text-amber-400 transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-warm-300 hover:text-amber-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-warm-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-warm-400 text-sm">
            &copy; {new Date().getFullYear()} Wix & Wax. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-warm-400 hover:text-amber-400 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-warm-400 hover:text-amber-400 transition-colors">
              Pinterest
            </a>
            <a href="#" className="text-warm-400 hover:text-amber-400 transition-colors">
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
