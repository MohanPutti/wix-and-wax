import { Link, useNavigate, useLocation } from 'react-router-dom'
import { THEME } from '../../config'
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
import { useCategories } from '../../hooks/useProducts'

const WHATSAPP_URL = 'https://wa.me/916361019528'

interface DropdownMenuProps {
  items: { label: string; href: string }[]
}

function DropdownMenu({ items }: DropdownMenuProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-warm-100 rounded-xl shadow-soft min-w-[200px] py-2 z-50">
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
  useLocation()
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAdmin = useAppSelector(selectIsAdmin)
  const itemCount = useAppSelector(selectItemCount)
  const { categories } = useCategories()

  // Build nav dynamically: groups = top-level categories (excluding Featured)
  const groups = categories.filter((c) => !c.parentId && c.slug !== 'featured')
  const navItems = groups.map((group) => ({
    label: group.name.toUpperCase(),
    id: group.id,
    items: categories
      .filter((c) => c.parentId === group.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({ label: cat.name, href: `/products?category=${cat.slug}` })),
  })).filter((g) => g.items.length > 0)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDropdownEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(label)
  }

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
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
    <header className={`sticky top-0 z-40 transition-all duration-300 ${THEME.headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-0">
            <img
              src="/logo-monogram.png"
              alt=""
              className="w-14 h-14 object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(90%) saturate(700%) hue-rotate(5deg) brightness(85%)' }}
            />
            <span className="font-serif font-semibold text-warm-900" style={{ fontSize: '1.35rem', letterSpacing: '-0.01em' }}>
              Wicks &amp; Wax
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((nav) => (
              <div
                key={nav.id}
                className="relative"
                onMouseEnter={() => handleDropdownEnter(nav.id)}
                onMouseLeave={handleDropdownLeave}
              >
                <button className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold tracking-wide ${THEME.headerText} ${THEME.headerHover} transition-colors rounded-lg hover:bg-amber-50`}>
                  {nav.label}
                  <ChevronDownIcon
                    className={`h-3 w-3 transition-transform duration-200 ${
                      activeDropdown === nav.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeDropdown === nav.id && <DropdownMenu items={nav.items} />}
              </div>
            ))}

            {/* Customize Your Order — direct WhatsApp link */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 ml-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold tracking-wide rounded-full transition-all duration-200 shadow-warm hover:shadow-lg"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              CUSTOMIZE YOUR ORDER
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Cart */}
            <button
              onClick={handleToggleCart}
              className={`relative p-2 ${THEME.headerText} hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50`}
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
                <button className={`flex items-center space-x-1.5 p-2 ${THEME.headerText} hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50`}>
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
              <Link to="/login" className={`p-2 ${THEME.headerText} hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50`}>
                <UserIcon className="h-6 w-6" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 ${THEME.headerText} hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50`}
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
          {navItems.map((nav) => (
            <div key={nav.id} className="border-b border-warm-100">
              <button
                onClick={() => toggleMobileSection(nav.id)}
                className="flex items-center justify-between w-full px-6 py-4 text-sm font-semibold tracking-wide text-warm-800 hover:bg-amber-50 transition-colors"
              >
                {nav.label}
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openMobileSection === nav.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openMobileSection === nav.id && (
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
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full px-6 py-4 text-sm font-bold tracking-wide text-amber-700 hover:bg-amber-50 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <SparklesIcon className="h-4 w-4" />
              CUSTOMIZE YOUR ORDER
            </a>
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
