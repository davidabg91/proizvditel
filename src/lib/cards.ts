import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ListingWithCardData } from "@/lib/boost";
import type { ListingCardData } from "@/components/product/listing-card";
import type { ProducerCardData } from "@/components/product/producer-card";

/** Обява от базата → данни за ListingCard. */
export function toListingCard(l: ListingWithCardData): ListingCardData {
  return {
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
  };
}

const producerCardInclude = {
  crops: { select: { name: true }, take: 4 },
  _count: { select: { listings: { where: { available: true, soldOut: false } } } },
} satisfies Prisma.ProducerInclude;

/** Публикуваните стопанства по условие, готови за ProducerCard. */
export async function findProducerCards(
  where: Prisma.ProducerWhereInput,
  take = 60,
): Promise<ProducerCardData[]> {
  const producers = await prisma.producer.findMany({
    where: { AND: [{ published: true }, where] },
    orderBy: { createdAt: "desc" },
    take,
    include: producerCardInclude,
  });

  return producers.map((p) => ({
    slug: p.slug,
    farmName: p.farmName,
    ownerName: p.ownerName,
    description: p.description,
    town: p.town,
    region: p.region,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
    coverPosition: p.coverPosition,
    coverPositionX: p.coverPositionX,
    coverScale: p.coverScale,
    urnVerified: p.urnVerified,
    startedYear: p.startedYear,
    totalDecares: p.totalDecares,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    sharedDelivery: p.sharedDelivery,
    listingsCount: p._count.listings,
    topCrops: p.crops.map((c) => c.name),
  }));
}
