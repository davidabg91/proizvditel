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
