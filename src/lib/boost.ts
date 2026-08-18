import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Подсилване на обява (платено промотиране) — сървърна логика.
 * Таксата се плаща на платформата и вдига обявата пред всички останали
 * в „Актуални предложения" на началната страница и в каталога.
 * Плановете и цените са в `@/lib/boost-plans` (ползват се и от клиента).
 */

export * from "@/lib/boost-plans";

/**
 * Активира платено подсилване по идентификатор на Stripe сесия.
 * Идемпотентно — повторните извиквания (webhook + връщане на потребителя)
 * не удължават периода втори път.
 */
export async function activateBoost(
  stripeSessionId: string,
  paymentIntentId?: string | null,
): Promise<{ ok: boolean; alreadyActive?: boolean }> {
  const boost = await prisma.listingBoost.findUnique({
    where: { stripeSessionId },
  });
  if (!boost) return { ok: false };
  if (boost.status === "paid") return { ok: true, alreadyActive: true };

  const listing = await prisma.productListing.findUnique({
    where: { id: boost.listingId },
    select: { id: true, boostedUntil: true, producer: { select: { slug: true } } },
  });
  if (!listing) return { ok: false };

  // Ако обявата вече е подсилена, новият период се добавя в края на текущия.
  const now = new Date();
  const startsAt =
    listing.boostedUntil && listing.boostedUntil.getTime() > now.getTime()
      ? listing.boostedUntil
      : now;
  const endsAt = new Date(startsAt.getTime() + boost.days * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.listingBoost.update({
      where: { id: boost.id },
      data: {
        status: "paid",
        paidAt: now,
        startsAt,
        endsAt,
        paymentIntentId: paymentIntentId ?? boost.paymentIntentId,
      },
    }),
    prisma.productListing.update({
      where: { id: listing.id },
      data: { boostedAt: now, boostedUntil: endsAt },
    }),
  ]);

  return { ok: true };
}

/** Общи данни, нужни за карта на обява в списък. */
const listingCardInclude = {
  photos: { orderBy: { sort: "asc" }, take: 1 },
  producer: { select: { slug: true, farmName: true, town: true, region: true } },
} satisfies Prisma.ProductListingInclude;

export type ListingWithCardData = Prisma.ProductListingGetPayload<{
  include: typeof listingCardInclude;
}>;

/**
 * Връща обяви, при които платените (подсилени) излизат първи, а след тях —
 * най-новите. Двете групи се вадят с отделни заявки, за да не изплуват обяви
 * с изтекло подсилване над новите.
 */
export async function findListingsBoostedFirst(
  where: Prisma.ProductListingWhereInput,
  take: number,
  restOrderBy: Prisma.ProductListingOrderByWithRelationInput[] = [{ createdAt: "desc" }],
): Promise<ListingWithCardData[]> {
  const now = new Date();

  // AND (а не разпръскване), за да не се засича с евентуално OR от търсенето.
  const boosted = await prisma.productListing.findMany({
    where: { AND: [where, { boostedUntil: { gt: now } }] },
    orderBy: [{ soldOut: "asc" }, { boostedAt: "desc" }, { createdAt: "desc" }],
    take,
    include: listingCardInclude,
  });

  if (boosted.length >= take) return boosted;

  const rest = await prisma.productListing.findMany({
    where: {
      AND: [where, { OR: [{ boostedUntil: null }, { boostedUntil: { lte: now } }] }],
    },
    orderBy: restOrderBy,
    take: take - boosted.length,
    include: listingCardInclude,
  });

  return [...boosted, ...rest];
}
