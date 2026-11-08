"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { REGIONS } from "@/lib/constants";
import { Icon } from "@/components/ui/icons";
import { SORTS } from "./sorts";

/** Сменя един параметър в адреса на каталога и запазва останалите. */
function useCatalogNav() {
  const router = useRouter();
  const params = useSearchParams();
  return (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    const qs = sp.toString();
    router.push(`/katalog${qs ? `?${qs}` : ""}`);
  };
}

export function CatalogSearch() {
  const params = useSearchParams();
  const go = useCatalogNav();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go("q", q.trim());
      }}
      className="flex flex-1 items-center rounded-full border border-border-strong bg-surface pl-4 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
    >
      <Icon name="search" size={18} className="text-muted-foreground" />
      <label className="sr-only" htmlFor="catalog-q">
        Търсене в каталога
      </label>
      <input
        id="catalog-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Търсете продукт или стопанство…"
        className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        enterKeyHint="search"
      />
      <button
        type="submit"
        className="m-1 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Търси
      </button>
    </form>
  );
}

export function SortSelect() {
  const params = useSearchParams();
  const go = useCatalogNav();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Подреди по</span>
      <select
        value={params.get("sort") ?? ""}
        onChange={(e) => go("sort", e.target.value)}
        className="h-11 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface pl-4 pr-10 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-3.5 text-muted-foreground"
      />
    </label>
  );
}

export function RegionSelect() {
  const params = useSearchParams();
  const go = useCatalogNav();
  return (
    <label className="relative flex items-center">
      <span className="sr-only">Област</span>
      <Icon name="pin" size={16} className="pointer-events-none absolute left-3.5 text-accent" />
      <select
        value={params.get("region") ?? ""}
        onChange={(e) => go("region", e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-[var(--radius-md)] border border-border-strong bg-surface pl-10 pr-9 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
      >
        <option value="">Цялата страна</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-3 text-muted-foreground"
      />
    </label>
  );
}
