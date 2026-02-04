import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { config } from './config.js'

// Import core modules from submodule (using source TypeScript via tsx)
import {
  setupUserModule,
  setupProductModule,
  setupCartModule,
  setupOrderModule,
  setupDiscountModule,
  createUserService,
} from '../../core/src/index.js'
import { createRazorpayAdapter } from '../../core/src/modules/payments/adapters/razorpay.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const prisma = new PrismaClient()

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))
app.use(express.json())

// Static file serving for uploads
const uploadsPath = path.join(__dirname, '../../', config.uploadDir)
app.use('/uploads', express.static(uploadsPath))

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsPath)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'))
    }
  },
})

// Create user service for token verification
const userService = createUserService(prisma, {
  jwt: { secret: config.jwtSecret, expiresIn: config.jwtExpiresIn },
})

// Token verification function for other modules
const verifyToken = async (token: string) => {
  const user = await userService.verifyAccessToken(token)
  if (!user) return undefined
  return {
    id: user.id,
    email: user.email,
    roles: user.roles.map((r: { role: { name: string } }) => r.role.name),
    permissions: user.permissions,
  }
}

// Setup core modules
app.use('/api', setupUserModule({
  prisma,
  jwtSecret: config.jwtSecret,
}))

app.use('/api', setupProductModule({
  prisma,
  verifyToken,
}))

app.use('/api', setupCartModule({
  prisma,
  verifyToken,
  defaultCurrency: 'INR',
}))

app.use('/api', setupOrderModule({
  prisma,
  verifyToken,
  defaultCurrency: 'INR',
}))

app.use('/api', setupDiscountModule({
  prisma,
  verifyToken,
}))

// File upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' })
  }

  const url = `/uploads/${req.file.filename}`
  res.json({ success: true, data: { url } })
})

// Multiple file upload endpoint
app.post('/api/upload/multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' })
  }

  const urls = req.files.map(file => `/uploads/${file.filename}`)
  res.json({ success: true, data: { urls } })
})

// Address endpoints (requires authentication)
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } })
  }
  const token = authHeader.slice(7)
  const user = await verifyToken(token)
  if (!user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } })
  }
  (req as express.Request & { user: typeof user }).user = user
  next()
}

// Get user's addresses
app.get('/api/addresses', requireAuth, async (req, res) => {
  try {
    const user = (req as express.Request & { user: { id: string } }).user
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({ success: true, data: addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch addresses' })
  }
})

// Create new address
app.post('/api/addresses', requireAuth, async (req, res) => {
  try {
    const user = (req as express.Request & { user: { id: string } }).user
    const { firstName, lastName, company, address1, address2, city, state, postalCode, country, phone, type, isDefault } = req.body

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, type: type || 'shipping' },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        company,
        address1,
        address2,
        city,
        state,
        postalCode,
        country,
        phone,
        type: type || 'shipping',
        isDefault: isDefault || false,
      },
    })
    res.json({ success: true, data: address })
  } catch (error) {
    console.error('Error creating address:', error)
    res.status(500).json({ success: false, error: 'Failed to create address' })
  }
})

// Update address
app.put('/api/addresses/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as express.Request & { user: { id: string } }).user
    const { id } = req.params
    const { firstName, lastName, company, address1, address2, city, state, postalCode, country, phone, type, isDefault } = req.body

    // Check ownership
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Address not found' })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, type: type || existing.type, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: { firstName, lastName, company, address1, address2, city, state, postalCode, country, phone, type, isDefault },
    })
    res.json({ success: true, data: address })
  } catch (error) {
    console.error('Error updating address:', error)
    res.status(500).json({ success: false, error: 'Failed to update address' })
  }
})

// Delete address
app.delete('/api/addresses/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as express.Request & { user: { id: string } }).user
    const { id } = req.params

    // Check ownership
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Address not found' })
    }

    await prisma.address.delete({ where: { id } })
    res.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting address:', error)
    res.status(500).json({ success: false, error: 'Failed to delete address' })
  }
})

