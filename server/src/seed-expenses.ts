// ============================================
// Expense Backfill Seed Script
// Run once: npx tsx src/seed-expenses.ts
// ============================================

import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// ============================================
// Expense Types
// ============================================

const expenseTypes = ['Raw Materials', 'Packaging', 'Labour']

// ============================================
// Expense Data
// ============================================

const expenses = [
  // May 2025
  { date: '2025-05-30', amount: 114164, name: 'Bulk Purchases', type: 'Raw Materials' },
  // June 2025
  { date: '2025-06-30', amount: 58535,  name: 'Bulk Purchases', type: 'Raw Materials' },
  // July 2025
  { date: '2025-07-30', amount: 78445,  name: 'Bulk Purchases', type: 'Raw Materials' },
  // August 2025
  { date: '2025-08-03', amount: 24450,  name: 'Bulk Purchases',                              type: 'Raw Materials' },
  { date: '2025-08-15', amount: 31181,  name: 'Bulk Purchases',                              type: 'Raw Materials' },
  { date: '2025-08-21', amount: 554,    name: 'Fragile tape',                                type: 'Packaging'     },
  { date: '2025-08-22', amount: 4450,   name: 'Packing',                                     type: 'Packaging'     },
  { date: '2025-08-22', amount: 6000,   name: 'Moulds + Fragrances + Parrafin wax',          type: 'Raw Materials' },
  { date: '2025-08-22', amount: 5086,   name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-08-22', amount: 600,    name: 'Ribbons',                                     type: 'Packaging'     },
  { date: '2025-08-26', amount: 1300,   name: 'Bubble wrap',                                 type: 'Packaging'     },
  { date: '2025-08-26', amount: 750,    name: 'Baby breathe , urli Diya , dried flowers',    type: 'Packaging'     },
  // September 2025
  { date: '2025-09-02', amount: 2900,   name: 'Boholette',                                   type: 'Packaging'     },
  { date: '2025-09-02', amount: 900,    name: 'Transparent pouches',                         type: 'Packaging'     },
  { date: '2025-09-02', amount: 350,    name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2025-09-02', amount: 5000,   name: 'Sahil',                                       type: 'Raw Materials' },
  { date: '2025-09-03', amount: 3000,   name: 'Hz Urli Moradabad',                           type: 'Raw Materials' },
  { date: '2025-09-03', amount: 3100,   name: "Soap's",                                      type: 'Raw Materials' },
  { date: '2025-09-04', amount: 130,    name: 'Ribbon and marker',                           type: 'Packaging'     },
  { date: '2025-09-06', amount: 16000,  name: 'Ribbon tape',                                 type: 'Packaging'     },
  { date: '2025-09-06', amount: 17000,  name: 'Wax',                                         type: 'Raw Materials' },
  { date: '2025-09-08', amount: 7120,   name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-09-11', amount: 4300,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-09-12', amount: 910,    name: 'Resin',                                       type: 'Raw Materials' },
  { date: '2025-09-13', amount: 4900,   name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-09-13', amount: 5300,   name: 'Sahil - tealight mould',                      type: 'Raw Materials' },
  { date: '2025-09-13', amount: 7800,   name: 'Urli',                                        type: 'Raw Materials' },
  { date: '2025-09-13', amount: 1000,   name: 'Chai glass',                                  type: 'Raw Materials' },
  { date: '2025-09-16', amount: 4330,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-09-16', amount: 390,    name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-09-16', amount: 12700,  name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-09-16', amount: 3350,   name: 'Bakery',                                      type: 'Packaging'     },
  { date: '2025-09-16', amount: 1300,   name: 'Urli shipping',                               type: 'Raw Materials' },
  { date: '2025-09-16', amount: 4723,   name: 'Jitendra',                                    type: 'Raw Materials' },
  { date: '2025-09-22', amount: 710,    name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2025-09-26', amount: 400,    name: 'Paper shreds',                                type: 'Packaging'     },
  { date: '2025-09-27', amount: 3000,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-09-27', amount: 7420,   name: 'Urli',                                        type: 'Raw Materials' },
  { date: '2025-09-27', amount: 10000,  name: 'Jitendra',                                    type: 'Raw Materials' },
  { date: '2025-09-30', amount: 2000,   name: 'Laxmi teddy mould',                           type: 'Raw Materials' },
  // October 2025
  { date: '2025-10-02', amount: 2500,   name: 'Urli',                                        type: 'Raw Materials' },
  // November 2025
  { date: '2025-11-03', amount: 10440,  name: 'Wax, colour and fragrance',                   type: 'Raw Materials' },
  { date: '2025-11-10', amount: 4500,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-11-10', amount: 2000,   name: 'Amazon moulds',                               type: 'Raw Materials' },
  { date: '2025-11-15', amount: 1200,   name: 'Saahil moulds',                               type: 'Raw Materials' },
  { date: '2025-11-16', amount: 4500,   name: 'Soaps loop',                                  type: 'Raw Materials' },
  { date: '2025-11-17', amount: 1500,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-11-20', amount: 240,    name: 'Pearls',                                      type: 'Raw Materials' },
  { date: '2025-11-20', amount: 175,    name: 'Ribbon and glue drops',                       type: 'Packaging'     },
  { date: '2025-11-20', amount: 26250,  name: 'Headphones',                                  type: 'Raw Materials' },
  { date: '2025-11-20', amount: 2475,   name: 'Tumbler',                                     type: 'Raw Materials' },
  { date: '2025-11-20', amount: 5000,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-11-20', amount: 1200,   name: 'Paper shreds',                                type: 'Packaging'     },
  { date: '2025-11-20', amount: 1350,   name: 'Chips',                                       type: 'Raw Materials' },
  { date: '2025-11-20', amount: 700,    name: 'cards',                                       type: 'Packaging'     },
  { date: '2025-11-20', amount: 1400,   name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2025-11-22', amount: 1680,   name: 'Bakey box',                                   type: 'Raw Materials' },
  { date: '2025-11-28', amount: 1082,   name: 'Baby breathe',                                type: 'Packaging'     },
  { date: '2025-11-28', amount: 934,    name: 'Moulds',                                      type: 'Raw Materials' },
  // December 2025
  { date: '2025-12-01', amount: 14022,  name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-12-01', amount: 4630,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2025-12-01', amount: 300,    name: 'Mould',                                       type: 'Raw Materials' },
  { date: '2025-12-02', amount: 600,    name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-12-02', amount: 12000,  name: 'Wax',                                         type: 'Raw Materials' },
  { date: '2025-12-02', amount: 500,    name: 'Saahil',                                      type: 'Raw Materials' },
  { date: '2025-12-02', amount: 1600,   name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2025-12-12', amount: 1500,   name: 'Heat gun , mould , glue drops',               type: 'Raw Materials' },
  { date: '2025-12-13', amount: 6904,   name: 'Shells',                                      type: 'Raw Materials' },
  { date: '2025-12-13', amount: 300,    name: 'Egg glass',                                   type: 'Raw Materials' },
  { date: '2025-12-13', amount: 4000,   name: 'Nets',                                        type: 'Packaging'     },
  { date: '2025-12-14', amount: 5100,   name: 'Boholetto',                                   type: 'Packaging'     },
  { date: '2025-12-17', amount: 2205,   name: 'Saahil',                                      type: 'Raw Materials' },
  { date: '2025-12-24', amount: 450,    name: 'Order refund',                                type: 'Raw Materials' },
  { date: '2025-12-24', amount: 3650,   name: 'Paper shreds',                                type: 'Packaging'     },
  { date: '2025-12-24', amount: 9800,   name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2025-12-24', amount: 2100,   name: 'Transparent sheets + thermocol',              type: 'Packaging'     },
  { date: '2025-12-24', amount: 10800,  name: 'Wax',                                         type: 'Raw Materials' },
  { date: '2025-12-24', amount: 4500,   name: 'Boxes',                                       type: 'Packaging'     },
  // January 2026
  { date: '2026-01-05', amount: 600,    name: 'Shivani',                                     type: 'Labour'        },
  { date: '2026-01-10', amount: 9600,   name: 'Urli',                                        type: 'Raw Materials' },
  { date: '2026-01-10', amount: 1300,   name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2026-01-12', amount: 700,    name: 'Thermocol',                                   type: 'Raw Materials' },
  { date: '2026-01-12', amount: 500,    name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2026-01-12', amount: 700,    name: 'Urli courier',                                type: 'Raw Materials' },
  { date: '2026-01-14', amount: 900,    name: 'Shivani',                                     type: 'Labour'        },
  { date: '2026-01-14', amount: 1200,   name: 'Table',                                       type: 'Raw Materials' },
  { date: '2026-01-18', amount: 100,    name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2026-01-22', amount: 4146,   name: 'Nets',                                        type: 'Packaging'     },
  { date: '2026-01-22', amount: 300,    name: 'Sheet',                                       type: 'Packaging'     },
  { date: '2026-01-27', amount: 661,    name: 'Moulds',                                      type: 'Raw Materials' },
  { date: '2026-01-27', amount: 12940,  name: 'Moulds',                                      type: 'Raw Materials' },
  { date: '2026-01-27', amount: 15179,  name: 'Moulds',                                      type: 'Raw Materials' },
  // February 2026
  { date: '2026-02-01', amount: 850,    name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2026-02-05', amount: 10785,  name: 'Saahil',                                      type: 'Raw Materials' },
  { date: '2026-02-10', amount: 1800,   name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2026-02-19', amount: 1000,   name: 'Saahil',                                      type: 'Raw Materials' },
  { date: '2026-02-19', amount: 8224,   name: 'Boxes',                                       type: 'Packaging'     },
  { date: '2026-02-21', amount: 18085,  name: 'Glasses',                                     type: 'Raw Materials' },
  { date: '2026-02-21', amount: 2000,   name: 'Boxes bakeyy',                                type: 'Packaging'     },
  { date: '2026-02-23', amount: 23000,  name: 'Saahil',                                      type: 'Raw Materials' },
  { date: '2026-02-23', amount: 761,    name: 'Amazon - porches',                            type: 'Packaging'     },
  { date: '2026-02-25', amount: 12500,  name: 'Jitendra',                                    type: 'Raw Materials' },
  { date: '2026-02-25', amount: 2200,   name: 'Maya',                                        type: 'Packaging'     },
  { date: '2026-02-25', amount: 399,    name: 'Maya',                                        type: 'Packaging'     },
  { date: '2026-02-25', amount: 1017,   name: 'Stickers',                                    type: 'Packaging'     },
  { date: '2026-02-25', amount: 86,     name: 'Rapids',                                      type: 'Raw Materials' },
  { date: '2026-02-25', amount: 1114,   name: 'Sahil',                                       type: 'Raw Materials' },
  // March 2026
  { date: '2026-03-07', amount: 3695,   name: 'Refund',                                      type: 'Raw Materials' },
  { date: '2026-03-07', amount: 1000,   name: 'Refund',                                      type: 'Raw Materials' },
  { date: '2026-03-07', amount: 350,    name: 'Mould',                                       type: 'Raw Materials' },
  { date: '2026-03-07', amount: 1600,   name: 'Fragrance',                                   type: 'Raw Materials' },
  { date: '2026-03-09', amount: 5292,   name: 'Glasses and lid',                             type: 'Raw Materials' },
  { date: '2026-03-09', amount: 9400,   name: 'Boxes mailer and jar',                        type: 'Packaging'     },
  { date: '2026-03-09', amount: 722,    name: 'Secureship',                                  type: 'Packaging'     },
]

// ============================================
// Seed Functions
// ============================================

async function seedExpenses() {
  console.log('Upserting expense types...')
  const typeMap: Record<string, string> = {}

  for (const typeName of expenseTypes) {
    const expenseType = await prisma.expenseType.upsert({
      where: { name: typeName },
      update: {},
      create: { id: uuidv4(), name: typeName },
    })
    typeMap[typeName] = expenseType.id
    console.log(`  ✓ ${typeName} → ${expenseType.id}`)
  }

  console.log(`\nInserting ${expenses.length} expenses...`)
  let count = 0
  for (const expense of expenses) {
    const typeId = typeMap[expense.type]
    if (!typeId) {
      console.error(`  ✗ Unknown type "${expense.type}" for "${expense.name}" — skipping`)
      continue
    }
    await prisma.expense.create({
      data: {
        id: uuidv4(),
        name: expense.name,
        amount: expense.amount,
        typeId,
        date: new Date(expense.date),
      },
    })
    count++
  }

  console.log(`\nDone — inserted ${count} expenses.`)
}

async function main() {
  try {
    await seedExpenses()
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
