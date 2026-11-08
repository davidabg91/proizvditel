import type { Metadata } from "next";
import { Suspense } from "react";
import { findListingsBoostedFirst } from "@/lib/boost";
import { ListingCard } from "@/components/product/listing-card";
import { CatalogFilters } from "./catalog-filters";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { CATEGORY_LANDINGS } from "@/lib/seo-landing";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Каталог с прясна продукция от български производители",
  description:
    "Плодове, зеленчуци, мед, млечни и месни продукти директно от българските земеделски стопанства. Поръчайте без посредник, с доставка до вас.",
  // Филтрите (?category=, ?region=, ?q=) създават стотици адреси с почти
  // еднакво съдържание — сочим ги към чистия каталог, за да не се
  // конкурират помежду си в резултатите.
  alternates: { canonical: "/katalog" },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    region?: string;
    offers?: string;
  }>;
}) {
  const sp = await searchParams;

  const where: Prisma.ProductListingWhereInput = {
    available: true,
    producer: { published: true },
  };

  if (sp.category) where.category = sp.category;
  if (sp.offers === "1") where.isOffer = true;
  if (sp.region) {
    where.producer = { published: true, region: sp.region };
  }
  if (sp.q?.trim()) {
    const query = sp.q.trim();
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
      { producer: { farmName: { contains: query, mode: "insensitive" } } },
      { producer: { crops: { some: { name: { contains: query, mode: "insensitive" } } } } },
    ];
  }

  // Платените (подсилени) обяви излизат пред всички останали.
  const listings = await findListingsBoostedFirst(where, 60, [
    { soldOut: "asc" },
    { isOffer: "desc" },
    { createdAt: "desc" },
  ]);

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

  return (
    <main>
      <PageHero
        eyebrow="Каталог"
        title="Прясна продукция от нивата"
        description="Разгледайте предложенията на производителите и поръчайте директно от тях."
        breadcrumbs={[{ label: "Каталог" }]}
      />
      <div className="container-page pb-16 pt-2 sm:pt-4">

      <ul className="mb-6 flex flex-wrap gap-2 text-sm">
        {CATEGORY_LANDINGS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/katalog/${c.slug}`}
              className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary hover:text-primary"
            >
              {c.category}
            </Link>
          </li>
        ))}
      </ul>

      <Suspense>
        <CatalogFilters />
      </Suspense>

      <p className="mt-6 text-sm text-muted-foreground">
        {cards.length} {cards.length === 1 ? "резултат" : "резултата"}
      </p>

      {cards.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">Няма намерени продукти</p>
          <p className="mt-1 text-muted-foreground">
            Опитайте с друга дума за търсене или премахнете филтрите.
          </p>
        </div>
      )}
      </div>
    </main>
  );
}
