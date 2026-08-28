"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema, type ReviewInput } from "@/lib/validators";
import { recomputeListingRating } from "@/lib/reviews";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Намира обявата по двойката адреси и връща и собственика ѝ. */
async function findListing(producerSlug: string, listingSlug: string) {
  return prisma.productListing.findFirst({
    where: { slug: listingSlug, producer: { slug: producerSlug } },
    select: {
      id: true,
      producerId: true,
      producer: { select: { userId: true } },
    },
  });
}

export async function submitListingReview(
  producerSlug: string,
  listingSlug: string,
  input: ReviewInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const listing = await findListing(producerSlug, listingSlug);
  if (!listing) return { ok: false, error: "Обявата не е намерена." };
  if (listing.producer.userId === session.user.id)
    return { ok: false, error: "Не можете да оцените собствената си обява." };

  // Правото да се оцени идва от потвърдена покупка при стопанството —
  // същият праг като при оценките на профила.
  const purchase = await prisma.purchase.findUnique({
    where: {
      producerId_customerId: {
        producerId: listing.producerId,
        customerId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!purchase)
    return {
      ok: false,
      error: "Само клиенти с потвърдена покупка могат да оставят оценка.",
    };

  await prisma.listingReview.upsert({
    where: {
      listingId_authorId: { listingId: listing.id, authorId: session.user.id },
    },
    create: {
      listingId: listing.id,
      authorId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      verified: true,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  await recomputeListingRating(listing.id);
  revalidatePath(`/p/${producerSlug}/oferta/${listingSlug}`);
  return { ok: true };
}

export async function deleteListingReview(
  producerSlug: string,
  listingSlug: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const listing = await findListing(producerSlug, listingSlug);
  if (!listing) return { ok: false, error: "Обявата не е намерена." };

  await prisma.listingReview.deleteMany({
    where: { listingId: listing.id, authorId: session.user.id },
  });

  await recomputeListingRating(listing.id);
  revalidatePath(`/p/${producerSlug}/oferta/${listingSlug}`);
  return { ok: true };
}
