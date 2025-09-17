/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log('Existing products found:', existingCount, '— will upsert to enrich missing fields');
  }

  // Create 20 categories
  const categoryNames = Array.from({ length: 20 }, (_, i) => `Category ${i + 1}`);
  const categories = [];
  for (const name of categoryNames) {
    const slug = slugify(name);
    const cat = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
    categories.push(cat);
  }

  // Generate 1000 products with random categories/prices
  const total = 1000;
  const chunkSize = 50;
  const brands = ['Acme', 'Globex', 'Umbrella', 'Wayne', 'Stark', 'Wonka', 'Initech', 'Hooli'];
  const colorPalette = ['black', 'white', 'gray', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'beige'];
  const sizeChart = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const makeProduct = (i) => {
    const cat = categories[randInt(0, categories.length - 1)];
    const name = `Product ${i + 1} in ${cat.name}`;
    const slug = slugify(`${name}-${i + 1}`);
    const price = randInt(500, 200000); // $5 to $2000 in cents
    const brand = brands[randInt(0, brands.length - 1)];
    const color = colorPalette[randInt(0, colorPalette.length - 1)];
    const size = sizeChart[randInt(0, sizeChart.length - 1)];
    return { name, slug, description: `Description for ${name}`, price, images: [], brand, color, size, categoryId: cat.id };
  };

  const products = Array.from({ length: total }, (_, i) => makeProduct(i));

  for (let i = 0; i < products.length; i += chunkSize) {
    const slice = products.slice(i, i + chunkSize);
    await Promise.all(
      slice.map((p) =>
        prisma.product.upsert({
          where: { slug: p.slug },
          update: { ...p },
          create: p,
        })
      )
    );
    console.log(`Seed progress: ${Math.min(i + chunkSize, products.length)}/${products.length}`);
  }

  console.log('Seed completed: categories =', categories.length, 'products upserted =', total);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
