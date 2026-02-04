import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Wix and Wax database...\n')

  // Create roles
  console.log('Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'admin',
      description: 'Administrator with full access',
      isSystem: true,
    },
  })

  const customerRole = await prisma.role.upsert({
    where: { name: 'customer' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'customer',
      description: 'Regular customer',
      isSystem: true,
    },
  })

  // Create admin user
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

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      id: uuidv4(),
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  // Create categories (occasions)
  console.log('Creating categories...')
  const categories = [
    { name: 'Birthday', slug: 'birthday', description: 'Perfect candles for birthday celebrations' },
    { name: 'Anniversary', slug: 'anniversary', description: 'Romantic candles for special moments' },
    { name: 'Relaxation', slug: 'relaxation', description: 'Soothing scents for self-care' },
    { name: 'Holiday', slug: 'holiday', description: 'Festive candles for seasonal celebrations' },
    { name: 'Home Decor', slug: 'home-decor', description: 'Beautiful candles to enhance your space' },
    { name: 'Gifts', slug: 'gifts', description: 'Thoughtful candle gifts for loved ones' },
  ]

  const categoryRecords: Record<string, any> = {}
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: uuidv4(),
        ...cat,
        sortOrder: categories.indexOf(cat),
      },
    })
    categoryRecords[cat.slug] = record
  }

  // Create products
  console.log('Creating products...')
  const products = [
    {
      name: 'Lavender Dreams',
      slug: 'lavender-dreams',
      description: 'Drift away with our calming lavender-infused candle. Made with pure lavender essential oil, this candle creates a peaceful atmosphere perfect for unwinding after a long day. Notes of fresh lavender fields and subtle vanilla undertones.',
      status: 'active',
      categories: ['relaxation', 'gifts'],
      variants: [
        { name: 'Small (4 oz)', sku: 'LAV-SM-001', price: 18.99, quantity: 50, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'LAV-MD-001', price: 28.99, quantity: 30, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'LAV-LG-001', price: 38.99, quantity: 20, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/lavender-dreams-1.jpg', '/uploads/lavender-dreams-2.jpg'],
    },
    {
      name: 'Birthday Celebration',
      slug: 'birthday-celebration',
      description: 'Make birthdays extra special with our festive celebration candle. A delightful blend of vanilla buttercream and sweet sugar notes that fills the room with the essence of birthday cake. Perfect for setting the mood for any celebration.',
      status: 'active',
      categories: ['birthday', 'gifts'],
      variants: [
        { name: 'Small (4 oz)', sku: 'BIR-SM-001', price: 19.99, quantity: 40, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'BIR-MD-001', price: 29.99, quantity: 25, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'BIR-LG-001', price: 39.99, quantity: 15, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/birthday-celebration-1.jpg'],
    },
    {
      name: 'Romantic Evening',
      slug: 'romantic-evening',
      description: 'Set the mood for romance with our sensual blend of rose petals, jasmine, and warm amber. This luxurious candle creates an intimate atmosphere with its soft, flickering glow and enchanting fragrance.',
      status: 'active',
      categories: ['anniversary', 'gifts'],
      variants: [
        { name: 'Small (4 oz)', sku: 'ROM-SM-001', price: 22.99, quantity: 35, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'ROM-MD-001', price: 34.99, quantity: 20, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'ROM-LG-001', price: 44.99, quantity: 10, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/romantic-evening-1.jpg', '/uploads/romantic-evening-2.jpg'],
    },
    {
      name: 'Winter Spice',
      slug: 'winter-spice',
      description: 'Embrace the warmth of the season with our cozy winter blend. Rich notes of cinnamon, clove, and orange peel combine with hints of vanilla and nutmeg to create a festive, comforting atmosphere.',
      status: 'active',
      categories: ['holiday', 'home-decor'],
      variants: [
        { name: 'Small (4 oz)', sku: 'WIN-SM-001', price: 20.99, quantity: 45, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'WIN-MD-001', price: 32.99, quantity: 30, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'WIN-LG-001', price: 42.99, quantity: 20, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/winter-spice-1.jpg'],
    },
    {
      name: 'Ocean Breeze',
      slug: 'ocean-breeze',
      description: 'Bring the refreshing essence of the sea into your home. Fresh notes of sea salt, driftwood, and marine accord create a clean, invigorating atmosphere reminiscent of coastal mornings.',
      status: 'active',
      categories: ['home-decor', 'relaxation'],
      variants: [
        { name: 'Small (4 oz)', sku: 'OCE-SM-001', price: 18.99, quantity: 55, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'OCE-MD-001', price: 28.99, quantity: 35, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'OCE-LG-001', price: 38.99, quantity: 25, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/ocean-breeze-1.jpg', '/uploads/ocean-breeze-2.jpg'],
    },
    {
      name: 'Fresh Linen',
      slug: 'fresh-linen',
      description: 'Experience the crisp, clean scent of freshly laundered linens. Soft cotton, light musk, and a touch of white tea create a pure, refreshing ambiance for any room.',
      status: 'active',
      categories: ['home-decor'],
      variants: [
        { name: 'Small (4 oz)', sku: 'LIN-SM-001', price: 17.99, quantity: 60, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'LIN-MD-001', price: 27.99, quantity: 40, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'LIN-LG-001', price: 37.99, quantity: 30, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/fresh-linen-1.jpg'],
    },
    {
      name: 'Autumn Harvest',
      slug: 'autumn-harvest',
      description: 'Celebrate the bounty of fall with warm apple, pumpkin, and maple notes. Brown sugar and cinnamon add depth to this cozy, inviting scent that captures the essence of harvest season.',
      status: 'active',
      categories: ['holiday', 'home-decor'],
      variants: [
        { name: 'Small (4 oz)', sku: 'AUT-SM-001', price: 19.99, quantity: 40, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'AUT-MD-001', price: 31.99, quantity: 25, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'AUT-LG-001', price: 41.99, quantity: 15, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/autumn-harvest-1.jpg'],
    },
    {
      name: 'Eucalyptus Mint',
      slug: 'eucalyptus-mint',
      description: 'Revitalize your senses with our invigorating eucalyptus and spearmint blend. Perfect for creating a spa-like atmosphere, this refreshing candle helps clear the mind and promote focus.',
      status: 'active',
      categories: ['relaxation', 'gifts'],
      variants: [
        { name: 'Small (4 oz)', sku: 'EUC-SM-001', price: 18.99, quantity: 50, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'EUC-MD-001', price: 28.99, quantity: 35, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'EUC-LG-001', price: 38.99, quantity: 20, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/eucalyptus-mint-1.jpg', '/uploads/eucalyptus-mint-2.jpg'],
    },
    {
      name: 'Vanilla Bean',
      slug: 'vanilla-bean',
      description: 'A timeless classic featuring rich Madagascar vanilla. Warm, sweet, and comforting, this candle fills your space with the irresistible aroma of pure vanilla bean with hints of brown sugar.',
      status: 'active',
      categories: ['home-decor', 'gifts'],
      variants: [
        { name: 'Small (4 oz)', sku: 'VAN-SM-001', price: 17.99, quantity: 65, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'VAN-MD-001', price: 27.99, quantity: 45, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'VAN-LG-001', price: 37.99, quantity: 30, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/vanilla-bean-1.jpg'],
    },
    {
      name: 'Midnight Rose',
      slug: 'midnight-rose',
      description: 'An elegant blend of Bulgarian rose, black currant, and patchouli. This sophisticated candle brings mystery and romance to any evening with its deep, alluring fragrance.',
      status: 'active',
      categories: ['anniversary', 'home-decor'],
      variants: [
        { name: 'Small (4 oz)', sku: 'MID-SM-001', price: 24.99, quantity: 30, options: { size: 'small', weight: '4oz' } },
        { name: 'Medium (8 oz)', sku: 'MID-MD-001', price: 36.99, quantity: 20, options: { size: 'medium', weight: '8oz' }, isDefault: true },
        { name: 'Large (12 oz)', sku: 'MID-LG-001', price: 48.99, quantity: 10, options: { size: 'large', weight: '12oz' } },
      ],
      images: ['/uploads/midnight-rose-1.jpg', '/uploads/midnight-rose-2.jpg'],
    },
  ]

  for (const productData of products) {
    const { variants, categories: productCategories, images, ...product } = productData

    // Create or update product
    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: {
        id: uuidv4(),
        ...product,
      },
    })

    // Create variants
    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          name: variant.name,
          price: variant.price,
          quantity: variant.quantity,
          options: variant.options,
          isDefault: variant.isDefault || false,
        },
        create: {
          id: uuidv4(),
          productId: createdProduct.id,
          ...variant,
          isDefault: variant.isDefault || false,
        },
      })
    }

    // Link categories
    for (const catSlug of productCategories) {
      const category = categoryRecords[catSlug]
      if (category) {
        const existingLink = await prisma.productCategory.findFirst({
          where: {
            productId: createdProduct.id,
            categoryId: category.id,
          },
        })

        if (!existingLink) {
          await prisma.productCategory.create({
            data: {
              id: uuidv4(),
              productId: createdProduct.id,
              categoryId: category.id,
            },
          })
        }
      }
    }

    // Create images
    for (let i = 0; i < images.length; i++) {
      const existingImage = await prisma.productImage.findFirst({
        where: {
          productId: createdProduct.id,
          url: images[i],
        },
      })

      if (!existingImage) {
        await prisma.productImage.create({
          data: {
            id: uuidv4(),
            productId: createdProduct.id,
            url: images[i],
            alt: `${product.name} - Image ${i + 1}`,
            sortOrder: i,
          },
        })
      }
    }
  }

  // Create a sample discount code
  console.log('Creating discount codes...')
  await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      id: uuidv4(),
      code: 'WELCOME10',
      description: '10% off your first order',
      type: 'percentage',
      value: 10,
      isActive: true,
    },
  })

  await prisma.discount.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      id: uuidv4(),
      code: 'FREESHIP',
      description: 'Free shipping on orders over $50',
      type: 'free_shipping',
      value: 0,
      minPurchase: 50,
      isActive: true,
    },
  })

  console.log('\n✅ Seeding completed!')
  console.log('\n📋 Summary:')
  console.log(`   - Admin user: admin@wixandwax.com / admin123`)
  console.log(`   - Categories: ${categories.length}`)
  console.log(`   - Products: ${products.length}`)
  console.log(`   - Discount codes: WELCOME10, FREESHIP`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
