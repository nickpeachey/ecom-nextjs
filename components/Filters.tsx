"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FacetCategory = { slug: string; name: string };

type Props = {
  categories: (FacetCategory & { count?: number })[];
  brands: string[];
  colors: string[];
  sizes: string[];
  counts?: { brands: Record<string, number>; colors: Record<string, number>; sizes: Record<string, number> };
  selectedCats: string[];
  selectedBrands: string[];
  selectedColors: string[];
  selectedSizes: string[];
  min?: number; // dollars
  max?: number; // dollars
  perPage?: number;
};

export default function Filters({
  categories,
  brands,
  colors,
  sizes,
  counts,
  selectedCats,
  selectedBrands,
  selectedColors,
  selectedSizes,
  min = 0,
  max = 2000,
  perPage = 24,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [minVal, setMinVal] = useState<number>(min);
  const [maxVal, setMaxVal] = useState<number>(max);
  const sliderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMinVal(min);
    setMaxVal(max);
  }, [min, max]);

  const buildQS = useCallback(
    (overrides?: Partial<Record<string, string | string[] | undefined>>) => {
      const q = new URLSearchParams(params?.toString() ?? "");
      // Clear facet keys we'll manage explicitly
      ["category", "brand", "color", "size", "min", "max", "page"].forEach((k) => q.delete(k));
      // Categories
      const catVals = (overrides?.category as string[] | undefined) ?? selectedCats;
      catVals.forEach((v) => q.append("category", v));
      // Brands
      const brandVals = (overrides?.brand as string[] | undefined) ?? selectedBrands;
      brandVals.forEach((v) => q.append("brand", v));
      // Colors
      const colorVals = (overrides?.color as string[] | undefined) ?? selectedColors;
      colorVals.forEach((v) => q.append("color", v));
      // Sizes
      const sizeVals = (overrides?.size as string[] | undefined) ?? selectedSizes;
      sizeVals.forEach((v) => q.append("size", v));
      // Price
      const minOverride = overrides?.min as string | undefined;
      const maxOverride = overrides?.max as string | undefined;
      const minStr = minOverride ?? String(Math.round(minVal));
      const maxStr = maxOverride ?? String(Math.round(maxVal));
      q.set("min", minStr);
      q.set("max", maxStr);
      // Per page (preserve)
      q.set("perPage", String(perPage));
      // Reset page on any change
      q.set("page", "1");
      return q;
    },
    [params, selectedCats, selectedBrands, selectedColors, selectedSizes, minVal, maxVal, perPage]
  );

  const pushQS = useCallback(
    (q: URLSearchParams) => {
      router.push(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  const toggleValue = (curr: string[], v: string) =>
    curr.includes(v) ? curr.filter((x) => x !== v) : [...curr, v];

  const onToggle = (key: "category" | "brand" | "color" | "size", v: string) => {
    const overrides: any = {};
    if (key === "category") overrides.category = toggleValue(selectedCats, v);
    if (key === "brand") overrides.brand = toggleValue(selectedBrands, v);
    if (key === "color") overrides.color = toggleValue(selectedColors, v);
    if (key === "size") overrides.size = toggleValue(selectedSizes, v);
    pushQS(buildQS(overrides));
  };

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const onMinChange = (v: number) => {
    const nv = clamp(v, 0, maxVal);
    setMinVal(nv);
    if (sliderTimer.current) clearTimeout(sliderTimer.current);
    sliderTimer.current = setTimeout(() => pushQS(buildQS({ min: String(nv) })), 300);
  };
  const onMaxChange = (v: number) => {
    const nv = clamp(v, minVal, 2000);
    setMaxVal(nv);
    if (sliderTimer.current) clearTimeout(sliderTimer.current);
    sliderTimer.current = setTimeout(() => pushQS(buildQS({ max: String(nv) })), 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">Filters</span>
        <button
          type="button"
          className="text-xs text-neutral-400 hover:text-neutral-200 underline"
          onClick={() => {
            const q = new URLSearchParams();
            q.set('perPage', String(perPage));
            q.set('page', '1');
            pushQS(q);
          }}
        >
          Clear all
        </button>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm uppercase tracking-wide text-neutral-400">Categories</legend>
        <div className="max-h-64 overflow-auto pr-2">
          {categories.map((c) => {
            const checked = selectedCats.includes(c.slug);
            return (
              <label key={c.slug} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle("category", c.slug)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">{c.name}{c.count != null && <span className="text-neutral-500"> ({c.count})</span>}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm uppercase tracking-wide text-neutral-400">Brands</legend>
        <div className="max-h-40 overflow-auto pr-2">
          {brands.map((b) => {
            const checked = selectedBrands.includes(b);
            return (
              <label key={b} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle("brand", b)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">{b}{counts?.brands?.[b] != null && <span className="text-neutral-500"> ({counts?.brands?.[b]})</span>}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm uppercase tracking-wide text-neutral-400">Colors</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const checked = selectedColors.includes(c);
            return (
              <label key={c} className="inline-flex items-center gap-2 py-1 px-2 border border-neutral-700 rounded-md hover:border-neutral-600">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle("color", c)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                />
                <span
                  className="h-4 w-4 rounded-full border border-neutral-600 shadow-inner"
                  style={{ backgroundColor: c.toLowerCase() }}
                  aria-hidden
                  title={c}
                />
                <span className="text-xs capitalize">{c}{counts?.colors?.[c] != null && <span className="text-neutral-500"> ({counts?.colors?.[c]})</span>}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm uppercase tracking-wide text-neutral-400">Sizes</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const checked = selectedSizes.includes(s);
            return (
              <label key={s} className="inline-flex items-center gap-2 py-1 px-2 border border-neutral-700 rounded-md hover:border-neutral-600">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle("size", s)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs inline-flex items-center gap-1">
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
                        <path d="M7 4l2.5 2h5L17 4l3 2-2 3v9.5A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5V9L4 6l3-2z" fill="currentColor" />
                      </svg>
                    );
                  })()}
                  {s}{counts?.sizes?.[s] != null && <span className="text-neutral-500"> ({counts?.sizes?.[s]})</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm uppercase tracking-wide text-neutral-400">Price (USD)</legend>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <label htmlFor="price-min">Min</label>
              <span>${minVal}</span>
            </div>
            <input
              id="price-min"
              type="range"
              min={0}
              max={2000}
              step={10}
              value={minVal}
              onChange={(e) => onMinChange(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <label htmlFor="price-max">Max</label>
              <span>${maxVal}</span>
            </div>
            <input
              id="price-max"
              type="range"
              min={0}
              max={2000}
              step={10}
              value={maxVal}
              onChange={(e) => onMaxChange(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
