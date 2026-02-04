import { Link } from 'react-router-dom'
import { ShoppingBagIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { selectUser, selectIsAuthenticated, selectIsAdmin, logoutUser } from '../../store/slices/authSlice'
import { selectItemCount, toggleCart } from '../../store/slices/cartSlice'

export default function Header() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAdmin = useAppSelector(selectIsAdmin)
  const itemCount = useAppSelector(selectItemCount)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logoutUser())
  }

  const handleToggleCart = () => {
    dispatch(toggleCart())
  }

  return (
    <header className="bg-cream-50 border-b border-warm-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">&#x1F56F;</span>
            <span className="font-serif text-2xl font-semibold text-warm-900">Wix & Wax</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-warm-600 hover:text-amber-600 transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-warm-600 hover:text-amber-600 transition-colors">
              Shop
            </Link>
            <Link to="/products?category=gifts" className="text-warm-600 hover:text-amber-600 transition-colors">
              Gifts
            </Link>
            <Link to="/products?category=relaxation" className="text-warm-600 hover:text-amber-600 transition-colors">
              Relaxation
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button
              onClick={handleToggleCart}
              className="relative p-2 text-warm-600 hover:text-amber-600 transition-colors"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-warm-600 hover:text-amber-600 transition-colors">
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden sm:inline text-sm">{user?.firstName || 'Account'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-soft border border-warm-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                      >
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
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 text-warm-600 hover:text-amber-600 transition-colors"
              >
                <UserIcon className="h-6 w-6" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-warm-600 hover:text-amber-600 transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-warm-200">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-4 py-2 text-warm-600 hover:bg-warm-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="px-4 py-2 text-warm-600 hover:bg-warm-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                to="/products?category=gifts"
                className="px-4 py-2 text-warm-600 hover:bg-warm-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gifts
              </Link>
              <Link
                to="/products?category=relaxation"
                className="px-4 py-2 text-warm-600 hover:bg-warm-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Relaxation
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
