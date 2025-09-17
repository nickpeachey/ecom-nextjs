import { getProductBySlug } from '@/lib/repos/products';
import { notFound } from 'next/navigation';

type Props = { params: { slug: string } };

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) return notFound();
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="aspect-square bg-neutral-900 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
      </div>
      <div>
        <h1 className="text-3xl font-semibold mb-2">{product.name}</h1>
        <div className="text-xl text-neutral-300 mb-4">${(product.price / 100).toFixed(2)}</div>
        <p className="text-neutral-300 mb-6">{product.description}</p>
        {/* Add to cart will call API via client action later */}
      </div>
    </div>
  );
}
