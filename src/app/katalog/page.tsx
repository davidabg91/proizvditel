import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/product/listing-card";
import { CatalogFilters } from "./catalog-filters";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Разгледайте прясна продукция директно от българските земеделски производители.",
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

  const listings = await prisma.productListing.findMany({
    where,
    orderBy: [{ isOffer: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      photos: { orderBy: { sort: "asc" }, take: 1 },
      producer: {
        select: { slug: true, farmName: true, town: true, region: true },
      },
    },
  });

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
    category: l.category,
    imageUrl: l.photos[0]?.url ?? null,
    producer: l.producer,
  }));

  return (
    <main className="container-page py-12">
      <div className="mb-8">
        <p className="eyebrow">Каталог</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Прясна продукция от нивата</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Разгледайте предложенията на производителите и поръчайте директно от тях.
        </p>
      </div>

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
    </main>
  );
}
