"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants";

export function ProducerFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [region, setRegion] = useState(params.get("region") ?? "");
  const [shared, setShared] = useState(params.get("shared") === "1");

  function apply(next?: Partial<{ region: string; shared: boolean }>) {
    const sp = new URLSearchParams();
    const r = next?.region ?? region;
    const s = next?.shared ?? shared;
    if (q.trim()) sp.set("q", q.trim());
    if (r) sp.set("region", r);
    if (s) sp.set("shared", "1");
    router.push(`/proizvoditeli${sp.toString() ? `?${sp}` : ""}`);
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
            placeholder="Име на стопанство или продукция…"
          />
        </div>
        <div className="w-full lg:w-56">
          <label className="mb-1.5 block text-sm font-semibold">Област</label>
          <Select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              apply({ region: e.target.value });
            }}
          >
            <option value="">Всички области</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
        <Button type="submit">Търси</Button>
      </form>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => {
            setShared(e.target.checked);
            apply({ shared: e.target.checked });
          }}
          className="h-4 w-4 rounded border-border-strong accent-[var(--color-primary)]"
        />
        Само с възможност за съвместна доставка
      </label>
    </div>
  );
}
