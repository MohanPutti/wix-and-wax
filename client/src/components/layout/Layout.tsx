import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from '../cart/CartSidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartSidebar />
    </div>
  )
}
