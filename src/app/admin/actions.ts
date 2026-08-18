"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setUserBanned(
  userId: string,
  banned: boolean,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };
  if (userId === admin.id) return { ok: false, error: "Не можете да банете себе си." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, producer: { select: { id: true } } },
  });
  if (!user) return { ok: false, error: "Потребителят не е намерен." };

  await prisma.user.update({ where: { id: userId }, data: { banned } });
  // Скриваме/показваме профила на производителя
  if (user.producer) {
    await prisma.producer.update({
      where: { id: user.producer.id },
      data: { published: !banned },
    });
  }

  revalidatePath("/admin/potrebiteli");
  return { ok: true };
}

export async function resolveReport(
  reportId: string,
  resolved: boolean,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: resolved ? "resolved" : "open",
      resolvedAt: resolved ? new Date() : null,
    },
  });

  revalidatePath("/admin/dokladi");
  revalidatePath("/admin");
  return { ok: true };
}

export async function verifyProducerUrn(
  producerId: string,
  verified: boolean,
  note?: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
    select: { id: true, slug: true },
  });
  if (!producer) return { ok: false, error: "Производителят не е намерен." };

  await prisma.producer.update({
    where: { id: producerId },
    data: {
      urnVerified: verified,
      urnVerifiedAt: verified ? new Date() : null,
      urnVerificationNote: note ?? null,
    },
  });

  revalidatePath("/admin/potrebiteli");
  revalidatePath("/admin");
  if (producer.slug) {
    revalidatePath(`/p/${producer.slug}`);
  }
  return { ok: true };
}

/**
 * Публикува началния набор статии в блога.
 * Пуска се от админ панела, защото само сървърът има достъп до базата.
 */
export type SeedActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function publishSeedBlogPosts(): Promise<SeedActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };

  try {
    const { seedBlogPosts } = await import("@/lib/blog-seed");
    const { created, updated } = await seedBlogPosts(admin.id);

    revalidatePath("/blog");
    revalidatePath("/admin");
    revalidatePath("/sitemap.xml");

    return {
      ok: true,
      message:
        created > 0 || updated > 0
          ? `Готово: ${created} нови, ${updated} обновени статии.`
          : "Няма промени.",
    };
  } catch (error) {
    console.error("publishSeedBlogPosts error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Грешка при публикуване.",
    };
  }
}
