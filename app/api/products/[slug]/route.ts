import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/repos/products';

type Params = { params: { slug: string } };

export async function GET(_: Request, { params }: Params) {
  const product = await getProductBySlug(params.slug);
  if (!product) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(product);
}
