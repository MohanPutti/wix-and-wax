# Wix & Wax - Artisan Candle E-Commerce

A full-stack e-commerce application for selling artisan candles, built on the modular [order-management-system](https://github.com/MohanPutti/order-management-system) core.

## Architecture

```
wix-and-wax/
├── core/                      # Git submodule → order-management-system
│   ├── src/modules/           # Reusable modules (users, products, cart, orders, payments)
│   └── prisma/schema.prisma   # Database schema
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # UI, layout, products, cart, admin
│   │   ├── pages/             # Route pages
│   │   ├── store/             # Redux Toolkit store
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript types
│   └── package.json
├── server/                    # Express Backend
│   ├── src/
│   │   ├── index.ts           # Main entry + custom endpoints
│   │   ├── config.ts          # Environment config
│   │   └── seed.ts            # Seed candle data
│   └── package.json
└── uploads/                   # Product images
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Redux Toolkit |
| **Styling** | Tailwind CSS + Headless UI |
| **Backend** | Express.js using core modules |
| **Database** | MySQL via Prisma |
| **Auth** | JWT (stored in Redux with redux-persist) |
| **Payments** | Razorpay (UPI, Cards, Netbanking) |
| **File Upload** | Multer + local storage |

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+
- npm

### Setup

1. **Clone with submodules**

```bash
git clone --recursive https://github.com/MohanPutti/wix-and-wax.git
cd wix-and-wax

# If already cloned without --recursive:
git submodule update --init --recursive
```

2. **Install dependencies**

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install

# Core (for Prisma)
cd ../core && npm install
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your database credentials and Razorpay keys
```

4. **Setup database**

```bash
cd core
npx prisma generate
npx prisma db push
```

5. **Seed the database**

```bash
cd ../server
npm run seed
```

6. **Start development servers**

```bash
# Terminal 1 - Backend (from server/)
npm run dev

# Terminal 2 - Frontend (from client/)
npm run dev
```

7. **Open in browser**

- Customer Storefront: http://localhost:5173
- Admin Panel: http://localhost:5173/admin

## Default Credentials

After seeding:
- **Email:** admin@wixandwax.com
- **Password:** admin123

## Features

### Customer Storefront
- Home page with hero, featured products, categories
- Product listing with filters (category, price)
- Product detail with variant selection
- Slide-out shopping cart
- Secure checkout with Razorpay payment
- Saved addresses for logged-in users
- Order history and tracking
- User authentication (register/login)

### Admin Panel (`/admin`)
- Dashboard with sales stats and recent orders
- Product management (CRUD, variants, images, edit mode)
- Category management
- Order management with status updates

### Payment Integration (Razorpay)
- UPI (GPay, PhonePe, Paytm) - 0% fee
- Credit/Debit Cards - 2% fee
- Netbanking, Wallets
- Server-side signature verification

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

# Razorpay (optional)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

## API Endpoints

### Custom Endpoints (server/src/index.ts)
- `POST /api/checkout` - Secure checkout with server-side price validation
- `POST /api/payments/create-order` - Create Razorpay payment order
- `POST /api/payments/verify` - Verify Razorpay payment signature
- `GET/POST/PUT/DELETE /api/addresses` - User address management
- `POST /api/upload` - Single image upload
- `POST /api/upload/multiple` - Multiple image upload

### From Core Modules
- `/api/auth/*` - Authentication (login, register, logout)
- `/api/products/*` - Product CRUD
- `/api/cart/*` - Cart operations
- `/api/orders/*` - Order management
- `/api/categories/*` - Category CRUD
- `/api/discounts/*` - Discount codes

## Design Theme

- **Colors:** Warm amber/gold (#F59E0B), cream (#FFFBEB), dark brown (#78350F)
- **Typography:** Playfair Display (headings), Inter (body)
- **Currency:** INR (Indian Rupees)
- **Tax:** 18% GST
- **Shipping:** ₹99 flat rate

## Updating Core Submodule

```bash
cd core
git pull origin main
cd ..
git add core
git commit -m "Update core submodule"
```

## License

MIT
