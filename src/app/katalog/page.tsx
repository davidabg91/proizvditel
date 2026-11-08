import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findListingsBoostedFirst, listingCardInclude } from "@/lib/boost";
import { ListingCard } from "@/components/product/listing-card";
import { CatalogSearch, RegionSelect, SortSelect, SORTS } from "./catalog-filters";
import { CATEGORIES } from "@/lib/constants";
import { PageHero } from "@/components/layout/page-hero";
import { Icon, categoryIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Каталог с прясна продукция от български производители",
  description:
    "Плодове, зеленчуци, мед, млечни и месни продукти директно от българските земеделски стопанства. Поръчайте без посредник, с доставка до вас.",
  // Филтрите (?category=, ?region=, ?q=) създават стотици адреси с почти
  // еднакво съдържание — сочим ги към чистия каталог, за да не се
  // конкурират помежду си в резултатите.
  alternates: { canonical: "/katalog" },
};

type Params = {
  q?: string;
  category?: string;
  region?: string;
  offers?: string;
  sort?: string;
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;

  // Всичко освен категорията — за да се броят продуктите по категории.
  const base: Prisma.ProductListingWhereInput = {
    available: true,
    producer: sp.region ? { published: true, region: sp.region } : { published: true },
  };
  if (sp.offers === "1") base.isOffer = true;
  if (sp.q?.trim()) {
    const query = sp.q.trim();
    base.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
      { producer: { farmName: { contains: query, mode: "insensitive" } } },
      { producer: { crops: { some: { name: { contains: query, mode: "insensitive" } } } } },
    ];
  }
  const where: Prisma.ProductListingWhereInput = sp.category
    ? { ...base, category: sp.category }
    : base;

  const priceSort =
    sp.sort === "price_asc" ? "asc" : sp.sort === "price_desc" ? "desc" : null;

  const [listings, byCategory] = await Promise.all([
    priceSort
      ? // При подреждане по цена редът е строго по цена — без подсилените отпред.
        prisma.productListing.findMany({
          where,
          orderBy: [{ soldOut: "asc" }, { price: priceSort }],
          take: 60,
          include: listingCardInclude,
        })
      : // Платените (подсилени) обяви излизат пред всички останали.
        findListingsBoostedFirst(
          where,
          60,
          sp.sort === "new"
            ? [{ soldOut: "asc" }, { createdAt: "desc" }]
            : [{ soldOut: "asc" }, { isOffer: "desc" }, { createdAt: "desc" }],
        ),
    prisma.productListing.groupBy({
      by: ["category"],
      where: base,
      _count: { _all: true },
    }),
  ]);

  const countFor = new Map(byCategory.map((g) => [g.category ?? "", g._count._all]));
  const totalAll = byCategory.reduce((s, g) => s + g._count._all, 0);

  const cards = listings.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    price: l.price,
    oldPrice: l.oldPrice,
    unit: l.unit,
    currency: l.currency,
    isOffer: l.isOffer,
    available: l.available,
    soldOut: l.soldOut,
    boostedUntil: l.boostedUntil,
    category: l.category,
    imageUrl: l.photos[0]?.url ?? null,
    producer: l.producer,
  }));

  /** Адрес на каталога с променени филтри; останалите се запазват. */
  function href(change: Partial<Params>) {
    const next: Params = { ...sp, ...change };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
    const s = qs.toString();
    return `/katalog${s ? `?${s}` : ""}`;
  }

  const active: { label: string; remove: string }[] = [];
  if (sp.q?.trim()) active.push({ label: `„${sp.q.trim()}“`, remove: href({ q: undefined }) });
  if (sp.category) active.push({ label: sp.category, remove: href({ category: undefined }) });
  if (sp.region) active.push({ label: sp.region, remove: href({ region: undefined }) });
  if (sp.offers === "1") active.push({ label: "Само оферти", remove: href({ offers: undefined }) });

  const sortLabel = SORTS.find((s) => s.value === (sp.sort ?? ""))?.label;

  const filters = (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Категории
        </h2>
        <ul className="mt-3 flex flex-col gap-1">
          <CategoryLink
            href={href({ category: undefined })}
            label="Всички продукти"
            count={totalAll}
            active={!sp.category}
            icon="basket"
          />
          {CATEGORIES.filter((c) => c !== "Друго" || countFor.get(c)).map((c) => (
            <CategoryLink
              key={c}
              href={href({ category: c })}
              label={c}
              count={countFor.get(c) ?? 0}
              active={sp.category === c}
              icon={categoryIcon(c)}
            />
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Област
        </h2>
        <div className="mt-3">
          <Suspense>
            <RegionSelect />
          </Suspense>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Предложения
        </h2>
        <Link
          href={href({ offers: sp.offers === "1" ? undefined : "1" })}
          className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
        >
          Само оферти
          <span
            aria-hidden
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              sp.offers === "1" ? "bg-accent" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                sp.offers === "1" ? "left-[1.125rem]" : "left-0.5",
              )}
            />
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <main>
      <PageHero
        eyebrow="Каталог"
        title="Прясна продукция от нивата"
        description="Разгледайте предложенията на производителите и поръчайте директно от тях."
        breadcrumbs={[{ label: "Каталог" }]}
      />

      <div className="container-page pb-16 pt-2 sm:pt-4">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Филтри — колона на десктоп */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-xs">
              {filters}
            </div>
          </aside>

          <div className="min-w-0">
            {/* Лента: търсене + подреждане */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Suspense>
                <CatalogSearch />
              </Suspense>
              <div className="flex gap-2">
                {/* Филтри — прибрани на телефон */}
                <details className="group relative flex-1 lg:hidden">
                  <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <Icon name="leaf" size={16} className="text-primary" />
                    Филтри
                    {active.length > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                        {active.length}
                      </span>
                    ) : null}
                  </summary>
                  <div className="absolute left-0 right-0 z-30 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-lg">
                    {filters}
                  </div>
                </details>
                <Suspense>
                  <SortSelect />
                </Suspense>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <p className="mr-1 text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">{cards.length}</strong>{" "}
                {cards.length === 1 ? "продукт" : "продукта"}
                {sortLabel && sp.sort ? ` · ${sortLabel}` : ""}
              </p>
              {active.map((a) => (
                <Link
                  key={a.label}
                  href={a.remove}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  title="Премахни филтъра"
                >
                  {a.label}
                  <span aria-hidden>×</span>
                </Link>
              ))}
              {active.length > 1 ? (
                <Link href="/katalog" className="text-xs font-semibold text-muted-foreground hover:text-primary">
                  Изчисти всички
                </Link>
              ) : null}
            </div>

            {cards.length > 0 ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface/60 px-6 py-16 text-center">
                <Icon name="search" size={34} strokeWidth={1.4} className="text-primary/50" />
                <p className="text-lg font-semibold">Няма намерени продукти</p>
                <p className="max-w-md text-muted-foreground">
                  Опитайте с друга дума за търсене или премахнете някой от филтрите.
                </p>
                {active.length > 0 ? (
                  <Link
                    href="/katalog"
                    className="mt-2 inline-flex h-10 items-center rounded-full border border-border-strong bg-surface px-5 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    Покажи всички продукти
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function CategoryLink({
  href,
  label,
  count,
  active,
  icon,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  icon: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-primary font-semibold text-primary-foreground"
            : "text-foreground/85 hover:bg-primary-soft hover:text-primary",
          !active && count === 0 && "opacity-55",
        )}
      >
        <Icon name={icon} size={17} className={active ? "text-[#f0c977]" : "text-primary"} />
        <span className="flex-1 truncate">{label}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            active ? "bg-white/15" : "bg-surface-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}
