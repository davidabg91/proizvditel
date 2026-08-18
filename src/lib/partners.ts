import { prisma } from "@/lib/prisma";

/** Връща ID-тата на взаимните партньори (A→B и B→A). */
export async function getMutualPartnerIds(producerId: string): Promise<string[]> {
  const [mine, theirs] = await Promise.all([
    prisma.producerPartner.findMany({
      where: { producerId },
      select: { partnerId: true },
    }),
    prisma.producerPartner.findMany({
      where: { partnerId: producerId },
      select: { producerId: true },
    }),
  ]);
  const mineSet = new Set(mine.map((m) => m.partnerId));
  return [...new Set(theirs.map((t) => t.producerId))].filter((id) =>
    mineSet.has(id),
  );
}

/** Взаимни партньори (производители) с малко продукти за предложения. */
export async function getMutualPartners(producerId: string) {
  const ids = await getMutualPartnerIds(producerId);
  if (ids.length === 0) return [];
  return prisma.producer.findMany({
    where: { id: { in: ids }, published: true },
    select: {
      id: true,
      slug: true,
      farmName: true,
      town: true,
      region: true,
      logoUrl: true,
      listings: {
        where: { available: true, soldOut: false },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
      },
    },
  });
}

/** Брой входящи заявки: производители, които са ме избрали, но аз още не съм тях. */
export async function getIncomingPartnerRequestCount(
  producerId: string,
): Promise<number> {
  const [incoming, mine] = await Promise.all([
    prisma.producerPartner.findMany({
      where: { partnerId: producerId },
      select: { producerId: true },
    }),
    prisma.producerPartner.findMany({
      where: { producerId },
      select: { partnerId: true },
    }),
  ]);
  const mineSet = new Set(mine.map((m) => m.partnerId));
  return incoming.filter((i) => !mineSet.has(i.producerId)).length;
}

export type PartnerCandidate = {
  id: string;
  slug: string;
  farmName: string;
  town: string | null;
  logoUrl: string | null;
  selectedByMe: boolean;
  selectsMe: boolean;
  mutual: boolean;
};

/**
 * Табло за партньори: другите производители със съвместна доставка от
 * същия регион, с текущото състояние на връзката.
 */
export async function getPartnerBoard(
  producerId: string,
  region: string | null,
): Promise<PartnerCandidate[]> {
  const candidates = await prisma.producer.findMany({
    where: {
      id: { not: producerId },
      published: true,
      sharedDelivery: true,
      ...(region ? { region } : {}),
    },
    orderBy: { farmName: "asc" },
    select: { id: true, slug: true, farmName: true, town: true, logoUrl: true },
  });

  const ids = candidates.map((c) => c.id);
  const [mine, theirs] = await Promise.all([
    prisma.producerPartner.findMany({
      where: { producerId, partnerId: { in: ids } },
      select: { partnerId: true },
    }),
    prisma.producerPartner.findMany({
      where: { partnerId: producerId, producerId: { in: ids } },
      select: { producerId: true },
    }),
  ]);
  const mineSet = new Set(mine.map((m) => m.partnerId));
  const theirsSet = new Set(theirs.map((t) => t.producerId));

  return candidates.map((c) => {
    const selectedByMe = mineSet.has(c.id);
    const selectsMe = theirsSet.has(c.id);
    return {
      ...c,
      selectedByMe,
      selectsMe,
      mutual: selectedByMe && selectsMe,
    };
  });
}
