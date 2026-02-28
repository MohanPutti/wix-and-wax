import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Wicks and Wax database...\n')

  // ── Roles ────────────────────────────────────────────────────────────────
  console.log('Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { id: uuidv4(), name: 'admin', description: 'Administrator with full access', isSystem: true },
  })

  await prisma.role.upsert({
    where: { name: 'customer' },
    update: {},
    create: { id: uuidv4(), name: 'customer', description: 'Regular customer', isSystem: true },
  })

  // ── Admin User ────────────────────────────────────────────────────────────
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@wixandwax.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@wixandwax.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { id: uuidv4(), userId: adminUser.id, roleId: adminRole.id },
  })

  // ── Wipe old data ─────────────────────────────────────────────────────────
  console.log('Clearing old categories and products...')
  await prisma.orderItem.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.productCategory.deleteMany({})
  await prisma.productImage.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  // ── Categories (matching nav slugs) ──────────────────────────────────────
  console.log('Creating categories...')

  const categoryDefs = [
    // SHOP
    { name: 'Jar Candles',          slug: 'jar-candles',         description: 'Hand-poured soy wax candles in beautiful glass jars' },
    { name: 'Scented Sachets',      slug: 'scented-sachets',     description: 'Fragrant fabric sachets for drawers, wardrobes and cars' },
    { name: 'Tealights',            slug: 'tealights',           description: 'Compact, versatile tealight candles for everyday use' },
    { name: 'Gift Boxes',           slug: 'gift-boxes',          description: 'Curated candle gift sets beautifully packaged' },
    { name: 'Custom Name Candles',  slug: 'custom-name-candles', description: 'Personalised candles engraved or printed with names' },
    // OCCASIONS
    { name: 'Birthdays',            slug: 'birthdays',           description: 'Fun and vibrant candles perfect for birthday celebrations' },
    { name: 'Baby Showers',         slug: 'baby-showers',        description: 'Soft, gentle fragrances to welcome the little one' },
    { name: 'Anniversaries',        slug: 'anniversaries',       description: 'Romantic candles to mark every special milestone' },
    { name: 'Housewarming',         slug: 'housewarming',        description: 'Warm, welcoming scents for a new home' },
    { name: 'Festivals',            slug: 'festivals',           description: 'Festive candles for Diwali, Christmas, Eid and more' },
    { name: 'Return Favors',        slug: 'return-favors',       description: 'Elegant mini candles as return gifts for guests' },
    // WEDDING & EVENTS
    { name: 'Wedding Favors',       slug: 'wedding-favors',      description: 'Bespoke wedding favor candles for your special day' },
    { name: 'Mehendi & Haldi',      slug: 'mehendi-haldi',       description: 'Colorful, fragrant candles for mehendi and haldi ceremonies' },
    { name: 'Bridal Shower',        slug: 'bridal-shower',       description: 'Luxurious candles for bridal shower celebrations' },
    { name: 'Save the Date',        slug: 'save-the-date',       description: 'Candle hampers that double as save the date keepsakes' },
    { name: 'Luxury Hampers',       slug: 'luxury-hampers',      description: 'Premium candle hampers for luxury event guests' },
    { name: 'Bulk Event Orders',    slug: 'bulk-events',         description: 'Wholesale candle orders for large-scale events' },
    // CORPORATE
    { name: 'Corporate Gifting',    slug: 'corporate',           description: 'Branded candle gifts for corporate relationships' },
    { name: 'Client Gifts',         slug: 'client-gifts',        description: 'Premium candles to delight valued clients' },
    { name: 'Welcome Kits',         slug: 'welcome-kits',        description: 'Candle-inclusive welcome kits for new employees' },
    { name: 'Festive Hampers',      slug: 'festive-hampers',     description: 'Seasonal festive hampers for teams and clients' },
    { name: 'Brand Candles',        slug: 'brand-candles',       description: 'Candles custom-labelled with your company branding' },
  ]

  const catMap: Record<string, string> = {} // slug → id
  for (let i = 0; i < categoryDefs.length; i++) {
    const cat = categoryDefs[i]
    const record = await prisma.category.create({
      data: { id: uuidv4(), ...cat, sortOrder: i },
    })
    catMap[cat.slug] = record.id
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  async function createProduct(
    name: string,
    slug: string,
    description: string,
    categorySlugs: string[],
    basePrice: number,   // small price in INR
  ) {
    const product = await prisma.product.create({
      data: { id: uuidv4(), name, slug, description, status: 'active' },
    })

    // Three size variants with INR pricing
    const skuBase = slug.toUpperCase().replace(/-/g, '_')
    const variants = [
      { name: 'Small (100g)',  sku: `${skuBase}_SM`, price: basePrice,                    qty: 50, isDefault: false },
      { name: 'Medium (200g)', sku: `${skuBase}_MD`, price: Math.round(basePrice * 1.7),  qty: 35, isDefault: true  },
      { name: 'Large (350g)',  sku: `${skuBase}_LG`, price: Math.round(basePrice * 2.6),  qty: 20, isDefault: false },
    ]

    for (const v of variants) {
      await prisma.productVariant.create({
        data: {
          id: uuidv4(),
          productId: product.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          quantity: v.qty,
          isDefault: v.isDefault,
          options: { size: v.name },
        },
      })
    }

    // Link categories
    for (const cs of categorySlugs) {
      if (catMap[cs]) {
        await prisma.productCategory.create({
          data: { id: uuidv4(), productId: product.id, categoryId: catMap[cs] },
        })
      }
    }

    return product
  }

  // ── Products ──────────────────────────────────────────────────────────────
  console.log('Creating products...')

  // SHOP — Jar Candles
  await createProduct('Sandalwood Serenity Jar', 'sandalwood-serenity-jar',
    'Rich sandalwood and warm amber poured into a handcrafted glass jar. Burns for up to 55 hours and fills any room with an earthy, grounding scent.',
    ['jar-candles', 'housewarming', 'corporate'], 349)

  await createProduct('Rose Oud Jar Candle', 'rose-oud-jar',
    'A luxurious blend of Bulgarian rose and aged oud wood. An opulent fragrance that transforms your space into a five-star sanctuary.',
    ['jar-candles', 'anniversaries', 'luxury-hampers'], 449)

  await createProduct('Mogra & Jasmine Jar', 'mogra-jasmine-jar',
    'The intoxicating scent of fresh mogra garlands combined with white jasmine. Pure, floral and unmistakably Indian.',
    ['jar-candles', 'mehendi-haldi', 'festivals'], 379)

  // SHOP — Scented Sachets
  await createProduct('Lavender Fields Sachet', 'lavender-fields-sachet',
    'Hand-filled linen sachets bursting with French lavender. Tuck them in drawers, wardrobes or cars for a continuous calming fragrance.',
    ['scented-sachets', 'return-favors', 'baby-showers'], 149)

  await createProduct('Citrus Burst Sachet', 'citrus-burst-sachet',
    'A zesty blend of lemon, grapefruit and sweet orange peel. Keeps wardrobes fresh and spirits lifted.',
    ['scented-sachets', 'return-favors', 'welcome-kits'], 149)

  await createProduct('Rose Petal Sachet Set', 'rose-petal-sachet-set',
    'A set of three organza sachets filled with dried rose petals and rose absolute. Beautiful as favour pouches at weddings.',
    ['scented-sachets', 'wedding-favors', 'bridal-shower'], 199)

  // SHOP — Tealights
  await createProduct('Vanilla Honey Tealights (Set of 12)', 'vanilla-honey-tealights',
    'Creamy vanilla swirled with raw honey — a comforting, crowd-pleasing scent. Each tealight burns up to 4 hours.',
    ['tealights', 'return-favors', 'festivals'], 249)

  await createProduct('Eucalyptus Spa Tealights (Set of 12)', 'eucalyptus-spa-tealights',
    'Crisp eucalyptus and spearmint that evoke a luxury spa experience right at home. Perfect for baths and meditation.',
    ['tealights', 'birthdays', 'welcome-kits'], 249)

  await createProduct('Diwali Festive Tealights (Set of 20)', 'diwali-festive-tealights',
    'A vibrant set of hand-dyed tealights in festive colours — marigold, crimson and gold — infused with saffron and amber fragrance.',
    ['tealights', 'festivals', 'return-favors'], 349)

  // SHOP — Gift Boxes
  await createProduct('Calm & Cosy Gift Box', 'calm-cosy-gift-box',
    'A curated set featuring a 200g lavender jar candle, two eucalyptus tealights and a linen sachet, nestled in a kraft gift box.',
    ['gift-boxes', 'birthdays', 'bridal-shower'], 699)

  await createProduct('Golden Glow Gift Box', 'golden-glow-gift-box',
    'Our bestselling combination: Rose Oud jar candle + 6 Vanilla tealights + a handwritten message card in a gold-foil box.',
    ['gift-boxes', 'anniversaries', 'luxury-hampers', 'client-gifts'], 999)

  await createProduct('New Home Blessing Box', 'new-home-blessing-box',
    'Three room-specific candles — bedroom, living room and kitchen — in a natural linen-wrapped box. The perfect housewarming gift.',
    ['gift-boxes', 'housewarming', 'corporate'], 1199)

  // SHOP — Custom Name Candles
  await createProduct('Personalised Name Jar Candle', 'personalised-name-jar',
    'Choose your favourite fragrance and we will hand-engrave your name or a short message on the glass jar. Makes every occasion unforgettable.',
    ['custom-name-candles', 'birthdays', 'anniversaries', 'wedding-favors'], 549)

  await createProduct('Couple Name Candle Duo', 'couple-name-candle-duo',
    'Two matching candles engraved with each partner\'s name — a heartfelt gift for weddings, engagements and anniversaries.',
    ['custom-name-candles', 'anniversaries', 'wedding-favors', 'save-the-date'], 899)

  await createProduct('Baby Name Soy Candle', 'baby-name-soy-candle',
    'A gentle soy wax candle in soft pastel packaging, personalised with the newborn\'s name and birth date. Fragrance: soft talc and vanilla.',
    ['custom-name-candles', 'baby-showers'], 499)

  // OCCASIONS — Birthdays
  await createProduct('Birthday Cake Candle', 'birthday-cake-candle',
    'Sweet buttercream, vanilla sponge and a hint of candied sprinkles — this candle smells exactly like a freshly baked birthday cake.',
    ['birthdays', 'gift-boxes'], 349)

  await createProduct('Party Glam Candle Set', 'party-glam-candle-set',
    'Three brightly coloured pillar candles in mango, strawberry and passionfruit scents. Adds colour and fragrance to any birthday table.',
    ['birthdays', 'return-favors'], 449)

  // OCCASIONS — Baby Showers
  await createProduct('Stork & Stars Baby Candle', 'stork-stars-baby-candle',
    'A cloud-shaped soy candle in white and pastel blue, scented with talcum powder and cotton flower. Safe, non-toxic and beautifully gifted.',
    ['baby-showers', 'gift-boxes'], 399)

  await createProduct('Sweet Lullaby Sachet Set', 'sweet-lullaby-sachet-set',
    'Three mini sachets — chamomile, lavender and vanilla — wrapped in muslin. Calming scents for nurseries and baby drawers.',
    ['baby-showers', 'scented-sachets'], 249)

  // OCCASIONS — Anniversaries
  await createProduct('Eternal Flame Duo', 'eternal-flame-duo',
    'Twin red pillar candles with entwined heart motif, scented with deep rose and amber. A classic romantic anniversary gift.',
    ['anniversaries', 'wedding-favors'], 599)

  await createProduct('Midnight Romance Candle', 'midnight-romance-candle',
    'Dark plum and black currant over a base of warm musk — a bold, seductive fragrance for candlelit evenings.',
    ['anniversaries', 'jar-candles'], 449)

  // OCCASIONS — Housewarming
  await createProduct('Fresh Start Home Candle', 'fresh-start-home-candle',
    'A clean, uplifting blend of lemongrass, basil and white tea. The ideal scent to welcome good energy into a new home.',
    ['housewarming', 'jar-candles'], 379)

  await createProduct('Earthy Nester Candle', 'earthy-nester-candle',
    'Warm vetiver, cedarwood and dry earth — a grounding, comforting scent that makes any house feel like home instantly.',
    ['housewarming', 'corporate'], 399)

  // OCCASIONS — Festivals
  await createProduct('Diwali Diya Candle Set', 'diwali-diya-set',
    'A set of 5 terracotta-style wax diyas scented with marigold and saffron. Brings the warmth of the festival of lights to any home.',
    ['festivals', 'tealights', 'return-favors'], 499)

  await createProduct('Christmas Spice Jar', 'christmas-spice-jar',
    'Cinnamon bark, clove and orange peel over a vanilla base — the unmistakable scent of a cosy Christmas morning.',
    ['festivals', 'jar-candles', 'gift-boxes'], 429)

  // OCCASIONS — Return Favors
  await createProduct('Mini Favour Tealight Box', 'mini-favour-tealight-box',
    'A set of 6 individually wrapped tealights in a kraft box — available in 5 fragrances. Minimum order 20 boxes.',
    ['return-favors', 'tealights', 'wedding-favors', 'bulk-events'], 199)

  await createProduct('Elegant Favour Sachet', 'elegant-favour-sachet',
    'Single-piece organza sachet filled with dried florals and fragrance beads. Ties with a satin ribbon and optional name tag.',
    ['return-favors', 'scented-sachets', 'wedding-favors'], 99)

  // WEDDING & EVENTS — Wedding Favors
  await createProduct('Bridal Bliss Favour Candle', 'bridal-bliss-favour',
    'A 50g votive candle in a frosted glass, scented with white rose and peony. Each one tied with ivory satin. Sold in sets of 10.',
    ['wedding-favors', 'bridal-shower', 'return-favors'], 799)

  await createProduct('Gold & Ivory Taper Set', 'gold-ivory-taper-set',
    'Set of 12 hand-dipped taper candles in ivory and gold — unscented for use at wedding tables and mandap ceremonies.',
    ['wedding-favors', 'mehendi-haldi'], 549)

  // WEDDING & EVENTS — Mehendi & Haldi
  await createProduct('Turmeric & Marigold Candle', 'turmeric-marigold-candle',
    'Inspired by the haldi ceremony — sunshine yellow wax with turmeric spice and marigold bloom fragrance. Cheerful and authentic.',
    ['mehendi-haldi', 'festivals'], 349)

  await createProduct('Mehndi Night Floral Candle', 'mehndi-night-floral',
    'Deep green wax infused with henna-inspired floral notes: rose, kewra and cool sandalwood. A beautiful centrepiece candle.',
    ['mehendi-haldi', 'jar-candles'], 399)

  // WEDDING & EVENTS — Bridal Shower
  await createProduct('Bubbly & Bliss Candle', 'bubbly-bliss-candle',
    'Prosecco, peach and pink lychee in a pastel pink jar. Light, playful and perfectly on-brand for bridal shower décor.',
    ['bridal-shower', 'birthdays'], 449)

  await createProduct('Bachelorette Gift Set', 'bachelorette-gift-set',
    'Three cheeky-labelled mini candles (\"Single AF\", \"Soon to be MRS\", \"The Best One\") in a ribbon-tied box.',
    ['bridal-shower', 'gift-boxes'], 699)

  // WEDDING & EVENTS — Save the Date
  await createProduct('Save the Date Hamper', 'save-the-date-hamper',
    'A kraft hamper with a personalised jar candle, two scented sachets and a card holder. Custom couple\'s name and date printed on each.',
    ['save-the-date', 'custom-name-candles', 'wedding-favors'], 1499)

  // WEDDING & EVENTS — Luxury Hampers
  await createProduct('Royal Luxury Candle Hamper', 'royal-luxury-hamper',
    'Three premium 350g jar candles — Rose Oud, Sandalwood & Amber, Tuberose Noir — in a velvet-lined black box with gold ribbon.',
    ['luxury-hampers', 'client-gifts', 'corporate'], 2999)

  await createProduct('Signature Spa Hamper', 'signature-spa-hamper',
    'Eucalyptus jar candle, lavender sachet set, bath salts and a reed diffuser — the ultimate luxury self-care hamper.',
    ['luxury-hampers', 'anniversaries', 'gift-boxes'], 2499)

  // WEDDING & EVENTS — Bulk Event Orders
  await createProduct('Event Bulk Tealight Pack (100 pcs)', 'bulk-tealight-pack',
    'Unscented or lightly scented tealights in bulk packs. Custom colour and minimal fragrance available. Perfect for decorating event venues.',
    ['bulk-events', 'tealights', 'wedding-favors'], 1499)

  // CORPORATE — Corporate Gifting
  await createProduct('Executive Desk Candle', 'executive-desk-candle',
    'A sleek 150g concrete-jar candle with subtle woody fragrance — Black Pepper & Cardamom. Minimal, modern and office-appropriate.',
    ['corporate', 'client-gifts', 'welcome-kits'], 499)

  await createProduct('Corporate Diwali Candle Gift', 'corporate-diwali-gift',
    'Branded Diwali gift: two jar candles (Saffron & Rose, Sandalwood) in a premium gift box with your company logo on the sleeve.',
    ['corporate', 'festive-hampers', 'festivals', 'brand-candles'], 899)

  // CORPORATE — Client Gifts
  await createProduct('Client Appreciation Candle Box', 'client-appreciation-box',
    'A curated box of three 100g candles with a handwritten note card. Scents: Oud, Jasmine, Vetiver. Minimum order 5.',
    ['client-gifts', 'corporate', 'gift-boxes'], 1299)

  // CORPORATE — Welcome Kits
  await createProduct('New Joiner Candle Kit', 'new-joiner-candle-kit',
    'A 100g desk candle + lavender sachet + a cheerful \"Welcome to the Team\" card in a branded kraft box. Bulk pricing available.',
    ['welcome-kits', 'corporate', 'scented-sachets'], 399)

  // CORPORATE — Festive Hampers
  await createProduct('Christmas Corporate Hamper', 'christmas-corporate-hamper',
    'Festive hamper with Christmas Spice jar candle, two vanilla tealights, a cinnamon sachet and artisanal chocolates.',
    ['festive-hampers', 'corporate', 'festivals', 'gift-boxes'], 1799)

  // CORPORATE — Brand Candles
  await createProduct('White-Label Brand Candle', 'white-label-brand-candle',
    'Custom-labelled soy candles in your choice of fragrance, jar style and label design. MOQ 50 units. Lead time 10 working days.',
    ['brand-candles', 'corporate', 'bulk-events'], 299)

  // ── Discount Codes ────────────────────────────────────────────────────────
  console.log('Creating discount codes...')
  await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      id: uuidv4(), code: 'WELCOME10', description: '10% off your first order',
      type: 'percentage', value: 10, isActive: true,
    },
  })

  await prisma.discount.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      id: uuidv4(), code: 'FREESHIP', description: 'Free shipping on orders over ₹999',
      type: 'free_shipping', value: 0, minPurchase: 999, isActive: true,
    },
  })

  const productCount = await prisma.product.count()
  const categoryCount = await prisma.category.count()

  console.log('\n✅ Seeding completed!')
  console.log('\n📋 Summary:')
  console.log(`   Admin: admin@wixandwax.com / admin123`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   Products: ${productCount}`)
  console.log(`   Discount codes: WELCOME10, FREESHIP`)
}

main()
  .catch((e) => { console.error('Error seeding database:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