// Optional auth middleware (for checkout - allows guests)
const optionalAuth = async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const user = await verifyToken(token)
    if (user) {
      (req as express.Request & { user: typeof user }).user = user
    }
  }
  next()
}

// Initialize Razorpay adapter if configured
const razorpay = config.razorpayKeyId && config.razorpayKeySecret
  ? createRazorpayAdapter({
      keyId: config.razorpayKeyId,
      keySecret: config.razorpayKeySecret,
      webhookSecret: config.razorpayWebhookSecret,
    })
  : null

// Create Razorpay order for payment
app.post('/api/payments/create-order', optionalAuth, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: { code: 'PAYMENT_UNAVAILABLE', message: 'Payment service not configured' } })
  }

  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Order ID is required' } })
    }

    // Get order from database
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Order is already paid' } })
    }

    // Create Razorpay order
    const payment = await razorpay.createPayment({
      orderId: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency,
      metadata: { orderId: order.id },
    })

    // Store Razorpay order ID for verification
    await prisma.order.update({
      where: { id: orderId },
      data: { notes: JSON.stringify({ razorpayOrderId: payment.orderId }) },
    })

    res.json({
      success: true,
      data: {
        razorpayOrderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        keyId: config.razorpayKeyId,
      },
    })
  } catch (error) {
    console.error('Payment order creation error:', error)
    res.status(500).json({ success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to create payment order' } })
  }
})

// Verify Razorpay payment
app.post('/api/payments/verify', optionalAuth, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: { code: 'PAYMENT_UNAVAILABLE', message: 'Payment service not configured' } })
  }

  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing payment verification data' } })
    }

    // Verify signature
    const isValid = razorpay.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    })

    if (!isValid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Payment verification failed' } })
    }

    // Update order payment status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
        notes: JSON.stringify({
          razorpayOrderId,
          razorpayPaymentId,
          paidAt: new Date().toISOString(),
        }),
      },
    })

    res.json({ success: true, data: { order } })
  } catch (error) {
    console.error('Payment verification error:', error)
    res.status(500).json({ success: false, error: { code: 'VERIFICATION_ERROR', message: 'Payment verification failed' } })
  }
})

