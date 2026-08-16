import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProducerCard } from "@/components/product/producer-card";
import { ProducerFilters } from "./producer-filters";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Производители",
  description: "Всички земеделски производители в платформата Производител.",
};

export default async function ProducersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string; shared?: string }>;
}) {
  const sp = await searchParams;

  const where: Prisma.ProducerWhereInput = { published: true };
  if (sp.region) where.region = sp.region;
  if (sp.shared === "1") where.sharedDelivery = true;
  if (sp.q?.trim()) {
    const query = sp.q.trim();
    where.OR = [
      { farmName: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { crops: { some: { name: { contains: query, mode: "insensitive" } } } },
    ];
  }

  const producers = await prisma.producer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      crops: { select: { name: true }, take: 3 },
      _count: { select: { listings: { where: { available: true } } } },
    },
  });

  const cards = producers.map((p) => ({
    slug: p.slug,
    farmName: p.farmName,
    ownerName: p.ownerName,
    town: p.town,
    region: p.region,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    sharedDelivery: p.sharedDelivery,
    listingsCount: p._count.listings,
    topCrops: p.crops.map((c) => c.name),
  }));

  return (
    <main className="container-page py-12">
      <div className="mb-8">
        <p className="eyebrow">Производители</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Българските стопанства</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Опознайте хората зад храната. Разгледайте профилите, продукцията и
          оценките от клиенти.
        </p>
      </div>

      <Suspense>
        <ProducerFilters />
      </Suspense>

      <p className="mt-6 text-sm text-muted-foreground">
        {cards.length} {cards.length === 1 ? "производител" : "производители"}
      </p>

      {cards.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((p) => (
            <ProducerCard key={p.slug} producer={p} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">Няма намерени производители</p>
          <p className="mt-1 text-muted-foreground">Опитайте с други филтри.</p>
        </div>
      )}
    </main>
  );
}
