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
  setupNotificationModule,
  createUserService,
  createCartService,
  createNotificationService,
} from '../../core/src/index.js'
import { createRazorpayAdapter } from '../../core/src/modules/payments/adapters/razorpay.js'
import { createPhonePeAdapter } from '../../core/src/modules/payments/adapters/phonepe.js'
import { createSMTPAdapter, gmailConfig } from '../../core/src/modules/notifications/adapters/smtp.js'

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

// Notification service — persists to DB, tracks sent/failed, supports retry via admin API
const smtpAdapter = config.smtpUser && config.smtpPass
  ? createSMTPAdapter(gmailConfig(config.smtpUser, config.smtpPass, config.smtpFrom || config.smtpUser))
  : null

const notificationService = createNotificationService(prisma, {
  adapters: smtpAdapter ? { email: smtpAdapter } : {},
})

// Setup core modules
app.use('/api', setupUserModule({
  prisma,
  jwtSecret: config.jwtSecret,
  frontendUrl: config.frontendUrl,
  google: config.googleClientId && config.googleClientSecret ? {
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleCallbackUrl,
    scopes: ['openid', 'email', 'profile'],
  } : undefined,
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

app.use('/api', setupNotificationModule({
  prisma,
  verifyToken,
  adapters: smtpAdapter ? { email: smtpAdapter } : undefined,
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

// ============================================================
// SHIPROCKET INTEGRATION
// ============================================================

const WEIGHT_PER_ITEM_KG = 0.5 // default weight per item
const FALLBACK_SHIPPING = 99   // used when Shiprocket is unconfigured or fails

let shiprocketToken: string | null = null
let shiprocketTokenExpiry: number = 0

async function getShiprocketToken(): Promise<string | null> {
  if (!config.shiprocketEmail || !config.shiprocketPassword) return null
  if (shiprocketToken && Date.now() < shiprocketTokenExpiry) return shiprocketToken

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: config.shiprocketEmail, password: config.shiprocketPassword }),
    })
    const data = await res.json() as { token?: string }
    if (data.token) {
      shiprocketToken = data.token
      shiprocketTokenExpiry = Date.now() + 23 * 60 * 60 * 1000 // refresh 1h before expiry
      return shiprocketToken
    }
  } catch (err) {
    console.error('[Shiprocket] Auth failed:', err)
  }
  return null
}

async function getShiprocketRate(deliveryPincode: string, totalItems: number): Promise<number> {
  if (!config.storePincode) return FALLBACK_SHIPPING
  const token = await getShiprocketToken()
  if (!token) return FALLBACK_SHIPPING

  const weight = Math.max(0.5, totalItems * WEIGHT_PER_ITEM_KG)
  const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${config.storePincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=0`

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json() as {
      data?: {
        available_courier_companies?: Array<{ freight_charge: number; courier_name: string }>
        cheapest_courier?: { freight_charge: number }
      }
      status?: number
    }

    if (data?.status === 200 && data.data?.available_courier_companies?.length) {
      // Use cheapest available courier
      const sorted = [...data.data.available_courier_companies].sort((a, b) => a.freight_charge - b.freight_charge)
      return Math.round(sorted[0].freight_charge)
    }
  } catch (err) {
    console.error('[Shiprocket] Rate fetch failed:', err)
  }
  return FALLBACK_SHIPPING
}

// Public endpoint — client calls this when pincode is entered
app.get('/api/shipping/rates', async (req, res) => {
  const { pincode, items } = req.query as { pincode?: string; items?: string }
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ success: false, error: 'Valid 6-digit pincode required' })
  }
  const itemCount = Math.max(1, parseInt(items || '1', 10))
  const rate = await getShiprocketRate(pincode, itemCount)
  const isConfigured = !!(config.shiprocketEmail && config.storePincode)
  res.json({ success: true, data: { rate, isEstimate: !isConfigured } })
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

// Cart service instance for custom routes
const cartService = createCartService(prisma, { expirationDays: 30, defaultCurrency: 'INR' })

// Merge guest cart into authenticated user's cart on login/register
app.post('/api/cart/merge', requireAuth, async (req, res) => {
  try {
    const userId = (req as express.Request & { user?: { id: string } }).user!.id
    const sessionId = req.headers['x-session-id'] as string | undefined

    if (!sessionId) {
      const userCart = await cartService.getOrCreate(userId)
      return res.json({ success: true, data: userCart })
    }

    const guestCart = await cartService.findBySessionId(sessionId)
    if (!guestCart || guestCart.items.length === 0) {
      const userCart = await cartService.getOrCreate(userId)
      return res.json({ success: true, data: userCart })
    }

    const mergedCart = await cartService.mergeGuestCart(guestCart.id, userId)
    res.json({ success: true, data: mergedCart })
  } catch (error) {
    console.error('Error merging cart:', error)
    res.status(500).json({ success: false, error: 'Failed to merge cart' })
  }
})

// ============================================================
// CATALOG MANAGEMENT - Bases, Fragrances, Colors
// ============================================================

// --- ProductBase ---
app.get('/api/bases', async (_req, res) => {
  try {
    const bases = await prisma.productBase.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: bases })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bases' })
  }
})

app.post('/api/bases', requireAuth, async (req, res) => {
  try {
    const { name, sizes } = req.body as { name: string; sizes: string[] }
    const base = await prisma.productBase.create({ data: { id: uuidv4(), name, sizes } })
    res.json({ success: true, data: base })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create base' })
  }
})

app.put('/api/bases/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { name, sizes } = req.body as { name: string; sizes: string[] }
    const base = await prisma.productBase.update({ where: { id }, data: { name, sizes } })
    res.json({ success: true, data: base })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update base' })
  }
})

app.delete('/api/bases/:id', requireAuth, async (req, res) => {
  try {
    await prisma.productBase.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete base' })
  }
})

// --- Fragrances ---
app.get('/api/fragrances', async (_req, res) => {
  try {
    const fragrances = await prisma.fragrance.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: fragrances })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch fragrances' })
  }
})

app.post('/api/fragrances', requireAuth, async (req, res) => {
  try {
    const { name } = req.body as { name: string }
    const fragrance = await prisma.fragrance.create({ data: { id: uuidv4(), name } })
    res.json({ success: true, data: fragrance })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create fragrance' })
  }
})

app.delete('/api/fragrances/:id', requireAuth, async (req, res) => {
  try {
    await prisma.fragrance.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete fragrance' })
  }
})

// --- Colors ---
app.get('/api/colors', async (_req, res) => {
  try {
    const colors = await prisma.color.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: colors })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch colors' })
  }
})

app.post('/api/colors', requireAuth, async (req, res) => {
  try {
    const { name, hex } = req.body as { name: string; hex?: string }
    const color = await prisma.color.create({ data: { id: uuidv4(), name, hex } })
    res.json({ success: true, data: color })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create color' })
  }
})

app.delete('/api/colors/:id', requireAuth, async (req, res) => {
  try {
    await prisma.color.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete color' })
  }
})

// --- Packaging ---
app.get('/api/packaging', async (_req, res) => {
  try {
    const packaging = await prisma.packaging.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: packaging })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch packaging' })
  }
})

app.post('/api/packaging', requireAuth, async (req, res) => {
  try {
    const { name } = req.body as { name: string }
    const pkg = await prisma.packaging.create({ data: { id: uuidv4(), name } })
    res.json({ success: true, data: pkg })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create packaging' })
  }
})

app.delete('/api/packaging/:id', requireAuth, async (req, res) => {
  try {
    await prisma.packaging.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete packaging' })
  }
})

// --- Customisations ---
app.get('/api/customisations', async (_req, res) => {
  try {
    const customisations = await prisma.customisation.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: customisations })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customisations' })
  }
})

app.post('/api/customisations', requireAuth, async (req, res) => {
  try {
    const { name } = req.body as { name: string }
    const c = await prisma.customisation.create({ data: { id: uuidv4(), name } })
    res.json({ success: true, data: c })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create customisation' })
  }
})

app.delete('/api/customisations/:id', requireAuth, async (req, res) => {
  try {
    await prisma.customisation.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete customisation' })
  }
})

// ============================================================
// ADMIN MANUAL ORDER CREATION
// ============================================================

app.post('/api/admin/orders', requireAuth, async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      shippingAddress,
      items,
      status = 'confirmed',
      paymentStatus = 'paid',
      notes,
    } = req.body as {
      email: string
      firstName: string
      lastName: string
      phone?: string
      shippingAddress: {
        address1: string
        address2?: string
        city: string
        state?: string
        postalCode: string
        country: string
      }
      items: Array<{
        variantId?: string
        productName: string
        variantName?: string
        sku?: string
        quantity: number
        price: number
      }>
      status?: string
      paymentStatus?: string
      notes?: string
    }

    if (!email || !items?.length) {
      return res.status(400).json({ success: false, error: 'Email and at least one item are required' })
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        status,
        paymentStatus,
        fulfillmentStatus: 'unfulfilled',
        subtotal,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: subtotal,
        currency: 'INR',
        shippingAddress: {
          firstName,
          lastName,
          phone: phone || '',
          ...shippingAddress,
        } as object,
        notes,
        metadata: { source: 'manual' } as object,
        items: {
          create: items.map(item => ({
            variantId: item.variantId || null,
            productName: item.productName,
            variantName: item.variantName || null,
            sku: item.sku || null,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.price) * Number(item.quantity),
          })),
        },
      },
      include: { items: true },
    })

    res.json({ success: true, data: order })
  } catch (err) {
    console.error('Manual order creation error:', err)
    res.status(500).json({ success: false, error: 'Failed to create order' })
  }
})

// ============================================================
// INVENTORY MANAGEMENT
// ============================================================

app.get('/api/inventory/types', async (_req, res) => {
  try {
    const types = await prisma.inventoryType.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: types })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory types' })
  }
})

app.post('/api/inventory/types', requireAuth, async (req, res) => {
  try {
    const { name, unit } = req.body as { name: string; unit?: string }
    const type = await prisma.inventoryType.create({
      data: { id: uuidv4(), name: name.trim(), unit: unit?.trim() || null },
    })
    res.json({ success: true, data: type })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create inventory type' })
  }
})

app.delete('/api/inventory/types/:id', requireAuth, async (req, res) => {
  try {
    await prisma.inventoryType.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch {
    res.status(409).json({ success: false, error: 'Delete all entries for this type first' })
  }
})

app.get('/api/inventory/entries', async (_req, res) => {
  try {
    const entries = await prisma.inventoryEntry.findMany({
      orderBy: { date: 'desc' },
      include: { type: { select: { id: true, name: true, unit: true } } },
    })
    res.json({ success: true, data: entries })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory entries' })
  }
})

app.post('/api/inventory/entries', requireAuth, async (req, res) => {
  try {
    const { typeId, quantity, pricePerUnit, note, date } =
      req.body as { typeId: string; quantity: number; pricePerUnit: number; note?: string; date?: string }
    const totalCost = quantity * pricePerUnit
    const entry = await prisma.inventoryEntry.create({
      data: {
        id: uuidv4(),
        typeId,
        quantity,
        pricePerUnit,
        totalCost,
        note: note?.trim() || null,
        date: date ? new Date(date) : new Date(),
      },
      include: { type: { select: { id: true, name: true, unit: true } } },
    })
    res.json({ success: true, data: entry })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create inventory entry' })
  }
})

app.delete('/api/inventory/entries/:id', requireAuth, async (req, res) => {
  try {
    await prisma.inventoryEntry.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: { id: req.params.id } })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete inventory entry' })
  }
})

app.get('/api/inventory/summary', async (_req, res) => {
  try {
    const totals = await prisma.inventoryEntry.aggregate({ _sum: { totalCost: true } })
    const totalInvested = Number(totals._sum.totalCost ?? 0)

    const types = await prisma.inventoryType.findMany({ select: { id: true } })
    let currentValue = 0
    for (const t of types) {
      const qtyAgg = await prisma.inventoryEntry.aggregate({
        where: { typeId: t.id },
        _sum: { quantity: true },
      })
      const currentQty = Number(qtyAgg._sum.quantity ?? 0)
      if (currentQty <= 0) continue
      const latestEntry = await prisma.inventoryEntry.findFirst({
        where: { typeId: t.id },
        orderBy: { date: 'desc' },
        select: { pricePerUnit: true },
      })
      if (latestEntry) currentValue += currentQty * Number(latestEntry.pricePerUnit)
    }

    res.json({ success: true, data: { totalInvested, currentValue } })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to compute inventory summary' })
  }
})

// Sync product images directly via Prisma (bypasses core URL validation)
app.put('/api/products/:id/images/sync', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { urls } = req.body as { urls: string[] }

    if (!Array.isArray(urls)) {
      return res.status(400).json({ success: false, error: 'urls must be an array' })
    }

    await prisma.productImage.deleteMany({ where: { productId: id } })

    const created = await Promise.all(
      urls.map((url, i) =>
        prisma.productImage.create({
          data: { id: uuidv4(), productId: id, url, alt: '', sortOrder: i },
        })
      )
    )

    res.json({ success: true, data: created })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to sync images' })
  }
})

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

// Initialize payment adapters
const razorpay = config.razorpayKeyId && config.razorpayKeySecret
  ? createRazorpayAdapter({
      keyId: config.razorpayKeyId,
      keySecret: config.razorpayKeySecret,
      webhookSecret: config.razorpayWebhookSecret,
    })
  : null

const phonepe = config.phonePeMerchantId && config.phonePeSaltKey
  ? createPhonePeAdapter({
      merchantId: config.phonePeMerchantId,
      saltKey: config.phonePeSaltKey,
      saltIndex: config.phonePeSaltIndex,
      environment: config.phonePeEnvironment,
      callbackUrl: config.phonePeCallbackUrl,
      redirectUrl: config.phonePeRedirectUrl,
    })
  : null

// Use PhonePe as primary, fallback to Razorpay
const paymentAdapter = phonepe || razorpay

// Create payment order (PhonePe or Razorpay)
app.post('/api/payments/create-order', optionalAuth, async (req, res) => {
  if (!paymentAdapter) {
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

    // Create payment with adapter (PhonePe or Razorpay)
    const payment = await paymentAdapter.createPayment({
      orderId: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency,
      metadata: { orderId: order.id },
      customerEmail: order.email,
    })

    // Store payment provider ID for verification
    const paymentData = phonepe ? {
      phonePeTransactionId: payment.providerPaymentId,
      redirectUrl: payment.redirectUrl,
    } : {
      razorpayOrderId: payment.orderId,
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { notes: JSON.stringify(paymentData) },
    })

    // Return appropriate response based on adapter
    if (phonepe) {
      res.json({
        success: true,
        data: {
          provider: 'phonepe',
          transactionId: payment.providerPaymentId,
          redirectUrl: payment.redirectUrl,
          amount: payment.amount,
          currency: payment.currency,
        },
      })
    } else {
      res.json({
        success: true,
        data: {
          provider: 'razorpay',
          razorpayOrderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          keyId: config.razorpayKeyId,
        },
      })
    }
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

    // Get order with items to process cart cleanup
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
    }

    // Parse cart info from order notes
    let cartInfo: { cartId?: string; cartItems?: Array<{ cartItemId: string; variantId: string; quantity: number }>; discountIds?: string[] } = {}
    try {
      if (order.notes) {
        cartInfo = JSON.parse(order.notes as string)
      }
    } catch (e) {
      console.error('Failed to parse order notes:', e)
    }

    // Update stock quantities
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { quantity: { decrement: item.quantity } },
      })
    }

    // Increment discount usage
    if (cartInfo.discountIds && cartInfo.discountIds.length > 0) {
      for (const discountId of cartInfo.discountIds) {
        await prisma.discount.update({
          where: { id: discountId },
          data: { usedCount: { increment: 1 } },
        }).catch(() => {
          // Ignore if discount doesn't exist
        })
      }
    }

    // Remove items from cart (or reduce quantity for partial checkout)
    if (cartInfo.cartId && cartInfo.cartItems) {
      for (const item of cartInfo.cartItems) {
        const cartItem = await prisma.cartItem.findUnique({ where: { id: item.cartItemId } })
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
      const remainingItems = await prisma.cartItem.count({ where: { cartId: cartInfo.cartId } })

      if (remainingItems === 0) {
        // Cart is empty - mark as converted
        await prisma.cart.update({
          where: { id: cartInfo.cartId },
          data: { status: 'converted' },
        })
        // Also remove any discounts from the cart
        await prisma.cartDiscount.deleteMany({ where: { cartId: cartInfo.cartId } })
      }
    }

    // Update order payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
        notes: JSON.stringify({
          ...cartInfo,
          razorpayOrderId,
          razorpayPaymentId,
          paidAt: new Date().toISOString(),
        }),
      },
    })

    res.json({ success: true, data: { order: updatedOrder } })

    // Send order confirmation emails via NotificationService (persisted, retryable)
    const addr = (order.shippingAddress as Record<string, string>) || {}
    const trackingUrl = `${config.frontendUrl}/order-confirmation/${order.orderNumber}?email=${encodeURIComponent(order.email)}`
    const adminOrderUrl = `${config.frontendUrl}/admin/orders/${order.id}`
    const itemsHtml = order.items.map((item: { productName: string; variantName?: string | null; quantity: number; total: unknown }) =>
      `<tr><td style="padding:8px 0;border-bottom:1px solid #f3ede8;">${item.productName}${item.variantName ? ` – ${item.variantName}` : ''}</td><td style="padding:8px 0;border-bottom:1px solid #f3ede8;text-align:center;">${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f3ede8;text-align:right;">₹${Number(item.total).toFixed(2)}</td></tr>`
    ).join('')

    const customerHtml = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf9;padding:32px;color:#3d2c1e;"><h1 style="font-size:24px;margin-bottom:4px;">Order Confirmed</h1><p style="color:#7c5c44;margin-bottom:24px;">Thank you for your order! We're getting it ready.</p><p style="margin-bottom:16px;"><strong>Order #${order.orderNumber}</strong></p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><thead><tr style="border-bottom:2px solid #e8d9cc;"><th style="text-align:left;padding-bottom:8px;">Item</th><th style="text-align:center;padding-bottom:8px;">Qty</th><th style="text-align:right;padding-bottom:8px;">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><table style="width:100%;margin-bottom:24px;">${Number(order.discount) > 0 ? `<tr><td style="color:#7c5c44;">Discount</td><td style="text-align:right;color:#16a34a;">-₹${Number(order.discount).toFixed(2)}</td></tr>` : ''}<tr><td style="color:#7c5c44;">Shipping</td><td style="text-align:right;">₹${Number(order.shipping).toFixed(2)}</td></tr><tr style="font-size:18px;font-weight:bold;"><td>Total</td><td style="text-align:right;">₹${Number(order.total).toFixed(2)}</td></tr></table><p style="margin-bottom:4px;"><strong>Shipping to:</strong></p><p style="color:#7c5c44;margin-bottom:24px;">${addr.firstName} ${addr.lastName}, ${addr.address1}, ${addr.city}, ${addr.state} ${addr.postalCode}</p><a href="${trackingUrl}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Track Your Order</a></div>`

    const adminHtml = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;color:#3d2c1e;"><h1 style="font-size:20px;">New Order – #${order.orderNumber}</h1><p><strong>Customer:</strong> ${order.email}</p><p><strong>Total:</strong> ₹${Number(order.total).toFixed(2)}</p><p><strong>Ship to:</strong> ${addr.firstName} ${addr.lastName}, ${addr.address1}, ${addr.city}, ${addr.state} ${addr.postalCode}</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr><th style="text-align:left;">Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><a href="${adminOrderUrl}" style="display:inline-block;background:#d97706;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">View Order in Admin</a></div>`

    notificationService.send({ type: 'email', recipient: order.email, subject: `Order Confirmed – #${order.orderNumber}`, content: customerHtml }).catch(() => {})
    if (config.adminEmail) {
      notificationService.send({ type: 'email', recipient: config.adminEmail, subject: `New Order – #${order.orderNumber} from ${order.email}`, content: adminHtml }).catch(() => {})
    }
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
      items: selectedItems, // Optional: Array<{ variantId: string, quantity: number }>
      orderNotes: customerOrderNotes,
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
    type CheckoutItem = { variantId: string; quantity: number; cartItemId: string; metadata?: object | null }
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
          metadata: cartItem.metadata as object | null,
        })
      }
    } else {
      // Full cart checkout
      itemsToCheckout = cart.items.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        cartItemId: item.id,
        metadata: item.metadata as object | null,
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
        metadata: item.metadata,
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
    const deliveryPincode = (shippingAddress as { postalCode?: string })?.postalCode || ''
    const shipping = deliveryPincode
      ? await getShiprocketRate(deliveryPincode, orderItems.length)
      : FALLBACK_SHIPPING
    const ENABLE_GST = false // Set to true to apply 18% GST
    const taxRate = ENABLE_GST ? 0.18 : 0
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
        ...(customerOrderNotes ? { metadata: { customerNotes: customerOrderNotes } } : {}),
        items: {
          create: orderItems.map(item => ({
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            ...(item.metadata ? { metadata: item.metadata as object } : {}),
          })),
        },
      },
      include: { items: true },
    })

    // NOTE: Stock reduction and cart cleanup moved to payment verification
    // Items stay in cart until payment succeeds - if payment fails, user can try again

    // Store cart info in order notes for payment verification
    const orderNotes = {
      cartId: cart.id,
      cartItems: orderItems.map(item => ({
        cartItemId: item.cartItemId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      discountIds: cart.discounts.map(d => d.discount.id),
    }

    // Update order with cart reference
    await prisma.order.update({
      where: { id: order.id },
      data: { notes: JSON.stringify(orderNotes) },
    })

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
  console.log(`🕯️  Wicks and Wax server running on http://localhost:${config.port}`)
  console.log(`   Environment: ${config.nodeEnv}`)
})

export { app, prisma }
