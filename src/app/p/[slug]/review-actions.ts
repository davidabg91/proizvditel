"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema, type ReviewInput } from "@/lib/validators";
import { recomputeRating } from "@/lib/reviews";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitReview(
  producerSlug: string,
  input: ReviewInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const producer = await prisma.producer.findUnique({
    where: { slug: producerSlug },
    select: { id: true, userId: true },
  });
  if (!producer) return { ok: false, error: "Производителят не е намерен." };
  if (producer.userId === session.user.id)
    return { ok: false, error: "Не можете да оцените собствения си профил." };

  // Само потвърдени купувачи
  const purchase = await prisma.purchase.findUnique({
    where: {
      producerId_customerId: {
        producerId: producer.id,
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

  await prisma.review.upsert({
    where: {
      producerId_authorId: { producerId: producer.id, authorId: session.user.id },
    },
    create: {
      producerId: producer.id,
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

  await recomputeRating(producer.id);
  revalidatePath(`/p/${producerSlug}`);
  return { ok: true };
}

export async function deleteReview(producerSlug: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const producer = await prisma.producer.findUnique({
    where: { slug: producerSlug },
    select: { id: true },
  });
  if (!producer) return { ok: false, error: "Производителят не е намерен." };

  await prisma.review.deleteMany({
    where: { producerId: producer.id, authorId: session.user.id },
  });

  await recomputeRating(producer.id);
  revalidatePath(`/p/${producerSlug}`);
  return { ok: true };
}
