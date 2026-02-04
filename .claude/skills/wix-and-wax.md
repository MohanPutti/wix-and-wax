# Wix and Wax - E-commerce Candle Store

## Project Overview
A full-stack e-commerce application for selling candles, built on the modular order-management-system core (included as git submodule).

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Redux Toolkit + Tailwind CSS
- **Backend**: Express + TypeScript + Prisma + MySQL
- **State Management**: Redux Toolkit with redux-persist
- **Payments**: Razorpay (UPI, Cards, Netbanking)
- **Core**: order-management-system (git submodule at `./core`)

## Directory Structure

```
wix-and-wax/
├── core/                      # Git submodule → order-management-system
│   ├── src/modules/           # Reusable modules
│   │   ├── users/            # Authentication, JWT
│   │   ├── products/         # Product CRUD
│   │   ├── cart/             # Cart management
│   │   ├── orders/           # Order management
│   │   ├── discounts/        # Discount codes
│   │   └── payments/         # Payment adapters (Razorpay, Stripe)
│   └── prisma/schema.prisma  # Database schema
├── client/                    # React frontend
│   └── src/
│       ├── components/        # UI components
│       │   ├── ui/           # Button, Input, Spinner, Badge, etc.
│       │   ├── layout/       # Header, Footer, Layout, AdminLayout
│       │   ├── products/     # ProductCard, ProductGrid
│       │   └── cart/         # CartSidebar, CartItem
│       ├── pages/            # Route pages
│       │   ├── admin/        # Dashboard, Products, Orders, Categories
│       │   ├── Home.tsx
│       │   ├── Products.tsx
│       │   ├── ProductDetail.tsx
│       │   ├── Cart.tsx
│       │   ├── Checkout.tsx  # Razorpay payment integration
│       │   ├── Profile.tsx   # User profile with saved addresses
│       │   ├── Orders.tsx    # OrderList, OrderDetail, OrderConfirmation
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       ├── store/            # Redux store
│       │   ├── index.ts      # Store config with persist
│       │   ├── hooks.ts      # useAppDispatch, useAppSelector
│       │   └── slices/
│       │       ├── authSlice.ts
│       │       └── cartSlice.ts
│       ├── hooks/            # Custom hooks
│       │   ├── useProducts.ts  # useProducts, useProduct, useCategories
│       │   ├── useOrders.ts
│       │   └── useAddresses.ts
│       ├── services/
│       │   └── api.ts        # API client with payment methods
│       └── types/
│           └── index.ts      # TypeScript types
└── server/
    └── src/
        ├── index.ts          # Express server with custom endpoints
        ├── config.ts         # Environment configuration
        └── seed.ts           # Database seeding
```

## Core Module Imports

The server imports from the core submodule:
```typescript
import {
  setupUserModule,
  setupProductModule,
  setupCartModule,
  setupOrderModule,
  setupDiscountModule,
  createUserService,
} from '../../core/src/index.js'
import { createRazorpayAdapter } from '../../core/src/modules/payments/adapters/razorpay.js'
```

## Key Implementation Details

### Authentication
- JWT-based with access/refresh tokens
- Token stored in Redux with redux-persist
- API response: `{ data: { user, tokens: { accessToken } } }`

### Cart
- Session-based for guests, user-based for authenticated
- Guest carts transfer to user on login during checkout
- Prices fetched from database when items added
- Currency: INR (Indian Rupees)

### Secure Checkout (`POST /api/checkout`)
- Validates prices server-side (never trusts client prices)
- Supports partial checkout with `items` array
- Validates stock, discounts, product availability
- Calculates totals: subtotal, tax (18% GST), shipping (₹99)
- Removes checked-out items from cart
- Keeps cart active if items remain
- Handles guest cart → user transfer for logged-in users

### Payment Flow (Razorpay)
1. User completes checkout form and clicks "Pay ₹{total}"
2. Order is created with `paymentStatus: 'pending'`
3. `POST /api/payments/create-order` creates Razorpay order
4. Razorpay checkout modal opens (loads script dynamically)
5. On payment success, `POST /api/payments/verify` verifies signature
6. Order updated to `paymentStatus: 'paid'`, `status: 'confirmed'`
7. Redirect to order confirmation page

### Admin Product Form
- Supports both create (`/admin/products/new`) and edit (`/admin/products/:id`) modes
- Uses `useParams` to detect edit mode
- Uses `useProduct` hook to load existing data
- Form pre-populates in edit mode
- Calls `api.updateProduct()` or `api.createProduct()` accordingly

### Addresses
- CRUD endpoints at `/api/addresses`
- Supports shipping/billing types with default flag
- Used in checkout for saved address selection

## API Endpoints

### Custom (server/src/index.ts)
- `POST /api/checkout` - Secure checkout with server-side validation
- `POST /api/payments/create-order` - Creates Razorpay order
- `POST /api/payments/verify` - Verifies payment signature
- `GET/POST/PUT/DELETE /api/addresses` - Address management
- `POST /api/upload` - Single image upload
- `POST /api/upload/multiple` - Multiple images

### From Core Modules
- `/api/auth/*` - Login, register, logout
- `/api/products/*` - Product CRUD
- `/api/cart/*` - Cart operations
- `/api/orders/*` - Order management (use `PUT /api/orders/:id` for status)
- `/api/categories/*` - Category CRUD
- `/api/discounts/*` - Discount codes

## Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/wix_and_wax

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

## Running the App

```bash
# Server (from server/)
npm run dev

# Client (from client/)
npm run dev
```

## Common Issues & Solutions

1. **"Cart is empty" on checkout for logged-in users**: Checkout now checks both userId and sessionId to find guest carts
2. **"No token provided" on logout**: Logout thunk ignores API errors, clears token locally
3. **Token not persisting**: Use `onBeforeLift` in PersistGate to sync token to API client
4. **Product names showing "Product"**: Ensure Prisma includes `product: { include: { images: true } }` in cart queries
5. **Order fetch failing for guests**: Pass email query param for verification
6. **404 on order status update**: Use `PUT /orders/:id` not `/orders/:id/status`
7. **Payment modal not opening**: Ensure Razorpay env vars are set on server

## Updating Core Submodule

```bash
cd core
git pull origin main
cd ..
git add core
git commit -m "Update core submodule"
```

## Razorpay Fees
- UPI (GPay, PhonePe, Paytm): 0% (RBI mandated)
- Credit/Debit Cards: 2%
- Netbanking: ₹5-15 per transaction
- Wallets: ~1.9%
