import { ReactNode, useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  SparklesIcon,
  TicketIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  CalculatorIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAppSelector } from '../../store/hooks'
import { selectIsAdmin, selectIsLoading } from '../../store/slices/authSlice'

interface AdminLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Catalog', href: '/admin/catalog', icon: SparklesIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Discounts', href: '/admin/discounts', icon: TicketIcon },
  { name: 'Inventory', href: '/admin/inventory', icon: ArchiveBoxIcon },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardDocumentListIcon },
  { name: 'Expenses', href: '/admin/expenses', icon: BanknotesIcon },
  { name: 'Calculator', href: '/admin/calculator', icon: CalculatorIcon },
  { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = useAppSelector(selectIsAdmin)
  const isLoading = useAppSelector(selectIsLoading)
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-warm-800">
        <div className="flex items-center gap-0">
          <img
            src="/logo-monogram.png"
            alt=""
            className="w-12 h-12 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className="font-serif text-lg font-semibold text-cream-100">Wicks &amp; Wax</span>
        </div>
        {/* Close button for mobile */}
        <button
          className="md:hidden text-warm-300 hover:text-cream-100 p-1"
          onClick={() => setSidebarOpen(false)}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'text-warm-300 hover:bg-warm-800 hover:text-cream-100'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Back to Store */}
      <div className="p-4 border-t border-warm-800">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center px-4 py-3 text-warm-300 hover:text-cream-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-3" />
          Back to Store
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible; mobile: slide-in drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-warm-900 z-40 transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <NavContent />
      </div>

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-14 px-4 bg-warm-900 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-warm-300 hover:text-cream-100 p-1 mr-3"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <img
            src="/logo-monogram.png"
            alt=""
            className="w-8 h-8 object-contain mr-2"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className="font-serif text-base font-semibold text-cream-100">Wicks &amp; Wax</span>
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
