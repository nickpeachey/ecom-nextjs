#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Starting migration: arrays -> scalar color/size');
  // 1) Set color from colors[0] where color missing and colors is non-empty array
  const setColor = await prisma.$runCommandRaw({
    update: 'Product',
    updates: [
      {
        q: { color: { $exists: false }, colors: { $type: 'array', $ne: [] } },
        u: [
          {
            $set: {
              color: { $arrayElemAt: ['$colors', 0] },
            },
          },
        ],
        multi: true,
        upsert: false,
      },
    ],
  });
  console.log('Set color from colors[]:', JSON.stringify(setColor));

  // 2) Set size from sizes[0] where size missing and sizes is non-empty array
  const setSize = await prisma.$runCommandRaw({
    update: 'Product',
    updates: [
      {
        q: { size: { $exists: false }, sizes: { $type: 'array', $ne: [] } },
        u: [
          {
            $set: {
              size: { $arrayElemAt: ['$sizes', 0] },
            },
          },
        ],
        multi: true,
        upsert: false,
      },
    ],
  });
  console.log('Set size from sizes[]:', JSON.stringify(setSize));

  // 3) Unset legacy arrays
  const unsetColors = await prisma.$runCommandRaw({
    update: 'Product',
    updates: [
      {
        q: { colors: { $exists: true } },
        u: { $unset: { colors: '' } },
        multi: true,
        upsert: false,
      },
    ],
  });
  console.log('Unset colors array:', JSON.stringify(unsetColors));

  const unsetSizes = await prisma.$runCommandRaw({
    update: 'Product',
    updates: [
      {
        q: { sizes: { $exists: true } },
        u: { $unset: { sizes: '' } },
        multi: true,
        upsert: false,
      },
    ],
  });
  console.log('Unset sizes array:', JSON.stringify(unsetSizes));

  console.log('Migration complete.');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
