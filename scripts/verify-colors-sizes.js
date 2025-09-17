#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.$runCommandRaw({
    aggregate: 'Product',
    pipeline: [
      {
        $match: {
          $or: [
            { $expr: { $isArray: '$color' } },
            { colors: { $exists: true } },
            { $expr: { $isArray: '$size' } },
            { sizes: { $exists: true } },
          ],
        },
      },
      { $count: 'bad' },
    ],
    cursor: {},
  });

  const count = res?.cursor?.firstBatch?.[0]?.bad ?? 0;
  if (count > 0) {
    console.error(`Found ${count} product(s) with array color/size or legacy fields (colors/sizes).`);
    process.exit(1);
  }
  console.log('Verification passed: No products with array color/size or legacy fields.');
}

main()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
