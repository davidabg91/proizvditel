"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGIONS } from "@/lib/constants";

/**
 * Търсачката на началния екран: какво + къде. Отвежда в каталога със
 * същите филтри (?q=, ?region=), които каталогът вече разбира.
 */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const query = q.trim();
    if (query) params.set("q", query);
    if (region) params.set("region", region);
    const qs = params.toString();
    router.push(`/katalog${qs ? `?${qs}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="mt-8 flex w-full max-w-3xl flex-col gap-1.5 rounded-2xl bg-surface p-1.5 text-left shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)] ring-1 ring-black/5 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2"
    >
      <label className="relative flex flex-1 items-center rounded-xl transition-colors focus-within:bg-surface-muted/60 sm:rounded-full">
        <span className="pointer-events-none absolute left-4 text-muted-foreground sm:left-5">
          <SearchIcon />
        </span>
        <span className="sr-only">Какво търсите</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търсете мед, ягоди, сирене…"
          className="h-14 w-full rounded-xl bg-transparent pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:rounded-full sm:pl-14"
          enterKeyHint="search"
        />
      </label>

      <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />

      {/* На телефон областта и бутонът са на един ред */}
      <div className="flex gap-1.5 sm:contents">
        <label className="relative flex min-w-0 flex-1 items-center rounded-xl bg-surface-muted/60 transition-colors focus-within:bg-surface-muted sm:w-56 sm:flex-none sm:rounded-full sm:bg-transparent sm:focus-within:bg-surface-muted/60">
          <span className="pointer-events-none absolute left-4 text-muted-foreground">
            <PinIcon />
          </span>
          <span className="sr-only">Област</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-14 w-full cursor-pointer appearance-none rounded-xl bg-transparent pl-11 pr-8 text-[15px] sm:pl-12 sm:pr-10 font-medium text-foreground focus:outline-none sm:rounded-full"
          >
            <option value="">Цялата страна</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 text-muted-foreground sm:right-4">
            <ChevronIcon />
          </span>
        </label>

        <button
          type="submit"
          className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 sm:px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-offset-4 sm:rounded-full"
        >
          <SearchIcon />
          Търси
        </button>
      </div>
    </form>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...STROKE}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...STROKE}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...STROKE}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
