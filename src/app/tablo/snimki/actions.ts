"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentProducer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
}

const TYPES = new Set(["field", "product", "gallery"]);

export async function addPhoto(
  url: string,
  type: string,
  caption?: string,
): Promise<ActionResult> {
  try {
    const producer = await currentProducer();
    if (!producer) return { ok: false, error: "Изисква се вход." };
    if (!url || !TYPES.has(type)) return { ok: false, error: "Невалидни данни." };

    const count = await prisma.photo.count({ where: { producerId: producer.id } });
    if (count >= 60) return { ok: false, error: "Достигнат е лимитът от снимки." };

    await prisma.photo.create({
      data: {
        producerId: producer.id,
        url,
        type,
        caption: caption?.trim() || null,
        sort: count,
      },
    });

    try {
      revalidatePath("/tablo/snimki");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch (revalErr) {
      console.error("revalidatePath error:", revalErr);
    }

    return { ok: true };
  } catch (error) {
    console.error("addPhoto error:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при добавяне на снимката.",
    };
  }
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  try {
    const producer = await currentProducer();
    if (!producer) return { ok: false, error: "Изисква се вход." };

    const photo = await prisma.photo.findUnique({
      where: { id },
      select: { producerId: true },
    });
    if (!photo || photo.producerId !== producer.id)
      return { ok: false, error: "Няма достъп." };

    await prisma.photo.delete({ where: { id } });

    try {
      revalidatePath("/tablo/snimki");
      if (producer.slug) {
        revalidatePath(`/p/${producer.slug}`);
      }
    } catch (revalErr) {
      console.error("revalidatePath error:", revalErr);
    }

    return { ok: true };
  } catch (error) {
    console.error("deletePhoto error:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на снимката.",
    };
  }
}
