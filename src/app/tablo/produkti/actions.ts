"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listingSchema, type ListingInput } from "@/lib/validators";
import { uniqueListingSlug } from "@/lib/slug";

export type ActionResult =
  | { ok: true; slug?: string }
  | { ok: false; error: string };

async function currentProducer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
}

function baseData(d: ListingInput) {
  return {
    title: d.title.trim(),
    description: d.description || null,
    category: d.category || null,
    price: d.price,
    oldPrice: d.oldPrice ?? null,
    unit: d.unit,
    currency: d.currency,
    available: d.available,
    isOffer: d.isOffer,
    stockNote: d.stockNote || null,
  };
}

export async function createListing(input: ListingInput): Promise<ActionResult> {
  try {
    const producer = await currentProducer();
    if (!producer) return { ok: false, error: "Изисква се вход." };

    const parsed = listingSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
    const d = parsed.data;

    const slug = await uniqueListingSlug(producer.id, d.title);

    await prisma.productListing.create({
      data: {
        producerId: producer.id,
        slug,
        ...baseData(d),
        photos: {
          create: d.photos.map((url, i) => ({ url, sort: i })),
        },
      },
    });

    try {
      revalidatePath("/tablo/produkti");
      revalidatePath("/katalog");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch (revalErr) {
      console.error("revalidatePath error:", revalErr);
    }

    return { ok: true, slug };
  } catch (error) {
    console.error("createListing error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Грешка при създаване на обявата.",
    };
  }
}

export async function updateListing(
  id: string,
  input: ListingInput,
): Promise<ActionResult> {
  try {
    const producer = await currentProducer();
    if (!producer) return { ok: false, error: "Изисква се вход." };

    const parsed = listingSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
    const d = parsed.data;

    const listing = await prisma.productListing.findUnique({
      where: { id },
      select: { producerId: true },
    });
    if (!listing || listing.producerId !== producer.id)
      return { ok: false, error: "Няма достъп." };

    await prisma.$transaction([
      prisma.listingPhoto.deleteMany({ where: { listingId: id } }),
      prisma.productListing.update({
        where: { id },
        data: {
          ...baseData(d),
          photos: { create: d.photos.map((url, i) => ({ url, sort: i })) },
        },
      }),
    ]);

    try {
      revalidatePath("/tablo/produkti");
      revalidatePath("/katalog");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch (revalErr) {
      console.error("revalidatePath error:", revalErr);
    }

    return { ok: true };
  } catch (error) {
    console.error("updateListing error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Грешка при редакция на обявата.",
    };
  }
}

export async function deleteListing(id: string): Promise<ActionResult> {
  try {
    const producer = await currentProducer();
    if (!producer) return { ok: false, error: "Изисква се вход." };

    const listing = await prisma.productListing.findUnique({
      where: { id },
      select: { producerId: true },
    });
    if (!listing || listing.producerId !== producer.id)
      return { ok: false, error: "Няма достъп." };

    await prisma.productListing.delete({ where: { id } });

    try {
      revalidatePath("/tablo/produkti");
      revalidatePath("/katalog");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch (revalErr) {
      console.error("revalidatePath error:", revalErr);
    }

    return { ok: true };
  } catch (error) {
    console.error("deleteListing error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Грешка при изтриване на обявата.",
    };
  }
}
