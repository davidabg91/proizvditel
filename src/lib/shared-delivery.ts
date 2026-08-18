import { prisma } from "@/lib/prisma";

export type GroupListing = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  price: number;
  unit: string;
  currency: string;
};

export type GroupProducer = {
  slug: string;
  farmName: string;
  region: string | null;
  logoUrl: string | null;
  crops: string[];
  listings: GroupListing[];
  matching: GroupListing[];
};

export type DeliveryGroup = {
  town: string;
  region: string | null;
  producers: GroupProducer[];
};

function matchQuery(p: GroupProducer, q: string): boolean {
  const ql = q.toLowerCase();
  if (p.matching.length > 0) return true;
  return p.crops.some((c) => c.toLowerCase().includes(ql));
}

/**
 * Връща групите за съвместна доставка — производители с включена
 * съвместна доставка, групирани по град (само градове с 2+ производителя).
 * Ако е подадено q, оставя само групите с намерено съвпадение.
 */
export async function getDeliveryGroups(q?: string): Promise<DeliveryGroup[]> {
  const producers = await prisma.producer.findMany({
    where: { published: true, sharedDelivery: true, town: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      farmName: true,
      town: true,
      region: true,
      logoUrl: true,
      crops: { select: { name: true } },
      listings: {
        where: { available: true, soldOut: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          price: true,
          unit: true,
          currency: true,
        },
      },
    },
  });

  const ql = q?.trim().toLowerCase() ?? "";

  const groups = new Map<string, DeliveryGroup>();
  for (const p of producers) {
    const town = (p.town ?? "").trim();
    if (!town) continue;
    const listings = p.listings;
    const matching = ql
      ? listings.filter(
          (l) =>
            l.title.toLowerCase().includes(ql) ||
            (l.category?.toLowerCase().includes(ql) ?? false),
        )
      : [];

    const gp: GroupProducer = {
      slug: p.slug,
      farmName: p.farmName,
      region: p.region,
      logoUrl: p.logoUrl,
      crops: p.crops.map((c) => c.name),
      listings,
      matching,
    };

    if (!groups.has(town)) {
      groups.set(town, { town, region: p.region, producers: [] });
    }
    groups.get(town)!.producers.push(gp);
  }

  let result = [...groups.values()].filter((g) => g.producers.length >= 2);

  if (ql) {
    result = result.filter((g) => g.producers.some((p) => matchQuery(p, ql)));
  }

  // Подреждаме по брой производители в групата (най-големите първи)
  result.sort((a, b) => b.producers.length - a.producers.length);
  return result;
}

/** Връща една група за конкретен град. */
export async function getTownGroup(town: string): Promise<DeliveryGroup | null> {
  const producers = await prisma.producer.findMany({
    where: {
      published: true,
      sharedDelivery: true,
      town: { equals: town },
    },
    orderBy: { farmName: "asc" },
    select: {
      slug: true,
      farmName: true,
      town: true,
      region: true,
      logoUrl: true,
      crops: { select: { name: true } },
      listings: {
        where: { available: true, soldOut: false },
        orderBy: { createdAt: "desc" },
        include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
      },
    },
  });

  if (producers.length === 0) return null;

  return {
    town,
    region: producers[0].region,
    producers: producers.map((p) => ({
      slug: p.slug,
      farmName: p.farmName,
      region: p.region,
      logoUrl: p.logoUrl,
      crops: p.crops.map((c) => c.name),
      listings: p.listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        category: l.category,
        price: l.price,
        unit: l.unit,
        currency: l.currency,
      })),
      matching: [],
    })),
  };
}

/** Близки производители за комбиниране (същия град, съвместна доставка). */
export async function getNearbySharedProducers(
  producerId: string,
  town: string | null,
) {
  if (!town) return [];
  return prisma.producer.findMany({
    where: {
      published: true,
      sharedDelivery: true,
      town: { equals: town },
      id: { not: producerId },
    },
    take: 8,
    select: { slug: true, farmName: true, logoUrl: true, town: true },
  });
}
