import ProductCard from '@/components/ProductCard';
import { listProductsPaginated } from '@/lib/repos/products';
import { listCategoryFacets, listProductFacetValues, listProductFacetValuesFiltered, listCategoryFacetsFiltered } from '@/lib/repos/categories';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Product } from '@prisma/client';

type FiltersProps = { searchParams: { [key: string]: string | string[] | undefined } };

export default async function HomePage({ searchParams }: FiltersProps) {
  const selectedCats = Array.isArray(searchParams.category)
    ? (searchParams.category as string[])
    : searchParams.category
    ? [String(searchParams.category)]
    : [];
  const selectedBrands = Array.isArray(searchParams.brand)
    ? (searchParams.brand as string[])
    : searchParams.brand
    ? [String(searchParams.brand)]
    : [];
  const selectedColors = Array.isArray(searchParams.color)
    ? (searchParams.color as string[])
    : searchParams.color
    ? [String(searchParams.color)]
    : [];
  const selectedSizes = Array.isArray(searchParams.size)
    ? (searchParams.size as string[])
    : searchParams.size
    ? [String(searchParams.size)]
    : [];
  // Parse dollars from query and convert to cents for filtering
  const min = searchParams.min ? Number(searchParams.min) * 100 : undefined;
  const max = searchParams.max ? Number(searchParams.max) * 100 : undefined;
  const page = searchParams.page ? Math.max(1, Number(searchParams.page)) : 1;
  const perPage = searchParams.perPage ? Math.min(96, Math.max(6, Number(searchParams.perPage))) : 24;

  const activeFilters = {
    categorySlugs: selectedCats,
    minPrice: min,
    maxPrice: max,
    brands: selectedBrands,
    colors: selectedColors,
    sizes: selectedSizes,
  } as const;

  const [catsFiltered, facetValues, allCats, paged] = await Promise.all([
    listCategoryFacetsFiltered(activeFilters),
    listProductFacetValuesFiltered(activeFilters),
    listCategoryFacets(),
    listProductsPaginated(activeFilters, page, perPage),
  ]);

  // Ensure selected options remain visible (so users can unselect),
  // while still primarily showing filtered options.
  const brandOptions = Array.from(new Set([...(facetValues.brands ?? []), ...selectedBrands])).sort();
  const colorOptions = Array.from(new Set([...(facetValues.colors ?? []), ...selectedColors])).sort();
  const sizeOptions = Array.from(new Set([...(facetValues.sizes ?? []), ...selectedSizes])).sort();

  const catNameBySlug = new Map(allCats.map((c) => [c.slug, c.name] as const));
  const catSlugSet = new Set([...(catsFiltered?.map((c) => c.slug) ?? []), ...selectedCats]);
  const cats = Array.from(catSlugSet).map((slug) => ({ slug, name: catNameBySlug.get(slug) ?? slug }));
  const products = paged.items as Array<Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images'>>;
  const total = paged.total;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Helper to build query strings preserving filters
  const baseQS = new URLSearchParams();
  selectedCats.forEach((v) => baseQS.append('category', v));
  selectedBrands.forEach((v) => baseQS.append('brand', v));
  selectedColors.forEach((v) => baseQS.append('color', v));
  selectedSizes.forEach((v) => baseQS.append('size', v));
  if (min != null) baseQS.set('min', String(Math.round(min / 100)));
  if (max != null) baseQS.set('max', String(Math.round(max / 100)));
  const makeHref = (nextPage: number) => {
    const q = new URLSearchParams(baseQS);
    q.set('page', String(nextPage));
    q.set('perPage', String(perPage));
    return `/?${q.toString()}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3 space-y-6">
        <form className="space-y-6" action="/" method="get">
          <fieldset className="space-y-3">
            <legend className="text-sm uppercase tracking-wide text-neutral-400">Categories</legend>
            <div className="max-h-64 overflow-auto pr-2">
              {cats.map((c) => {
                const checked = selectedCats.includes(c.slug);
                return (
                  <label key={c.slug} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      name="category"
                      value={c.slug}
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm uppercase tracking-wide text-neutral-400">Brands</legend>
            <div className="max-h-40 overflow-auto pr-2">
              {brandOptions.map((b) => {
                const checked = selectedBrands.includes(b);
                return (
                  <label key={b} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      name="brand"
                      value={b}
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">{b}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm uppercase tracking-wide text-neutral-400">Colors</legend>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => {
                const checked = selectedColors.includes(c);
                return (
                  <label key={c} className="inline-flex items-center gap-2 py-1 px-2 border border-neutral-700 rounded-md hover:border-neutral-600">
                    <input
                      type="checkbox"
                      name="color"
                      value={c}
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-neutral-600 shadow-inner"
                      style={{ backgroundColor: c.toLowerCase() }}
                      aria-hidden="true"
                      title={c}
                    />
                    <span className="text-xs capitalize">{c}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm uppercase tracking-wide text-neutral-400">Sizes</legend>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((s) => {
                const checked = selectedSizes.includes(s);
                return (
                  <label key={s} className="inline-flex items-center gap-2 py-1 px-2 border border-neutral-700 rounded-md hover:border-neutral-600">
                    <input
                      type="checkbox"
                      name="size"
                      value={s}
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs inline-flex items-center gap-1">
                      {/* Simple t-shirt glyph with size-varying dimensions */}
                      {(() => {
                        const dims: Record<string, number> = { XS: 10, S: 12, M: 14, L: 16, XL: 18, XXL: 20 };
                        const d = dims[s] ?? 14;
                        return (
                          <svg
                            width={d}
                            height={d}
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                            className="text-neutral-300"
                          >
                            <path
                              d="M7 4l2.5 2h5L17 4l3 2-2 3v9.5A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5V9L4 6l3-2z"
                              fill="currentColor"
                            />
                          </svg>
                        );
                      })()}
                      {s}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm uppercase tracking-wide text-neutral-400">Price (USD)</legend>
            {/* Use a client component to show live values while keeping form submission server-friendly */}
            {(() => {
              const PriceRange = dynamic(() => import('../components/PriceRange'), { ssr: false });
              const initialMin = min != null ? Math.round((min as number) / 100) : 0;
              const initialMax = max != null ? Math.round((max as number) / 100) : 2000;
              return <PriceRange initialMin={initialMin} initialMax={initialMax} />;
            })()}
            <div className="flex items-center gap-2">
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500">Apply</button>
              <Link href="/" className="text-sm text-neutral-400 hover:underline">Reset</Link>
            </div>
          </fieldset>
        </form>
      </aside>

      <section className="lg:col-span-9">
        <div className="flex items-center justify-between mb-4 text-sm text-neutral-400">
          <div>
            Showing <span className="text-neutral-200">{products.length}</span> of <span className="text-neutral-200">{total}</span> products
          </div>
          <form action="/" method="get" className="flex items-center gap-2">
            {/* preserve existing filters in hidden inputs */}
            {selectedCats.map((v) => (
              <input key={`cat-${v}`} type="hidden" name="category" value={v} />
            ))}
            {selectedBrands.map((v) => (
              <input key={`brand-${v}`} type="hidden" name="brand" value={v} />
            ))}
            {selectedColors.map((v) => (
              <input key={`color-${v}`} type="hidden" name="color" value={v} />
            ))}
            {selectedSizes.map((v) => (
              <input key={`size-${v}`} type="hidden" name="size" value={v} />
            ))}
            {min != null && <input type="hidden" name="min" value={String(Math.round(min / 100))} />}
            {max != null && <input type="hidden" name="max" value={String(Math.round(max / 100))} />}

            <label className="text-xs">Per page</label>
            <select
              name="perPage"
              defaultValue={perPage}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
            >
              {[12, 24, 36, 48, 60, 72, 96].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {/* reset to first page when perPage changes */}
            <input type="hidden" name="page" value="1" />
            <button type="submit" className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:border-neutral-600">Apply</button>
          </form>
        </div>
        {!products?.length ? (
          <p className="text-neutral-300">No products match your filters.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {(products as Array<Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images'>>).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link
              href={makeHref(Math.max(1, page - 1))}
              className={`px-3 py-1 rounded-md border ${page === 1 ? 'pointer-events-none opacity-50 border-neutral-800' : 'border-neutral-700 hover:border-neutral-600'}`}
            >
              Prev
            </Link>
            <span className="text-sm text-neutral-400">Page {page} of {totalPages}</span>
            <Link
              href={makeHref(Math.min(totalPages, page + 1))}
              className={`px-3 py-1 rounded-md border ${page === totalPages ? 'pointer-events-none opacity-50 border-neutral-800' : 'border-neutral-700 hover:border-neutral-600'}`}
            >
              Next
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
