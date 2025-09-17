import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/repos/products';

export async function GET() {
  const products = await listProducts();
  return NextResponse.json(products);
}
