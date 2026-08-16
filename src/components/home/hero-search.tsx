"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const POPULAR = [
  "Плодове",
  "Зеленчуци",
  "Мед и пчелни продукти",
  "Млечни продукти",
  "Билки и подправки",
];

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(`/katalog${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Открийте продукция
      </p>
      <h2 className="mt-2 text-xl font-semibold">Какво търсите днес?</h2>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="напр. ягоди, мед, домати…"
          aria-label="Търсене на продукция"
        />
        <Button type="submit" className="shrink-0">
          Търси
        </Button>
      </form>

      <div className="mt-5">
        <p className="text-sm text-muted-foreground">Популярни категории</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {POPULAR.map((cat) => (
            <Link
              key={cat}
              href={`/katalog?category=${encodeURIComponent(cat)}`}
              className="rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <Link
          href="/proizvoditeli"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Или разгледайте всички производители →
        </Link>
      </div>
    </div>
  );
}
