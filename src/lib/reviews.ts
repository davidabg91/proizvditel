import { prisma } from "@/lib/prisma";

/** Преизчислява средната оценка и броя оценки за производител. */
export async function recomputeRating(producerId: string) {
  const agg = await prisma.review.aggregate({
    where: { producerId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.producer.update({
    where: { id: producerId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count,
    },
  });
}
