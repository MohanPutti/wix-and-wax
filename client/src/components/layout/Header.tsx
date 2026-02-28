import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { selectUser, selectIsAuthenticated, selectIsAdmin, logoutUser } from '../../store/slices/authSlice'
import { selectItemCount, toggleCart } from '../../store/slices/cartSlice'

const NAV_ITEMS = [
  {
    label: 'SHOP',
    items: [
      { label: 'Jar Candles', href: '/products?category=jar-candles' },
      { label: 'Scented Sachets', href: '/products?category=scented-sachets' },
      { label: 'Tealights', href: '/products?category=tealights' },
      { label: 'Gift Boxes', href: '/products?category=gift-boxes' },
      { label: 'Custom Name Candles', href: '/products?category=custom-name-candles' },
      { label: 'New Arrivals', href: '/products?sort=newest' },
      { label: 'Bestsellers', href: '/products?sort=bestsellers' },
    ],
  },
  {
    label: 'OCCASIONS',
    items: [
      { label: 'Birthdays', href: '/products?occasion=birthdays' },
      { label: 'Baby Showers', href: '/products?occasion=baby-showers' },
      { label: 'Anniversaries', href: '/products?occasion=anniversaries' },
      { label: 'Housewarming', href: '/products?occasion=housewarming' },
      { label: 'Festivals', href: '/products?occasion=festivals' },
      { label: 'Return Favors', href: '/products?occasion=return-favors' },
    ],
  },
  {
    label: 'WEDDING & EVENTS',
    items: [
      { label: 'Wedding Favors', href: '/products?occasion=wedding-favors' },
      { label: 'Mehendi & Haldi Favors', href: '/products?occasion=mehendi-haldi' },
      { label: 'Bridal Shower', href: '/products?occasion=bridal-shower' },
      { label: 'Save The Date Hampers', href: '/products?occasion=save-the-date' },
      { label: 'Luxury Guest Hampers', href: '/products?occasion=luxury-hampers' },
      { label: 'Bulk Event Orders', href: '/products?occasion=bulk-events' },
    ],
  },
  {
    label: 'CORPORATE',
    items: [
      { label: 'Corporate Gifting', href: '/products?category=corporate' },
      { label: 'Client Gifts', href: '/products?category=client-gifts' },
      { label: 'Employee Welcome Kits', href: '/products?category=welcome-kits' },
      { label: 'Festive Hampers', href: '/products?category=festive-hampers' },
      { label: 'Brand Customized Candles', href: '/products?category=brand-candles' },
    ],
  },
]

const WHATSAPP_URL = 'https://wa.me/918368680057'

const CUSTOMIZE_ITEMS = [
  { label: 'Bulk Orders', href: WHATSAPP_URL },
  { label: 'Personalized Candles', href: WHATSAPP_URL },
  { label: 'Custom Fragrances', href: WHATSAPP_URL },
  { label: 'Packaging Options', href: WHATSAPP_URL },
]

interface DropdownMenuProps {
  items: { label: string; href: string }[]
}

function DropdownMenu({ items }: DropdownMenuProps) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-warm-100 rounded-xl shadow-soft min-w-[200px] py-2 z-50 animate-fade-in">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className="block px-5 py-2.5 text-sm text-warm-700 hover:bg-amber-50 hover:text-amber-700 transition-colors whitespace-nowrap"
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAdmin = useAppSelector(selectIsAdmin)
  const itemCount = useAppSelector(selectItemCount)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isTransparent = isHome && !scrolled && !isMobileMenuOpen

  const handleDropdownEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(label)
  }

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  const handleCustomizeEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsCustomizeOpen(true)
  }

  const handleCustomizeLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsCustomizeOpen(false)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/')
  }

  const handleToggleCart = () => {
    dispatch(toggleCart())
  }

  const toggleMobileSection = (label: string) => {
    setOpenMobileSection((prev) => (prev === label ? null : label))
  }

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isTransparent ? 'bg-transparent border-transparent' : 'bg-cream-50 border-b border-warm-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — hidden on home page at top */}
          <Link to="/" className={`flex items-center space-x-2 flex-shrink-0 transition-opacity duration-300 ${isHome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span className="text-2xl">&#x1F56F;</span>
            <span className="font-serif text-xl font-semibold text-warm-900">Wicks and Wax</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((nav) => (
              <div
                key={nav.label}
                className="relative"
                onMouseEnter={() => handleDropdownEnter(nav.label)}
                onMouseLeave={handleDropdownLeave}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-xs font-semibold tracking-wide text-warm-700 hover:text-amber-700 transition-colors rounded-lg hover:bg-amber-50">
                  {nav.label}
                  <ChevronDownIcon
                    className={`h-3 w-3 transition-transform duration-200 ${
                      activeDropdown === nav.label ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeDropdown === nav.label && <DropdownMenu items={nav.items} />}
              </div>
            ))}

            {/* Customize Your Order — gold CTA */}
            <div
              className="relative"
              onMouseEnter={handleCustomizeEnter}
              onMouseLeave={handleCustomizeLeave}
            >
              <button className="flex items-center gap-1.5 ml-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold tracking-wide rounded-full transition-all duration-200 shadow-warm hover:shadow-lg">
                <SparklesIcon className="h-3.5 w-3.5" />
                CUSTOMIZE YOUR ORDER
                <ChevronDownIcon
                  className={`h-3 w-3 transition-transform duration-200 ${
                    isCustomizeOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isCustomizeOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-amber-200 rounded-xl shadow-warm min-w-[210px] py-2 z-50 animate-fade-in">
                  {CUSTOMIZE_ITEMS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-5 py-2.5 text-sm text-warm-700 hover:bg-amber-50 hover:text-amber-700 transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Cart */}
            <button
              onClick={handleToggleCart}
              className="relative p-2 text-warm-600 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50"
              aria-label="Open cart"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-1.5 p-2 text-warm-600 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50">
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden sm:inline text-sm">{user?.firstName || 'Account'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft border border-warm-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50">
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="p-2 text-warm-600 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50">
                <UserIcon className="h-6 w-6" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-warm-600 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-warm-200 bg-cream-50 max-h-[80vh] overflow-y-auto">
          {/* Regular Nav Sections */}
          {NAV_ITEMS.map((nav) => (
            <div key={nav.label} className="border-b border-warm-100">
              <button
                onClick={() => toggleMobileSection(nav.label)}
                className="flex items-center justify-between w-full px-6 py-4 text-sm font-semibold tracking-wide text-warm-800 hover:bg-amber-50 transition-colors"
              >
                {nav.label}
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openMobileSection === nav.label ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openMobileSection === nav.label && (
                <div className="bg-warm-50 pb-2">
                  {nav.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block px-10 py-2.5 text-sm text-warm-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Customize CTA */}
          <div className="border-b border-warm-100">
            <button
              onClick={() => toggleMobileSection('CUSTOMIZE')}
              className="flex items-center justify-between w-full px-6 py-4 text-sm font-bold tracking-wide text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                CUSTOMIZE YOUR ORDER
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  openMobileSection === 'CUSTOMIZE' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openMobileSection === 'CUSTOMIZE' && (
              <div className="bg-amber-50 pb-2">
                {CUSTOMIZE_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-10 py-2.5 text-sm text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Auth Links */}
          {!isAuthenticated && (
            <div className="p-4 flex gap-3">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 text-sm font-medium text-warm-700 border border-warm-300 rounded-lg hover:bg-warm-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
