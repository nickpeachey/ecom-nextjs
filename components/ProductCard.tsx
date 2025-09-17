import Link from 'next/link';

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
  };
};

export default function ProductCard({ product }: Props) {
  const price = (product.price / 100).toFixed(2);
  return (
    <Link href={`/product/${product.slug}`} className="block border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700">
      <div className="aspect-square bg-neutral-900 flex items-center justify-center text-neutral-500">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm">No image</span>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium truncate">{product.name}</div>
        <div className="text-sm text-neutral-400">${price}</div>
      </div>
    </Link>
  );
}
