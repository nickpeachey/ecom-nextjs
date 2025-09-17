import { prisma } from '@/lib/db';

export async function getCart(cartId: string) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } },
  });
}

export async function createCart() {
  return prisma.cart.create({ data: {} });
}

export async function addToCart(cartId: string, productId: string, quantity = 1) {
  const existing = await prisma.cartItem.findFirst({ where: { cartId, productId } });
  if (existing) {
    return prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  }
  return prisma.cartItem.create({ data: { cartId, productId, quantity } });
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  if (quantity <= 0) return prisma.cartItem.delete({ where: { id: cartItemId } });
  return prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}
