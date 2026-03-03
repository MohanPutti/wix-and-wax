import type {
  ApiResponse,
  PaginatedResponse,
  User,
  AuthResponse,
  Product,
  Category,
  Cart,
  Order,
  Address,
  SavedAddress,
  ProductBase,
  Fragrance,
  Color,
  Discount,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiClient {
  private accessToken: string | null = null

  constructor() {
    this.accessToken = localStorage.getItem('accessToken')
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
      // Handle nested error objects: {"success":false,"error":{"code":"...","message":"..."}}
      const errorObj = errorData.error
      const errorMessage = typeof errorObj === 'object' && errorObj?.message
        ? errorObj.message
        : typeof errorObj === 'string'
        ? errorObj
        : errorData.message || 'Request failed'
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Auth endpoints
  async register(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.success && response.data.tokens?.accessToken) {
      this.setAccessToken(response.data.tokens.accessToken)
    }
    return response
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.success && response.data.tokens?.accessToken) {
      this.setAccessToken(response.data.tokens.accessToken)
    }
    return response
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } finally {
      this.setAccessToken(null)
    }
  }

  async getMe() {
    return this.request<ApiResponse<User>>('/me')
  }

  // Product endpoints
  async getProducts(params?: {
    page?: number
    limit?: number
    category?: string
    status?: string
    search?: string
    minPrice?: number
    maxPrice?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`)
  }

  async getProduct(id: string) {
    return this.request<ApiResponse<Product>>(`/products/${id}`)
  }

  async getProductBySlug(slug: string) {
    return this.request<ApiResponse<Product>>(`/products/slug/${slug}`)
  }

  async createProduct(data: Partial<Product>) {
    return this.request<ApiResponse<Product>>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: Partial<Product>) {
    return this.request<ApiResponse<Product>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string) {
    return this.request<ApiResponse<void>>(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Sync all product images at once (uses custom endpoint to avoid URL validation issues)
  async syncProductImages(productId: string, urls: string[]) {
    return this.request<ApiResponse<{ id: string; url: string }[]>>(`/products/${productId}/images/sync`, {
      method: 'PUT',
      body: JSON.stringify({ urls }),
    })
  }

  // Product variant endpoints
  async addVariant(productId: string, data: object) {
    return this.request<ApiResponse<{ id: string }>>(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVariant(productId: string, variantId: string, data: object) {
    return this.request<ApiResponse<{ id: string }>>(`/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteVariant(productId: string, variantId: string) {
    return this.request<ApiResponse<void>>(`/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    })
  }

  // Catalog endpoints - Bases, Fragrances, Colors
  async getBases() {
    return this.request<ApiResponse<ProductBase[]>>('/bases')
  }

  async createBase(data: { name: string; sizes: string[] }) {
    return this.request<ApiResponse<ProductBase>>('/bases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBase(id: string, data: { name: string; sizes: string[] }) {
    return this.request<ApiResponse<ProductBase>>(`/bases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBase(id: string) {
    return this.request<ApiResponse<{ id: string }>>(`/bases/${id}`, { method: 'DELETE' })
  }

  async getFragrances() {
    return this.request<ApiResponse<Fragrance[]>>('/fragrances')
  }

  async createFragrance(name: string) {
    return this.request<ApiResponse<Fragrance>>('/fragrances', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async deleteFragrance(id: string) {
    return this.request<ApiResponse<{ id: string }>>(`/fragrances/${id}`, { method: 'DELETE' })
  }

  async getColors() {
    return this.request<ApiResponse<Color[]>>('/colors')
  }

  async createColor(data: { name: string; hex?: string }) {
    return this.request<ApiResponse<Color>>('/colors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteColor(id: string) {
    return this.request<ApiResponse<{ id: string }>>(`/colors/${id}`, { method: 'DELETE' })
  }

  // Category endpoints
  async getCategories() {
    return this.request<ApiResponse<Category[]>>('/categories')
  }

  async createCategory(data: Partial<Category>) {
    return this.request<ApiResponse<Category>>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: Partial<Category>) {
    return this.request<ApiResponse<Category>>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(id: string) {
    return this.request<ApiResponse<void>>(`/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Cart endpoints
  async getCart(sessionId?: string) {
    const query = sessionId ? `?sessionId=${sessionId}` : ''
    return this.request<ApiResponse<Cart>>(`/cart${query}`)
  }

  async addToCart(data: { variantId: string; quantity: number; sessionId?: string; note?: string }) {
    return this.request<ApiResponse<Cart>>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCartItem(cartId: string, itemId: string, quantity: number) {
    return this.request<ApiResponse<Cart>>(`/cart/${cartId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    })
  }

  async removeCartItem(cartId: string, itemId: string) {
    return this.request<ApiResponse<Cart>>(`/cart/${cartId}/items/${itemId}`, {
      method: 'DELETE',
    })
  }

  // Discount management (admin)
  async getDiscounts() {
    return this.request<ApiResponse<Discount[]>>('/discounts')
  }

  async createDiscount(data: Partial<Discount>) {
    return this.request<ApiResponse<Discount>>('/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDiscount(id: string, data: Partial<Discount>) {
    return this.request<ApiResponse<Discount>>(`/discounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDiscount(id: string) {
    return this.request<ApiResponse<{ id: string }>>(`/discounts/${id}`, { method: 'DELETE' })
  }

  async applyDiscount(_cartId: string, code: string) {
    return this.request<ApiResponse<Cart>>(`/cart/discount`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  async removeDiscount(cartId: string, discountId: string) {
    return this.request<ApiResponse<Cart>>(`/cart/${cartId}/discount/${discountId}`, {
      method: 'DELETE',
    })
  }

  // Order endpoints
  // Secure checkout - prices are validated server-side
  // Supports partial checkout with optional items array
  async checkout(data: {
    sessionId?: string
    email?: string
    shippingAddress: Address
    billingAddress?: Address
    items?: Array<{ variantId: string; quantity: number }> // Optional: for partial checkout
  }) {
    return this.request<ApiResponse<Order>>('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Legacy createOrder - kept for admin use only
  async createOrder(data: {
    email: string
    shippingAddress: Address
    billingAddress?: Address
    notes?: string
    items: Array<{ variantId: string; quantity: number; price: number; productName: string; variantName?: string }>
  }) {
    return this.request<ApiResponse<Order>>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<Order>>(`/orders${query ? `?${query}` : ''}`)
  }

  async getOrder(id: string) {
    return this.request<ApiResponse<Order>>(`/orders/${id}`)
  }

  async getOrderByNumber(orderNumber: string, email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : ''
    return this.request<ApiResponse<Order>>(`/orders/number/${orderNumber}${query}`)
  }

  async updateOrderStatus(id: string, status: Order['status']) {
    return this.request<ApiResponse<Order>>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: Order['paymentStatus']) {
    return this.request<ApiResponse<Order>>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus }),
    })
  }

  // Upload endpoint
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('image', file)

    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }

    return response.json() as Promise<ApiResponse<{ url: string }>>
  }

  async uploadImages(files: File[]) {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }

    return response.json() as Promise<ApiResponse<{ urls: string[] }>>
  }

  // Address endpoints
  async getAddresses() {
    return this.request<ApiResponse<SavedAddress[]>>('/addresses')
  }

  async createAddress(data: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    return this.request<ApiResponse<SavedAddress>>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAddress(id: string, data: Partial<Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    return this.request<ApiResponse<SavedAddress>>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAddress(id: string) {
    return this.request<ApiResponse<{ id: string }>>(`/addresses/${id}`, {
      method: 'DELETE',
    })
  }

  // Payment endpoints
  async createPaymentOrder(orderId: string) {
    return this.request<ApiResponse<{
      razorpayOrderId: string
      amount: number
      currency: string
      keyId: string
    }>>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    })
  }

  async verifyPayment(data: {
    orderId: string
    razorpayPaymentId: string
    razorpayOrderId: string
    razorpaySignature: string
  }) {
    return this.request<ApiResponse<{ order: Order }>>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShippingRate(pincode: string, items: number) {
    return this.request<ApiResponse<{ rate: number; isEstimate: boolean }>>(
      `/shipping/rates?pincode=${pincode}&items=${items}`
    )
  }
}

export const api = new ApiClient()
