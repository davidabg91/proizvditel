"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, type ProfileInput } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Невалидни данни.",
      };
    }
    const d = parsed.data;

    const producer = await prisma.producer.findUnique({
      where: { userId: session.user.id },
      select: { id: true, slug: true },
    });
    if (!producer) return { ok: false, error: "Профилът не е намерен." };

    await prisma.producer.update({
      where: { id: producer.id },
      data: {
        farmName: d.farmName,
        ownerName: d.ownerName,
        description: d.description || null,
        urn: d.urn || null,
        region: d.region || null,
        town: d.town || null,
        phone: d.phone || null,
        contactEmail: d.contactEmail || null,
        website: d.website || null,
        startedYear: d.startedYear ?? null,
        totalDecares: d.totalDecares ?? null,
        sharedDelivery: d.sharedDelivery,
        deliveryProviders: d.deliveryProviders.length
          ? d.deliveryProviders.join(",")
          : null,
        logoUrl: d.logoUrl || null,
        coverUrl: d.coverUrl || null,
        coverPosition: d.coverPosition ?? undefined,
        coverPositionX: d.coverPositionX ?? undefined,
        coverScale: d.coverScale ?? undefined,
      },
    });

    try {
      revalidatePath("/tablo/profil");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch (revalError) {
      console.error("revalidatePath error:", revalError);
    }

    return { ok: true };
  } catch (error) {
    console.error("updateProfile error:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Възникна сървърна грешка при запазване на профила.",
    };
  }
}

export async function updateCoverPosition(
  positionY: number,
  positionX = 50,
  scale = 100,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

    const posY = Math.max(0, Math.min(100, Math.round(positionY)));
    const posX = Math.max(0, Math.min(100, Math.round(positionX)));
    const sc = Math.max(100, Math.min(300, Math.round(scale)));

    const producer = await prisma.producer.findUnique({
      where: { userId: session.user.id },
      select: { id: true, slug: true },
    });
    if (!producer) return { ok: false, error: "Профилът не е намерен." };

    await prisma.producer.update({
      where: { id: producer.id },
      data: {
        coverPosition: posY,
        coverPositionX: posX,
        coverScale: sc,
      },
    });

    try {
      revalidatePath("/tablo/profil");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch {}

    return { ok: true };
  } catch (error) {
    console.error("updateCoverPosition error:", error);
    return {
      ok: false,
      error: "Грешка при запазване на позицията на корицата.",
    };
  }
}