// Secure checkout endpoint - validates prices server-side
// Supports partial checkout - only checkout selected items
app.post('/api/checkout', optionalAuth, async (req, res) => {
  try {
    const user = (req as express.Request & { user?: { id: string; email: string } }).user
    const {
      sessionId,
      shippingAddress,
      email: guestEmail,
      items: selectedItems // Optional: Array<{ variantId: string, quantity: number }>
    } = req.body

    // Validate required fields
    if (!shippingAddress) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Shipping address is required' } })
    }

    const email = user?.email || guestEmail
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email is required' } })
    }

    // Get cart - try userId first, then sessionId (for guests or users with guest carts)
    let cart
    if (user?.id) {
      cart = await prisma.cart.findFirst({
        where: { userId: user.id, status: 'active' },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          discounts: { include: { discount: true } },
        },
      })
    }

    // If no cart found by userId, try sessionId (handles guest carts for logged-in users)
    if (!cart && sessionId) {
      cart = await prisma.cart.findFirst({
        where: { sessionId, status: 'active' },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          discounts: { include: { discount: true } },
        },
      })

      // Optionally transfer guest cart to user
      if (cart && user?.id && !cart.userId) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { userId: user.id },
        })
      }
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Cart is empty' } })
    }

    // Determine which items to checkout
    // If selectedItems provided, validate and use those; otherwise checkout entire cart
    type CheckoutItem = { variantId: string; quantity: number; cartItemId: string }
    let itemsToCheckout: CheckoutItem[] = []

    if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
      // Partial checkout - validate selected items exist in cart
      for (const selected of selectedItems) {
        const cartItem = cart.items.find(i => i.variantId === selected.variantId)
        if (!cartItem) {
          return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: `Item with variantId ${selected.variantId} not found in cart` }
          })
        }

        // Validate quantity doesn't exceed cart quantity
        const quantity = selected.quantity || cartItem.quantity
        if (quantity > cartItem.quantity) {
          return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: `Requested quantity exceeds cart quantity for variant ${selected.variantId}` }
          })
        }

        itemsToCheckout.push({
          variantId: selected.variantId,
          quantity: quantity,
          cartItemId: cartItem.id,
        })
      }
    } else {
      // Full cart checkout
      itemsToCheckout = cart.items.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        cartItemId: item.id,
      }))
    }

    if (itemsToCheckout.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No items selected for checkout' } })
    }

    // Re-validate prices from database and build order items
    const orderItems = []
    let subtotal = 0

    for (const item of itemsToCheckout) {
      // Get current price from database (NOT from cart or client)
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      })

      if (!variant) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: `Product variant ${item.variantId} no longer exists` }
        })
      }

      if (!variant.product || variant.product.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: `Product "${variant.product?.name || 'Unknown'}" is no longer available` }
        })
      }

      // Check stock
      if (variant.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: `Insufficient stock for "${variant.product.name}"` }
        })
      }

      // Use DATABASE price, not client-sent price
      const price = Number(variant.price)
      const itemTotal = price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        price: price,
        total: itemTotal,
        cartItemId: item.cartItemId,
      })
    }

    // Calculate discounts server-side
    let discountAmount = 0
    for (const { discount } of cart.discounts) {
      // Re-validate discount is still valid
      const validDiscount = await prisma.discount.findFirst({
        where: {
          id: discount.id,
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        },
      })

      if (validDiscount) {
        const endsAt = validDiscount.endsAt
        if (!endsAt || endsAt >= new Date()) {
          if (validDiscount.type === 'percentage') {
            discountAmount += subtotal * (Number(validDiscount.value) / 100)
          } else if (validDiscount.type === 'fixed_amount') {
            discountAmount += Number(validDiscount.value)
          }
        }
      }
    }

    // Calculate totals server-side
    const shipping = 99 // Fixed shipping cost in INR
    const taxRate = 0.18 // 18% GST
    const taxableAmount = subtotal - discountAmount
    const tax = taxableAmount * taxRate
    const total = taxableAmount + tax + shipping

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create order with server-validated data
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user?.id,
        email,
        status: 'pending',
        paymentStatus: 'pending',
        fulfillmentStatus: 'unfulfilled',
        subtotal,
        discount: discountAmount,
        tax,
        shipping,
        total,
        currency: 'INR',
        shippingAddress: shippingAddress as object,
        items: {
          create: orderItems.map(item => ({
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    })

    // Update variant stock
    for (const item of orderItems) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { quantity: { decrement: item.quantity } },
      })
    }

    // Increment discount usage
    for (const { discount } of cart.discounts) {
      await prisma.discount.update({
        where: { id: discount.id },
        data: { usedCount: { increment: 1 } },
      })
    }

    // Remove checked out items from cart (or reduce quantity for partial checkout)
    for (const item of orderItems) {
      const cartItem = cart.items.find(ci => ci.id === item.cartItemId)
      if (cartItem) {
        if (item.quantity >= cartItem.quantity) {
          // Remove entire cart item
          await prisma.cartItem.delete({ where: { id: item.cartItemId } })
        } else {
          // Reduce quantity (partial item checkout)
          await prisma.cartItem.update({
            where: { id: item.cartItemId },
            data: { quantity: cartItem.quantity - item.quantity },
          })
        }
      }
    }

    // Check if cart is now empty
    const remainingItems = await prisma.cartItem.count({ where: { cartId: cart.id } })

    if (remainingItems === 0) {
      // Cart is empty - mark as converted
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'converted' },
      })
      // Also remove any discounts from the cart
      await prisma.cartDiscount.deleteMany({ where: { cartId: cart.id } })
    }
    // If items remain, cart stays active for future purchases

    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Checkout failed' } })
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err)

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large' })
    }
    return res.status(400).json({ success: false, error: err.message })
  }

  res.status(500).json({ success: false, error: 'Internal server error' })
})

// Start server
app.listen(config.port, () => {
  console.log(`🕯️  Wix and Wax server running on http://localhost:${config.port}`)
  console.log(`   Environment: ${config.nodeEnv}`)
})

export { app, prisma }
