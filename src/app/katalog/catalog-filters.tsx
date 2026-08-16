"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES, REGIONS } from "@/lib/constants";

export function CatalogFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [region, setRegion] = useState(params.get("region") ?? "");
  const [offers, setOffers] = useState(params.get("offers") === "1");

  function apply(next?: Partial<{ category: string; region: string; offers: boolean }>) {
    const sp = new URLSearchParams();
    const c = next?.category ?? category;
    const r = next?.region ?? region;
    const o = next?.offers ?? offers;
    if (q.trim()) sp.set("q", q.trim());
    if (c) sp.set("category", c);
    if (r) sp.set("region", r);
    if (o) sp.set("offers", "1");
    router.push(`/katalog${sp.toString() ? `?${sp}` : ""}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="flex flex-col gap-3 lg:flex-row lg:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-semibold">Търсене</label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="напр. ягоди, мед, домати…"
          />
        </div>
        <div className="w-full lg:w-48">
          <label className="mb-1.5 block text-sm font-semibold">Категория</label>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              apply({ category: e.target.value });
            }}
          >
            <option value="">Всички</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="w-full lg:w-48">
          <label className="mb-1.5 block text-sm font-semibold">Област</label>
          <Select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              apply({ region: e.target.value });
            }}
          >
            <option value="">Всички</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
        <Button type="submit">Търси</Button>
      </form>
      <div className="mt-3 flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={offers}
            onChange={(e) => {
              setOffers(e.target.checked);
              apply({ offers: e.target.checked });
            }}
            className="h-4 w-4 rounded border-border-strong accent-[var(--color-accent)]"
          />
          Само оферти
        </label>
      </div>
    </div>
  );
}
