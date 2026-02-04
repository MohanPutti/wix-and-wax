import { ReactNode } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { useAppSelector } from '../../store/hooks'
import { selectIsAdmin, selectIsLoading } from '../../store/slices/authSlice'

interface AdminLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardDocumentListIcon },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = useAppSelector(selectIsAdmin)
  const isLoading = useAppSelector(selectIsLoading)
  const location = useLocation()

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

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-warm-900">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-warm-800">
            <span className="text-xl mr-2">&#x1F56F;</span>
            <span className="font-serif text-xl font-semibold text-cream-100">Admin Panel</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'text-warm-300 hover:bg-warm-800 hover:text-cream-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Back to Store */}
          <div className="p-4 border-t border-warm-800">
            <Link
              to="/"
              className="flex items-center px-4 py-3 text-warm-300 hover:text-cream-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-3" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
