// User types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  isActive: boolean
  isVerified: boolean
  roles: { role: { name: string } }[]
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    tokens: {
      accessToken: string
      refreshToken?: string
      expiresIn?: number
    }
  }
}

// Catalog types (admin-managed master lists)
export interface ProductBase {
  id: string
  name: string
  sizes: string[]
}

export interface Fragrance {
  id: string
  name: string
}

export interface Color {
  id: string
  name: string
  hex?: string
}

export interface Packaging {
  id: string
  name: string
}

// Product types
export interface ProductVariant {
  id: string
  productId: string
  sku: string
  name: string
  price: number
  comparePrice?: number
  quantity: number
  options?: Record<string, string>
  isDefault: boolean
}

export interface Customisation {
  id: string
  name: string
}

// Product metadata for fragrances and colors
export interface ProductMetadata {
  fragrances?: string[]
  colors?: string[]
  customisations?: string[]
  customisationPrices?: Record<string, number>
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  sortOrder: number
}

export type CategoryStatus = 'active' | 'draft' | 'archived'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  sortOrder: number
  status: CategoryStatus
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  metadata?: ProductMetadata
  variants: ProductVariant[]
  categories: { category: Category }[]
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

// Cart types
export interface CartItem {
  id: string
  cartId: string
  variantId: string
  quantity: number
  price: number
  metadata?: { note?: string }
  variant: ProductVariant & {
    product: Product
  }
}

export interface Cart {
  id: string
  userId?: string
  sessionId?: string
  status: 'active' | 'converted' | 'abandoned'
  currency: string
  items: CartItem[]
  discounts: { discount: Discount }[]
  createdAt: string
  updatedAt: string
}

// Order types
export interface Address {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

// Saved address type (with id for stored addresses)
export interface SavedAddress extends Address {
  id: string
  userId: string
  type: 'shipping' | 'billing'
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  variantId?: string
  productName: string
  variantName?: string
  sku?: string
  quantity: number
  price: number
  total: number
  fulfilledQty: number
  metadata?: { note?: string; [key: string]: unknown }
}

export interface Order {
  id: string
  orderNumber: string
  userId?: string
  email: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed'
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled'
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  currency: string
  shippingAddress: Address
  billingAddress?: Address
  notes?: string
  metadata?: { customerNotes?: string; [key: string]: unknown }
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

// Discount types
export interface Discount {
  id: string
  code: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  minPurchase?: number
  maxUses?: number
  usedCount: number
  startsAt?: string
  endsAt?: string
  isActive: boolean
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Inventory types
export interface InventoryType {
  id: string
  name: string
  unit?: string
  createdAt: string
}

export interface InventoryEntry {
  id: string
  typeId: string
  quantity: number
  pricePerUnit: number
  totalCost: number
  note?: string
  date: string
  createdAt: string
  type: Pick<InventoryType, 'id' | 'name' | 'unit'>
}

export interface InventorySummary {
  totalInvested: number
  currentValue: number
}

// Admin Dashboard types
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  recentOrders: Order[]
  topProducts: { product: Product; salesCount: number }[]
}
