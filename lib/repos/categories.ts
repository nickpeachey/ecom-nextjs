import { prisma } from '@/lib/db';
import type { ProductFilters } from '@/lib/repos/products';
const MOCK = process.env.MOCK_DATA === '1';
const mockCategories = [
  { slug: 'category-1', name: 'Category 1' },
  { slug: 'category-2', name: 'Category 2' },
  { slug: 'category-3', name: 'Category 3' },
];

export async function listCategories() {
  if (MOCK) return mockCategories as any;
  try {
    return await prisma.category.findMany({ orderBy: { name: 'asc' } });
  } catch (e) {
    // Fail-safe return in dev if DB is not available
    return mockCategories as any;
  }
}

export async function listCategoryFacets() {
  if (MOCK) return mockCategories;
  try {
    return await prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } });
  } catch (e) {
    return mockCategories;
  }
}

export async function listProductFacetValues() {
  if (MOCK) {
    return {
      brands: ['Acme', 'Globex', 'Umbrella'],
      colors: ['black', 'white', 'red', 'blue'],
      sizes: ['S', 'M', 'L'],
    };
  }
  const client: any = prisma as any;
  const [brandRows, colorRows, sizeRows]: [any[], any[], any[]] = await Promise.all([
    client.product.findMany({ where: { brand: { not: null } }, select: { brand: true } }),
    client.product.findMany({ where: { color: { not: null } }, select: { color: true } }),
    client.product.findMany({ where: { size: { not: null } }, select: { size: true } }),
  ]);
  const brands = Array.from(new Set(brandRows.map((r) => r.brand).filter(Boolean))).sort();
  const colors = Array.from(new Set(colorRows.map((r) => r.color).filter(Boolean))).sort();
  const sizes = Array.from(new Set(sizeRows.map((r) => r.size).filter(Boolean))).sort();
  return { brands, colors, sizes };
}

function buildWhere(filters: ProductFilters, omit: Array<'brands' | 'colors' | 'sizes' | 'categorySlugs'> = []) {
  const where: any = {};
  const f = { ...filters };
  for (const k of omit) delete (f as any)[k];
  if (f.categorySlugs?.length) where.category = { slug: { in: f.categorySlugs } };
  if (f.brands?.length) where.brand = { in: f.brands };
  if (f.colors?.length) where.color = { in: f.colors };
  if (f.sizes?.length) where.size = { in: f.sizes };
  if (f.minPrice != null || f.maxPrice != null) {
    where.price = {} as any;
    if (f.minPrice != null) where.price.gte = f.minPrice;
    if (f.maxPrice != null) where.price.lte = f.maxPrice;
  }
  return where;
}

export async function listProductFacetValuesFiltered(filters: ProductFilters) {
  if (MOCK) {
    // In mock mode, return static for simplicity
    return {
      brands: ['Acme', 'Globex', 'Umbrella'],
      colors: ['black', 'white', 'red', 'blue'],
      sizes: ['S', 'M', 'L'],
    };
  }
  const client: any = prisma as any;
  const [brandRows, colorRows, sizeRows]: [any[], any[], any[]] = await Promise.all([
    client.product.findMany({ where: buildWhere(filters, ['brands']), select: { brand: true } }),
    client.product.findMany({ where: buildWhere(filters, ['colors']), select: { color: true } }),
    client.product.findMany({ where: buildWhere(filters, ['sizes']), select: { size: true } }),
  ]);
  const brands = Array.from(new Set(brandRows.map((r) => r.brand).filter(Boolean))).sort();
  const colors = Array.from(new Set(colorRows.map((r) => r.color).filter(Boolean))).sort();
  const sizes = Array.from(new Set(sizeRows.map((r) => r.size).filter(Boolean))).sort();
  return { brands, colors, sizes };
}

export async function listCategoryFacetsFiltered(filters: ProductFilters) {
  if (MOCK) return mockCategories;
  const client: any = prisma as any;
  // Get categoryIds from products that match all filters except category filter itself
  const prodRows: Array<{ categoryId: string | null }> = await client.product.findMany({
    where: buildWhere(filters, ['categorySlugs']),
    select: { categoryId: true },
  });
  const ids = Array.from(new Set(prodRows.map((r) => r.categoryId).filter(Boolean)));
  if (!ids.length) return [];
  const cats = await prisma.category.findMany({
    where: { id: { in: ids as any } },
    select: { slug: true, name: true },
    orderBy: { name: 'asc' },
  });
  return cats;
}

export async function listProductFacetCountsFiltered(
  filters: ProductFilters
): Promise<{ brands: Record<string, number>; colors: Record<string, number>; sizes: Record<string, number> }> {
  if (MOCK) {
    return {
      brands: { Acme: 10, Globex: 8, Umbrella: 6 },
      colors: { black: 12, white: 9, red: 4, blue: 7 },
      sizes: { S: 5, M: 9, L: 6 },
    };
  }
  const client: any = prisma as any;
  const [brandRows, colorRows, sizeRows]: [any[], any[], any[]] = await Promise.all([
    client.product.findMany({ where: buildWhere(filters, ['brands']), select: { brand: true } }),
    client.product.findMany({ where: buildWhere(filters, ['colors']), select: { color: true } }),
    client.product.findMany({ where: buildWhere(filters, ['sizes']), select: { size: true } }),
  ]);
  const brands: Record<string, number> = {};
  for (const r of brandRows) if (r.brand) brands[r.brand] = (brands[r.brand] ?? 0) + 1;
  const colors: Record<string, number> = {};
  for (const r of colorRows) if (r.color) colors[r.color] = (colors[r.color] ?? 0) + 1;
  const sizes: Record<string, number> = {};
  for (const r of sizeRows) if (r.size) sizes[r.size] = (sizes[r.size] ?? 0) + 1;
  return { brands, colors, sizes } as { brands: Record<string, number>; colors: Record<string, number>; sizes: Record<string, number> };
}

export async function listCategoryFacetCountsFiltered(filters: ProductFilters) {
  if (MOCK) return mockCategories.map((c) => ({ ...c, count: 1 }));
  const client: any = prisma as any;
  const prodRows: Array<{ categoryId: string | null }> = await client.product.findMany({
    where: buildWhere(filters, ['categorySlugs']),
    select: { categoryId: true },
  });
  const countsById = new Map<string, number>();
  for (const r of prodRows) {
    if (!r.categoryId) continue;
    countsById.set(r.categoryId, (countsById.get(r.categoryId) ?? 0) + 1);
  }
  const ids = Array.from(countsById.keys());
  if (!ids.length) return [] as Array<{ slug: string; name: string; count: number }>;
  const cats = await prisma.category.findMany({ where: { id: { in: ids as any } }, select: { id: true, slug: true, name: true } });
  return cats.map((c) => ({ slug: c.slug, name: c.name, count: countsById.get(c.id) ?? 0 }));
}
