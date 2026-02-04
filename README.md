# Wix & Wax - Artisan Candle E-Commerce

A beautiful candle-selling e-commerce website with customer storefront and admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Headless UI |
| **Backend** | Express.js using core modules |
| **Database** | MySQL via Prisma |
| **Auth** | JWT (Google OAuth ready) |
| **File Upload** | Multer + local storage |

## Project Structure

```
apps/wix-and-wax/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # UI, layout, products, cart, admin
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Auth, Cart context
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── index.ts           # Main entry
│   │   ├── config.ts          # Environment config
│   │   └── seed.ts            # Seed candle data
│   └── package.json
│
├── uploads/                   # Product images
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+
- npm or yarn

### Setup

1. **Clone and install dependencies**

```bash
# From project root
cd apps/wix-and-wax

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

2. **Configure environment**

```bash
# From apps/wix-and-wax
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup database**

```bash
# From project root
npx prisma generate
npx prisma db push
```

4. **Seed the database**

```bash
cd apps/wix-and-wax/server
npm run seed
```

5. **Start development servers**

```bash
# Terminal 1 - Backend (from server/)
npm run dev

# Terminal 2 - Frontend (from client/)
npm run dev
```

6. **Open in browser**

- Customer Storefront: http://localhost:5173
- Admin Panel: http://localhost:5173/admin

## Default Credentials

After seeding, you can log in with:

- **Email:** admin@wixandwax.com
- **Password:** admin123

## Features

### Customer Storefront

- Home page with hero, featured products, and categories
- Product listing with filters (category, price)
- Product detail with variant selection
- Slide-out shopping cart
- Checkout flow with address form
- Order history and tracking
- User authentication (register/login)

### Admin Panel (`/admin`)

- Dashboard with sales stats and recent orders
- Product management (CRUD, variants, images)
- Category management
- Order management with status updates

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/me` - Get current user

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Cart
- `GET /api/cart` - Get current cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/:id/items/:itemId` - Update item quantity
- `DELETE /api/cart/:id/items/:itemId` - Remove item

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (admin)

### Upload
- `POST /api/upload` - Upload single image
- `POST /api/upload/multiple` - Upload multiple images

## Design Theme

- **Colors:** Warm amber/gold (#F59E0B), cream (#FFFBEB), dark brown (#78350F)
- **Typography:** Playfair Display (headings), Inter (body)
- **Style:** Minimal, cozy, premium feel

## Seed Data

The seed script creates:

- **Admin user:** admin@wixandwax.com
- **Categories:** Birthday, Anniversary, Relaxation, Holiday, Home Decor, Gifts
- **Products:** 10 sample candles with variants (small/medium/large)
- **Discount codes:** WELCOME10 (10% off), FREESHIP (free shipping over $50)

## Development

### Adding Product Images

Place images in the `uploads/` folder. Reference them in products as `/uploads/filename.jpg`.

### Building for Production

```bash
# Build client
cd client && npm run build

# Build server
cd server && npm run build
```

## License

MIT
