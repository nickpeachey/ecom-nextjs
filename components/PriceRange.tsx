"use client";
import { useState } from "react";

type Props = {
  initialMin?: number; // dollars
  initialMax?: number; // dollars
};

export default function PriceRange({ initialMin = 0, initialMax = 2000 }: Props) {
  const [minVal, setMinVal] = useState<number>(initialMin);
  const [maxVal, setMaxVal] = useState<number>(initialMax);

  // Ensure min doesn't exceed max and vice versa
  const handleMin = (v: number) => setMinVal(Math.min(v, maxVal));
  const handleMax = (v: number) => setMaxVal(Math.max(v, minVal));

  return (
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
          name="min"
          value={minVal}
          onChange={(e) => handleMin(Number(e.target.value))}
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
          name="max"
          value={maxVal}
          onChange={(e) => handleMax(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
    </div>
  );
}
