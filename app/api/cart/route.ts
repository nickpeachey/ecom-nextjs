import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { addToCart, createCart, getCart, updateCartItem, clearCart } from '@/lib/repos/cart';

const CART_COOKIE = 'cartId';

async function ensureCartId() {
  const store = cookies();
  let cartId = store.get(CART_COOKIE)?.value;
  if (!cartId) {
    const cart = await createCart();
    cartId = cart.id;
    store.set(CART_COOKIE, cartId, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
  }
  return cartId!;
}

export async function GET() {
  const cartId = await ensureCartId();
  const cart = await getCart(cartId);
  return NextResponse.json(cart);
}

export async function POST(req: Request) {
  const cartId = await ensureCartId();
  const { productId, quantity } = await req.json();
  await addToCart(cartId, productId, quantity ?? 1);
  const cart = await getCart(cartId);
  return NextResponse.json(cart);
}

export async function PUT(req: Request) {
  const { cartItemId, quantity } = await req.json();
  const updated = await updateCartItem(cartItemId, quantity);
  return NextResponse.json(updated);
}

export async function DELETE() {
  const cartId = await ensureCartId();
  await clearCart(cartId);
  return new NextResponse(null, { status: 204 });
}
