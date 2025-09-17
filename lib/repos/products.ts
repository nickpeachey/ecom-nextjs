import { prisma } from '@/lib/db';

const MOCK = process.env.MOCK_DATA === '1';

export type ProductFilters = {
  categorySlugs?: string[];
  minPrice?: number; // cents
  maxPrice?: number; // cents
  brands?: string[];
  colors?: string[];
  sizes?: string[];
};

const mockProducts = [
  {
    id: 'p1',
    name: 'Graphic T-Shirt',
    slug: 'graphic-t-shirt',
    description: 'Soft cotton tee with minimalist print.',
    price: 2500,
    images: [],
    brand: 'Acme',
    color: 'black',
    size: 'M',
  },
  {
    id: 'p2',
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Over-ear, noise-cancelling, 30h battery.',
    price: 12999,
    images: [],
    brand: 'Globex',
    color: 'red',
    size: undefined as any,
  },
];

function buildWhere(filters: ProductFilters) {
  const where: any = {};
  if (filters.categorySlugs?.length) {
    where.category = { slug: { in: filters.categorySlugs } };
  }
  if (filters.brands?.length) {
    where.brand = { in: filters.brands };
  }
  if (filters.colors?.length) {
    where.color = { in: filters.colors };
  }
  if (filters.sizes?.length) {
    where.size = { in: filters.sizes };
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {} as any;
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }
  return where;
}

export async function listProducts(filters: ProductFilters = {}) {
  if (MOCK) {
    const arr = mockProducts.filter((p) => {
      if (filters.minPrice != null && p.price < filters.minPrice) return false;
      if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
      if (filters.brands?.length && (!p.brand || !filters.brands.includes(p.brand))) return false;
  if (filters.colors?.length && (!p.color || !filters.colors.includes(p.color))) return false;
  if (filters.sizes?.length && (!p.size || !filters.sizes.includes(p.size))) return false;
      return true;
    });
    return arr as any;
  }
  const where = buildWhere(filters);
  try {
    return await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
      take: 60,
    });
  } catch (e) {
    return [] as any;
  }
}

export async function listProductsPaginated(filters: ProductFilters = {}, page = 1, perPage = 24) {
  if (MOCK) {
    const filtered = (await listProducts(filters)) as any[];
    const total = filtered.length;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);
    return { items, total } as { items: any[]; total: number };
  }
  const where = buildWhere(filters);
  try {
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    return { items, total };
  } catch (e) {
    return { items: [] as any[], total: 0 };
  }
}

export async function getProductBySlug(slug: string) {
  if (MOCK) return mockProducts.find((p) => p.slug === slug) as any;
  return prisma.product.findUnique({ where: { slug } });
}
